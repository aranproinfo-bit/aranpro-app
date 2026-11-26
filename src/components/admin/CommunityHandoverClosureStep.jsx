import React, { useState, useMemo } from 'react';
import {
  Copy,
  Check,
  MessageCircle,
  Mail,
  ShieldCheck,
  AlertTriangle,
  Archive,
  RotateCcw,
  CheckCircle2,
  Printer,
  Eye,
  Building2,
  Scale,
  Landmark,
  FileCheck2,
  History
} from 'lucide-react';
import { formatCLP } from '../../utils/formatters';

const MANDATE_ENTITIES = [
  {
    id: 'mand_banco',
    entity: '1. Institución Bancaria (Apoderados y Firmas)',
    detail: 'Revocación de poder bancario en cuenta corriente, desactivación de perfil autorizador y devolución de Digipass/Token.',
    deadline: 'En el acto / máx. 5 días hábiles con acta reducida a escritura pública'
  },
  {
    id: 'mand_sii',
    entity: '2. Servicio de Impuestos Internos (SII • e-RUT)',
    detail: 'Actualización de representantes en carpeta tributaria del RUT comunitario y cambio de correo de notificaciones SII.',
    deadline: 'Máx. 15 días hábiles desde designación del nuevo administrador'
  },
  {
    id: 'mand_previred',
    entity: '3. Portal Previred (Administrador Empleador)',
    detail: 'Eliminación del RUT del administrador saliente como usuario habilitado para declarar/pagar planillas de la comunidad.',
    deadline: 'Inmediato tras pago del último mes devengado'
  },
  {
    id: 'mand_dt',
    entity: '4. Dirección del Trabajo (Portal MiDT)',
    detail: 'Baja del representante laboral electrónico para que futuras notificaciones laborales lleguen al Comité y nueva administración.',
    deadline: 'Máx. 10 días hábiles desde término de gestión'
  },
  {
    id: 'mand_minvu',
    entity: '5. Plataforma Registro de Condominios MINVU (RNAC)',
    detail: 'Inscripción del acta de nombramiento de la nueva administración y cese del vínculo con la comunidad entregada.',
    deadline: 'Máx. 15 días hábiles tras reducción a escritura pública (Art. 18°)'
  }
];

