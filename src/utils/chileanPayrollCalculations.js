// Utilidades y Fórmulas Oficiales de Remuneraciones en Chile (Ley 21.442 & Código del Trabajo)
// Estandarizado para condominios chilenos con valores vigentes (IMM $500.000, Gratificación Art. 50, AFP, AFC, SIS, Mutual)

export const CHILE_IMM = 500000; // Ingreso Mínimo Mensual
export const CHILE_TOPE_GRATIFICACION_ANUAL_IMM = 4.75;
export const CHILE_TOPE_GRATIFICACION_MENSUAL = Math.round((CHILE_IMM * CHILE_TOPE_GRATIFICACION_ANUAL_IMM) / 12); // $197.917 CLP

export const AFP_RATES_CHILE = [
  { id: 'habitat', name: 'AFP Habitat', rate: 11.27, code: '05' },
  { id: 'provida', name: 'AFP ProVida', rate: 11.45, code: '08' },
  { id: 'modelo', name: 'AFP Modelo', rate: 10.58, code: '34' },
  { id: 'cuprum', name: 'AFP Cuprum', rate: 11.44, code: '03' },
  { id: 'capital', name: 'AFP Capital', rate: 11.44, code: '33' },
  { id: 'planvital', name: 'AFP PlanVital', rate: 11.16, code: '29' },
  { id: 'uno', name: 'AFP Uno', rate: 10.49, code: '35' }
];

export const HEALTH_SYSTEMS_CHILE = [
  { id: 'fonasa', name: 'Fonasa (7.00% Legal)', defaultRate: 7.0 },
  { id: 'isapre_banmedica', name: 'Isapre Banmédica', defaultRate: 7.0 },
  { id: 'isapre_consalud', name: 'Isapre Consalud', defaultRate: 7.0 },
  { id: 'isapre_colmena', name: 'Isapre Colmena Golden Cross', defaultRate: 7.0 },
  { id: 'isapre_cruzblanca', name: 'Isapre Cruz Blanca', defaultRate: 7.0 },
  { id: 'isapre_vidatres', name: 'Isapre Nueva Masvida / Vida Tres', defaultRate: 7.0 },
  { id: 'isapre_esencial', name: 'Isapre Esencial', defaultRate: 7.0 }
];

export const MUTUAL_ENTITIES_CHILE = [
  { id: 'achs', name: 'Asociación Chilena de Seguridad (ACHS)', baseRate: 0.93 },
  { id: 'mutual', name: 'Mutual de Seguridad CChC', baseRate: 0.93 },
  { id: 'ist', name: 'Instituto de Seguridad del Trabajo (IST)', baseRate: 0.93 },
  { id: 'isl', name: 'Instituto de Seguridad Laboral (ISL - Estatal)', baseRate: 0.93 }
];

export const SIS_RATE_CHILE = 1.49; // Seguro Invalidez y Sobrevivencia a cargo empleador
export const AFC_INDEFINIDO_TRABAJADOR = 0.6; // 0.6% a cargo trabajador
export const AFC_INDEFINIDO_EMPLEADOR = 2.4; // 2.4% a cargo empleador
export const AFC_PLAZO_FIJO_EMPLEADOR = 3.0; // 3.0% a cargo empleador

/**
 * Calcula el valor de la hora extraordinaria con 50% de recargo según jornada
 */
export const calculateOvertimeHourValue = (baseSalary, weeklyHours = 44) => {
  const base = Number(baseSalary) || 0;
  if (base <= 0) return 0;
  // Fórmula legal chilena DT: (Sueldo Base / 30) * 28 / Horas Semanales * 1.5
  const ordinaryHour = (base / 30) * (28 / weeklyHours);
  return Math.round(ordinaryHour * 1.5);
};

/**
 * Convierte un número entero a texto en español para liquidaciones de sueldo
 */
export const numberToSpanishWords = (amount) => {
  const num = Math.round(Number(amount) || 0);
  if (num === 0) return 'CERO PESOS';

  const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const diez_veinte = [
    'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'
  ];
  const centenas = [
    '', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'
  ];

  const getCentenas = (n) => {
    if (n === 100) return 'CIEN';
    let output = '';
    const c = Math.floor(n / 100);
    const d = Math.floor((n % 100) / 10);
    const u = n % 10;

    if (c > 0) output += centenas[c] + ' ';
    if (d === 1) {
      output += diez_veinte[u];
    } else if (d === 2 && u > 0) {
      output += 'VEINTI' + unidades[u];
    } else {
      if (d > 0) output += decenas[d] + (u > 0 ? ' Y ' : '');
      if (u > 0) output += unidades[u];
    }
    return output.trim();
  };

  let str = '';
  const millones = Math.floor(num / 1000000);
  const miles = Math.floor((num % 1000000) / 1000);
  const resto = num % 1000;

  if (millones === 1) {
    str += 'UN MILLÓN ';
  } else if (millones > 1) {
    str += getCentenas(millones) + ' MILLONES ';
  }

  if (miles === 1) {
    str += 'MIL ';
  } else if (miles > 1) {
    str += getCentenas(miles) + ' MIL ';
  }

  if (resto > 0) {
    str += getCentenas(resto);
  }

  return str.trim() + ' PESOS';
};

