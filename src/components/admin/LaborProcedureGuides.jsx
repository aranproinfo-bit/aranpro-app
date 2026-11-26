import React, { useState } from 'react';
import {
  BookOpen, ChevronDown, ChevronUp, ExternalLink, CheckCircle2,
  AlertTriangle, Upload, FileText, Scale, Landmark, ShieldCheck
} from 'lucide-react';

/**
 * Guías paso a paso integradas para los submódulos de Previred y Finiquitos / Carta de Aviso.
 * Reutilizable tanto en RR.HH. de Comunidades (employerKind="community")
 * como en RR.HH. de Mi Oficina ARANPRO (employerKind="company").
 */

export const PreviredStepByStepGuide = ({ employerKind = 'community' }) => {
  const [open, setOpen] = useState(false);
  const isOffice = employerKind === 'company';

  const steps = [
    {
      num: '1',
      title: 'Verifica fichas y liquidaciones del mes en ARANPRO',
      detail:
        'Antes de generar el archivo, confirma en "2. Liquidaciones DT" que los días trabajados, horas extras, bonos, AFP, salud (Fonasa/Isapre), AFC y gratificación estén correctos para cada trabajador activo.'
    },
    {
      num: '2',
      title: 'Descarga el archivo plano (.txt) y la planilla de respaldo',
      detail:
        'Haz clic en "Descargar Archivo Previred (.txt)" arriba. Ese archivo ya viene formateado con la estructura de nómina para carga masiva. Guarda también el PDF de "Imprimir Planilla Previred" para tu archivo.'
    },
    {
      num: '3',
      title: 'Sube la nómina en www.previred.com',
      detail: `Ingresa con tu clave en Previred → Empresas → selecciona ${
        isOffice ? 'tu empresa administradora (ARANPRO)' : 'el RUT del Condominio empleador'
      } → Remuneraciones → "Declarar y Pagar" → "Subir archivo de nómina (.txt)" y selecciona el archivo descargado desde ARANPRO.`
    },
    {
      num: '4',
      title: 'Revisa validaciones y alertas de Previred',
      detail:
        'Previred validará RUTs, topes imponibles, licencias médicas, finiquitos o ingresos del mes. Si aparece alguna observación (por ejemplo, cambio de tramo de asignación familiar o licencia), corrígela en pantalla antes de pasar al pago.'
    },
    {
      num: '5',
      title: 'Paga antes del vencimiento y archiva el comprobante',
      detail:
        'Pago electrónico: hasta el día 13 del mes siguiente (13:45 hrs). Pago presencial/cupón: hasta el día 10. Descarga siempre el Comprobante de Pago de Cotizaciones y guárdalo como respaldo legal (exigido por Ley Bustos y fiscalizaciones DT).'
    }
  ];

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-emerald-50/80 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#0F3D2E] text-[#D4B895] flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black text-[#0F3D2E]">
                Guía Paso a Paso: Cómo subir el archivo y pagar en Previred
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-emerald-800 border border-emerald-200">
                5 pasos
              </span>
            </div>
            <p className="text-[11px] text-slate-600 truncate">
              Tutorial rápido desde la descarga del .txt en ARANPRO hasta el comprobante de pago en previred.com.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0F3D2E] shrink-0">
          {open ? 'Ocultar guía' : 'Ver tutorial'}
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-2 border-t border-emerald-200/70 space-y-3 bg-white/80 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5">
            {steps.map((s) => (
              <div key={s.num} className="p-3 rounded-xl bg-white border border-slate-200 space-y-1.5 flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#0F3D2E] text-[#D4B895] text-[10px] font-black flex items-center justify-center shrink-0">
                    {s.num}
                  </span>
                  <h5 className="text-[11px] font-black text-slate-900 leading-snug">{s.title}</h5>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed flex-1">{s.detail}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
            <div className="flex items-center gap-1.5 text-amber-800">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>
                <strong>Tip:</strong> Si un trabajador tuvo licencia médica o finiquito en el mes, verifica los días trabajados y movimientos de personal antes de pagar.
              </span>
            </div>
            <a
              href="https://www.previred.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold inline-flex items-center gap-1.5"
            >
              <Landmark className="w-3.5 h-3.5 text-[#D4B895]" />
              <span>Abrir Portal Previred</span>
              <ExternalLink className="w-3 h-3 text-[#D4B895]" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export const TerminationStepByStepGuide = ({ employerKind = 'community' }) => {
  const [open, setOpen] = useState(false);
  const isOffice = employerKind === 'company';

  const steps = [
    {
      num: '1',
      title: 'Revisar causal, fueros y cotizaciones (Ley Bustos)',
      detail: `Confirma la causal legal (Art. 159, 160 o 161 CT), verifica que no exista fuero ni licencia médica incompatible y comprueba que todas las cotizaciones previsionales estén pagadas al día (sin eso el despido es nulo por Ley 19.631).${
        isOffice ? '' : ' En comunidades, respalda además el acuerdo del Comité de Administración (Art. 20 N° 10 Ley 21.442).'
      }`
    },
    {
      num: '2',
      title: 'Emitir y entregar la Carta de Aviso de Término',
      detail:
        'Usa el botón "Carta de Aviso" en la tarjeta del trabajador. Por Necesidades de la Empresa (Art. 161) debe entregarse con 30 días de anticipación o pagar mes de aviso. Entrégala personalmente (con firma de copia) o por carta certificada al domicilio del contrato dentro de 3 días hábiles, adjuntando comprobantes de cotizaciones.'
    },
    {
      num: '3',
      title: 'Enviar copia de la Carta a la Inspección del Trabajo (Mi DT)',
      detail:
        'Dentro del mismo plazo de 3 días hábiles desde la separación (6 días hábiles si es Art. 159 N° 6), sube la copia de la Carta de Aviso en el portal Mi DT (midt.dirtrab.cl) con tu ClaveÚnica en calidad de empleador/representante.'
    },
    {
      num: '4',
      title: 'Preparar y revisar el Finiquito en ARANPRO',
      detail:
        'Usa el botón "Finiquito DT" en la tarjeta del trabajador. Verifica días trabajados del mes, feriado legal y proporcional, indemnización por años de servicio (tope 90 UF), descuento aporte empleador AFC (si aplica Art. 161) y liquidación final.'
    },
    {
      num: '5',
      title: 'Ratificar y pagar dentro de 10 días hábiles',
      detail:
        'El finiquito debe ponerse a disposición y pagarse dentro de 10 días hábiles desde la separación (Art. 177 CT). Puede firmarse presencialmente ante Ministro de Fe (Notario, Inspector del Trabajo, Oficial Civil o Secretario Municipal) o electrónicamente vía Mi DT si el trabajador acepta.'
    },
    {
      num: '6',
      title: 'Archivar el expediente de término completo',
      detail:
        'Guarda en carpeta: (a) Carta de Aviso con acuse o boleta de correo certificado, (b) Comprobante de envío en Mi DT, (c) Certificados Previred al día, (d) Finiquito ratificado y (e) Comprobante de transferencia o vale vista.'
    }
  ];

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/40 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-amber-50/80 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-slate-900 text-[#D4B895] flex items-center justify-center shrink-0">
            <Scale className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black text-slate-900">
                Guía Paso a Paso: Carta de Aviso, Notificación DT y Finiquito
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-amber-900 border border-amber-200">
                6 pasos • Plazos DT
              </span>
            </div>
            <p className="text-[11px] text-slate-600 truncate">
              Flujo completo desde la entrega de la Carta de Aviso (3 días hábiles) hasta la firma y pago del Finiquito (10 días hábiles).
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-900 shrink-0">
          {open ? 'Ocultar guía' : 'Ver tutorial'}
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-2 border-t border-amber-200/70 space-y-3 bg-white/85 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {steps.map((s) => (
              <div key={s.num} className="p-3 rounded-xl bg-white border border-slate-200 space-y-1.5 flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-[#D4B895] text-[10px] font-black flex items-center justify-center shrink-0">
                    {s.num}
                  </span>
                  <h5 className="text-[11px] font-black text-slate-900 leading-snug">{s.title}</h5>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed flex-1">{s.detail}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0F3D2E] shrink-0" />
              <span>
                <strong>Recuerda:</strong> La persona trabajadora siempre puede formular reserva de derechos al firmar sin autorización del empleador.
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href="https://midt.dirtrab.cl"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold inline-flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-[#D4B895]" />
                <span>Portal Mi DT</span>
                <ExternalLink className="w-3 h-3 text-[#D4B895]" />
              </a>
              <a
                href="https://www.previred.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold inline-flex items-center gap-1.5"
              >
                <Landmark className="w-3.5 h-3.5 text-[#0F3D2E]" />
                <span>Previred</span>
                <ExternalLink className="w-3 h-3 text-slate-500" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
