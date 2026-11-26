import React, { useEffect, useState } from 'react';
import { Cloud } from 'lucide-react';
import { certificateRegistry, supabase } from '../../services/supabase';
import { useCommunity } from '../../context/CommunityContext';

export function CloudSyncButton({theme = 'dark', compact = false}) {
  const { communities, companySettings, certificates, restoreCloudSnapshot } = useCommunity();
  const [open,setOpen] = useState(false);
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
    setNotice('Abra el enlace que recibió en su correo en este navegador y vuelva a la aplicación.');
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
    <button type="button" onClick={()=>setOpen(!open)} aria-expanded={open} className={'rounded-xl p-2 text-xs font-bold flex gap-2 items-center '+(theme==='dark'?'bg-emerald-950 text-white':'bg-emerald-50 text-emerald-950')}><Cloud size={17}/>{compact?'Nube':'Nube ARANPRO'}</button>
    {open && <section className="absolute right-0 z-50 mt-2 w-72 max-w-[85vw] bg-white border border-slate-200 text-slate-800 rounded-xl shadow-lg p-4 space-y-3 text-sm">
      {user ? <><p className="break-all">{user.email}</p>
        <button disabled={busy} onClick={()=>run(upload)} className="block font-bold">Respaldar en la nube</button>
        <button disabled={busy} onClick={()=>run(restore)} className="block">Restaurar desde la nube</button>
        <button disabled={busy} onClick={()=>run(async()=>{const {error}=await supabase.auth.signOut({scope:'local'});if(error) throw error;})} className="block">Desconectar cuenta</button>
      </> : <form onSubmit={e=>{e.preventDefault();run(connect);}} className="space-y-2">
        <label>Correo de administración<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} className="border rounded w-full p-2"/></label>
        <button disabled={busy} className="font-bold">Recibir enlace de acceso</button>
      </form>}
      <p role="status">{busy?'Conectando…':notice}</p>
    </section>}
  </div>;
}