/**
 * Calcula en detalle la liquidación mensual de un trabajador de condominio
 */
export const calculateMonthlyPayroll = (worker, monthlyInputs = {}) => {
  const daysWorked = monthlyInputs.daysWorked !== undefined ? Number(monthlyInputs.daysWorked) : 30;
  const overtimeHours = Number(monthlyInputs.overtimeHours) || 0;
  const extraTaxableBonus = Number(monthlyInputs.extraTaxableBonus) || 0;
  const extraNonTaxableBonus = Number(monthlyInputs.extraNonTaxableBonus) || 0;
  const advances = Number(monthlyInputs.advances) || 0;
  const otherDiscounts = Number(monthlyInputs.otherDiscounts) || 0;

  const baseSalary = Number(worker.baseSalary) || 0;
  const weeklyHours = Number(worker.weeklyHours) || 44;

  // Prorrateo de sueldo por días trabajados si es menor a 30
  const proratedBase = Math.round((baseSalary / 30) * Math.min(30, Math.max(0, daysWorked)));

  // Gratificación Legal Art. 50 (25% del sueldo con tope de 4.75 IMM al mes)
  let gratification = 0;
  if (worker.hasLegalGratification !== false) {
    const rawGrat = Math.round(proratedBase * 0.25);
    gratification = Math.min(rawGrat, CHILE_TOPE_GRATIFICACION_MENSUAL);
  }

  // Horas Extras al 50%
  const overtimeRate = calculateOvertimeHourValue(baseSalary, weeklyHours);
  const overtimeAmount = Math.round(overtimeHours * overtimeRate);

  // Bonos fijos de contrato (Turno Nocturno, Responsabilidad, etc.)
  const contractualNightBonus = Number(worker.contractualNightBonus) || 0;
  const contractualResponsibilityBonus = Number(worker.contractualResponsibilityBonus) || 0;
  const totalContractualTaxableBonuses = contractualNightBonus + contractualResponsibilityBonus;

  // Total Imponible
  const totalTaxable = proratedBase + gratification + overtimeAmount + totalContractualTaxableBonuses + extraTaxableBonus;

  // Haberes No Imponibles
  const colacion = Number(worker.allowanceColacion) || 0;
  const movilizacion = Number(worker.allowanceMovilizacion) || 0;
  const totalNonTaxable = colacion + movilizacion + extraNonTaxableBonus;

  // Total Haberes Bruto
  const totalGross = totalTaxable + totalNonTaxable;

  // Descuentos Previsionales
  const afpRate = Number(worker.afpRate) || 11.27; // Default Habitat
  const afpAmount = Math.round(totalTaxable * (afpRate / 100));

  const healthRate = Number(worker.healthRate) || 7.0;
  const healthAmount = Math.round(totalTaxable * (healthRate / 100));

  // AFC Trabajador (0.6% en contrato indefinido, 0% en plazo fijo o exento)
  const isIndefinido = worker.contractType !== 'Contrato Plazo Fijo' && worker.contractType !== 'Honorarios';
  const afcWorkerRate = (isIndefinido && !worker.isExemptFromAfc) ? AFC_INDEFINIDO_TRABAJADOR : 0;
  const afcWorkerAmount = Math.round(totalTaxable * (afcWorkerRate / 100));

  // Total Descuentos Legales Previsionales
  const totalPrevisionalDiscounts = afpAmount + healthAmount + afcWorkerAmount;

  // Total General de Descuentos
  const totalDiscounts = totalPrevisionalDiscounts + advances + otherDiscounts;

  // Líquido a Pagar
  const netSalary = Math.max(0, totalGross - totalDiscounts);

  // Costos Empleador (Costo para la Comunidad)
  const employerSisAmount = Math.round(totalTaxable * (SIS_RATE_CHILE / 100));
  const employerAfcRate = isIndefinido ? AFC_INDEFINIDO_EMPLEADOR : AFC_PLAZO_FIJO_EMPLEADOR;
  const employerAfcAmount = (!worker.isExemptFromAfc) ? Math.round(totalTaxable * (employerAfcRate / 100)) : 0;
  
  const mutualRate = Number(worker.mutualRate) || 0.93;
  const employerMutualAmount = Math.round(totalTaxable * (mutualRate / 100));

  const totalEmployerCosts = employerSisAmount + employerAfcAmount + employerMutualAmount;
  const totalCommunityCost = netSalary + totalPrevisionalDiscounts + totalEmployerCosts;

  return {
    daysWorked,
    baseSalary,
    proratedBase,
    gratification,
    overtimeHours,
    overtimeRate,
    overtimeAmount,
    contractualNightBonus,
    contractualResponsibilityBonus,
    extraTaxableBonus,
    totalTaxable,
    colacion,
    movilizacion,
    extraNonTaxableBonus,
    totalNonTaxable,
    totalGross,
    afpRate,
    afpAmount,
    healthRate,
    healthAmount,
    afcWorkerRate,
    afcWorkerAmount,
    totalPrevisionalDiscounts,
    advances,
    otherDiscounts,
    totalDiscounts,
    netSalary,
    netSalaryInWords: numberToSpanishWords(netSalary),
    employerSisAmount,
    employerAfcAmount,
    employerMutualAmount,
    totalEmployerCosts,
    totalCommunityCost
  };
};

