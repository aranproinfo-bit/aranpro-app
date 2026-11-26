import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Cloud, RefreshCw, ShieldCheck, Globe } from 'lucide-react';
import { certificateRegistry, supabase } from '../../services/supabase';
import { useCommunity } from '../../context/CommunityContext';
import { getStoredLiveRevision, setStoredLiveRevision } from '../../services/onlineSyncService';

export function CloudSyncButton({ theme = 'dark', compact = false, dialogRef }) {
  const {
    communities,
    companySettings,
    certificates,
    restoreCloudSnapshot,
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
  const [dedicatedDomains, setDedicatedDomains] = useState(() => {
    try { return localStorage.getItem('aranpro_dedicated_subdomains') === 'true'; } catch { return false; }
  });

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
    setNotice(`Enviamos un enlace y código de acceso a ${cleanEmail}. Puede abrir el enlace en este navegador o ingresar abajo el código numérico del correo.`);
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
      setNotice('Cuenta verificada y autorizada para firma de certificados y nube.');
    });
  }

  async function upload() {
    if (triggerImmediateCloudSync) {
      const ok = await triggerImmediateCloudSync();
      if (ok) {
        setNotice(`Sincronización en línea completada (Versión ${getStoredLiveRevision()}).`);
        return;
      }
    }
    const result = await certificateRegistry.saveBackup(0, { communities, companySettings, certificates });
    setStoredLiveRevision(result.revision);
    setNotice('Respaldo confirmado en la nube. Versión ' + result.revision + '.');
  }

  async function restore() {
    const result = await certificateRegistry.loadBackup();
    if (!result) throw new Error('Esta cuenta aún no tiene un respaldo.');
    const snapshot = result.snapshot;
    if (
      !Array.isArray(snapshot?.communities) ||
      !Array.isArray(snapshot.certificates) ||
      !snapshot.companySettings ||
      typeof snapshot.companySettings !== 'object' ||
      Array.isArray(snapshot.companySettings)
    ) {
      throw new Error('El respaldo está incompleto.');
    }
    if (
      !window.confirm(
        '¿Restaurar la versión ' +
          result.revision +
          ', con ' +
          snapshot.communities.length +
          ' comunidades y ' +
          snapshot.certificates.length +
          ' certificados? Reemplazará los datos locales.'
      )
    ) {
      return;
    }
    localStorage.setItem(
      'aranpro-before-restore-' + (user?.id || 'admin'),
      JSON.stringify({ communities, companySettings, certificates })
    );
    restoreCloudSnapshot(snapshot);
    setStoredLiveRevision(result.revision);
    setNotice('Respaldo restaurado en este equipo.');
  }

  const toggleSubdomains = (checked) => {
    setDedicatedDomains(checked);
    try {
      localStorage.setItem('aranpro_dedicated_subdomains', checked ? 'true' : 'false');
    } catch {
      // ignore
    }
  };

  const isSyncing = cloudSyncStatus === 'syncing' || busy;

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        aria-haspopup="dialog"
        className={
          'rounded-xl px-2.5 py-2 text-xs font-bold flex gap-2 items-center cursor-pointer transition-colors ' +
          (theme === 'dark'
            ? 'bg-emerald-950 hover:bg-emerald-900 text-white border border-white/15'
            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-200')
        }
        title="Estado de Sincronización en Línea y Firma Digital Supabase"
      >
        {isSyncing ? <RefreshCw size={15} className="animate-spin text-[#D4B895]" /> : <Cloud size={16} className="text-[#D4B895]" />}
        <span>{compact ? 'Nube' : `Nube En Línea${cloudRevision ? ` · v${cloudRevision}` : ''}`}</span>
        <span className={`w-2 h-2 rounded-full ${user ? 'bg-emerald-400' : 'bg-amber-400'}`} />
      </button>

      {createPortal(
        <dialog
          ref={dialog}
          aria-label="Nube ARANPRO"
          className="m-auto w-[min(28rem,calc(100%-2rem))] max-w-[94vw] max-h-[90dvh] overflow-y-auto bg-white border border-slate-200 text-slate-800 rounded-2xl shadow-xl p-5 space-y-4 text-sm backdrop:bg-slate-900/50"
        >
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">
                Supabase Cloud • Auto-Sync Activo
              </span>
              <h2 className="text-lg font-bold text-emerald-950">Nube y Firma ARANPRO</h2>
            </div>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold hover:bg-slate-50 cursor-pointer"
            >
              Cerrar
            </button>
          </div>

          <div className="rounded-xl bg-emerald-50/70 border border-emerald-200 p-3 text-xs space-y-1">
            <div className="font-bold text-emerald-950 flex items-center justify-between">
              <span>Sincronización Multi-Dispositivo Automática</span>
              <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-emerald-200">
                Rev #{cloudRevision || getStoredLiveRevision() || 1}
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Los gastos, avisos, pagos informados por residentes, multas y reclamos se sincronizan en línea automáticamente entre su computador y los celulares de la comunidad.
            </p>
          </div>

          {user ? (
            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase text-emerald-700 block">Emisor Oficial Conectado</span>
                  <p className="font-bold text-slate-900 truncate text-xs">{user.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  disabled={busy}
                  onClick={() => run(upload)}
                  className="px-3 py-2.5 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white text-xs font-bold cursor-pointer"
                >
                  Forzar Respaldo Ahora
                </button>
                <button
                  disabled={busy}
                  onClick={() => run(restore)}
                  className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer"
                >
                  Restaurar desde Nube
                </button>
              </div>

              <button
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    const { error } = await supabase.auth.signOut({ scope: 'local' });
                    if (error) throw error;
                  })
                }
                className="w-full text-center text-xs text-rose-600 hover:underline pt-1 cursor-pointer"
              >
                Desconectar sesión de firma ({user.email})
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  run(connect);
                }}
                className="space-y-3"
              >
                <label className="block text-xs font-bold text-slate-700">
                  Correo autorizado para Firma de Certificados Oficiales QR
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    disabled={busy}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block mt-1 border border-slate-300 rounded-xl w-full p-2.5 text-sm font-normal"
                  />
                </label>
                <button
                  type="submit"
                  disabled={busy}
                  className="block w-full bg-[#0F3D2E] hover:bg-[#0A291F] text-white py-2.5 rounded-xl text-xs font-bold disabled:opacity-60 cursor-pointer"
                >
                  {busy ? 'Enviando acceso…' : 'Enviar Enlace / Código a mi Correo'}
                </button>
              </form>

              {otpSent && (
                <form onSubmit={verifyCode} className="pt-2 border-t border-slate-100 space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    ¿Recibió código numérico en su correo? Ingréselo aquí:
                    <input
                      type="text"
                      placeholder="Código de 6 u 8 dígitos"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="block mt-1 border border-slate-300 rounded-xl w-full p-2 text-sm font-mono tracking-widest text-center"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={busy || !otpCode.trim()}
                    className="w-full py-2 bg-amber-100 hover:bg-amber-200 text-[#0F3D2E] font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Verificar Código Directamente
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Configuración estratégica de subdominios separados */}
          <div className="pt-3 border-t border-slate-200 space-y-2">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={dedicatedDomains}
                onChange={(e) => toggleSubdomains(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-[#0F3D2E]"
              />
              <span className="text-xs text-slate-700 leading-snug">
                <strong className="text-slate-900 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-[#0F3D2E]" />
                  Usar subdominios separados en colillas y QR nuevos
                </strong>
                Actívelo una vez agregados <code className="bg-slate-100 px-1 rounded">residentes.aranpro.cl</code> y <code className="bg-slate-100 px-1 rounded">admin.aranpro.cl</code> en Cloudflare Pages.
              </span>
            </label>
          </div>

          <p role="status" className="empty:hidden rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-700">
            {busy ? 'Conectando con Supabase…' : notice}
          </p>
        </dialog>,
        document.body
      )}
    </div>
  );
}
