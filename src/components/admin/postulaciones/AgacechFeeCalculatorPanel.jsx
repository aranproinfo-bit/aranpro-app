import React, { useState, useMemo, useEffect } from 'react';
import {
  Calculator, Building2, HardHat, Users, Clock, AlertTriangle,
  CheckCircle2, ArrowRight, Printer, Sparkles, DollarSign, Info, RefreshCw,
  Store, Home, ShieldCheck, Flame, Droplets, Zap, Truck, Layers, HelpCircle
} from 'lucide-react';
import { formatCLP } from '../../../utils/formatters';
import { printDocumentDirectly } from '../../../utils/printDocument';
import { AranproLogo, AranproOfficialSeal, AranproPdfStyleSelector, useAranproPdfStyle } from '../../common/MauranLogo';
import { CanonicalPdfHeader, CanonicalPdfPageFooter, CanonicalPdfFinalSignature, canonicalPdfHeaderStyles } from '../../common/CanonicalPdfParts';
import { useCommunity } from '../../../context/CommunityContext';

/**
 * MATRIZ PERICIAL DE HONORARIOS ARANPRO • LEY N° 21.442
 * Modelo Profesional de Complejidad Constructiva, Funcional & Mixta
 * 
 * Diseñado con rigor de Constructor Civil para evaluar con precisión técnica:
 * - Edificios en Altura / Torres
 * - Condominios de Casas / Extensión Horizontal
 * - Condominios Mixtos Residenciales (Casas + Torres)
 * - Condominios Mixtos Comerciales (Departamentos/Casas + Locales Comerciales / Strip Center)
 * - Sectores y Subadministraciones Contables Segregadas (Art. 6° Ley N° 21.442)
 */

export const CONDO_TYPOLOGIES = [
  {
    id: 'depto_only',
    label: '🏢 Edificio / Torre en Altura',
    sub: 'Habitacional Exclusivo',
    badge: '1.00x Base',
    multiplier: 1.00,
    desc: 'Transporte vertical (ascensores), salas de bombas presurizadas, calderas y ductos verticales.'
  },
  {
    id: 'house_only',
    label: '🏡 Condominio de Casas',
    sub: 'Horizontal / Extensión',
    badge: '1.05x Extensión',
    multiplier: 1.05,
    desc: 'Grandes perímetros, calles interiores, iluminación propia, redes de riego y accesos dobles.'
  },
  {
    id: 'mixed_residential',
    label: '🏘️ Mixto Casas + Torres',
    sub: 'Extensión + Altura (Ley 21.442)',
    badge: '+10% Complejidad',
    multiplier: 1.10,
    desc: 'Coexistencia de torres y casas, con necesidades de mantención y administración que deben evaluarse.'
  },
  {
    id: 'mixed_commercial',
    label: '🏬 Mixto Habitacional + Locales',
    sub: 'Departamentos + Comercio / Strip Center',
    badge: '+15% Alta Demanda',
    multiplier: 1.15,
    desc: 'Locales a la calle o strip center. Flujo externo, estacionamientos rotativos, extracción gastronómica y patentes.'
  }
];

const UNIT_TIERS = [
  { id: 't1', min: 1, max: 50, rateUF: 0.30, label: '1 a 50 unidades', desc: 'Comunidades pequeñas (0.30 UF / unidad)' },
  { id: 't2', min: 51, max: 120, rateUF: 0.22, label: '51 a 120 unidades', desc: 'Escala media estándar (0.22 UF / unidad)' },
  { id: 't3', min: 121, max: 250, rateUF: 0.18, label: '121 a 250 unidades', desc: 'Escala media-alta (0.18 UF / unidad)' },
  { id: 't4', min: 251, max: 9999, rateUF: 0.14, label: '250+ unidades', desc: 'Gran escala / costo marginal menor (0.14 UF / unidad)' }
];

const AGE_FACTORS = [
  {
    id: 'new',
    label: 'Menos de 2 años',
    title: 'Recepción Final & Posventa Inmobiliaria',
    multiplier: 1.10,
    badge: '+10% Complejidad',
    desc: 'Cobro de garantías posventa a la inmobiliaria, puesta en marcha de equipos y reglamento inicial.'
  },
  {
    id: 'stable',
    label: '2 a 8 años',
    title: 'Período Operativo Estable',
    multiplier: 1.00,
    badge: '1.00x Neutro',
    desc: 'Instalaciones asentadas con mantenciones preventivas programadas y operación regular.'
  },
  {
    id: 'mid',
    label: '9 a 20 años',
    title: 'Renovaciones Iniciales & Desgaste Medio',
    multiplier: 1.15,
    badge: '+15% Mantención',
    desc: 'Reemplazo de sellos, pintura de fachadas, impermeabilización de cubiertas y modernización de componentes.'
  },
  {
    id: 'old',
    label: 'Más de 20 años',
    title: 'Desgaste Severo & Fallas Frecuentes',
    multiplier: 1.25,
    badge: '+25% Alta Exigencia',
    desc: 'Fatiga en matrices verticales, salas de bombas antiguas, tableros fuera de norma SEC y peritajes continuos.'
  }
];

const INITIAL_STATES = [
  {
    id: 'al_dia',
    label: 'Condominio al Día (Contabilidad Ordenada)',
    surchargeUF: 0,
    desc: 'Traspaso normal sin atrasos contables ni morosidad crítica.'
  },
  {
    id: 'desorden_medio',
    label: 'Desorden Contable Moderado / Traspaso Pendiente',
    surchargeUF: 2.5,
    desc: 'Conciliaciones atrasadas o falta de arqueo del Fondo de Reserva (+2.5 UF/mes primeros 3 meses).'
  },
  {
    id: 'critico',
    label: 'Desorden Crítico / Morosidad Extrema (>25%)',
    surchargeUF: 4.5,
    desc: 'Reconstrucción contable forense, regularización SII/Leyes Sociales y cobranza intensiva (+4.5 UF/mes primeros 3 meses).'
  }
];