/**
 * Causales de término de contrato según Código del Trabajo de Chile
 */
export const TERMINATION_CAUSES_CHILE = [
  { id: '159_1', article: 'Art. 159 N° 1', name: 'Mutuo acuerdo de las partes', paysSeveranceYears: false, paysNotice: false, paysVacations: true },
  { id: '159_2', article: 'Art. 159 N° 2', name: 'Renuncia voluntaria del trabajador', paysSeveranceYears: false, paysNotice: false, paysVacations: true },
  { id: '159_4', article: 'Art. 159 N° 4', name: 'Vencimiento del plazo convenido en el contrato', paysSeveranceYears: false, paysNotice: false, paysVacations: true },
  { id: '159_5', article: 'Art. 159 N° 5', name: 'Conclusión del trabajo o servicio que dio origen al contrato', paysSeveranceYears: false, paysNotice: false, paysVacations: true },
  { id: '161_1', article: 'Art. 161 Inciso 1°', name: 'Necesidades de la empresa, establecimiento o servicio', paysSeveranceYears: true, paysNotice: true, paysVacations: true },
  { id: '160', article: 'Art. 160', name: 'Conductas indebidas graves o incumplimiento contractual (Sin indemnización)', paysSeveranceYears: false, paysNotice: false, paysVacations: true }
];

/**
 * Calcula el saldo de vacaciones legales (1.25 días hábiles por mes trabajado = 15 días anuales)
 */
export const calculateVacationBalance = (startDateStr, daysTaken = 0, targetDateStr = null) => {
  if (!startDateStr) return { monthsWorked: 0, daysAccrued: 15, daysTaken: 0, daysRemaining: 15 };
  
  const start = new Date(startDateStr);
  const target = targetDateStr ? new Date(targetDateStr) : new Date();
  
  if (isNaN(start.getTime()) || isNaN(target.getTime())) {
    return { monthsWorked: 0, daysAccrued: 15, daysTaken: Number(daysTaken) || 0, daysRemaining: 15 };
  }

  let months = (target.getFullYear() - start.getFullYear()) * 12 + (target.getMonth() - start.getMonth());
  if (target.getDate() < start.getDate()) {
    months -= 1;
  }
  months = Math.max(0, months);

  // 1.25 días hábiles por cada mes completo trabajado
  const daysAccrued = Math.round(months * 1.25 * 10) / 10;
  const taken = Number(daysTaken) || 0;
  const daysRemaining = Math.max(0, Math.round((daysAccrued - taken) * 10) / 10);

  return {
    monthsWorked: months,
    daysAccrued,
    daysTaken: taken,
    daysRemaining
  };
};

/**
 * Calcula el desglose detallado de un Finiquito Laboral según causales del Código del Trabajo
 */
