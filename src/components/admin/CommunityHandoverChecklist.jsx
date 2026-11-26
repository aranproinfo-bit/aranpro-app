import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  MinusCircle,
  Search,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  RotateCcw,
  CheckCheck,
  ShieldAlert,
  FileCheck2,
  Building2,
  Landmark,
  Users,
  Scale,
  Wrench,
  Lock,
  ClipboardList
} from 'lucide-react';
import {
  CanonicalPdfHeader,
  CanonicalPdfPageFooter,
  CanonicalPdfFinalSignature,
  canonicalPdfHeaderStyles
} from '../common/CanonicalPdfParts';
import { formatCLP } from '../../utils/formatters';

// Estilos exactos de impresión canónica de 3 páginas Carta (alineados con TransitionChecklist)
export const handoverPautaPrintStyles = `
  @page { size: letter portrait; margin: 0 !important; }
  .dossier-page {
    width: 100% !important; max-width: 100% !important; margin: 0 !important; box-shadow: none !important;
    height: 279.4mm !important; min-height: 279.4mm !important; max-height: 279.4mm !important;
    padding: 7.5mm 15mm 7.5mm 16.5mm !important;
    font-size: 10px !important; line-height: 1.26 !important;
    page-break-after: always !important; break-after: page !important;
  }
  .dossier-page:not([data-pdf-style="alt1"]):not([data-pdf-style="alt2"]) {
    border-left: 3.3mm solid #0F3D2E !important;
    background-image: linear-gradient(#D4B895, #D4B895) !important;
    background-size: 1.2mm 100% !important; background-position: 0.5mm 0 !important;
    background-repeat: no-repeat !important;
  }
  .dossier-page:last-child {
    page-break-after: avoid !important; break-after: avoid !important;
  }
  .dossier-page img[src*="ARANPRO_logo_horizontal"] {
    width: 37mm !important; max-width: 37mm !important;
    height: auto !important; max-height: 11mm !important; object-fit: contain !important;
  }
  ${canonicalPdfHeaderStyles}
  .transition-title { margin-top: 3mm !important; margin-bottom: 3mm !important; }
  .transition-title h2 { font-family: Arial, sans-serif !important; font-size: 13.5pt !important; line-height: 15.5pt !important; font-weight: 700 !important; }
  .transition-title p { font-size: 8.3pt !important; line-height: 10pt !important; margin-top: 0.8mm !important; }
  .transition-metadata { font-size: 7.3pt !important; }
  .transition-metadata strong { background: #f8fafc !important; margin: -4px -4px 2px; padding: 2.5px 4px; }
  .dossier-page table { font-size: 7.85pt !important; line-height: 1.22 !important; }
  .dossier-page table td { padding-top: 4.5px !important; padding-bottom: 4.5px !important; vertical-align: middle !important; }
  .transition-page-with-notes table td { padding-top: 6.5px !important; padding-bottom: 6.5px !important; }
  .transition-final-footer { gap: 8px !important; }
  .transition-final-footer .transition-footer-details { gap: 8px !important; flex: 1 1 auto; min-width: 0; }
  .transition-final-footer .transition-footer-seal { flex: 0 0 auto; gap: 6px !important; }
  .transition-final-footer .transition-footer-seal > div { white-space: nowrap; }
  .transition-final-footer .transition-footer-seal > div > div:first-child { font-size: 8px !important; letter-spacing: 0 !important; }
  .transition-final-footer .transition-footer-seal > div > div:last-child { font-size: 7.5px !important; }
  .transition-final-footer .transition-footer-contact { flex: 0 0 auto; white-space: nowrap; font-size: 8px !important; padding-left: 8px !important; }
  .transition-final-footer .transition-footer-signature { flex: 0 0 210px; min-width: 0 !important; }
  .aranpro-print-watermark { display: none !important; }
`;

export const FORMAT_OPTIONS = [
  { value: '', label: 'Formato / soporte...' },
  { value: 'Mixto (Físico + Digital)', label: 'Mixto (Físico + Digital)' },
  { value: 'Digital (PDF / Excel)', label: 'Digital (PDF / Excel)' },
  { value: 'Físico (Original)', label: 'Físico (Original)' },
  { value: 'Físico (Copia foliada)', label: 'Físico (Copia foliada)' },
  { value: 'Custodia en Conserjería', label: 'Custodia en Conserjería' },
  { value: 'Credencial / Acceso seguro', label: 'Credencial / Acceso seguro' }
];

/**
 * Construye los 7 bloques (28 antecedentes) de la Fase B: Entrega y Traspaso de Administración
 * integrando datos vivos reales de la comunidad activa.
 */
