// Alertas acotadas; no sustituyen la determinación del régimen ni acreditan
// que un contrato pueda firmarse. Fuentes DT: Ley 40 horas y Ord. 307/28.
export function validChileanRut(value) {
  const rut=String(value||'').replace(/[^0-9kK]/g,'').toUpperCase();
  if(!/^\d{1,8}[0-9K]$/.test(rut) || Number(rut.slice(0,-1))===0) return false;
  let sum=0, multiplier=2;
  for(let i=rut.length-2;i>=0;i--){sum+=Number(rut[i])*multiplier;multiplier=multiplier===7?2:multiplier+1;}
  const remainder=11-(sum%11), check=remainder===11?'0':remainder===10?'K':String(remainder);
  return rut.at(-1)===check;
}
export function laborContractAlerts(form) {
  const alerts=[];
  const hours=Number(form.horas_semanales_o_promedio);
  const salary=Number(form.sueldo_base_monto);
  // Se evalúa la fecha de inicio de la relación, no la de impresión o firma.
  const date=form.fecha_ingreso;
  for(const [key,label] of [['rut_empleador','comunidad'],['rut_representante','representante'],['rut_trabajador','trabajador']]) {
    if(form[key] && !validChileanRut(form[key])) alerts.push(`Revisa el RUT del ${label}: el formato o dígito verificador no coincide.`);
  }
  if (form.horas_semanales_o_promedio !== '' && (!Number.isFinite(hours) || hours <= 0)) alerts.push('La jornada debe ser mayor que cero.');
  if (form.sueldo_base_monto !== '' && (!Number.isFinite(salary) || salary <= 0)) alerts.push('El sueldo base debe ser mayor que cero.');
  if (/^\d{4}-\d{2}-\d{2}$/.test(date || '') && date >= '2026-04-26' && date < '2028-04-26' && hours > 42) {
    alerts.push('La jornada supera 42 horas: revisa el límite general y si existe un régimen especial válido.');
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(date || '') && date >= '2026-05-01' && date <= '2026-12-31' && salary > 0 && salary < 553553 && hours >= 42) {
    alerts.push('El sueldo base es inferior al ingreso mínimo general de referencia del período: revisa edad, jornada y normas aplicables.');
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(date || '') && (date < '2026-05-01' || date > '2026-12-31')) {
    alerts.push('El ingreso mínimo de este período no está configurado en esta comprobación; debe verificarse con una fuente vigente.');
  }
  return alerts;
}
