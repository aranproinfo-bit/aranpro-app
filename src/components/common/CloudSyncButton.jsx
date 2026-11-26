import React, { useState, useEffect } from 'react';
import { Cloud, CloudCheck, RefreshCw, CheckCircle2, AlertCircle, ArrowDownCircle } from 'lucide-react';
import { cloudSyncService, isSupabaseConfigured } from '../../services/supabase';
import { useCommunity } from '../../context/CommunityContext';

export const CloudSyncButton = ({ theme = 'dark', compact = false }) => {
  const { communities, companySettings, currentUser, setCommunities, setCompanySettings } = useCommunity();
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(() => cloudSyncService.getLastSyncInfo());
  const [statusMessage, setStatusMessage] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    setLastSync(cloudSyncService.getLastSyncInfo());
  }, []);

  const handleSyncToCloud = async () => {
    setSyncing(true);
    setStatusMessage('Sincronizando...');
    const result = await cloudSyncService.syncToCloud({
      communities,
      companySettings,
      user: currentUser
    });
    setSyncing(false);

    if (result.success) {
      setLastSync(cloudSyncService.getLastSyncInfo());
      setStatusMessage('¡Sincronizado!');
      setTimeout(() => setStatusMessage(''), 3000);
    } else {
      setStatusMessage('Error');
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  const handlePullFromCloud = async () => {
    if (!window.confirm('¿Desea descargar y restaurar los datos más recientes guardados en Supabase? Esto actualizará las comunidades y configuraciones en este computador.')) {
      return;
    }
    setSyncing(true);
    setStatusMessage('Descargando...');
    const result = await cloudSyncService.pullFromCloud();
    setSyncing(false);

    if (result.success) {
      if (result.communities && result.communities.length > 0) {
        setCommunities(result.communities);
      }
      if (result.companySettings) {
        setCompanySettings(result.companySettings);
      }
      setShowMenu(false);
      alert('✅ ¡Datos descargados exitosamente desde Supabase! La plataforma está ahora 100% actualizada.');
    } else {
      alert(`No se pudo descargar de la nube: ${result.error || 'Sin respaldo previo'}`);
      setShowMenu(false);
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className="relative inline-block text-left">
      <div className="inline-flex items-center rounded-xl overflow-hidden border border-emerald-900/40 shadow-xs">
        <button
          type="button"
          onClick={handleSyncToCloud}
          disabled={syncing}
          title={lastSync ? `Última sincronización: ${new Date(lastSync.timestamp).toLocaleString('es-CL')}` : 'Sincronizar plataforma con Supabase'}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
            isDark
              ? 'bg-emerald-900/60 hover:bg-emerald-800 text-emerald-100 hover:text-white'
              : 'bg-emerald-50 hover:bg-emerald-100 text-[#0F3D2E]'
          }`}
        >
          {syncing ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#D4B895]" />
          ) : (
            <Cloud className="w-3.5 h-3.5 text-[#D4B895]" />
          )}
          {!compact && (
            <span>
              {statusMessage || (lastSync ? 'Nube Sincronizada' : 'Sincronizar Nube')}
            </span>
          )}
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
        </button>

        <button
          type="button"
          onClick={() => setShowMenu(v => !v)}
          className={`px-1.5 py-1.5 border-l border-emerald-900/40 text-xs transition-colors cursor-pointer ${
            isDark ? 'bg-emerald-950/70 text-emerald-200 hover:bg-emerald-900' : 'bg-emerald-100 text-[#0F3D2E]'
          }`}
          title="Opciones de Nube Supabase"
        >
          ▾
        </button>
      </div>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white text-slate-800 shadow-2xl border border-slate-200 p-3 z-50 animate-in fade-in space-y-2">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Sincronización Cloud (Supabase)
          </div>
          <div className="text-xs text-slate-600">
            {lastSync ? (
              <div>
                Última sincronización:<br />
                <strong className="text-slate-800">{new Date(lastSync.timestamp).toLocaleString('es-CL')}</strong>
              </div>
            ) : (
              'Aún no se ha realizado sincronización en la nube desde este equipo.'
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-1">
            <button
              onClick={() => {
                setShowMenu(false);
                handleSyncToCloud();
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold text-[#0F3D2E] hover:bg-[#F5F4EF] flex items-center gap-2"
            >
              <Cloud className="w-4 h-4 text-[#D4B895]" />
              Subir cambios a Supabase
            </button>
            <button
              onClick={handlePullFromCloud}
              className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            >
              <ArrowDownCircle className="w-4 h-4 text-emerald-600" />
              Descargar última versión de la nube
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
