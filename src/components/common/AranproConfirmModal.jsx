import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export const AranproConfirmModal = ({
  isOpen,
  type = 'warning', // 'danger' | 'warning' | 'info' | 'success'
  title = 'Confirmación requerida',
  message = '¿Está seguro de realizar esta acción?',
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  isAlert = false, // si es true sólo muestra el botón de Aceptar (reemplazo de alert)
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  const iconConfig = {
    danger: {
      bg: 'bg-rose-50 border-rose-100',
      text: 'text-rose-600',
      btnBg: 'bg-rose-600 hover:bg-rose-700 text-white',
      icon: AlertTriangle
    },
    warning: {
      bg: 'bg-amber-50 border-amber-100',
      text: 'text-amber-600',
      btnBg: 'bg-[#0F3D2E] hover:bg-[#0A291F] text-white',
      icon: AlertCircle
    },
    success: {
      bg: 'bg-emerald-50 border-emerald-100',
      text: 'text-emerald-700',
      btnBg: 'bg-[#0F3D2E] hover:bg-[#0A291F] text-white',
      icon: CheckCircle2
    },
    info: {
      bg: 'bg-[#0F3D2E]/10 border-[#0F3D2E]/20',
      text: 'text-[#0F3D2E]',
      btnBg: 'bg-[#0F3D2E] hover:bg-[#0A291F] text-white',
      icon: Info
    }
  }[type] || {
    bg: 'bg-slate-100 border-slate-200',
    text: 'text-slate-700',
    btnBg: 'bg-[#0F3D2E] hover:bg-[#0A291F] text-white',
    icon: Info
  };

  const IconComponent = iconConfig.icon;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4 relative animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Botón cerrar esquina */}
        <button
          onClick={onCancel || onConfirm}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icono corporativo */}
        <div className={`w-14 h-14 mx-auto rounded-2xl border ${iconConfig.bg} ${iconConfig.text} flex items-center justify-center shadow-xs`}>
          <IconComponent className="w-7 h-7" />
        </div>

        {/* Título & Mensaje */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-[#D4B895] uppercase tracking-wider block">
            ARANPRO • Confirmación de Seguridad
          </span>
          <h3 className="text-base font-black text-slate-900 tracking-tight">
            {title}
          </h3>
          <div className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto whitespace-pre-line">
            {message}
          </div>
        </div>

        {/* Botones de acción */}
        <div className={`pt-3 border-t border-slate-100 flex items-center gap-2.5 ${isAlert ? 'justify-center' : 'justify-end'}`}>
          {!isAlert && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 active:scale-95 transition-all"
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-md active:scale-95 transition-all ${iconConfig.btnBg}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
