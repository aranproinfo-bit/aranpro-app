import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, DollarSign, Megaphone, AlertTriangle, FileCheck, MessageSquare, Vote, FolderOpen, X } from 'lucide-react';
import { useCommunity } from '../../context/CommunityContext';

const CATEGORY_STYLES = {
  pago: { icon: DollarSign, bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  gasto_comun: { icon: DollarSign, bg: 'bg-amber-50 text-amber-800 border-amber-200' },
  multa: { icon: AlertTriangle, bg: 'bg-rose-50 text-rose-700 border-rose-200' },
  comunicado: { icon: Megaphone, bg: 'bg-teal-50 text-[#0F3D2E] border-teal-200' },
  certificado: { icon: FileCheck, bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  reclamo: { icon: MessageSquare, bg: 'bg-orange-50 text-orange-700 border-orange-200' },
  consulta: { icon: Vote, bg: 'bg-purple-50 text-purple-700 border-purple-200' },
  documento: { icon: FolderOpen, bg: 'bg-slate-100 text-slate-700 border-slate-200' }
};

function formatRelativeTime(iso) {
  if (!iso) return '';
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (diffSec < 60) return 'Hace instantes';
  if (diffSec < 3600) return `Hace ${Math.floor(diffSec / 60)} min`;
  if (diffSec < 86400) return `Hace ${Math.floor(diffSec / 3600)} h`;
  return new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
}

export function NotificationCenterBell({ theme = 'dark', compact = false, onNavigateNotification }) {
  const {
    liveNotifications = [],
    unreadNotificationsCount = 0,
    markAllNotificationsRead,
    cloudSyncStatus
  } = useCommunity();

  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    function handleOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next && unreadNotificationsCount > 0 && markAllNotificationsRead) {
      markAllNotificationsRead();
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className="relative inline-flex group" ref={panelRef}>
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Centro de Notificaciones en Línea"
        className={`relative h-9 rounded-xl px-2.5 text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
          isDark
            ? 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
            : 'bg-[#F5F4EF] hover:bg-slate-200/70 text-[#0F3D2E] border border-[#D4B895]/60'
        }`}
      >
        <Bell className={`w-4 h-4 ${unreadNotificationsCount > 0 ? 'text-[#D4B895] animate-bounce' : ''}`} />
        {!compact && <span>Alertas</span>}
        {unreadNotificationsCount > 0 && (
          <span className="px-1.5 py-0.2 min-w-[18px] h-[18px] rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center shadow-xs">
            {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
          </span>
        )}
      </button>

      {!open && (
        <div className="pointer-events-none opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-150 absolute right-0 top-full mt-2 w-56 rounded-xl bg-[#0A291F] text-white p-2.5 shadow-xl border border-[#D4B895]/50 z-50 text-left">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#D4B895] block">
            Centro de Alertas
          </span>
          <p className="text-[11px] text-white/85 leading-snug font-normal mt-0.5">
            Avisos instantáneos de pagos informados, reclamos y gestiones.
          </p>
        </div>
      )}

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[92vw] bg-white rounded-2xl shadow-2xl border border-[#D4B895] z-50 overflow-hidden text-left">
          <div className="bg-[#0F3D2E] text-white px-4 py-3 flex items-center justify-between border-b-2 border-[#D4B895]">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#D4B895] block">
                Alertas en Línea • Tiempo Real
              </span>
              <h3 className="text-sm font-bold text-white">
                Bandeja de Notificaciones
              </h3>
            </div>
            <div className="flex items-center gap-1.5">
              {liveNotifications.length > 0 && (
                <button
                  type="button"
                  onClick={() => markAllNotificationsRead && markAllNotificationsRead()}
                  className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-bold text-[#D4B895] flex items-center gap-1 cursor-pointer"
                  title="Marcar todas como leídas"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Leídas</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg text-white/70 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {liveNotifications.length === 0 ? (
              <div className="p-6 text-center space-y-1.5">
                <Bell className="w-7 h-7 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">Todo al día</p>
                <p className="text-[11px] text-slate-500">
                  Aquí aparecerán al instante los pagos informados, comunicados, gastos comunes, multas y certificados.
                </p>
              </div>
            ) : (
              liveNotifications.map((item) => {
                const styleObj = CATEGORY_STYLES[item.category] || CATEGORY_STYLES.comunicado;
                const IconComp = styleObj.icon;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (onNavigateNotification) {
                        onNavigateNotification(item);
                        setOpen(false);
                      }
                    }}
                    className={`p-3.5 flex items-start gap-3 transition-colors ${
                      onNavigateNotification ? 'cursor-pointer hover:bg-slate-50' : ''
                    } ${
                      item.isRead ? 'bg-white' : 'bg-emerald-50/40'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${styleObj.bg}`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-slate-900 leading-snug">
                          {item.title}
                        </p>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
                          {formatRelativeTime(item.createdAt)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed break-words">
                        {item.message}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${cloudSyncStatus === 'online' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
              {cloudSyncStatus === 'online' ? 'Conectado en línea con Supabase' : 'Modo sincronización activa'}
            </span>
            <span className="font-semibold text-[#0F3D2E]">Correo + App</span>
          </div>
        </div>
      )}
    </div>
  );
}
