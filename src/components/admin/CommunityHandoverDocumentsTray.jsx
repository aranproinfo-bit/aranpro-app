import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  FileText,
  Download,
  Eye,
  Printer,
  ExternalLink,
  CheckCircle2,
  Clock,
  Scale,
  Landmark,
  Users,
  Wrench,
  Key,
  Lock,
  ClipboardList,
  Building2,
  Plus,
  Trash2,
  X,
  Edit3,
  FolderOpen,
  Sparkles,
  CheckSquare,
  Calculator,
  AlertTriangle,
  PackageCheck,
  Database,
  Mail,
  ShieldCheck
} from 'lucide-react';
import { formatCLP } from '../../utils/formatters';
import { printDocumentDirectly } from '../../utils/printDocument';
import { vaultGet, openDataUrlInNewTab, downloadDataUrl } from '../../utils/fileVault';
import { AranproPdfStyleSelector } from '../common/MauranLogo';
import {
  CanonicalPdfHeader,
  CanonicalPdfPageFooter,
  CanonicalPdfFinalSignature
} from '../common/CanonicalPdfParts';
import {
  CommunityHandoverPautaPrint,
  handoverPautaPrintStyles
} from './CommunityHandoverChecklist';

const chunkArray = (arr, size) => {
  if (!Array.isArray(arr) || arr.length === 0) return [[]];
  const out = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
};

const downloadTextFile = (content, filename, mime = 'text/plain;charset=utf-8') => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
};

/**
 * Calcula la Cuadratura Contable Peso a Peso de Corte
 */
export const computeHandoverReconciliation = (docState = {}, live = {}) => {
  const bank = Number(docState.bankStatementBalance ?? live.bankBalance) || 0;
  const cash = Number(docState.pettyCashBalance) || 0;
  const transit = Number(docState.inTransitChecks) || 0;
  const realAvailable = bank + cash - transit;

  const reserve = Number(docState.reserveFundDeclared ?? live.reserveFund) || 0;
  const special = Number(docState.specialFundsDeclared) || 0;
  const defaultOp = Math.max(0, realAvailable - reserve - special);
  const operational =
    docState.operationalFundDeclared !== undefined && docState.operationalFundDeclared !== null
      ? Number(docState.operationalFundDeclared) || 0
      : defaultOp;

  const declaredTotal = operational + reserve + special;
  const diff = realAvailable - declaredTotal;
  const pendingPayables = Number(docState.pendingInvoicesAmount) || 0;

  return {
    bank,
    cash,
    transit,
    realAvailable,
    operational,
    reserve,
    special,
    declaredTotal,
    diff,
    isBalanced: diff === 0,
    pendingPayables,
    discrepancyNotes: docState.discrepancyNotes || ''
  };
};

/**
 * Envoltorio maestro de Hoja Carta Canónica (279.4mm) con el mismo estilo visual del Checklist
 */
