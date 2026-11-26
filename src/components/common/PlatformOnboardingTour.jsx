import React, { useState } from 'react';
import {
  GraduationCap,
  Briefcase,
  Building2,
  ShieldCheck,
  RefreshCw,
  Target,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  X,
  ArrowRight
} from 'lucide-react';

export const ONBOARDING_STORAGE_KEY = 'aranpro_onboarding_tour_seen_v1';

const TOUR_SLIDES = [
  {
    step: 1,
    tag: 'BIENVENIDA A ARANPRO • ARQUITECTURA DUAL',
    icon: GraduationCap,
    title: 'Cómo está organizada la plataforma: Tu Oficina vs. Tus Comunidades',
    lead: 'ARANPRO separa con total claridad la gestión empresarial de tu oficina administradora respecto de la contabilidad y operación de cada condominio:',
    cards: [
      {
        title: '1. Panel Mi Empresa (Tu Backoffice)',
        desc: 'Aquí configuras tu firma digital, tu certificado RNAC MINVU, tu propio personal de oficina, la Biblioteca Legal y el Embudo de Postulaciones (Pasos 1 al 6) para ganar nuevas comunidades.'
      },
      {
        title: '2. Panel de Comunidad (Cada Condominio)',
        desc: 'Al entrar a una comunidad trabajas exclusivamente con su cuenta bancaria, sus unidades, sus gastos comunes, sus conserjes, sus asambleas y su Comité, sin mezclar jamás un peso entre edificios.'
      }
    ],
    tip: 'Puedes pasar en cualquier momento de una comunidad a otra o volver a "Panel Mi Empresa" desde el botón superior derecho.'
  },
  {
    step: 2,
    tag: 'PASO INICIAL RECOMENDADO (DÍA 0)',
    icon: ShieldCheck,
    title: 'Deja lista tu Firma, Timbre y Bóveda RNAC en 3 minutos',
    lead: 'Antes de emitir propuestas comerciales, actas o certificados, completa por única vez el Módulo 2 de Mi Empresa:',
    cards: [
      {
        title: 'Datos Legales y Firma Transparente',
        desc: 'Ingresa tu nombre profesional, RUT, teléfono y sube tu firma manuscrita. Todos los PDFs del sistema saldrán firmados y con el sello circular oficial automáticamente.'
      },
      {
        title: 'Bóveda de Títulos y RNAC MINVU',
        desc: 'Carga tu certificado vigente del Registro Nacional de Administradores, tu título y tu certificado de antecedentes: se insertarán solos en tu Dossier de Postulación.'
      }
    ],
    tip: 'Revisa el "Checklist & Semáforo" en Postulaciones para verificar que tu perfil alcance 100/100 puntos de preparación.'
  },
  {
    step: 3,
    tag: 'CRECIMIENTO COMERCIAL • PASOS 1 AL 6',
    icon: Target,
    title: 'Cómo captar, cotizar y recibir una nueva comunidad sin errores',
    lead: 'En "3. Postulaciones & CRM" cuentas con un embudo guiado de 6 estaciones conforme a la Ley N° 21.442:',
    cards: [
      {
        title: 'Captación y Entrevista (Pasos 1 al 4)',
        desc: 'Carta de Puerta en Frío → Dossier Maestro → Calculadora de Honorarios + Propuesta Formal → Brochure con código QR vivo para que el Comité pruebe la App en su celular.'
      },
      {
        title: 'Adjudicación y Alta Día 1 (Pasos 5 y 6)',
        desc: 'Entrega al Comité la Carta de Preaviso y Pauta de Recepción, y usa el Paso 6 para crear la comunidad migrando unidades y saldos desde Edipro, ComunidadFeliz, Edifito o Excel.'
      }
    ],
    tip: 'En el Paso 6 el sistema verifica que el saldo de la cartola bancaria cuadre peso a peso con los fondos recibidos.'
  },
  {
    step: 4,
    tag: 'OPERACIÓN MENSUAL • DÍA 1 AL 30',
    icon: RefreshCw,
    title: 'El flujo mensual perfecto dentro de cada comunidad',
    lead: 'Sigue este orden cada mes dentro del Panel de Comunidad para cerrar tus gastos comunes con precisión contable:',
    cards: [
      {
        title: '1° Recaudación y Conciliación (Unidades)',
        desc: 'Valida comprobantes subidos por vecinos en su App o pega la cartola bancaria para conciliar pagos, abonos parciales, saldos a favor y convenios (Art. 35°).'
      },
      {
        title: '2° Egresos, RR.HH. y Cierre (Gastos → Cierre Mes)',
        desc: 'Registra cada factura con su respaldo PDF, procesa liquidaciones/Previred de conserjería, revisa la Auditoría Pre-Cierre con el Comité y emite las colillas del mes.'
      }
    ],
    tip: 'Cada gasto en cuotas o reposición de fondos distribuye automáticamente la cuota que corresponde cobrar en el período.'
  },
  {
    step: 5,
    tag: 'CUMPLIMIENTO TÉCNICO Y BLINDAJE LEY 21.442',
    icon: Building2,
    title: 'Mantenciones críticas, Asambleas, Rendición Anual y Traspaso',
    lead: 'Protege a la comunidad y resguarda tu responsabilidad profesional ante el MINVU, SEC y Dirección del Trabajo:',
    cards: [
      {
        title: 'Gobierno, Certificados y Seguridad',
        desc: 'Controla vencimientos de Ascensores MINVU, Sello Verde SEC y Bombas; simula quórums en vivo (Art. 15°); y emite certificados auditados (Art. 36°).'
      },
      {
        title: 'Rendición Anual y Entrega Blindada',
        desc: 'En "Rendición & Traspaso" emites el Dossier Anual para Asamblea Ordinaria (Art. 21°) o el Expediente Completo de Entrega con baja de mandatos en Banco, SII y DT.'
      }
    ],
    tip: 'Si entregas una comunidad, márcala como "Archivo Histórico • Entregada" en vez de borrarla para conservar tus respaldos legales.'
  },
  {
    step: 6,
    tag: 'TU COPILOTO EN TODO MOMENTO',
    icon: Lightbulb,
    title: 'Usa el botón «Guía Módulo 💡» en cualquier pantalla',
    lead: 'Nunca estarás perdido en ARANPRO: en la barra superior siempre verás el botón ámbar de la Lamparita.',
    cards: [
      {
        title: 'Ayuda Contextual que cambia contigo',
        desc: 'Al abrir la Lamparita 💡 aparece un panel lateral derecho que NO bloquea tu pantalla: mientras cambias de módulo o sub-pestaña, la explicación cambia sola en vivo.'
      },
      {
        title: 'Guías Especializadas Integradas',
        desc: 'Además, en módulos delicados como Previred, Finiquitos y Recepción/Entrega encontrarás manuales operativos detallados paso a paso.'
      }
    ],
    tip: 'Puedes volver a abrir este Tour de Inicio cuando quieras desde el botón "Tour Inicio" en la barra superior.'
  }
];

