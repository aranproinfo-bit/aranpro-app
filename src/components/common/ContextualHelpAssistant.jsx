import React, { useState, useMemo } from 'react';
import {
  Lightbulb,
  X,
  CheckCircle2,
  Scale,
  AlertTriangle,
  Clock,
  Sparkles,
  BookOpen,
  GraduationCap,
  ChevronRight,
  Compass
} from 'lucide-react';
import {
  ENTERPRISE_HELP_CATALOG,
  COMMUNITY_HELP_CATALOG,
  resolveContextualHelp
} from '../../data/contextualHelpCatalog';

/**
 * Botón "Lamparita 💡" + Botón "Tour de Inicio 🎓" para insertar en las cabeceras de Oficina y Comunidades
 */
export function HelpHeaderButtons({
  isOpen,
  onToggleHelp,
  onOpenOnboardingTour,
  theme = 'light', // 'dark' (cabecera verde oscura) | 'light' (cabecera blanca)
  compact = false
}) {
  const isDark = theme === 'dark';

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <button
        type="button"
        onClick={onToggleHelp}
        className={`relative rounded-xl font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
          compact ? 'px-2.5 py-1.5' : 'px-3 py-1.5'
        } ${
          isOpen
            ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300/70'
            : isDark
            ? 'bg-amber-400/20 hover:bg-amber-400/35 text-amber-200 border border-amber-300/40'
            : 'bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300'
        }`}
        title="Abrir guía contextual de este módulo (se actualiza sola al cambiar de pestaña)"
      >
        <Lightbulb className={`w-4 h-4 shrink-0 ${isOpen ? 'text-slate-950 fill-slate-950/15' : isDark ? 'text-amber-300' : 'text-amber-600'}`} />
        {!compact && <span>Guía Módulo</span>}
      </button>

      {onOpenOnboardingTour && !compact && (
        <button
          type="button"
          onClick={onOpenOnboardingTour}
          className={`px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
            isDark
              ? 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
          }`}
          title="Ver el Tutorial Interactivo de Inicio de ARANPRO"
        >
          <GraduationCap className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-[#D4B895]' : 'text-[#0F3D2E]'}`} />
          <span className="hidden xl:inline">Tour Inicio</span>
        </button>
      )}
    </div>
  );
}

/**
 * Panel Lateral No Bloqueante "Lamparita 💡"
 * Permanece abierto al costado derecho sin impedir hacer clic en las pestañas de la app,
 * actualizando automáticamente su guía a medida que el usuario navega entre módulos.
 */
