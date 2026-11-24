// Validaciones del borrador de pacto general. No reemplazan la revisión de
// regímenes especiales, sueldo mínimo, beneficios ni el registro de asistencia.
const parseDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
  const [year, month, day] = value.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day ? d : null;
};

// El fin es inclusivo: se compara el día siguiente con el límite de tres meses.
const addCalendarMonths = (date, months) => {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + months;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(date.getUTCDate(), lastDay)));
};

export function validateOvertimeDraft(data) {
  const errors = [];
  const required = [
    ['employerName', 'Indica la comunidad empleadora.'],
    ['employerRut', 'Indica el RUT de la comunidad empleadora.'],
    ['employerAddress', 'Indica el domicilio de la comunidad empleadora.'],
    ['representativeName', 'Indica el nombre de quien representa al empleador.'],
    ['representativeRut', 'Indica el RUT de quien representa al empleador.'],
    ['workerName', 'Indica el nombre de la persona trabajadora.'],
    ['workerRut', 'Indica el RUT de la persona trabajadora.'],
    ['city', 'Indica la comuna de firma.'],
    ['schedule', 'Describe la distribución de la jornada ordinaria.'],
    ['need', 'Describe la necesidad temporal concreta.'],
    ['tasks', 'Describe las tareas extraordinarias.'],
    ['attendanceSystem', 'Indica el sistema de control de asistencia.'],
  ];
  for (const [key, message] of required) if (!String(data[key] ?? '').trim()) errors.push(message);
  const signed = parseDate(data.signedDate), start = parseDate(data.startDate), end = parseDate(data.endDate);
  if (!signed) errors.push('Indica una fecha real de firma válida.');
  if (!start) errors.push('Indica una fecha de inicio válida.');
  if (!end) errors.push('Indica una fecha de término válida.');
  if (start && signed && start < signed) errors.push('El inicio del pacto nuevo no puede ser anterior a su firma.');
  if (start && end && end < start) errors.push('El término no puede ser anterior al inicio.');
  if (start && end && end >= start) {
    const dayAfterEnd = new Date(end.getTime() + 86400000);
    if (dayAfterEnd > addCalendarMonths(start, 3)) errors.push('La vigencia no puede exceder tres meses calendario.');
  }
  if (/^(necesidades? operacionales?|continuidad del servicio)[.\s]*$/i.test(String(data.need || '').trim())) errors.push('Explica los hechos concretos y el período de la necesidad temporal.');
  const hours = Number(data.weeklyHours);
  if (!Number.isFinite(hours) || hours <= 0) errors.push('Indica la jornada semanal aplicable.');
  const base = Number(data.monthlySalaryBase);
  if (!Number.isFinite(base) || base <= 0) errors.push('Indica la base mensual computable y verifica sus componentes.');
  if (data.specialSchedule) errors.push('El régimen especial requiere revisión específica antes de emitir para firma.');
  return errors;
}

// Referencia para sueldo mensual y jornada semanal del régimen general; no
// determina el mínimo aplicable ni reemplaza el examen de beneficios superiores.
export function monthlyOvertimeReference(monthlySalaryBase, weeklyHours, premiumPercent = 50) {
  const base = Number(monthlySalaryBase), hours = Number(weeklyHours), premium = Number(premiumPercent);
  if (!Number.isFinite(base) || base <= 0 || !Number.isFinite(hours) || hours <= 0 || !Number.isFinite(premium) || premium < 50) return null;
  return base * 7 / (30 * hours) * (1 + premium / 100);
}