export function PlatformOnboardingTour({
  isOpen,
  onClose,
  onOpenContextualHelp,
  onQuickAction
}) {
  const [stepIdx, setStepIdx] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(true);

  if (!isOpen) return null;

  const slide = TOUR_SLIDES[stepIdx] || TOUR_SLIDES[0];
  const SlideIcon = slide.icon;
  const isFirst = stepIdx === 0;
  const isLast = stepIdx === TOUR_SLIDES.length - 1;

  const handleFinish = (extraCallback) => {
    if (dontShowAgain) {
      try {
        localStorage.setItem(ONBOARDING_STORAGE_KEY, 'done');
      } catch {
        // ignore storage quota errors
      }
    }
    onClose?.();
    if (extraCallback) extraCallback();
  };

  return (
    <div className="no-print fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-[#D4B895]/50 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Cabecera Verde Institucional */}
        <div className="bg-gradient-to-r from-[#0F3D2E] via-[#144937] to-[#0F3D2E] text-white p-5 sm:p-6 border-b border-[#D4B895]/35 relative">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#D4B895] text-[#0F3D2E] flex items-center justify-center shadow-sm shrink-0">
                <SlideIcon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#D4B895] block">
                  {slide.tag} • PASO {slide.step} DE {TOUR_SLIDES.length}
                </span>
                <h2 className="text-lg sm:text-xl font-black text-white leading-snug mt-0.5">
                  {slide.title}
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleFinish()}
              className="p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 cursor-pointer shrink-0"
              title="Cerrar tutorial"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Indicadores de progreso */}
          <div className="grid grid-cols-6 gap-1.5 mt-5">
            {TOUR_SLIDES.map((s, idx) => (
              <button
                key={s.step}
                type="button"
                onClick={() => setStepIdx(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === stepIdx ? 'bg-[#D4B895]' : idx < stepIdx ? 'bg-emerald-400/70' : 'bg-white/20'
                }`}
                title={`Ir al paso ${s.step}`}
              />
            ))}
          </div>
        </div>

        {/* Contenido Central */}
        <div className="p-5 sm:p-7 space-y-5 overflow-y-auto flex-1 bg-[#FDFBF7]">
          <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
            {slide.lead}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {slide.cards.map((card, i) => (
              <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
                <div className="flex items-center gap-2 text-[#0F3D2E] font-black text-xs sm:text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{card.title}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-950">
            <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Consejo práctico:</strong> {slide.tip}
            </div>
          </div>

          {isLast && (
            <div className="pt-1 flex flex-wrap items-center gap-2.5">
              {onOpenContextualHelp && (
                <button
                  type="button"
                  onClick={() => handleFinish(onOpenContextualHelp)}
                  className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Lightbulb className="w-4 h-4" />
                  <span>Probar ahora la Lamparita 💡 en vivo</span>
                </button>
              )}
              {onQuickAction && (
                <button
                  type="button"
                  onClick={() => handleFinish(onQuickAction)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#0F3D2E] border border-emerald-200 text-xs font-black flex items-center gap-1.5 cursor-pointer"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Ir a Configurar Datos y Firma</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Pie de Navegación */}
        <div className="px-5 sm:px-7 py-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="rounded border-slate-300 text-[#0F3D2E] focus:ring-[#0F3D2E]"
            />
            <span>No mostrar automáticamente al iniciar (podrás abrirlo desde «Tour Inicio»)</span>
          </label>

          <div className="flex items-center justify-end gap-2">
            {!isFirst && (
              <button
                type="button"
                onClick={() => setStepIdx((p) => Math.max(0, p - 1))}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>
            )}

            {!isLast ? (
              <button
                type="button"
                onClick={() => setStepIdx((p) => Math.min(TOUR_SLIDES.length - 1, p + 1))}
                className="px-4 py-2 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-[#D4B895] text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>Siguiente</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleFinish()}
                className="px-5 py-2 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-[#D4B895] text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>Comenzar a usar ARANPRO</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