export const buildHandoverSections = (live) => [
  {
    code: 'A',
    page: 1,
    icon: Scale,
    title: 'A. Gobierno y archivo legal',
    subtitle: 'Constitución legal, actas de órganos de administración, padrón y personería vigente',
    items: [
      {
        id: 'tr_a1',
        code: 'A.1',
        printLabel: 'Reglamento de copropiedad vigente, modificaciones, inscripción y antecedentes de dominio disponibles.',
        title: 'Reglamento de copropiedad vigente, modificaciones e inscripción en CBR',
        includes: 'Copia inscrita en el Conservador de Bienes Raíces (fojas, número y año), adecuación a Ley N° 21.442 si existe, reglamento interno de convivencia y tabla oficial de alícuotas de prorrateo.',
        legalRef: 'Arts. 8° y 10° Ley 21.442',
        critical: true,
        moduleTab: 'ajustes',
        moduleLabel: 'Ajustes & Legal',
        systemSummary: `Comunidad tipo ${live.communityType} • Prorrateo sobre ${live.totalUnits} unidades`,
        autoFormat: 'Digital (PDF / Excel)',
        autoQty: '1 carpeta legal',
        autoNote: `Reglamento y ficha legal de ${live.communityName} (${live.totalUnits} unidades).`
      },
      {
        id: 'tr_a2',
        code: 'A.2',
        printLabel: 'Actas de asambleas y sesiones del Comité, Libro de Actas y respaldo digital de sus documentos.',
        title: 'Libro de Actas foliado, actas de Asambleas, sesiones del Comité y escrituras públicas',
        includes: 'Libro físico de actas foliado, reducciones a escritura pública (nombramientos y poderes), citaciones formales, nóminas de asistencia firmadas y poderes de representación.',
        legalRef: 'Arts. 15° y 17° Ley 21.442',
        critical: true,
        moduleTab: 'asambleas',
        moduleLabel: 'Asambleas & Actas',
        systemSummary: `${live.assemblyMinutesCount} acta(s) de asamblea • ${live.committeeMeetingsCount} sesión(es) de Comité`,
        autoFormat: 'Mixto (Físico + Digital)',
        autoQty: `${live.assemblyMinutesCount} actas / ${live.committeeMeetingsCount} sesiones`,
        autoNote: `Respaldo digital de ${live.assemblyMinutesCount} actas de asamblea y ${live.committeeMeetingsCount} reuniones de Comité.`
      },
      {
        id: 'tr_a3',
        code: 'A.3',
        printLabel: 'Registro de copropietarios, arrendatarios y ocupantes actualizado.',
        title: 'Registro oficial actualizado de copropietarios, arrendatarios y ocupantes',
        includes: 'Nómina completa con propietario, RUT, correo electrónico habilitado para notificaciones legales, teléfono, alícuota, estacionamientos/bodegas, mascotas y registro de residentes electrodependientes o con movilidad reducida.',
        legalRef: 'Arts. 5° y 18° Ley 21.442',
        critical: true,
        moduleTab: 'unidades',
        moduleLabel: 'Padrón Unidades',
        systemSummary: `${live.totalUnits} unidades registradas • ${live.unitsWithEmailCount} con correo verificado`,
        autoFormat: 'Digital (PDF / Excel)',
        autoQty: `${live.totalUnits} unidades`,
        autoNote: `Padrón maestro actualizado de ${live.totalUnits} unidades exportado desde ARANPRO.`
      },
      {
        id: 'tr_a4',
        code: 'A.4',
        printLabel: 'RUT, certificados, poderes, mandatos y antecedentes tributarios o administrativos de la comunidad.',
        title: 'RUT comunitario, e-RUT SII, poderes bancarios, mandatos y carpeta tributaria',
        includes: 'Cédula e-RUT de la comunidad, declaraciones F29/retenciones o declaraciones juradas si aplican, escrituras de mandatos bancarios vigentes y certificados municipales.',
        legalRef: 'Art. 20° Ley 21.442',
        critical: true,
        moduleTab: 'ajustes',
        moduleLabel: 'Ficha Comunidad',
        systemSummary: live.communityRut ? `RUT Comunidad: ${live.communityRut}` : 'RUT comunitario pendiente de completar en ficha',
        autoFormat: 'Mixto (Físico + Digital)',
        autoQty: 'Carpeta SII / Bancos',
        autoNote: live.communityRut ? `Antecedentes RUT ${live.communityRut} y poderes vigentes.` : 'Antecedentes tributarios y poderes de representación.'
      },
      {
        id: 'tr_a5',
        code: 'A.5',
        printLabel: 'Expedientes de procesos judiciales, reclamos ante autoridad y cobranzas en curso.',
        title: 'Expedientes judiciales, cobranza ejecutiva y fiscalizaciones ante autoridades',
        includes: 'Causas vigentes en tribunales civiles o Juzgado de Policía Local (rol, tribunal, abogado patrocinante, estado procesal), requerimientos de SEREMI, SEC, Dirección del Trabajo o Municipalidad.',
        legalRef: 'Arts. 37° y 44° Ley 21.442',
        critical: false,
        moduleTab: 'unidades',
        moduleLabel: 'Cobranza & Notas',
        systemSummary: `${live.delinquentUnitsCount} unidad(es) con saldo moroso • ${live.repactacionCount} convenio(s) activo(s)`,
        autoFormat: 'Digital (PDF / Excel)',
        autoQty: `${live.repactacionCount} convenios`,
        autoNote: live.repactacionCount > 0 ? `Se informan ${live.repactacionCount} convenio(s) de pago vigentes; sin litigios ocultos.` : 'Sin juicios pendientes; gestiones de cobranza documentadas.'
      }
    ]
  },
  {
    code: 'B',
    page: 1,
    icon: Landmark,
    title: 'B. Rendición final y situación financiera',
    subtitle: 'Corte contable al último día de gestión, conciliación bancaria, fondos y cartera morosa',
    items: [
      {
        id: 'tr_b1',
        code: 'B.1',
        printLabel: 'Rendición documentada y detallada al cierre, con ingresos, egresos y respaldos.',
        title: 'Rendición de cuentas documentada al cierre con ingresos, egresos y respaldos',
        includes: 'Estado financiero integral hasta la fecha de corte, detalle de ingresos percibidos por unidad, gastos pagados por ítem y 100% de boletas, facturas y comprobantes de transferencia.',
        legalRef: 'Arts. 20° N° 9 y 21° Ley 21.442',
        critical: true,
        moduleTab: 'emision',
        moduleLabel: 'Cierre Contable',
        systemSummary: `Período activo ${live.periodLabel} • Egresos mes ${formatCLP(live.totalExpenses)} (${live.backedExpensesCount}/${live.expensesCount} con respaldo)`,
        autoFormat: 'Mixto (Físico + Digital)',
        autoQty: `Corte ${live.periodLabel}`,
        autoNote: `Rendición al cierre ${live.periodLabel}; ${live.backedExpensesCount} de ${live.expensesCount} egresos del mes con comprobante adjunto.`
      },
      {
        id: 'tr_b2',
        code: 'B.2',
        printLabel: 'Cartolas bancarias, conciliaciones, saldos, caja chica y comprobantes de transferencias o cheques pendientes.',
        title: 'Cartolas bancarias oficiales, conciliación al día, arqueo de caja chica y cheques en tránsito',
        includes: 'Cartola bancaria oficial a la fecha de entrega, conciliación peso a peso con saldo contable, entrega física de efectivo de caja chica y detalle de cheques girados no cobrados o abonos por identificar.',
        legalRef: 'Arts. 21° y 33° Ley 21.442',
        critical: true,
        moduleTab: 'resumen',
        moduleLabel: 'Dashboard Banco',
        systemSummary: `${live.bankName} ${live.bankAccount ? `N° ${live.bankAccount}` : ''} • Saldo ref. ${formatCLP(live.bankBalance)}`,
        autoFormat: 'Mixto (Físico + Digital)',
        autoQty: 'Cartolas al corte',
        autoNote: `Cuenta ${live.bankName} ${live.bankAccount || 'registrada'}; saldo conciliado al corte ${formatCLP(live.bankBalance)}.`
      },
      {
        id: 'tr_b3',
        code: 'B.3',
        printLabel: 'Estado del fondo de reserva y otros fondos de la comunidad.',
        title: 'Estado contable y disponible real del Fondo Común de Reserva y fondos especiales',
        includes: 'Cartola histórica del Fondo de Reserva (tasa de recargo mensual, multas e intereses ingresados, egresos extraordinarios autorizados por Comité/Asamblea), fondo operacional y fondos de indemnización.',
        legalRef: 'Art. 39° Ley 21.442',
        critical: true,
        moduleTab: 'resumen',
        moduleLabel: 'Fondo Reserva',
        systemSummary: `Fondo de Reserva acumulado: ${formatCLP(live.reserveFund)} (Recargo ${live.reservePercent}%)`,
        autoFormat: 'Digital (PDF / Excel)',
        autoQty: `Tasa ${live.reservePercent}%`,
        autoNote: `Fondo de Reserva acumulado por ${formatCLP(live.reserveFund)} (tasa vigente ${live.reservePercent}%).`
      },
      {
        id: 'tr_b4',
        code: 'B.4',
        printLabel: 'Gastos comunes emitidos, padrón de morosidad, convenios de pago, cuentas por cobrar y por pagar.',
        title: 'Últimos gastos comunes emitidos, padrón de morosidad, saldos a favor y cuentas por pagar',
        includes: 'Planilla de distribución del último cobro emitido, deuda desglosada por unidad, saldos a favor (abonos anticipados), pagarés/convenios vigentes y nómina de facturas de proveedores pendientes de pago.',
        legalRef: 'Arts. 32° y 35° Ley 21.442',
        critical: true,
        moduleTab: 'unidades',
        moduleLabel: 'Saldos & Mora',
        systemSummary: `Por cobrar: ${formatCLP(live.totalPendingDebt)} (${live.delinquentUnitsCount} unid.) • Saldos a favor: ${formatCLP(live.totalFavorBalance)}`,
        autoFormat: 'Digital (PDF / Excel)',
        autoQty: `${live.totalUnits} cuentas ctes.`,
        autoNote: `Mora total ${formatCLP(live.totalPendingDebt)} en ${live.delinquentUnitsCount} unidad(es); saldos a favor ${formatCLP(live.totalFavorBalance)}.`
      },
      {
        id: 'tr_b5',
        code: 'B.5',
        printLabel: 'Libros, comprobantes, facturas y documentación contable disponible; talonarios, si se utilizan.',
        title: 'Archivadores contables mensuales, facturas tributarias, boletas y talonarios',
        includes: 'Carpetas físicas y digitales de egresos e ingresos históricos, comprobantes foliados de pago, chequeras vigentes/anuladas y archivo de cierres anteriores.',
        legalRef: 'Art. 20° N° 2 y 9 Ley 21.442',
        critical: false,
        moduleTab: 'gastos',
        moduleLabel: 'Gastos & Respaldos',
        systemSummary: `${live.expensesCount} gastos período actual • ${live.historicalPeriodsCount} cierre(s) archivado(s)`,
        autoFormat: 'Mixto (Físico + Digital)',
        autoQty: `${live.historicalPeriodsCount + 1} períodos`,
        autoNote: `Respaldos tributarios y comprobantes foliados ordenados por período.`
      }
    ]
  },
  {
    code: 'C',
    page: 2,
    icon: Users,
    title: 'C. Personal y obligaciones laborales',
    subtitle: 'Contratos, cumplimiento previsional Previred, resguardo Ley Bustos y turnos de conserjería',
    items: [
      {
        id: 'tr_c1',
        code: 'C.1',
        printLabel: 'Carpetas del personal: contratos, anexos, liquidaciones, vacaciones, licencias, horas extra y bonos.',
        title: 'Carpetas individuales del personal: contratos, anexos 40 Horas, liquidaciones y feriados',
        includes: 'Contratos registrados en DT, anexos de reducción de jornada (Ley 21.561), liquidaciones firmadas, comprobantes de vacaciones, licencias médicas, pactos de horas extra (Art. 32 CT) y recepción RIOHS / Ley Karin.',
        legalRef: 'Código del Trabajo & Ley 21.643',
        critical: true,
        moduleTab: 'remuneraciones',
        moduleLabel: 'RR.HH. & Contratos',
        systemSummary: live.staffCount > 0 ? `${live.staffCount} trabajador(es) activo(s) en nómina` : 'Sin personal directo registrado en nómina',
        autoFormat: live.staffCount > 0 ? 'Mixto (Físico + Digital)' : '',
        autoQty: live.staffCount > 0 ? `${live.staffCount} carpeta(s)` : 'Sin personal',
        autoNote: live.staffCount > 0 ? `Carpetas completas de ${live.staffCount} trabajador(es): ${live.staffNames}.` : 'La comunidad no mantiene trabajadores contratados directamente.'
      },
      {
        id: 'tr_c2',
        code: 'C.2',
        printLabel: 'Comprobantes de cotizaciones, Previred, mutualidad, finiquitos y antecedentes de procesos laborales.',
        title: 'Planillas Previred pagadas, Certificado F30-1 vigente (Ley Bustos), mutualidad y finiquitos',
        includes: 'Comprobantes de pago íntegro de AFP, Fonasa/Isapre, AFC, SIS y Mutual hasta el último mes devengado, Certificado F30-1 de la Dirección del Trabajo sin multas ni deudas previsionales y finiquitos ratificados.',
        legalRef: 'Ley N° 19.631 (Ley Bustos)',
        critical: true,
        moduleTab: 'remuneraciones',
        moduleLabel: 'Previred & Finiquitos',
        systemSummary: live.staffCount > 0 ? `${live.payrollHistoryCount} cierre(s) de remuneraciones registrado(s)` : 'No aplica personal propio',
        autoFormat: live.staffCount > 0 ? 'Digital (PDF / Excel)' : '',
        autoQty: live.staffCount > 0 ? 'Previred + F30-1' : 'N/A',
        autoNote: live.staffCount > 0 ? 'Cotizaciones previsionales pagadas al día; respaldo para verificación F30-1 sin contingencia Ley Bustos.' : 'Sin dotación directa afecta a Previred.'
      },
      {
        id: 'tr_c3',
        code: 'C.3',
        printLabel: 'Listado de trabajadores vigentes, funciones, turnos y obligaciones o vencimientos próximos.',
        title: 'Nómina de dotación vigente, malla de turnos, registro de asistencia y vencimientos laborales',
        includes: 'Detalle de cargos (conserjes, mayordomo, aseo), estructura de turnos, libro o reloj biométrico de asistencia, certificaciones OS-10 vigentes y vencimientos de contratos a plazo fijo.',
        legalRef: 'Art. 20° N° 1 Ley 21.442',
        critical: false,
        moduleTab: 'remuneraciones',
        moduleLabel: 'Nómina Personal',
        systemSummary: live.staffCount > 0 ? `Dotación activa: ${live.staffNames}` : 'Operación sin personal contratado directo',
        autoFormat: live.staffCount > 0 ? 'Digital (PDF / Excel)' : '',
        autoQty: live.staffCount > 0 ? `${live.staffCount} funcionario(s)` : 'N/A',
        autoNote: live.staffCount > 0 ? `Nómina vigente con cargos, sueldos base y turnos de ${live.staffCount} funcionario(s).` : 'No registra trabajadores vigentes.'
      }
    ]
  },
  {
    code: 'D',
    page: 2,
    icon: Wrench,
    title: 'D. Proveedores, contratos y operación',
    subtitle: 'Contratos de servicios continuos, bitácoras de mantención y custodia material de llaves y activos',
    items: [
      {
        id: 'tr_d1',
        code: 'D.1',
        printLabel: 'Contratos vigentes, cotizaciones, órdenes de trabajo, garantías y expedientes de proveedores.',
        title: 'Contratos vigentes con proveedores, adjudicaciones, órdenes de trabajo y garantías',
        includes: 'Contratos suscritos con empresas de mantención (ascensores, bombas, corrientes débiles, áreas verdes, piscina, seguridad externa), pólizas/boletas de garantía y presupuestos adjudicados.',
        legalRef: 'Art. 20° N° 1 Ley 21.442',
        critical: false,
        moduleTab: 'gastos',
        moduleLabel: 'Proveedores',
        systemSummary: `${live.providersCount} proveedor(es) registrado(s) en directorio de la comunidad`,
        autoFormat: 'Digital (PDF / Excel)',
        autoQty: `${live.providersCount} proveedores`,
        autoNote: `Expediente de proveedores y contratos operativos asociados (${live.providersCount} registrados).`
      },
      {
        id: 'tr_d2',
        code: 'D.2',
        printLabel: 'Listado de proveedores, contactos, servicios, montos, renovaciones y obligaciones pendientes.',
        title: 'Directorio maestro de proveedores, contactos de emergencia 24/7, tarifas y vencimientos',
        includes: 'Razón social, RUT, teléfono técnico de urgencia, datos bancarios de transferencia, tarifa pactada (UF/CLP), fechas de renovación automática y preavisos de término.',
        legalRef: 'Continuidad Operativa',
        critical: false,
        moduleTab: 'gastos',
        moduleLabel: 'Catastro Proveedores',
        systemSummary: `${live.providersCount} fichas de proveedores con contacto y datos de pago`,
        autoFormat: 'Digital (PDF / Excel)',
        autoQty: '1 planilla maestra',
        autoNote: `Catastro actualizado de ${live.providersCount} proveedores habituales con contactos y cuentas de pago.`
      },
      {
        id: 'tr_d3',
        code: 'D.3',
        printLabel: 'Calendario de mantenciones, bitácoras, inventario y trabajos aprobados, en ejecución o pendientes.',
        title: 'Plan de mantenciones preventivas, Libro de Novedades, inventario y obras en curso',
        includes: 'Calendario anual de mantenciones preventivas/correctivas, Libro físico/digital de Novedades de Conserjería, bitácoras de sala de máquinas e inventario de herramientas y equipos comunes.',
        legalRef: 'Art. 20° N° 1 y 3 Ley 21.442',
        critical: true,
        moduleTab: 'gastos',
        moduleLabel: 'Mantenciones',
        systemSummary: `${live.maintenancesCount} mantención(es) en plan (${live.overdueMaintCount} vencida/urgente) • ${live.novedadesCount} novedad(es)`,
        autoFormat: 'Mixto (Físico + Digital)',
        autoQty: `${live.maintenancesCount} mantenciones`,
        autoNote: `Bitácora técnica con ${live.maintenancesCount} mantenciones registradas y libro de novedades al día.`
      },
      {
        id: 'tr_d4',
        code: 'D.4',
        printLabel: 'Llaves, controles, tarjetas, sellos, dispositivos y demás bienes bajo custodia física.',
        title: 'Entrega física de llaves maestras, controles remotos, tags RFID, timbres y dispositivos',
        includes: 'Juegos de llaves rotulados (salas de bombas, tableros eléctricos, ascensores, azotea, bodegas), controles vehiculares, tarjetas/tags en stock, teléfono de conserjería, timbres y Digipass bancario.',
        legalRef: 'Custodia Material Conforme',
        critical: true,
        moduleTab: null,
        moduleLabel: null,
        systemSummary: 'Requiere conteo físico presencial e individualización en acta',
        autoFormat: 'Físico (Original)',
        autoQty: 'Según inventario',
        autoNote: 'Entrega material presencial con recuento de llaves maestras, controles y dispositivos en custodia.'
      }
    ]
  },
  {
    code: 'E',
    page: 2,
    icon: ShieldAlert,
    title: 'E. Seguridad, seguros y antecedentes técnicos',
    subtitle: 'Póliza contra incendio, Plan de Emergencia Ley 21.442, certificaciones SEC/MINVU y planos',
    items: [
      {
        id: 'tr_e1',
        code: 'E.1',
        printLabel: 'Pólizas, certificados de cobertura, siniestros, primas y renovaciones de seguros.',
        title: 'Pólizas vigentes de seguro colectivo contra incendio, coberturas, pago de primas y siniestros',
        includes: 'Póliza colectiva obligatoria de espacios comunes y unidades ( salvo exclusión acreditada), comprobantes de primas al día, fecha de renovación y expedientes de siniestros abiertos.',
        legalRef: 'Art. 43° Ley 21.442',
        critical: true,
        moduleTab: 'ajustes',
        moduleLabel: 'Seguros & Legal',
        systemSummary: 'Verificación obligatoria de vigencia de póliza colectiva contra incendio',
        autoFormat: 'Digital (PDF / Excel)',
        autoQty: 'Póliza + endosos',
        autoNote: 'Antecedentes de póliza de seguro de espacios comunes y estado de primas.'
      },
      {
        id: 'tr_e2',
        code: 'E.2',
        printLabel: 'Plan de emergencia, evacuación, simulacros y registros de seguridad disponibles.',
        title: 'Plan de Emergencia y Evacuación actualizado, ingreso a Bomberos/Carabineros y simulacros',
        includes: 'Plan de emergencia suscrito por profesional competente, planos de vías de evacuación y grifos/red seca, constancia de entrega a Bomberos y Carabineros y registros de actualización anual.',
        legalRef: 'Art. 40° Ley 21.442',
        critical: true,
        moduleTab: 'comunicados',
        moduleLabel: 'Documentos Comunidad',
        systemSummary: `${live.documentsCount} documento(s) comunitario(s) publicado(s) en biblioteca`,
        autoFormat: 'Mixto (Físico + Digital)',
        autoQty: 'Plan vigente',
        autoNote: 'Plan de Emergencia y Evacuación con planos de seguridad del condominio.'
      },
      {
        id: 'tr_e3',
        code: 'E.3',
        printLabel: 'Certificaciones, mantenciones e informes de ascensores, gas, electricidad, incendios, bombas, generador y otros sistemas aplicables.',
        title: 'Certificaciones técnicas críticas: Ascensores MINVU, Sello Verde SEC, bombas, red húmeda y generador',
        includes: 'Certificados vigentes de transporte vertical (Ley 20.296), Sello Verde de instalaciones de gas (SEC), sanitización de estanques de agua potable (SEREMI Salud), recarga de extintores y red de incendio.',
        legalRef: 'Ley 20.296 / DS 66 SEC / Art. 20°',
        critical: true,
        moduleTab: 'gastos',
        moduleLabel: 'Plan Preventivo',
        systemSummary: `${live.maintenancesCount} ítem(s) de control técnico en módulo de mantención preventiva`,
        autoFormat: 'Mixto (Físico + Digital)',
        autoQty: 'Carpeta técnica',
        autoNote: 'Certificados e informes técnicos de instalaciones críticas aplicables al condominio.'
      },
      {
        id: 'tr_e4',
        code: 'E.4',
        printLabel: 'Planos, recepciones, manuales, garantías, fichas técnicas y antecedentes de obras o instalaciones.',
        title: 'Planos as-built, recepción definitiva DOM, fichas técnicas de equipos y garantías postventa',
        includes: 'Planos sanitarios, eléctricos, corrientes débiles y arquitectura; Certificado de Recepción Definitiva Municipal, resolución de copropiedad y garantías vigentes de constructora o contratistas.',
        legalRef: 'Arts. 48° y 49° Ley 21.442',
        critical: false,
        moduleTab: 'comunicados',
        moduleLabel: 'Archivo Técnico',
        systemSummary: 'Archivo histórico constructivo y manuales de equipamiento común',
        autoFormat: 'Mixto (Físico + Digital)',
        autoQty: 'Archivo técnico',
        autoNote: 'Planos, recepciones municipales y manuales disponibles en custodia de la comunidad.'
      }
    ]
  },
  {
    code: 'F',
    page: 3,
    icon: Lock,
    title: 'F. Sistemas y continuidad digital',
    subtitle: ' Respaldo de base de datos, portales bancarios/públicos, ciberseguridad y revocación de claves',
    items: [
      {
        id: 'tr_f1',
        code: 'F.1',
        printLabel: 'Correo institucional, dominios, respaldos y archivos digitales de la comunidad.',
        title: 'Correo institucional del condominio, nube documental y archivo histórico digitalizado',
        includes: 'Traspaso de cuenta de correo oficial de la comunidad, unidades Drive/nube con documentación histórica ordenada por año y cambio de teléfono/correo de recuperación.',
        legalRef: 'Custodia Digital Ley 21.442',
        critical: true,
        moduleTab: 'ajustes',
        moduleLabel: 'Correo Comunidad',
        systemSummary: `Correo registrado: ${live.communityEmail || 'Sin correo institucional configurado'}`,
        autoFormat: 'Credencial / Acceso seguro',
        autoQty: '1 cuenta oficial',
        autoNote: live.communityEmail ? `Cuenta institucional ${live.communityEmail} y repositorio digital.` : 'Entrega de correo y respaldos digitales de la comunidad.'
      },
      {
        id: 'tr_f2',
        code: 'F.2',
        printLabel: 'Exportación o respaldo de plataforma de administración, base de datos, gastos comunes y libro de novedades.',
        title: 'Exportación íntegra de plataforma ARANPRO (base de datos, cartolas, cobros y novedades)',
        includes: 'Respaldo estructurado en formatos abiertos (Excel/CSV, JSON y PDF) de unidades, cuenta corriente histórica por unidad, ingresos, egresos, remuneraciones, actas y certificados emitidos.',
        legalRef: 'Portabilidad de Datos',
        critical: true,
        moduleTab: 'ajustes',
        moduleLabel: 'Respaldos & Datos',
        systemSummary: `${live.totalUnits} unidades • ${live.certificatesCount} certificado(s) • Historial completo exportable`,
        autoFormat: 'Digital (PDF / Excel)',
        autoQty: 'Backup completo',
        autoNote: 'Exportación íntegra de padrón, saldos individuales, cobros e historial operativo ARANPRO.'
      },
      {
        id: 'tr_f3',
        code: 'F.3',
        printLabel: 'Traspaso seguro de usuarios administradores, métodos de recuperación y autorizaciones de plataformas bancarias y públicas aplicables.',
        title: 'Traspaso de apoderados bancarios y accesos SII, Previred, DT, CCTV/NVR y control de acceso',
        includes: 'Coordinación de habilitación de nuevos firmantes en banco, clave tributaria SII, empleador en Previred y MiDT, portales de empresas eléctricas/sanitarias, grabador de cámaras NVR y central de portones.',
        legalRef: 'Art. 20° Ley 21.442',
        critical: true,
        moduleTab: null,
        moduleLabel: null,
        systemSummary: 'Transferencia mediante canales seguros directos al Comité / Entrante',
        autoFormat: 'Credencial / Acceso seguro',
        autoQty: 'Acta de accesos',
        autoNote: 'Traspaso seguro de portales institucionales y coordinación de poderes bancarios.'
      },
      {
        id: 'tr_f4',
        code: 'F.4',
        printLabel: 'Cambio de credenciales y revocación de accesos del administrador saliente luego de la recepción.',
        title: 'Cambio efectivo de contraseñas y revocación formal de accesos del administrador saliente',
        includes: 'Verificación conjunta de actualización de claves maestras, desvinculación de correos/celulares de doble factor (2FA) y baja de apoderados salientes para resguardo de ambas partes.',
        legalRef: 'Trazabilidad & Ciberseguridad',
        critical: true,
        moduleTab: null,
        moduleLabel: null,
        systemSummary: 'Protección recíproca: libera de responsabilidad futura sobre accesos',
        autoFormat: 'Credencial / Acceso seguro',
        autoQty: 'Revocación total',
        autoNote: 'Se deja constancia de cambio de claves y baja de accesos del administrador saliente.'
      }
    ]
  },
  {
    code: 'G',
    page: 3,
    icon: ClipboardList,
    title: 'G. Pendientes y cierre de traspaso',
    subtitle: 'Continuidad de reclamos abiertos, compromisos próximos y suscripción formal del Acta Final',
    items: [
      {
        id: 'tr_g1',
        code: 'G.1',
        printLabel: 'Listado de reclamos, cobranzas, procedimientos, multas, litigios, trámites y asuntos pendientes.',
        title: 'Reporte de reclamos vecinales abiertos, trámites en curso, multas y seguimiento del Comité',
        includes: 'Detalle de tickets o solicitudes de residentes aún abiertas, tareas pendientes del Comité, cortes de suministro eléctrico programados, cobros de seguros o garantías en trámite.',
        legalRef: 'Continuidad de Gestión',
        critical: false,
        moduleTab: 'comunicados',
        moduleLabel: 'Mural & Reclamos',
        systemSummary: `${live.openTicketsCount} reclamo(s)/ticket(s) abierto(s) • ${live.pendingCommitteeTasksCount} tarea(s) de Comité pendiente(s)`,
        autoFormat: 'Digital (PDF / Excel)',
        autoQty: `${live.openTicketsCount} tickets / ${live.pendingCommitteeTasksCount} tareas`,
        autoNote: `Reporte de ${live.openTicketsCount} requerimiento(s) vecinales abiertos y ${live.pendingCommitteeTasksCount} tarea(s) de Comité.`
      },
      {
        id: 'tr_g2',
        code: 'G.2',
        printLabel: 'Presupuesto vigente, obras aprobadas, compromisos próximos y fecha de próxima asamblea o renovación relevante.',
        title: 'Presupuesto vigente, obras extraordinarias en ejecución y calendario de próximos hitos',
        includes: 'Estructura de costos fijos mensuales vigente, cuotas extraordinarias por recaudar, estados de pago por vencer con contratistas y fecha de próxima asamblea ordinaria o renovación de pólizas.',
        legalRef: 'Arts. 20° y 21° Ley 21.442',
        critical: false,
        moduleTab: 'comite',
        moduleLabel: 'Tareas Comité',
        systemSummary: `Gasto común base ref. ${formatCLP(live.grandTotal)} / mes`,
        autoFormat: 'Digital (PDF / Excel)',
        autoQty: 'Presupuesto vigente',
        autoNote: `Estructura mensual de referencia ${formatCLP(live.grandTotal)} y calendario de compromisos próximos.`
      },
      {
        id: 'tr_g3',
        code: 'G.3',
        printLabel: 'Acta final con fecha, modalidad de entrega, pendientes, responsables, plazos y constancia de recepción.',
        title: 'Suscripción del Acta Final de Entrega con inventario, salvedades, plazos y firmas oficiales',
        includes: 'Firma del Acta Oficial de Traspaso y de la presente Pauta foliada de 3 páginas por Comité, Administrador Saliente y Administrador Entrante, fijando plazo de revisión y subsanación de pendientes.',
        legalRef: 'Arts. 20° y 21° Ley 21.442',
        critical: true,
        moduleTab: null,
        moduleLabel: null,
        systemSummary: 'Habilita el cierre formal y resguardo jurídico del traspaso',
        autoFormat: 'Mixto (Físico + Digital)',
        autoQty: '3 ejemplares firmados',
        autoNote: 'Acta y pauta foliada emitidas en triplicado para Comité, Saliente y Entrante.'
      }
    ]
  }
];