export const AgacechFeeCalculatorPanel = ({
  proposalConfig,
  setProposalConfig,
  empresaForm,
  onApplyToDossier,
  showAlert
}) => {
  const { companySettings } = useCommunity();
  const [pdfStyle, setPdfStyle] = useAranproPdfStyle('alt4');
  const signatureImage = empresaForm?.signatureDataUrl || companySettings?.signatureDataUrl || '';
  const signatureScale = Number(companySettings?.signatureScale) || 1.65;

  // Estado del modelo de cálculo ARANPRO
  const communityName = (proposalConfig?.targetCondo || '').trim();
  const storageKey = communityName ? `aranpro_fee_v1:${communityName.toLocaleLowerCase('es-CL')}` : '';
  const createInitialCalc = () => ({
    condoName: communityName,
    typology: '', // El usuario debe elegir la tipología de la comunidad.
    // Desglose de unidades
    declaredUnits: proposalConfig?.targetUnits || '',
    unitSource: 'total',
    deptosCount: '',
    housesCount: '',
    commercialCount: '',
    storageParkingCount: 0,
    // Sub-sectores contables independientes con gasto común segregado (Art. 6° Ley 21.442)
    subsectorsCount: 1, // 1 = único; cada sector adicional agrega 1.5 UF
    
    ufValueCLP: '',
    ufDate: '',
    minFloorUF: 15,
    calcMethod: 'direct', // 'direct' | 'progressive'
    ageId: '',

    // Equipamiento Vertical (Torres / Departamentos)
    elevatorsCount: 0,        // +0.5 UF c/u (con mantención Minvu)
    hasBoiler: false,         // +1.5 UF (Caldera central agua caliente/calefacción)
    boilersCount: 1,
    hasPumpRoom: false,       // +1.0 UF (Sala de bombas / estanques agua potable)
    hasGenerator: false,      // +0.5 UF (Grupo electrógeno de respaldo)
    hasPoolClubhouse: false,  // +1.0 UF (Piscina / Club house / Quinchos / Gym)
    hasCctvFence: false,      // +0.5 UF (Cerco eléctrico perimetral, CCTV y portones)

    // Equipamiento de Extensión (Casas / Horizontal)
    hasDeepWell: false,       // +1.5 UF (Pozo profundo agua potable o regadío)
    hasWaterTreatmentPlant: false, // +2.0 UF (Planta de tratamiento de aguas servidas PTAS / fosa)
    hasInternalStreetLighting: false, // +0.8 UF (Calles interiores extensas y postación de alumbrado propio)
    hasDoubleAccessGate: false, // +1.0 UF (Doble acceso con barreras TAG: residentes vs proveedores)

    // Complejidad Comercial (Locales / Strip Center)
    hasCommercialTraffic: false, // +1.5 UF (Locales con atención masiva de público y alta rotación vehicular)
    hasGastronomyExhaust: false, // +1.0 UF (Ductos gastronómicos, campanas, SEREMI y SEC)
    hasCommercialLoadingDock: false, // +0.8 UF (Zona de carga y descarga de camiones de abastecimiento)

    // Dotación de RRHH
    directEmployees: 0,       // +0.30 UF por trabajador directo
    outsourcedCompanies: 0,   // +0.40 UF por empresa subcontratada (control F30-1)

    // Estado inicial de traspaso
    initialStateId: 'al_dia'
  });
  const loadCalc = () => {
    const initial = createInitialCalc();
    try {
      const saved = storageKey && JSON.parse(localStorage.getItem(storageKey) || 'null');
      return saved ? { ...initial, ...saved, condoName: communityName } : initial;
    } catch { return initial; }
  };
  const [calc, setCalc] = useState(loadCalc);
  const [saveStatus, setSaveStatus] = useState('');
  useEffect(() => { setCalc(loadCalc()); setSaveStatus(''); }, [storageKey]);
  const saveCalc = () => {
    if (!storageKey) { setSaveStatus('Ingresa primero el nombre de la comunidad en la postulación.'); return; }
    try { localStorage.setItem(storageKey, JSON.stringify(calc)); setSaveStatus('Estudio guardado para esta comunidad en este navegador.'); }
    catch { setSaveStatus('No se pudo guardar el estudio en este navegador.'); }
  };

  // Cálculo integral de la Matriz Pericial ARANPRO
  const result = useMemo(() => {
    // 1. Total de unidades según tipología
    const dCount = Math.max(0, Number(calc.deptosCount) || 0);
    const hCount = Math.max(0, Number(calc.housesCount) || 0);
    const cCount = Math.max(0, Number(calc.commercialCount) || 0);

    const breakdownUnits = dCount + hCount + cCount;
    const declaredUnits = Math.max(0, Number(calc.declaredUnits) || 0);
    const units = calc.unitSource === 'breakdown' ? (breakdownUnits || declaredUnits) : (declaredUnits || breakdownUnits);
    // El valor anterior se usa solo para una vista preliminar; la validación exige
    // ingresar una UF y fecha antes de imprimir o aplicar el honorario.
    const ufCLP = Math.max(0, Number(calc.ufValueCLP) || 38450);
    const minFloorUF = Math.max(1, Number(calc.minFloorUF) || 15);

    // 2. Determinar tramo y Tarifa Base en UF
    const activeTier = UNIT_TIERS.find(t => units >= t.min && units <= t.max) || UNIT_TIERS[UNIT_TIERS.length - 1];

    let baseUF = 0;
    if (calc.calcMethod === 'progressive') {
      let remaining = units;
      const b1 = Math.min(remaining, 50);
      baseUF += b1 * 0.30;
      remaining = Math.max(0, remaining - b1);

      const b2 = Math.min(remaining, 70); // 51 a 120
      baseUF += b2 * 0.22;
      remaining = Math.max(0, remaining - b2);

      const b3 = Math.min(remaining, 130); // 121 a 250
      baseUF += b3 * 0.18;
      remaining = Math.max(0, remaining - b3);

      if (remaining > 0) {
        baseUF += remaining * 0.14;
      }
    } else {
      baseUF = units * activeTier.rateUF;
    }

    // 3. Sub-sectores Contables Diferenciados (Art. 6° Ley N° 21.442)
    // 1 sector = normal; cada sector contable adicional con prorrateo y cuenta independiente agrega +1.5 UF
    const subsectors = Math.max(1, Number(calc.subsectorsCount) || 1);
    const subsectorsUF = Math.max(0, subsectors - 1) * 1.5;

    // 4. Complejidad por Equipamiento Vertical (Torres)
    const boilerUF = calc.hasBoiler ? 1.5 * Math.max(1, Number(calc.boilersCount) || 1) : 0;
    const elevatorsUF = Math.max(0, Number(calc.elevatorsCount) || 0) * 0.5;
    const pumpRoomUF = calc.hasPumpRoom ? 1.0 : 0;
    const generatorUF = calc.hasGenerator ? 0.5 : 0;
    const poolClubUF = calc.hasPoolClubhouse ? 1.0 : 0;
    const cctvFenceUF = calc.hasCctvFence ? 0.5 : 0;
    const verticalEquipmentUF = boilerUF + elevatorsUF + pumpRoomUF + generatorUF + poolClubUF + cctvFenceUF;

    // 5. Complejidad por Equipamiento de Extensión (Casas)
    const deepWellUF = calc.hasDeepWell ? 1.5 : 0;
    const waterTreatmentUF = calc.hasWaterTreatmentPlant ? 2.0 : 0;
    const internalLightingUF = calc.hasInternalStreetLighting ? 0.8 : 0;
    const doubleGateUF = calc.hasDoubleAccessGate ? 1.0 : 0;
    const horizontalEquipmentUF = deepWellUF + waterTreatmentUF + internalLightingUF + doubleGateUF;

    // 6. Complejidad Comercial / Locales
    const commTrafficUF = calc.hasCommercialTraffic ? 1.5 : 0;
    const gastroExhaustUF = calc.hasGastronomyExhaust ? 1.0 : 0;
    const loadingDockUF = calc.hasCommercialLoadingDock ? 0.8 : 0;
    const commercialEquipmentUF = commTrafficUF + gastroExhaustUF + loadingDockUF;

    // Equipamiento total acumulado
    const totalEquipmentUF = verticalEquipmentUF + horizontalEquipmentUF + commercialEquipmentUF;

    // 7. Carga Laboral y RRHH
    const directStaffUF = Math.max(0, Number(calc.directEmployees) || 0) * 0.30;
    const outsourcedUF = Math.max(0, Number(calc.outsourcedCompanies) || 0) * 0.40;
    const hrUF = directStaffUF + outsourcedUF;

    // 8. Subtotal Operativo Base antes de factores multiplicadores
    const subtotalOperativeUF = baseUF + subsectorsUF + totalEquipmentUF + hrUF;

    // 9. Multiplicador por Antigüedad
    const ageObj = AGE_FACTORS.find(a => a.id === calc.ageId) || AGE_FACTORS[1];

    // 10. Multiplicador por Tipología Constructiva / Mixta
    const typoObj = CONDO_TYPOLOGIES.find(t => t.id === calc.typology) || CONDO_TYPOLOGIES[0];

    // Cálculo consolidado: Subtotal × Antigüedad × Tipología
    const calculatedMonthlyUF = subtotalOperativeUF * ageObj.multiplier * typoObj.multiplier;

    // 11. Aplicación de Piso Mínimo Técnico
    const isFloorApplied = calculatedMonthlyUF < minFloorUF;
    const finalMonthlyUF = Math.max(minFloorUF, calculatedMonthlyUF);
    const finalMonthlyCLP = Math.round(finalMonthlyUF * ufCLP);

    // Prorrateo promedio por unidad
    const feePerUnitUF = units ? finalMonthlyUF / units : 0;
    const feePerUnitCLP = units ? Math.round(finalMonthlyCLP / units) : 0;

    // Prorrateo referencial desagregado según peso de unidad
    let deptoUnitFeeCLP = feePerUnitCLP;
    let houseUnitFeeCLP = feePerUnitCLP;
    let commUnitFeeCLP = feePerUnitCLP;

    if (calc.typology === 'mixed_commercial' && cCount > 0) {
      // Los locales comerciales suelen tener un ponderador 1.4x por uso intensivo de bienes comunes
      const resUnits = Math.max(0, units - cCount);
      const weightedBase = finalMonthlyCLP / (resUnits + cCount * 1.4);
      commUnitFeeCLP = Math.round(weightedBase * 1.4);
      deptoUnitFeeCLP = Math.round(weightedBase);
      houseUnitFeeCLP = deptoUnitFeeCLP;
    }

    // Recargo de puesta en marcha (primeros 3 meses)
    const initObj = INITIAL_STATES.find(s => s.id === calc.initialStateId) || INITIAL_STATES[0];
    const onboardingMonthlyUF = finalMonthlyUF + initObj.surchargeUF;
    const onboardingMonthlyCLP = Math.round(onboardingMonthlyUF * ufCLP);

    return {
      units,
      dCount,
      hCount,
      cCount,
      breakdownUnits,
      declaredUnits,
      ufCLP,
      minFloorUF,
      activeTier,
      baseUF,
      subsectors,
      subsectorsUF,
      // Equipamiento
      boilerUF,
      elevatorsUF,
      pumpRoomUF,
      generatorUF,
      poolClubUF,
      cctvFenceUF,
      verticalEquipmentUF,
      deepWellUF,
      waterTreatmentUF,
      internalLightingUF,
      doubleGateUF,
      horizontalEquipmentUF,
      commTrafficUF,
      gastroExhaustUF,
      loadingDockUF,
      commercialEquipmentUF,
      totalEquipmentUF,
      // RRHH
      directStaffUF,
      outsourcedUF,
      hrUF,
      // Subtotal & Factores
      subtotalOperativeUF,
      ageObj,
      typoObj,
      calculatedMonthlyUF,
      isFloorApplied,
      finalMonthlyUF,
      finalMonthlyCLP,
      feePerUnitUF,
      feePerUnitCLP,
      deptoUnitFeeCLP,
      houseUnitFeeCLP,
      commUnitFeeCLP,
      initObj,
      onboardingMonthlyUF,
      onboardingMonthlyCLP
    };
  }, [calc]);

  const validationErrors = [
    !communityName && 'Indica el nombre de la comunidad en la postulación.',
    !calc.typology && 'Selecciona la tipología de la comunidad.',
    !calc.ageId && 'Selecciona la antigüedad de la comunidad.',
    (!Number.isInteger(result.units) || result.units <= 0) && 'Indica una cantidad de unidades mayor que cero.',
    calc.declaredUnits !== '' && (!Number.isInteger(Number(calc.declaredUnits)) || Number(calc.declaredUnits) <= 0) && 'El total informado debe ser un número entero mayor que cero.',
    (!Number.isInteger(Number(calc.subsectorsCount)) || Number(calc.subsectorsCount) < 1) && 'Indica al menos un sector.',
    (!Number.isFinite(Number(calc.minFloorUF)) || Number(calc.minFloorUF) < 1) && 'Indica un piso de honorarios de al menos 1 UF.',
    [calc.deptosCount, calc.housesCount, calc.commercialCount, calc.subsectorsCount, calc.elevatorsCount, calc.directEmployees, calc.outsourcedCompanies].some(value => value !== '' && (!Number.isInteger(Number(value)) || Number(value) < 0)) && 'Las cantidades deben ser números enteros no negativos.',
    result.breakdownUnits > 0 && result.declaredUnits > 0 && result.breakdownUnits !== result.declaredUnits && 'El desglose de unidades no coincide con el total informado.',
    (calc.typology === 'depto_only' && (result.hCount > 0 || result.cCount > 0) || calc.typology === 'house_only' && (result.dCount > 0 || result.cCount > 0) || calc.typology === 'mixed_residential' && result.cCount > 0) && 'La tipología elegida no coincide con el desglose de unidades.',
    (!Number.isFinite(Number(calc.ufValueCLP)) || Number(calc.ufValueCLP) <= 0) && 'Ingresa un valor de UF válido.',
    !calc.ufDate && 'Indica la fecha del valor de la UF.'
  ].filter(Boolean);
  const equipmentDetails = [
    result.elevatorsUF > 0 && `${calc.elevatorsCount} ascensor(es)`, calc.hasBoiler && `${calc.boilersCount} caldera(s)`,
    calc.hasPumpRoom && 'sala de bombas', calc.hasGenerator && 'generador', calc.hasPoolClubhouse && 'piscina / espacios comunes',
    calc.hasCctvFence && 'seguridad y accesos', calc.hasDeepWell && 'pozo profundo', calc.hasWaterTreatmentPlant && 'planta de tratamiento',
    calc.hasInternalStreetLighting && 'calles y alumbrado', calc.hasDoubleAccessGate && 'doble acceso',
    calc.hasCommercialTraffic && 'flujo comercial', calc.hasGastronomyExhaust && 'extracción gastronómica', calc.hasCommercialLoadingDock && 'zona de carga'
  ].filter(Boolean);
  const ensureValid = () => {
    if (!validationErrors.length) return true;
    if (showAlert) showAlert('Completa los datos del estudio', validationErrors.join(' '), 'error');
    else setSaveStatus(validationErrors.join(' '));
    return false;
  };

  const handleApplyToProposal = () => {
    if (!ensureValid()) return;
    saveCalc();
    if (setProposalConfig) {
      setProposalConfig(prev => ({
        ...prev,
        targetCondo: calc.condoName || prev.targetCondo,
        targetUnits: String(result.units),
        proposedMonthlyFee: String(result.finalMonthlyCLP),
        unknownDetails: false
      }));
    }
    if (onApplyToDossier) {
      onApplyToDossier({
        condoName: calc.condoName,
        units: result.units,
        monthlyFeeCLP: result.finalMonthlyCLP,
        monthlyFeeUF: result.finalMonthlyUF
      });
    }
    if (showAlert) {
      showAlert(
        '✓ Honorario Aplicado a la Propuesta (Paso 3)',
        `Se transfirió el honorario mensual base de ${result.finalMonthlyUF.toFixed(2)} UF (${formatCLP(result.finalMonthlyCLP)} / mes). ${result.initObj.surchargeUF > 0 ? 'El recargo temporal de puesta en marcha no se transfirió; debes acordarlo por separado.' : ''}`,
        'success'
      );
    }
  };

  const handlePrintFeeSheet = () => {
    if (!ensureValid()) return;
    const cleanName = (calc.condoName || 'Comunidad').replace(/[^a-zA-Z0-9]/g, '_');
    printDocumentDirectly('printable-aranpro-fee-sheet', `ARANPRO_Estudio_Honorarios_Pericial_${cleanName}`, {
      pageSize: 'letter portrait',
      fitPage: false,
      margin: '0',
      extraStyles: `${canonicalPdfHeaderStyles}
        @page { size: letter portrait; margin: 0 !important; }
        .dossier-page { height: 279.4mm !important; min-height: 279.4mm !important; max-height: 279.4mm !important; padding: 8mm 16mm 8mm 17mm !important; border-left: 3.3mm solid #0F3D2E !important; background-image: linear-gradient(#D4B895, #D4B895) !important; background-size: 1.2mm 100% !important; background-position: 0.5mm 0 !important; background-repeat: no-repeat !important; }
        .dossier-page > div[aria-hidden="true"], .aranpro-print-watermark { display: none !important; }
        .transition-header img[src*="ARANPRO_logo_horizontal"] { width: 37mm !important; max-width: 37mm !important; height: auto !important; max-height: 11mm !important; object-fit: contain !important; }
        .proposal-page-footer { gap: 8px !important; font-size: 8px !important; white-space: nowrap !important; }
        .transition-final-footer { gap: 8px !important; }
        .transition-final-footer .transition-footer-details { gap: 8px !important; flex: 1 1 auto; min-width: 0; }
        .transition-final-footer .transition-footer-seal { flex: 0 0 auto; gap: 6px !important; }
        .transition-final-footer .transition-footer-seal > div { white-space: nowrap; }
        .transition-final-footer .transition-footer-seal > div > div:first-child { font-size: 8px !important; letter-spacing: 0 !important; }
        .transition-final-footer .transition-footer-seal > div > div:last-child { font-size: 7.5px !important; }
        .transition-final-footer .transition-footer-contact { flex: 0 0 auto; white-space: nowrap; font-size: 8px !important; padding-left: 8px !important; }
        .transition-final-footer .transition-footer-signature { flex: 0 0 210px; min-width: 0 !important; }`
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* CABECERA EXPLICATIVA DEL MODELO ARANPRO */}
      <div
        className="p-5 rounded-3xl bg-gradient-to-r from-[#0F3D2E] via-[#144D3A] to-[#0A291F] text-white flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-md border border-[#D4B895]/30"
        style={{ backgroundColor: '#0F3D2E' }}
      >
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#D4B895] text-[#0F3D2E] font-black text-[10px] uppercase tracking-wider">
              Modelo Pericial ARANPRO • Ley N° 21.442
            </span>
            <span className="text-[11px] text-emerald-200 font-mono">
              Tasación por Complejidad Constructiva, Funcional & Mixta
            </span>
          </div>
          <h4 className="text-base md:text-lg font-black text-white">
            Calculadora Profesional de Honorarios por Complejidad Operativa
          </h4>
          <p className="text-xs text-emerald-100/90 max-w-3xl leading-relaxed">
            Estima el honorario según los antecedentes ingresados y los criterios comerciales de ARANPRO. Revisa el reglamento de copropiedad cuando existan sectores con gastos diferenciados.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleApplyToProposal}
            className="px-4 py-2.5 rounded-xl bg-[#D4B895] hover:bg-[#c3a57e] text-[#0F3D2E] font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-[#0F3D2E]" />
            Usar este Honorario en Propuesta (Paso 3)
          </button>
          <button
            type="button"
            onClick={handlePrintFeeSheet}
            className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#D4B895]" />
            Imprimir Ficha Técnica (PDF)
          </button>
        </div>
      </div>

      <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50 text-xs text-slate-800 space-y-2">
        <p><strong>Comunidad:</strong> {communityName || 'Por indicar en la postulación'}. Los equipos no marcados no se consideran en el cálculo; revisa la tipología, antigüedad y dotación antes de usar el resultado.</p>
        <div className="flex flex-wrap items-center gap-3"><button type="button" onClick={saveCalc} className="px-3 py-2 rounded-lg bg-[#0F3D2E] text-white font-bold">Guardar estudio de esta comunidad</button><span>Guardado local en este navegador; no se sincroniza entre dispositivos.</span></div>
        {saveStatus && <p role="status">{saveStatus}</p>}
        {validationErrors.length > 0 && <p className="text-amber-900"><strong>Antes de imprimir o aplicar:</strong> {validationErrors.join(' ')}</p>}
      </div>
      {/* FÓRMULA MATEMÁTICA VISUAL ARANPRO */}
      <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/90 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="p-2 rounded-xl bg-[#0F3D2E] text-[#D4B895] shrink-0 mt-0.5">
            <Calculator className="w-4 h-4" />
          </div>
          <div className="text-xs space-y-0.5">
            <span className="font-black text-slate-900 uppercase text-[10.5px] block">
              Fórmula Pericial ARANPRO (Complejidad Multidimensional & Ley N° 21.442):
            </span>
            <p className="font-mono text-[11px] font-bold text-[#0F3D2E]">
              Honorario = máx( Piso {result.minFloorUF} UF , [ Tarifa Base + Sectores + Equipamiento + RRHH ] × Factor Antigüedad × Factor Tipología )
            </p>
          </div>
        </div>
        <div className="text-right font-mono text-xs bg-white px-3 py-2 rounded-xl border border-amber-200 shrink-0">
          <span className="text-[10px] text-slate-400 block uppercase font-sans font-bold">Resultado Actual</span>
          <strong className="text-sm font-black text-[#0F3D2E]">
            {result.finalMonthlyUF.toFixed(2)} UF ({formatCLP(result.finalMonthlyCLP)})
          </strong>
        </div>
      </div>

      {/* GRID PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUMNA IZQUIERDA: CONTROLES */}
        <div className="lg:col-span-7 space-y-5">
          {/* BLOQUE 0: SELECTOR DE TIPOLOGÍA CONSTRUCTIVA & FUNCIONAL */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#0F3D2E]" />
                <h5 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  0. Tipología Arquitectónica & Funcional de la Copropiedad
                </h5>
              </div>
              <span className="text-xs font-bold text-[#0F3D2E]">
                Factor {result.typoObj.multiplier.toFixed(2)}x ({result.typoObj.badge})
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {CONDO_TYPOLOGIES.map((typ) => {
                const isSel = calc.typology === typ.id;
                return (
                  <button
                    key={typ.id}
                    type="button"
                    onClick={() => setCalc({ ...calc, typology: typ.id })}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSel
                        ? 'bg-[#0F3D2E] text-white border-[#0F3D2E] shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="font-black text-xs leading-tight">{typ.label}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isSel ? 'bg-[#D4B895] text-[#0F3D2E]' : 'bg-white text-slate-700 border border-slate-200'
                      }`}>
                        {typ.badge}
                      </span>
                    </div>
                    <div className={`text-[10.5px] font-bold mt-1 ${isSel ? 'text-[#D4B895]' : 'text-slate-800'}`}>
                      {typ.sub}
                    </div>
                    <p className={`text-[9.5px] mt-0.5 leading-snug ${isSel ? 'text-emerald-100/90' : 'text-slate-500'}`}>
                      {typ.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* BLOQUE 1: DESGLOSE DE UNIDADES Y SUBSECTORES (ART. 6° LEY 21.442) */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#0F3D2E]" />
                <h5 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  1. Unidades y sectores de la comunidad
                </h5>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#0F3D2E] border border-emerald-200">
                Total: {result.units} u. ({result.activeTier.rateUF.toFixed(2)} UF/u)
              </span>
            </div>

            <label className="block text-xs font-bold text-slate-700">Total de unidades informado
              <input type="number" min="1" step="1" value={calc.declaredUnits} onChange={e => setCalc({ ...calc, declaredUnits: e.target.value, unitSource: 'total' })} className="block mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
              <span className="font-normal text-slate-500">El cálculo usa el último dato editado: total o desglose. Si ingresas ambos, deben coincidir antes de imprimir o aplicar.</span>
            </label>
            {/* Desglose de Unidades según Tipología */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Departamentos */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <label className="block text-[10px] font-bold text-slate-600 uppercase">
                  Departamentos
                </label>
                <input
                  type="number"
                  min="0"
                  max="2000"
                  value={calc.deptosCount}
                  onChange={(e) => setCalc({ ...calc, deptosCount: e.target.value, unitSource: 'breakdown' })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-center font-black text-xs text-[#0F3D2E]"
                />
                <span className="text-[9px] text-slate-400 block text-center">Torres / Altura</span>
              </div>

              {/* Casas */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <label className="block text-[10px] font-bold text-slate-600 uppercase">
                  Casas
                </label>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={calc.housesCount}
                  onChange={(e) => setCalc({ ...calc, housesCount: e.target.value, unitSource: 'breakdown' })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-center font-black text-xs text-[#0F3D2E]"
                />
                <span className="text-[9px] text-slate-400 block text-center">Extensión</span>
              </div>

              {/* Locales Comerciales */}
              <div className={`p-3 border rounded-2xl space-y-1 ${
                calc.typology === 'mixed_commercial' ? 'bg-amber-50/70 border-amber-300' : 'bg-slate-50 border-slate-200'
              }`}>
                <label className="block text-[10px] font-bold text-slate-600 uppercase">
                  Locales / Oficinas
                </label>
                <input
                  type="number"
                  min="0"
                  max="200"
                  value={calc.commercialCount}
                  onChange={(e) => setCalc({ ...calc, commercialCount: e.target.value, unitSource: 'breakdown' })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-center font-black text-xs text-[#0F3D2E]"
                />
                <span className="text-[9px] text-slate-400 block text-center">Comercio / Strip</span>
              </div>

              {/* Sectores Contables Art. 6° */}
              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-1">
                <label className="block text-[10px] font-bold text-[#0F3D2E] uppercase">
                  Sectores a evaluar
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={calc.subsectorsCount}
                  onChange={(e) => setCalc({ ...calc, subsectorsCount: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-xl text-center font-black text-xs text-[#0F3D2E]"
                />
                <span className="text-[9px] text-emerald-800 font-bold block text-center">
                  {result.subsectorsUF > 0 ? `+${result.subsectorsUF.toFixed(1)} UF` : 'Prorrateo único'}
                </span>
              </div>
            </div>

            {/* Explicación Legal Art. 6° Ley 21.442 */}
            {result.subsectors > 1 && (
              <div className="p-2.5 rounded-xl bg-emerald-50/90 border border-emerald-200 text-[10.5px] text-emerald-950 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#0F3D2E] shrink-0 mt-0.5" />
                <p className="leading-snug">
                  Se consideran <strong>{result.subsectors} sectores</strong> para estimar la carga administrativa. La distribución de gastos depende de los antecedentes y del reglamento aplicable. Ponderación del modelo: <strong>+{result.subsectorsUF.toFixed(1)} UF/mes</strong>.
                </p>
              </div>
            )}

            {/* Parámetros Económicos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-600 uppercase">
                  Piso Mínimo Técnico de Honorario (UF)
                </label>
                <input
                  type="number"
                  min="5"
                  max="50"
                  step="0.5"
                  value={calc.minFloorUF}
                  onChange={(e) => setCalc({ ...calc, minFloorUF: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-600 uppercase">
                  Valor UF Referencial (CLP)
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={calc.ufValueCLP}
                  onChange={(e) => setCalc({ ...calc, ufValueCLP: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800"
                />
                <label className="block text-[10px] font-bold text-slate-600 mt-2">Fecha del valor UF<input type="date" value={calc.ufDate} onChange={e => setCalc({ ...calc, ufDate: e.target.value })} className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" /></label>
                <span className="text-[10px] text-slate-500">Ingreso manual: verifica el valor para la fecha indicada en el <a className="underline text-emerald-800" href={`https://www.sii.cl/valores_y_fechas/uf/uf${(calc.ufDate || String(new Date().getFullYear())).slice(0, 4)}.htm`} target="_blank" rel="noreferrer">SII</a>.</span>
                {calc.ufDate && calc.ufDate !== new Date().toLocaleDateString('en-CA') && <span className="block text-[10px] font-bold text-amber-700">La fecha indicada no es la de hoy; confirma que corresponde a tu propuesta.</span>}
              </div>
            </div>
          </div>

          {/* BLOQUE 2: EQUIPAMIENTO VERTICAL (TORRES) */}
          {(
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#0F3D2E]" />
                  <h5 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    2. Equipamiento e Instalaciones Verticales (Torres)
                  </h5>
                </div>
                <span className="text-xs font-black text-[#0F3D2E]">
                  +{result.verticalEquipmentUF.toFixed(2)} UF
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Ascensores */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-900 block">Ascensores Certificados Minvu</span>
                    <span className="text-[10px] text-slate-500">+0.5 UF c/u (fiscalización bitácoras)</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={calc.elevatorsCount}
                    onChange={(e) => setCalc({ ...calc, elevatorsCount: e.target.value })}
                    className="w-16 px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-center font-black text-xs text-[#0F3D2E]"
                  />
                </div>

                {/* Caldera */}
                <label className={`p-3 rounded-2xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                  calc.hasBoiler ? 'bg-emerald-50/70 border-emerald-300' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={calc.hasBoiler}
                      onChange={(e) => setCalc({ ...calc, hasBoiler: e.target.checked })}
                      className="w-4 h-4 rounded text-[#0F3D2E]"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block">Caldera Comunitaria</span>
                      <span className="text-[10px] text-slate-500">Agua caliente y calefacción (+1.5 UF)</span>
                    </div>
                  </div>
                  <Flame className="w-4 h-4 text-amber-600 shrink-0" />
                </label>

                {/* Sala de bombas */}
                <label className={`p-3 rounded-2xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                  calc.hasPumpRoom ? 'bg-emerald-50/70 border-emerald-300' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={calc.hasPumpRoom}
                      onChange={(e) => setCalc({ ...calc, hasPumpRoom: e.target.checked })}
                      className="w-4 h-4 rounded text-[#0F3D2E]"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block">Sala de Bombas & Estanques</span>
                      <span className="text-[10px] text-slate-500">Hidroneumático y presurización (+1.0 UF)</span>
                    </div>
                  </div>
                  <Droplets className="w-4 h-4 text-blue-600 shrink-0" />
                </label>

                {/* Grupo electrógeno */}
                <label className={`p-3 rounded-2xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                  calc.hasGenerator ? 'bg-emerald-50/70 border-emerald-300' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={calc.hasGenerator}
                      onChange={(e) => setCalc({ ...calc, hasGenerator: e.target.checked })}
                      className="w-4 h-4 rounded text-[#0F3D2E]"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block">Generador de Respaldo</span>
                      <span className="text-[10px] text-slate-500">Grupo electrógeno autónomo (+0.5 UF)</span>
                    </div>
                  </div>
                  <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                </label>
                {[['hasPoolClubhouse', 'Piscina y espacios comunes', '+1,0 UF'], ['hasCctvFence', 'Seguridad y accesos', '+0,5 UF']].map(([key, label, price]) => (
                  <label key={key} className="p-3 rounded-2xl border bg-slate-50 border-slate-200 flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={calc[key]} onChange={e => setCalc({ ...calc, [key]: e.target.checked })} className="w-4 h-4" />
                    <span><strong className="block">{label}</strong><span className="text-[10px] text-slate-500">{price}</span></span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* BLOQUE 3: EQUIPAMIENTO DE EXTENSIÓN (CASAS) */}
          {(
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-[#0F3D2E]" />
                  <h5 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    3. Equipamiento Específico de Extensión (Casas / Horizontal)
                  </h5>
                </div>
                <span className="text-xs font-black text-[#0F3D2E]">
                  +{result.horizontalEquipmentUF.toFixed(2)} UF
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Pozo Profundo */}
                <label className={`p-3 rounded-2xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                  calc.hasDeepWell ? 'bg-emerald-50/70 border-emerald-300' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={calc.hasDeepWell}
                      onChange={(e) => setCalc({ ...calc, hasDeepWell: e.target.checked })}
                      className="w-4 h-4 rounded text-[#0F3D2E]"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block">Pozo Profundo / Regadío</span>
                      <span className="text-[10px] text-slate-500">Bomba sumergible y cloración (+1.5 UF)</span>
                    </div>
                  </div>
                  <Droplets className="w-4 h-4 text-cyan-600 shrink-0" />
                </label>

                {/* Planta de Tratamiento */}
                <label className={`p-3 rounded-2xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                  calc.hasWaterTreatmentPlant ? 'bg-emerald-50/70 border-emerald-300' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={calc.hasWaterTreatmentPlant}
                      onChange={(e) => setCalc({ ...calc, hasWaterTreatmentPlant: e.target.checked })}
                      className="w-4 h-4 rounded text-[#0F3D2E]"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block">Planta de Tratamiento (PTAS)</span>
                      <span className="text-[10px] text-slate-500">Aguas servidas o fosa séptica (+2.0 UF)</span>
                    </div>
                  </div>
                  <HardHat className="w-4 h-4 text-emerald-700 shrink-0" />
                </label>

                {/* Calles interiores y alumbrado */}
                <label className={`p-3 rounded-2xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                  calc.hasInternalStreetLighting ? 'bg-emerald-50/70 border-emerald-300' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={calc.hasInternalStreetLighting}
                      onChange={(e) => setCalc({ ...calc, hasInternalStreetLighting: e.target.checked })}
                      className="w-4 h-4 rounded text-[#0F3D2E]"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block">Alumbrado & Calles Propias</span>
                      <span className="text-[10px] text-slate-500">Postación solar / iluminación vial (+0.8 UF)</span>
                    </div>
                  </div>
                  <Zap className="w-4 h-4 text-yellow-500 shrink-0" />
                </label>

                {/* Doble acceso controlado */}
                <label className={`p-3 rounded-2xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                  calc.hasDoubleAccessGate ? 'bg-emerald-50/70 border-emerald-300' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={calc.hasDoubleAccessGate}
                      onChange={(e) => setCalc({ ...calc, hasDoubleAccessGate: e.target.checked })}
                      className="w-4 h-4 rounded text-[#0F3D2E]"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block">Doble Acceso con TAG</span>
                      <span className="text-[10px] text-slate-500">Portería principal + servicio (+1.0 UF)</span>
                    </div>
                  </div>
                  <ShieldCheck className="w-4 h-4 text-[#0F3D2E] shrink-0" />
                </label>
              </div>
            </div>
          )}

          {/* BLOQUE 4: COMPLEJIDAD COMERCIAL (LOCALES / STRIP CENTER) */}
          {(
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-amber-700" />
                  <h5 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    4. Complejidad Comercial & Fricción de Convivencia
                  </h5>
                </div>
                <span className="text-xs font-black text-amber-700">
                  +{result.commercialEquipmentUF.toFixed(2)} UF
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Tráfico masivo de clientes */}
                <label className={`p-3 rounded-2xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                  calc.hasCommercialTraffic ? 'bg-amber-50/80 border-amber-300' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={calc.hasCommercialTraffic}
                      onChange={(e) => setCalc({ ...calc, hasCommercialTraffic: e.target.checked })}
                      className="w-4 h-4 rounded text-[#0F3D2E]"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block">Atención Masiva de Público</span>
                      <span className="text-[10px] text-slate-500">Rotación de autos y clientes (+1.5 UF)</span>
                    </div>
                  </div>
                  <Users className="w-4 h-4 text-amber-600 shrink-0" />
                </label>

                {/* Ductos gastronómicos / SEREMI */}
                <label className={`p-3 rounded-2xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                  calc.hasGastronomyExhaust ? 'bg-amber-50/80 border-amber-300' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={calc.hasGastronomyExhaust}
                      onChange={(e) => setCalc({ ...calc, hasGastronomyExhaust: e.target.checked })}
                      className="w-4 h-4 rounded text-[#0F3D2E]"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block">Ductos Gastronómicos / SEREMI</span>
                      <span className="text-[10px] text-slate-500">Campanas, olores y patentes (+1.0 UF)</span>
                    </div>
                  </div>
                  <Flame className="w-4 h-4 text-orange-600 shrink-0" />
                </label>

                {/* Zona de carga y descarga */}
                <label className={`p-3 rounded-2xl border flex items-center justify-between gap-2 cursor-pointer transition-all sm:col-span-2 ${
                  calc.hasCommercialLoadingDock ? 'bg-amber-50/80 border-amber-300' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={calc.hasCommercialLoadingDock}
                      onChange={(e) => setCalc({ ...calc, hasCommercialLoadingDock: e.target.checked })}
                      className="w-4 h-4 rounded text-[#0F3D2E]"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block">Zona de Carga / Descarga de Proveedores</span>
                      <span className="text-[10px] text-slate-500">Supervisión de camiones, horarios y retiro de basura comercial (+0.8 UF)</span>
                    </div>
                  </div>
                  <Truck className="w-4 h-4 text-slate-700 shrink-0" />
                </label>
              </div>
            </div>
          )}

          {/* BLOQUE 5: DOTACIÓN DE RRHH */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#0F3D2E]" />
                <h5 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  5. Dotación de Personal Propio & Empresas Subcontratadas
                </h5>
              </div>
              <span className="text-xs font-black text-[#0F3D2E]">
                +{result.hrUF.toFixed(2)} UF
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Empleados en Nómina Directa</span>
                  <span className="font-mono font-bold text-[#0F3D2E]">+0.30 UF c/u</span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Conserjes, mayordomo y auxiliares con turnos 40h, Previred y DT.
                </p>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={calc.directEmployees}
                  onChange={(e) => setCalc({ ...calc, directEmployees: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-black text-xs text-[#0F3D2E]"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Empresas Subcontratadas</span>
                  <span className="font-mono font-bold text-slate-600">+0.40 UF c/u</span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Seguridad o aseo externo (fiscalización mensual F30-1 y responsabilidad solidaria).
                </p>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={calc.outsourcedCompanies}
                  onChange={(e) => setCalc({ ...calc, outsourcedCompanies: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-black text-xs text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* BLOQUE 6: ANTIGÜEDAD DE LA EDIFICACIÓN & ESTADO INICIAL */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#0F3D2E]" />
                <h5 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  6. Antigüedad de Instalaciones & Normalización de Traspaso
                </h5>
              </div>
              <span className="text-xs font-black text-[#0F3D2E]">
                Factor {result.ageObj.multiplier.toFixed(2)}x
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {AGE_FACTORS.map((af) => {
                const isSel = calc.ageId === af.id;
                return (
                  <button
                    key={af.id}
                    type="button"
                    onClick={() => setCalc({ ...calc, ageId: af.id })}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSel
                        ? 'bg-[#0F3D2E] text-white border-[#0F3D2E] shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-black text-xs">{af.label}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isSel ? 'bg-[#D4B895] text-[#0F3D2E]' : 'bg-white text-slate-700 border border-slate-200'
                      }`}>
                        {af.badge}
                      </span>
                    </div>
                    <div className={`text-[10.5px] font-bold mt-1 ${isSel ? 'text-[#D4B895]' : 'text-slate-800'}`}>
                      {af.title}
                    </div>
                    <p className={`text-[9.5px] mt-0.5 leading-snug ${isSel ? 'text-emerald-100/90' : 'text-slate-500'}`}>
                      {af.desc}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Normalización */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <label className="block text-[10px] font-black uppercase text-slate-500">
                Estado Inicial del Condominio (Puesta en Marcha Primeros 3 Meses):
              </label>
              <select
                value={calc.initialStateId}
                onChange={(e) => setCalc({ ...calc, initialStateId: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              >
                {INITIAL_STATES.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.label} {st.surchargeUF > 0 ? `(+${st.surchargeUF} UF/mes primeros 3 meses)` : '(Sin recargo)'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: RESUMEN EJECUTIVO (STICKY) */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-4">
          <div
            className="bg-[#0F3D2E] bg-gradient-to-b from-[#0F3D2E] to-[#0A291F] text-white p-6 rounded-3xl shadow-xl border border-emerald-900/40 space-y-5"
            style={{ backgroundColor: '#0F3D2E' }}
          >
            <div className="flex items-center justify-between border-b border-white/15 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#D4B895] block">
                  Estimación de honorarios ARANPRO
                </span>
                <h5 className="text-base font-black text-white">
                  Desglose de Honorarios Mensuales
                </h5>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-emerald-200 block">{result.typoObj.label.split(' ')[0]} {result.typoObj.sub}</span>
                <span className="text-xs font-bold text-white">{result.units} Unidades Totales</span>
              </div>
            </div>

            {/* MONTO PRINCIPAL */}
            <div className="p-4 rounded-2xl bg-white/10 border border-white/15 text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4B895] block">
                Honorario Mensual Estimado {validationErrors.length > 0 ? '(datos pendientes)' : ''}
              </span>
              <div className="text-3xl font-black text-white tracking-tight">
                {formatCLP(result.finalMonthlyCLP)}
                <span className="text-xs font-normal text-emerald-200"> / mes</span>
              </div>
              <div className="text-sm font-mono font-bold text-[#D4B895]">
                Equivalente a {result.finalMonthlyUF.toFixed(2)} UF mensuales
              </div>
              {(!Number(calc.ufValueCLP) || Number(calc.ufValueCLP) <= 0) && <p className="text-[11px] text-amber-200">Vista preliminar en pesos con UF antigua de $38.450. Ingresa y confirma la UF vigente y su fecha para imprimir o aplicar.</p>}
              {result.isFloorApplied && (
                <div className="mt-2 inline-block px-2.5 py-1 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-200 text-[10px] font-bold">
                  El cálculo antes del mínimo es {result.calculatedMonthlyUF.toFixed(2)} UF ({formatCLP(Math.round(result.calculatedMonthlyUF * result.ufCLP))}). El honorario final permanece en el piso de {result.minFloorUF} UF mientras el cálculo sea menor.
                </div>
              )}
            </div>

            {/* PRORRATEO POR UNIDAD */}
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[10px] uppercase text-emerald-200/80 block font-bold">Costo Promedio (CLP)</span>
                <strong className="text-base font-black text-white">{formatCLP(result.feePerUnitCLP)}</strong>
                <span className="text-[9.5px] text-emerald-200/70 block">por unidad / mes</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[10px] uppercase text-emerald-200/80 block font-bold">Costo Promedio (UF)</span>
                <strong className="text-base font-black text-[#D4B895]">{result.feePerUnitUF.toFixed(3)} UF</strong>
                <span className="text-[9.5px] text-emerald-200/70 block">por unidad / mes</span>
              </div>
            </div>

            {/* En Condominios Mixtos Comerciales mostrar el desglose diferenciado */}
            {calc.typology === 'mixed_commercial' && result.cCount > 0 && (
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs space-y-1">
                <span className="text-[10px] font-bold text-[#D4B895] uppercase block">
                  Prorrateo Ponderado por Tipo de Unidad:
                </span>
                <div className="flex items-center justify-between text-emerald-100 text-[11px]">
                  <span>Viviendas / Deptos ({result.units - result.cCount} u.):</span>
                  <strong className="text-white">{formatCLP(result.deptoUnitFeeCLP)} / mes</strong>
                </div>
                <div className="flex items-center justify-between text-amber-200 text-[11px]">
                  <span>Locales Comerciales ({result.cCount} u. • 1.4x uso):</span>
                  <strong className="text-amber-300">{formatCLP(result.commUnitFeeCLP)} / mes</strong>
                </div>
              </div>
            )}

            {/* TABLA PASO A PASO DE LA FÓRMULA PERICIAL */}
            <div className="space-y-1.5 text-xs border-t border-white/15 pt-3">
              <div className="flex items-center justify-between text-emerald-100">
                <span>1. Tarifa Base ({result.units} u. • {result.activeTier.rateUF} UF/u):</span>
                <span className="font-mono font-bold">{result.baseUF.toFixed(2)} UF</span>
              </div>

              {result.subsectorsUF > 0 && (
                <div className="flex items-center justify-between text-emerald-100">
                  <span>2. Sectores evaluados ({result.subsectors}):</span>
                  <span className="font-mono font-bold">+{result.subsectorsUF.toFixed(2)} UF</span>
                </div>
              )}

              <div className="flex items-center justify-between text-emerald-100">
                <span>3. Equipamiento Crítico Fiscalizado:</span>
                <span className="font-mono font-bold">+{result.totalEquipmentUF.toFixed(2)} UF</span>
              </div>

              <div className="flex items-center justify-between text-emerald-100">
                <span>4. Carga Laboral RRHH ({calc.directEmployees} dir. / {calc.outsourcedCompanies} ext.):</span>
                <span className="font-mono font-bold">+{result.hrUF.toFixed(2)} UF</span>
              </div>

              <div className="flex items-center justify-between text-white font-bold border-t border-white/10 pt-1.5">
                <span>Subtotal Operativo Base:</span>
                <span className="font-mono">{result.subtotalOperativeUF.toFixed(2)} UF</span>
              </div>

              <div className="flex items-center justify-between text-emerald-200">
                <span>Factor Antigüedad ({result.ageObj.multiplier.toFixed(2)}x):</span>
                <span className="font-mono">{(result.subtotalOperativeUF * result.ageObj.multiplier).toFixed(2)} UF</span>
              </div>

              <div className="flex items-center justify-between text-[#D4B895] font-bold">
                <span>Factor Tipología Mixta ({result.typoObj.multiplier.toFixed(2)}x):</span>
                <span className="font-mono">{result.calculatedMonthlyUF.toFixed(2)} UF</span>
              </div>

              <div className="flex items-center justify-between text-white font-black text-sm border-t border-white/20 pt-2">
                <span>Honorario Final (Piso {result.minFloorUF} UF):</span>
                <span className="font-mono text-[#D4B895]">{result.finalMonthlyUF.toFixed(2)} UF</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/10 text-xs space-y-1">
              <strong>Resultado para la propuesta: {formatCLP(result.finalMonthlyCLP)} / mes</strong>
              <p>El promedio por unidad es solo referencial; la distribución real depende del reglamento.</p>
              {result.initObj.surchargeUF > 0 && <p>Puesta en marcha: +{result.initObj.surchargeUF.toFixed(2)} UF/mes durante 3 meses; total temporal {result.onboardingMonthlyUF.toFixed(2)} UF ({formatCLP(result.onboardingMonthlyCLP)})/mes. Este recargo no se transfiere con el botón y debe acordarse por separado.</p>}
              {validationErrors.length > 0 && <p>Completa y revisa los datos señalados antes de usar este resultado preliminar.</p>}
            </div>

            {/* BOTONES DE ACCIÓN */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleApplyToProposal}
                className="w-full py-3 px-4 rounded-2xl bg-[#D4B895] hover:bg-[#c5a77e] text-[#0F3D2E] font-black text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                Aplicar honorario base {formatCLP(result.finalMonthlyCLP)} a la Propuesta (Paso 3)
              </button>

              <div className="pt-1">
                <AranproPdfStyleSelector value={pdfStyle} onChange={setPdfStyle} compact label="Plantilla PDF:" />
              </div>

              <button
                type="button"
                onClick={handlePrintFeeSheet}
                className="w-full py-2.5 px-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Printer className="w-4 h-4 text-[#D4B895]" />
                Imprimir Estudio Técnico de Honorarios
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PLANTILLA IMPRIMIBLE LISTA EN DOM (1 PÁGINA CARTA OFICIAL ARANPRO) */}
      <div className="hidden">
        <div
          id="printable-aranpro-fee-sheet"
          data-pdf-style={pdfStyle}
          className="dossier-page page-1 bg-white p-6 md:p-7 pl-9 md:pl-11 min-h-[850px] flex flex-col justify-between max-w-[850px] mx-auto text-slate-900 text-xs shadow-md leading-relaxed"
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          {/* SECCIÓN SUPERIOR */}
          <div className="space-y-2.5">
            <CanonicalPdfHeader badge="ESTUDIO DE HONORARIOS" description="Memoria técnica pericial" page={1} community={calc.condoName || 'Comunidad en evaluación'} brandName={empresaForm?.provisionalName || 'ARANPRO • GESTIÓN INTEGRAL'} email={empresaForm?.email || 'contacto@aranpro.cl'} phone={empresaForm?.phone || '+56 9 5811 8504'} city={empresaForm?.city || 'La Serena, Chile'} />
            <p className="text-[9px] text-slate-500 text-right">{result.units} unidades • UF de referencia: ${result.ufCLP.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} al {calc.ufDate.split('-').reverse().join('-')} • Emisión: {new Date().toLocaleDateString('es-CL')}</p>

            <p className="text-[10.5px] text-slate-700 leading-snug">Esta memoria presenta una estimación mensual de honorarios para la administración de la comunidad, considerando los antecedentes y características operativas registrados. Su finalidad es facilitar la revisión de la propuesta y explicar los criterios utilizados en el cálculo.</p>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
              <div className="font-black text-[#0F3D2E] uppercase text-[10.5px]">
                1. Antecedentes y criterios de evaluación
              </div>
              <p className="text-slate-600 text-[10.5px] leading-snug">
                El modelo considera la tipología <strong>{result.typoObj.label}</strong>, {result.breakdownUnits ? `el desglose de ${[result.dCount > 0 && `${result.dCount} departamentos`, result.hCount > 0 && `${result.hCount} casas`, result.cCount > 0 && `${result.cCount} locales`].filter(Boolean).join(', ')}` : `${result.units} unidades sin desglose informado`}, {result.subsectors} sector(es), las instalaciones declaradas y la dotación informada. Las ponderaciones y tarifas son criterios del modelo ARANPRO; la distribución de gastos debe revisarse según el reglamento de la comunidad.
              </p>
              <div className="p-1.5 bg-white rounded-lg border border-slate-200 font-mono text-[10px] text-[#0F3D2E] font-bold text-center">
                Honorario = máx( piso {result.minFloorUF} UF, [base + sectores + equipamiento + RRHH] × antigüedad ({result.ageObj.multiplier.toFixed(2)}) × tipología ({result.typoObj.multiplier.toFixed(2)}) )
              </div>
            </div>

            <table className="w-full text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-[#0F3D2E] text-white">
                <tr>
                  <th className="text-left p-2">Componente Evaluado</th>
                  <th className="text-left p-2">Parámetro Específico</th>
                  <th className="text-right p-2">Ponderación (UF)</th>
                  <th className="text-right p-2">Equivalente (CLP)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-[11px]">
                <tr>
                  <td className="p-2 font-bold">1. Base por Unidades</td>
                  <td className="p-2 text-slate-600">{result.units} unidades totales ({result.activeTier.label} • {result.activeTier.rateUF} UF/u)</td>
                  <td className="p-2 text-right font-mono font-bold">{result.baseUF.toFixed(2)} UF</td>
                  <td className="p-2 text-right font-mono">{formatCLP(Math.round(result.baseUF * result.ufCLP))}</td>
                </tr>

                  <tr>
                    <td className="p-2 font-bold">2. Sectores evaluados</td>
                    <td className="p-2 text-slate-600">{result.subsectors} sectores considerados en el modelo</td>
                    <td className="p-2 text-right font-mono font-bold">+{result.subsectorsUF.toFixed(2)} UF</td>
                    <td className="p-2 text-right font-mono">{formatCLP(Math.round(result.subsectorsUF * result.ufCLP))}</td>
                  </tr>

                <tr>
                  <td className="p-2 font-bold">3. Equipamiento Crítico</td>
                  <td className="p-2 text-slate-600">
                    {equipmentDetails.join(', ') || 'Sin equipamiento adicional informado'}
                  </td>
                  <td className="p-2 text-right font-mono font-bold">+{result.totalEquipmentUF.toFixed(2)} UF</td>
                  <td className="p-2 text-right font-mono">{formatCLP(Math.round(result.totalEquipmentUF * result.ufCLP))}</td>
                </tr>

                <tr>
                  <td className="p-2 font-bold">4. Carga Laboral RRHH</td>
                  <td className="p-2 text-slate-600">
                    {calc.directEmployees} trabajador(es) directo(s) / {calc.outsourcedCompanies} empresa(s) subcontratada(s)
                  </td>
                  <td className="p-2 text-right font-mono font-bold">+{result.hrUF.toFixed(2)} UF</td>
                  <td className="p-2 text-right font-mono">{formatCLP(Math.round(result.hrUF * result.ufCLP))}</td>
                </tr>

                <tr className="bg-slate-50">
                  <td className="p-2 font-bold">5. Factores Antigüedad & Mixto</td>
                  <td className="p-2 text-slate-600">Antigüedad: {result.ageObj.multiplier.toFixed(2)}x • Tipología {result.typoObj.label}: {result.typoObj.multiplier.toFixed(2)}x</td>
                  <td className="p-2 text-right font-mono font-bold">× {(result.ageObj.multiplier * result.typoObj.multiplier).toFixed(2)}</td>
                  <td className="p-2 text-right font-mono">{formatCLP(Math.round(result.calculatedMonthlyUF * result.ufCLP))}</td>
                </tr>

                <tr className="bg-emerald-50 font-black text-[#0F3D2E]">
                  <td className="p-2.5">HONORARIO MENSUAL FINAL</td>
                  <td className="p-2.5">
                    Prorrateo estimado: {formatCLP(result.feePerUnitCLP)} / unidad ({result.feePerUnitUF.toFixed(3)} UF)
                  </td>
                  <td className="p-2.5 text-right font-mono text-xs">{result.finalMonthlyUF.toFixed(2)} UF</td>
                  <td className="p-2.5 text-right font-mono text-xs">{formatCLP(result.finalMonthlyCLP)}</td>
                </tr>
              </tbody>
            </table>
            {result.initObj.surchargeUF > 0 && <p className="text-[10px] text-slate-700"><strong>Puesta en marcha:</strong> recargo estimado de {result.initObj.surchargeUF.toFixed(2)} UF mensuales durante los primeros tres meses; total temporal {result.onboardingMonthlyUF.toFixed(2)} UF ({formatCLP(result.onboardingMonthlyCLP)}) al mes. Se acuerda por separado y no se incluye en el honorario mensual base.</p>}
            <p className="text-[10px] text-slate-700 leading-snug"><strong>Alcance:</strong> esta estimación se basa en los antecedentes informados y podrá ajustarse al definir el servicio y verificar las condiciones de la comunidad. El promedio por unidad es referencial y no reemplaza la distribución de gastos que corresponda. Los valores en UF se muestran redondeados; el equivalente en pesos se calcula con el valor sin redondear.</p>
          </div>

          <div className="mt-auto pt-1.5 space-y-1"><CanonicalPdfFinalSignature companyRut={empresaForm?.companyRut} phone={empresaForm?.phone || '+56 9 5811 8504'} email={empresaForm?.email || 'contacto@aranpro.cl'} website={empresaForm?.website || 'https://aranpro.cl'} signature={signatureImage || companySettings?.signatureDataUrl} signatureScale={signatureScale} adminName={empresaForm?.adminName || 'John Andrés Arancibia Maureira'} adminRut={(empresaForm?.adminRut && empresaForm.adminRut !== '14.882.140-K') ? empresaForm.adminRut : '16.012.871-2'} /><CanonicalPdfPageFooter website={empresaForm?.website || 'https://aranpro.cl'} label="Estudio de honorarios" page={1} totalPages={1} city={empresaForm?.city || 'La Serena, Chile'} /></div>
        </div>
      </div>
    </div>
  );
};
