// An invoice is an expense once. A later installment only contributes to that month's billing.
export function periodCharges(community) {
  const { year, month } = community.activePeriod || {};
  const result = [];

  function add(expense, index) {
    // Si es gasto ordinario puro de Fondo de Reserva (sin reposición), no se factura en el gasto común mensual.
    // Pero si tiene reposición o es recuperación de fondos en cuotas (isFundRecovery / reimburseFund), SÍ se cobra la cuota mensual.
    const isRecovery = Boolean(expense.isFundRecovery || expense.reimburseFund);
    if (expense.fundSource === 'fondo_reserva' && !isRecovery) return;

    const count = Math.max(1, Number(expense.billingInstallments) || 1);
    if (index < 1 || index > count) return;
    const amount = Number(expense.amount) || 0;
    const base = Math.trunc(amount / count);
    const installmentAmount = base + (index <= amount % count ? 1 : 0);

    result.push({
      expense,
      index,
      count,
      amount: installmentAmount,
      isFundRecovery: isRecovery,
      recoveryFund: expense.recoveryFund || (expense.fundSource === 'fondo_reserva' ? 'fondo_reserva' : 'fondo_operacional'),
      projectName: expense.recoveryProjectName || expense.description || 'Trabajo Mayor'
    });
  }

  // 1. Gastos del período activo (cuota 1 o cuota según inicio)
  for (const expense of community.expenses || []) {
    if (expense.recoveryStartPeriod && expense.period) {
      const [startYear, startMonth] = expense.recoveryStartPeriod.split('-').map(Number);
      const elapsed = (Number(year) - startYear) * 12 + Number(month) - startMonth;
      if (elapsed >= 0) add(expense, elapsed + 1);
    } else {
      add(expense, 1);
    }
  }

  // 2. Gastos históricos con cuotas diferidas que impactan al período activo
  for (const expense of community.historicalExpenses || []) {
    const installments = Math.max(1, Number(expense.billingInstallments) || 1);
    if (installments <= 1) continue;

    const startStr = expense.recoveryStartPeriod || expense.period;
    if (!startStr) continue;

    const [startYear, startMonth] = startStr.split('-').map(Number);
    const elapsed = (Number(year) - startYear) * 12 + Number(month) - startMonth;
    if (elapsed >= 0 && elapsed < installments) {
      add(expense, elapsed + 1);
    }
  }

  return result;
}

export function paidToSupplier(expense, cutoff) {
  if (expense.paymentDate && cutoff && expense.paymentDate.slice(0, 10) > cutoff) return 0;
  if (expense.status === 'pagado') return Number(expense.amount) || 0;
  if (expense.status === 'parcial') return Math.min(Number(expense.amount), Math.max(0, Number(expense.partialPaid) || 0));
  return 0;
}

/**
 * Obtiene el listado consolidado de Trabajos Mayores con Recuperación de Fondos en Cuotas.
 * Analiza tanto los gastos del período activo como los archivados en el histórico.
 */
export function getMajorWorksRecoveryList(community) {
  if (!community) return [];
  const { year: activeYear, month: activeMonth } = community.activePeriod || {};

  // Recopilar todos los gastos identificados como recuperación de fondos o con cuotas > 1 y financiamiento de fondos
  const candidateExpenses = [
    ...(community.expenses || []),
    ...(community.historicalExpenses || [])
  ];

  const map = new Map();
  for (const exp of candidateExpenses) {
    const isRecovery = Boolean(exp.isFundRecovery || exp.reimburseFund || (exp.billingInstallments > 1 && exp.fundSource === 'fondo_reserva'));
    if (!isRecovery) continue;
    if (map.has(exp.id)) continue;
    map.set(exp.id, exp);
  }

  const results = [];
  for (const exp of map.values()) {
    const totalAmount = Number(exp.amount) || 0;
    const totalInstallments = Math.max(1, Number(exp.billingInstallments) || 1);
    const startStr = exp.recoveryStartPeriod || exp.period || exp.date?.slice(0, 7) || `${activeYear}-${String(activeMonth).padStart(2, '0')}`;
    const [startYear, startMonth] = startStr.split('-').map(Number);

    // Calcular en qué cuota nos encontramos respecto al período activo
    const elapsedMonths = activeYear && activeMonth && startYear && startMonth
      ? (Number(activeYear) - startYear) * 12 + Number(activeMonth) - startMonth
      : 0;

    const currentInstallmentIndex = elapsedMonths >= 0 ? Math.min(totalInstallments, elapsedMonths + 1) : 0;
    const baseInstallment = Math.trunc(totalAmount / totalInstallments);

    // Calcular cuánto se ha recaudado hasta el período activo (incluyendo la cuota actual si ya se emitió)
    const installmentsChargedCount = Math.max(0, Math.min(totalInstallments, elapsedMonths + 1));
    const totalRecovered = Math.min(totalAmount, installmentsChargedCount * baseInstallment);
    const remainingToRecover = Math.max(0, totalAmount - totalRecovered);
    const percentRecovered = totalAmount > 0 ? Math.min(100, Math.round((totalRecovered / totalAmount) * 100)) : 100;

    let status = 'en_recuperacion';
    if (elapsedMonths < 0) {
      status = 'programado'; // Inicia en un mes futuro
    } else if (installmentsChargedCount >= totalInstallments && remainingToRecover === 0) {
      status = 'completado'; // Fondo 100% repuesto
    }

    results.push({
      id: exp.id,
      expense: exp,
      projectName: exp.recoveryProjectName || exp.description || 'Obra Mayor',
      provider: exp.provider || 'Contratista no informado',
      providerRut: exp.providerRut || '',
      documentNumber: exp.documentNumber || '',
      documentType: exp.documentType || 'Factura Electrónica',
      date: exp.date || exp.paymentDate || '',
      totalAmount,
      totalInstallments,
      currentInstallmentIndex,
      monthlyInstallmentAmount: baseInstallment,
      startPeriod: startStr,
      installmentsChargedCount,
      totalRecovered,
      remainingToRecover,
      percentRecovered,
      status,
      recoveryFund: exp.recoveryFund || (exp.fundSource === 'fondo_reserva' ? 'fondo_reserva' : 'fondo_operacional'),
      agreementReference: exp.recoveryAgreementNumber || 'Acuerdo de Asamblea / Comité',
      receiptUrl: exp.receiptUrl || '',
      fileName: exp.fileName || ''
    });
  }

  return results;
}

/**
 * Genera la tabla de amortización y cronograma mes a mes para un trabajo mayor en cuotas.
 */
export function generateInstallmentSchedule(majorWork) {
  const { totalAmount, totalInstallments, startPeriod } = majorWork;
  const [sYear, sMonth] = (startPeriod || '2026-01').split('-').map(Number);
  const base = Math.trunc(totalAmount / totalInstallments);
  const remainder = totalAmount % totalInstallments;

  const schedule = [];
  let accumulated = 0;

  for (let i = 1; i <= totalInstallments; i++) {
    const monthNum = ((sMonth - 1 + (i - 1)) % 12) + 1;
    const yearNum = sYear + Math.floor((sMonth - 1 + (i - 1)) / 12);
    const periodKey = `${yearNum}-${String(monthNum).padStart(2, '0')}`;
    const amount = base + (i <= remainder ? 1 : 0);
    accumulated += amount;

    schedule.push({
      installmentNumber: i,
      periodKey,
      year: yearNum,
      month: monthNum,
      amount,
      accumulated,
      remaining: Math.max(0, totalAmount - accumulated)
    });
  }

  return schedule;
}
