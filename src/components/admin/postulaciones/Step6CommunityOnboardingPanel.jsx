import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Plus, Upload,
  FileSpreadsheet, CheckCircle2, AlertTriangle, ArrowRight, Landmark, Users,
  Download, Sparkles, RefreshCw, ShieldCheck, Layers, Trash2, Calculator,
  Briefcase, Scale, Receipt, Wand2
} from 'lucide-react';
import { useCommunity } from '../../../context/CommunityContext';
import { formatCLP } from '../../../utils/formatters';

const WIZARD_STAGES = [
  { id: 1, short: '1. Origen & CRM', title: 'Modalidad de Recepción & Vínculo CRM', icon: Layers },
  { id: 2, short: '2. Ficha & Comité', title: 'Identificación Legal, Tipología & Comité', icon: Building2 },
  { id: 3, short: '3. Cuadratura Día 1', title: 'Cuadratura Financiera & Pasivos Heredados', icon: Calculator },
  { id: 4, short: '4. Unidades & Saldos', title: 'Nómina de Unidades, Alícuotas & Morosidad', icon: Users },
  { id: 5, short: '5. Semáforo & Alta', title: 'Semáforo de Apertura & Activación Oficial', icon: ShieldCheck }
];

const MIGRATION_PLATFORMS = [
  {
    id: 'edipro',
    name: 'Edipro',
    exportSteps: [
      'Comunidad → Unidades / Copropietarios → Exportar Excel/CSV (incluir alícuota %, propietario, RUT, correo y teléfono).',
      'Finanzas → Morosidad / Cuentas por Cobrar → Exportar deuda total y saldos a favor por unidad a la fecha de corte.',
      'Finanzas → Conciliación / Fondos → Descargar cartola conciliada, cheques en tránsito y saldo del Fondo de Reserva.'
    ]
  },
  {
    id: 'comunidadfeliz',
    name: 'ComunidadFeliz',
    exportSteps: [
      'Copropiedades → Propiedades → Descargar Excel de propiedades con porcentaje de prorrateo y datos de contacto.',
      'Recaudación → Deuda por Propiedad → Exportar morosidad acumulada y abonos disponibles.',
      'Egresos / Fondos → Descargar estado de fondos (Operacional y Reserva) y listado de facturas impagas.'
    ]
  },
  {
    id: 'edifito',
    name: 'Edifito',
    exportSteps: [
      'Administración → Departamentos / Casas → Exportar nómina de copropietarios y alícuotas de dominio.',
      'Gastos Comunes → Cuenta Corriente por Unidad → Exportar saldos pendientes al cierre del último mes.',
      'Contabilidad → Balance de Fondos y cartola bancaria a la fecha de entrega.'
    ]
  },
  {
    id: 'otro_software',
    name: 'Kastor / ComuniApp / Otro',
    exportSteps: [
      'Solicitar planilla de unidades con alícuota (%), propietario, RUT, correo, teléfono, deuda histórica y saldos a favor.',
      'Solicitar cartola bancaria oficial al día de corte y detalle de cheques o transferencias pendientes.',
      'Solicitar inventario de facturas de proveedores pendientes de pago.'
    ]
  },
  {
    id: 'excel_manual',
    name: 'Excel / Administración Manual',
    exportSteps: [
      'Ordenar columnas: Unidad ; Propietario ; RUT ; Email ; Teléfono ; Alícuota % ; Deuda Inicial ; Saldo a Favor.',
      'Copiar directamente el rango de celdas desde Excel y pegarlo en la Etapa 4.',
      'Contrastarlo contra la última cartola bancaria y el Reglamento de Copropiedad.'
    ]
  }
];

const SAMPLE_CSV = [
  'Unidad;Propietario;RUT;Email;Telefono;Alicuota;DeudaInicial;SaldoAFavor',
  'Depto 101;María González Pérez;12.345.678-9;maria@correo.cl;+56912345678;25.00;0;0',
  'Depto 102;Carlos Muñoz Rojas;14.567.890-K;carlos@correo.cl;+56987654321;25.00;145000;0',
  'Depto 201;Ana Silva Torres;15.222.333-4;ana@correo.cl;+56955554444;25.00;0;25000',
  'Depto 202; Pedro Soto Díaz;16.888.999-1;pedro@correo.cl;+56944443333;25.00;68000;0'
].join('\n');