export const calculateSeverancePay = ({
  worker,
  terminationDateStr,
  causeId = '161_1',
  noticeGiven = false,
  vacationDaysPending = 0,
  workedDaysInMonth = 0,
  afcBalanceDeduction = 0
}) => {
  const cause = TERMINATION_CAUSES_CHILE.find((c) => c.id === causeId) || TERMINATION_CAUSES_CHILE[4];
  const baseSalary = Number(worker?.baseSalary) || 0;
  const gratification = worker?.hasLegalGratification !== false
    ? Math.min(Math.round(baseSalary * 0.25), CHILE_TOPE_GRATIFICACION_MENSUAL)
    : 0;
  const lastGrossSalary = baseSalary + gratification; // Base legal de cálculo para indemnización

  // Antigüedad laboral
  const startDate = new Date(worker?.startDate || '2024-01-01');
  const termDate = new Date(terminationDateStr || new Date());
  
  let monthsTotal = (termDate.getFullYear() - startDate.getFullYear()) * 12 + (termDate.getMonth() - startDate.getMonth());
  if (termDate.getDate() < startDate.getDate()) monthsTotal -= 1;
  monthsTotal = Math.max(0, monthsTotal);

  const fullYears = Math.floor(monthsTotal / 12);
  const remainingMonths = monthsTotal % 12;

  // En Chile (Art. 163): Fracción superior a 6 meses se computa como año completo. Tope máximo de 11 años.
  let yearsOfService = fullYears;
  if (remainingMonths > 6) {
    yearsOfService += 1;
  }
  yearsOfService = Math.min(11, yearsOfService);

  // Indemnización por Años de Servicio (Art. 163)
  const isIndefinido = worker?.contractType !== 'Contrato Plazo Fijo' && worker?.contractType !== 'Honorarios';
  let severanceYearsAmount = 0;
  if (cause.paysSeveranceYears && isIndefinido && yearsOfService >= 1) {
    severanceYearsAmount = yearsOfService * lastGrossSalary;
  }

  // Indemnización Sustitutiva de Aviso Previo (Art. 161 Inc. 2°)
  let substituteNoticeAmount = 0;
  if (cause.paysNotice && !noticeGiven && isIndefinido) {
    substituteNoticeAmount = lastGrossSalary;
  }

  // Feriado Proporcional (Art. 73)
  const vacationDayValue = Math.round(baseSalary / 30);
  const proportionalVacationAmount = Math.round((Number(vacationDaysPending) || 0) * vacationDayValue);

  // Remuneración días pendientes del mes de salida
  const pendingSalaryAmount = Math.round((baseSalary / 30) * Math.min(30, Math.max(0, workedDaysInMonth)));

  // Descuento aporte empleador AFC al fondo de cesantía (Art. 13 Ley 19.728) solo en causal 161
  const afcDeduction = (cause.id === '161_1' && isIndefinido) ? Math.min(Number(afcBalanceDeduction) || 0, severanceYearsAmount) : 0;

  // Totales
  const totalGrossSeverance = severanceYearsAmount + substituteNoticeAmount + proportionalVacationAmount + pendingSalaryAmount;
  const totalNetSeverance = Math.max(0, totalGrossSeverance - afcDeduction);

  return {
    cause,
    yearsOfService,
    monthsTotal,
    lastGrossSalary,
    severanceYearsAmount,
    substituteNoticeAmount,
    proportionalVacationAmount,
    pendingSalaryAmount,
    afcDeduction,
    totalGrossSeverance,
    totalNetSeverance,
    totalNetSeveranceWords: numberToSpanishWords(totalNetSeverance)
  };
};

/**
 * Genera el archivo plano TXT oficial compatible con el importador de Previred (delimitado por punto y coma ;)
 */
export const generatePreviredTxtContent = (community, payrollConsolidated, periodMonth, periodYear) => {
  const lines = [];
  const periodMonthStr = String(periodMonth).padStart(2, '0');
  const periodYearStr = String(periodYear);

  payrollConsolidated.slips.forEach(({ worker, calc }) => {
    // Normalizar RUT
    const cleanRut = (worker.rut || '').replace(/\./g, '').trim().toUpperCase();
    const rutParts = cleanRut.split('-');
    const rutNum = rutParts[0] || '0';
    const rutDv = rutParts[1] || '0';

    // Apellidos y Nombres
    const nameParts = (worker.name || '').trim().split(/\s+/);
    const apellidoPaterno = nameParts[0] || 'TRABAJADOR';
    const apellidoMaterno = nameParts.length > 2 ? nameParts[1] : '';
    const nombres = nameParts.length > 2 ? nameParts.slice(2).join(' ') : (nameParts[1] || nameParts[0]);

    // Código AFP
    const afpObj = AFP_RATES_CHILE.find((a) => a.id === worker.afpId) || AFP_RATES_CHILE[0];
    const afpCode = afpObj.code;

    // Código Salud (01 = Fonasa, 02.. = Isapres)
    const isFonasa = !worker.healthId || worker.healthId === 'fonasa';
    const healthCode = isFonasa ? '01' : '02';

    const row = [
      rutNum,
      rutDv,
      apellidoPaterno,
      apellidoMaterno,
      nombres,
      'M',
      '0',
      '01',
      `${periodYearStr}${periodMonthStr}`,
      `${periodYearStr}${periodMonthStr}`,
      '0',
      '0',
      calc.daysWorked,
      '00',
      afpCode,
      calc.totalTaxable,
      calc.afpAmount,
      '0',
      calc.employerSisAmount,
      healthCode,
      calc.totalTaxable,
      calc.healthAmount,
      '0',
      '0',
      calc.totalTaxable,
      calc.afcWorkerAmount,
      calc.employerAfcAmount,
      '0.93',
      calc.employerMutualAmount,
      community?.bankInfo?.rut || '65.184.920-K'
    ];

    lines.push(row.join(';'));
  });

  return lines.join('\r\n');
};