/**
 * Construye los 6 bloques (24 antecedentes) de la Fase A: Rendición de Cuentas Anual (Art. 21 Ley 21.442)
 */
export const buildAnnualSections = (live) => [
  {
    code: 'A',
    page: 1,
    icon: Scale,
    title: 'A. Convocatoria, quórum y formalidades de Asamblea Ordinaria',
    subtitle: 'Cumplimiento de plazos legales de citación, envío anticipado de respaldos y padrón hábil',
    items: [
      {
        id: 'an_a1',
        code: 'A.1',
        printLabel: 'Citación formal a Asamblea Ordinaria despachada en plazo legal (5 a 15 días corridos previos) con tabla expresa.',
        title: 'Citación oficial a Asamblea Ordinaria dentro del plazo legal (5 a 15 días corridos)',
        includes: 'Notificación enviada al correo registrado o domicilio de cada copropietario indicando fecha, hora, lugar/modalidad telemática, primera y segunda citación y tabla con punto expreso de Rendición Anual.',
        legalRef: 'Art. 19° Ley 21.442',
        critical: true,
        moduleTab: 'asambleas',
        moduleLabel: 'Convocatoria',
        systemSummary: `${live.totalUnits} unidades a convocar • ${live.unitsWithEmailCount} con despacho por correo`,
        autoFormat: 'Mixto (Físico + Digital)',
        autoQty: `${live.totalUnits} citaciones`,
        autoNote: `Citación emitida con tabla oficial para ${live.totalUnits} unidades conforme al Art. 19°.`
      },
      {
        id: 'an_a2',
        code: 'A.2',
        printLabel: 'Puesta a disposición previa del balance anual, cartolas y documentación de respaldo para revisión de copropietarios.',
        title: 'Envío anticipado del informe anual, balance y acceso a respaldos documentales',
        includes: 'Remisión adjunta del balance de ingresos y egresos y habilitación de carpeta de respaldos (facturas, boletas y cartolas) para examen previo de la comunidad antes de la votación.',
        legalRef: 'Art. 21° Ley 21.442',
        critical: true,
        moduleTab: 'comunicados',
        moduleLabel: 'Mural & Biblioteca',
        systemSummary: `${live.documentsCount} documento(s) disponibles en portal de copropietarios`,
        autoFormat: 'Digital (PDF / Excel)',
        autoQty: 'Dossier anual PDF',
        autoNote: 'Balance e informe anual puestos a disposición previa de los copropietarios.'
      },
      {
        id: 'an_a3',
        code: 'A.3',
        printLabel: 'Nómina verificada de copropietarios hábiles (al día en gastos comunes), alícuotas de voto y poderes registrados.',
        title: 'Padrón de copropietarios hábiles con derecho a voto, ponderación por alícuota y poderes',
        includes: 'Corte de unidades al día (hábiles para votar), cálculo de quórum de constitución (mínimo 33% de derechos en sesión ordinaria) y validación de cartas poder simples o escrituras.',
        legalRef: 'Arts. 5° y 15° Ley 21.442',
        critical: true,
        moduleTab: 'asambleas',
        moduleLabel: 'Quórum & Poderes',
        systemSummary: `${live.paidUnitsCount} de ${live.totalUnits} unidades al día • ${live.proxiesCount} poder(es) registrado(s)`,
        autoFormat: 'Digital (PDF / Excel)',
        autoQty: `${live.paidUnitsCount} unid. hábiles`,
        autoNote: `Padrón verificado: ${live.paidUnitsCount}/${live.totalUnits} unidades hábiles y ${live.proxiesCount} poderes validados.`
      },
      {
        id: 'an_a4',
        code: 'A.4',
        printLabel: 'Revisión previa de la cuenta anual con el Comité de Administración y constancia de observaciones preliminares.',
        title: 'Sesión previa de revisión financiera y visación preliminar del Comité de Administración',
        includes: 'Acta o constancia de reunión previa con el Comité revisando las rendiciones mensuales acumuladas, conciliaciones y respuestas a consultas antes de exponer ante la Asamblea.',
        legalRef: 'Arts. 17° y 21° Ley 21.442',
        critical: false,
        moduleTab: 'comite',
        moduleLabel: 'Libro de Comité',
        systemSummary: `${live.committeeMeetingsCount} reunión(es) de Comité registrada(s) en libro`,
        autoFormat: 'Digital (PDF / Excel)',
        autoQty: 'Acta revisión Comité',
        autoNote: 'Cuenta revisada previamente en sesión de trabajo con el Comité de Administración.'
      }
    ]
  },
  {
    code: 'B',
    page: 1,
    icon: Landmark,
    title: 'B. Balance anual de ingresos, egresos y conciliación bancaria',
    subtitle: 'Cuadratura contable de los 12 meses del ejercicio contra cartolas bancarias y respaldos tributarios',
    items: [
      {
        id: 'an_b1',
        code: 'B.1',
        printLabel: 'Balance anual consolidado de ingresos percibidos (gastos comunes ordinarios, recargos, multas, convenios y otros).',
        title: 'Balance anual consolidado de todos los ingresos percibidos en el ejercicio',
        includes: 'Resumen mes a mes de recaudación por cuotas ordinarias, fondo de reserva, cuotas extraordinarias, uso de espacios comunes, multas, intereses y abonos por convenios de pago.',
        legalRef: 'Art. 21° Ley 21.442',
        critical: true,
        moduleTab: 'resumen',
        moduleLabel: 'Dashboard Financiero',
        systemSummary: `Recaudación período actual: ${formatCLP(live.totalCollected)} • ${live.historicalPeriodsCount} cierre(s) histórico(s)`,
        autoFormat: 'Digital (PDF / Excel)',
        autoQty: '12 meses consolidados',
        autoNote: `Ingresos conciliados contra comprobantes foliados; recaudación último mes ${formatCLP(live.totalCollected)}.`
      },
      {
        id: 'an_b2',
        code: 'B.2',
        printLabel: 'Detalle anualizado de egresos por ítem contable con facturas, boletas de honorarios y comprobantes verificables.',
        title: 'Estado anual de egresos por categoría (administración, RR.HH., mantención, consumos y reparaciones)',
        includes: 'Desglose anual comparativo por centro de costo con el 100% de documentos tributarios (facturas electrónicas, boletas, planillas Previred) y comprobantes de pago adjuntos.',
        legalRef: 'Arts. 20° N° 9 y 21° Ley 21.442',
        critical: true,
        moduleTab: 'gastos',
        moduleLabel: 'Gastos & Respaldos',
        systemSummary: `Egresos mes activo: ${formatCLP(live.totalExpenses)} (${live.backedExpensesCount}/${live.expensesCount} respaldados)`,
        autoFormat: 'Mixto (Físico + Digital)',
        autoQty: '100% respaldos',
        autoNote: `Egresos clasificados por categoría legal con respaldos tributarios (${live.backedExpensesCount}/${live.expensesCount} en mes actual).`
      },
      {
        id: 'an_b3',
        code: 'B.3',
        printLabel: 'Cartolas bancarias de los 12 meses del período rendido y conciliación bancaria cuadrada al cierre anual.',
        title: 'Cartolas bancarias completas de los 12 meses y certificado de conciliación bancaria al cierre',
        includes: 'Las 12 cartolas mensuales emitidas por el banco de la comunidad más el cuadro de conciliación final que demuestra coincidencia exacta entre el saldo contable y el saldo bancario.',
        legalRef: 'Arts. 21° y 33° Ley 21.442',
        critical: true,
        moduleTab: 'resumen',
        moduleLabel: 'Conciliación Banco',
        systemSummary: `${live.bankName} ${live.bankAccount ? `N° ${live.bankAccount}` : ''} • Saldo ref. ${formatCLP(live.bankBalance)}`,
        autoFormat: 'Digital (PDF / Excel)',
        autoQty: '12 cartolas + cierre',
        autoNote: `Cartolas oficiales de ${live.bankName} conciliadas con saldo de cierre ${formatCLP(live.bankBalance)}.`
      },
      {
        id: 'an_b4',
        code: 'B.4',
        printLabel: 'Arqueo de caja chica, partidas en tránsito y nómina de compromisos o facturas por pagar al cierre del ejercicio.',
        title: 'Arqueo de caja chica, cheques/transferencias en tránsito y pasivos devengados al cierre',
        includes: 'Acta de arqueo de fondos fijos en efectivo y listado transparente de facturas de fin de año devengadas cuyo pago vence en el mes siguiente.',
        legalRef: 'Art. 21° Ley 21.442',
        critical: true,
        moduleTab: 'gastos',
        moduleLabel: 'Cuentas por Pagar',
        systemSummary: `Control de compromisos devengados al corte del ejercicio`,
        autoFormat: 'Digital (PDF / Excel)',
        autoQty: 'Anexo de cierre',
        autoNote: 'Arqueo de caja chica y detalle de obligaciones devengadas al cierre anual.'
      }
    ]
  },
  {
    code: 'C',
    page: 2,
    icon: Building2,
    title: 'C. Fondo de reserva, recaudación y gestión de morosidad',
    subtitle: 'Trazabilidad del Fondo Común de Reserva (Art. 39°) y acciones legales/administrativas de cobranza',
    items: [
      {
        id: 'an_c1',
        code: 'C.1',
        printLabel: 'Cartola anual del Fondo de Reserva: saldo inicial, recargos recaudados, multas/intereses, usos autorizados y saldo final.',
        title: 'Rendición específica del Fondo Común de Reserva (movimientos y saldo disponible)',
        includes: 'Saldo de apertura anual, aportes mensuales recaudados, ingresos por multas e intereses penales, inversiones financieras si existen y giros extraordinarios autorizados.',
        legalRef: 'Art. 39° Ley 21.442',
        critical: true,
        moduleTab: 'resumen',
        moduleLabel: 'Fondo de Reserva',
        systemSummary: `Saldo acumulado Fondo de Reserva: ${formatCLP(live.reserveFund)} (${live.reservePercent}% mensual)`,
        autoFormat: 'Digital (PDF / Excel)',
        autoQty: `Saldo ${formatCLP(live.reserveFund)}`,
        autoNote: `Fondo de Reserva rendido por ${formatCLP(live.reserveFund)}, con recargo reglamentario del ${live.reservePercent}%.`
      },
      {
        id: 'an_c2',
        code: 'C.2',
        printLabel: 'Informe detallado de morosidad por unidad, tramos de antigüedad, convenios de pago suscritos y saldos a favor.',
        title: 'Ranking y antigüedad de morosidad, convenios de repactación (Art. 35°) y saldos a favor',
        includes: 'Detalle de deuda por unidad (1, 2, 3 o más períodos impagos), cumplimiento de cuotas de convenios vigentes y registro contable de abonos a favor de residentes.',
        legalRef: 'Arts. 32° y 35° Ley 21.442',
        critical: true,
        moduleTab: 'unidades',
        moduleLabel: 'Morosidad & Convenios',
        systemSummary: `${live.delinquentUnitsCount} unidad(es) con deuda (${formatCLP(live.totalPendingDebt)}) • ${live.repactacionCount} convenio(s)`,
        autoFormat: 'Digital (PDF / Excel)',
        autoQty: `${live.delinquentUnitsCount} casos mora`,
        autoNote: `Cartera por cobrar de ${formatCLP(live.totalPendingDebt)} en ${live.delinquentUnitsCount} unidad(es) y ${live.repactacionCount} convenio(s) activos.`
      },
      {
        id: 'an_c3',
        code: 'C.3',
        printLabel: 'Respaldo de gestiones de cobranza preventiva, requerimientos de corte de suministro y acciones judiciales.',
        title: 'Informe de gestiones de cobranza extrajudicial, cortes de suministro y cobranza judicial',
        includes: 'Cartas de aviso despachadas, constancias de suspensión de suministro eléctrico/telecomunicaciones en unidades con 3+ cuotas morosas (Art. 36°) y estado de demandas ejecutivas.',
        legalRef: 'Arts. 36° y 37° Ley 21.442',
        critical: false,
        moduleTab: 'unidades',
        moduleLabel: 'Bitácora Cobranza',
        systemSummary: 'Trazabilidad de avisos y medidas de apremio legítimas aplicadas en el año',
        autoFormat: 'Digital (PDF / Excel)',
        autoQty: 'Informe cobranza',
        autoNote: 'Gestiones de cobranza preventiva y convenios ejecutados conforme a los Arts. 35° al 37°.'
      },
      {
        id: 'an_c4',
        code: 'C.4',
        printLabel: 'Estado de fondos especiales aprobados (provisión de indemnizaciones laborales, obras o proyectos concursables).',
        title: 'Rendición de fondos especiales, cuotas extraordinarias de obras o subsidios adjudicados',
        includes: 'Avance financiero y físico de fondos creados para fines específicos (pintura de fachada, recambio de bombas, provisión de años de servicio o postulaciones MINVU).',
        legalRef: 'Art. 39° Ley 21.442',
        critical: false,
        moduleTab: 'emision',
        moduleLabel: 'Fondos & Cobros',
        systemSummary: 'Control separado respecto del gasto común ordinario',
        autoFormat: 'Digital (PDF / Excel)',
        autoQty: 'Según proyectos',
        autoNote: 'Rendición separada de cobros extraordinarios o provisiones específicas cuando aplican.'
      }
    ]
  },
  {
    code: 'D',
    page: 2,
    icon: Users,
    title: 'D. Cumplimiento laboral, previsional y contratos de proveedores',
    subtitle: 'Verificación anual de cero deuda laboral (Previred / DT), normativa laboral y desempeño de contratistas',
    items: [
      {
        id: 'an_d1',
        code: 'D.1',
        printLabel: 'Certificado F30-1 vigente y comprobantes de pago íntegro de cotizaciones previsionales (Previred) de los 12 meses.',
        title: 'Certificado F30-1 sin deuda y 12 planillas mensuales de Previred íntegramente pagadas',
        includes: 'Acreditación oficial ante la Asamblea de que el condominio no registra deudas de AFP, salud, cesantía, mutualidad ni multas laborales en todo el año rendido.',
        legalRef: 'Ley N° 19.631 & Art. 20°',
        critical: true,
        moduleTab: 'remuneraciones',
        moduleLabel: 'Previred & F30-1',
        systemSummary: live.staffCount > 0 ? `${live.staffCount} trabajador(es) activo(s) • ${live.payrollHistoryCount} nómina(s)` : 'Sin personal directo contratado',
        autoFormat: live.staffCount > 0 ? 'Digital (PDF / Excel)' : '',
        autoQty: live.staffCount > 0 ? '12 meses + F30-1' : 'N/A',
        autoNote: live.staffCount > 0 ? `100% de imposiciones pagadas para dotación de ${live.staffCount} trabajador(es).` : 'La comunidad no mantiene personal contratado directamente.'
      },
      {
        id: 'an_d2',
        code: 'D.2',
        printLabel: 'Informe de dotación laboral, vacaciones otorgadas, cumplimiento Ley 40 Horas y protocolo Ley Karin vigente.',
        title: 'Estado anual de dotación, feriados legales, adecuación 40 Horas y prevención Ley Karin',
        includes: 'Resumen de dotación, control de días de feriado acumulados para evitar sobre-provisión, turnos ajustados a Ley 21.561 y difusión obligatoria del protocolo Ley N° 21.643.',
        legalRef: 'Leyes 21.561 y 21.643',
        critical: false,
        moduleTab: 'remuneraciones',
        moduleLabel: 'Gestión RR.HH.',
        systemSummary: live.staffCount > 0 ? `Personal activo: ${live.staffNames}` : 'Sin dotación directa',
        autoFormat: live.staffCount > 0 ? 'Digital (PDF / Excel)' : '',
        autoQty: live.staffCount > 0 ? `${live.staffCount} fichas RR.HH.` : 'N/A',
        autoNote: live.staffCount > 0 ? 'Contratos, feriados legales y protocolos normativos al día.' : 'No aplica dotación laboral directa.'
      },
      {
        id: 'an_d3',
        code: 'D.3',
        printLabel: 'Evaluación anual de contratos vigentes con proveedores, reajustes aplicados y cotizaciones comparativas.',
        title: 'Revisión anual de contratos de proveedores críticos, tarifas UF/IPC y licitaciones del período',
        includes: 'Cuadro resumen de contratos vigentes (ascensores, bombas, seguridad, jardines), cumplimiento de visitas pactadas y ahorros o renegociaciones gestionadas en el año.',
        legalRef: 'Art. 20° N° 1 Ley 21.442',
        critical: false,
        moduleTab: 'gastos',
        moduleLabel: 'Proveedores',
        systemSummary: `${live.providersCount} proveedor(es) activo(s) en registro de la comunidad`,
        autoFormat: 'Digital (PDF / Excel)',
        autoQty: `${live.providersCount} contratos/fichas`,
        autoNote: `Evaluación operativa y tarifaria de ${live.providersCount} proveedores habituales.`
      },
      {
        id: 'an_d4',
        code: 'D.4',
        printLabel: 'Cumplimiento de obligaciones tributarias aplicables (retenciones de honorarios F29 y declaraciones juradas SII).',
        title: 'Situación tributaria anual ante el SII (boletas de honorarios de terceros, F29 y DJ)',
        includes: 'Constancia de retenciones enteradas por boletas de honorarios de prestadores externos (abogados, auditores, técnicos) y declaraciones juradas anuales cuando correspondan.',
        legalRef: 'Normativa Tributaria SII',
        critical: false,
        moduleTab: 'gastos',
        moduleLabel: 'Respaldos Tributarios',
        systemSummary: 'Verificación de boletas de honorarios y facturas electrónicas del período',
        autoFormat: 'Digital (PDF / Excel)',
        autoQty: 'Carpeta anual SII',
        autoNote: 'Respaldos tributarios del ejercicio ordenados y sin observaciones pendientes.'
      }
    ]
  },
  {
    code: 'E',
    page: 2,
    icon: Wrench,
    title: 'E. Mantenciones preventivas, certificaciones y seguros obligatorios',
    subtitle: 'Gestión técnica de infraestructura común, sellos normativos y protección patrimonial del edificio/condominio',
    items: [
      {
        id: 'an_e1',
        code: 'E.1',
        printLabel: 'Informe anual de mantenciones preventivas y correctivas ejecutadas sobre bienes e instalaciones comunes.',
        title: 'Memoria anual de mantenciones preventivas y reparaciones mayores ejecutadas',
        includes: 'Bitácora consolidada de intervenciones en salas de bombas, estanques de agua, techumbres, canaletas, portones automáticos, iluminación LED, CCTV y áreas comunes.',
        legalRef: 'Art. 20° N° 1 y 3 Ley 21.442',
        critical: true,
        moduleTab: 'gastos',
        moduleLabel: 'Plan Preventivo',
        systemSummary: `${live.maintenancesCount} mantención(es) registrada(s) en plan anual`,
        autoFormat: 'Digital (PDF / Excel)',
        autoQty: `${live.maintenancesCount} registros`,
        autoNote: `Ejecución documentada del programa preventivo (${live.maintenancesCount} ítems controlados).`
      },
      {
        id: 'an_e2',
        code: 'E.2',
        printLabel: 'Estado de vigencia de certificaciones legales: ascensores MINVU, Sello Verde SEC, estanques sanitarios y red de incendio.',
        title: 'Vigencia de certificaciones obligatorias (Ascensores MINVU, Gas SEC, SEREMI Salud y Red Húmeda)',
        includes: 'Fechas de última certificación y próximo vencimiento de transporte vertical, Sello Verde de gas, limpieza semestral/anual de estanques y recarga anual de extintores.',
        legalRef: 'Ley 20.296 / DS 66 SEC',
        critical: true,
        moduleTab: 'gastos',
        moduleLabel: 'Certificaciones',
        systemSummary: live.overdueMaintCount > 0 ? `Atención: ${live.overdueMaintCount} mantención/certificación próxima o vencida` : 'Controles técnicos sin alertas vencidas',
        autoFormat: 'Mixto (Físico + Digital)',
        autoQty: 'Certificados al día',
        autoNote: 'Certificaciones reglamentarias verificadas según calendario normativo aplicable.'
      },
      {
        id: 'an_e3',
        code: 'E.3',
        printLabel: 'Vigencia, coberturas y renovación del seguro colectivo contra incendio y pólizas complementarias.',
        title: 'Póliza vigente de Seguro Colectivo contra Incendio (Art. 43°) y reporte anual de siniestros',
        includes: 'Acreditación de cobertura vigente de bienes comunes y unidades, capital asegurado en UF, prima anual y resultado de liquidaciones de siniestros ocurridos en el período.',
        legalRef: 'Art. 43° Ley 21.442',
        critical: true,
        moduleTab: 'ajustes',
        moduleLabel: 'Ficha & Seguros',
        systemSummary: 'Exigencia obligatoria en toda Asamblea Ordinaria anual',
        autoFormat: 'Digital (PDF / Excel)',
        autoQty: 'Póliza vigente',
        autoNote: 'Información de cobertura vigente del seguro colectivo contra incendio del condominio.'
      },
      {
        id: 'an_e4',
        code: 'E.4',
        printLabel: 'Actualización anual del Plan de Emergencia y Evacuación, entrega a Bomberos/Carabineros y registro de simulacros.',
        title: 'Actualización anual del Plan de Emergencia y Evacuación ante Bomberos y Carabineros',
        includes: 'Constancia de revisión anual obligatoria del Plan de Emergencia y Evacuación, señalética de seguridad y actualización de nómina de residentes prioritarios.',
        legalRef: 'Art. 40° Ley 21.442',
        critical: true,
        moduleTab: 'comunicados',
        moduleLabel: 'Seguridad & Plan',
        systemSummary: 'Revisión anual obligatoria exigida por el Art. 40° de la Ley 21.442',
        autoFormat: 'Mixto (Físico + Digital)',
        autoQty: 'Versión anual',
        autoNote: 'Plan de Emergencia revisado para el período anual conforme al Art. 40°.'
      }
    ]
  },
  {
    code: 'F',
    page: 3,
    icon: FileCheck2,
    title: 'F. Presupuesto proyectado, votación y acta de aprobación',
    subtitle: 'Planificación financiera del próximo año, ratificación de órganos y cierre formal en Libro de Actas',
    items: [
      {
        id: 'an_f1',
        code: 'F.1',
        printLabel: 'Propuesta de presupuesto anual de ingresos, gastos operacionales e inversiones para el nuevo período.',
        title: 'Presupuesto proyectado del nuevo ejercicio anual y plan maestro de mejoras / inversiones',
        includes: 'Proyección mensualizada de gastos fijos, reajustes estimados (IPC/UF/sueldo mínimo), obras propuestas con cargo a Fondo de Reserva e impacto estimado en la cuota común.',
        legalRef: 'Art. 20° N° 4 Ley 21.442',
        critical: true,
        moduleTab: 'resumen',
        moduleLabel: 'Proyección Mes',
        systemSummary: `Base mensual actual: ${formatCLP(live.grandTotal)} (incluye ${live.reservePercent}% reserva)`,
        autoFormat: 'Digital (PDF / Excel)',
        autoQty: 'Presupuesto 12 meses',
        autoNote: `Presupuesto proyectado sobre base operativa actual de ${formatCLP(live.grandTotal)} mensuales.`
      },
      {
        id: 'an_f2',
        code: 'F.2',
        printLabel: 'Elección o ratificación del Comité de Administración y acreditación de inscripción vigente en el RNAC MINVU.',
        title: 'Renovación/ratificación del Comité de Administración y certificado vigente RNAC MINVU',
        includes: 'Designación de miembros del Comité (mínimo 3 integrantes salvo excepción legal) y exhibición del certificado vigente del Administrador en el Registro Nacional de Administradores.',
        legalRef: 'Arts. 17° y 82° Ley 21.442',
        critical: true,
        moduleTab: 'comite',
        moduleLabel: 'Comité Vigente',
        systemSummary: live.committeeMembersCount > 0 ? `${live.committeeMembersCount} integrante(s) del Comité registrado(s)` : 'Verificar registro de integrantes del Comité',
        autoFormat: 'Digital (PDF / Excel)',
        autoQty: 'Vigencia RNAC + Comité',
        autoNote: 'Acreditación de vigencia RNAC MINVU y nómina del Comité de Administración.'
      },
      {
        id: 'an_f3',
        code: 'F.3',
        printLabel: 'Votación formal de la rendición anual en Asamblea Ordinaria, dejando constancia de aprobación u observaciones.',
        title: 'Sometimiento a votación de la cuenta anual y registro expreso del acuerdo adoptado',
        includes: 'Cómputo de votos por porcentaje de derechos (mayoría absoluta de asistentes), registro íntegro de aprobaciones o eventuales reparos fundados con plazo de aclaración.',
        legalRef: 'Arts. 15° y 21° Ley 21.442',
        critical: true,
        moduleTab: 'asambleas',
        moduleLabel: 'Votación Asamblea',
        systemSummary: 'Quórum de acuerdo ordinario: mayoría absoluta de derechos asistentes',
        autoFormat: 'Mixto (Físico + Digital)',
        autoQty: 'Registro votación',
        autoNote: 'Cuenta anual sometida a pronunciamiento formal de la Asamblea Ordinaria.'
      },
      {
        id: 'an_f4',
        code: 'F.4',
        printLabel: 'Escrituración y firma del Acta de Asamblea Ordinaria en el Libro de Actas dentro del plazo legal y difusión a la comunidad.',
        title: 'Suscripción del Acta de Asamblea Ordinaria (plazo máx. 30 días), archivo foliado y publicación',
        includes: 'Redacción y firma del acta por el Comité/designados dentro de los 30 días siguientes a la sesión, incorporación al Libro de Actas y publicación en el portal vecinal ARANPRO.',
        legalRef: 'Art. 15° Ley 21.442',
        critical: true,
        moduleTab: 'asambleas',
        moduleLabel: 'Libro de Actas',
        systemSummary: 'Cierra legalmente el ciclo anual liberando de responsabilidad sobre lo aprobado',
        autoFormat: 'Mixto (Físico + Digital)',
        autoQty: 'Acta foliada + Portal',
        autoNote: 'Acta suscrita para incorporación al Libro de Actas y publicación a copropietarios.'
      }
    ]
  }
];