function CanonicalSheet({
  page,
  totalPages,
  badge,
  description,
  label,
  meta,
  live,
  company,
  pdfStyle,
  continueLabel,
  showSigners = false,
  signers = [],
  children
}) {
  const isLast = page === totalPages;
  return (
    <div
      data-pdf-style={pdfStyle}
      className="dossier-page bg-white p-6 pl-10 flex flex-col justify-between text-slate-900 relative overflow-hidden shadow-md mx-auto w-full max-w-[850px]"
      style={{ fontFamily: 'Arial, sans-serif', minHeight: '1050px', fontSize: '10px' }}
    >
      <div>
        <CanonicalPdfHeader
          badge={badge}
          description={description}
          community={meta.communityName || live.communityName}
          page={page}
          email={company.email}
          phone={company.phone}
          city={meta.city || live.city}
        />
        {children}

        {isLast && showSigners && signers.length > 0 && (
          <div className="grid grid-cols-2 gap-x-10 gap-y-10 mt-8 text-[9.5px]">
            {signers.map(([roleTitle, subLine]) => (
              <div className="border-t border-slate-500 pt-1" key={roleTitle}>
                <strong className="block text-slate-900">{roleTitle}</strong>
                <span className="text-slate-600 text-[8.5px]">{subLine}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        {!isLast ? (
          <div className="border-y border-slate-300 py-1.5 mb-1 flex justify-between items-center text-slate-600 text-[9px]">
            <span>{continueLabel || 'Continúa detalle oficial en hoja siguiente.'}</span>
            <span className="border border-emerald-200 rounded-full bg-emerald-50 px-3.5 py-0.5 text-[#0F3D2E] font-bold">
              Continúa en página {page + 1} →
            </span>
          </div>
        ) : (
          <CanonicalPdfFinalSignature
            companyRut={company.companyRut}
            phone={company.phone}
            email={company.email}
            website={company.website}
            signature={company.signature}
            signatureScale={company.signatureScale}
            adminName={company.adminName}
            adminRut={company.adminRut}
          />
        )}

        <CanonicalPdfPageFooter
          website={company.website}
          label={label}
          page={page}
          totalPages={totalPages}
          city={meta.city || live.city}
        />
      </div>
    </div>
  );
}

/**
 * Renderizador Canónico Unificado para todos los documentos oficiales del expediente de Entrega / Rendición Anual
 */
export function CanonicalHandoverDocumentPrint({
  docKey,
  phase = 'traspaso',
  currentCommunity = {},
  getUnitFinancials,
  live = {},
  meta = {},
  company = {},
  sections = [],
  entries = {},
  docState = {},
  mandateChecks = {},
  pdfStyle = 'alt4',
  printableId = 'printable-handover-selected-doc'
}) {
  const isAnnual = phase === 'anual';
  const condoLabel = [
    meta.communityName || live.communityName,
    meta.communityRut || live.communityRut ? `RUT ${meta.communityRut || live.communityRut}` : ''
  ]
    .filter(Boolean)
    .join(' · ');

  const outgoingStr = [meta.outgoingAdminName, meta.outgoingAdminRut ? `RUT ${meta.outgoingAdminRut}` : '']
    .filter(Boolean)
    .join(' · ');
  const committeeStr = [
    meta.committeeRepName,
    meta.committeeRepRole,
    meta.committeeRepUnit ? `Unid. ${meta.committeeRepUnit}` : ''
  ]
    .filter(Boolean)
    .join(' · ');
  const incomingStr = [meta.incomingAdminName, meta.incomingAdminRut ? `RUT ${meta.incomingAdminRut}` : '']
    .filter(Boolean)
    .join(' · ');

  const handoverSigners = [
    ['Por el Comité de Administración', committeeStr || 'Nombre, cargo y RUT'],
    ['Administrador(a) saliente (Entrega)', outgoingStr || 'Nombre y RUT'],
    ['Administrador(a) entrante (Recibe)', incomingStr || 'Nombre y RUT'],
    ['Testigo o receptor(a) de respaldo', meta.witnessName || 'Nombre y cargo']
  ];

  const annualSigners = [
    ['Por el Comité de Administración', committeeStr || 'Presidente(a) Comité · Nombre y RUT'],
    ['Comisión Revisora / Tesorería', meta.witnessName || 'Nombre, unidad y firma'],
    ['Administrador(a) Titular', outgoingStr || 'Nombre y RUT'],
    ['Secretario(a) / Ministro de Fe Asamblea', 'Nombre, cargo y firma']
  ];

  const activeSigners = isAnnual ? annualSigners : handoverSigners;
  const rec = computeHandoverReconciliation(docState, live);

  // ==================== 0. PORTADA OFICIAL DEL DOSSIER COMPLETO ====================
  if (docKey === 'portada_expediente') {
    const indexRows = isAnnual
      ? [
          ['Sección I', 'Pauta Oficial de Control de Rendición Anual (Bloques A–F)', '3 Páginas'],
          ['Sección II', 'Informe Ejecutivo y Balance Anual de Gestión (Art. 21°)', '1 Página'],
          ['Sección III', 'Circular Oficial de Envío Anticipado de Cuenta Anual (Art. 19°)', '1 Página'],
          ['Sección IV', 'Acta Modelo de Asamblea Ordinaria de Aprobación de Cuentas', '1 Página'],
          ['Sección V', 'Detalle Contable de Egresos y Estado de Respaldos Tributarios', 'Según registros'],
          ['Sección VI', 'Padrón de Copropietarios Hábiles, Morosidad y Convenios', 'Según padrón'],
          ['Sección VII', 'Informe Anual de Personal, Previred y Cumplimiento Ley Bustos', '1 Página'],
          ['Sección VIII', 'Memoria Anual de Proveedores y Mantenciones Preventivas', '1 Página'],
          ['Sección IX', 'Propuesta de Presupuesto Operativo Proyectado Nuevo Año', '1 Página']
        ]
      : [
          ['Sección I', 'Pauta Oficial de Entrega y Traspaso de Administración (Bloques A–G)', '3 Páginas'],
          ['Sección II', 'Acta Oficial de Entrega, Recepción y Cierre Financiero', '2 Páginas'],
          ['Sección III', 'Carta de Puesta a Disposición de Entrega (Blindaje RNAC Art. 87°)', '1 Página'],
          ['Sección IV', 'Constancia y Hoja de Ruta de Baja de Mandatos (Banco, SII, DT, MINVU)', '1 Página'],
          ['Sección V', 'Rendición Financiera Documentada y Detalle de Egresos al Corte', 'Según registros'],
          ['Sección VI', 'Padrón Oficial de Copropietarios, Morosidad y Saldos a Favor', 'Según padrón'],
          ['Sección VII', 'Nómina Laboral, Previred y Constancia Ley Bustos (Ley 19.631)', '1 Página'],
          ['Sección VIII', 'Catastro de Proveedores y Bitácora de Mantenciones Preventivas', '1 Página'],
          ['Sección IX', 'Acta de Inventario Físico de Llaves Maestras y Bienes Comunes', '1 Página'],
          ['Sección X', 'Protocolo Seguro de Traspaso y Revocación de Accesos Digitales', '1 Página']
        ];

    return (
      <div id={printableId} data-pdf-style={pdfStyle}>
        <CanonicalSheet
          page={1}
          totalPages={1}
          badge={isAnnual ? 'DOSSIER ANUAL ART. 21' : 'DOSSIER DE TRASPASO'}
          description="Expediente íntegro foliado"
          label={isAnnual ? 'Expediente Rendición Anual' : 'Expediente Oficial de Traspaso'}
          meta={meta}
          live={live}
          company={company}
          pdfStyle={pdfStyle}
        >
          <div className="mt-4 mb-4 p-5 bg-[#0F3D2E] text-white rounded-xl border border-[#D4B895]">
            <span className="text-[9px] font-black uppercase tracking-widest text-[#D4B895] block">
              COMPENDIO OFICIAL EMITIDO CONFORME A LA LEY N° 21.442 Y DS N° 7 MINVU
            </span>
            <h2 className="text-base font-black uppercase mt-1 text-white">
              {isAnnual
                ? `EXPEDIENTE OFICIAL DE RENDICIÓN DE CUENTAS ANUAL (${meta.annualPeriodLabel})`
                : `EXPEDIENTE INTEGRAL DE ENTREGA Y TRASPASO DE ADMINISTRACIÓN`}
            </h2>
            <p className="text-[10px] text-emerald-100 mt-1">
              Condominio: <strong>{condoLabel}</strong> • {meta.city || live.city} • Fecha:{' '}
              <strong>{isAnnual ? meta.assemblyDate : meta.handoverDate}</strong>
            </p>
          </div>

          <div className="transition-metadata grid grid-cols-3 border border-slate-300 text-[9px] mb-3">
            {[
              ['DISPONIBLE LÍQUIDO CORTE', formatCLP(rec.realAvailable)],
              ['FONDO DE RESERVA (ART. 39)', formatCLP(rec.reserve)],
              ['CUADRATURA CONTABLE', rec.isBalanced ? 'CUADRADA ($0 DIF.)' : `DIF. ${formatCLP(rec.diff)}`],
              [isAnnual ? 'ADMINISTRACIÓN TITULAR' : 'ADMINISTRACIÓN SALIENTE', outgoingStr],
              ['REPRESENTANTE COMITÉ', committeeStr || 'Por suscribir'],
              [isAnnual ? 'UNIDADES AL DÍA' : 'ADMINISTRACIÓN ENTRANTE', isAnnual ? `${live.paidUnitsCount}/${live.totalUnits} unidades` : (incomingStr || 'Por designar / Comité')]
            ].map(([lbl, val]) => (
              <div key={lbl} className="border border-slate-200 p-1.5">
                <strong className="block text-slate-800">{lbl}</strong>
                <span>{val}</span>
              </div>
            ))}
          </div>

          <div className="border border-slate-300 mb-3">
            <div className="bg-[#0F3D2E] text-white font-bold px-2.5 py-1.5 uppercase text-[9.5px]">
              Índice maestro de documentos contenidos en este expediente oficial
            </div>
            <table className="w-full border-collapse" style={{ fontSize: '9px' }}>
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 p-1.5 text-left w-[16%]">Sección</th>
                  <th className="border border-slate-300 p-1.5 text-left w-[66%]">Documento oficial incluido</th>
                  <th className="border border-slate-300 p-1.5 text-center w-[18%]">Extensión</th>
                </tr>
              </thead>
              <tbody>
                {indexRows.map(([sec, name, ext]) => (
                  <tr key={sec}>
                    <td className="border border-slate-300 p-1.5 font-bold text-[#0F3D2E]">{sec}</td>
                    <td className="border border-slate-300 p-1.5 font-medium">{name}</td>
                    <td className="border border-slate-300 p-1.5 text-center">{ext}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CanonicalSheet>
      </div>
    );
  }

  // ==================== 1. ACTA OFICIAL DE ENTREGA Y RECEPCIÓN (2 PÁGS) ====================
  if (docKey === 'acta_entrega_final') {
    const allItems = sections.flatMap((s) => s.items);
    const pendingItems = allItems.filter((it) => entries[it.id]?.status === 'pendiente').slice(0, 6);

    return (
      <div id={printableId} data-pdf-style={pdfStyle} className="space-y-6">
        <CanonicalSheet
          page={1}
          totalPages={2}
          badge="ACTA DE TRASPASO"
          description="Entrega formal Ley N° 21.442"
          label="Acta de Entrega de Administración"
          meta={meta}
          live={live}
          company={company}
          pdfStyle={pdfStyle}
          continueLabel="Continúa: consolidado documental A–G, cláusula de baja de mandatos y firmas oficiales."
        >
          <div className="transition-title text-center mt-2.5 mb-2.5">
            <h2 className="text-sm font-black uppercase">
              ACTA OFICIAL DE ENTREGA, RECEPCIÓN Y CIERRE DE ADMINISTRACIÓN
            </h2>
            <p className="text-[#0F3D2E] font-bold">
              Instrumento de entrega material, cuadratura financiera y resguardo jurídico (Arts. 20° y 21° Ley N° 21.442)
            </p>
          </div>

          <div className="transition-metadata grid grid-cols-3 border border-slate-300 text-[9px] mb-2.5">
            {[
              ['COMUNIDAD', condoLabel],
              ['FECHA DE ENTREGA / CORTE', meta.handoverDate || '________________________'],
              ['MODALIDAD DE ENTREGA', meta.modality ? meta.modality.toUpperCase() : 'MIXTA (FÍSICA + DIGITAL)'],
              ['ADMINISTRACIÓN SALIENTE', outgoingStr || '________________________'],
              ['COMITÉ DE ADMINISTRACIÓN', committeeStr || '________________________'],
              ['ADMINISTRACIÓN ENTRANTE', incomingStr || '________________________']
            ].map(([lbl, val]) => (
              <div key={lbl} className="border border-slate-200 p-1">
                <strong className="block text-slate-800">{lbl}</strong>
                <span>{val}</span>
              </div>
            ))}
          </div>

          <p className="bg-emerald-50 border border-emerald-200 p-2 mb-2.5 text-[9px] leading-snug text-slate-800">
            <strong>Comparecencia y objeto.</strong> En <strong>{meta.city || live.city}</strong>, a{' '}
            <strong>{meta.handoverDate || 'la fecha indicada'}</strong>, comparecen las partes individualizadas con el objeto de formalizar la entrega material, contable, laboral, técnica y digital de la administración del condominio <strong>{meta.communityName || live.communityName}</strong>, conforme a la Ley N° 21.442.
          </p>

          <div className="border border-slate-300 mb-2.5">
            <div className="bg-[#0F3D2E] text-white font-bold px-2 py-1 uppercase text-[9.5px] flex justify-between">
              <span>1. Arqueo financiero y cuadratura peso a peso de fondos al corte ({live.periodLabel})</span>
              <span className="text-[#D4B895]">{rec.isBalanced ? '✓ CUADRADO ($0 DIF.)' : `DIF.: ${formatCLP(rec.diff)}`}</span>
            </div>
            <table className="w-full border-collapse" style={{ fontSize: '8.8px' }}>
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 p-1 text-left w-[58%]">Concepto financiero / partida de cuadratura</th>
                  <th className="border border-slate-300 p-1 text-left w-[22%]">Referencia / Respaldo</th>
                  <th className="border border-slate-300 p-1 text-right w-[20%]">Monto ($ CLP)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 p-1 font-bold">(+) Saldo según cartola bancaria oficial ({live.bankName})</td>
                  <td className="border border-slate-300 p-1">{live.bankAccount ? `Cta. N° ${live.bankAccount}` : 'Cartola al corte'}</td>
                  <td className="border border-slate-300 p-1 text-right font-bold">{formatCLP(rec.bank)}</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-1">(+) Efectivo arqueado en Caja Chica</td>
                  <td className="border border-slate-300 p-1">Arqueo presencial</td>
                  <td className="border border-slate-300 p-1 text-right">{formatCLP(rec.cash)}</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-1">(-) Cheques girados / pagos en tránsito no cobrados</td>
                  <td className="border border-slate-300 p-1">Conciliación bancaria</td>
                  <td className="border border-slate-300 p-1 text-right">{formatCLP(rec.transit)}</td>
                </tr>
                <tr className="bg-emerald-50/80">
                  <td className="border border-slate-300 p-1 font-black text-[#0F3D2E]">(=) DISPONIBLE LÍQUIDO REAL EN CUSTODIA</td>
                  <td className="border border-slate-300 p-1 font-bold text-[#0F3D2E]">Total arqueado</td>
                  <td className="border border-slate-300 p-1 text-right font-black text-[#0F3D2E]">{formatCLP(rec.realAvailable)}</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-1">Desglose contable: Fondo Operacional ({formatCLP(rec.operational)}) + Fondo Reserva ({formatCLP(rec.reserve)}) + Especiales ({formatCLP(rec.special)})</td>
                  <td className="border border-slate-300 p-1">{rec.isBalanced ? 'Cuadratura exacta' : 'Con nota aclaratoria'}</td>
                  <td className="border border-slate-300 p-1 text-right font-bold">{formatCLP(rec.declaredTotal)}</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-1">Cartera morosa por cobrar ({live.delinquentUnitsCount} unid.) / Saldos a favor</td>
                  <td className="border border-slate-300 p-1">{live.repactacionCount} convenio(s) Art. 35°</td>
                  <td className="border border-slate-300 p-1 text-right">{formatCLP(live.totalPendingDebt)} / {formatCLP(live.totalFavorBalance)}</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-1">Cuentas y facturas de proveedores devengadas por pagar</td>
                  <td className="border border-slate-300 p-1">Pasivos informados</td>
                  <td className="border border-slate-300 p-1 text-right">{formatCLP(rec.pendingPayables)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {!rec.isBalanced && rec.discrepancyNotes && (
            <div className="border border-amber-300 bg-amber-50 p-1.5 mb-2 text-[8.6px]">
              <strong>Justificación contable de diferencia ({formatCLP(rec.diff)}):</strong> {rec.discrepancyNotes}
            </div>
          )}

          <div className="space-y-2 text-[8.9px] leading-snug text-slate-800">
            <div className="border border-slate-300 p-2">
              <strong className="text-[#0F3D2E] uppercase block mb-0.5">2. Personal, Previred y Ley Bustos:</strong>
              <span>
                {live.staffCount > 0
                  ? `Se traspasan las carpetas y respaldos previsionales de ${live.staffCount} trabajador(es) vigente(s) (${live.staffNames}), acreditando cotizaciones al día conforme al anexo laboral.`
                  : 'La comunidad no mantiene trabajadores con contrato laboral directo vigente a la fecha de entrega, sin existir contingencias laborales directas.'}
              </span>
            </div>
            <div className="border border-slate-300 p-2">
              <strong className="text-[#0F3D2E] uppercase block mb-0.5">3. Custodia física, proveedores y continuidad digital:</strong>
              <span>
                Se entregan los archivos legales, directorio de {live.providersCount} proveedor(es), bitácora de {live.maintenancesCount} mantenciones, llaves y activos según Anexo de Inventario, junto con el respaldo exportable de base de datos y credenciales digitales.
              </span>
            </div>
          </div>
        </CanonicalSheet>

        <CanonicalSheet
          page={2}
          totalPages={2}
          badge="ACTA DE TRASPASO"
          description="Mandatos, pendientes y firmas"
          label="Acta de Entrega de Administración"
          meta={meta}
          live={live}
          company={company}
          pdfStyle={pdfStyle}
          showSigners={true}
          signers={handoverSigners}
        >
          <div className="transition-title text-center mt-2 mb-2">
            <h2 className="text-sm font-black uppercase">
              CONSOLIDADO DOCUMENTAL, BAJA DE MANDATOS Y SUSCRIPCIÓN OFICIAL
            </h2>
            <p className="text-[#0F3D2E] font-bold">
              Estado por bloques A–G, desvinculación de personería ante terceros y plazo de revisión
            </p>
          </div>

          <div className="border border-slate-300 mb-2.5">
            <div className="bg-[#0F3D2E] text-white font-bold px-2 py-1 uppercase text-[9px]">
              4. Consolidado de antecedentes según Pauta Oficial (Bloques A al G)
            </div>
            <table className="w-full border-collapse" style={{ fontSize: '8.6px' }}>
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 p-1 text-left w-[48%]">Bloque de antecedentes</th>
                  <th className="border border-slate-300 p-1 text-center w-[13%]">Total</th>
                  <th className="border border-slate-300 p-1 text-center w-[13%]">Entregados</th>
                  <th className="border border-slate-300 p-1 text-center w-[13%]">Pendientes</th>
                  <th className="border border-slate-300 p-1 text-center w-[13%]">No aplica</th>
                </tr>
              </thead>
              <tbody>
                {sections.map((sec) => {
                  const ent = sec.items.filter((i) => entries[i.id]?.status === 'entregado').length;
                  const pen = sec.items.filter((i) => entries[i.id]?.status === 'pendiente').length;
                  const na = sec.items.filter((i) => entries[i.id]?.status === 'na').length;
                  return (
                    <tr key={sec.code}>
                      <td className="border border-slate-300 px-1.5 py-0.5 font-bold">{sec.title}</td>
                      <td className="border border-slate-300 p-0.5 text-center">{sec.items.length}</td>
                      <td className="border border-slate-300 p-0.5 text-center font-bold text-[#0F3D2E]">{ent}</td>
                      <td className="border border-slate-300 p-0.5 text-center">{pen}</td>
                      <td className="border border-slate-300 p-0.5 text-center">{na}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {pendingItems.length > 0 && (
            <div className="border border-slate-300 mb-2.5">
              <div className="bg-[#0F3D2E] text-white font-bold px-2 py-1 uppercase text-[9px]">
                5. Antecedentes pendientes con plazo de regularización acordado
              </div>
              <table className="w-full border-collapse" style={{ fontSize: '8.4px' }}>
                <tbody>
                  {pendingItems.map((it) => {
                    const e = entries[it.id] || {};
                    return (
                      <tr key={it.id}>
                        <td className="border border-slate-300 p-1 font-bold text-[#0F3D2E] w-[10%]">{it.code}</td>
                        <td className="border border-slate-300 p-1 w-[50%]">{it.title}</td>
                        <td className="border border-slate-300 p-1 w-[40%]">{[e.responsible, e.dueDate, e.notes].filter(Boolean).join(' · ') || meta.complementaryDeadline}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="border border-slate-300 p-2 mb-2 text-[8.8px] leading-snug bg-emerald-50/60">
            <strong className="text-[#0F3D2E] uppercase block mb-0.5">
              6. Cláusula expresa de revocación de mandatos y cambio de representante legal (SII, Banco, DT, Previred y MINVU):
            </strong>
            <p>
              El Comité de Administración y la Administración Entrante se obligan a tramitar, dentro de un plazo máximo de <strong>15 días hábiles</strong> desde el término de funciones, la reducción a escritura pública del nuevo nombramiento y la baja efectiva del RUT del administrador saliente (<strong>{company.adminRut}</strong>) ante <strong>{live.bankName}</strong>, <strong>SII (e-RUT)</strong>, <strong>Previred</strong>, <strong>Dirección del Trabajo (MiDT)</strong> y el <strong>Registro Nacional MINVU</strong>, liberándolo de toda responsabilidad por actos u obligaciones posteriores a esta entrega.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-300 p-2 text-[8.8px] leading-snug">
            <strong className="text-[#0F3D2E] uppercase block mb-0.5">7. Plazo de revisión contable y constancias:</strong>
            <p>
              Se fija un plazo de <strong>{meta.complementaryDeadline || '30 días corridos desde la recepción'}</strong> para formular observaciones fundadas por escrito respecto de la rendición entregada.
              {docState.actaNotes ? ` Nota adicional: ${docState.actaNotes}` : ''}
            </p>
          </div>
        </CanonicalSheet>
      </div>
    );
  }

  // ==================== 1B. CARTA OFICIAL DE PUESTA A DISPOSICIÓN (BLINDAJE ART. 87) / CIRCULAR ANUAL ====================
  if (docKey === 'carta_puesta_disposicion') {
    return (
      <div id={printableId} data-pdf-style={pdfStyle} className="space-y-6">
        <CanonicalSheet
          page={1}
          totalPages={1}
          badge={isAnnual ? 'CIRCULAR CUENTA ANUAL' : 'PUESTA A DISPOSICIÓN'}
          description={isAnnual ? 'Arts. 19° y 21° Ley N° 21.442' : 'Resguardo Arts. 20° y 87° Ley 21.442'}
          label={isAnnual ? 'Circular Cuenta Anual' : 'Carta Puesta a Disposición'}
          meta={meta}
          live={live}
          company={company}
          pdfStyle={pdfStyle}
          showSigners={true}
          signers={[
            [isAnnual ? 'Recibido Comité de Administración' : 'Acuse de Recibo Comité / Entrante', committeeStr || 'Nombre, RUT y fecha de recepción'],
            ['Emitido por Administración ARANPRO', outgoingStr]
          ]}
        >
          <div className="transition-title text-center mt-3 mb-3">
            <h2 className="text-sm font-black uppercase">
              {isAnnual
                ? 'CIRCULAR OFICIAL DE PUESTA A DISPOSICIÓN DE RENDICIÓN ANUAL DE CUENTAS'
                : 'NOTIFICACIÓN FORMAL DE PUESTA A DISPOSICIÓN DE EXPEDIENTE, FONDOS Y LLAVES'}
            </h2>
            <p className="text-[#0F3D2E] font-bold">
              {isAnnual
                ? `Comunicación previa a Asamblea Ordinaria • Ejercicio ${meta.annualPeriodLabel}`
                : 'Acreditación de entrega oportuna y citación a suscripción de Acta de Traspaso'}
            </p>
          </div>

          <div className="space-y-3 text-[9.5px] leading-relaxed text-slate-800 mt-2">
            <div className="border border-slate-300 bg-slate-50 p-2.5">
              <p><strong>FECHA Y LUGAR:</strong> {meta.city || live.city}, {isAnnual ? meta.assemblyDate : meta.handoverDate}</p>
              <p><strong>DESTINATARIO(S):</strong> {isAnnual ? `Copropietarios y Comité de Administración de ${condoLabel}` : `Comité de Administración (${committeeStr || 'Presente'})${meta.incomingAdminName ? ` y Administración Entrante (${incomingStr})` : ''}`}</p>
              <p><strong>REFERENCIA LEGAL:</strong> {isAnnual ? 'Entrega anticipada de balance y respaldos para Asamblea Ordinaria (Arts. 19° y 21° Ley N° 21.442).' : 'Citación formal a recepción material, financiera y documental de administración (Arts. 20°, 21° y 87° Ley N° 21.442).'}</p>
            </div>

            {isAnnual ? (
              <>
                <p>
                  Por medio de la presente, la Administración de <strong>{meta.communityName || live.communityName}</strong> cumple con informar y poner formalmente a disposición de todos los copropietarios el <strong>Informe Anual de Gestión, Balance de Ingresos y Egresos, Conciliación Bancaria y Estado de Fondos</strong> correspondientes al período <strong>{meta.annualPeriodLabel}</strong>.
                </p>
                <p>
                  El expediente completo —incluyendo el detalle de {live.expensesCount} egresos registrados, cartolas de {live.bankName} (saldo ref. {formatCLP(rec.bank)}), estado del Fondo de Reserva ({formatCLP(rec.reserve)}), padrón de recaudación ({live.paidUnitsCount}/{live.totalUnits} unidades al día) y certificados laborales— se encuentra habilitado para revisión previa antes de la Asamblea Ordinaria fijada para el <strong>{meta.assemblyDate || 'día citado'}</strong>.
                </p>
              </>
            ) : (
              <>
                <p>
                  Por medio del presente instrumento, y en estricto cumplimiento de las obligaciones establecidas en los artículos 20° y 21° de la Ley N° 21.442 sobre Copropiedad Inmobiliaria, comunicamos formalmente que la totalidad de los antecedentes legales, contables, bancarios, laborales, técnicos, llaves maestras y respaldos digitales del condominio <strong>{meta.communityName || live.communityName}</strong> se encuentran consolidados, foliados y a su entera disposición para entrega material e inmediata.
                </p>

                <div className="border border-slate-300 p-2.5 space-y-1 bg-white">
                  <strong className="text-[#0F3D2E] uppercase block">Detalle resumido puesto a disposición en este acto:</strong>
                  <div>1. <strong>Pauta Oficial de Entrega (3 páginas, Bloques A–G)</strong> y <strong>Acta de Traspaso en triplicado</strong>.</div>
                  <div>2. <strong>Corte Financiero Cuadrado:</strong> Disponible líquido conciliado de <strong>{formatCLP(rec.realAvailable)}</strong> en {live.bankName} y Fondo de Reserva de <strong>{formatCLP(rec.reserve)}</strong>.</div>
                  <div>3. <strong>Padrón y Cobranza:</strong> Estado individual de las <strong>{live.totalUnits} unidades</strong>, morosidad y saldos a favor.</div>
                  <div>4. <strong>Carpeta Laboral, Proveedores, Inventario de Llaves y Protocolo de Revocación de Claves Digitales</strong>.</div>
                  <div>5. <strong>Exportación Abierta de Datos (CSV/JSON)</strong> para continuidad inmediata en cualquier software.</div>
                </div>

                <p className="bg-emerald-50 border border-emerald-200 p-2.5">
                  <strong>Constancia de diligencia y resguardo legal:</strong> Se deja expresa constancia de la plena disposición de esta Administración Saliente para materializar la entrega en la fecha acordada (<strong>{meta.handoverDate}</strong>). En caso de inasistencia o reprogramación solicitada por la parte receptora, la presente comunicación acredita el cumplimiento oportuno del deber de entrega y rendición para todos los efectos legales y ante el Registro Nacional de Administradores de Condominios (MINVU).
                </p>
              </>
            )}
          </div>
        </CanonicalSheet>
      </div>
    );
  }

  // ==================== 1C. CONSTANCIA Y HOJA DE RUTA DE BAJA DE MANDATOS ====================
  if (docKey === 'constancia_baja_mandatos') {
    const mandateRows = [
      ['mand_banco', `Institución Bancaria (${live.bankName})`, 'Revocación de firma/apoderado en cuenta corriente y baja de Token', 'Máx. 5 días hábiles'],
      ['mand_sii', 'Servicio de Impuestos Internos (SII • e-RUT)', `Baja de RUT ${company.adminRut} como representante tributario del condominio`, 'Máx. 15 días hábiles'],
      ['mand_previred', 'Portal Previred (Empleador Comunidad)', 'Desvinculación de perfil administrador previsional de la comunidad', 'Inmediato post-cierre'],
      ['mand_dt', 'Dirección del Trabajo (Portal MiDT)', 'Actualización de representante laboral electrónico y correo de avisos', 'Máx. 10 días hábiles'],
      ['mand_minvu', 'Plataforma Registro Condominios MINVU', 'Inscripción de acta de nueva administración y cese del saliente', 'Máx. 15 días hábiles']
    ];

    return (
      <div id={printableId} data-pdf-style={pdfStyle} className="space-y-6">
        <CanonicalSheet
          page={1}
          totalPages={1}
          badge="BAJA DE MANDATOS"
          description="Desvinculación de personería legal"
          label="Constancia Baja de Mandatos"
          meta={meta}
          live={live}
          company={company}
          pdfStyle={pdfStyle}
          showSigners={true}
          signers={handoverSigners}
        >
          <div className="transition-title text-center mt-2.5 mb-2.5">
            <h2 className="text-sm font-black uppercase">
              CONSTANCIA Y COMPROMISO DE BAJA DE MANDATOS Y REPRESENTACIÓN LEGAL
            </h2>
            <p className="text-[#0F3D2E] font-bold">
              Desvinculación formal del Administrador Saliente ante Bancos, SII, Previred, DT y MINVU
            </p>
          </div>

          <p className="bg-emerald-50 border border-emerald-200 p-2 mb-3 text-[9px] text-slate-800">
            <strong>Objeto del documento:</strong> Habiéndose puesto término a la gestión de <strong>{outgoingStr}</strong> en el condominio <strong>{condoLabel}</strong> con fecha <strong>{meta.handoverDate}</strong>, el Comité de Administración y la nueva administración asumen el compromiso de actualizar la representación legal ante los siguientes organismos dentro de los plazos indicados:
          </p>

          <div className="border border-slate-300 mb-3">
            <div className="bg-[#0F3D2E] text-white font-bold px-2 py-1 uppercase text-[9.5px]">
              Matriz obligatoria de revocación de poderes y actualización de representante
            </div>
            <table className="w-full border-collapse" style={{ fontSize: '8.8px' }}>
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 p-1.5 text-left w-[27%]">Organismo / Entidad</th>
                  <th className="border border-slate-300 p-1.5 text-left w-[43%]">Gestión requerida del Comité / Entrante</th>
                  <th className="border border-slate-300 p-1.5 text-left w-[18%]">Plazo máximo</th>
                  <th className="border border-slate-300 p-1.5 text-center w-[12%]">Verificado</th>
                </tr>
              </thead>
              <tbody>
                {mandateRows.map(([id, ent, desc, pl]) => (
                  <tr key={id}>
                    <td className="border border-slate-300 p-1.5 font-bold">{ent}</td>
                    <td className="border border-slate-300 p-1.5">{desc}</td>
                    <td className="border border-slate-300 p-1.5 font-bold text-[#0F3D2E]">{pl}</td>
                    <td className="border border-slate-300 p-1.5 text-center text-[10.5px]">{mandateChecks[id] ? '☒' : '☐'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="border border-slate-300 bg-slate-50 p-2 text-[8.8px] text-slate-800">
            <strong>Indemnidad por actos posteriores:</strong> A contar de la fecha de entrega ({meta.handoverDate}), el Administrador Saliente carece de facultades de giro, contratación o representación respecto de la comunidad, siendo inoponibles a su respecto las obligaciones tributarias, laborales, bancarias o administrativas devengadas con posterioridad a dicha fecha.
          </p>
        </CanonicalSheet>
      </div>
    );
  }

  // ==================== 2. INFORME ANUAL EJECUTIVO / ACTA ANUAL (FASE A) ====================
  if (docKey === 'informe_anual_ejecutivo' || docKey === 'acta_asamblea_anual') {
    const expenses = Array.isArray(currentCommunity.expenses) ? currentCommunity.expenses : [];
    const byCat = {};
    expenses.forEach((e) => {
      const cat = e.category || 'Gastos Operacionales';
      byCat[cat] = (byCat[cat] || 0) + (Number(e.amount) || 0);
    });
    const catRows = Object.entries(byCat);
    const latestMinute = Array.isArray(currentCommunity.assemblyMinutes) ? currentCommunity.assemblyMinutes[0] : null;

    if (docKey === 'acta_asamblea_anual') {
      return (
        <div id={printableId} data-pdf-style={pdfStyle} className="space-y-6">
          <CanonicalSheet
            page={1}
            totalPages={1}
            badge="ACTA ASAMBLEA ANUAL"
            description="Sesión Ordinaria Art. 21 Ley 21.442"
            label="Acta Asamblea Ordinaria"
            meta={meta}
            live={live}
            company={company}
            pdfStyle={pdfStyle}
            showSigners={true}
            signers={annualSigners}
          >
            <div className="transition-title text-center mt-2.5 mb-2.5">
              <h2 className="text-sm font-black uppercase">
                ACTA DE ASAMBLEA ORDINARIA DE RENDICIÓN ANUAL DE CUENTAS
              </h2>
              <p className="text-[#0F3D2E] font-bold">
                Pronunciamiento formal de copropietarios conforme a los Arts. 15°, 19° y 21° de la Ley N° 21.442
              </p>
            </div>

            <div className="transition-metadata grid grid-cols-3 border border-slate-300 text-[9px] mb-3">
              {[
                ['COMUNIDAD', condoLabel],
                ['EJERCICIO RENDIDO', meta.annualPeriodLabel || `Año ${live.currentYear}`],
                ['FECHA DE SESIÓN', meta.assemblyDate || latestMinute?.date || '________________________'],
                ['ADMINISTRACIÓN TITULAR', outgoingStr],
                ['PRESIDENTE(A) / COMITÉ', committeeStr || '________________________'],
                ['UNIDADES HÁBILES AL DÍA', `${live.paidUnitsCount} de ${live.totalUnits} unidades (${live.proxiesCount} poderes)`]
              ].map(([lbl, val]) => (
                <div key={lbl} className="border border-slate-200 p-1">
                  <strong className="block text-slate-800">{lbl}</strong>
                  <span>{val}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2.5 text-[9.2px] leading-relaxed text-slate-800">
              <div className="border border-slate-300 p-2.5">
                <strong className="text-[#0F3D2E] uppercase block mb-1">Primero: Constitución legal y verificación de quórum</strong>
                <p>
                  En <strong>{meta.city || live.city}</strong>, con fecha <strong>{meta.assemblyDate || '___/___/2026'}</strong>, habiéndose cursado la citación legal dentro del plazo establecido en el artículo 19 de la Ley N° 21.442 y verificado el quórum de constitución de copropietarios hábiles (mínimo 33% de los derechos en el condominio), se declara válidamente instalada la Asamblea Ordinaria del condominio <strong>{meta.communityName || live.communityName}</strong>.
                </p>
              </div>

              <div className="border border-slate-300 p-2.5">
                <strong className="text-[#0F3D2E] uppercase block mb-1">Segundo: Exposición de la cuenta anual documentada (Art. 21°)</strong>
                <p>
                  La Administración expone el balance de ingresos y egresos del período <strong>{meta.annualPeriodLabel}</strong>, la conciliación bancaria cuadrada (disponible líquido conciliado <strong>{formatCLP(rec.realAvailable)}</strong>), el estado del Fondo Común de Reserva acumulado por <strong>{formatCLP(rec.reserve)}</strong>, la gestión sobre la cartera morosa (<strong>{formatCLP(live.totalPendingDebt)}</strong> en {live.delinquentUnitsCount} unidades), el cumplimiento laboral/previsional ({live.staffCount} trabajadores) y la memoria de {live.maintenancesCount} mantenciones preventivas.
                </p>
              </div>

              <div className="border border-slate-300 p-2.5">
                <strong className="text-[#0F3D2E] uppercase block mb-1">Tercero: Votación y acuerdo de la Asamblea</strong>
                <p className="mb-1.5">
                  Sometida la cuenta anual a votación ponderada por alícuota de dominio entre los copropietarios hábiles asistentes y representados, se adopta el siguiente acuerdo:
                </p>
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2 border border-slate-200 font-bold text-center">
                  <div>☐ APROBADA SIN OBSERVACIONES</div>
                  <div>☐ APROBADA CON OBSERVACIONES</div>
                  <div>☐ RECHAZADA FUNDADAMENTE</div>
                </div>
                <p className="mt-1.5">
                  <strong>Detalle de votación / acuerdos complementarios:</strong>{' '}
                  {docState.actaNotes || latestMinute?.summary || '________________________________________________________________________________________'}
                </p>
              </div>

              <div className="border border-slate-300 p-2.5">
                <strong className="text-[#0F3D2E] uppercase block mb-1">Cuarto: Presupuesto próximo ejercicio y Comité de Administración</strong>
                <p>
                  Se presenta la proyección presupuestaria operativa sobre base actual de <strong>{formatCLP(live.grandTotal)}</strong> mensuales (con recargo de Fondo de Reserva del <strong>{live.reservePercent}%</strong>) y se deja constancia de la ratificación o renovación del Comité de Administración en el Libro de Actas oficial.
                </p>
              </div>
            </div>
          </CanonicalSheet>
        </div>
      );
    }

    return (
      <div id={printableId} data-pdf-style={pdfStyle} className="space-y-6">
        <CanonicalSheet
          page={1}
          totalPages={1}
          badge="RENDICIÓN ANUAL ART. 21"
          description="Balance e informe ejecutivo anual"
          label="Informe Anual de Gestión"
          meta={meta}
          live={live}
          company={company}
          pdfStyle={pdfStyle}
          showSigners={true}
          signers={annualSigners}
        >
          <div className="transition-title text-center mt-2.5 mb-2.5">
            <h2 className="text-sm font-black uppercase">
              INFORME EJECUTIVO DE RENDICIÓN DE CUENTAS ANUAL
            </h2>
            <p className="text-[#0F3D2E] font-bold">
              Resumen financiero, operacional, laboral y técnico para Asamblea Ordinaria (Art. 21 Ley N° 21.442)
            </p>
          </div>

          <div className="transition-metadata grid grid-cols-3 border border-slate-300 text-[9px] mb-3">
            {[
              ['COMUNIDAD', condoLabel],
              ['PERÍODO RENDIDO', meta.annualPeriodLabel || `Ejercicio ${live.currentYear}`],
              ['CUENTA BANCARIA', `${live.bankName} ${live.bankAccount || ''}`],
              ['DISPONIBLE CONCILIADO', formatCLP(rec.realAvailable)],
              ['FONDO DE RESERVA (ART. 39)', `${formatCLP(rec.reserve)} (${live.reservePercent}%)`],
              ['CUMPLIMIENTO RECAUDACIÓN', `${live.paidUnitsCount}/${live.totalUnits} unidades al día`]
            ].map(([lbl, val]) => (
              <div key={lbl} className="border border-slate-200 p-1">
                <strong className="block text-slate-800">{lbl}</strong>
                <span>{val}</span>
              </div>
            ))}
          </div>

          <div className="border border-slate-300 mb-3">
            <div className="bg-[#0F3D2E] text-white font-bold px-2 py-1 uppercase text-[9.5px]">
              1. Estructura de egresos operacionales por categoría (Base activa registrada en ARANPRO)
            </div>
            <table className="w-full border-collapse" style={{ fontSize: '9px' }}>
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 p-1.5 text-left w-[55%]">Categoría contable</th>
                  <th className="border border-slate-300 p-1.5 text-right w-[22%]">Base mensual ref.</th>
                  <th className="border border-slate-300 p-1.5 text-right w-[23%]">Proyección anual (x12)</th>
                </tr>
              </thead>
              <tbody>
                {(catRows.length > 0 ? catRows : [['Gastos operacionales ordinarios', live.totalExpenses]]).slice(0, 7).map(([cat, amt]) => (
                  <tr key={cat}>
                    <td className="border border-slate-300 p-1.5 font-medium">{cat}</td>
                    <td className="border border-slate-300 p-1.5 text-right">{formatCLP(amt)}</td>
                    <td className="border border-slate-300 p-1.5 text-right font-bold">{formatCLP(amt * 12)}</td>
                  </tr>
                ))}
                <tr className="bg-emerald-50">
                  <td className="border border-slate-300 p-1.5 font-black text-[#0F3D2E]">TOTAL EGRESOS ORDINARIOS</td>
                  <td className="border border-slate-300 p-1.5 text-right font-black text-[#0F3D2E]">{formatCLP(live.totalExpenses)}</td>
                  <td className="border border-slate-300 p-1.5 text-right font-black text-[#0F3D2E]">{formatCLP(live.totalExpenses * 12)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-[9px] mb-2">
            <div className="border border-slate-300 p-2">
              <strong className="text-[#0F3D2E] uppercase block mb-0.5">2. Cobranza y Cartera Morosa:</strong>
              <p>
                De {live.totalUnits} unidades totales, {live.paidUnitsCount} se encuentran al día y {live.delinquentUnitsCount} registran saldo pendiente por un total de <strong>{formatCLP(live.totalPendingDebt)}</strong>, manteniéndose {live.repactacionCount} convenio(s) de pago vigentes (Art. 35°).
              </p>
            </div>
            <div className="border border-slate-300 p-2">
              <strong className="text-[#0F3D2E] uppercase block mb-0.5">3. Gestión Laboral y Técnica:</strong>
              <p>
                Dotación activa de <strong>{live.staffCount} trabajador(es)</strong> con respaldos previsionales al día, directorio de <strong>{live.providersCount} proveedor(es)</strong> y seguimiento de <strong>{live.maintenancesCount} mantenciones preventivas</strong> e inspecciones críticas.
              </p>
            </div>
          </div>
        </CanonicalSheet>
      </div>
    );
  }

  // ==================== 3. RENDICIÓN FINANCIERA DE CORTE & GASTOS DEL SISTEMA ====================
  if (docKey === 'rendicion_corte_sistema') {
    const expenses = Array.isArray(currentCommunity.expenses) ? currentCommunity.expenses : [];
    const pages = chunkArray(expenses, 14);
    return (
      <div id={printableId} data-pdf-style={pdfStyle} className="space-y-6">
        {pages.map((rows, idx) => (
          <CanonicalSheet
            key={idx}
            page={idx + 1}
            totalPages={pages.length}
            badge={isAnnual ? 'DETALLE FINANCIERO' : 'CORTE CONTABLE'}
            description="Ingresos, egresos y respaldos"
            label="Rendición Financiera Documentada"
            meta={meta}
            live={live}
            company={company}
            pdfStyle={pdfStyle}
            showSigners={true}
            signers={activeSigners}
          >
            <div className="transition-title text-center mt-2.5 mb-2.5">
              <h2 className="text-sm font-black uppercase">
                RENDICIÓN FINANCIERA DOCUMENTADA Y DETALLE DE EGRESOS
              </h2>
              <p className="text-[#0F3D2E] font-bold">
                Respaldo contable extraído del sistema ARANPRO • Período activo {live.periodLabel}
              </p>
            </div>

            {idx === 0 && (
              <div className="transition-metadata grid grid-cols-4 border border-slate-300 text-[8.8px] mb-3">
                {[
                  ['DISPONIBLE LÍQUIDO', formatCLP(rec.realAvailable)],
                  ['FONDO DE RESERVA', formatCLP(rec.reserve)],
                  ['EGRESOS DEL PERÍODO', formatCLP(live.totalExpenses)],
                  ['RESPALDOS ADJUNTOS', `${live.backedExpensesCount} de ${live.expensesCount} gastos`]
                ].map(([lbl, val]) => (
                  <div key={lbl} className="border border-slate-200 p-1">
                    <strong className="block text-slate-800">{lbl}</strong>
                    <span>{val}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="border border-slate-300 mb-2.5">
              <div className="bg-[#0F3D2E] text-white font-bold px-2 py-1 uppercase text-[9.5px] flex justify-between">
                <span>Detalle de egresos y respaldos tributarios ({expenses.length} registros)</span>
                <span className="text-[#D4B895]">Hoja {idx + 1} de {pages.length}</span>
              </div>
              <table className="w-full border-collapse" style={{ fontSize: '8.6px' }}>
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-300 p-1 text-left w-[12%]">Fecha</th>
                    <th className="border border-slate-300 p-1 text-left w-[22%]">Categoría</th>
                    <th className="border border-slate-300 p-1 text-left w-[32%]">Proveedor / Glosa</th>
                    <th className="border border-slate-300 p-1 text-left w-[14%]">N° Doc.</th>
                    <th className="border border-slate-300 p-1 text-center w-[7%]">Resp.</th>
                    <th className="border border-slate-300 p-1 text-right w-[13%]">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length > 0 ? (
                    rows.map((exp, i) => (
                      <tr key={exp.id || i}>
                        <td className="border border-slate-300 p-1">{exp.date || '-'}</td>
                        <td className="border border-slate-300 p-1">{exp.category || 'Operacional'}</td>
                        <td className="border border-slate-300 p-1 font-medium">
                          {[exp.provider, exp.description].filter(Boolean).join(' — ')}
                        </td>
                        <td className="border border-slate-300 p-1">{exp.documentNumber || exp.documentType || '-'}</td>
                        <td className="border border-slate-300 p-1 text-center">{exp.receiptUrl || exp.documentNumber ? '☒' : '☐'}</td>
                        <td className="border border-slate-300 p-1 text-right font-bold">{formatCLP(exp.amount)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="border border-slate-300 p-3 text-center text-slate-500">
                        No existen egresos cargados en el período actual.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CanonicalSheet>
        ))}
      </div>
    );
  }

  // ==================== 4. PADRÓN OFICIAL DE UNIDADES, MOROSIDAD Y SALDOS ====================
  if (docKey === 'padron_morosidad_sistema') {
    const units = (currentCommunity.units || []).map((u) => {
      const fin = getUnitFinancials
        ? getUnitFinancials(u)
        : { currentCharge: Number(u.currentCharge) || 0, pendingDebt: Number(u.previousDebt) || 0, favorBalance: Number(u.creditBalance) || 0 };
      return { ...u, ...fin };
    });
    const pages = chunkArray(units, 18);

    return (
      <div id={printableId} data-pdf-style={pdfStyle} className="space-y-6">
        {pages.map((rows, idx) => (
          <CanonicalSheet
            key={idx}
            page={idx + 1}
            totalPages={pages.length}
            badge="PADRÓN Y SALDOS"
            description="Registro oficial Arts. 5° y 32°"
            label="Padrón y Morosidad"
            meta={meta}
            live={live}
            company={company}
            pdfStyle={pdfStyle}
            showSigners={idx === pages.length - 1}
            signers={activeSigners}
          >
            <div className="transition-title text-center mt-2.5 mb-2.5">
              <h2 className="text-sm font-black uppercase">
                PADRÓN OFICIAL DE COPROPIETARIOS, ALÍCUOTAS, MOROSIDAD Y SALDOS A FAVOR
              </h2>
              <p className="text-[#0F3D2E] font-bold">
                Estado individual de cuenta corriente por unidad al corte {live.periodLabel}
              </p>
            </div>

            {idx === 0 && (
              <div className="transition-metadata grid grid-cols-4 border border-slate-300 text-[8.8px] mb-3">
                {[
                  ['TOTAL UNIDADES', `${live.totalUnits} unidades (${live.paidUnitsCount} al día)`],
                  ['MOROSIDAD TOTAL', `${formatCLP(live.totalPendingDebt)} (${live.delinquentUnitsCount} unid.)`],
                  ['SALDOS A FAVOR', formatCLP(live.totalFavorBalance)],
                  ['CONVENIOS VIGENTES', `${live.repactacionCount} convenio(s) Art. 35°`]
                ].map(([lbl, val]) => (
                  <div key={lbl} className="border border-slate-200 p-1">
                    <strong className="block text-slate-800">{lbl}</strong>
                    <span>{val}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="border border-slate-300 mb-2">
              <div className="bg-[#0F3D2E] text-white font-bold px-2 py-1 uppercase text-[9.5px] flex justify-between">
                <span>Nómina oficial de unidades y estado de deuda</span>
                <span className="text-[#D4B895]">Hoja {idx + 1} de {pages.length}</span>
              </div>
              <table className="w-full border-collapse" style={{ fontSize: '8.4px' }}>
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-300 p-1 text-left w-[11%]">Unidad</th>
                    <th className="border border-slate-300 p-1 text-left w-[27%]">Copropietario / Titular</th>
                    <th className="border border-slate-300 p-1 text-left w-[14%]">RUT</th>
                    <th className="border border-slate-300 p-1 text-right w-[8%]">Alíc. %</th>
                    <th className="border border-slate-300 p-1 text-right w-[13%]">Cargo Mes</th>
                    <th className="border border-slate-300 p-1 text-right w-[14%]">Mora Pend.</th>
                    <th className="border border-slate-300 p-1 text-right w-[13%]">Saldo Favor</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((u, i) => (
                    <tr key={u.id || i}>
                      <td className="border border-slate-300 p-1 font-bold">{[u.tower, u.number].filter(Boolean).join(' ')}</td>
                      <td className="border border-slate-300 p-1">{u.owner || '-'}</td>
                      <td className="border border-slate-300 p-1">{u.rut || '-'}</td>
                      <td className="border border-slate-300 p-1 text-right">{Number(u.sharePercentage || u.aliquot || 0).toFixed(2)}%</td>
                      <td className="border border-slate-300 p-1 text-right">{formatCLP(u.currentCharge)}</td>
                      <td className="border border-slate-300 p-1 text-right font-bold">
                        {(u.pendingDebt || 0) > 0 ? formatCLP(u.pendingDebt) : '$0'}
                      </td>
                      <td className="border border-slate-300 p-1 text-right">
                        {(u.favorBalance || 0) > 0 ? formatCLP(u.favorBalance) : '$0'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CanonicalSheet>
        ))}
      </div>
    );
  }

  // ==================== 5. NÓMINA LABORAL, PREVIRED Y CONSTANCIA LEY BUSTOS ====================
  if (docKey === 'certificado_laboral_sistema') {
    const staff = Array.isArray(currentCommunity.staff) ? currentCommunity.staff : [];
    const payrolls = Array.isArray(currentCommunity.payrollHistory) ? currentCommunity.payrollHistory : [];

    return (
      <div id={printableId} data-pdf-style={pdfStyle} className="space-y-6">
        <CanonicalSheet
          page={1}
          totalPages={1}
          badge="RESPALDO LABORAL"
          description="Previred, DT y Ley N° 19.631"
          label="Certificado Laboral y Previsional"
          meta={meta}
          live={live}
          company={company}
          pdfStyle={pdfStyle}
          showSigners={true}
          signers={activeSigners}
        >
          <div className="transition-title text-center mt-2.5 mb-2.5">
            <h2 className="text-sm font-black uppercase">
              NÓMINA DE PERSONAL VIGENTE Y CONSTANCIA DE CUMPLIMIENTO PREVISIONAL
            </h2>
            <p className="text-[#0F3D2E] font-bold">
              Acreditación laboral, cotizaciones Previred y resguardo Ley Bustos (Ley N° 19.631)
            </p>
          </div>

          <div className="transition-metadata grid grid-cols-3 border border-slate-300 text-[9px] mb-3">
            {[
              ['EMPLEADOR (COMUNIDAD)', condoLabel],
              ['DOTACIÓN VIGENTE', `${staff.length} trabajador(es) activo(s)`],
              ['FECHA DE CORTE', meta.handoverDate || new Date().toISOString().split('T')[0]]
            ].map(([lbl, val]) => (
              <div key={lbl} className="border border-slate-200 p-1">
                <strong className="block text-slate-800">{lbl}</strong>
                <span>{val}</span>
              </div>
            ))}
          </div>

          <div className="border border-slate-300 mb-3">
            <div className="bg-[#0F3D2E] text-white font-bold px-2 py-1 uppercase text-[9.5px]">
              1. Nómina oficial de trabajadores registrados en la comunidad
            </div>
            {staff.length > 0 ? (
              <table className="w-full border-collapse" style={{ fontSize: '8.8px' }}>
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-300 p-1.5 text-left w-[28%]">Nombre completo</th>
                    <th className="border border-slate-300 p-1.5 text-left w-[15%]">RUT</th>
                    <th className="border border-slate-300 p-1.5 text-left w-[20%]">Cargo / Función</th>
                    <th className="border border-slate-300 p-1.5 text-left w-[14%]">Ingreso</th>
                    <th className="border border-slate-300 p-1.5 text-left w-[10%]">AFP / Salud</th>
                    <th className="border border-slate-300 p-1.5 text-right w-[13%]">Sueldo Base</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((w, i) => (
                    <tr key={w.id || i}>
                      <td className="border border-slate-300 p-1.5 font-bold">{w.name || w.fullName || '-'}</td>
                      <td className="border border-slate-300 p-1.5">{w.rut || '-'}</td>
                      <td className="border border-slate-300 p-1.5">{w.role || w.position || 'Personal Condominio'}</td>
                      <td className="border border-slate-300 p-1.5">{w.startDate || w.hireDate || '-'}</td>
                      <td className="border border-slate-300 p-1.5">{[w.afp, w.healthSystem || w.salud].filter(Boolean).join('/')}</td>
                      <td className="border border-slate-300 p-1.5 text-right font-bold">{formatCLP(w.baseSalary || w.salary || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-3 bg-emerald-50 text-[9.2px] text-slate-800">
                <strong>CONSTANCIA DE CERO DOTACIÓN DIRECTA:</strong> A la fecha de emisión, el condominio <strong>{meta.communityName || live.communityName}</strong> no mantiene trabajadores contratados directamente bajo subordinación y dependencia, operando sin pasivos directos de remuneraciones, feriado proporcional ni cotizaciones previsionales en Previred.
              </div>
            )}
          </div>

          <div className="border border-slate-300 mb-3 p-2.5 bg-slate-50 text-[9px] space-y-1.5">
            <strong className="text-[#0F3D2E] uppercase block">2. Estado previsional, mutualidad y normativa laboral vigente:</strong>
            <div>• <strong>Planillas Previred y Mutualidad:</strong> {staff.length > 0 ? `Respaldo de ${payrolls.length} cierre(s) de remuneraciones emitido(s) en sistema; se adjuntan comprobantes pagados y Certificado F30-1 vigente.` : 'No aplica por inexistencia de personal propio.'}</div>
            <div>• <strong>Adecuación Normativa:</strong> {staff.length > 0 ? 'Carpetas individuales con contratos, anexos Ley 40 Horas (Ley N° 21.561), registro de asistencia y protocolo Ley Karin (Ley N° 21.643).' : 'Si existen servicios externalizados (aseo/conserjería), su control se rige por régimen de subcontratación F30-1 del proveedor.'}</div>
          </div>
        </CanonicalSheet>
      </div>
    );
  }

  // ==================== 6. CATASTRO DE PROVEEDORES Y PLAN DE MANTENCIONES ====================
  if (docKey === 'catastro_proveedores_mantenciones') {
    const providers = Array.isArray(currentCommunity.providers) ? currentCommunity.providers.slice(0, 10) : [];
    const maints = Array.isArray(currentCommunity.preventiveMaintenances) ? currentCommunity.preventiveMaintenances.slice(0, 10) : [];

    return (
      <div id={printableId} data-pdf-style={pdfStyle} className="space-y-6">
        <CanonicalSheet
          page={1}
          totalPages={1}
          badge="OPERACIÓN TÉCNICA"
          description="Proveedores y mantenciones"
          label="Proveedores y Mantenciones"
          meta={meta}
          live={live}
          company={company}
          pdfStyle={pdfStyle}
          showSigners={true}
          signers={activeSigners}
        >
          <div className="transition-title text-center mt-2.5 mb-2.5">
            <h2 className="text-sm font-black uppercase">
              CATASTRO DE PROVEEDORES VIGENTES Y BITÁCORA DE MANTENCIONES PREVENTIVAS
            </h2>
            <p className="text-[#0F3D2E] font-bold">
              Continuidad operacional de servicios críticos e infraestructura común (Art. 20° Ley N° 21.442)
            </p>
          </div>

          <div className="border border-slate-300 mb-3">
            <div className="bg-[#0F3D2E] text-white font-bold px-2 py-1 uppercase text-[9.5px]">
              1. Directorio de proveedores y contratistas registrados ({live.providersCount})
            </div>
            <table className="w-full border-collapse" style={{ fontSize: '8.6px' }}>
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 p-1 text-left w-[28%]">Razón Social / Proveedor</th>
                  <th className="border border-slate-300 p-1 text-left w-[15%]">RUT</th>
                  <th className="border border-slate-300 p-1 text-left w-[25%]">Especialidad / Servicio</th>
                  <th className="border border-slate-300 p-1 text-left w-[32%]">Contacto / Teléfono / Correo</th>
                </tr>
              </thead>
              <tbody>
                {providers.length > 0 ? (
                  providers.map((p, i) => (
                    <tr key={p.id || i}>
                      <td className="border border-slate-300 p-1 font-bold">{p.name || p.businessName || '-'}</td>
                      <td className="border border-slate-300 p-1">{p.rut || '-'}</td>
                      <td className="border border-slate-300 p-1">{p.category || p.specialty || p.service || 'Servicio Técnico'}</td>
                      <td className="border border-slate-300 p-1">{[p.contactName, p.phone, p.email].filter(Boolean).join(' · ') || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="border border-slate-300 p-2 text-center text-slate-500">Sin proveedores registrados en catálogo.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="border border-slate-300 mb-2">
            <div className="bg-[#0F3D2E] text-white font-bold px-2 py-1 uppercase text-[9.5px]">
              2. Calendario y bitácora de mantenciones preventivas e inspecciones ({live.maintenancesCount})
            </div>
            <table className="w-full border-collapse" style={{ fontSize: '8.6px' }}>
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 p-1 text-left w-[34%]">Sistema / Instalación crítica</th>
                  <th className="border border-slate-300 p-1 text-left w-[18%]">Frecuencia</th>
                  <th className="border border-slate-300 p-1 text-left w-[16%]">Último control</th>
                  <th className="border border-slate-300 p-1 text-left w-[16%]">Próximo control</th>
                  <th className="border border-slate-300 p-1 text-left w-[16%]">Estado</th>
                </tr>
              </thead>
              <tbody>
                {maints.length > 0 ? (
                  maints.map((m, i) => (
                    <tr key={m.id || i}>
                      <td className="border border-slate-300 p-1 font-bold">{m.title || m.equipment || m.system || '-'}</td>
                      <td className="border border-slate-300 p-1">{m.frequency || 'Periódica'}</td>
                      <td className="border border-slate-300 p-1">{m.lastDate || m.lastMaintenance || '-'}</td>
                      <td className="border border-slate-300 p-1">{m.nextDate || m.nextDueDate || '-'}</td>
                      <td className="border border-slate-300 p-1 font-bold">{m.status || 'Programada'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="border border-slate-300 p-2 text-center text-slate-500">Sin mantenciones preventivas registradas.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CanonicalSheet>
      </div>
    );
  }

  // ==================== 7. REPORTE DE RECLAMOS ABIERTOS, TAREAS COMITÉ Y NOVEDADES ====================
  if (docKey === 'reporte_continuidad_reclamos') {
    const tickets = Array.isArray(currentCommunity.communityTickets) ? currentCommunity.communityTickets.slice(0, 8) : [];
    const tasks = Array.isArray(currentCommunity.committeeTasks) ? currentCommunity.committeeTasks.slice(0, 8) : [];

    return (
      <div id={printableId} data-pdf-style={pdfStyle} className="space-y-6">
        <CanonicalSheet
          page={1}
          totalPages={1}
          badge="ASUNTOS EN CURSO"
          description="Reclamos, tareas y continuidad"
          label="Continuidad de Gestión"
          meta={meta}
          live={live}
          company={company}
          pdfStyle={pdfStyle}
          showSigners={true}
          signers={activeSigners}
        >
          <div className="transition-title text-center mt-2.5 mb-2.5">
            <h2 className="text-sm font-black uppercase">
              REPORTE DE CONTINUIDAD: REQUERIMIENTOS VECINALES Y TAREAS DEL COMITÉ
            </h2>
            <p className="text-[#0F3D2E] font-bold">
              Estado de solicitudes residentes, acuerdos operativos y seguimiento al corte
            </p>
          </div>

          <div className="border border-slate-300 mb-3">
            <div className="bg-[#0F3D2E] text-white font-bold px-2 py-1 uppercase text-[9.5px]">
              1. Reclamos, sugerencias y tickets vecinales registrados ({tickets.length})
            </div>
            <table className="w-full border-collapse" style={{ fontSize: '8.6px' }}>
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 p-1 text-left w-[13%]">Fecha</th>
                  <th className="border border-slate-300 p-1 text-left w-[13%]">Unidad</th>
                  <th className="border border-slate-300 p-1 text-left w-[56%]">Asunto / Descripción del requerimiento</th>
                  <th className="border border-slate-300 p-1 text-left w-[18%]">Estado</th>
                </tr>
              </thead>
              <tbody>
                {tickets.length > 0 ? (
                  tickets.map((t, i) => (
                    <tr key={t.id || i}>
                      <td className="border border-slate-300 p-1">{t.date || t.createdAt?.slice(0, 10) || '-'}</td>
                      <td className="border border-slate-300 p-1 font-bold">{t.unitNumber || t.unit || '-'}</td>
                      <td className="border border-slate-300 p-1">{t.subject || t.title || t.description || '-'}</td>
                      <td className="border border-slate-300 p-1 font-bold">{t.status || 'En seguimiento'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="border border-slate-300 p-2 text-center text-slate-500">No existen reclamos abiertos pendientes.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="border border-slate-300 mb-2">
            <div className="bg-[#0F3D2E] text-white font-bold px-2 py-1 uppercase text-[9.5px]">
              2. Acuerdos y tareas de seguimiento del Comité de Administración ({tasks.length})
            </div>
            <table className="w-full border-collapse" style={{ fontSize: '8.6px' }}>
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 p-1 text-left w-[55%]">Tarea / Compromiso operativo</th>
                  <th className="border border-slate-300 p-1 text-left w-[25%]">Responsable</th>
                  <th className="border border-slate-300 p-1 text-left w-[20%]">Estado</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length > 0 ? (
                  tasks.map((tk, i) => (
                    <tr key={tk.id || i}>
                      <td className="border border-slate-300 p-1 font-medium">{tk.title || tk.description || '-'}</td>
                      <td className="border border-slate-300 p-1">{tk.assignee || tk.responsible || 'Administración / Comité'}</td>
                      <td className="border border-slate-300 p-1 font-bold">{tk.status || 'Pendiente'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="border border-slate-300 p-2 text-center text-slate-500">Sin tareas pendientes en libro de Comité.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CanonicalSheet>
      </div>
    );
  }

  // ==================== 8. INVENTARIO FÍSICO DE LLAVES, CONTROLES Y ACTIVOS ====================
  if (docKey === 'inventario_llaves_activos') {
    const items = Array.isArray(docState.inventoryItems) ? docState.inventoryItems : [];
    return (
      <div id={printableId} data-pdf-style={pdfStyle} className="space-y-6">
        <CanonicalSheet
          page={1}
          totalPages={1}
          badge="INVENTARIO FÍSICO"
          description="Entrega material de llaves y bienes"
          label="Inventario de Custodia Física"
          meta={meta}
          live={live}
          company={company}
          pdfStyle={pdfStyle}
          showSigners={true}
          signers={handoverSigners}
        >
          <div className="transition-title text-center mt-2.5 mb-2.5">
            <h2 className="text-sm font-black uppercase">
              ACTA DE INVENTARIO FÍSICO: LLAVES MAESTRAS, DISPOSITIVOS Y BIENES COMUNES
            </h2>
            <p className="text-[#0F3D2E] font-bold">
              Anexo oficial del Bloque D.4 • Verificación presencial de especies bajo custodia administrativa
            </p>
          </div>

          <div className="transition-metadata grid grid-cols-3 border border-slate-300 text-[9px] mb-3">
            {[
              ['COMUNIDAD', condoLabel],
              ['FECHA RECUENTO FÍSICO', meta.handoverDate || '________________________'],
              ['LUGAR DE ENTREGA', 'Conserjería / Sala de Administración']
            ].map(([lbl, val]) => (
              <div key={lbl} className="border border-slate-200 p-1">
                <strong className="block text-slate-800">{lbl}</strong>
                <span>{val}</span>
              </div>
            ))}
          </div>

          <div className="border border-slate-300 mb-3">
            <div className="bg-[#0F3D2E] text-white font-bold px-2 py-1 uppercase text-[9.5px]">
              Detalle individualizado de llaves, controles, libros foliados y equipos entregados
            </div>
            <table className="w-full border-collapse" style={{ fontSize: '8.8px' }}>
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 p-1.5 text-left w-[38%]">Elemento / Sala técnica / Activo</th>
                  <th className="border border-slate-300 p-1.5 text-center w-[13%]">Cantidad</th>
                  <th className="border border-slate-300 p-1.5 text-left w-[17%]">Estado operativo</th>
                  <th className="border border-slate-300 p-1.5 text-center w-[9%]">Recib.</th>
                  <th className="border border-slate-300 p-1.5 text-left w-[23%]">Ubicación / Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => (
                  <tr key={it.id || i}>
                    <td className="border border-slate-300 p-1.5 font-bold">{it.name}</td>
                    <td className="border border-slate-300 p-1.5 text-center font-bold">{it.quantity}</td>
                    <td className="border border-slate-300 p-1.5">{it.condition}</td>
                    <td className="border border-slate-300 p-1.5 text-center text-[10.5px]">{it.delivered ? '☒' : '☐'}</td>
                    <td className="border border-slate-300 p-1.5">{it.notes || '________________________'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="bg-emerald-50 border border-emerald-200 p-2 text-[8.8px] text-slate-800">
            <strong>Constancia de custodia física.</strong> El receptor verifica en este acto la cantidad y estado visual de las llaves, controles, timbres y equipos individualizados, asumiendo desde este momento su resguardo exclusivo.
          </p>
        </CanonicalSheet>
      </div>
    );
  }

  // ==================== 9. PROTOCOLO DE TRASPASO Y REVOCACIÓN DE ACCESOS DIGITALES ====================
  if (docKey === 'protocolo_claves_digitales') {
    const creds = Array.isArray(docState.credentialItems) ? docState.credentialItems : [];
    return (
      <div id={printableId} data-pdf-style={pdfStyle} className="space-y-6">
        <CanonicalSheet
          page={1}
          totalPages={1}
          badge="CONTINUIDAD DIGITAL"
          description="Traspaso y revocación de claves"
          label="Protocolo de Accesos Digitales"
          meta={meta}
          live={live}
          company={company}
          pdfStyle={pdfStyle}
          showSigners={true}
          signers={handoverSigners}
        >
          <div className="transition-title text-center mt-2.5 mb-2.5">
            <h2 className="text-sm font-black uppercase">
              PROTOCOLO SEGURO DE TRASPASO DE ACCESOS DIGITALES Y REVOCACIÓN DE CREDENCIALES
            </h2>
            <p className="text-[#0F3D2E] font-bold">
              Anexo oficial del Bloque F • Portales bancarios, tributarios, laborales y sistemas de seguridad
            </p>
          </div>

          <p className="bg-emerald-50 border border-emerald-200 p-2 mb-3 text-[9px] text-slate-800">
            <strong>Norma de ciberseguridad:</strong> Por seguridad informática, las contraseñas secretas nunca se imprimen en texto plano en el acta; se entregan por canal cifrado directo o se restablecen en presencia del Comité, dejando constancia aquí del usuario/cuenta traspasado y de la revocación efectiva del administrador saliente.
          </p>

          <div className="border border-slate-300 mb-3">
            <div className="bg-[#0F3D2E] text-white font-bold px-2 py-1 uppercase text-[9.5px]">
              Registro de plataformas institucionales, métodos de recuperación (2FA) y baja del saliente
            </div>
            <table className="w-full border-collapse" style={{ fontSize: '8.8px' }}>
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 p-1.5 text-left w-[27%]">Plataforma / Sistema</th>
                  <th className="border border-slate-300 p-1.5 text-left w-[25%]">Cuenta / RUT / Usuario ref.</th>
                  <th className="border border-slate-300 p-1.5 text-left w-[24%]">Mecanismo de traspaso</th>
                  <th className="border border-slate-300 p-1.5 text-center w-[12%]">Traspasado</th>
                  <th className="border border-slate-300 p-1.5 text-center w-[12%]">Clave Cambiada</th>
                </tr>
              </thead>
              <tbody>
                {creds.map((c, i) => (
                  <tr key={c.id || i}>
                    <td className="border border-slate-300 p-1.5 font-bold">{c.platform}</td>
                    <td className="border border-slate-300 p-1.5">{c.accountRef || '-'}</td>
                    <td className="border border-slate-300 p-1.5">{c.method || 'Cambio directo ante Comité'}</td>
                    <td className="border border-slate-300 p-1.5 text-center text-[10.5px]">{c.transferred ? '☒' : '☐'}</td>
                    <td className="border border-slate-300 p-1.5 text-center text-[10.5px]">{c.revoked ? '☒' : '☐'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="border border-slate-300 bg-slate-50 p-2 text-[8.8px] text-slate-800">
            <strong>Declaración expresa de revocación:</strong> La Administración Saliente declara no conservar sesiones activas, tokens ni métodos de recuperación personal vinculados a las plataformas traspasadas, asumiendo el Comité y la Administración Entrante la obligación de mantener actualizadas las nuevas contraseñas maestras.
          </p>
        </CanonicalSheet>
      </div>
    );
  }

  // ==================== 10. PRESUPUESTO OPERATIVO PROYECTADO ANUAL (FASE A) ====================
  if (docKey === 'presupuesto_proyectado_anual') {
    const pctAdjust = Number(docState.budgetIncreasePct ?? 4.5);
    const factor = 1 + pctAdjust / 100;
    const baseMonthly = live.totalExpenses || 0;
    const projectedMonthly = Math.round(baseMonthly * factor);
    const projectedReserve = Math.round(projectedMonthly * ((live.reservePercent || 5) / 100));
    const projectedTotal = projectedMonthly + projectedReserve;
    const avgPerUnit = live.totalUnits > 0 ? Math.round(projectedTotal / live.totalUnits) : 0;

    return (
      <div id={printableId} data-pdf-style={pdfStyle} className="space-y-6">
        <CanonicalSheet
          page={1}
          totalPages={1}
          badge="PRESUPUESTO ANUAL"
          description="Proyección Art. 20° N° 4 Ley 21.442"
          label="Presupuesto Proyectado"
          meta={meta}
          live={live}
          company={company}
          pdfStyle={pdfStyle}
          showSigners={true}
          signers={annualSigners}
        >
          <div className="transition-title text-center mt-2.5 mb-2.5">
            <h2 className="text-sm font-black uppercase">
              PROPUESTA DE PRESUPUESTO OPERATIVO PROYECTADO PARA EL NUEVO EJERCICIO
            </h2>
            <p className="text-[#0F3D2E] font-bold">
              Estimación anual basada en costos reales del sistema + factor de reajuste IPC/UF ({pctAdjust}%)
            </p>
          </div>

          <div className="border border-slate-300 mb-3">
            <div className="bg-[#0F3D2E] text-white font-bold px-2 py-1 uppercase text-[9.5px]">
              Comparativo gasto actual vs presupuesto proyectado próximo ejercicio
            </div>
            <table className="w-full border-collapse" style={{ fontSize: '9px' }}>
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 p-1.5 text-left w-[46%]">Ítem presupuestario</th>
                  <th className="border border-slate-300 p-1.5 text-right w-[18%]">Actual / Mes</th>
                  <th className="border border-slate-300 p-1.5 text-right w-[18%]">Proyectado / Mes</th>
                  <th className="border border-slate-300 p-1.5 text-right w-[18%]">Proyectado Anual</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 p-1.5 font-bold">Gastos operacionales ordinarios (RR.HH., consumos, mantenciones)</td>
                  <td className="border border-slate-300 p-1.5 text-right">{formatCLP(baseMonthly)}</td>
                  <td className="border border-slate-300 p-1.5 text-right font-bold">{formatCLP(projectedMonthly)}</td>
                  <td className="border border-slate-300 p-1.5 text-right font-bold">{formatCLP(projectedMonthly * 12)}</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-1.5">Recargo Fondo Común de Reserva ({live.reservePercent}% Art. 39°)</td>
                  <td className="border border-slate-300 p-1.5 text-right">{formatCLP(Math.round(baseMonthly * (live.reservePercent / 100)))}</td>
                  <td className="border border-slate-300 p-1.5 text-right">{formatCLP(projectedReserve)}</td>
                  <td className="border border-slate-300 p-1.5 text-right">{formatCLP(projectedReserve * 12)}</td>
                </tr>
                <tr className="bg-emerald-50">
                  <td className="border border-slate-300 p-1.5 font-black text-[#0F3D2E]">TOTAL PRESUPUESTO A DISTRIBUIR ({live.totalUnits} UNIDADES)</td>
                  <td className="border border-slate-300 p-1.5 text-right font-bold">{formatCLP(live.grandTotal)}</td>
                  <td className="border border-slate-300 p-1.5 text-right font-black text-[#0F3D2E]">{formatCLP(projectedTotal)}</td>
                  <td className="border border-slate-300 p-1.5 text-right font-black text-[#0F3D2E]">{formatCLP(projectedTotal * 12)}</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-1.5 text-slate-600">Cuota promedio referencial por unidad (según alícuota media)</td>
                  <td className="border border-slate-300 p-1.5 text-right text-slate-600">
                    {formatCLP(live.totalUnits > 0 ? Math.round(live.grandTotal / live.totalUnits) : 0)}
                  </td>
                  <td className="border border-slate-300 p-1.5 text-right font-bold">{formatCLP(avgPerUnit)}</td>
                  <td className="border border-slate-300 p-1.5 text-right">{formatCLP(avgPerUnit * 12)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CanonicalSheet>
      </div>
    );
  }

  // ==================== 11. CONSTANCIA CANÓNICA PARA CARPETA LEGAL DE COMUNIDAD ====================
  const legalFolderMeta = {
    doc_reglamento_cbr: {
      title: 'CONSTANCIA DE CUSTODIA Y ENTREGA: REGLAMENTO DE COPROPIEDAD E INSCRIPCIÓN CBR',
      norm: 'Arts. 8°, 10° y 29° Ley N° 21.442',
      detail: 'Acredita el estado y medio de entrega del Reglamento de Copropiedad vigente, modificaciones, fojas/año de inscripción en el Conservador de Bienes Raíces y tabla oficial de alícuotas.'
    },
    doc_poliza_incendio: {
      title: 'CONSTANCIA DE PÓLIZA COLECTIVA DE SEGURO CONTRA INCENDIO Y COBERTURAS',
      norm: 'Art. 43° Ley N° 21.442',
      detail: 'Acredita la situación de contratación, compañía aseguradora, vigencia, pago de primas e historial de siniestros de la póliza obligatoria de bienes comunes y unidades.'
    },
    doc_plan_emergencia: {
      title: 'CONSTANCIA DE PLAN DE EMERGENCIA, EVACUACIÓN Y PLANOS TÉCNICOS',
      norm: 'Arts. 6° y 40° Ley N° 21.442',
      detail: 'Acredita la entrega de la carpeta del Plan de Emergencia y Evacuación (PES), planos de redes/evacuación y constancia de presentación ante Bomberos y Carabineros.'
    }
  }[docKey] || {
    title: 'FICHA OFICIAL DE CONSTANCIA DOCUMENTAL DE ENTREGA',
    norm: 'Ley N° 21.442',
    detail: 'Constancia documental emitida para el expediente de traspaso / rendición.'
  };

  const customRecord = (docState.legalConstancias || {})[docKey] || {};

  return (
    <div id={printableId} data-pdf-style={pdfStyle} className="space-y-6">
      <CanonicalSheet
        page={1}
        totalPages={1}
        badge="CONSTANCIA LEGAL"
        description={legalFolderMeta.norm}
        label="Ficha Documental Oficial"
        meta={meta}
        live={live}
        company={company}
        pdfStyle={pdfStyle}
        showSigners={true}
        signers={activeSigners}
      >
        <div className="transition-title text-center mt-2.5 mb-2.5">
          <h2 className="text-sm font-black uppercase">{legalFolderMeta.title}</h2>
          <p className="text-[#0F3D2E] font-bold">
            Respaldo estandarizado cuando el expediente original se entrega en carpeta física o se encuentra en regularización
          </p>
        </div>

        <p className="bg-emerald-50 border border-emerald-200 p-2 mb-3 text-[9px] text-slate-800">
          <strong>Alcance normativo ({legalFolderMeta.norm}):</strong> {legalFolderMeta.detail}
        </p>

        <div className="border border-slate-300 mb-3">
          <div className="bg-[#0F3D2E] text-white font-bold px-2 py-1 uppercase text-[9.5px]">
            Individualización del documento y modalidad de custodia / entrega
          </div>
          <table className="w-full border-collapse" style={{ fontSize: '9px' }}>
            <tbody>
              <tr>
                <td className="border border-slate-300 p-2 font-bold bg-slate-50 w-[32%]">Comunidad</td>
                <td className="border border-slate-300 p-2">{condoLabel}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-bold bg-slate-50">Estado del antecedente</td>
                <td className="border border-slate-300 p-2 font-bold text-[#0F3D2E]">
                  {customRecord.statusLabel || 'Entregado en carpeta física de la comunidad / Custodia Conserjería'}
                </td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-bold bg-slate-50">Identificación / Folio / Póliza / CBR</td>
                <td className="border border-slate-300 p-2">{customRecord.reference || '________________________________________________'}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-bold bg-slate-50">Ubicación física o soporte digital</td>
                <td className="border border-slate-300 p-2">{customRecord.location || 'Archivador legal oficial en conserjería / administración'}</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-2 font-bold bg-slate-50">Observaciones o compromiso</td>
                <td className="border border-slate-300 p-2">{customRecord.notes || 'Se recomienda digitalizar copia en la Biblioteca Legal de la plataforma ARANPRO.'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </CanonicalSheet>
    </div>
  );
}

/**
 * Expediente Maestro Continuo en un único PDF (Portada + Pauta 3 Págs + Actas + Reportes + Anexos)
 */
export function FullHandoverDossierPrint({
  phase = 'traspaso',
  currentCommunity = {},
  getUnitFinancials,
  live = {},
  meta = {},
  company = {},
  sections = [],
  entries = {},
  docState = {},
  mandateChecks = {},
  pdfStyle = 'alt4',
  printableId = 'printable-full-handover-dossier'
}) {
  const docSequence =
    phase === 'anual'
      ? [
          'informe_anual_ejecutivo',
          'carta_puesta_disposicion',
          'acta_asamblea_anual',
          'rendicion_corte_sistema',
          'padron_morosidad_sistema',
          'certificado_laboral_sistema',
          'catastro_proveedores_mantenciones',
          'presupuesto_proyectado_anual'
        ]
      : [
          'acta_entrega_final',
          'carta_puesta_disposicion',
          'constancia_baja_mandatos',
          'rendicion_corte_sistema',
          'padron_morosidad_sistema',
          'certificado_laboral_sistema',
          'catastro_proveedores_mantenciones',
          'inventario_llaves_activos',
          'protocolo_claves_digitales'
        ];

  return (
    <div id={printableId} data-pdf-style={pdfStyle} className="space-y-6">
      <CanonicalHandoverDocumentPrint
        printableId={`${printableId}-cover`}
        docKey="portada_expediente"
        phase={phase}
        currentCommunity={currentCommunity}
        getUnitFinancials={getUnitFinancials}
        live={live}
        meta={meta}
        company={company}
        sections={sections}
        entries={entries}
        docState={docState}
        mandateChecks={mandateChecks}
        pdfStyle={pdfStyle}
      />

      <CommunityHandoverPautaPrint
        printableId={`${printableId}-pauta`}
        phase={phase}
        sections={sections}
        entries={entries}
        meta={meta}
        live={live}
        company={company}
        pdfStyle={pdfStyle}
      />

      {docSequence.map((key) => (
        <CanonicalHandoverDocumentPrint
          key={key}
          printableId={`${printableId}-${key}`}
          docKey={key}
          phase={phase}
          currentCommunity={currentCommunity}
          getUnitFinancials={getUnitFinancials}
          live={live}
          meta={meta}
          company={company}
          sections={sections}
          entries={entries}
          docState={docState}
          mandateChecks={mandateChecks}
          pdfStyle={pdfStyle}
        />
      ))}
    </div>
  );
}

/**
 * Bandeja Principal del Paso 2: Cuadratura Contable + Dossier Completo + Exportación CSV/JSON + Documentos
 */
export function CommunityHandoverDocumentsTray({
  phase = 'traspaso',
  currentCommunity = {},
  getUnitFinancials,
  live = {},
  meta = {},
  company = {},
  sections = [],
  entries = {},
  docState = {},
  setDocState,
  mandateChecks = {},
  pdfStyle = 'alt4',
  onSetPdfStyle,
  onGoToChecklist,
  onGoToClosureStep,
  onOpenChecklistPreview,
  onPrintChecklistPauta,
  onMarkPortabilityExported,
  onNavigateToTab,
  onTriggerToast,
  externalPreviewDocKey,
  onClearExternalPreview
}) {
  const isAnnual = phase === 'anual';
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('todos');
  const [previewDocKey, setPreviewDocKey] = useState(null); // docKey | 'FULL_DOSSIER'
  const [editingDocModal, setEditingDocModal] = useState(null);
  const [hydratedDocs, setHydratedDocs] = useState([]);

  useEffect(() => {
    if (externalPreviewDocKey) {
      setPreviewDocKey(externalPreviewDocKey);
      onClearExternalPreview?.();
    }
  }, [externalPreviewDocKey]);

  useEffect(() => {
    let mounted = true;
    const rawDocs = Array.isArray(currentCommunity?.documents) ? currentCommunity.documents : [];
    Promise.all(
      rawDocs.map(async (d) => {
        if (d.fileUrl || d.fileData) return d;
        if (d.fileId) {
          try {
            const data = await vaultGet(d.fileId);
            if (data) return { ...d, fileUrl: data };
          } catch (e) {
            console.warn(e);
          }
        }
        return d;
      })
    ).then((res) => {
      if (mounted) setHydratedDocs(res);
    });
    return () => {
      mounted = false;
    };
  }, [currentCommunity?.documents]);

  const reconciliation = useMemo(
    () => computeHandoverReconciliation(docState, live),
    [docState, live]
  );

  const findCommunityUploadedDoc = (keywords = []) => {
    return hydratedDocs.find((d) => {
      const haystack = `${d.title || ''} ${d.category || ''} ${d.fileName || ''}`.toLowerCase();
      return keywords.some((kw) => haystack.includes(kw));
    });
  };

  const handlePrintCanonicalDoc = (docKey, titleSlug) => {
    const safeCondo = (meta.communityName || live.communityName || 'Comunidad').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `ARANPRO_${titleSlug}_${safeCondo}`;
    printDocumentDirectly(`printable-doc-${docKey}`, filename, {
      pageSize: 'letter portrait',
      fitPage: false,
      margin: '0',
      pdfStyle,
      extraStyles: handoverPautaPrintStyles
    });
  };

  const handlePrintFullDossier = () => {
    const safeCondo = (meta.communityName || live.communityName || 'Comunidad').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = isAnnual
      ? `ARANPRO_Dossier_Completo_Rendicion_Anual_${safeCondo}`
      : `ARANPRO_Dossier_Completo_Entrega_Administracion_${safeCondo}`;
    printDocumentDirectly('printable-full-handover-dossier', filename, {
      pageSize: 'letter portrait',
      fitPage: false,
      margin: '0',
      pdfStyle,
      extraStyles: handoverPautaPrintStyles
    });
  };

  // Exportación abierta CSV (Excel) + JSON para cumplir el Bloque F.2 de portabilidad
  const handleExportOpenDataPack = () => {
    const safeCondo = (meta.communityName || live.communityName || 'Comunidad').replace(/[^a-zA-Z0-9]/g, '_');
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

    const unitHeaders = ['Torre', 'Unidad', 'Copropietario', 'RUT', 'Correo', 'Telefono', 'Alicuota_%', 'Cargo_Mes_CLP', 'Mora_Pendiente_CLP', 'Saldo_A_Favor_CLP', 'Convenio_Activo'];
    const unitLines = (currentCommunity.units || []).map((u) => {
      const fin = getUnitFinancials
        ? getUnitFinancials(u)
        : { currentCharge: u.currentCharge || 0, pendingDebt: u.previousDebt || 0, favorBalance: u.creditBalance || 0 };
      return [
        u.tower || '',
        u.number || '',
        u.owner || '',
        u.rut || '',
        u.email || '',
        u.phone || '',
        u.sharePercentage || u.aliquot || 0,
        fin.currentCharge || 0,
        fin.pendingDebt || 0,
        fin.favorBalance || 0,
        u.repactacion?.active ? 'SI' : 'NO'
      ].map(esc).join(';');
    });

    const expHeaders = ['Fecha', 'Categoria', 'Proveedor', 'RUT_Proveedor', 'Tipo_Doc', 'Num_Doc', 'Monto_CLP', 'Fondo', 'Estado'];
    const expLines = (currentCommunity.expenses || []).map((e) =>
      [
        e.date || '',
        e.category || '',
        e.provider || '',
        e.providerRut || '',
        e.documentType || '',
        e.documentNumber || '',
        e.amount || 0,
        e.fundSource || 'ordinario',
        e.status || 'registrado'
      ].map(esc).join(';')
    );

    const csvContent = [
      '\uFEFF# 1. PADRON DE UNIDADES Y SALDOS AL CORTE - ' + (meta.communityName || live.communityName),
      unitHeaders.join(';'),
      ...unitLines,
      '',
      '# 2. EGRESOS Y RESPALDOS DEL PERIODO ACTIVO',
      expHeaders.join(';'),
      ...expLines
    ].join('\r\n');

    downloadTextFile(csvContent, `ARANPRO_Padron_y_Contabilidad_${safeCondo}.csv`, 'text/csv;charset=utf-8');

    const jsonSnapshot = {
      exportedAt: new Date().toISOString(),
      standard: 'ARANPRO Ley 21.442 Open Portability Pack (Bloque F.2)',
      phase,
      meta,
      reconciliation,
      checklistEntries: entries,
      communityData: {
        ...currentCommunity,
        documents: (currentCommunity.documents || []).map(({ fileUrl, fileData, ...rest }) => rest)
      }
    };
    setTimeout(() => {
      downloadTextFile(JSON.stringify(jsonSnapshot, null, 2), `ARANPRO_Respaldo_Integral_${safeCondo}.json`, 'application/json;charset=utf-8');
    }, 250);

    onMarkPortabilityExported?.();
    onTriggerToast?.('💾 Pack CSV (Excel) + JSON descargado y punto F.2 marcado como Entregado.');
  };

  const handleOpenUploadedFile = (uploadedDoc, mode = 'preview') => {
    const fileSource = uploadedDoc?.fileUrl || uploadedDoc?.fileData;
    if (!fileSource) return false;
    if (fileSource.startsWith('data:')) {
      if (mode === 'preview') openDataUrlInNewTab(fileSource);
      else downloadDataUrl(fileSource, uploadedDoc.fileName || `${uploadedDoc.title || 'Documento'}.pdf`);
      return true;
    }
    window.open(fileSource, '_blank', 'noopener');
    return true;
  };

  const documentsCatalog = useMemo(() => {
    const reglamentoFile = findCommunityUploadedDoc(['reglamento', 'copropiedad', 'cbr']);
    const polizaFile = findCommunityUploadedDoc(['seguro', 'póliza', 'poliza', 'incendio']);
    const emergenciaFile = findCommunityUploadedDoc(['pes', 'emergencia', 'evacuación', 'evacuacion', 'bomberos']);

    const buildLibraryRow = ({ id, title, subtitle, badge, keywordsMatch, slug }) => {
      const hasFile = Boolean(keywordsMatch?.fileUrl || keywordsMatch?.fileData);
      return {
        id,
        title,
        subtitle,
        badge,
        badgeColor: hasFile ? 'blue' : 'amber',
        format: hasFile ? `Archivo Comunidad (${keywordsMatch.fileName || 'PDF'})` : 'Constancia Oficial PDF Carta (1 Pág)',
        category: 'biblioteca',
        ready: true,
        statusLabel: hasFile ? 'En Biblioteca Comunidad' : 'Genera Constancia Oficial',
        statusTone: hasFile ? 'emerald' : 'amber',
        icon: FolderOpen,
        openHint: hasFile ? 'Ir a Biblioteca de la Comunidad' : 'Subir archivo original en Biblioteca o editar constancia',
        onOpen: () => {
          if (hasFile) onNavigateToTab?.('comunicados', 'documentos');
          else setEditingDocModal(`constancia:${id}`);
        },
        onUploadRedirect: () => onNavigateToTab?.('comunicados', 'documentos'),
        hasUploadedBinary: hasFile,
        onPreview: () => {
          if (hasFile && handleOpenUploadedFile(keywordsMatch, 'preview')) return;
          setPreviewDocKey(id);
        },
        onPrint: () => {
          if (hasFile && handleOpenUploadedFile(keywordsMatch, 'download')) return;
          handlePrintCanonicalDoc(id, slug);
        }
      };
    };

    if (isAnnual) {
      return [
        {
          id: 'pauta_anual',
          title: 'Pauta Oficial de Control de Rendición de Cuentas Anual',
          subtitle: 'Checklist maestro foliado en 6 bloques (A–F, 24 antecedentes) con estado de verificación y firmas de cierre.',
          badge: '1 • Pauta Art. 21',
          badgeColor: 'gold',
          format: 'PDF Canónico Carta (3 Págs)',
          category: 'actas',
          isPrimary: true,
          ready: true,
          statusLabel: 'Sincronizado con Paso 1',
          statusTone: 'emerald',
          icon: CheckSquare,
          openHint: 'Ir al Paso 1 (Checklist Anual)',
          onOpen: onGoToChecklist,
          onPreview: onOpenChecklistPreview,
          onPrint: onPrintChecklistPauta
        },
        {
          id: 'informe_anual_ejecutivo',
          title: 'Informe Ejecutivo y Balance Anual para Copropietarios',
          subtitle: `Resumen anual con datos reales: disponible conciliado (${formatCLP(reconciliation.realAvailable)}), Fondo Reserva (${formatCLP(reconciliation.reserve)}) y egresos.`,
          badge: '2 • Balance Anual',
          badgeColor: 'emerald',
          format: 'PDF Canónico Carta (1 Pág)',
          category: 'actas',
          isPrimary: true,
          ready: true,
          statusLabel: 'Datos Vivos App',
          statusTone: 'emerald',
          icon: Landmark,
          openHint: 'Ir al Dashboard Financiero',
          onOpen: () => onNavigateToTab?.('resumen'),
          onPreview: () => setPreviewDocKey('informe_anual_ejecutivo'),
          onPrint: () => handlePrintCanonicalDoc('informe_anual_ejecutivo', 'Informe_Ejecutivo_Rendicion_Anual')
        },
        {
          id: 'carta_puesta_disposicion',
          title: 'Circular Oficial de Envío Anticipado de Cuenta Anual (Arts. 19° y 21°)',
          subtitle: 'Acredita la puesta a disposición oportuna del balance y respaldos antes de la Asamblea Ordinaria.',
          badge: '3 • Citación & Envío',
          badgeColor: 'emerald',
          format: 'PDF Canónico Carta (1 Pág)',
          category: 'actas',
          ready: true,
          statusLabel: 'Lista para Despacho',
          statusTone: 'emerald',
          icon: Mail,
          openHint: 'Ir al Paso 3 (Mensajes WhatsApp / Correo)',
          onOpen: onGoToClosureStep,
          onPreview: () => setPreviewDocKey('carta_puesta_disposicion'),
          onPrint: () => handlePrintCanonicalDoc('carta_puesta_disposicion', 'Circular_Envio_Anticipado_Cuenta_Anual')
        },
        {
          id: 'acta_asamblea_anual',
          title: 'Acta Oficial de Asamblea Ordinaria de Aprobación de Cuentas',
          subtitle: 'Formato solemne para el Libro de Actas con verificación de quórum, votación de la cuenta anual y firmas.',
          badge: '4 • Libro de Actas',
          badgeColor: 'emerald',
          format: 'PDF Canónico Carta (1 Pág)',
          category: 'actas',
          ready: true,
          statusLabel: 'Lista para Firmar',
          statusTone: 'emerald',
          icon: Scale,
          openHint: 'Configurar glosa de acuerdos de la Asamblea',
          onOpen: () => setEditingDocModal('acta'),
          onPreview: () => setPreviewDocKey('acta_asamblea_anual'),
          onPrint: () => handlePrintCanonicalDoc('acta_asamblea_anual', 'Acta_Asamblea_Ordinaria_Rendicion')
        },
        {
          id: 'rendicion_corte_sistema',
          title: 'Detalle Contable de Egresos y Estado de Respaldos Tributarios',
          subtitle: `Extraído del módulo Gastos: ${live.expensesCount} egresos registrados (${live.backedExpensesCount} con respaldo verificado).`,
          badge: 'Módulo Gastos App',
          badgeColor: 'slate',
          format: `PDF Canónico Carta (${Math.max(1, Math.ceil((live.expensesCount || 1) / 14))} Pág)`,
          category: 'sistema',
          ready: true,
          statusLabel: `${live.expensesCount} Gastos en App`,
          statusTone: 'emerald',
          icon: FileText,
          openHint: 'Ir a Gastos & Respaldos',
          onOpen: () => onNavigateToTab?.('gastos', 'gastos'),
          onPreview: () => setPreviewDocKey('rendicion_corte_sistema'),
          onPrint: () => handlePrintCanonicalDoc('rendicion_corte_sistema', 'Detalle_Contable_Egresos_y_Respaldos')
        },
        {
          id: 'padron_morosidad_sistema',
          title: 'Padrón de Copropietarios Hábiles, Morosidad y Convenios (Art. 35°)',
          subtitle: `Extraído del módulo Unidades: ${live.totalUnits} unidades (${live.paidUnitsCount} al día, mora ${formatCLP(live.totalPendingDebt)}).`,
          badge: 'Módulo Unidades App',
          badgeColor: 'slate',
          format: `PDF Canónico Carta (${Math.max(1, Math.ceil((live.totalUnits || 1) / 18))} Pág)`,
          category: 'sistema',
          ready: true,
          statusLabel: `${live.totalUnits} Unidades en App`,
          statusTone: 'emerald',
          icon: Building2,
          openHint: 'Ir al Padrón de Unidades',
          onOpen: () => onNavigateToTab?.('unidades', 'nomina'),
          onPreview: () => setPreviewDocKey('padron_morosidad_sistema'),
          onPrint: () => handlePrintCanonicalDoc('padron_morosidad_sistema', 'Padron_Unidades_y_Morosidad')
        },
        {
          id: 'certificado_laboral_sistema',
          title: 'Informe Anual de Personal, Previred y Cumplimiento Ley Bustos',
          subtitle: live.staffCount > 0
            ? `Extraído de RR.HH.: ${live.staffCount} trabajador(es) activo(s) y ${live.payrollHistoryCount} cierre(s) de nómina.`
            : 'Genera automáticamente Constancia Oficial de Cero Dotación Propia y Sin Deuda Previsional.',
          badge: 'Módulo RR.HH. App',
          badgeColor: 'slate',
          format: 'PDF Canónico Carta (1 Pág)',
          category: 'sistema',
          ready: true,
          statusLabel: live.staffCount > 0 ? `${live.staffCount} Trab. en App` : 'Constancia Sin Personal',
          statusTone: 'emerald',
          icon: Users,
          openHint: 'Ir a RR.HH. & Previred',
          onOpen: () => onNavigateToTab?.('remuneraciones', 'previred'),
          onPreview: () => setPreviewDocKey('certificado_laboral_sistema'),
          onPrint: () => handlePrintCanonicalDoc('certificado_laboral_sistema', 'Informe_Laboral_y_Previred')
        },
        {
          id: 'catastro_proveedores_mantenciones',
          title: 'Memoria Anual de Mantenciones Preventivas y Proveedores Vigentes',
          subtitle: `Extraído de Operaciones: ${live.providersCount} proveedor(es) y ${live.maintenancesCount} controles preventivos registrados.`,
          badge: 'Módulo Mantenciones App',
          badgeColor: 'slate',
          format: 'PDF Canónico Carta (1 Pág)',
          category: 'sistema',
          ready: true,
          statusLabel: `${live.maintenancesCount} Mantenciones`,
          statusTone: 'emerald',
          icon: Wrench,
          openHint: 'Ir al Plan de Mantenciones Preventivas',
          onOpen: () => onNavigateToTab?.('gastos', 'mantenciones'),
          onPreview: () => setPreviewDocKey('catastro_proveedores_mantenciones'),
          onPrint: () => handlePrintCanonicalDoc('catastro_proveedores_mantenciones', 'Memoria_Proveedores_y_Mantenciones')
        },
        {
          id: 'presupuesto_proyectado_anual',
          title: 'Propuesta de Presupuesto Operativo Proyectado Nuevo Año (Art. 20° N° 4)',
          subtitle: `Calculado sobre costos reales + factor editable de reajuste (${docState.budgetIncreasePct}% IPC/UF) y Fondo de Reserva.`,
          badge: 'Proyección Anual',
          badgeColor: 'purple',
          format: 'PDF Canónico Carta (1 Pág)',
          category: 'anexos',
          ready: true,
          statusLabel: `Reajuste +${docState.budgetIncreasePct}%`,
          statusTone: 'emerald',
          icon: Sparkles,
          openHint: 'Ajustar porcentaje de proyección presupuestaria',
          onOpen: () => setEditingDocModal('presupuesto'),
          onPreview: () => setPreviewDocKey('presupuesto_proyectado_anual'),
          onPrint: () => handlePrintCanonicalDoc('presupuesto_proyectado_anual', 'Presupuesto_Proyectado_Nuevo_Ejercicio')
        },
        buildLibraryRow({
          id: 'doc_poliza_incendio',
          title: 'Póliza Vigente de Seguro Colectivo contra Incendio (Art. 43°)',
          subtitle: 'Si el PDF está en la Biblioteca de la comunidad lo descarga directo; si no, emite Ficha Oficial de Constancia.',
          badge: 'Carpeta Legal • Art. 43',
          keywordsMatch: polizaFile,
          slug: 'Constancia_Poliza_Seguro_Incendio'
        }),
        buildLibraryRow({
          id: 'doc_plan_emergencia',
          title: 'Plan de Emergencia y Evacuación Actualizado (Art. 40°)',
          subtitle: 'Archivo oficial desde la Biblioteca de la comunidad o Ficha Oficial de Constancia de Revisión Anual.',
          badge: 'Carpeta Legal • Art. 40',
          keywordsMatch: emergenciaFile,
          slug: 'Constancia_Plan_Emergencia_Evacuacion'
        })
      ];
    }

    // FASE B: EXPEDIENTE COMPLETO DE ENTREGA Y TRASPASO DE ADMINISTRACIÓN (14 DOCUMENTOS)
    return [
      {
        id: 'pauta_traspaso',
        title: 'Pauta Oficial de Entrega y Traspaso de Administración (Bloques A–G)',
        subtitle: 'Checklist maestro foliado de 3 páginas Carta con los 28 antecedentes legales, formatos, observaciones y 4 firmas.',
        badge: '1 • Pauta Maestra',
        badgeColor: 'gold',
        format: 'PDF Canónico Carta (3 Págs)',
        category: 'actas',
        isPrimary: true,
        ready: true,
        statusLabel: 'Sincronizado con Paso 1',
        statusTone: 'emerald',
        icon: CheckSquare,
        openHint: 'Ir al Paso 1 (Checklist A–G)',
        onOpen: onGoToChecklist,
        onPreview: onOpenChecklistPreview,
        onPrint: onPrintChecklistPauta
      },
      {
        id: 'acta_entrega_final',
        title: 'Acta Oficial de Entrega, Recepción y Cierre de Administración',
        subtitle: 'Instrumento jurídico de 2 páginas: cuadratura peso a peso, consolidado A–G, cláusula de baja de mandatos y 4 firmas.',
        badge: '2 • Blindaje Legal',
        badgeColor: 'emerald',
        format: 'PDF Canónico Carta (2 Págs)',
        category: 'actas',
        isPrimary: true,
        ready: true,
        statusLabel: reconciliation.isBalanced ? 'Cuadrada ($0 Dif.)' : 'Con Nota Diferencia',
        statusTone: reconciliation.isBalanced ? 'emerald' : 'amber',
        icon: Scale,
        openHint: 'Editar observaciones especiales del Acta',
        onOpen: () => setEditingDocModal('acta'),
        onPreview: () => setPreviewDocKey('acta_entrega_final'),
        onPrint: () => handlePrintCanonicalDoc('acta_entrega_final', 'Acta_Oficial_Entrega_y_Cierre_Administracion')
      },
      {
        id: 'carta_puesta_disposicion',
        title: 'Carta Oficial de Puesta a Disposición de Entrega (Blindaje RNAC Art. 87°)',
        subtitle: 'Protege al administrador saliente acreditando fecha y voluntad formal de entrega ante eventuales atrasos o inasistencia del receptor.',
        badge: '3 • Resguardo RNAC',
        badgeColor: 'emerald',
        format: 'PDF Canónico Carta (1 Pág)',
        category: 'actas',
        ready: true,
        statusLabel: 'Lista para Notificar',
        statusTone: 'emerald',
        icon: Mail,
        openHint: 'Ir al Paso 3 para copiar mensaje de WhatsApp / Correo',
        onOpen: onGoToClosureStep,
        onPreview: () => setPreviewDocKey('carta_puesta_disposicion'),
        onPrint: () => handlePrintCanonicalDoc('carta_puesta_disposicion', 'Carta_Puesta_a_Disposicion_Entrega')
      },
      {
        id: 'constancia_baja_mandatos',
        title: 'Constancia y Hoja de Ruta de Baja de Mandatos (Banco, SII, Previred, DT y MINVU)',
        subtitle: `Compromiso firmado con plazos máximos para desvincular el RUT ${company.adminRut} de las 5 entidades externas.`,
        badge: '4 • Baja Personería',
        badgeColor: 'emerald',
        format: 'PDF Canónico Carta (1 Pág)',
        category: 'actas',
        ready: true,
        statusLabel: 'Protección Post-Cierre',
        statusTone: 'emerald',
        icon: ShieldCheck,
        openHint: 'Ir al Paso 3 para controlar la baja en cada entidad',
        onOpen: onGoToClosureStep,
        onPreview: () => setPreviewDocKey('constancia_baja_mandatos'),
        onPrint: () => handlePrintCanonicalDoc('constancia_baja_mandatos', 'Constancia_Baja_Mandatos_y_Personeria')
      },
      {
        id: 'rendicion_corte_sistema',
        title: 'Rendición Financiera Documentada y Detalle de Egresos al Corte',
        subtitle: `Generado con datos reales de Gastos: ${live.expensesCount} egresos del período (${live.backedExpensesCount} con respaldo) y conciliación.`,
        badge: 'Desde Módulo Gastos',
        badgeColor: 'slate',
        format: `PDF Canónico Carta (${Math.max(1, Math.ceil((live.expensesCount || 1) / 14))} Pág)`,
        category: 'sistema',
        ready: true,
        statusLabel: `${live.expensesCount} Gastos en App`,
        statusTone: 'emerald',
        icon: Landmark,
        openHint: 'Ir a Gastos & Respaldos de la comunidad',
        onOpen: () => onNavigateToTab?.('gastos', 'gastos'),
        onPreview: () => setPreviewDocKey('rendicion_corte_sistema'),
        onPrint: () => handlePrintCanonicalDoc('rendicion_corte_sistema', 'Rendicion_Financiera_Corte_y_Egresos')
      },
      {
        id: 'padron_morosidad_sistema',
        title: 'Padrón Oficial de Copropietarios, Deuda Morosa, Saldos a Favor y Convenios',
        subtitle: `Generado desde Unidades: ${live.totalUnits} fichas reales, mora por cobrar ${formatCLP(live.totalPendingDebt)} y saldos a favor ${formatCLP(live.totalFavorBalance)}.`,
        badge: 'Desde Módulo Unidades',
        badgeColor: 'slate',
        format: `PDF Canónico Carta (${Math.max(1, Math.ceil((live.totalUnits || 1) / 18))} Pág)`,
        category: 'sistema',
        ready: true,
        statusLabel: `${live.totalUnits} Unidades en App`,
        statusTone: 'emerald',
        icon: Building2,
        openHint: 'Ir al Padrón de Unidades de la comunidad',
        onOpen: () => onNavigateToTab?.('unidades', 'nomina'),
        onPreview: () => setPreviewDocKey('padron_morosidad_sistema'),
        onPrint: () => handlePrintCanonicalDoc('padron_morosidad_sistema', 'Padron_Copropietarios_y_Morosidad_Corte')
      },
      {
        id: 'certificado_laboral_sistema',
        title: 'Nómina de Personal, Estado Previsional Previred y Constancia Ley Bustos',
        subtitle: live.staffCount > 0
          ? `Generado desde RR.HH.: ficha salarial y previsional de ${live.staffCount} trabajador(es) (${live.staffNames}).`
          : 'Sin trabajadores registrados en RR.HH.: emite automáticamente Constancia Oficial de Cero Contingencia Laboral.',
        badge: 'Desde Módulo RR.HH.',
        badgeColor: 'slate',
        format: 'PDF Canónico Carta (1 Pág)',
        category: 'sistema',
        ready: true,
        statusLabel: live.staffCount > 0 ? `${live.staffCount} Trab. en App` : 'Constancia Cero Deuda',
        statusTone: 'emerald',
        icon: Users,
        openHint: 'Ir a RR.HH. & Remuneraciones de la comunidad',
        onOpen: () => onNavigateToTab?.('remuneraciones', 'nomina'),
        onPreview: () => setPreviewDocKey('certificado_laboral_sistema'),
        onPrint: () => handlePrintCanonicalDoc('certificado_laboral_sistema', 'Nomina_Laboral_y_Constancia_Ley_Bustos')
      },
      {
        id: 'catastro_proveedores_mantenciones',
        title: 'Catastro Maestro de Proveedores y Bitácora de Mantenciones Preventivas',
        subtitle: `Generado desde Operaciones: ${live.providersCount} proveedor(es) activos y ${live.maintenancesCount} controles técnicos registrados.`,
        badge: 'Desde Mantenciones',
        badgeColor: 'slate',
        format: 'PDF Canónico Carta (1 Pág)',
        category: 'sistema',
        ready: true,
        statusLabel: `${live.providersCount} Prov. / ${live.maintenancesCount} Mant.`,
        statusTone: 'emerald',
        icon: Wrench,
        openHint: 'Ir a Proveedores y Mantenciones Preventivas',
        onOpen: () => onNavigateToTab?.('gastos', 'mantenciones'),
        onPreview: () => setPreviewDocKey('catastro_proveedores_mantenciones'),
        onPrint: () => handlePrintCanonicalDoc('catastro_proveedores_mantenciones', 'Catastro_Proveedores_y_Mantenciones')
      },
      {
        id: 'reporte_continuidad_reclamos',
        title: 'Reporte de Continuidad: Reclamos Abiertos y Tareas del Comité',
        subtitle: `Generado desde Mural y Comité: ${live.openTicketsCount} reclamo(s) vecinales abiertos y ${live.pendingCommitteeTasksCount} tarea(s) pendientes.`,
        badge: 'Desde Mural & Comité',
        badgeColor: 'slate',
        format: 'PDF Canónico Carta (1 Pág)',
        category: 'sistema',
        ready: true,
        statusLabel: `${live.openTicketsCount} Tickets / ${live.pendingCommitteeTasksCount} Tareas`,
        statusTone: 'emerald',
        icon: ClipboardList,
        openHint: 'Ir a Reclamos y Solicitudes de la comunidad',
        onOpen: () => onNavigateToTab?.('comunicados', 'reclamos'),
        onPreview: () => setPreviewDocKey('reporte_continuidad_reclamos'),
        onPrint: () => handlePrintCanonicalDoc('reporte_continuidad_reclamos', 'Reporte_Continuidad_Reclamos_y_Tareas')
      },
      {
        id: 'inventario_llaves_activos',
        title: 'Acta de Inventario Físico: Llaves Maestras, Controles, Tags y Activos',
        subtitle: `Anexo editable para recuento presencial (${docState.inventoryItems.length} partidas configuradas: salas técnicas, controles, libros, token).`,
        badge: 'Anexo Físico • Bloque D.4',
        badgeColor: 'purple',
        format: 'PDF Canónico Carta (1 Pág)',
        category: 'anexos',
        ready: true,
        statusLabel: `${docState.inventoryItems.length} Ítems Editables`,
        statusTone: 'emerald',
        icon: Key,
        openHint: 'Personalizar listado de llaves, controles, libros y equipos entregados',
        onOpen: () => setEditingDocModal('inventario'),
        onPreview: () => setPreviewDocKey('inventario_llaves_activos'),
        onPrint: () => handlePrintCanonicalDoc('inventario_llaves_activos', 'Acta_Inventario_Fisico_Llaves_y_Activos')
      },
      {
        id: 'protocolo_claves_digitales',
        title: 'Protocolo Seguro de Traspaso de Accesos Digitales y Revocación de Claves',
        subtitle: `Resguardo de ciberseguridad para ${docState.credentialItems.length} plataformas (Banco ${live.bankName}, SII, Previred, MiDT, Correo, CCTV).`,
        badge: 'Anexo Digital • Bloque F',
        badgeColor: 'purple',
        format: 'PDF Canónico Carta (1 Pág)',
        category: 'anexos',
        ready: true,
        statusLabel: `${docState.credentialItems.length} Accesos Críticos`,
        statusTone: 'emerald',
        icon: Lock,
        openHint: 'Personalizar cuentas, métodos 2FA y estado de revocación',
        onOpen: () => setEditingDocModal('claves'),
        onPreview: () => setPreviewDocKey('protocolo_claves_digitales'),
        onPrint: () => handlePrintCanonicalDoc('protocolo_claves_digitales', 'Protocolo_Traspaso_y_Revocacion_Claves')
      },
      buildLibraryRow({
        id: 'doc_reglamento_cbr',
        title: 'Reglamento de Copropiedad Vigente e Inscripción CBR',
        subtitle: 'Descarga directa desde Biblioteca de la comunidad si fue subido; o emite Ficha Oficial de Constancia de Entrega Física.',
        badge: 'Carpeta Legal • Bloque A.1',
        keywordsMatch: reglamentoFile,
        slug: 'Constancia_Reglamento_Copropiedad_CBR'
      }),
      buildLibraryRow({
        id: 'doc_poliza_incendio',
        title: 'Póliza Vigente de Seguro Colectivo contra Incendio (Art. 43°)',
        subtitle: 'Descarga directa desde Biblioteca de la comunidad si fue subida; o emite Ficha Oficial de Constancia de Póliza.',
        badge: 'Carpeta Legal • Bloque E.1',
        keywordsMatch: polizaFile,
        slug: 'Constancia_Poliza_Seguro_Incendio'
      }),
      buildLibraryRow({
        id: 'doc_plan_emergencia',
        title: 'Plan de Emergencia y Evacuación Actualizado (Art. 40°)',
        subtitle: 'Descarga directa desde Biblioteca de la comunidad si fue subido; o emite Ficha Oficial de Constancia de Seguridad.',
        badge: 'Carpeta Legal • Bloque E.2',
        keywordsMatch: emergenciaFile,
        slug: 'Constancia_Plan_Emergencia_y_Planos'
      })
    ];
  }, [isAnnual, live, meta, docState, hydratedDocs, pdfStyle, reconciliation, mandateChecks]);

  const filteredDocs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return documentsCatalog.filter((doc) => {
      if (activeCategory !== 'todos' && doc.category !== activeCategory) return false;
      if (!q) return true;
      return (
        doc.title.toLowerCase().includes(q) ||
        doc.subtitle.toLowerCase().includes(q) ||
        doc.badge.toLowerCase().includes(q)
      );
    });
  }, [documentsCatalog, activeCategory, searchQuery]);

  const printableGeneratedKeys = [
    'acta_entrega_final',
    'carta_puesta_disposicion',
    'constancia_baja_mandatos',
    'informe_anual_ejecutivo',
    'acta_asamblea_anual',
    'rendicion_corte_sistema',
    'padron_morosidad_sistema',
    'certificado_laboral_sistema',
    'catastro_proveedores_mantenciones',
    'reporte_continuidad_reclamos',
    'inventario_llaves_activos',
    'protocolo_claves_digitales',
    'presupuesto_proyectado_anual',
    'doc_reglamento_cbr',
    'doc_poliza_incendio',
    'doc_plan_emergencia'
  ];

  const activePreviewObj = documentsCatalog.find((d) => d.id === previewDocKey);

  return (
    <div className="space-y-5">
      {/* 1. CUADRATURA CONTABLE AUTOMÁTICA PESO A PESO DE CORTE */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 md:p-6 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0F3D2E] text-[#D4B895] flex items-center justify-center shrink-0">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Verificación Contable Previa a Emitir Acta
                </span>
                {reconciliation.isBalanced ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-black">
                    ✓ CUADRATURA EXACTA PESO A PESO ($0 DIFERENCIA)
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black">
                    ⚠ DIFERENCIA POR JUSTIFICAR: {formatCLP(reconciliation.diff)}
                  </span>
                )}
              </div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 mt-0.5">
                Cuadratura Financiera de Cierre (Banco + Caja Chica vs. Fondos Declarados)
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const exactOp = Math.max(0, reconciliation.realAvailable - reconciliation.reserve - reconciliation.special);
              setDocState({ ...docState, operationalFundDeclared: exactOp });
              onTriggerToast?.('✓ Fondo Operacional cuadrado exactamente con el saldo disponible real.');
            }}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#0F3D2E] border border-emerald-200 text-xs font-black cursor-pointer shrink-0 transition-all"
          >
            ⚡ Cuadrar Fondo Operacional Exacto
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
          {/* Lado A: Disponible Real */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between font-black text-slate-800 uppercase text-[10.5px]">
              <span>A. Dinero Real Arqueado en Custodia</span>
              <span className="text-[#0F3D2E] font-mono text-xs">{formatCLP(reconciliation.realAvailable)}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">(+) Saldo Cartola Banco</label>
                <input
                  type="number"
                  value={reconciliation.bank}
                  onChange={(e) => setDocState({ ...docState, bankStatementBalance: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">(+) Efectivo Caja Chica</label>
                <input
                  type="number"
                  value={reconciliation.cash}
                  onChange={(e) => setDocState({ ...docState, pettyCashBalance: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">(-) Cheques en Tránsito</label>
                <input
                  type="number"
                  value={reconciliation.transit}
                  onChange={(e) => setDocState({ ...docState, inTransitChecks: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Lado B: Fondos Contables */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between font-black text-slate-800 uppercase text-[10.5px]">
              <span>B. Desglose de Fondos Contables de la Comunidad</span>
              <span className="text-[#0F3D2E] font-mono text-xs">{formatCLP(reconciliation.declaredTotal)}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">(+) Fondo Operacional</label>
                <input
                  type="number"
                  value={reconciliation.operational}
                  onChange={(e) => setDocState({ ...docState, operationalFundDeclared: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">(+) Fondo Reserva Art. 39</label>
                <input
                  type="number"
                  value={reconciliation.reserve}
                  onChange={(e) => setDocState({ ...docState, reserveFundDeclared: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">(+) Fondos Especiales</label>
                <input
                  type="number"
                  value={reconciliation.special}
                  onChange={(e) => setDocState({ ...docState, specialFundsDeclared: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-900"
                />
              </div>
            </div>
          </div>
        </div>

        {!reconciliation.isBalanced && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 flex flex-col sm:flex-row sm:items-center gap-3 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
            <input
              type="text"
              value={docState.discrepancyNotes || ''}
              onChange={(e) => setDocState({ ...docState, discrepancyNotes: e.target.value })}
              placeholder="Explica aquí la diferencia contable (ej: abono en tránsito por identificar o déficit operacional cubierto temporalmente)..."
              className="flex-1 px-3 py-1.5 rounded-xl border border-amber-300 bg-white text-slate-900"
            />
          </div>
        )}
      </div>

      {/* 2. BARRA MAESTRA: DOSSIER COMPLETO EN 1 SOLO PDF + EXPORTACIÓN ABIERTA CSV/JSON (BLOQUE F.2) */}
      <div className="bg-[#0F3D2E] text-white p-5 rounded-3xl shadow-sm border border-[#D4B895]/30 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#D4B895] block">
            Emisión Consolidada en 1 Clic + Portabilidad Legal Bloque F.2
          </span>
          <h4 className="text-sm sm:text-base font-black text-white">
            Emitir Dossier Completo Foliado (PDF Único) o Exportar Base de Datos Abierta (.CSV Excel + .JSON)
          </h4>
          <p className="text-xs text-emerald-100/80">
            Reúne Portada, Índice, Pauta de 3 páginas, Acta y todos los reportes del sistema en un solo archivo listo para firmar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportOpenDataPack}
            className="px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
            title="Descarga planilla CSV compatible con Excel + respaldo JSON completo de la comunidad (Cumple Bloque F.2)"
          >
            <Database className="w-3.5 h-3.5 text-[#D4B895]" />
            <span>Exportar CSV + JSON (F.2)</span>
          </button>

          <button
            type="button"
            onClick={() => setPreviewDocKey('FULL_DOSSIER')}
            className="px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Eye className="w-3.5 h-3.5 text-[#D4B895]" />
            <span>Previa Dossier</span>
          </button>

          <button
            type="button"
            onClick={handlePrintFullDossier}
            className="px-4 py-2.5 rounded-xl bg-[#D4B895] hover:bg-[#c5a67f] text-[#0F3D2E] text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
          >
            <PackageCheck className="w-4 h-4" />
            <span>Emitir Expediente Completo (1 PDF)</span>
          </button>
        </div>
      </div>

      {/* 3. CABECERA DE LA BANDEJA INDIVIDUAL CON FILTROS Y BUSCADOR */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar documento individual (ej: Acta, Puesta a disposición, Mandatos, Morosidad, Previred, Llaves)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0F3D2E] focus:bg-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200 shrink-0 overflow-x-auto">
            {[
              { id: 'todos', label: 'Todos', count: documentsCatalog.length },
              { id: 'actas', label: 'Pauta, Actas & Blindaje', count: documentsCatalog.filter((d) => d.category === 'actas').length },
              { id: 'sistema', label: 'Desde Módulos App', count: documentsCatalog.filter((d) => d.category === 'sistema').length },
              { id: 'anexos', label: isAnnual ? 'Presupuesto' : 'Inventario & Claves', count: documentsCatalog.filter((d) => d.category === 'anexos').length },
              { id: 'biblioteca', label: 'Carpeta Legal', count: documentsCatalog.filter((d) => d.category === 'biblioteca').length }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeCategory === tab.id
                    ? 'bg-[#0F3D2E] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    activeCategory === tab.id ? 'bg-[#D4B895] text-[#0F3D2E]' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. LISTADO UNIFORME DE DOCUMENTOS (IR + VER PREVIA + DESCARGAR PDF) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden divide-y divide-slate-100">
        {filteredDocs.map((doc) => {
          const DocIcon = doc.icon || FileText;
          return (
            <div
              key={doc.id}
              className={`p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors hover:bg-slate-50/80 ${
                doc.isPrimary ? 'bg-emerald-50/30' : ''
              }`}
            >
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                <div
                  className={`p-2.5 rounded-2xl shrink-0 mt-0.5 ${
                    doc.isPrimary
                      ? 'bg-[#0F3D2E] text-[#D4B895] shadow-xs'
                      : doc.category === 'sistema'
                      ? 'bg-emerald-50 text-[#0F3D2E] border border-emerald-200'
                      : doc.category === 'anexos'
                      ? 'bg-purple-50 text-purple-800 border border-purple-200'
                      : doc.category === 'actas'
                      ? 'bg-teal-50 text-[#0F3D2E] border border-teal-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                >
                  <DocIcon className="w-5 h-5" />
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider ${
                        doc.badgeColor === 'gold'
                          ? 'bg-[#0F3D2E] text-[#D4B895]'
                          : doc.badgeColor === 'emerald'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                          : doc.badgeColor === 'purple'
                          ? 'bg-purple-100 text-purple-900 border border-purple-200'
                          : doc.badgeColor === 'blue'
                          ? 'bg-blue-100 text-blue-900 border border-blue-200'
                          : doc.badgeColor === 'amber'
                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {doc.badge}
                    </span>

                    <span className="text-[10.5px] font-mono text-slate-500">{doc.format}</span>

                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        doc.statusTone === 'emerald'
                          ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                          : 'text-amber-800 bg-amber-50 border-amber-200'
                      }`}
                    >
                      {doc.statusTone === 'emerald' ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Clock className="w-3 h-3 text-amber-600" />
                      )}
                      {doc.statusLabel}
                    </span>
                  </div>

                  <h4 className="text-sm font-black text-slate-900 tracking-tight leading-snug">
                    {doc.title}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                    {doc.subtitle}
                  </p>

                  {doc.category === 'biblioteca' && !doc.hasUploadedBinary && (
                    <button
                      type="button"
                      onClick={doc.onUploadRedirect}
                      className="text-[11px] font-bold text-[#0F3D2E] hover:underline inline-flex items-center gap-1 mt-0.5 cursor-pointer"
                    >
                      <span>↗ O subir archivo PDF escaneado en Biblioteca de la Comunidad</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0 md:self-center">
                <button
                  type="button"
                  onClick={doc.onOpen}
                  className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  title={doc.openHint || 'Ir al lugar de trabajo o configuración del documento'}
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#0F3D2E]" />
                  <span>Ir</span>
                </button>

                <button
                  type="button"
                  onClick={doc.onPreview}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Previsualizar documento con formato oficial antes de descargar"
                >
                  <Eye className="w-3.5 h-3.5 text-[#0F3D2E]" />
                  <span>Ver Previa</span>
                </button>

                <button
                  type="button"
                  onClick={doc.onPrint}
                  className="px-3.5 py-2 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  title="Imprimir o guardar en PDF oficial"
                >
                  <Download className="w-3.5 h-3.5 text-[#D4B895]" />
                  <span>Descargar PDF</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. MODAL DE CONFIGURACIÓN RÁPIDA */}
      {editingDocModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#0F3D2E]" />
                <h4 className="text-sm sm:text-base font-black text-slate-900">
                  {editingDocModal === 'acta' && (isAnnual ? 'Configurar Acuerdos del Acta de Asamblea Anual' : 'Configurar Pasivos al Corte y Glosa del Acta de Entrega')}
                  {editingDocModal === 'inventario' && 'Personalizar Inventario Físico de Llaves, Controles y Activos'}
                  {editingDocModal === 'claves' && 'Personalizar Protocolo de Traspaso y Revocación de Accesos Digitales'}
                  {editingDocModal === 'presupuesto' && 'Ajustar Proyección de Presupuesto Anual'}
                  {editingDocModal.startsWith('constancia:') && 'Configurar Ficha Oficial de Constancia Documental'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setEditingDocModal(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editingDocModal === 'acta' && (
              <div className="space-y-3 text-xs">
                {!isAnnual && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                      Monto Total Facturas de Proveedores Devengadas por Pagar ($)
                    </label>
                    <input
                      type="number"
                      value={docState.pendingInvoicesAmount || 0}
                      onChange={(e) => setDocState({ ...docState, pendingInvoicesAmount: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                    {isAnnual ? 'Detalle de votación / acuerdos adoptados en Asamblea' : 'Observaciones o salvedades especiales para el Acta Final'}
                  </label>
                  <textarea
                    rows={3}
                    value={docState.actaNotes || ''}
                    onChange={(e) => setDocState({ ...docState, actaNotes: e.target.value })}
                    placeholder="Escribe cualquier acuerdo específico o constancia adicional..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900"
                  />
                </div>
              </div>
            )}

            {editingDocModal === 'inventario' && (
              <div className="space-y-2.5 text-xs">
                {docState.inventoryItems.map((it, idx) => (
                  <div key={it.id} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <input
                      type="text"
                      value={it.name}
                      onChange={(e) => {
                        const next = [...docState.inventoryItems];
                        next[idx] = { ...it, name: e.target.value };
                        setDocState({ ...docState, inventoryItems: next });
                      }}
                      placeholder="Elemento / Llave / Equipo"
                      className="col-span-12 sm:col-span-5 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold"
                    />
                    <input
                      type="text"
                      value={it.quantity}
                      onChange={(e) => {
                        const next = [...docState.inventoryItems];
                        next[idx] = { ...it, quantity: e.target.value };
                        setDocState({ ...docState, inventoryItems: next });
                      }}
                      placeholder="Cantidad"
                      className="col-span-4 sm:col-span-2 px-2 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                    <input
                      type="text"
                      value={it.notes || ''}
                      onChange={(e) => {
                        const next = [...docState.inventoryItems];
                        next[idx] = { ...it, notes: e.target.value };
                        setDocState({ ...docState, inventoryItems: next });
                      }}
                      placeholder="Observación"
                      className="col-span-6 sm:col-span-4 px-2 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setDocState({
                          ...docState,
                          inventoryItems: docState.inventoryItems.filter((_, i) => i !== idx)
                        })
                      }
                      className="col-span-2 sm:col-span-1 p-1.5 text-slate-400 hover:text-rose-600 flex justify-center cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setDocState({
                      ...docState,
                      inventoryItems: [
                        ...docState.inventoryItems,
                        { id: `inv-${Date.now()}`, name: '', quantity: '1 unidad', condition: 'Operativo', delivered: true, notes: '' }
                      ]
                    })
                  }
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0F3D2E] font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar fila de inventario</span>
                </button>
              </div>
            )}

            {editingDocModal === 'claves' && (
              <div className="space-y-2.5 text-xs">
                {docState.credentialItems.map((cr, idx) => (
                  <div key={cr.id} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <input
                      type="text"
                      value={cr.platform}
                      onChange={(e) => {
                        const next = [...docState.credentialItems];
                        next[idx] = { ...cr, platform: e.target.value };
                        setDocState({ ...docState, credentialItems: next });
                      }}
                      placeholder="Plataforma"
                      className="col-span-12 sm:col-span-4 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-bold"
                    />
                    <input
                      type="text"
                      value={cr.accountRef}
                      onChange={(e) => {
                        const next = [...docState.credentialItems];
                        next[idx] = { ...cr, accountRef: e.target.value };
                        setDocState({ ...docState, credentialItems: next });
                      }}
                      placeholder="Usuario / RUT / Cuenta"
                      className="col-span-6 sm:col-span-3 px-2 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                    <input
                      type="text"
                      value={cr.method}
                      onChange={(e) => {
                        const next = [...docState.credentialItems];
                        next[idx] = { ...cr, method: e.target.value };
                        setDocState({ ...docState, credentialItems: next });
                      }}
                      placeholder="Medio de entrega"
                      className="col-span-6 sm:col-span-4 px-2 py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setDocState({
                          ...docState,
                          credentialItems: docState.credentialItems.filter((_, i) => i !== idx)
                        })
                      }
                      className="col-span-12 sm:col-span-1 p-1.5 text-slate-400 hover:text-rose-600 flex justify-center cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setDocState({
                      ...docState,
                      credentialItems: [
                        ...docState.credentialItems,
                        { id: `cr-${Date.now()}`, platform: '', accountRef: '', method: 'Entrega directa al Comité', transferred: true, revoked: true }
                      ]
                    })
                  }
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0F3D2E] font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar plataforma digital</span>
                </button>
              </div>
            )}

            {editingDocModal === 'presupuesto' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                    Porcentaje de Reajuste Anual Estimado IPC / UF (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={docState.budgetIncreasePct ?? 4.5}
                    onChange={(e) => setDocState({ ...docState, budgetIncreasePct: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900"
                  />
                </div>
              </div>
            )}

            {editingDocModal.startsWith('constancia:') && (() => {
              const targetKey = editingDocModal.split(':')[1];
              const curr = (docState.legalConstancias || {})[targetKey] || {};
              const updateConst = (patch) =>
                setDocState({
                  ...docState,
                  legalConstancias: {
                    ...(docState.legalConstancias || {}),
                    [targetKey]: { ...curr, ...patch }
                  }
                });
              return (
                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-2">
                    <span>¿Tienes el PDF escaneado de este documento para subirlo a la Comunidad?</span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingDocModal(null);
                        onNavigateToTab?.('comunicados', 'documentos');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#0F3D2E] text-white font-bold cursor-pointer shrink-0"
                    >
                      Ir a Subir PDF ↗
                    </button>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Estado / Modalidad de Entrega</label>
                    <input
                      type="text"
                      value={curr.statusLabel || ''}
                      onChange={(e) => updateConst({ statusLabel: e.target.value })}
                      placeholder="Ej: Entregado en original físico en archivador legal"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">N° Póliza / Fojas CBR / Identificación</label>
                    <input
                      type="text"
                      value={curr.reference || ''}
                      onChange={(e) => updateConst({ reference: e.target.value })}
                      placeholder="Ej: Fojas 4120 N° 2890 CBR La Serena / Póliza N° 884920"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Ubicación física u observación</label>
                    <input
                      type="text"
                      value={curr.notes || ''}
                      onChange={(e) => updateConst({ notes: e.target.value })}
                      placeholder="Detalle para dejar constancia en la hoja firmada..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    />
                  </div>
                </div>
              );
            })()}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  const targetPreview =
                    editingDocModal === 'acta'
                      ? isAnnual
                        ? 'acta_asamblea_anual'
                        : 'acta_entrega_final'
                      : editingDocModal === 'inventario'
                      ? 'inventario_llaves_activos'
                      : editingDocModal === 'claves'
                      ? 'protocolo_claves_digitales'
                      : editingDocModal === 'presupuesto'
                      ? 'presupuesto_proyectado_anual'
                      : editingDocModal.split(':')[1];
                  setEditingDocModal(null);
                  setPreviewDocKey(targetPreview);
                }}
                className="px-4 py-2 rounded-xl bg-[#0F3D2E] text-white text-xs font-bold cursor-pointer"
              >
                Guardar y Ver Previa PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL DE VISTA PREVIA EN HOJAS CARTA CANÓNICAS (INDIVIDUAL O DOSSIER COMPLETO) */}
      {previewDocKey && (previewDocKey === 'FULL_DOSSIER' || activePreviewObj) && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-5xl w-full p-4 md:p-6 shadow-2xl border border-slate-200 max-h-[94vh] flex flex-col relative">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 mb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-[#0F3D2E] text-[#D4B895] flex items-center justify-center font-black text-xs">
                  PDF
                </span>
                <div>
                  <h4 className="text-sm md:text-base font-black text-slate-900">
                    {previewDocKey === 'FULL_DOSSIER'
                      ? isAnnual
                        ? 'Dossier Oficial Completo de Rendición de Cuentas Anual'
                        : 'Expediente Integral Foliado de Entrega y Traspaso de Administración'
                      : activePreviewObj?.title}
                  </h4>
                  <p className="text-[10.5px] text-slate-500 font-mono">
                    {meta.communityName || live.communityName} • Estilo Visual Oficial de Entrega ARANPRO
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <AranproPdfStyleSelector value={pdfStyle} onChange={onSetPdfStyle} compact />
                <button
                  type="button"
                  onClick={previewDocKey === 'FULL_DOSSIER' ? handlePrintFullDossier : activePreviewObj?.onPrint}
                  className="px-3.5 py-2 bg-[#0F3D2E] hover:bg-[#0A291F] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-[#D4B895]" />
                  <span>Imprimir / Descargar PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDocKey(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 bg-slate-100/80 p-3 md:p-5 rounded-2xl">
              {previewDocKey === 'FULL_DOSSIER' ? (
                <FullHandoverDossierPrint
                  printableId="preview-full-handover-dossier"
                  phase={phase}
                  currentCommunity={currentCommunity}
                  getUnitFinancials={getUnitFinancials}
                  live={live}
                  meta={meta}
                  company={company}
                  sections={sections}
                  entries={entries}
                  docState={docState}
                  mandateChecks={mandateChecks}
                  pdfStyle={pdfStyle}
                />
              ) : (
                <CanonicalHandoverDocumentPrint
                  printableId={`preview-doc-${previewDocKey}`}
                  docKey={previewDocKey}
                  phase={phase}
                  currentCommunity={currentCommunity}
                  getUnitFinancials={getUnitFinancials}
                  live={live}
                  meta={meta}
                  company={company}
                  sections={sections}
                  entries={entries}
                  docState={docState}
                  mandateChecks={mandateChecks}
                  pdfStyle={pdfStyle}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. CONTENEDORES OCULTOS PARA IMPRESIÓN DIRECTA EN IFRAME SIN ABRIR MODAL */}
      <div className="hidden" aria-hidden="true">
        {printableGeneratedKeys.map((k) => (
          <CanonicalHandoverDocumentPrint
            key={k}
            printableId={`printable-doc-${k}`}
            docKey={k}
            phase={phase}
            currentCommunity={currentCommunity}
            getUnitFinancials={getUnitFinancials}
            live={live}
            meta={meta}
            company={company}
            sections={sections}
            entries={entries}
            docState={docState}
            mandateChecks={mandateChecks}
            pdfStyle={pdfStyle}
          />
        ))}
        <FullHandoverDossierPrint
          printableId="printable-full-handover-dossier"
          phase={phase}
          currentCommunity={currentCommunity}
          getUnitFinancials={getUnitFinancials}
          live={live}
          meta={meta}
          company={company}
          sections={sections}
          entries={entries}
          docState={docState}
          mandateChecks={mandateChecks}
          pdfStyle={pdfStyle}
        />
      </div>
    </div>
  );
}
