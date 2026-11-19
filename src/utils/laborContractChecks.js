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
function ageAt(birth,date) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(birth||'')||!/^\d{4}-\d{2}-\d{2}$/.test(date||'')||birth>date) return null;
  const b=new Date(`${birth}T00:00:00Z`), d=new Date(`${date}T00:00:00Z`);
  if(Number.isNaN(b.getTime())||b.toISOString().slice(0,10)!==birth||Number.isNaN(d.getTime())||d.toISOString().slice(0,10)!==date) return null;
  return d.getUTCFullYear()-b.getUTCFullYear()-(date.slice(5)<birth.slice(5)?1:0);
}
export function minimumSalaryReference(form) {
  const date=form.fecha_evaluacion, hours=Number(form.horas_semanales_o_promedio), age=ageAt(form.fecha_nacimiento,date);
  if(!date || date<'2026-05-01' || date>'2026-12-31' || !Number.isFinite(hours) || hours<=0 || age===null || age===18) return null;
  if(!['Jornada ordinaria general','Jornada parcial'].includes(form.regimen_jornada)) return null;
  if((form.regimen_jornada==='Jornada parcial') !== (hours<=30)) return null;
  const full=age<18||age>65?412938:553553;
  return { amount:hours<=30?Math.ceil(full*hours/42):full, fullAmount:full, hours, age, partial:hours<=30 };
}
export function laborContractAlerts(form) {
  const alerts=[];
  const hours=Number(form.horas_semanales_o_promedio);
  const salary=Number(form.sueldo_base_monto);
  // La fecha de evaluación es explícita: ingreso, firma y condiciones vigentes pueden diferir.
  const date=form.fecha_evaluacion;
  for(const [key,label] of [['rut_empleador','comunidad'],['rut_representante','representante'],['rut_trabajador','trabajador']]) {
    if(form[key] && !validChileanRut(form[key])) alerts.push(`Revisa el RUT del ${label}: el formato o dígito verificador no coincide.`);
  }
  if (form.horas_semanales_o_promedio !== '' && (!Number.isFinite(hours) || hours <= 0)) alerts.push('La jornada debe ser mayor que cero.');
  if (form.sueldo_base_monto !== '' && (!Number.isFinite(salary) || salary <= 0)) alerts.push('El sueldo base debe ser mayor que cero.');
  if(!date) alerts.push('Indica la fecha para evaluar jornada e ingreso mínimo.');
  if (/^\d{4}-\d{2}-\d{2}$/.test(date || '') && date >= '2026-04-26' && date < '2028-04-26' && hours > 42) {
    alerts.push('La jornada supera 42 horas: revisa el límite general y si existe un régimen especial válido.');
  }
  if(date >= '2026-05-01' && date <= '2026-12-31' && salary>0 && hours>0) {
    const age=ageAt(form.fecha_nacimiento,date);
    if(age===null || age===18) alerts.push('Completa y revisa la edad aplicable antes de calcular el ingreso mínimo de referencia.');
    else if(!['Jornada ordinaria general','Jornada parcial'].includes(form.regimen_jornada)) alerts.push('El mínimo para este régimen requiere revisión específica.');
    else if((form.regimen_jornada==='Jornada parcial') !== (hours<=30)) alerts.push('Revisa la clasificación de jornada parcial y las horas pactadas.');
    else {
      const reference=minimumSalaryReference(form);
      if(reference && salary<reference.amount) alerts.push(`Sueldo base inferior a la referencia de $${reference.amount.toLocaleString('es-CL')}: revisa edad, jornada y conceptos que legalmente correspondan a sueldo.`);
      if(age<18) alerts.push('El trabajo de adolescentes requiere revisar autorizaciones y condiciones especiales.');
    }
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(date || '') && (date < '2026-05-01' || date > '2026-12-31')) {
    alerts.push('El ingreso mínimo de este período no está configurado en esta comprobación; debe verificarse con una fuente vigente.');
  }
  if(form.contractType==='plazo_fijo') {
    if(!form.fecha_inicio_contrato) alerts.push('Indica el inicio de este contrato; no lo confundas con la fecha original de ingreso.');
    if(form.fecha_inicio_contrato && form.fecha_termino_pactada && form.fecha_termino_pactada<form.fecha_inicio_contrato) alerts.push('El término es anterior al inicio de este contrato.');
    if(form.fecha_inicio_contrato && form.fecha_termino_pactada) {
      const d=new Date(`${form.fecha_inicio_contrato}T00:00:00Z`);d.setUTCFullYear(d.getUTCFullYear()+1);
      if(!Number.isNaN(d.getTime()) && form.fecha_termino_pactada>d.toISOString().slice(0,10)) alerts.push('El plazo supera un año: revisa si corresponde la excepción legal y su respaldo.');
    }
    if(form.fixedRenewals==='2+') alerts.push('Una segunda renovación requiere revisar la transformación a contrato indefinido.');
    if(!form.fixedRenewals) alerts.push('Indica el historial de renovaciones para revisar el plazo fijo.');
  }
  return alerts;
}
