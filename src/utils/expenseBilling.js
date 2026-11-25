// An invoice is an expense once. A later installment only contributes to that month's billing.
export function periodCharges(community) {
  const { year, month } = community.activePeriod || {};
  const result = [];
  function add(expense, index) {
    if (expense.fundSource === 'fondo_reserva') return;
    const count = Math.max(1, Number(expense.billingInstallments) || 1);
    if (index < 1 || index > count) return;
    const amount = Number(expense.amount) || 0;
    const base = Math.trunc(amount / count);
    result.push({ expense, index, count, amount: base + (index <= amount % count ? 1 : 0) });
  }
  for (const expense of community.expenses || []) add(expense, 1);
  for (const expense of community.historicalExpenses || []) {
    if (!(expense.billingInstallments > 1) || !expense.period) continue;
    const [startYear, startMonth] = expense.period.split('-').map(Number);
    const elapsed = (year - startYear) * 12 + Number(month) - startMonth;
    if (elapsed > 0) add(expense, elapsed + 1);
  }
  return result;
}
export function paidToSupplier(expense, cutoff) {
  if (expense.paymentDate && cutoff && expense.paymentDate.slice(0,10) > cutoff) return 0;
  if (expense.status === 'pagado') return Number(expense.amount) || 0;
  if (expense.status === 'parcial') return Math.min(Number(expense.amount), Math.max(0, Number(expense.partialPaid) || 0));
  return 0;
}