const composeFormatAndNotes = (entry) => {
  if (!entry) return '';
  const parts = [];
  if (entry.format) parts.push(entry.format);
  if (entry.quantity && entry.quantity.trim()) parts.push(entry.quantity.trim());
  if (entry.notes && entry.notes.trim()) parts.push(entry.notes.trim());
  if (entry.status === 'pendiente') {
    const pend = [
      entry.dueDate ? `Plazo: ${entry.dueDate}` : '',
      entry.responsible ? `Resp.: ${entry.responsible}` : ''
    ].filter(Boolean).join(' · ');
    if (pend) parts.push(`[${pend}]`);
  }
  return parts.join(' · ');
};

/**
 * Componente Canónico Imprimible de 3 Páginas Carta (Idéntico en línea gráfica a PAUTA DE TRASPASO ARANPRO)
 */
export function CommunityHandoverPautaPrint({
  phase = 'traspaso',
  sections = [],
  entries = {},
  meta = {},
  live = {},
  company = {},
  pdfStyle = 'alt4',
  printableId = 'printable-community-handover-pauta'
}) {
  const isAnnual = phase === 'anual';
  const pageGroups = [1, 2, 3].map((p) => sections.filter((s) => s.page === p));

  const condoLabel = [meta.communityName || live.communityName || 'Comunidad', meta.communityRut || live.communityRut ? `RUT ${meta.communityRut || live.communityRut}` : '']
    .filter(Boolean)
    .join(' · ');

  const modalityStr = [
    `Física ${meta.modality === 'fisica' ? '☒' : '☐'}`,
    `Digital ${meta.modality === 'digital' ? '☒' : '☐'}`,
    `Mixta ${meta.modality === 'mixta' ? '☒' : '☐'}`
  ].join('   ');

  const outgoingStr = [meta.outgoingAdminName, meta.outgoingAdminRut ? `RUT ${meta.outgoingAdminRut}` : ''].filter(Boolean).join(' · ');
  const committeeStr = [meta.committeeRepName, meta.committeeRepRole, meta.committeeRepUnit ? `Unid. ${meta.committeeRepUnit}` : ''].filter(Boolean).join(' · ');
  const incomingOrDeadlineStr = isAnnual
    ? (meta.assemblyDate || '________________________')
    : ([meta.incomingAdminName ? `Entrante: ${meta.incomingAdminName}` : '', meta.complementaryDeadline ? `Plazo: ${meta.complementaryDeadline}` : ''].filter(Boolean).join(' · ') || '________________________');

  const metadataCells = isAnnual
    ? [
        ['COMUNIDAD', condoLabel],
        ['EJERCICIO / PERÍODO RENDIDO', meta.annualPeriodLabel || '________________________'],
        ['MODALIDAD DE RESPALDOS', modalityStr],
        ['ADMINISTRADOR(A) TITULAR', outgoingStr || '________________________'],
        ['COMITÉ REVISOR', committeeStr || '________________________'],
        ['FECHA ASAMBLEA ORDINARIA', incomingOrDeadlineStr]
      ]
    : [
        ['COMUNIDAD', condoLabel],
        ['FECHA DE ENTREGA / CORTE', meta.handoverDate || '________________________'],
        ['MODALIDAD DE ENTREGA', modalityStr],
        ['ADMINISTRADOR(A) SALIENTE', outgoingStr || '________________________'],
        ['REPRESENTANTE DEL COMITÉ', committeeStr || '________________________'],
        ['RECEPTOR / PLAZO REVISIÓN', incomingOrDeadlineStr]
      ];

  const signers = isAnnual
    ? [
        ['Por el Comité de Administración', meta.committeeRepName ? `${meta.committeeRepName}${meta.committeeRepRut ? ` · RUT ${meta.committeeRepRut}` : ''}` : 'Nombre, cargo y RUT'],
        ['Comisión Revisora / Tesorería', meta.witnessName || 'Nombre, unidad y firma'],
        ['Administrador(a) Titular que rinde cuenta', outgoingStr || 'Nombre y RUT'],
        ['Ministro de Fe / Secretario(a) de Asamblea', 'Nombre, cargo y firma']
      ]
    : [
        ['Por el Comité de Administración', meta.committeeRepName ? `${meta.committeeRepName}${meta.committeeRepRut ? ` · RUT ${meta.committeeRepRut}` : ''}` : 'Nombre y cargo'],
        ['Administrador(a) saliente (Entrega)', outgoingStr || 'Nombre y RUT'],
        ['Administrador(a) entrante (Recibe)', [meta.incomingAdminName, meta.incomingAdminRut ? `RUT ${meta.incomingAdminRut}` : ''].filter(Boolean).join(' · ') || 'Nombre y RUT'],
        ['Testigo o receptor(a) de respaldo', meta.witnessName || 'Nombre y cargo']
      ];

  return (
    <div id={printableId} data-pdf-style={pdfStyle} className="space-y-6">
      {pageGroups.map((pageSections, pageIdx) => {
        const pageNum = pageIdx + 1;
        return (
          <div
            key={pageNum}
            data-pdf-style={pdfStyle}
            className={`dossier-page ${pageIdx < 2 ? 'transition-page-with-notes' : ''} bg-white p-6 pl-10 flex flex-col justify-between text-slate-900 relative overflow-hidden shadow-md mx-auto w-full max-w-[850px]`}
            style={{ fontFamily: 'Arial, sans-serif', minHeight: '1050px', fontSize: '10px' }}
          >
            <div>
              <CanonicalPdfHeader
                badge={isAnnual ? 'PAUTA RENDICIÓN ANUAL' : 'PAUTA DE TRASPASO'}
                description={isAnnual ? 'Checklist Art. 21 Ley N° 21.442' : 'Checklist de entrega de administración'}
                community={meta.communityName || live.communityName}
                page={pageNum}
                email={company.email}
                phone={company.phone}
                city={meta.city || live.city}
              />

              <div className="transition-title text-center mt-2.5 mb-2.5">
                <h2 className="text-sm font-black uppercase">
                  {isAnnual ? 'PAUTA DE CONTROL DE RENDICIÓN DE CUENTAS ANUAL' : 'PAUTA DE ENTREGA Y TRASPASO DE ADMINISTRACIÓN'}
                </h2>
                <p className="text-[#0F3D2E] font-bold">
                  {isAnnual
                    ? pageNum === 1
                      ? 'Convocatoria legal, balance anual e integridad financiera (Art. 21 Ley N° 21.442)'
                      : pageNum === 2
                      ? 'Fondo de reserva, cobranza, obligaciones laborales y mantenciones críticas'
                      : 'Presupuesto proyectado, acuerdos de Asamblea Ordinaria y cierre anual'
                    : pageNum === 1
                    ? 'Pauta oficial para entrega documentada, control y recepción de antecedentes'
                    : pageNum === 2
                    ? 'Antecedentes laborales, proveedores, operación, seguros y certificaciones técnicas'
                    : 'Sistemas digitales, asuntos pendientes y constancia formal de cierre'}
                </p>
              </div>

              {pageNum === 1 && (
                <>
                  <div className="transition-metadata grid grid-cols-3 border border-slate-300 text-[9px] mb-2.5">
                    {metadataCells.map(([label, val]) => (
                      <div key={label} className="border border-slate-200 p-1">
                        <strong className="block text-slate-800">{label}</strong>
                        <span className="text-slate-900">{val}</span>
                      </div>
                    ))}
                  </div>

                  <p className="bg-emerald-50 border border-emerald-200 p-2 mb-2 text-[9px] leading-snug text-slate-800">
                    <strong>{isAnnual ? 'Resguardo Legal Art. 21 Ley N° 21.442.' : 'Alcance Legal del Traspaso.'}</strong>{' '}
                    {isAnnual
                      ? 'Esta pauta acredita el orden, respaldo e integridad de los antecedentes presentados por la Administración ante el Comité y la Asamblea Ordinaria anual. Los respaldos tributarios y bancarios quedan a disposición de los copropietarios.'
                      : 'Esta pauta ordena y acredita la entrega y recepción material/digital de antecedentes conforme a los Arts. 20° y 21° de la Ley N° 21.442 y su reglamento. La recepción material queda sujeta a verificación de integridad y consistencia dentro del plazo de revisión acordado.'}
                  </p>

                  <p className="mb-1.5 text-[8.8px] text-slate-600">
                     Estado registrado por antecedente: <strong>Entregado / Verificado</strong>, <strong>Pendiente con plazo</strong> o <strong>No aplica</strong>. Si las casillas permanecen vacías, puede completarse manualmente en el acto de entrega.
                  </p>
                </>
              )}

              {pageSections.map((section) => (
                <div key={section.code} className="border border-slate-300 mb-2.5">
                  <div className="bg-[#0F3D2E] text-white font-bold px-2 py-1 uppercase text-[9.5px] flex justify-between items-center">
                    <span>{section.title}</span>
                    <span className="text-[8px] font-normal text-[#D4B895]">{section.items.length} antecedentes</span>
                  </div>
                  <table className="w-full border-collapse" style={{ tableLayout: 'fixed', fontSize: '9px' }}>
                    <colgroup>
                      <col style={{ width: '50%' }} />
                      <col style={{ width: '9%' }} />
                      <col style={{ width: '9%' }} />
                      <col style={{ width: '8%' }} />
                      <col style={{ width: '24%' }} />
                    </colgroup>
                    <thead>
                      <tr className="bg-slate-100 text-slate-800">
                        <th className="border border-slate-300 p-1 text-left">Antecedente</th>
                        <th className="border border-slate-300 p-1 text-center">{isAnnual ? 'Listo' : 'Entreg.'}</th>
                        <th className="border border-slate-300 p-1 text-center">Pend.</th>
                        <th className="border border-slate-300 p-1 text-center">N/A</th>
                        <th className="border border-slate-300 p-1 text-left">Formato / observaciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.items.map((item) => {
                        const entry = entries[item.id] || {};
                        const combinedObs = composeFormatAndNotes(entry);
                        return (
                          <tr key={item.id}>
                            <td className="border border-slate-300 px-1.5 py-1">
                              <strong className="text-[#0F3D2E] mr-1">{item.code}</strong>
                              {item.printLabel}
                            </td>
                            <td className="border border-slate-300 text-center text-[10.5px]">
                              {entry.status === 'entregado' ? '☒' : '☐'}
                            </td>
                            <td className="border border-slate-300 text-center text-[10.5px]">
                              {entry.status === 'pendiente' ? '☒' : '☐'}
                            </td>
                            <td className="border border-slate-300 text-center text-[10.5px]">
                              {entry.status === 'na' ? '☒' : '☐'}
                            </td>
                            <td className="border border-slate-300 px-1.5 py-1 text-[8.3px]" style={{ overflowWrap: 'anywhere' }}>
                              {combinedObs || '________________________'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))}

              {pageNum === 3 && (
                <>
                  {/* Resumen numérico de corte extraído del sistema */}
                  <div className="border border-slate-300 bg-slate-50 p-2 mb-2 text-[8.6px]">
                    <strong className="block text-[#0F3D2E] uppercase mb-1">
                      Referencia Contable Registrada en Sistema al Corte ({live.periodLabel}):
                    </strong>
                    <div className="grid grid-cols-4 gap-2">
                      <div><span className="text-slate-500">Saldo Banco Ref.:</span> <strong>{formatCLP(live.bankBalance)}</strong></div>
                      <div><span className="text-slate-500">Fondo Reserva:</span> <strong>{formatCLP(live.reserveFund)}</strong></div>
                      <div><span className="text-slate-500">Mora por Cobrar:</span> <strong>{formatCLP(live.totalPendingDebt)}</strong></div>
                      <div><span className="text-slate-500">Unidades / Personal:</span> <strong>{live.totalUnits} u. / {live.staffCount} trab.</strong></div>
                    </div>
                  </div>

                  <p className="mt-1.5 text-[9px] leading-snug text-slate-800">
                    <strong>Constancia de cierre.</strong>{' '}
                    {meta.closingRemarks && meta.closingRemarks.trim()
                      ? meta.closingRemarks.trim()
                      : isAnnual
                      ? 'Se deja constancia de la presentación íntegra de los antecedentes contenidos en esta pauta para pronunciamiento de la Asamblea Ordinaria conforme al artículo 21 de la Ley N° 21.442.'
                      : 'Las partes dejan constancia de la fecha, modalidad de entrega y antecedentes recibidos o pendientes indicados en esta pauta. Los accesos bancarios y públicos se transfieren por mecanismos seguros y las credenciales del administrador saliente se revocan verificada la continuidad operativa.'}
                  </p>

                  <div className="grid grid-cols-2 gap-x-10 gap-y-10 mt-9 text-[9.5px]">
                    {signers.map(([roleTitle, subLine]) => (
                      <div className="border-t border-slate-500 pt-1" key={roleTitle}>
                        <strong className="block text-slate-900">{roleTitle}</strong>
                        <span className="text-slate-600 text-[8.5px]">{subLine}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div>
              {pageNum < 3 ? (
                <div className="border-y border-slate-300 py-1.5 mb-1 flex justify-between items-center text-slate-600 text-[9px]">
                  <span>
                    {pageNum === 1
                      ? isAnnual
                        ? 'Continúa: fondo de reserva, morosidad, personal, proveedores y mantenciones.'
                        : 'Continúa: personal, proveedores, operación, seguros y antecedentes técnicos.'
                      : isAnnual
                      ? 'Continúa: presupuesto proyectado, votación en asamblea y firmas de cierre.'
                      : 'Continúa: sistemas digitales, pendientes y cierre formal del traspaso.'}
                  </span>
                  <span className="border border-emerald-200 rounded-full bg-emerald-50 px-3.5 py-0.5 text-[#0F3D2E] font-bold">
                    Continúa en página {pageNum + 1} →
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
                label={isAnnual ? 'Pauta Rendición Anual' : 'Pauta de Traspaso'}
                page={pageNum}
                totalPages={3}
                city={meta.city || live.city}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Pantalla interactiva de Auditoría y Checklist (Fase A y Fase B)
 */
export function CommunityHandoverChecklistScreen({
  phase = 'traspaso',
  sections = [],
  entries = {},
  onUpdateEntry,
  onMarkSectionDone,
  onAutoFillFromSystem,
  onResetAllEntries,
  meta = {},
  onUpdateMeta,
  live = {},
  onNavigateToTab,
  onOpenPreviewPauta,
  onPrintPauta,
  onGoToDocumentsStep
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'critical' | 'unregistered' | 'pendiente' | 'entregado' | 'na'
  const [collapsedSections, setCollapsedSections] = useState({});
  const [showMetaEditor, setShowMetaEditor] = useState(true);

  const isAnnual = phase === 'anual';

  // Métricas globales del checklist activo
  const metrics = useMemo(() => {
    const allItems = sections.flatMap((s) => s.items);
    const total = allItems.length || 1;
    let entregado = 0;
    let pendiente = 0;
    let na = 0;
    let unregistered = 0;
    const criticalOpen = [];
    const pendingCommitments = [];

    allItems.forEach((item) => {
      const e = entries[item.id] || {};
      const st = e.status || '';
      if (st === 'entregado') entregado += 1;
      else if (st === 'pendiente') {
        pendiente += 1;
        pendingCommitments.push({ item, entry: e });
      } else if (st === 'na') na += 1;
      else unregistered += 1;

      if (item.critical && st !== 'entregado' && st !== 'na') {
        criticalOpen.push({ item, status: st });
      }
    });

    const resolved = entregado + na;
    const score = Math.round((resolved / total) * 100);

    let level = { label: 'PREPARACIÓN EN CURSO', tone: 'rose' };
    if (score === 100 && criticalOpen.length === 0) {
      level = { label: isAnnual ? 'CUENTA ANUAL 100% VERIFICADA' : 'PAUTA LISTA PARA FIRMA DE ACTA', tone: 'emerald' };
    } else if (score >= 70) {
      level = { label: 'AVANCE ALTO • REVISAR PENDIENTES', tone: 'amber' };
    }

    return {
      total: allItems.length,
      entregado,
      pendiente,
      na,
      unregistered,
      resolved,
      score,
      criticalOpen,
      pendingCommitments,
      level
    };
  }, [sections, entries, isAnnual]);

  const filteredSections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return sections
      .map((sec) => {
        const items = sec.items.filter((item) => {
          const st = entries[item.id]?.status || '';
          if (statusFilter === 'critical' && !item.critical) return false;
          if (statusFilter === 'unregistered' && st !== '') return false;
          if (statusFilter === 'pendiente' && st !== 'pendiente') return false;
          if (statusFilter === 'entregado' && st !== 'entregado') return false;
          if (statusFilter === 'na' && st !== 'na') return false;

          if (!q) return true;
          return (
            item.code.toLowerCase().includes(q) ||
            item.title.toLowerCase().includes(q) ||
            item.includes.toLowerCase().includes(q) ||
            item.legalRef.toLowerCase().includes(q) ||
            (entries[item.id]?.notes || '').toLowerCase().includes(q)
          );
        });
        return { ...sec, items };
      })
      .filter((sec) => sec.items.length > 0);
  }, [sections, entries, searchQuery, statusFilter]);

  const toggleAllBlocks = () => {
    const anyOpen = sections.some((s) => !collapsedSections[s.code]);
    const next = {};
    sections.forEach((s) => {
      next[s.code] = anyOpen;
    });
    setCollapsedSections(next);
  };

  const R = 40;
  const C = 2 * Math.PI * R;
  const ringColor =
    metrics.level.tone === 'emerald'
      ? 'stroke-emerald-500'
      : metrics.level.tone === 'amber'
      ? 'stroke-amber-500'
      : 'stroke-rose-500';
  const badgeColor =
    metrics.level.tone === 'emerald'
      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
      : metrics.level.tone === 'amber'
      ? 'bg-amber-50 text-amber-800 border-amber-200'
      : 'bg-rose-50 text-rose-800 border-rose-200';

  return (
    <div className="space-y-5">
      {/* 1. SEMÁFORO EJECUTIVO + RADIOGRAFÍA VIVA DE LA COMUNIDAD */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 md:p-6 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 flex-1">
            {/* Anillo SVG de avance */}
            <div className="relative w-24 h-24 shrink-0 self-center">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r={R} fill="none" strokeWidth="9" className="stroke-slate-100" />
                <circle
                  cx="50"
                  cy="50"
                  r={R}
                  fill="none"
                  strokeWidth="9"
                  strokeLinecap="round"
                  className={ringColor}
                  strokeDasharray={C}
                  strokeDashoffset={C * (1 - metrics.score / 100)}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black text-slate-900 leading-none">{metrics.score}%</span>
                <span className="text-[9px] font-bold uppercase text-slate-400 mt-0.5">
                  {metrics.resolved}/{metrics.total}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${badgeColor}`}>
                  {metrics.level.label}
                </span>
                <span className="text-[10.5px] font-bold text-slate-500">
                  {isAnnual
                    ? '6 Bloques Oficiales (A–F) • 24 Antecedentes Art. 21 Ley N° 21.442'
                    : '7 Bloques Oficiales (A–G) • 28 Antecedentes Pauta ARANPRO Ley N° 21.442'}
                </span>
              </div>
              <h3 className="text-base md:text-lg font-black text-slate-900 leading-snug">
                {isAnnual
                  ? `Checklist Maestro de Rendición de Cuentas Anual • ${live.communityName}`
                  : `Pauta Oficial de Entrega y Traspaso de Administración • ${live.communityName}`}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Cada fila cruza la exigencia legal con los <strong>datos reales registrados en ARANPRO</strong>, permite acceder directo al módulo fuente y alimenta la <strong>Pauta Oficial Imprimible de 3 Páginas Carta</strong> (con firma, timbre y doble filete institucional).
              </p>
            </div>
          </div>

          {/* Contadores rápidos */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
            <div className="px-3 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
              <span className="text-lg font-black text-emerald-800 block leading-none">{metrics.entregado}</span>
              <span className="text-[10px] font-bold text-emerald-700 mt-1 block">{isAnnual ? 'Verificados' : 'Entregados'}</span>
            </div>
            <div className="px-3 py-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-center">
              <span className="text-lg font-black text-amber-800 block leading-none">{metrics.pendiente}</span>
              <span className="text-[10px] font-bold text-amber-700 mt-1 block">Pend. c/Plazo</span>
            </div>
            <div className="px-3 py-2.5 rounded-2xl bg-slate-100 border border-slate-200 text-center">
              <span className="text-lg font-black text-slate-700 block leading-none">{metrics.na}</span>
              <span className="text-[10px] font-bold text-slate-600 mt-1 block">No Aplica</span>
            </div>
            <div className="px-3 py-2.5 rounded-2xl bg-rose-50 border border-rose-200 text-center">
              <span className="text-lg font-black text-rose-800 block leading-none">{metrics.unregistered}</span>
              <span className="text-[10px] font-bold text-rose-700 mt-1 block">Sin Marcar</span>
            </div>
          </div>
        </div>

        {/* Radiografía viva en 4 tarjetas de datos del sistema */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          <div className="p-3 rounded-2xl bg-[#F5F4EF]/80 border border-[#D4B895]/40 space-y-1">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-[#0F3D2E]">
              <span>1. Banco & Fondos</span>
              <Landmark className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs font-black text-slate-900">
              Banco Ref.: {formatCLP(live.bankBalance)}
            </div>
            <div className="text-[11px] text-slate-600">
              Reserva: <strong>{formatCLP(live.reserveFund)}</strong> ({live.reservePercent}%) • Respaldos mes: {live.backedExpensesCount}/{live.expensesCount}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-700">
              <span>2. Padrón & Morosidad</span>
              <Building2 className="w-3.5 h-3.5 text-[#0F3D2E]" />
            </div>
            <div className="text-xs font-black text-slate-900">
              {live.totalUnits} Unidades ({live.paidUnitsCount} al día)
            </div>
            <div className="text-[11px] text-slate-600">
              Mora: <strong className="text-rose-700">{formatCLP(live.totalPendingDebt)}</strong> ({live.delinquentUnitsCount} u.) • {live.repactacionCount} convenios
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-700">
              <span>3. RR.HH. & Proveedores</span>
              <Users className="w-3.5 h-3.5 text-[#0F3D2E]" />
            </div>
            <div className="text-xs font-black text-slate-900">
              {live.staffCount} Trabajador(es) • {live.providersCount} Proveedores
            </div>
            <div className="text-[11px] text-slate-600">
              {live.payrollHistoryCount} cierres nómina • {live.maintenancesCount} mantenciones en plan
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-700">
              <span>4. Actas & Pendientes</span>
              <Scale className="w-3.5 h-3.5 text-[#0F3D2E]" />
            </div>
            <div className="text-xs font-black text-slate-900">
              {live.assemblyMinutesCount} Actas Asamblea • {live.committeeMeetingsCount} Sesiones
            </div>
            <div className="text-[11px] text-slate-600">
              {live.openTicketsCount} reclamos abiertos • {live.pendingCommitteeTasksCount} tareas Comité pend.
            </div>
          </div>
        </div>
      </div>

      {/* 2. FICHA DE ENCABEZADO Y PARTICIPANTES DE LA PAUTA (SINCRONIZADA EN TIEMPO REAL CON EL PDF) */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
        <button
          type="button"
          onClick={() => setShowMetaEditor(!showMetaEditor)}
          className="w-full px-5 py-3.5 bg-slate-50 hover:bg-slate-100/80 border-b border-slate-200 flex items-center justify-between gap-3 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-2.5 text-left">
            <span className="w-6 h-6 rounded-lg bg-[#0F3D2E] text-[#D4B895] text-xs font-black flex items-center justify-center shrink-0">
              ID
            </span>
            <div>
              <span className="text-xs font-black text-slate-900 uppercase tracking-wide block">
                Encabezado Oficial y Firmantes de la Pauta ({isAnnual ? 'Asamblea Anual' : 'Entrega de Administración'})
              </span>
              <span className="text-[11px] text-slate-500">
                Estos datos completan la cabecera y el bloque de 4 firmas de la Pauta PDF de 3 páginas.
              </span>
            </div>
          </div>
          {showMetaEditor ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </button>

        {showMetaEditor && (
          <div className="p-5 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Comunidad</label>
                <input
                  type="text"
                  value={meta.communityName || ''}
                  onChange={(e) => onUpdateMeta({ communityName: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none focus:border-[#0F3D2E]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">RUT Comunidad</label>
                <input
                  type="text"
                  placeholder="Ej: 65.123.456-7"
                  value={meta.communityRut || ''}
                  onChange={(e) => onUpdateMeta({ communityRut: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-[#0F3D2E]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                  {isAnnual ? 'Ejercicio / Período Rendido' : 'Fecha de Entrega y Corte'}
                </label>
                {isAnnual ? (
                  <input
                    type="text"
                    placeholder="Ej: Enero a Diciembre 2026"
                    value={meta.annualPeriodLabel || ''}
                    onChange={(e) => onUpdateMeta({ annualPeriodLabel: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-[#0F3D2E]"
                  />
                ) : (
                  <input
                    type="date"
                    value={meta.handoverDate || ''}
                    onChange={(e) => onUpdateMeta({ handoverDate: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-[#0F3D2E]"
                  />
                )}
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Modalidad de Entrega</label>
                <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  {[
                    { id: 'fisica', label: 'Física' },
                    { id: 'digital', label: 'Digital' },
                    { id: 'mixta', label: 'Mixta' }
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => onUpdateMeta({ modality: m.id })}
                      className={`py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                        meta.modality === m.id ? 'bg-[#0F3D2E] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                  {isAnnual ? 'Administrador(a) Titular' : 'Administrador(a) Saliente'}
                </label>
                <input
                  type="text"
                  value={meta.outgoingAdminName || ''}
                  onChange={(e) => onUpdateMeta({ outgoingAdminName: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none focus:border-[#0F3D2E]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">RUT Admin. Saliente/Titular</label>
                <input
                  type="text"
                  value={meta.outgoingAdminRut || ''}
                  onChange={(e) => onUpdateMeta({ outgoingAdminRut: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-[#0F3D2E]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Representante del Comité</label>
                <input
                  type="text"
                  placeholder="Nombre Presidente(a) o integrante"
                  value={meta.committeeRepName || ''}
                  onChange={(e) => onUpdateMeta({ committeeRepName: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:outline-none focus:border-[#0F3D2E]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">RUT Comité</label>
                  <input
                    type="text"
                    placeholder="12.345.678-9"
                    value={meta.committeeRepRut || ''}
                    onChange={(e) => onUpdateMeta({ committeeRepRut: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-[#0F3D2E]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Unidad</label>
                  <input
                    type="text"
                    placeholder="Casa / Depto"
                    value={meta.committeeRepUnit || ''}
                    onChange={(e) => onUpdateMeta({ committeeRepUnit: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-[#0F3D2E]"
                  />
                </div>
              </div>
            </div>

            {!isAnnual ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Administrador(a) Entrante</label>
                  <input
                    type="text"
                    placeholder="Nombre receptor o nueva empresa"
                    value={meta.incomingAdminName || ''}
                    onChange={(e) => onUpdateMeta({ incomingAdminName: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-[#0F3D2E]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">RUT / RNAC Admin. Entrante</label>
                  <input
                    type="text"
                    placeholder="Ej: 15.444.333-2 · RNAC 5210"
                    value={meta.incomingAdminRut || ''}
                    onChange={(e) => onUpdateMeta({ incomingAdminRut: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-[#0F3D2E]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Plazo Revisión / Complementario</label>
                  <input
                    type="text"
                    placeholder="Ej: 30 días corridos desde firma"
                    value={meta.complementaryDeadline || ''}
                    onChange={(e) => onUpdateMeta({ complementaryDeadline: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-[#0F3D2E]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Testigo / Receptor de Respaldo</label>
                  <input
                    type="text"
                    placeholder="Opcional: Tesorero/Secretario Comité"
                    value={meta.witnessName || ''}
                    onChange={(e) => onUpdateMeta({ witnessName: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-[#0F3D2E]"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Fecha Asamblea Ordinaria</label>
                  <input
                    type="date"
                    value={meta.assemblyDate || ''}
                    onChange={(e) => onUpdateMeta({ assemblyDate: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-[#0F3D2E]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Comisión Revisora / Tesorería</label>
                  <input
                    type="text"
                    placeholder="Integrante revisor de cuentas"
                    value={meta.witnessName || ''}
                    onChange={(e) => onUpdateMeta({ witnessName: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-[#0F3D2E]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Constancia / Nota al Pie del Cierre</label>
                  <input
                    type="text"
                    placeholder="Observación general para el pie de la página 3..."
                    value={meta.closingRemarks || ''}
                    onChange={(e) => onUpdateMeta({ closingRemarks: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-[#0F3D2E]"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. RESUMEN DE PENDIENTES CON COMPROMISO DE ENTREGA (SI EXISTEN) */}
      {metrics.pendingCommitments.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
          <div className="text-xs font-black text-amber-950 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-700" />
            <span>
              Antecedentes registrados como Pendientes con Compromiso ({metrics.pendingCommitments.length}) — Quedarán consignados expresamente en la Pauta PDF:
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {metrics.pendingCommitments.map(({ item, entry }) => (
              <div key={item.id} className="bg-white/90 rounded-xl px-3 py-2 border border-amber-200/80 text-[11px] flex items-start justify-between gap-2">
                <div>
                  <strong className="text-[#0F3D2E]">{item.code}</strong>{' '}
                  <span className="font-bold text-slate-800">{item.title}</span>
                  {(entry.notes || entry.dueDate || entry.responsible) && (
                    <div className="text-[10.5px] text-amber-900 mt-0.5">
                      {[entry.notes, entry.dueDate && `Plazo: ${entry.dueDate}`, entry.responsible && `Resp.: ${entry.responsible}`]
                        .filter(Boolean)
                        .join(' • ')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. BARRA DE FILTROS, BÚSQUEDA Y AUTOCOMPLETADO INTELIGENTE */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[210px] max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar antecedente, código (ej. B.2), ley..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-[#0F3D2E]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1">
            {[
              { id: 'all', label: `Todos (${metrics.total})` },
              { id: 'critical', label: 'Críticos Ley 21.442' },
              { id: 'unregistered', label: `Sin marcar (${metrics.unregistered})` },
              { id: 'pendiente', label: `Pendientes (${metrics.pendiente})` },
              { id: 'entregado', label: `${isAnnual ? 'Verificados' : 'Entregados'} (${metrics.entregado})` }
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatusFilter(f.id)}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer transition-all ${
                  statusFilter === f.id
                    ? 'bg-[#0F3D2E] text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onAutoFillFromSystem}
            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#0F3D2E] border border-emerald-200 text-[11px] font-black flex items-center gap-1.5 cursor-pointer transition-all"
            title="Completa formato, cantidades y observaciones con los datos reales detectados en ARANPRO"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
            <span>Autocompletar datos del sistema</span>
          </button>

          <button
            type="button"
            onClick={toggleAllBlocks}
            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold cursor-pointer transition-all"
          >
            Contraer / Expandir
          </button>

          <button
            type="button"
            onClick={onResetAllEntries}
            className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-700 border border-slate-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
            title="Dejar casillas limpias para imprimir formulario en blanco"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Dejar en blanco</span>
          </button>
        </div>
      </div>

      {/* 5. TABLAS ESTRUCTURADAS POR BLOQUE (A - G / A - F) */}
      <div className="space-y-4">
        {filteredSections.map((section) => {
          const SecIcon = section.icon || ClipboardList;
          const isCollapsed = Boolean(collapsedSections[section.code]);
          const secDone = section.items.filter((i) => {
            const st = entries[i.id]?.status;
            return st === 'entregado' || st === 'na';
          }).length;

          return (
            <div key={section.code} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
              {/* Cabecera del Bloque */}
              <div className="bg-[#0F3D2E] text-white px-4 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCollapsedSections((prev) => ({ ...prev, [section.code]: !prev[section.code] }))}
                  className="flex items-center gap-3 text-left cursor-pointer flex-1 min-w-0"
                >
                  <div className="w-8 h-8 rounded-xl bg-[#D4B895]/20 border border-[#D4B895]/40 text-[#D4B895] flex items-center justify-center shrink-0">
                    <SecIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs sm:text-sm font-black uppercase tracking-wide text-white">
                        {section.title}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/10 text-[#D4B895]">
                        Pág. {section.page} de 3 en PDF
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-100/80 truncate mt-0.5">{section.subtitle}</p>
                  </div>
                </button>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[10.5px] font-black px-2.5 py-1 rounded-full ${
                      secDone === section.items.length
                        ? 'bg-emerald-400 text-slate-950'
                        : 'bg-white/15 text-white'
                    }`}
                  >
                    {secDone}/{section.items.length} listos
                  </span>

                  <button
                    type="button"
                    onClick={() => onMarkSectionDone(section.items)}
                    className="px-2.5 py-1 rounded-xl bg-[#D4B895] hover:bg-[#c5a67f] text-[#0F3D2E] text-[10.5px] font-black flex items-center gap-1 cursor-pointer transition-all"
                    title="Marcar todos los ítems de este bloque como Entregados / Verificados"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Marcar bloque</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCollapsedSections((prev) => ({ ...prev, [section.code]: !prev[section.code] }))}
                    className="p-1 text-white/80 hover:text-white cursor-pointer"
                  >
                    {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Tabla de Antecedentes del Bloque */}
              {!isCollapsed && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10.5px] font-black uppercase tracking-wider text-slate-600">
                        <th className="py-2.5 px-4 w-[43%] min-w-[290px]">Antecedente, Alcance Legal & Dato en Sistema</th>
                        <th className="py-2.5 px-3 w-[21%] min-w-[195px] text-center">Estado de Control</th>
                        <th className="py-2.5 px-3 w-[16%] min-w-[155px]">Soporte & Folios/Cant.</th>
                        <th className="py-2.5 px-4 w-[20%] min-w-[200px]">Observaciones para el Acta</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {section.items.map((item) => {
                        const entry = entries[item.id] || {};
                        const st = entry.status || '';
                        const rowBg =
                          st === 'entregado'
                            ? 'bg-emerald-50/25'
                            : st === 'pendiente'
                            ? 'bg-amber-50/40'
                            : st === 'na'
                            ? 'bg-slate-50/70 opacity-80'
                            : 'bg-white hover:bg-slate-50/60';

                        return (
                          <tr key={item.id} className={`transition-colors align-top ${rowBg}`}>
                            {/* Columna 1: Antecedente + qué incluye + dato real + ir al módulo */}
                            <td className="py-3.5 px-4 space-y-1.5">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded-md bg-[#0F3D2E] text-[#D4B895] font-mono font-black text-[10.5px]">
                                  {item.code}
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-bold text-[10px]">
                                  {item.legalRef}
                                </span>
                                {item.critical && (
                                  <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[10px]">
                                    Obligatorio Ley 21.442
                                  </span>
                                )}
                              </div>

                              <div className="font-bold text-slate-900 leading-snug text-[12.5px]">
                                {item.title}
                              </div>

                              <p className="text-[11px] text-slate-600 leading-relaxed">
                                <strong className="text-slate-700">Qué debe incluir:</strong> {item.includes}
                              </p>

                              {/* Dato vivo detectado en ARANPRO + link directo al módulo */}
                              <div className="pt-1 flex flex-wrap items-center justify-between gap-2 bg-slate-100/80 border border-slate-200/80 rounded-xl px-2.5 py-1.5">
                                <span className="text-[10.5px] font-semibold text-slate-700">
                                  <strong className="text-[#0F3D2E]">Sistema ARANPRO:</strong> {item.systemSummary}
                                </span>
                                {item.moduleTab && onNavigateToTab && (
                                  <button
                                    type="button"
                                    onClick={() => onNavigateToTab(item.moduleTab)}
                                    className="px-2 py-0.5 rounded-lg bg-white hover:bg-[#0F3D2E] text-[#0F3D2E] hover:text-white border border-slate-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                                  >
                                    <span>Ir a {item.moduleLabel}</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </button>
                                )}
                              </div>
                            </td>

                            {/* Columna 2: Botones de Estado */}
                            <td className="py-3.5 px-3">
                              <div className="flex flex-col gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    onUpdateEntry(item.id, {
                                      status: st === 'entregado' ? '' : 'entregado',
                                      format: entry.format || item.autoFormat || 'Mixto (Físico + Digital)'
                                    })
                                  }
                                  className={`w-full px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                                    st === 'entregado'
                                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                                      : 'bg-white hover:bg-emerald-50 border-slate-300 text-slate-700'
                                  }`}
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>{isAnnual ? 'Verificado / Listo' : 'Entregado'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    onUpdateEntry(item.id, {
                                      status: st === 'pendiente' ? '' : 'pendiente'
                                    })
                                  }
                                  className={`w-full px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                                    st === 'pendiente'
                                      ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-2xs'
                                      : 'bg-white hover:bg-amber-50 border-slate-300 text-slate-700'
                                  }`}
                                >
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  <span>Pendiente c/Plazo</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    onUpdateEntry(item.id, {
                                      status: st === 'na' ? '' : 'na'
                                    })
                                  }
                                  className={`w-full px-2.5 py-1 rounded-xl border text-[10.5px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all ${
                                    st === 'na'
                                      ? 'bg-slate-600 border-slate-600 text-white'
                                      : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-500'
                                  }`}
                                >
                                  <MinusCircle className="w-3 h-3" />
                                  <span>No aplica</span>
                                </button>
                              </div>
                            </td>

                            {/* Columna 3: Formato / Soporte & Cantidad / Folios */}
                            <td className="py-3.5 px-3 space-y-2">
                              <div>
                                <label className="block text-[9.5px] font-bold uppercase text-slate-500 mb-0.5">
                                  Soporte / Medio
                                </label>
                                <select
                                  value={entry.format || ''}
                                  onChange={(e) => onUpdateEntry(item.id, { format: e.target.value })}
                                  className="w-full px-2 py-1.5 rounded-xl border border-slate-300 bg-white text-[11px] text-slate-800 focus:outline-none focus:border-[#0F3D2E]"
                                >
                                  {FORMAT_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-[9.5px] font-bold uppercase text-slate-500 mb-0.5">
                                  Folios / Cantidad
                                </label>
                                <input
                                  type="text"
                                  value={entry.quantity || ''}
                                  onChange={(e) => onUpdateEntry(item.id, { quantity: e.target.value })}
                                  placeholder={item.autoQty || 'Ej: 1 archivador / 12 PDFs'}
                                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-[11px] text-slate-800 focus:outline-none focus:border-[#0F3D2E]"
                                />
                              </div>
                            </td>

                            {/* Columna 4: Observaciones + Compromiso si está pendiente */}
                            <td className="py-3.5 px-4 space-y-2">
                              <div>
                                <label className="block text-[9.5px] font-bold uppercase text-slate-500 mb-0.5">
                                  Detalle u observación en Pauta PDF
                                </label>
                                <textarea
                                  rows={2}
                                  value={entry.notes || ''}
                                  onChange={(e) => onUpdateEntry(item.id, { notes: e.target.value })}
                                  placeholder={item.autoNote || 'Ubicación del archivo, folios, salvedades...'}
                                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-[11px] text-slate-800 resize-y focus:outline-none focus:border-[#0F3D2E]"
                                />
                              </div>

                              {st === 'pendiente' && (
                                <div className="p-2 rounded-xl bg-amber-100/70 border border-amber-300 space-y-1.5">
                                  <span className="text-[9.5px] font-black uppercase text-amber-900 block">
                                    Compromiso de regularización:
                                  </span>
                                  <div className="grid grid-cols-2 gap-1.5">
                                    <input
                                      type="date"
                                      value={entry.dueDate || ''}
                                      onChange={(e) => onUpdateEntry(item.id, { dueDate: e.target.value })}
                                      className="w-full px-2 py-1 rounded-lg border border-amber-300 bg-white text-[10.5px] text-slate-800"
                                      title="Fecha comprometida"
                                    />
                                    <input
                                      type="text"
                                      value={entry.responsible || ''}
                                      onChange={(e) => onUpdateEntry(item.id, { responsible: e.target.value })}
                                      placeholder="Responsable"
                                      className="w-full px-2 py-1 rounded-lg border border-amber-300 bg-white text-[10.5px] text-slate-800"
                                    />
                                  </div>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 6. BARRA INFERIOR DE CIERRE Y EMISIÓN DE LA PAUTA DE 3 PÁGINAS */}
      <div className="bg-[#0F3D2E] text-white p-5 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
        <div className="space-y-0.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#D4B895] block">
            Documento Oficial Canónico ARANPRO (3 Páginas Carta)
          </span>
          <h4 className="text-sm sm:text-base font-black text-white">
            {isAnnual
              ? 'Pauta de Control de Rendición Anual lista para vista previa o descarga PDF'
              : 'Pauta Oficial de Entrega y Traspaso de Administración lista para imprimir y firmar'}
          </h4>
          <p className="text-xs text-emerald-100/80">
            Se imprime en iframe limpio con membrete, doble filete, timbre circular y firma oficial (sin capturar botones ni bordes de pantalla).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenPreviewPauta}
            className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-bold cursor-pointer transition-all"
          >
            Ver Vista Previa (3 Págs)
          </button>
          <button
            type="button"
            onClick={onPrintPauta}
            className="px-4 py-2.5 rounded-xl bg-[#D4B895] hover:bg-[#c5a67f] text-[#0F3D2E] text-xs font-black cursor-pointer shadow-xs transition-all"
          >
            Imprimir / Descargar PDF Oficial
          </button>
          {onGoToDocumentsStep && (
            <button
              type="button"
              onClick={onGoToDocumentsStep}
              className="px-4 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-black cursor-pointer shadow-xs transition-all"
            >
              Paso 2: Documentos a Entregar →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