const parseDelimitedUnits = (rawText) => {
  const lines = String(rawText || '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (!lines.length) return [];

  const first = lines[0];
  const sep = first.includes('\t') ? '\t' : (first.split(';').length >= first.split(',').length ? ';' : ',');
  const splitRow = (line) => line.split(sep).map((cell) => cell.trim().replace(/^"|"$/g, ''));
  const firstCells = splitRow(first).map((c) => c.toLowerCase());
  const looksLikeHeader = firstCells.some((c) =>
    /unidad|depto|casa|propiedad|propietario|nombre|alicuota|prorrateo|rut|saldo|deuda/.test(c)
  );

  const dataLines = looksLikeHeader ? lines.slice(1) : lines;
  const units = [];

  dataLines.forEach((line, idx) => {
    const cols = splitRow(line);
    const number = cols[0] || `Unidad ${idx + 1}`;
    const owner = cols[1] || `Copropietario ${number}`;
    const rut = cols[2] || '';
    const email = cols[3] || '';
    const phone = cols[4] || '';
    const rawAliq = String(cols[5] || '').replace('%', '').replace(',', '.').trim();
    const alicuota = Number.isFinite(parseFloat(rawAliq)) && parseFloat(rawAliq) > 0 ? parseFloat(rawAliq) : 0;
    const rawDebt = String(cols[6] || '0').replace(/[^0-9-]/g, '');
    const previousBalance = Number.isFinite(parseInt(rawDebt, 10)) ? Math.max(0, parseInt(rawDebt, 10)) : 0;
    const rawCredit = String(cols[7] || '0').replace(/[^0-9-]/g, '');
    const creditBalance = Number.isFinite(parseInt(rawCredit, 10)) ? Math.max(0, parseInt(rawCredit, 10)) : 0;

    units.push({
      id: `u-imp-${Date.now()}-${idx}`,
      number,
      owner,
      rut,
      email,
      phone,
      alicuota,
      previousBalance,
      creditBalance,
      status: previousBalance > 0 ? 'MOROSO' : 'AL DÍA',
      paymentHistory: []
    });
  });

  if (units.length > 0 && units.every((u) => !u.alicuota)) {
    const equal = +(100 / units.length).toFixed(4);
    units.forEach((u) => { u.alicuota = equal; });
  }

  return units;
};

export const Step6CommunityOnboardingPanel = ({
  proposalConfig = {},
  postulationPipeline = [],
  onMarkPipelineAdjudicated,
  onSelectCommunityToManage,
  onNavigateToModule,
  pendingAction = null,
  onConsumePendingAction = () => {},
  showAlert = () => {}
}) => {
  const { addCommunity, updateCommunity } = useCommunity();
  const [isOpen, setIsOpen] = useState(false);
  const [activeStage, setActiveStage] = useState(1);
  useEffect(() => {
    if (!pendingAction || pendingAction.section !== 'flujo' || pendingAction.step !== 6) return;
    setIsOpen(true);
    onConsumePendingAction?.();
  }, [pendingAction?.nonce]);

  // Etapa 1: Origen y CRM
  const [onboardingMode, setOnboardingMode] = useState('traspaso'); // 'desde_cero' | 'traspaso'
  const [sourcePlatform, setSourcePlatform] = useState('edipro');
  const [selectedOpportunityId, setSelectedOpportunityId] = useState(proposalConfig?.opportunityId || '');
  const [markCrmWon, setMarkCrmWon] = useState(true);

  // Etapa 2: Ficha Legal y Comité
  const [form, setForm] = useState(() => ({
    name: proposalConfig?.targetCondo?.trim() || '',
    communityRut: '',
    type: 'Edificio / Departamentos',
    address: '',
    city: proposalConfig?.targetCity?.trim() || 'La Serena / Coquimbo',
    totalUnits: Number(proposalConfig?.targetUnits) || 24,
    monthlyAdminFeeCLP: Number(proposalConfig?.proposedMonthlyFee) || 850000,
    reserveFundPercentage: 5,
    firstMonth: new Date().getMonth() + 1,
    firstYear: new Date().getFullYear(),
    outgoingAdminName: proposalConfig?.outgoingAdminName?.trim() || '',
    handoverCutoffDate: new Date().toISOString().slice(0, 10),
    developerName: '',
    domReceptionDate: '',
    committeePresident: proposalConfig?.committeePresidentName?.trim() || '',
    committeeTreasurer: '',
    committeeSecretary: '',
    committeeEmail: proposalConfig?.targetEmail?.trim() || '',
    committeePhone: ''
  }));

  // Etapa 3: Cuadratura Financiera de Apertura (Corte Día 1)
  const [finance, setFinance] = useState({
    bank: 'Banco Estado',
    accountType: 'Cuenta Corriente',
    accountNumber: '',
    bankEmail: '',
    bankStatementBalance: 0,      // (+) Saldo según cartola bancaria
    pettyCashBalance: 0,          // (+) Caja chica arqueada
    inTransitChecks: 0,           // (-) Cheques girados / pagos en tránsito no cobrados
    operationalFundDeclared: 0,   // Fondo operacional / común declarado
    reserveFundDeclared: 0,       // Fondo de reserva acumulado (Art. 39)
    specialFundsDeclared: 0,      // Fondos especiales / indemnización
    discrepancyNotes: '',         // Observación legal si hay diferencia
    registerInheritedAsExpenses: true
  });

  const [inheritedInvoices, setInheritedInvoices] = useState([]);
  const [invoiceDraft, setInvoiceDraft] = useState({
    provider: '',
    description: '',
    documentNumber: '',
    category: 'Mantención',
    amount: ''
  });

  // Etapa 4: Unidades y Prorrateo
  const [genMode, setGenMode] = useState('pisos'); // 'correlativo' | 'pisos'
  const [genConfig, setGenConfig] = useState({
    prefix: 'Depto',
    startNumber: 101,
    floors: 6,
    unitsPerFloor: 4
  });
  const [rawPaste, setRawPaste] = useState('');
  const [stagedUnits, setStagedUnits] = useState([]);

  // Etapa 5: Checklist documental y resultado
  const [checklist, setChecklist] = useState({
    reglamento: false,
    prorrateo: false,
    rutPoderes: false,
    cartolaCorte: false,
    actaContrato: false,
    seguroIncendio: false
  });
  const [createdCommunity, setCreatedCommunity] = useState(null);

  const selectedPlatformObj = useMemo(
    () => MIGRATION_PLATFORMS.find((p) => p.id === sourcePlatform) || MIGRATION_PLATFORMS[0],
    [sourcePlatform]
  );

  // ---- Cálculos en tiempo real de Cuadratura Financiera (Etapa 3) ----
  const reconciliation = useMemo(() => {
    const bank = Number(finance.bankStatementBalance) || 0;
    const cash = Number(finance.pettyCashBalance) || 0;
    const transit = Number(finance.inTransitChecks) || 0;
    const realAvailable = bank + cash - transit;

    const op = Number(finance.operationalFundDeclared) || 0;
    const res = Number(finance.reserveFundDeclared) || 0;
    const spec = Number(finance.specialFundsDeclared) || 0;
    const declaredTotal = op + res + spec;

    const diff = realAvailable - declaredTotal;
    const liabilitiesTotal = inheritedInvoices.reduce((acc, inv) => acc + (Number(inv.amount) || 0), 0);
    const netOpeningPosition = realAvailable - liabilitiesTotal;

    const isBalanced = diff === 0;
    const hasExplanation = Boolean(finance.discrepancyNotes.trim());

    return {
      realAvailable,
      declaredTotal,
      diff,
      liabilitiesTotal,
      netOpeningPosition,
      isBalanced,
      hasExplanation
    };
  }, [finance, inheritedInvoices]);

  // ---- Métricas de Unidades (Etapa 4) ----
  const unitMetrics = useMemo(() => {
    const count = stagedUnits.length;
    const aliquotSum = +(stagedUnits.reduce((acc, u) => acc + (Number(u.alicuota) || 0), 0)).toFixed(2);
    const totalDebt = stagedUnits.reduce((acc, u) => acc + (Number(u.previousBalance) || 0), 0);
    const totalCredit = stagedUnits.reduce((acc, u) => acc + (Number(u.creditBalance) || 0), 0);
    const delinquentCount = stagedUnits.filter((u) => (Number(u.previousBalance) || 0) > 0).length;
    const aliquotOk = count > 0 && Math.abs(aliquotSum - 100) <= 0.5;
    return { count, aliquotSum, totalDebt, totalCredit, delinquentCount, aliquotOk };
  }, [stagedUnits]);

  // ---- Semáforo de Apertura (5 Pilares) ----
  const readinessPillars = useMemo(() => {
    const legalReady = Boolean(form.name.trim() && form.city.trim() && Number(form.monthlyAdminFeeCLP) > 0);
    const legalFull = legalReady && Boolean(form.communityRut.trim() && form.committeePresident.trim());

    const bankReady = Boolean(finance.bank && finance.accountNumber.trim());

    const financeReady = reconciliation.isBalanced || reconciliation.hasExplanation;
    const financePerfect = reconciliation.isBalanced;

    const unitsReady = unitMetrics.count > 0;
    const unitsPerfect = unitMetrics.aliquotOk;

    const checkedCount = Object.values(checklist).filter(Boolean).length;
    const docsPerfect = checkedCount >= 4;

    const pillars = [
      {
        id: 'legal',
        stage: 2,
        title: 'Ficha Legal & Comité',
        tone: legalFull ? 'emerald' : legalReady ? 'amber' : 'rose',
        status: legalFull ? 'Completa' : legalReady ? 'Falta RUT o Presidente' : 'Falta nombre de comunidad',
        points: legalFull ? 20 : legalReady ? 14 : 0
      },
      {
        id: 'banco',
        stage: 3,
        title: 'Cuenta Bancaria de la Comunidad',
        tone: bankReady ? 'emerald' : 'amber',
        status: bankReady ? `${finance.bank} • Cta. registrada` : 'N° de cuenta por confirmar',
        points: bankReady ? 20 : 10
      },
      {
        id: 'cuadratura',
        stage: 3,
        title: 'Cuadratura Financiera Día 1',
        tone: financePerfect ? 'emerald' : financeReady ? 'amber' : 'rose',
        status: financePerfect
          ? `Cuadrada al peso (${formatCLP(reconciliation.realAvailable)})`
          : financeReady
            ? `Descuadre documentado (${formatCLP(reconciliation.diff)})`
            : `Descuadre sin observación (${formatCLP(reconciliation.diff)})`,
        points: financePerfect ? 25 : financeReady ? 18 : 5
      },
      {
        id: 'unidades',
        stage: 4,
        title: 'Nómina de Unidades & Prorrateo',
        tone: unitsPerfect ? 'emerald' : unitsReady ? 'amber' : 'amber',
        status: unitsPerfect
          ? `${unitMetrics.count} unidades • Alícuotas ${unitMetrics.aliquotSum}%`
          : unitsReady
            ? `${unitMetrics.count} unidades • Suma ${unitMetrics.aliquotSum}% (revisar 100%)`
            : 'Sin unidades precargadas (se creará vacía)',
        points: unitsPerfect ? 20 : unitsReady ? 13 : 6
      },
      {
        id: 'respaldos',
        stage: 5,
        title: 'Respaldos Legales de Recepción',
        tone: docsPerfect ? 'emerald' : checkedCount > 0 ? 'amber' : 'amber',
        status: `${checkedCount} de 6 documentos verificados`,
        points: Math.round((checkedCount / 6) * 15)
      }
    ];

    const score = Math.min(100, pillars.reduce((acc, p) => acc + p.points, 0));
    const overallTone = !form.name.trim() || !financeReady ? 'rose' : score >= 85 ? 'emerald' : 'amber';
    return { pillars, score, overallTone };
  }, [form, finance, reconciliation, unitMetrics, checklist]);

  // ---- Acciones ----
  const handleSyncFromProposal = () => {
    setForm((prev) => ({
      ...prev,
      name: proposalConfig?.targetCondo?.trim() || prev.name,
      city: proposalConfig?.targetCity?.trim() || prev.city,
      totalUnits: Number(proposalConfig?.targetUnits) || prev.totalUnits,
      monthlyAdminFeeCLP: Number(proposalConfig?.proposedMonthlyFee) || prev.monthlyAdminFeeCLP,
      committeePresident: proposalConfig?.committeePresidentName?.trim() || prev.committeePresident,
      outgoingAdminName: proposalConfig?.outgoingAdminName?.trim() || prev.outgoingAdminName
    }));
    showAlert('Datos sincronizados', 'Se trajeron los antecedentes actuales desde tu propuesta.', 'success');
  };

  const handleSelectCrmOpportunity = (oppId) => {
    setSelectedOpportunityId(oppId);
    const found = (postulationPipeline || []).find((p) => p.id === oppId);
    if (!found) return;
    setForm((prev) => ({
      ...prev,
      name: found.condoName || found.condo || prev.name,
      city: found.city || prev.city,
      totalUnits: Number(found.units) || prev.totalUnits,
      monthlyAdminFeeCLP: Number(found.monthlyFeeCLP) || prev.monthlyAdminFeeCLP,
      committeePresident: found.contactName || prev.committeePresident,
      committeeEmail: found.contactEmail || prev.committeeEmail,
      committeePhone: found.contactPhone || prev.committeePhone
    }));
  };

  const handleAutoBalanceOperational = () => {
    const remainder = reconciliation.realAvailable - (Number(finance.reserveFundDeclared) || 0) - (Number(finance.specialFundsDeclared) || 0);
    setFinance((prev) => ({ ...prev, operationalFundDeclared: Math.max(0, remainder) }));
  };

  const handleAddInheritedInvoice = () => {
    const amt = Number(invoiceDraft.amount) || 0;
    if (!invoiceDraft.provider.trim() || amt <= 0) {
      showAlert('Datos incompletos', 'Indica el proveedor y un monto mayor a $0 para registrar el pasivo heredado.', 'warning');
      return;
    }
    setInheritedInvoices((prev) => [
      ...prev,
      {
        id: `inv-her-${Date.now()}`,
        provider: invoiceDraft.provider.trim(),
        description: invoiceDraft.description.trim() || 'Cuenta pendiente administración anterior',
        documentNumber: invoiceDraft.documentNumber.trim() || 'S/N',
        category: invoiceDraft.category || 'Mantención',
        amount: amt
      }
    ]);
    setInvoiceDraft({ provider: '', description: '', documentNumber: '', category: 'Mantención', amount: '' });
  };

  const handleGenerateUnits = () => {
    const list = [];
    if (genMode === 'pisos') {
      const floors = Math.max(1, Math.min(60, Number(genConfig.floors) || 5));
      const perFloor = Math.max(1, Math.min(30, Number(genConfig.unitsPerFloor) || 4));
      const total = floors * perFloor;
      const equalAliq = +(100 / total).toFixed(4);
      for (let f = 1; f <= floors; f++) {
        for (let u = 1; u <= perFloor; u++) {
          const numStr = `${genConfig.prefix || 'Depto'} ${f}${String(u).padStart(2, '0')}`;
          list.push({
            id: `u-gen-${Date.now()}-${f}-${u}`,
            number: numStr,
            owner: `Copropietario ${numStr}`,
            rut: '',
            email: '',
            phone: '',
            alicuota: equalAliq,
            previousBalance: 0,
            creditBalance: 0,
            status: 'AL DÍA',
            paymentHistory: []
          });
        }
      }
    } else {
      const count = Math.max(1, Math.min(500, Number(form.totalUnits) || 12));
      const startNum = Number(genConfig.startNumber) || 1;
      const prefix = (genConfig.prefix || 'Casa').trim();
      const equalAliq = +(100 / count).toFixed(4);
      for (let i = 0; i < count; i++) {
        const numStr = `${prefix} ${startNum + i}`;
        list.push({
          id: `u-gen-${Date.now()}-${i}`,
          number: numStr,
          owner: `Copropietario ${numStr}`,
          rut: '',
          email: '',
          phone: '',
          alicuota: equalAliq,
          previousBalance: 0,
          creditBalance: 0,
          status: 'AL DÍA',
          paymentHistory: []
        });
      }
    }
    setStagedUnits(list);
    setForm((prev) => ({ ...prev, totalUnits: list.length }));
    showAlert('Unidades generadas', `Se crearon ${list.length} unidades con prorrateo base (puedes ajustar cada fila en la tabla).`, 'success');
  };

  const handleParseText = (text) => {
    const parsed = parseDelimitedUnits(text);
    if (!parsed.length) {
      showAlert('Sin filas válidas', 'Pega al menos una fila con Unidad y Propietario (separado por ; , o tabulación desde Excel).', 'warning');
      return;
    }
    setStagedUnits(parsed);
    setForm((prev) => ({ ...prev, totalUnits: parsed.length }));
    showAlert('Nómina importada', `Se procesaron ${parsed.length} unidades correctamente.`, 'success');
  };

  const handleCsvFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      setRawPaste(text);
      handleParseText(text);
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  const handleDownloadSampleCsv = () => {
    const blob = new Blob(['\uFEFF' + SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ARANPRO_Plantilla_Traspaso_Unidades.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  const handleUpdateUnitField = (id, key, val) => {
    setStagedUnits((prev) =>
      prev.map((u) => {
        if (u.id !== id) return u;
        if (key === 'alicuota') return { ...u, alicuota: Math.max(0, parseFloat(val) || 0) };
        if (key === 'previousBalance') {
          const debt = Math.max(0, parseInt(val, 10) || 0);
          return { ...u, previousBalance: debt, status: debt > 0 ? 'MOROSO' : 'AL DÍA' };
        }
        return { ...u, [key]: val };
      })
    );
  };

  const handleCreateCommunity = () => {
    if (!form.name.trim()) {
      setActiveStage(2);
      showAlert('Falta el nombre de la comunidad', 'Completa el nombre oficial en la Etapa 2 antes de activar.', 'warning');
      return;
    }
    if (!reconciliation.isBalanced && !reconciliation.hasExplanation) {
      setActiveStage(3);
      showAlert(
        'Cuadratura de apertura con diferencia sin documentar',
        'En la Etapa 3 existe una diferencia entre el saldo bancario real y los fondos declarados. Cuádrala o registra la observación de respaldo antes de activar.',
        'warning'
      );
      return;
    }

    const finalUnits = stagedUnits.length > 0 ? stagedUnits : [];
    const created = addCommunity({
      name: form.name.trim(),
      type: form.type,
      address: form.address.trim(),
      city: form.city.trim() || 'La Serena / Coquimbo',
      totalUnits: finalUnits.length > 0 ? finalUnits.length : (Number(form.totalUnits) || 10),
      reserveFundPercentage: Number(form.reserveFundPercentage) || 5,
      initialBankBalance: reconciliation.realAvailable,
      accumulatedReserveFund: Number(finance.reserveFundDeclared) || 0,
      bankInfo: {
        bank: finance.bank || 'Banco Estado',
        accountType: finance.accountType || 'Cuenta Corriente',
        accountNumber: finance.accountNumber.trim(),
        holderName: form.name.trim(),
        rut: form.communityRut.trim(),
        email: finance.bankEmail.trim()
      }
    });

    if (created?.id) {
      const todayStr = new Date().toISOString().slice(0, 10);
      const initialExpenses = finance.registerInheritedAsExpenses
        ? inheritedInvoices.map((inv, idx) => ({
            id: `exp-open-${Date.now()}-${idx}`,
            category: inv.category || 'Mantención',
            description: `${inv.description} (Pasivo heredado al traspaso)`,
            provider: inv.provider,
            providerRut: '',
            documentType: 'Factura Electrónica',
            documentNumber: inv.documentNumber || 'S/N',
            date: form.handoverCutoffDate || todayStr,
            amount: Number(inv.amount) || 0,
            fundSource: 'ordinario',
            isRecurring: false,
            status: 'pendiente',
            approvedByCommittee: false,
            receiptNotes: 'Pasivo recibido pendiente de pago en cuadratura inicial de recepción.'
          }))
        : [];

      updateCommunity(created.id, {
        units: finalUnits,
        expenses: initialExpenses,
        monthlyAdminFeeCLP: Number(form.monthlyAdminFeeCLP) || 0,
        activePeriod: {
          month: Number(form.firstMonth) || (new Date().getMonth() + 1),
          year: Number(form.firstYear) || new Date().getFullYear(),
          dueDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
          status: 'BORRADOR'
        },
        onboardingMeta: {
          mode: onboardingMode,
          sourcePlatform: onboardingMode === 'traspaso' ? sourcePlatform : 'nueva',
          handoverCutoffDate: form.handoverCutoffDate,
          outgoingAdminName: form.outgoingAdminName.trim(),
          developerName: form.developerName.trim(),
          domReceptionDate: form.domReceptionDate,
          committee: {
            president: form.committeePresident.trim(),
            treasurer: form.committeeTreasurer.trim(),
            secretary: form.committeeSecretary.trim(),
            email: form.committeeEmail.trim(),
            phone: form.committeePhone.trim()
          },
          openingReconciliation: {
            bankStatementBalance: Number(finance.bankStatementBalance) || 0,
            pettyCashBalance: Number(finance.pettyCashBalance) || 0,
            inTransitChecks: Number(finance.inTransitChecks) || 0,
            realAvailable: reconciliation.realAvailable,
            operationalFundDeclared: Number(finance.operationalFundDeclared) || 0,
            reserveFundDeclared: Number(finance.reserveFundDeclared) || 0,
            specialFundsDeclared: Number(finance.specialFundsDeclared) || 0,
            declaredTotal: reconciliation.declaredTotal,
            diff: reconciliation.diff,
            discrepancyNotes: finance.discrepancyNotes.trim(),
            inheritedLiabilitiesTotal: reconciliation.liabilitiesTotal,
            netOpeningPosition: reconciliation.netOpeningPosition,
            inheritedInvoices
          },
          checklist,
          readinessScore: readinessPillars.score,
          createdAt: new Date().toISOString()
        }
      });

      if (markCrmWon && onMarkPipelineAdjudicated) {
        onMarkPipelineAdjudicated(selectedOpportunityId, form.name.trim());
      }

      setCreatedCommunity({
        ...created,
        unitsCount: finalUnits.length,
        realAvailable: reconciliation.realAvailable,
        inheritedCount: initialExpenses.length
      });

      showAlert(
        '¡Comunidad creada y cuadrada en ARANPRO!',
        `"${created.name}" quedó activa con ${finalUnits.length} unidades y saldo inicial conciliado de ${formatCLP(reconciliation.realAvailable)}.`,
        'success'
      );
    }
  };

  return (
    <div className="bg-white rounded-3xl border-2 border-[#0F3D2E]/25 shadow-sm overflow-hidden">
      {/* CABECERA ACORDEÓN PASO 6 */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="w-full p-5 md:p-6 flex items-center justify-between gap-4 text-left bg-gradient-to-r from-[#0F3D2E] via-[#144D3A] to-[#0A291F] text-white cursor-pointer hover:brightness-105 transition-all"
      >
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-[#D4B895] text-[#0F3D2E] font-black text-base flex items-center justify-center shrink-0 shadow-sm">
            6
          </div>
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#D4B895]/20 text-[#D4B895] border border-[#D4B895]/40">
                PASO 6 • ASISTENTE DE RECEPCIÓN Y ALTA DE COMUNIDAD
              </span>
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                readinessPillars.overallTone === 'emerald'
                  ? 'bg-emerald-400/20 text-emerald-200 border-emerald-300/40'
                  : readinessPillars.overallTone === 'amber'
                    ? 'bg-amber-400/20 text-amber-200 border-amber-300/40'
                    : 'bg-rose-400/20 text-rose-200 border-rose-300/40'
              }`}>
                Apertura: {readinessPillars.score}%
              </span>
            </div>
            <h3 className="text-base md:text-lg font-black text-white leading-tight">
              Recepción Contable Día 1, Migración de Unidades y Creación de Comunidad
            </h3>
            <p className="text-xs text-emerald-100/85 max-w-3xl">
              Asistente guiado en 5 etapas con cuadratura financiera de apertura (cartola vs fondos y facturas heredadas), importador desde Edipro / ComunidadFeliz / Edifito y semáforo de activación.
            </p>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-[#D4B895]">
          <span className="hidden sm:inline">{isOpen ? 'Ocultar' : 'Abrir Asistente'}</span>
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-5 md:p-6 space-y-6 bg-[#FDFBF7]/70 animate-in fade-in duration-150">
          {/* BANNER DE ÉXITO SI YA SE CREÓ */}
          {createdCommunity && (
            <div className="p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-400 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="text-sm font-black text-emerald-950">
                    ¡Comunidad &ldquo;{createdCommunity.name}&rdquo; dada de alta y lista para operar!
                  </h4>
                  <p className="text-xs text-emerald-800">
                    {createdCommunity.unitsCount} unidades registradas • Saldo inicial conciliado: <strong>{formatCLP(createdCommunity.realAvailable)}</strong>
                    {createdCommunity.inheritedCount > 0 && ` • ${createdCommunity.inheritedCount} factura(s) heredada(s) cargadas como pendientes`}.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {onSelectCommunityToManage && (
                  <button
                    type="button"
                    onClick={() => onSelectCommunityToManage(createdCommunity.id)}
                    className="px-4 py-2.5 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-[#D4B895] font-black text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <span>Entrar a Administrar Comunidad</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
                {onNavigateToModule && (
                  <button
                    type="button"
                    onClick={() => onNavigateToModule('comunidades')}
                    className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs cursor-pointer"
                  >
                    Ver en Mis Comunidades
                  </button>
                )}
              </div>
            </div>
          )}

          {/* BARRA DE PROGRESO Y STEPPER DE 5 ETAPAS */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-black text-slate-800 uppercase tracking-wider text-[11px]">
                Etapa {activeStage} de 5 • {WIZARD_STAGES[activeStage - 1].title}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500">Semáforo de Apertura:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border ${
                  readinessPillars.overallTone === 'emerald'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : readinessPillars.overallTone === 'amber'
                      ? 'bg-amber-50 text-amber-900 border-amber-300'
                      : 'bg-rose-50 text-rose-800 border-rose-300'
                }`}>
                  {readinessPillars.score}% Listo
                </span>
              </div>
            </div>

            {/* Barra lineal */}
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  readinessPillars.overallTone === 'emerald'
                    ? 'bg-emerald-600'
                    : readinessPillars.overallTone === 'amber'
                      ? 'bg-amber-500'
                      : 'bg-[#0F3D2E]'
                }`}
                style={{ width: `${Math.max(12, readinessPillars.score)}%` }}
              />
            </div>

            {/* Botones de las 5 etapas */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
              {WIZARD_STAGES.map((st) => {
                const Icon = st.icon;
                const isCurrent = activeStage === st.id;
                const isPast = activeStage > st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setActiveStage(st.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                      isCurrent
                        ? 'bg-[#0F3D2E] text-white border-[#0F3D2E] shadow-xs'
                        : isPast
                          ? 'bg-emerald-50/70 text-[#0F3D2E] border-emerald-200 hover:bg-emerald-50'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isCurrent ? 'text-[#D4B895]' : 'text-[#0F3D2E]'}`} />
                    <span className="text-[11px] font-bold truncate">{st.short}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ==================== ETAPA 1: ORIGEN & VINCULACIÓN CRM ==================== */}
          {activeStage === 1 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Vinculación rápida con CRM y Postulación */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-[#0F3D2E]" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                      Vincular con Postulación Adjudicada (Opcional)
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={handleSyncFromProposal}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#0F3D2E] border border-emerald-200 text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Traer datos de la Propuesta Actual</span>
                  </button>
                </div>

                {postulationPipeline.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
                    <label className="block space-y-1">
                      <span className="text-[11px] font-bold text-slate-700">O elegir condominio desde tu CRM de Postulaciones:</span>
                      <select
                        value={selectedOpportunityId}
                        onChange={(e) => handleSelectCrmOpportunity(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-900"
                      >
                        <option value="">— Seleccionar postulación del CRM —</option>
                        {postulationPipeline.map((opp) => (
                          <option key={opp.id} value={opp.id}>
                            {opp.condoName || opp.condo} ({opp.city || 'Sin ciudad'}) • {formatCLP(Number(opp.monthlyFeeCLP) || 0)}/mes
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={markCrmWon}
                        onChange={(e) => setMarkCrmWon(e.target.checked)}
                        className="rounded border-slate-300 text-[#0F3D2E]"
                      />
                      <span>Marcar automáticamente como <strong>Adjudicada / Ganada</strong> en el CRM al crear la comunidad</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Modalidad: Desde Cero vs Traspaso */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Selecciona el escenario de recepción
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setOnboardingMode('desde_cero')}
                    className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer space-y-1.5 ${
                      onboardingMode === 'desde_cero'
                        ? 'border-[#0F3D2E] bg-emerald-50/70 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-2 text-sm font-black text-slate-900">
                        <Sparkles className="w-4 h-4 text-[#0F3D2E]" />
                        Comunidad Desde Cero
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
                        Entrega Inmobiliaria / Nueva
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Para condominios recién recibidos de inmobiliaria o sin plataforma previa. Permite estructurar torres/pisos o casas desde cero y registrar fecha de recepción DOM.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOnboardingMode('traspaso')}
                    className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer space-y-1.5 ${
                      onboardingMode === 'traspaso'
                        ? 'border-[#0F3D2E] bg-emerald-50/70 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-2 text-sm font-black text-slate-900">
                        <Layers className="w-4 h-4 text-[#0F3D2E]" />
                        Traspaso de Otra Plataforma
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                        Edipro • ComunidadFeliz • Edifito
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Para comunidades que vienen de otro administrador o software. Activa la pauta de exportación, conciliación de saldos heredados e importación masiva CSV/Excel.
                    </p>
                  </button>
                </div>

                {onboardingMode === 'traspaso' ? (
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div className="flex flex-wrap gap-2">
                      {MIGRATION_PLATFORMS.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSourcePlatform(p.id)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            sourcePlatform === p.id
                              ? 'bg-[#0F3D2E] text-white border-[#0F3D2E]'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>

                    <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1.5">
                      <p className="text-xs font-black text-amber-950">
                        Archivos clave a pedir / descargar desde {selectedPlatformObj.name}:
                      </p>
                      <ol className="list-decimal pl-5 space-y-1 text-xs text-amber-950/90">
                        {selectedPlatformObj.exportSteps.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ol>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <label className="block space-y-1">
                        <span className="text-[11px] font-bold text-slate-700">Administrador / Empresa Saliente</span>
                        <input
                          type="text"
                          value={form.outgoingAdminName}
                          onChange={(e) => setForm({ ...form, outgoingAdminName: e.target.value })}
                          placeholder="Nombre o razón social saliente"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                        />
                      </label>
                      <label className="block space-y-1">
                        <span className="text-[11px] font-bold text-slate-700">Fecha de Corte Contable del Traspaso</span>
                        <input
                          type="date"
                          value={form.handoverCutoffDate}
                          onChange={(e) => setForm({ ...form, handoverCutoffDate: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-900"
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                    <label className="block space-y-1">
                      <span className="text-[11px] font-bold text-slate-700">Inmobiliaria / Constructora (Opcional)</span>
                      <input
                        type="text"
                        value={form.developerName}
                        onChange={(e) => setForm({ ...form, developerName: e.target.value })}
                        placeholder="Para control de garantías postventa LGUC"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                      />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-[11px] font-bold text-slate-700">Fecha Recepción Definitiva DOM (Opcional)</span>
                      <input
                        type="date"
                        value={form.domReceptionDate}
                        onChange={(e) => setForm({ ...form, domReceptionDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-900"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== ETAPA 2: FICHA LEGAL & COMITÉ ==================== */}
          {activeStage === 2 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                  <Building2 className="w-4 h-4 text-[#0F3D2E]" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    Datos Legales, Operativos y Honorarios
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  <label className="block space-y-1 md:col-span-2">
                    <span className="text-[11px] font-bold text-slate-700">Nombre Oficial de la Comunidad *</span>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Ej: Condominio Vista Mar Norte"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900"
                    />
                  </label>

                  <label className="block space-y-1">
                    <span className="text-[11px] font-bold text-slate-700">RUT Comunidad (SII)</span>
                    <input
                      type="text"
                      value={form.communityRut}
                      onChange={(e) => setForm({ ...form, communityRut: e.target.value })}
                      placeholder="Ej: 53.310.420-8"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-900"
                    />
                  </label>

                  <label className="block space-y-1">
                    <span className="text-[11px] font-bold text-slate-700">Tipología</span>
                    <select
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-900"
                    >
                      <option value="Edificio / Departamentos">Edificio / Departamentos</option>
                      <option value="Casas">Condominio de Casas</option>
                      <option value="Mixto">Mixto (Torres + Casas / Locales)</option>
                      <option value="Oficinas / Comercial">Oficinas / Locales Comerciales</option>
                    </select>
                  </label>

                  <label className="block space-y-1">
                    <span className="text-[11px] font-bold text-slate-700">Dirección Exacta</span>
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="Ej: Av. Pacífico 3450"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                    />
                  </label>

                  <label className="block space-y-1">
                    <span className="text-[11px] font-bold text-slate-700">Ciudad / Comuna *</span>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      placeholder="Ej: La Serena"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
                    />
                  </label>

                  <label className="block space-y-1">
                    <span className="text-[11px] font-bold text-slate-700">Total de Unidades</span>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={form.totalUnits}
                      onChange={(e) => setForm({ ...form, totalUnits: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-900"
                    />
                  </label>

                  <label className="block space-y-1">
                    <span className="text-[11px] font-bold text-slate-700">Honorario Mensual ARANPRO (CLP)</span>
                    <input
                      type="number"
                      min="0"
                      step="10000"
                      value={form.monthlyAdminFeeCLP}
                      onChange={(e) => setForm({ ...form, monthlyAdminFeeCLP: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold text-[#0F3D2E]"
                    />
                  </label>

                  <div className="grid grid-cols-3 gap-2">
                    <label className="block space-y-1">
                      <span className="text-[11px] font-bold text-slate-700">% Reserva</span>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        step="0.5"
                        value={form.reserveFundPercentage}
                        onChange={(e) => setForm({ ...form, reserveFundPercentage: e.target.value })}
                        className="w-full px-2 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                      />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-[11px] font-bold text-slate-700">1er Mes</span>
                      <select
                        value={form.firstMonth}
                        onChange={(e) => setForm({ ...form, firstMonth: Number(e.target.value) })}
                        className="w-full px-1.5 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                      >
                        {['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'].map((m, i) => (
                          <option key={m} value={i + 1}>{m}</option>
                        ))}
                      </select>
                    </label>
                    <label className="block space-y-1">
                      <span className="text-[11px] font-bold text-slate-700">Año</span>
                      <input
                        type="number"
                        min="2024"
                        max="2035"
                        value={form.firstYear}
                        onChange={(e) => setForm({ ...form, firstYear: Number(e.target.value) })}
                        className="w-full px-2 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                  <Users className="w-4 h-4 text-[#0F3D2E]" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    Comité de Administración Vigente (Art. 17 Ley N° 21.442)
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  <label className="block space-y-1">
                    <span className="text-[11px] font-bold text-slate-700">Presidente(a) del Comité</span>
                    <input
                      type="text"
                      value={form.committeePresident}
                      onChange={(e) => setForm({ ...form, committeePresident: e.target.value })}
                      placeholder="Nombre completo"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-[11px] font-bold text-slate-700">Tesorero(a) / Miembro 2</span>
                    <input
                      type="text"
                      value={form.committeeTreasurer}
                      onChange={(e) => setForm({ ...form, committeeTreasurer: e.target.value })}
                      placeholder="Nombre completo"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-[11px] font-bold text-slate-700">Secretario(a) / Miembro 3</span>
                    <input
                      type="text"
                      value={form.committeeSecretary}
                      onChange={(e) => setForm({ ...form, committeeSecretary: e.target.value })}
                      placeholder="Nombre completo"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    />
                  </label>
                  <label className="block space-y-1 md:col-span-2">
                    <span className="text-[11px] font-bold text-slate-700">Correo Oficial del Comité</span>
                    <input
                      type="email"
                      value={form.committeeEmail}
                      onChange={(e) => setForm({ ...form, committeeEmail: e.target.value })}
                      placeholder="comite@condominio.cl"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-[11px] font-bold text-slate-700">Teléfono Directo Comité</span>
                    <input
                      type="text"
                      value={form.committeePhone}
                      onChange={(e) => setForm({ ...form, committeePhone: e.target.value })}
                      placeholder="+56 9 ..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ==================== ETAPA 3: CUADRATURA FINANCIERA DE APERTURA ==================== */}
          {activeStage === 3 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Cuenta Bancaria */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                  <Landmark className="w-4 h-4 text-[#0F3D2E]" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    Cuenta Bancaria Exclusiva de la Comunidad
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <label className="block space-y-1">
                    <span className="text-[11px] font-bold text-slate-700">Banco</span>
                    <select
                      value={finance.bank}
                      onChange={(e) => setFinance({ ...finance, bank: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                    >
                      <option value="Banco Estado">Banco Estado</option>
                      <option value="Banco de Chile">Banco de Chile</option>
                      <option value="Banco Santander">Banco Santander</option>
                      <option value="BCI">BCI</option>
                      <option value="Scotiabank">Scotiabank</option>
                      <option value="Banco Itaú">Banco Itaú</option>
                      <option value="Banco BICE">Banco BICE</option>
                      <option value="Banco Security">Banco Security</option>
                    </select>
                  </label>
                  <label className="block space-y-1">
                    <span className="text-[11px] font-bold text-slate-700">Tipo de Cuenta</span>
                    <select
                      value={finance.accountType}
                      onChange={(e) => setFinance({ ...finance, accountType: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                    >
                      <option value="Cuenta Corriente">Cuenta Corriente</option>
                      <option value="Cuenta Vista / Chequera Electrónica">Cuenta Vista / Chequera Electrónica</option>
                    </select>
                  </label>
                  <label className="block space-y-1">
                    <span className="text-[11px] font-bold text-slate-700">N° de Cuenta</span>
                    <input
                      type="text"
                      value={finance.accountNumber}
                      onChange={(e) => setFinance({ ...finance, accountNumber: e.target.value })}
                      placeholder="Ej: 123-004567-01"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-[11px] font-bold text-slate-700">Correo Recepción Pagos</span>
                    <input
                      type="email"
                      value={finance.bankEmail}
                      onChange={(e) => setFinance({ ...finance, bankEmail: e.target.value })}
                      placeholder="pagos@comunidad.cl"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    />
                  </label>
                </div>
              </div>

              {/* Conciliador en 2 columnas: Banco Real vs Fondos Contables */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Columna A: Disponibilidad Real */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3.5">
                  <div className="border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#0F3D2E]">A. Arqueo Bancario Real</span>
                    <h5 className="text-sm font-black text-slate-900">Disponibilidad Efectiva al Día 1</h5>
                  </div>

                  <label className="block space-y-1">
                    <span className="text-[11px] font-bold text-slate-700">(+) Saldo según Cartola Bancaria de Corte (CLP)</span>
                    <input
                      type="number"
                      min="0"
                      value={finance.bankStatementBalance}
                      onChange={(e) => setFinance({ ...finance, bankStatementBalance: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-900"
                    />
                  </label>

                  <label className="block space-y-1">
                    <span className="text-[11px] font-bold text-slate-700">(+) Caja Chica / Efectivo Arqueado Recibido (CLP)</span>
                    <input
                      type="number"
                      min="0"
                      value={finance.pettyCashBalance}
                      onChange={(e) => setFinance({ ...finance, pettyCashBalance: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-900"
                    />
                  </label>

                  <label className="block space-y-1">
                    <span className="text-[11px] font-bold text-rose-700">(-) Cheques Girados / Pagos en Tránsito No Cobrados (CLP)</span>
                    <input
                      type="number"
                      min="0"
                      value={finance.inTransitChecks}
                      onChange={(e) => setFinance({ ...finance, inTransitChecks: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-rose-200 bg-rose-50/30 text-xs font-mono text-rose-900"
                    />
                  </label>

                  <div className="p-3 rounded-xl bg-[#0F3D2E] text-white flex items-center justify-between">
                    <span className="text-xs font-bold">Total Disponible Real Conciliado:</span>
                    <strong className="text-base font-black font-mono text-[#D4B895]">
                      {formatCLP(reconciliation.realAvailable)}
                    </strong>
                  </div>
                </div>

                {/* Columna B: Distribución Contable de Fondos */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 gap-2">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#0F3D2E]">B. Respaldo de Fondos</span>
                      <h5 className="text-sm font-black text-slate-900">Composición Contable Declarada</h5>
                    </div>
                    <button
                      type="button"
                      onClick={handleAutoBalanceOperational}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#0F3D2E] border border-emerald-200 text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer"
                      title="Calcula automáticamente el Fondo Operacional descontando Fondo de Reserva y Especiales al saldo real"
                    >
                      <Wand2 className="w-3 h-3" />
                      <span>Cuadrar Operacional</span>
                    </button>
                  </div>

                  <label className="block space-y-1">
                    <span className="text-[11px] font-bold text-slate-700">Fondo Operacional / Común Disponible (CLP)</span>
                    <input
                      type="number"
                      min="0"
                      value={finance.operationalFundDeclared}
                      onChange={(e) => setFinance({ ...finance, operationalFundDeclared: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-900"
                    />
                  </label>

                  <label className="block space-y-1">
                    <span className="text-[11px] font-bold text-slate-700">Fondo de Reserva Acumulado Art. 39 (CLP)</span>
                    <input
                      type="number"
                      min="0"
                      value={finance.reserveFundDeclared}
                      onChange={(e) => setFinance({ ...finance, reserveFundDeclared: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold text-emerald-900"
                    />
                  </label>

                  <label className="block space-y-1">
                    <span className="text-[11px] font-bold text-slate-700">Fondos Especiales / Indemnización Personal (CLP)</span>
                    <input
                      type="number"
                      min="0"
                      value={finance.specialFundsDeclared}
                      onChange={(e) => setFinance({ ...finance, specialFundsDeclared: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-900"
                    />
                  </label>

                  <div className="p-3 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Total Fondos Declarados:</span>
                    <strong className="text-base font-black font-mono text-slate-900">
                      {formatCLP(reconciliation.declaredTotal)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Semáforo de Cuadratura Bancaria vs Fondos */}
              <div className={`p-4 rounded-2xl border-2 space-y-3 ${
                reconciliation.isBalanced
                  ? 'bg-emerald-50 border-emerald-300'
                  : 'bg-amber-50 border-amber-300'
              }`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {reconciliation.isBalanced ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                    ) : (
                      <Scale className="w-5 h-5 text-amber-800 shrink-0" />
                    )}
                    <div>
                      <strong className={`text-xs font-black block ${reconciliation.isBalanced ? 'text-emerald-950' : 'text-amber-950'}`}>
                        {reconciliation.isBalanced
                          ? '✓ CUADRATURA DE APERTURA EXACTA ($0 de diferencia entre banco real y fondos contables)'
                          : `⚠ DIFERENCIA DE CUADRATURA DETECTADA: ${reconciliation.diff > 0 ? '+' : ''}${formatCLP(reconciliation.diff)}`}
                      </strong>
                      <span className="text-[11px] text-slate-700">
                        {reconciliation.isBalanced
                          ? 'El efectivo conciliado coincide exactamente con la suma del Fondo Operacional, Fondo de Reserva y Fondos Especiales.'
                          : 'El saldo bancario real no coincide con los fondos informados por la administración saliente. Cuádralo o deja constancia abajo para tu resguardo legal.'}
                      </span>
                    </div>
                  </div>
                </div>

                {!reconciliation.isBalanced && (
                  <label className="block space-y-1">
                    <span className="text-[11px] font-black text-amber-950">
                      Observación / Reserva de Recepción Contable (Obligatoria si recibes con descuadre):
                    </span>
                    <textarea
                      rows={2}
                      value={finance.discrepancyNotes}
                      onChange={(e) => setFinance({ ...finance, discrepancyNotes: e.target.value })}
                      placeholder="Ej: Se recibe cartola con faltante de $320.000 respecto del Fondo de Reserva informado por administración saliente; se deja constancia en Acta de Recepción para auditoría del Comité."
                      className="w-full p-2.5 rounded-xl border border-amber-300 bg-white text-xs text-slate-800"
                    />
                  </label>
                )}
              </div>

              {/* Pasivos y Facturas Heredadas Impagas */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-[#0F3D2E]" />
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                        Facturas y Deudas con Proveedores Heredadas (Opcional)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Registra cuentas impagas dejadas por la gestión anterior para conocer la liquidez neta real del Día 1.
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <span className="text-slate-500 block text-[10px]">Posición Líquida Neta Día 1:</span>
                    <strong className={`font-mono font-black text-sm ${reconciliation.netOpeningPosition >= 0 ? 'text-emerald-800' : 'text-rose-700'}`}>
                      {formatCLP(reconciliation.netOpeningPosition)}
                    </strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5 items-end">
                  <label className="block space-y-1">
                    <span className="text-[10px] font-bold text-slate-600">Proveedor</span>
                    <input
                      type="text"
                      value={invoiceDraft.provider}
                      onChange={(e) => setInvoiceDraft({ ...invoiceDraft, provider: e.target.value })}
                      placeholder="Ej: Ascensores / CGE"
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-[10px] font-bold text-slate-600">Glosa / Concepto</span>
                    <input
                      type="text"
                      value={invoiceDraft.description}
                      onChange={(e) => setInvoiceDraft({ ...invoiceDraft, description: e.target.value })}
                      placeholder="Mantención mes anterior"
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-[10px] font-bold text-slate-600">N° Factura / Doc</span>
                    <input
                      type="text"
                      value={invoiceDraft.documentNumber}
                      onChange={(e) => setInvoiceDraft({ ...invoiceDraft, documentNumber: e.target.value })}
                      placeholder="F-10420"
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-[10px] font-bold text-slate-600">Monto Impago (CLP)</span>
                    <input
                      type="number"
                      min="0"
                      value={invoiceDraft.amount}
                      onChange={(e) => setInvoiceDraft({ ...invoiceDraft, amount: e.target.value })}
                      placeholder="0"
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleAddInheritedInvoice}
                    className="py-2 px-3 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#D4B895]" />
                    <span>Agregar Pasivo</span>
                  </button>
                </div>

                {inheritedInvoices.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-100 text-[10px] uppercase text-slate-600">
                          <tr>
                            <th className="p-2">Proveedor</th>
                            <th className="p-2">Concepto</th>
                            <th className="p-2">N° Doc</th>
                            <th className="p-2 text-right">Monto</th>
                            <th className="p-2 text-center">Quitar</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {inheritedInvoices.map((inv) => (
                            <tr key={inv.id}>
                              <td className="p-2 font-bold text-slate-900">{inv.provider}</td>
                              <td className="p-2 text-slate-600">{inv.description}</td>
                              <td className="p-2 font-mono text-slate-500">{inv.documentNumber}</td>
                              <td className="p-2 text-right font-mono font-bold text-rose-700">{formatCLP(inv.amount)}</td>
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => setInheritedInvoices((prev) => prev.filter((x) => x.id !== inv.id))}
                                  className="text-rose-600 hover:text-rose-800 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5 inline" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={finance.registerInheritedAsExpenses}
                        onChange={(e) => setFinance({ ...finance, registerInheritedAsExpenses: e.target.checked })}
                        className="rounded border-slate-300 text-[#0F3D2E]"
                      />
                      <span>Cargar automáticamente estas {inheritedInvoices.length} factura(s) como <strong>pendientes de pago</strong> en Gastos &amp; Respaldos de la nueva comunidad</span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== ETAPA 4: UNIDADES, ALÍCUOTAS & MOROSIDAD ==================== */}
          {activeStage === 4 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#0F3D2E]" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                      {onboardingMode === 'desde_cero'
                        ? 'Generador Estructurado de Unidades (Desde Cero)'
                        : `Importador de Unidades y Saldos desde ${selectedPlatformObj.name}`}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadSampleCsv}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#0F3D2E]" />
                    <span>Descargar Plantilla CSV</span>
                  </button>
                </div>

                {onboardingMode === 'desde_cero' ? (
                  <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setGenMode('pisos')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                          genMode === 'pisos' ? 'bg-[#0F3D2E] text-white' : 'bg-white border border-slate-300 text-slate-700'
                        }`}
                      >
                        Por Pisos × Deptos (Edificio)
                      </button>
                      <button
                        type="button"
                        onClick={() => setGenMode('correlativo')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                          genMode === 'correlativo' ? 'bg-[#0F3D2E] text-white' : 'bg-white border border-slate-300 text-slate-700'
                        }`}
                      >
                        Numeración Correlativa (Casas / Lotes)
                      </button>
                    </div>

                    {genMode === 'pisos' ? (
                      <div className="flex flex-wrap items-end gap-3">
                        <label className="block space-y-1">
                          <span className="text-[11px] font-bold text-slate-700">Prefijo</span>
                          <input
                            type="text"
                            value={genConfig.prefix}
                            onChange={(e) => setGenConfig({ ...genConfig, prefix: e.target.value })}
                            className="w-28 px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs"
                          />
                        </label>
                        <label className="block space-y-1">
                          <span className="text-[11px] font-bold text-slate-700">Cantidad de Pisos</span>
                          <input
                            type="number"
                            min="1"
                            max="60"
                            value={genConfig.floors}
                            onChange={(e) => setGenConfig({ ...genConfig, floors: e.target.value })}
                            className="w-28 px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-mono"
                          />
                        </label>
                        <label className="block space-y-1">
                          <span className="text-[11px] font-bold text-slate-700">Unidades por Piso</span>
                          <input
                            type="number"
                            min="1"
                            max="30"
                            value={genConfig.unitsPerFloor}
                            onChange={(e) => setGenConfig({ ...genConfig, unitsPerFloor: e.target.value })}
                            className="w-28 px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-mono"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={handleGenerateUnits}
                          className="px-4 py-2 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 text-[#D4B895]" />
                          <span>Generar {(Number(genConfig.floors) || 1) * (Number(genConfig.unitsPerFloor) || 1)} Unidades</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-end gap-3">
                        <label className="block space-y-1">
                          <span className="text-[11px] font-bold text-slate-700">Prefijo</span>
                          <input
                            type="text"
                            value={genConfig.prefix}
                            onChange={(e) => setGenConfig({ ...genConfig, prefix: e.target.value })}
                            className="w-28 px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs"
                          />
                        </label>
                        <label className="block space-y-1">
                          <span className="text-[11px] font-bold text-slate-700">N° Inicial</span>
                          <input
                            type="number"
                            value={genConfig.startNumber}
                            onChange={(e) => setGenConfig({ ...genConfig, startNumber: e.target.value })}
                            className="w-24 px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-mono"
                          />
                        </label>
                        <label className="block space-y-1">
                          <span className="text-[11px] font-bold text-slate-700">Total Unidades</span>
                          <input
                            type="number"
                            min="1"
                            max="500"
                            value={form.totalUnits}
                            onChange={(e) => setForm({ ...form, totalUnits: e.target.value })}
                            className="w-28 px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-mono"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={handleGenerateUnits}
                          className="px-4 py-2 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 text-[#D4B895]" />
                          <span>Generar {Number(form.totalUnits) || 12} Unidades</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="px-4 py-2 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer">
                        <Upload className="w-3.5 h-3.5 text-[#D4B895]" />
                        <span>Subir CSV exportado ({selectedPlatformObj.name})</span>
                        <input type="file" accept=".csv,.txt" className="hidden" onChange={handleCsvFileUpload} />
                      </label>
                      <button
                        type="button"
                        onClick={() => { setRawPaste(SAMPLE_CSV); handleParseText(SAMPLE_CSV); }}
                        className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-[#0F3D2E]" />
                        <span>Cargar Ejemplo de Prueba</span>
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-600 block">
                        O copia y pega filas desde Excel (Unidad ; Propietario ; RUT ; Email ; Teléfono ; Alícuota % ; Deuda Inicial ; Saldo a Favor):
                      </span>
                      <textarea
                        rows={4}
                        value={rawPaste}
                        onChange={(e) => setRawPaste(e.target.value)}
                        placeholder="Depto 101;María González;12.345.678-9;maria@correo.cl;+56912345678;5.0;120000;0"
                        className="w-full p-3 rounded-xl border border-slate-300 text-xs font-mono text-slate-800"
                      />
                      <button
                        type="button"
                        onClick={() => handleParseText(rawPaste)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                      >
                        Procesar Nómina Pegada
                      </button>
                    </div>
                  </div>
                )}

                {/* Tabla editable de unidades precargadas */}
                {stagedUnits.length > 0 && (
                  <div className="space-y-2.5 pt-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold">
                          {unitMetrics.count} unidades
                        </span>
                        <span className={`px-2.5 py-1 rounded-lg border font-bold ${
                          unitMetrics.aliquotOk
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : 'bg-amber-50 border-amber-300 text-amber-900'
                        }`}>
                          Suma alícuotas: {unitMetrics.aliquotSum}% {unitMetrics.aliquotOk ? '✓' : '(debe acercarse a 100%)'}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 font-bold">
                          Morosidad recibida: {formatCLP(unitMetrics.totalDebt)} ({unitMetrics.delinquentCount} morosos)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStagedUnits([])}
                        className="text-rose-600 hover:text-rose-800 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Vaciar tabla
                      </button>
                    </div>

                    <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-[11px] text-left">
                        <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] sticky top-0">
                          <tr>
                            <th className="p-2">Unidad</th>
                            <th className="p-2">Copropietario</th>
                            <th className="p-2">RUT</th>
                            <th className="p-2 text-right">Alícuota %</th>
                            <th className="p-2 text-right">Deuda Inicial ($)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {stagedUnits.slice(0, 60).map((u) => (
                            <tr key={u.id} className="hover:bg-slate-50">
                              <td className="p-1.5 font-bold text-slate-900">{u.number}</td>
                              <td className="p-1.5">
                                <input
                                  type="text"
                                  value={u.owner}
                                  onChange={(e) => handleUpdateUnitField(u.id, 'owner', e.target.value)}
                                  className="w-full px-2 py-1 rounded border border-slate-200 text-[11px]"
                                />
                              </td>
                              <td className="p-1.5 font-mono text-slate-500">{u.rut || '-'}</td>
                              <td className="p-1.5 text-right">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={u.alicuota}
                                  onChange={(e) => handleUpdateUnitField(u.id, 'alicuota', e.target.value)}
                                  className="w-20 px-2 py-1 rounded border border-slate-200 text-right font-mono text-[11px]"
                                />
                              </td>
                              <td className="p-1.5 text-right">
                                <input
                                  type="number"
                                  step="1000"
                                  value={u.previousBalance}
                                  onChange={(e) => handleUpdateUnitField(u.id, 'previousBalance', e.target.value)}
                                  className="w-28 px-2 py-1 rounded border border-slate-200 text-right font-mono font-bold text-[11px]"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== ETAPA 5: SEMÁFORO DE APERTURA & ACTIVACIÓN ==================== */}
          {activeStage === 5 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Tablero de 5 Pilares del Semáforo */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#0F3D2E]" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                      Diagnóstico del Semáforo de Apertura ({readinessPillars.score}%)
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-500">Haz clic en cualquier ítem para ir a ajustarlo</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {readinessPillars.pillars.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setActiveStage(p.stage)}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between gap-3 cursor-pointer transition-all hover:brightness-98 ${
                        p.tone === 'emerald'
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                          : p.tone === 'amber'
                            ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                            : 'bg-rose-50/70 border-rose-200 text-rose-950'
                      }`}
                    >
                      <div className="min-w-0">
                        <strong className="text-xs font-black block">{p.title}</strong>
                        <span className="text-[11px] opacity-85 block truncate">{p.status}</span>
                      </div>
                      <span className="text-[10px] font-bold underline shrink-0">Etapa {p.stage}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Checklist Documental de Resguardo Ley 21.442 */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Respaldos Legales Verificados en la Recepción
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                  {[
                    ['reglamento', 'Reglamento de Copropiedad inscrito en el CBR'],
                    ['prorrateo', 'Tabla oficial de alícuotas / prorrateo verificada'],
                    ['rutPoderes', 'RUT Comunidad y habilitación de apoderados bancarios'],
                    ['cartolaCorte', 'Cartola bancaria a la fecha de corte firmada / conciliada'],
                    ['actaContrato', 'Acta de designación y Contrato de Administración firmados'],
                    ['seguroIncendio', 'Póliza vigente de Seguro Colectivo contra Incendio (Art. 43)']
                  ].map(([k, label]) => (
                    <label key={k} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-emerald-50/40">
                      <input
                        type="checkbox"
                        checked={Boolean(checklist[k])}
                        onChange={(e) => setChecklist((prev) => ({ ...prev, [k]: e.target.checked }))}
                        className="rounded border-slate-300 text-[#0F3D2E]"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Resumen Ejecutivo Final antes de Activar */}
              <div className="p-5 rounded-2xl bg-[#0F3D2E] text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#D4B895]">
                    Resumen de Activación en ARANPRO
                  </span>
                  <h4 className="text-base font-black">
                    {form.name.trim() || 'Nombre de Comunidad Pendiente'} • {unitMetrics.count || Number(form.totalUnits) || 0} Unidades
                  </h4>
                  <p className="text-xs text-emerald-100/90">
                    Saldo Banco Conciliado: <strong>{formatCLP(reconciliation.realAvailable)}</strong> • Fondo Reserva: <strong>{formatCLP(Number(finance.reserveFundDeclared) || 0)}</strong> • Morosidad Inicial: <strong>{formatCLP(unitMetrics.totalDebt)}</strong>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCreateCommunity}
                  className="px-6 py-3.5 rounded-2xl bg-[#D4B895] hover:bg-[#e3c9a8] text-[#0F3D2E] font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer shrink-0"
                >
                  <Building2 className="w-4 h-4" />
                  <span>Crear Comunidad y Activar en ARANPRO</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* NAVEGACIÓN INFERIOR ENTRE ETAPAS */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <button
              type="button"
              disabled={activeStage === 1}
              onClick={() => setActiveStage((s) => Math.max(1, s - 1))}
              className={`px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 ${
                activeStage === 1
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 cursor-pointer'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Etapa Anterior</span>
            </button>

            {activeStage < 5 ? (
              <button
                type="button"
                onClick={() => setActiveStage((s) => Math.min(5, s + 1))}
                className="px-5 py-2.5 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white text-xs font-black inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>Siguiente: {WIZARD_STAGES[activeStage].short}</span>
                <ChevronRight className="w-4 h-4 text-[#D4B895]" />
              </button>
            ) : (
              <span className="text-[11px] text-slate-500 font-medium">
                Etapa final lista para crear la comunidad
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
