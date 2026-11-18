// Alertas acotadas; no sustituyen la determinación del régimen ni acreditan
// que un contrato pueda firmarse. Fuentes DT: Ley 40 horas y Ord. 307/28.
export function laborContractAlerts(form) {
  const alerts=[];
  const hours=Number(form.horas_semanales_o_promedio);
  const salary=Number(form.sueldo_base_monto);
  const date=form.fecha_real_firma;
  if (form.horas_semanales_o_promedio !== '' && (!Number.isFinite(hours) || hours <= 0)) alerts.push('La jornada debe ser mayor que cero.');
  if (form.sueldo_base_monto !== '' && (!Number.isFinite(salary) || salary <= 0)) alerts.push('El sueldo base debe ser mayor que cero.');
  if (/^\d{4}-\d{2}-\d{2}$/.test(date || '') && date >= '2026-04-26' && date < '2028-04-26' && hours > 42) {
    alerts.push('La jornada supera 42 horas: revisa el límite general y si existe un régimen especial válido.');
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(date || '') && date >= '2026-05-01' && date <= '2026-12-31' && salary > 0 && salary < 553553 && hours >= 42) {
    alerts.push('El sueldo base es inferior al ingreso mínimo general de referencia del período: revisa edad, jornada y normas aplicables.');
  }
  return alerts;
}