export function ContextualHelpAssistant({
  isOpen,
  onClose,
  workspace = 'comunidad', // 'empresa' | 'comunidad'
  activeTab = 'resumen',
  activeSubTab = '',
  communityName = '',
  onOpenOnboardingTour,
  onNavigateToModule
}) {
  const [browseAllMode, setBrowseAllMode] = useState(false);

  const currentGuide = useMemo(
    () => resolveContextualHelp({ workspace, activeTab, activeSubTab }),
    [workspace, activeTab, activeSubTab]
  );

  const allModulesList = useMemo(() => {
    const src = workspace === 'empresa' ? ENTERPRISE_HELP_CATALOG : COMMUNITY_HELP_CATALOG;
    return Object.entries(src).map(([tabKey, group]) => ({
      tabKey,
      ...(group.default || Object.values(group)[0])
    }));
  }, [workspace]);

  if (!isOpen || !currentGuide) return null;

  return (
    <aside
      aria-label="Asistente didáctico contextual ARANPRO"
      className="no-print fixed right-0 top-0 lg:top-16 bottom-0 z-40 w-full sm:w-[400px] bg-white border-l-2 border-[#D4B895] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
    >
      {/* Cabecera del Asistente Lamparita */}
      <div className="bg-gradient-to-r from-[#0F3D2E] to-[#16523E] text-white p-4 border-b border-[#D4B895]/40 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-xs shrink-0">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9.5px] font-black uppercase tracking-wider text-amber-300">
                  Copiloto Didáctico en Vivo
                </span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <h3 className="text-sm font-black text-white leading-tight">
                {workspace === 'empresa' ? 'Ayuda • Mi Oficina Administradora' : `Ayuda • ${communityName || 'Gestión de Comunidad'}`}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/75 hover:text-white hover:bg-white/10 cursor-pointer"
            title="Cerrar panel de ayuda"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={() => setBrowseAllMode(false)}
            className={`flex-1 py-1.5 px-2.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              !browseAllMode ? 'bg-[#D4B895] text-[#0F3D2E] font-black' : 'bg-white/10 text-white/80 hover:bg-white/20'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Pantalla Actual</span>
          </button>

          <button
            type="button"
            onClick={() => setBrowseAllMode(true)}
            className={`flex-1 py-1.5 px-2.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              browseAllMode ? 'bg-[#D4B895] text-[#0F3D2E] font-black' : 'bg-white/10 text-white/80 hover:bg-white/20'
            }`}
          >
            <Compass className="w-3 h-3" />
            <span>Índice Módulos ({allModulesList.length})</span>
          </button>
        </div>
      </div>

      {/* Cuerpo Desplazable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FDFBF7]">
        {!browseAllMode ? (
          <>
            {/* Nota de sincronización automática */}
            <div className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-950 flex items-center gap-2">
              <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>
                <strong>Sincronización activa:</strong> cambia de pestaña o submódulo a la izquierda y esta guía se actualizará sola.
              </span>
            </div>

            {/* Tarjeta Principal del Módulo Actual */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
              <span className="inline-block text-[9.5px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#0F3D2E] text-[#D4B895]">
                {currentGuide.badge}
              </span>
              <h4 className="text-base font-black text-slate-900 leading-snug">
                {currentGuide.title}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {currentGuide.summary}
              </p>

              {currentGuide.whenToUse && (
                <div className="pt-2 border-t border-slate-100 flex items-start gap-2 text-[11.5px] text-slate-700">
                  <Clock className="w-3.5 h-3.5 text-[#0F3D2E] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#0F3D2E]">¿Cuándo usarlo?:</strong> {currentGuide.whenToUse}
                  </div>
                </div>
              )}
            </div>

            {/* Paso a Paso Didáctico */}
            {Array.isArray(currentGuide.steps) && currentGuide.steps.length > 0 && (
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-[#0F3D2E]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Paso a Paso Recomendado</span>
                </div>

                <ol className="space-y-2.5">
                  {currentGuide.steps.map((st, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#0F3D2E] text-[#D4B895] text-[10.5px] font-black flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="text-xs leading-relaxed">
                        <strong className="text-slate-900 block">{st.title}</strong>
                        <span className="text-slate-600 text-[11.5px]">{st.detail}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Respaldo Legal Ley 21.442 */}
            {currentGuide.legalTip && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-black uppercase text-[#0F3D2E]">
                  <Scale className="w-3.5 h-3.5 text-[#0F3D2E]" />
                  <span>Respaldo Normativo & Ley N° 21.442</span>
                </div>
                <p className="text-[11.5px] text-emerald-950 leading-relaxed">
                  {currentGuide.legalTip}
                </p>
              </div>
            )}

            {/* Error Frecuente a Evitar */}
            {currentGuide.commonMistake && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-black uppercase text-rose-900">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Error Frecuente a Evitar</span>
                </div>
                <p className="text-[11.5px] text-rose-950 leading-relaxed">
                  {currentGuide.commonMistake}
                </p>
              </div>
            )}
          </>
        ) : (
          /* Índice Completo para Saltar a Cualquier Módulo */
          <div className="space-y-2">
            <p className="text-xs text-slate-600 px-1">
              Haz clic en cualquier módulo para abrirlo directamente y ver su guía paso a paso:
            </p>
            {allModulesList.map((mod) => {
              const isCurrent = mod.tabKey === activeTab;
              return (
                <button
                  key={mod.tabKey}
                  type="button"
                  onClick={() => {
                    onNavigateToModule?.(mod.tabKey);
                    setBrowseAllMode(false);
                  }}
                  className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between gap-2 cursor-pointer ${
                    isCurrent
                      ? 'bg-[#0F3D2E] text-white border-[#0F3D2E] shadow-xs'
                      : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
                  }`}
                >
                  <div className="min-w-0">
                    <span className={`text-[9.5px] font-black uppercase block ${isCurrent ? 'text-[#D4B895]' : 'text-slate-400'}`}>
                      {mod.badge}
                    </span>
                    <strong className="text-xs font-black truncate block mt-0.5">{mod.title}</strong>
                  </div>
                  <ChevronRight className={`w-4 h-4 shrink-0 ${isCurrent ? 'text-[#D4B895]' : 'text-slate-400'}`} />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Pie con Acceso al Tutorial General de Inicio */}
      {onOpenOnboardingTour && (
        <div className="p-3.5 bg-white border-t border-slate-200">
          <button
            type="button"
            onClick={onOpenOnboardingTour}
            className="w-full py-2.5 px-4 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-[#D4B895] text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
          >
            <GraduationCap className="w-4 h-4" />
            <span>Abrir Tutorial General de Inicio (6 Pasos)</span>
          </button>
        </div>
      )}
    </aside>
  );
}
