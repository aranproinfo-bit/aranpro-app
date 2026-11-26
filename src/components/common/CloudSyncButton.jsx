import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Cloud, RefreshCw, ShieldCheck } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useCommunity } from '../../context/CommunityContext';
import { getStoredLiveRevision } from '../../services/onlineSyncService';

export function CloudSyncButton({ theme = 'dark', compact = false, dialogRef, hiddenIndicator = false }) {
  const {
    cloudSyncStatus = 'online',
    cloudRevision = 0,
    triggerImmediateCloudSync
  } = useCommunity();

  const ownDialog = useRef(null);
  const dialog = dialogRef ?? ownDialog;
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('aranpro.info@gmail.com');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setUser(data?.session?.user || null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function run(action) {
    if (busy) return;
    setBusy(true);
    setNotice('');
    try {
      await action();
    } catch (e) {
      setNotice(e.message || 'No se pudo contactar con Supabase.');
    } finally {
      setBusy(false);
    }
  }

  async function connect() {
    const cleanEmail = email.trim();
    const { error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: { emailRedirectTo: window.location.origin }
    });
    if (error) throw error;
    setOtpSent(true);
    setNotice(`Enviamos un código de verificación a ${cleanEmail}.`);
  }

  async function verifyCode(e) {
    e.preventDefault();
    if (!otpCode.trim()) return;
    await run(async () => {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otpCode.trim(),
        type: 'email'
      });
      if (error) throw error;
      setOtpCode('');
      setOtpSent(false);
      setNotice('Cuenta verificada para firma oficial.');
    });
  }

  const isSyncing = cloudSyncStatus === 'syncing' || busy;
  const isOffline = cloudSyncStatus === 'offline' || cloudSyncStatus === 'error';
  const activeRevision = cloudRevision || getStoredLiveRevision() || 1;
  const isDark = theme === 'dark';

  return (
    <div className={hiddenIndicator ? 'hidden' : 'relative inline-flex items-center group'}>
      {!hiddenIndicator && (
        <>
          <button
            type="button"
            onClick={() => {
              if (triggerImmediateCloudSync) void triggerImmediateCloudSync();
            }}
            aria-label="Estado de conexión en la nube"
            className={`h-9 rounded-xl px-2.5 text-[11px] font-bold inline-flex items-center gap-2 transition-all cursor-default select-none ${
              isDark
                ? 'bg-emerald-950/80 text-emerald-100 border border-emerald-400/25 hover:border-emerald-400/45'
                : 'bg-emerald-50/90 text-[#0F3D2E] border border-emerald-200 hover:border-emerald-300'
            }`}
          >
            <span className="relative flex h-2 w-2 shrink-0">
              {!isOffline && (
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isSyncing ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                />
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isOffline ? 'bg-rose-500' : isSyncing ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
              />
            </span>
            {isSyncing ? (
              <RefreshCw className={`w-3.5 h-3.5 animate-spin ${isDark ? 'text-[#D4B895]' : 'text-[#0F3D2E]'}`} />
            ) : (
              <Cloud className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`} />
            )}
            {!compact && (
              <span className="whitespace-nowrap">
                {isOffline ? 'Sin Red' : isSyncing ? 'Sincronizando' : 'En Línea'}
              </span>
            )}
          </button>

          {/* Pestaña flotante informativa al pasar el cursor */}
          <div className="pointer-events-none opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-150 absolute right-0 top-full mt-2 w-60 rounded-xl bg-[#0A291F] text-white p-2.5 shadow-xl border border-[#D4B895]/50 z-50 text-left">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
                ● Nube ARANPRO Activa
              </span>
              <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-[#D4B895]">
                Rev #{activeRevision}
              </span>
            </div>
            <p className="text-[11px] text-white/85 leading-snug font-normal">
              Sincronización automática en tiempo real entre computadores y celulares de la comunidad.
            </p>
          </div>
        </>
      )}

      {/* Diálogo reservado únicamente cuando un módulo externo requiere invocar firma explícita */}
      {dialogRef &&
        createPortal(
          <dialog
            ref={dialog}
            aria-label="Autorización de Firma Digital"
            className="m-auto w-[min(26rem,calc(100%-2rem))] max-w-[94vw] bg-white border border-slate-200 text-slate-800 rounded-2xl shadow-xl p-5 space-y-4 text-sm backdrop:bg-slate-900/50"
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">
                  Registro Oficial Supabase
                </span>
                <h2 className="text-base font-bold text-emerald-950">Autorización de Firma QR</h2>
              </div>
              <button
                type="button"
                onClick={() => dialog.current?.close()}
                className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cerrar
              </button>
            </div>

            {user ? (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase text-emerald-700 block">Emisor Conectado</span>
                  <p className="font-bold text-slate-900 truncate text-xs">{user.email}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    run(connect);
                  }}
                  className="space-y-2.5"
                >
                  <label className="block text-xs font-bold text-slate-700">
                    Correo de firma autorizada
                    <input
                      type="email"
                      required
                      disabled={busy}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block mt-1 border border-slate-300 rounded-xl w-full p-2 text-sm font-normal"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={busy}
                    className="block w-full bg-[#0F3D2E] hover:bg-[#0A291F] text-white py-2 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    {busy ? 'Enviando…' : 'Enviar código de firma'}
                  </button>
                </form>

                {otpSent && (
                  <form onSubmit={verifyCode} className="pt-2 border-t border-slate-100 space-y-2">
                    <input
                      type="text"
                      placeholder="Código numérico recibido"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="block border border-slate-300 rounded-xl w-full p-2 text-sm font-mono text-center"
                    />
                    <button
                      type="submit"
                      disabled={busy || !otpCode.trim()}
                      className="w-full py-2 bg-amber-100 hover:bg-amber-200 text-[#0F3D2E] font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Confirmar Código
                    </button>
                  </form>
                )}
              </div>
            )}

            <p role="status" className="empty:hidden rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-700">
              {busy ? 'Conectando…' : notice}
            </p>
          </dialog>,
          document.body
        )}
    </div>
  );
}
