import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Cloud } from 'lucide-react';
import { certificateRegistry, supabase } from '../../services/supabase';
import { useCommunity } from '../../context/CommunityContext';

export function CloudSyncButton({theme = 'dark', compact = false, dialogRef}) {
  const { communities, companySettings, certificates, restoreCloudSnapshot } = useCommunity();
  const ownDialog = useRef(null);
  const dialog = dialogRef ?? ownDialog;
  const [user,setUser] = useState(null);
  const [email,setEmail] = useState('');
  const [notice,setNotice] = useState('');
  const [busy,setBusy] = useState(false);
  const [revision,setRevision] = useState(0);
  useEffect(() => {
    const {data} = supabase.auth.onAuthStateChange((_event,session) => setUser(session?.user || null));
    return () => data.subscription.unsubscribe();
  }, []);
  const revisionKey = 'aranpro-backup-version-' + user?.id;
  useEffect(() => {setRevision(Number(localStorage.getItem(revisionKey) || 0));},[revisionKey]);
  function remember(value) {
    setRevision(value);
    localStorage.setItem(revisionKey, String(value));
  }
  async function run(action) {
    if (busy) return;
    setBusy(true);
    setNotice('');
    try { await action(); } catch (e) { setNotice(e.message || 'No se pudo contactar con Supabase.'); }
    finally { setBusy(false); }
  }
  async function connect() {
    const {error} = await supabase.auth.signInWithOtp({email:email.trim(), options:{emailRedirectTo:window.location.origin}});
    if (error) throw error;
    setNotice('Revise la bandeja de entrada y el correo no deseado de ' + email.trim() + '. Abra el enlace en este navegador y vuelva a la aplicación.');
  }
  async function upload() {
    const result = await certificateRegistry.saveBackup(revision,{communities,companySettings,certificates});
    remember(result.revision);
    setNotice('Respaldo confirmado en la nube. Versión ' + result.revision + '.');
  }
  async function restore() {
    const result = await certificateRegistry.loadBackup();
    if (!result) throw new Error('Esta cuenta aún no tiene un respaldo.');
    const snapshot = result.snapshot;
    if (!Array.isArray(snapshot?.communities) || !Array.isArray(snapshot.certificates) || !snapshot.companySettings ||
      typeof snapshot.companySettings !== 'object' || Array.isArray(snapshot.companySettings)) throw new Error('El respaldo está incompleto.');
    if (!window.confirm('¿Restaurar la versión ' + result.revision + ', con ' + snapshot.communities.length + ' comunidades y ' + snapshot.certificates.length + ' certificados? Reemplazará los datos locales.')) return;
    // Preserve the state being replaced, including unsynced edits.
    localStorage.setItem('aranpro-before-restore-' + user.id,JSON.stringify({communities,companySettings,certificates}));
    restoreCloudSnapshot(snapshot);
    remember(result.revision);
    setNotice('Respaldo restaurado en este equipo.');
  }
  return <div className="relative inline-block">
    <button type="button" onClick={()=>dialog.current.showModal()} aria-haspopup="dialog" className={'rounded-xl p-2 text-xs font-bold flex gap-2 items-center '+(theme==='dark'?'bg-emerald-950 text-white':'bg-emerald-50 text-emerald-950')}><Cloud size={17}/>{compact?'Nube':'Nube ARANPRO'}</button>
    {createPortal(<dialog ref={dialog} aria-label="Nube ARANPRO" className="m-auto w-[min(26rem,calc(100%-2rem))] max-w-[92vw] max-h-[90dvh] overflow-y-auto bg-white border border-slate-200 text-slate-800 rounded-2xl shadow-xl p-5 space-y-4 text-sm backdrop:bg-slate-900/50">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-emerald-950">Nube ARANPRO</h2>
        <button type="button" onClick={()=>dialog.current.close()} className="rounded-lg border px-3 py-1.5">Cerrar</button>
      </div>
      {user ? <><p className="break-all">{user.email}</p>
        <button disabled={busy} onClick={()=>run(upload)} className="block font-bold">Respaldar en la nube</button>
        <button disabled={busy} onClick={()=>run(restore)} className="block">Restaurar desde la nube</button>
        <button disabled={busy} onClick={()=>run(async()=>{const {error}=await supabase.auth.signOut({scope:'local'});if(error) throw error;})} className="block">Desconectar cuenta</button>
      </> : <form onSubmit={e=>{e.preventDefault();run(connect);}} className="space-y-4">
        <label className="block font-semibold">Correo de administración<input type="email" autoComplete="email" required disabled={busy} value={email} onChange={e=>setEmail(e.target.value)} className="block mt-1 border rounded-lg w-full p-3 font-normal"/></label>
        <button type="submit" disabled={busy} className="block w-full bg-emerald-950 text-white py-3 rounded-lg font-bold disabled:opacity-60">{busy?'Solicitando enlace…':'Recibir enlace de acceso'}</button>
      </form>}
      <p role="status" className="empty:hidden rounded-lg bg-slate-50 px-3 py-2">{busy?'Conectando…':notice}</p>
    </dialog>, document.body)}
  </div>;
}