export function CommunityHandoverClosureStep({
  phase = 'traspaso',
  currentCommunity = {},
  live = {},
  meta = {},
  company = {},
  checklistScore = 0,
  reconciliation = {},
  mandateChecks = {},
  onToggleMandateCheck,
  onPreviewDoc,
  onPrintDoc,
  onArchiveHandover,
  onReactivateCommunity,
  onArchiveAnnualRendition,
  onTriggerToast
}) {
  const isAnnual = phase === 'anual';
  const [copiedKey, setCopiedKey] = useState('');
  const [handoverPlace, setHandoverPlace] = useState('Sala de reuniones / Conserjería del condominio');
  const [handoverTime, setHandoverTime] = useState('19:00 hrs');
  const [annualResultStatus, setAnnualResultStatus] = useState('APROBADA SIN OBSERVACIONES');
  const [annualQuorumPct, setAnnualQuorumPct] = useState('58.5');
  const [annualArchiveNote, setAnnualArchiveNote] = useState('');

  const isAlreadyHandedOver = currentCommunity?.handoverStatus === 'ENTREGADA';
  const annualHistory = Array.isArray(currentCommunity?.annualAccountabilityHistory)
    ? currentCommunity.annualAccountabilityHistory
    : [];

  const whatsappText = useMemo(() => {
    if (isAnnual) {
      return [
        `Estimados(as) Copropietarios(as) e integrantes del Comité de Administración de *${meta.communityName || live.communityName}*:`,
        ``,
        `Junto con saludar, y en cumplimiento de los artículos 19° y 21° de la *Ley N° 21.442 sobre Copropiedad Inmobiliaria*, informamos que se encuentra a su disposición el *Informe y Balance Anual de Rendición de Cuentas* correspondiente al período *${meta.annualPeriodLabel}*.`,
        ``,
        `📌 *Resumen ejecutivo al cierre:*`,
        `• Saldo referencial en banco (${live.bankName}): *${formatCLP(reconciliation.bank || live.bankBalance)}*`,
        `• Fondo Común de Reserva acumulado: *${formatCLP(live.reserveFund)}*`,
        `• Unidades al día: *${live.paidUnitsCount} de ${live.totalUnits}*`,
        `• Fecha Asamblea Ordinaria: *${meta.assemblyDate || 'Por confirmar'}* (${handoverTime})`,
        ``,
        `Todos los comprobantes tributarios, cartolas bancarias y planillas previsionales se encuentran respaldados y disponibles para su revisión previa en nuestra plataforma *ARANPRO*.`,
        ``,
        `Atentamente,`,
        `*${company.adminName}*`,
        `ARANPRO Gestión Integral • ${company.phone}`
      ].join('\n');
    }

    return [
      `Estimado(a) *${meta.committeeRepName || 'Presidente(a) e integrantes del Comité de Administración'}*${meta.incomingAdminName ? ` y *${meta.incomingAdminName}* (Administración Entrante)` : ''}:`,
      ``,
      `Junto con saludar, informamos formalmente que el expediente íntegro de *Rendición Final y Traspaso de Administración* del condominio *${meta.communityName || live.communityName}* se encuentra preparado y a su completa disposición conforme a los artículos 20° y 21° de la *Ley N° 21.442*.`,
      ``,
      `📋 *Coordinación de Entrega Formal:*`,
      `• Fecha propuesta de corte y entrega: *${meta.handoverDate || 'Por confirmar'}* a las *${handoverTime}*`,
      `• Lugar / Modalidad: *${handoverPlace}* (Modalidad ${meta.modality || 'Mixta'})`,
      `• Disponible líquido conciliado al corte: *${formatCLP(reconciliation.realAvailable ?? live.bankBalance)}*`,
      `• Expediente preparado: Pauta foliada A–G (3 págs.), Acta de Traspaso, corte contable, padrón de unidades, estado laboral, inventario de llaves y protocolo de traspaso/revocación de accesos.`,
      ``,
      `Agradeceremos confirmar asistencia para suscribir el Acta de Recepción en triplicado y coordinar el cambio inmediato de apoderados y credenciales ante banco, SII y portales públicos.`,
      ``,
      `Atentamente,`,
      `*${company.adminName}*`,
      `ARANPRO Gestión Integral • ${company.phone}`
    ].join('\n');
  }, [isAnnual, meta, live, company, reconciliation, handoverPlace, handoverTime]);

  const emailSubject = isAnnual
    ? `[Citacion y Cuenta Anual Art. 21 Ley 21.442] ${meta.communityName || live.communityName} - ${meta.annualPeriodLabel}`
    : `[Puesta a Disposicion y Entrega Formal de Administracion] ${meta.communityName || live.communityName} - Corte ${meta.handoverDate}`;

  const handleCopy = (key, text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    onTriggerToast?.(`✓ ${label} copiado al portapapeles.`);
    setTimeout(() => setCopiedKey(''), 2500);
  };

  const handleOpenWhatsAppWeb = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;
    window.open(url, '_blank', 'noopener');
  };

  const completedMandates = MANDATE_ENTITIES.filter((m) => Boolean(mandateChecks[m.id])).length;

  return (
    <div className="space-y-5">
      {/* 1. COMUNICACIÓN OFICIAL Y CARTA DE PUESTA A DISPOSICIÓN (BLINDAJE RNAC ART. 87) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 md:p-6 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#0F3D2E]">
              {isAnnual ? 'Notificación Oficial Arts. 19° y 21°' : 'Blindaje Legal del Saliente • Arts. 20° y 87° Ley 21.442'}
            </span>
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              {isAnnual
                ? '1. Circular de Envío de Cuenta Anual y Mensaje a la Comunidad'
                : '1. Carta de Puesta a Disposición de Entrega (Resguardo ante Inasistencia o Dilación)'}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
              {isAnnual
                ? 'Acredita que la administración puso oportunamente el balance y sus respaldos a disposición de los copropietarios antes de la Asamblea Ordinaria.'
                : 'Si el Comité o el administrador entrante posterga o no asiste a recibir las carpetas y llaves, esta carta y notificación escrita acreditan tu cumplimiento oportuno ante el JPL y el RNAC MINVU.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onPreviewDoc?.('carta_puesta_disposicion')}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-[#0F3D2E]" />
              <span>Ver Previa Carta PDF</span>
            </button>
            <button
              type="button"
              onClick={() => onPrintDoc?.('carta_puesta_disposicion', isAnnual ? 'Circular_Envio_Cuenta_Anual' : 'Carta_Puesta_a_Disposicion_Entrega')}
              className="px-4 py-2 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-[#D4B895]" />
              <span>Imprimir Carta Oficial</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
              {isAnnual ? 'Lugar o Enlace de la Asamblea' : 'Lugar de Entrega / Puesta a Disposición'}
            </label>
            <input
              type="text"
              value={handoverPlace}
              onChange={(e) => setHandoverPlace(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-[#0F3D2E]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
              Hora Citada
            </label>
            <input
              type="text"
              value={handoverTime}
              onChange={(e) => setHandoverTime(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-[#0F3D2E]"
            />
          </div>
        </div>

        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-black text-slate-800 uppercase">
              Texto Oficial Listo para WhatsApp y Correo Electrónico
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopy('wa', whatsappText, 'Mensaje de WhatsApp')}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                {copiedKey === 'wa' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#0F3D2E]" />}
                <span>Copiar Mensaje</span>
              </button>

              <button
                type="button"
                onClick={() => handleCopy('mail', `Asunto: ${emailSubject}\n\n${whatsappText.replace(/\*/g, '')}`, 'Correo con asunto')}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                {copiedKey === 'mail' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Mail className="w-3.5 h-3.5 text-[#0F3D2E]" />}
                <span>Copiar para Correo</span>
              </button>

              <button
                type="button"
                onClick={handleOpenWhatsAppWeb}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Enviar por WhatsApp</span>
              </button>
            </div>
          </div>

          <pre className="whitespace-pre-wrap font-sans text-xs text-slate-700 bg-white p-3.5 rounded-xl border border-slate-200 leading-relaxed max-h-56 overflow-y-auto">
            {whatsappText}
          </pre>
        </div>
      </div>

      {/* 2. CONTROL DE BAJA DE MANDATOS Y REPRESENTACIÓN LEGAL (SOLO EN FASE B: TRASPASO) */}
      {!isAnnual && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 md:p-6 shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900">
                  Desvinculación de RUT Saliente • {completedMandates}/{MANDATE_ENTITIES.length} verificados
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                2. Control Post-Firma de Baja de Mandatos (Banco, SII, Previred, DT y MINVU)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                Verifica que el Comité y la nueva administración actualicen la personería legal en estas 5 entidades para que tu RUT ({company.adminRut}) no siga figurando como representante de la comunidad.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onPreviewDoc?.('constancia_baja_mandatos')}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-[#0F3D2E]" />
                <span>Ver Previa Constancia</span>
              </button>
              <button
                type="button"
                onClick={() => onPrintDoc?.('constancia_baja_mandatos', 'Constancia_Baja_Mandatos_y_Personeria')}
                className="px-4 py-2 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5 text-[#D4B895]" />
                <span>Imprimir Hoja de Ruta PDF</span>
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
            {MANDATE_ENTITIES.map((item) => {
              const checked = Boolean(mandateChecks[item.id]);
              return (
                <div
                  key={item.id}
                  onClick={() => onToggleMandateCheck?.(item.id)}
                  className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-colors ${
                    checked ? 'bg-emerald-50/50' : 'bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-black text-slate-900">{item.entity}</div>
                    <p className="text-[11px] text-slate-600">{item.detail}</p>
                    <span className="text-[10px] font-mono text-[#0F3D2E] font-bold block">
                      Plazo exigido en Acta: {item.deadline}
                    </span>
                  </div>

                  <span
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border shrink-0 self-start sm:self-center ${
                      checked
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-600 border-slate-300'
                    }`}
                  >
                    {checked ? '✓ Baja Verificada' : 'Marcar Baja'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. CIERRE HISTÓRICO EN CARTERA (ENTREGAR COMUNIDAD SIN BORRAR DATOS / ARCHIVAR CUENTA ANUAL) */}
      <div className="bg-white rounded-3xl border-2 border-[#0F3D2E]/25 p-5 md:p-6 shadow-xs space-y-4">
        {!isAnnual ? (
          <>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#0F3D2E] text-[#D4B895]">
                  Resguardo Legal Permanente • No Eliminar Comunidad
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  3. Formalizar Cierre y Pasar Comunidad a «Archivo Histórico (Entregada)»
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                  Nunca elimines una comunidad entregada: la ley exige conservar tus respaldos financieros y laborales ante eventuales consultas futuras. Al pasarla a <strong>Archivo Histórico</strong>, se descuenta de tus condominios activos en <em>Mis Comunidades</em> pero mantiene intacto todo su expediente.
                </p>
              </div>

              {isAlreadyHandedOver ? (
                <button
                  type="button"
                  onClick={onReactivateCommunity}
                  className="px-4 py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 text-xs font-black flex items-center gap-2 cursor-pointer shrink-0"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reactivar en Cartera Activa</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onArchiveHandover}
                  className="px-5 py-3 rounded-2xl bg-[#0F3D2E] hover:bg-[#0A291F] text-[#D4B895] text-xs font-black flex items-center gap-2 cursor-pointer shadow-sm shrink-0"
                >
                  <Archive className="w-4 h-4" />
                  <span>Marcar como Comunidad Entregada</span>
                </button>
              )}
            </div>

            {isAlreadyHandedOver && currentCommunity?.handoverRecord && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <strong className="block text-sm font-black text-[#0F3D2E]">
                    ✓ Comunidad Archivada como ENTREGADA CONFORME
                  </strong>
                  <span>
                    Fecha corte: <strong>{currentCommunity.handoverRecord.date}</strong> • Receptor:{' '}
                    <strong>{currentCommunity.handoverRecord.incomingAdminName || currentCommunity.handoverRecord.committeeRepName || 'Comité de Administración'}</strong> • Disponible entregado:{' '}
                    <strong>{formatCLP(currentCommunity.handoverRecord.availableNet)}</strong> • Pauta: <strong>{currentCommunity.handoverRecord.checklistScore}%</strong>
                  </span>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#0F3D2E] text-[#D4B895]">
                Trazabilidad Multianual • Art. 21 Ley 21.442
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                2. Congelar y Archivar Rendición Anual en el Historial del Condominio
              </h3>
              <p className="text-xs text-slate-600">
                Guarda una fotografía inalterable del cierre anual presentado a la Asamblea Ordinaria para futuras auditorías y apertura del siguiente ejercicio.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Acuerdo de la Asamblea</label>
                <select
                  value={annualResultStatus}
                  onChange={(e) => setAnnualResultStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-900"
                >
                  <option value="APROBADA SIN OBSERVACIONES">Aprobada sin observaciones</option>
                  <option value="APROBADA CON OBSERVACIONES">Aprobada con observaciones</option>
                  <option value="PENDIENTE SEGUNDA CITACIÓN">Pendiente / En revisión Comité</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Quórum de Asistencia (%)</label>
                <input
                  type="text"
                  value={annualQuorumPct}
                  onChange={(e) => setAnnualQuorumPct(e.target.value)}
                  placeholder="Ej: 58.5%"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Folio Libro de Actas / Nota</label>
                <input
                  type="text"
                  value={annualArchiveNote}
                  onChange={(e) => setAnnualArchiveNote(e.target.value)}
                  placeholder="Ej: Acta Ordinaria N° 04, folios 45–49"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() =>
                  onArchiveAnnualRendition?.({
                    periodLabel: meta.annualPeriodLabel,
                    assemblyDate: meta.assemblyDate,
                    resultStatus: annualResultStatus,
                    quorumPct: annualQuorumPct,
                    note: annualArchiveNote
                  })
                }
                className="px-5 py-2.5 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-[#D4B895] text-xs font-black flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <History className="w-4 h-4" />
                <span>Guardar Cuenta Anual en Historial Oficial</span>
              </button>
            </div>

            {annualHistory.length > 0 && (
              <div className="border border-slate-200 rounded-2xl overflow-hidden mt-3">
                <div className="bg-slate-50 px-4 py-2 text-[11px] font-black text-slate-800 uppercase border-b border-slate-200">
                  Historial de Rendiciones Anuales Archivadas ({annualHistory.length})
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {annualHistory.map((h) => (
                    <div key={h.id} className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <strong className="text-slate-900">{h.periodLabel}</strong> • Asamblea {h.assemblyDate} • Quórum {h.quorumPct}%
                        {h.note && <span className="text-slate-500"> ({h.note})</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-slate-600">
                          Banco: {formatCLP(h.bankBalance)} | Reserva: {formatCLP(h.reserveFund)}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                          {h.resultStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
