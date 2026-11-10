import React, { useState, useMemo } from 'react';
import {
  Calculator, Building2, HardHat, Users, Clock, AlertTriangle,
  CheckCircle2, ArrowRight, Printer, Sparkles, DollarSign, Info, RefreshCw
} from 'lucide-react';
import { formatCLP } from '../../../utils/formatters';
import { printDocumentDirectly } from '../../../utils/printDocument';
import { AranproLogo, AranproOfficialSeal, AranproPdfStyleSelector, useAranproPdfStyle } from '../../common/MauranLogo';
import { useCommunity } from '../../../context/CommunityContext';

const UNIT_TIERS = [
  { id: 't1', min: 1, max: 50, rateUF: 0.30, label: '1 a 50 unidades', desc: 'Comunidades pequeñas (0.30 UF / unidad)' },
  { id: 't2', min: 51, max: 120, rateUF: 0.22, label: '51 a 120 unidades', desc: 'Escala media estándar (0.22 UF / unidad)' },
  { id: 't3', min: 121, max: 250, rateUF: 0.18, label: '121 a 250 unidades', desc: 'Escala media-alta (0.18 UF / unidad)' },
  { id: 't4', min: 251, max: 9999, rateUF: 0.14, label: '250+ unidades', desc: 'Gran escala / costo marginal menor (0.14 UF / unidad)' }
];

const AGE_FACTORS = [
  {
    id: 'new',
    label: '< 2 años (0 a 3 años)',
    title: 'Recepción Final & Posventa Inmobiliaria',
    multiplier: 1.10,
    badge: '+10% Complejidad',
    desc: 'Alta carga técnica y legal por cobro de garantías posventa a la inmobiliaria, puesta en marcha de equipos y reglamento inicial.'
  },
  {
    id: 'stable',
    label: '2 a 8 años (3 a 7 años)',
    title: 'Período Operativo Estable',
    multiplier: 1.00,
    badge: '1.00x Neutro',
    desc: 'Instalaciones asentadas con mantenciones preventivas programadas y operación regular.'
  },
  {
    id: 'mid',
    label: '9 a 20 años (8 a 15 años)',
    title: 'Renovaciones Iniciales & Desgaste Medio',
    multiplier: 1.15,
    badge: '+15% Mantención',
    desc: 'Reemplazo de sellos, pintura de fachadas, impermeabilización de cubiertas y modernización de componentes.'
  },
  {
    id: 'old',
    label: '> 20 años (15+ a 25+ años)',
    title: 'Desgaste Severo & Fallas Frecuentes',
    multiplier: 1.25,
    badge: '+25% Alta Exigencia',
    desc: 'Fatiga en matrices verticales, salas de bombas antiguas, tableros fuera de norma SEC y alta supervisión en terreno.'
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
    desc: 'Conciliaciones atrasadas o falta de arqueo del Fondo de Reserva (+2.5 UF/mes durante los primeros 3 meses).'
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
  const [calc, setCalc] = useState({
    condoName: proposalConfig?.targetCondo || 'Condominio en Evaluación',
    units: Number(proposalConfig?.targetUnits) || 64,
    ufValueCLP: 38450,
    minFloorUF: 15,
    calcMethod: 'direct', // 'direct' (tasa del tramo por total de unidades) | 'progressive' (escalonado por tramos)
    ageId: 'stable',
    // Equipamiento e instalaciones críticas
    hasBoiler: false,         // +1.5 UF
    boilersCount: 1,
    elevatorsCount: 2,        // +0.5 UF c/u
    hasPumpRoom: true,        // +1.0 UF (Sala de bombas / generador)
    hasGenerator: false,      // +0.5 UF adicional si tiene grupo electrógeno separado
    hasPoolClubhouse: true,   // +1.0 UF (Piscina / Club house / Quinchos / Gym)
    hasCctvFence: true,       // +0.5 UF (Cerco eléctrico, CCTV y portones)
    // Dotación de RRHH
    directEmployees: 4,       // +0.3 UF por trabajador directo
    outsourcedCompanies: 0,   // +0.4 UF por empresa subcontratada (control F30-1)
    // Estado inicial (puesta en marcha 3 meses)
    initialStateId: 'al_dia'
  });

  const result = useMemo(() => {
    const units = Math.max(1, Number(calc.units) || 1);
    const ufCLP = Math.max(1000, Number(calc.ufValueCLP) || 38450);
    const minFloorUF = Math.max(1, Number(calc.minFloorUF) || 15);

    // 1. Determinar tramo y Tarifa Base en UF
    const activeTier = UNIT_TIERS.find(t => units >= t.min && units <= t.max) || UNIT_TIERS[UNIT_TIERS.length - 1];

    let baseUF = 0;
    if (calc.calcMethod === 'progressive') {
      // Escalonado marginal por tramos
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
      // Directo según el tramo en que cae la comunidad
      baseUF = units * activeTier.rateUF;
    }

    // 2. Complejidad por Equipamiento e Instalaciones Críticas (UF)
    const boilerUF = calc.hasBoiler ? 1.5 * Math.max(1, Number(calc.boilersCount) || 1) : 0;
    const elevatorsUF = Math.max(0, Number(calc.elevatorsCount) || 0) * 0.5;
    const pumpRoomUF = calc.hasPumpRoom ? 1.0 : 0;
    const generatorUF = calc.hasGenerator ? 0.5 : 0;
    const poolClubUF = calc.hasPoolClubhouse ? 1.0 : 0;
    const cctvFenceUF = calc.hasCctvFence ? 0.5 : 0;

    const equipmentUF = boilerUF + elevatorsUF + pumpRoomUF + generatorUF + poolClubUF + cctvFenceUF;

    // 3. Carga Laboral y RRHH Directo (UF)
    const directStaffUF = Math.max(0, Number(calc.directEmployees) || 0) * 0.30;
    const outsourcedUF = Math.max(0, Number(calc.outsourcedCompanies) || 0) * 0.40;
    const hrUF = directStaffUF + outsourcedUF;

    // 4. Subtotal antes de antigüedad
    const subtotalUF = baseUF + equipmentUF + hrUF;

    // 5. Multiplicador de Antigüedad
    const ageObj = AGE_FACTORS.find(a => a.id === calc.ageId) || AGE_FACTORS[1];
    const afterAgeUF = subtotalUF * ageObj.multiplier;

    // 6. Fórmula Maestra: max(Piso Mínimo, (Tarifa Base + Equipamiento + RRHH) * Factor Antigüedad)
    const isFloorApplied = afterAgeUF < minFloorUF;
    const finalMonthlyUF = Math.max(minFloorUF, afterAgeUF);
    const finalMonthlyCLP = Math.round(finalMonthlyUF * ufCLP);

    // Costo por unidad
    const feePerUnitUF = finalMonthlyUF / units;
    const feePerUnitCLP = Math.round(finalMonthlyCLP / units);

    // Recargo de puesta en marcha (primeros 3 meses)
    const initObj = INITIAL_STATES.find(s => s.id === calc.initialStateId) || INITIAL_STATES[0];
    const onboardingMonthlyUF = finalMonthlyUF + initObj.surchargeUF;
    const onboardingMonthlyCLP = Math.round(onboardingMonthlyUF * ufCLP);

    return {
      units,
      ufCLP,
      minFloorUF,
      activeTier,
      baseUF,
      boilerUF,
      elevatorsUF,
      pumpRoomUF,
      generatorUF,
      poolClubUF,
      cctvFenceUF,
      equipmentUF,
      directStaffUF,
      outsourcedUF,
      hrUF,
      subtotalUF,
      ageObj,
      afterAgeUF,
      isFloorApplied,
      finalMonthlyUF,
      finalMonthlyCLP,
      feePerUnitUF,
      feePerUnitCLP,
      initObj,
      onboardingMonthlyUF,
      onboardingMonthlyCLP
    };
  }, [calc]);

  const handleApplyToProposal = () => {
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
        `Se transfirió el honorario calculado de ${result.finalMonthlyUF.toFixed(2)} UF (${formatCLP(result.finalMonthlyCLP)} / mes • ${formatCLP(result.feePerUnitCLP)} por unidad) a la Carta Formal de Propuesta Económica del Paso 3.`,
        'success'
      );
    }
  };

  const handlePrintFeeSheet = () => {
    const cleanName = (calc.condoName || 'Comunidad').replace(/[^a-zA-Z0-9]/g, '_');
    printDocumentDirectly('printable-agacech-fee-sheet', `ARANPRO_Estudio_Honorarios_AGACECH_${cleanName}`, {
      pageSize: 'letter portrait',
      fitPage: true,
      margin: '4mm 6mm 4mm 6mm'
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* CABECERA EXPLICATIVA DEL MODELO AGACECH */}
      <div
        className="p-5 rounded-3xl bg-[#0F3D2E] bg-gradient-to-r from-[#0F3D2E] via-[#144D3A] to-[#0A291F] text-white flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-md"
        style={{ backgroundColor: '#0F3D2E' }}
      >
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#D4B895] text-[#0F3D2E] font-black text-[10px] uppercase tracking-wider">
              Estándar Gremial AGACECH • Ley N° 21.442
            </span>
            <span className="text-[11px] text-emerald-200 font-mono">
              Matriz Técnica de Piso de Honorarios
            </span>
          </div>
          <h4 className="text-base md:text-lg font-black text-white">
            Calculadora Profesional de Piso de Honorarios por Complejidad
          </h4>
          <p className="text-xs text-emerald-100/90 max-w-3xl leading-relaxed">
            Calcula científicamente cuánto cobrar combinando la <strong>escala degresiva por unidades</strong>, el <strong>equipamiento crítico a fiscalizar</strong>, la <strong>carga de RRHH en nómina directa</strong> y el <strong>multiplicador de antigüedad</strong> del condominio.
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

      {/* FÓRMULA MATEMÁTICA VISUAL */}
      <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/90 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="p-2 rounded-xl bg-[#0F3D2E] text-[#D4B895] shrink-0 mt-0.5">
            <Calculator className="w-4 h-4" />
          </div>
          <div className="text-xs space-y-0.5">
            <span className="font-black text-slate-900 uppercase text-[10.5px] block">
              Fórmula Matemática Recomendada (Modelo AGACECH / Puntos de Complejidad):
            </span>
            <p className="font-mono text-[11.5px] font-bold text-[#0F3D2E]">
              Honorario Final = máx( Piso Mínimo , [ Tarifa Base + Complejidad Equipamiento + Carga RRHH ] × Factor Antigüedad )
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

      {/* GRID PRINCIPAL: CONTROLES IZQUIERDA (7 COLS) + PANEL DE RESULTADOS DERECHA (5 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUMNA IZQUIERDA: VARIABLES DE CÁLCULO */}
        <div className="lg:col-span-7 space-y-5">
          {/* BLOQUE 1: TAMAÑO DE LA COMUNIDAD Y PISO MÍNIMO */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#0F3D2E]" />
                <h5 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  1. Tamaño de la Comunidad & Escala Base (UF)
                </h5>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#0F3D2E] border border-emerald-200">
                Tramo activo: {result.activeTier.label} ({result.activeTier.rateUF.toFixed(2)} UF/u)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1 sm:col-span-1">
                <label className="block text-[10px] font-bold text-slate-600 uppercase">
                  N° de Unidades (Deptos/Casas)
                </label>
                <input
                  type="number"
                  min="1"
                  max="2000"
                  value={calc.units}
                  onChange={(e) => setCalc({ ...calc, units: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-black text-[#0F3D2E] focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-600 uppercase">
                  Piso Mínimo Gremial (UF)
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
                  min="30000"
                  max="60000"
                  step="50"
                  value={calc.ufValueCLP}
                  onChange={(e) => setCalc({ ...calc, ufValueCLP: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800"
                />
              </div>
            </div>

            {/* Tabla visual de los 4 tramos de unidades */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {UNIT_TIERS.map((tier) => {
                const isCurrent = result.activeTier.id === tier.id;
                return (
                  <div
                    key={tier.id}
                    onClick={() => {
                      const mid = tier.id === 't1' ? 35 : tier.id === 't2' ? 80 : tier.id === 't3' ? 160 : 280;
                      setCalc({ ...calc, units: mid });
                    }}
                    className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                      isCurrent
                        ? 'bg-[#0F3D2E] text-white border-[#0F3D2E] shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className={`text-[10px] font-bold ${isCurrent ? 'text-[#D4B895]' : 'text-slate-500'}`}>
                      {tier.label}
                    </div>
                    <div className="text-sm font-black mt-0.5">{tier.rateUF.toFixed(2)} UF</div>
                    <div className="text-[9px] opacity-80">por unidad</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* BLOQUE 2: EQUIPAMIENTO E INSTALACIONES CRÍTICAS */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <HardHat className="w-4 h-4 text-[#0F3D2E]" />
                <h5 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  2. Complejidad Técnica & Equipamiento a Supervisar
                </h5>
              </div>
              <span className="text-xs font-black text-[#0F3D2E]">
                +{result.equipmentUF.toFixed(2)} UF
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Ascensores */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-slate-900 block">Ascensores (+0.5 UF c/u)</span>
                  <span className="text-[10.5px] text-slate-500">Salas de máquinas y contratos</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={calc.elevatorsCount}
                    onChange={(e) => setCalc({ ...calc, elevatorsCount: e.target.value })}
                    className="w-16 px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-center font-black text-xs text-[#0F3D2E]"
                  />
                </div>
              </div>

              {/* Caldera Comunitaria */}
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
                    <span className="text-[10.5px] text-slate-500">Central de agua caliente / calefacción</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-[#0F3D2E] text-xs shrink-0">+1.5 UF</span>
              </label>

              {/* Sala de Bombas / Grupo Electrógeno */}
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
                    <span className="font-bold text-slate-900 block">Sala de Bombas / Generador</span>
                    <span className="text-[10.5px] text-slate-500">Hidroneumático, estanques y respaldo</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-[#0F3D2E] text-xs shrink-0">+1.0 UF</span>
              </label>

              {/* Piscina / Club House / Áreas comunes */}
              <label className={`p-3 rounded-2xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                calc.hasPoolClubhouse ? 'bg-emerald-50/70 border-emerald-300' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={calc.hasPoolClubhouse}
                    onChange={(e) => setCalc({ ...calc, hasPoolClubhouse: e.target.checked })}
                    className="w-4 h-4 rounded text-[#0F3D2E]"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">Piscina / Club House / Quinchos</span>
                    <span className="text-[10.5px] text-slate-500">Gimnasio, salones y áreas recreativas</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-[#0F3D2E] text-xs shrink-0">+1.0 UF</span>
              </label>

              {/* Cerco eléctrico y CCTV */}
              <label className={`p-3 rounded-2xl border flex items-center justify-between gap-2 cursor-pointer transition-all sm:col-span-2 ${
                calc.hasCctvFence ? 'bg-emerald-50/70 border-emerald-300' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={calc.hasCctvFence}
                    onChange={(e) => setCalc({ ...calc, hasCctvFence: e.target.checked })}
                    className="w-4 h-4 rounded text-[#0F3D2E]"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">Cerco Eléctrico, CCTV Perimetral & Portones Automatizados</span>
                    <span className="text-[10.5px] text-slate-500">Supervisión de accesos vehiculares, citofonía y cámaras de seguridad</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-[#0F3D2E] text-xs shrink-0">+0.5 UF</span>
              </label>
            </div>
          </div>

          {/* BLOQUE 3: DOTACIÓN DE PERSONAL PROPIO (RRHH) */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#0F3D2E]" />
                <h5 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  3. Dotación de Personal & Carga de RRHH
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
                <p className="text-[10.5px] text-slate-500">
                  Conserjes, mayordomo y auxiliares con liquidaciones, turnos, Previred y Dirección del Trabajo.
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
                <p className="text-[10.5px] text-slate-500">
                  Empresas externas de seguridad o aseo (fiscalización mensual de certificado F30-1 y responsabilidad solidaria).
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

          {/* BLOQUE 4: ANTIGÜEDAD DE LA EDIFICACIÓN & ESTADO INICIAL */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#0F3D2E]" />
                <h5 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  4. Multiplicador por Antigüedad de la Edificación
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
                    <div className={`text-[11px] font-bold mt-1 ${isSel ? 'text-[#D4B895]' : 'text-slate-800'}`}>
                      {af.title}
                    </div>
                    <p className={`text-[10px] mt-0.5 leading-snug ${isSel ? 'text-emerald-100/90' : 'text-slate-500'}`}>
                      {af.desc}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Estado Inicial / Puesta en marcha */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="block text-[10px] font-black uppercase text-slate-500">
                Estado Inicial del Condominio (Recargo Opcional de Normalización Primeros 3 Meses):
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

        {/* COLUMNA DERECHA: RESUMEN EJECUTIVO DEL CÁLCULO (5 COLS) */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-4">
          <div
            className="bg-[#0F3D2E] bg-gradient-to-b from-[#0F3D2E] to-[#0A291F] text-white p-6 rounded-3xl shadow-xl border border-emerald-900/40 space-y-5"
            style={{ backgroundColor: '#0F3D2E' }}
          >
            <div className="flex items-center justify-between border-b border-white/15 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#D4B895] block">
                  Piso Técnico Sugerido AGACECH
                </span>
                <h5 className="text-base font-black text-white">
                  Desglose de Honorarios Mensuales
                </h5>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-emerald-200 block">Comunidad</span>
                <span className="text-xs font-bold text-white">{result.units} Unidades</span>
              </div>
            </div>

            {/* MONTO PRINCIPAL */}
            <div className="p-4 rounded-2xl bg-white/10 border border-white/15 text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4B895] block">
                Honorario Mensual Recomendado
              </span>
              <div className="text-3xl font-black text-white tracking-tight">
                {formatCLP(result.finalMonthlyCLP)}
                <span className="text-xs font-normal text-emerald-200"> / mes</span>
              </div>
              <div className="text-sm font-mono font-bold text-[#D4B895]">
                Equivalente a {result.finalMonthlyUF.toFixed(2)} UF mensuales
              </div>
              {result.isFloorApplied && (
                <div className="mt-2 inline-block px-2.5 py-1 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-200 text-[10px] font-bold">
                  ★ Se activó el Piso Mínimo Gremial de {result.minFloorUF} UF (cálculo directo daba {result.afterAgeUF.toFixed(2)} UF)
                </div>
              )}
            </div>

            {/* PRORRATEO POR UNIDAD */}
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[10px] uppercase text-emerald-200/80 block font-bold">Costo por Unidad (CLP)</span>
                <strong className="text-base font-black text-white">{formatCLP(result.feePerUnitCLP)}</strong>
                <span className="text-[9.5px] text-emerald-200/70 block">por depto / mes</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[10px] uppercase text-emerald-200/80 block font-bold">Costo por Unidad (UF)</span>
                <strong className="text-base font-black text-[#D4B895]">{result.feePerUnitUF.toFixed(3)} UF</strong>
                <span className="text-[9.5px] text-emerald-200/70 block">por depto / mes</span>
              </div>
            </div>

            {/* TABLA PASO A PASO DE LA FÓRMULA */}
            <div className="space-y-2 text-xs border-t border-white/15 pt-3">
              <div className="flex items-center justify-between text-emerald-100">
                <span>1. Tarifa Base ({result.units} u. × {result.activeTier.rateUF} UF):</span>
                <span className="font-mono font-bold">{result.baseUF.toFixed(2)} UF</span>
              </div>
              <div className="flex items-center justify-between text-emerald-100">
                <span>2. Complejidad Equipamiento Crítico:</span>
                <span className="font-mono font-bold">+{result.equipmentUF.toFixed(2)} UF</span>
              </div>
              <div className="flex items-center justify-between text-emerald-100">
                <span>3. Carga Laboral RRHH ({calc.directEmployees} dir. / {calc.outsourcedCompanies} ext.):</span>
                <span className="font-mono font-bold">+{result.hrUF.toFixed(2)} UF</span>
              </div>
              <div className="flex items-center justify-between text-white font-bold border-t border-white/10 pt-1.5">
                <span>Subtotal Operativo:</span>
                <span className="font-mono">{result.subtotalUF.toFixed(2)} UF</span>
              </div>
              <div className="flex items-center justify-between text-[#D4B895] font-bold">
                <span>4. Multiplicador Antigüedad ({result.ageObj.multiplier.toFixed(2)}x):</span>
                <span className="font-mono">{result.afterAgeUF.toFixed(2)} UF</span>
              </div>
              <div className="flex items-center justify-between text-white font-black text-sm border-t border-white/20 pt-2">
                <span>Honorario Final (Piso {result.minFloorUF} UF):</span>
                <span className="font-mono text-[#D4B895]">{result.finalMonthlyUF.toFixed(2)} UF</span>
              </div>
            </div>

            {result.initObj.surchargeUF > 0 && (
              <div className="p-3 rounded-xl bg-amber-400/15 border border-amber-300/30 text-xs space-y-0.5">
                <span className="font-black text-[#D4B895] block text-[10.5px] uppercase">
                  + Puesta en Marcha Primeros 3 Meses ({result.initObj.surchargeUF} UF/mes):
                </span>
                <p className="text-white font-bold">
                  {result.onboardingMonthlyUF.toFixed(2)} UF / mes ({formatCLP(result.onboardingMonthlyCLP)}) durante el trimestre de normalización.
                </p>
              </div>
            )}

            {/* BOTONES DE ACCIÓN */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleApplyToProposal}
                className="w-full py-3 px-4 rounded-2xl bg-[#D4B895] hover:bg-[#c5a77e] text-[#0F3D2E] font-black text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                Aplicar {formatCLP(result.finalMonthlyCLP)} a la Propuesta (Paso 3)
              </button>
              <div className="pt-1">
                <AranproPdfStyleSelector value={pdfStyle} onChange={setPdfStyle} compact label="Plantilla PDF:" />
              </div>

              <button
                type="button"
                onClick={handlePrintFeeSheet}
                className="w-full py-2.5 px-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-[#D4B895]" />
                Imprimir Ficha de Justificación de Honorarios
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PLANTILLA IMPRIMIBLE LISTA EN DOM PARA IMPRESIÓN DIRECTA CANÓNICA (1 PÁG. CARTA) */}
      <div className="hidden">
        <div
          id="printable-agacech-fee-sheet"
          data-pdf-style={pdfStyle}
          className="dossier-page page-1 bg-white p-6 md:p-7 pl-9 md:pl-11 min-h-[850px] flex flex-col justify-between max-w-[850px] mx-auto text-slate-900 text-xs shadow-md leading-relaxed"
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          {/* SECCIÓN SUPERIOR */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between border-b-2 border-[#0F3D2E] pb-2.5">
              <div className="flex items-center space-x-3.5">
                <AranproLogo variant="principal" className="h-11 w-auto" />
                <div className="border-l border-slate-300 pl-3.5 space-y-0.5">
                  <span className="text-[10px] font-black text-[#D4B895] uppercase tracking-widest block">
                    ESTUDIO TÉCNICO DE HONORARIOS • MODELO AGACECH
                  </span>
                  <h2 className="text-base font-black text-[#0F3D2E] uppercase">
                    {empresaForm?.provisionalName || 'ARANPRO • GESTIÓN INTEGRAL DE CONDOMINIOS'}
                  </h2>
                  <p className="text-[10px] text-slate-600 font-mono font-semibold">
                    {empresaForm?.companyRut && !String(empresaForm.companyRut).includes('76.999.888') ? `RUT Empresa: ${empresaForm.companyRut} • ` : ''}{empresaForm?.rnacNumber && empresaForm?.rnacNumber !== '48.912' ? `RNAC MINVU N° ${empresaForm.rnacNumber}` : 'Ley N° 21.442 de Copropiedad'}
                  </p>
                  <p className="text-[9.5px] text-slate-500 font-mono">
                    {empresaForm?.email || 'contacto@aranpro.cl'} • {empresaForm?.phone || '+56 9 5811 8504'}
                  </p>
                </div>
              </div>
              <div className="text-right text-xs">
                <span className="inline-block px-2.5 py-0.5 rounded bg-[#F5F4EF] border border-[#D4B895] text-[#0F3D2E] text-[10px] font-mono font-bold">
                  MEMORIA DE CÁLCULO
                </span>
                <p className="font-bold text-slate-800 mt-1">{calc.condoName || 'Comunidad en Evaluación'}</p>
                <p className="text-[10px] text-slate-500">{result.units} Unidades • UF Ref: {formatCLP(result.ufCLP)}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
              <div className="font-black text-[#0F3D2E] uppercase text-[10.5px]">
                1. Metodología Gremial Aplicada (Estándar AGACECH & Ley N° 21.442)
              </div>
              <p className="text-slate-600 text-[10.5px] leading-snug">
                El honorario de administración profesional se determina objetivamente en función de la escala de unidades, el equipamiento crítico que requiere inspección técnica en terreno (Constructor Civil), la dotación de trabajadores contratados y el factor de antigüedad de las instalaciones.
              </p>
              <div className="p-1.5 bg-white rounded-lg border border-slate-200 font-mono text-[10px] text-[#0F3D2E] font-bold text-center">
                Honorario Final = máx( Piso Mínimo {result.minFloorUF} UF , [ Tarifa Base + Equipamiento + RRHH ] × Factor Antigüedad )
              </div>
            </div>

            <table className="w-full text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-[#0F3D2E] text-white">
                <tr>
                  <th className="text-left p-2">Componente Evaluado</th>
                  <th className="text-left p-2">Parámetro de la Comunidad</th>
                  <th className="text-right p-2">Ponderación (UF)</th>
                  <th className="text-right p-2">Equivalente (CLP)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-[11px]">
                <tr>
                  <td className="p-2 font-bold">1. Base por Unidades</td>
                  <td className="p-2 text-slate-600">{result.units} unidades ({result.activeTier.label} • {result.activeTier.rateUF} UF/u)</td>
                  <td className="p-2 text-right font-mono font-bold">{result.baseUF.toFixed(2)} UF</td>
                  <td className="p-2 text-right font-mono">{formatCLP(Math.round(result.baseUF * result.ufCLP))}</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold">2. Equipamiento Crítico</td>
                  <td className="p-2 text-slate-600">
                    {[
                      calc.elevatorsCount > 0 ? `${calc.elevatorsCount} ascensor(es)` : null,
                      calc.hasBoiler ? 'Caldera central' : null,
                      calc.hasPumpRoom ? 'Sala de bombas' : null,
                      calc.hasPoolClubhouse ? 'Piscina / áreas comunes' : null,
                      calc.hasCctvFence ? 'CCTV y cerco perimetral' : null
                    ].filter(Boolean).join(', ') || 'Estándar'}
                  </td>
                  <td className="p-2 text-right font-mono font-bold">+{result.equipmentUF.toFixed(2)} UF</td>
                  <td className="p-2 text-right font-mono">{formatCLP(Math.round(result.equipmentUF * result.ufCLP))}</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold">3. Carga Laboral RRHH</td>
                  <td className="p-2 text-slate-600">
                    {calc.directEmployees} trabajador(es) en nómina directa (+0.30 UF c/u)
                  </td>
                  <td className="p-2 text-right font-mono font-bold">+{result.hrUF.toFixed(2)} UF</td>
                  <td className="p-2 text-right font-mono">{formatCLP(Math.round(result.hrUF * result.ufCLP))}</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="p-2 font-bold">4. Factor de Antigüedad</td>
                  <td className="p-2 text-slate-600">{result.ageObj.label} — {result.ageObj.title}</td>
                  <td className="p-2 text-right font-mono font-bold">× {result.ageObj.multiplier.toFixed(2)}</td>
                  <td className="p-2 text-right font-mono">{formatCLP(Math.round(result.afterAgeUF * result.ufCLP))}</td>
                </tr>
                <tr className="bg-emerald-50 font-black text-[#0F3D2E]">
                  <td className="p-2.5">HONORARIO MENSUAL FINAL</td>
                  <td className="p-2.5">
                    Prorrateo estimado: {formatCLP(result.feePerUnitCLP)} / depto ({result.feePerUnitUF.toFixed(3)} UF)
                  </td>
                  <td className="p-2.5 text-right font-mono text-xs">{result.finalMonthlyUF.toFixed(2)} UF</td>
                  <td className="p-2.5 text-right font-mono text-xs">{formatCLP(result.finalMonthlyCLP)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* SECCIÓN INFERIOR ANCLADA AL PIE */}
          <div className="mt-auto pt-2 space-y-2">
            <div className="pt-2 border-t border-slate-200 flex items-end justify-between gap-4">
              <AranproOfficialSeal
                size="sm"
                companyRut={empresaForm?.companyRut && !String(empresaForm.companyRut).includes('76.999.888') ? empresaForm.companyRut : ''}
                rnacNumber=""
              />
              <div className="text-center min-w-[240px]">
                <div className="h-14 flex items-end justify-center pb-0.5 overflow-visible">
                  {signatureImage ? (
                    <img
                      src={signatureImage}
                      alt="Firma Administrador"
                      className="h-12 max-h-14 w-auto max-w-[240px] object-contain mx-auto"
                      style={{ transform: `scale(${signatureScale})`, transformOrigin: 'bottom center' }}
                    />
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">Firma del Representante Legal</span>
                  )}
                </div>
                <div className="border-t-[1.5px] border-slate-800 pt-1">
                  <p className="font-black text-[11px] text-slate-900 leading-tight">{empresaForm?.adminName || 'John Andrés Arancibia Maureira'}</p>
                  <p className="text-[9px] text-slate-600 font-mono">RUT: {(empresaForm?.adminRut && empresaForm.adminRut !== '14.882.140-K') ? empresaForm.adminRut : '16.012.871-2'} • Ley N° 21.442</p>
                  <p className="text-[9px] text-[#0F3D2E] font-bold leading-tight">
                    Constructor Civil • Administrador de Condominios
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-400 font-mono">
              <div>ARANPRO Gestión Integral • {empresaForm?.website || 'https://aranpro.cl'}</div>
              <div className="font-bold text-[#0F3D2E]">Estudio Técnico de Honorarios • Estándar AGACECH & Ley N° 21.442 (Pág. 1 de 1)</div>
              <div>Chile</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
