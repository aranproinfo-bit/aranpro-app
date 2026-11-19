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
export function minimumSalaryReference(form, liveMinimum = null) {
  const date=form.fecha_evaluacion, hours=Number(form.horas_semanales_o_promedio), age=ageAt(form.fecha_nacimiento,date);
  if(!date || !Number.isFinite(hours) || hours<=0 || age===null || age===18) return null;
  if(!['Jornada ordinaria general','Jornada parcial'].includes(form.regimen_jornada)) return null;
  if((form.regimen_jornada==='Jornada parcial') !== (hours<=30)) return null;
  const historical2026=date>='2026-05-01' && date<='2026-12-31';
  const liveValid=liveMinimum && liveMinimum.asOf===date && liveMinimum.since<=date && liveMinimum.since?.slice(0,4)===date.slice(0,4) && Number.isFinite(liveMinimum.value) && liveMinimum.value>0 && age>18 && age<=65;
  if(historical2026 && liveValid && liveMinimum.value!==553553) return null;
  if(!historical2026 && !liveValid) return null;
  const full=historical2026 ? (age<18||age>65?412938:553553) : liveMinimum.value;
  const divisor=date>='2028-04-26'?40:date>='2026-04-26'?42:44;
  return { amount:hours<=30?Math.ceil(full*hours/divisor):full, fullAmount:full, hours, age, partial:hours<=30, divisor, source:historical2026?'DT 2026':'Indicadores.cl (fuente informada: DT)' };
}
export function laborContractAlerts(form, liveMinimum = null) {
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
  if (/^\d{4}-\d{2}-\d{2}$/.test(date || '') && date >= '2028-04-26' && hours > 40) {
    alerts.push('La jornada supera 40 horas: revisa el límite general y si existe un régimen especial válido.');
  }
  if(date >= '2026-05-01' && date <= '2026-12-31' && salary>0 && hours>0) {
    const age=ageAt(form.fecha_nacimiento,date);
    if(age===null || age===18) alerts.push('Completa y revisa la edad aplicable antes de calcular el ingreso mínimo de referencia.');
    else if(!['Jornada ordinaria general','Jornada parcial'].includes(form.regimen_jornada)) alerts.push('El mínimo para este régimen requiere revisión específica.');
    else if((form.regimen_jornada==='Jornada parcial') !== (hours<=30)) alerts.push('Revisa la clasificación de jornada parcial y las horas pactadas.');
    else {
      const reference=minimumSalaryReference(form,liveMinimum);
      if(reference && salary<reference.amount) alerts.push(`Sueldo base inferior a la referencia de $${reference.amount.toLocaleString('es-CL')}: revisa edad, jornada y conceptos que legalmente correspondan a sueldo.`);
      if(age<18) alerts.push('El trabajo de adolescentes requiere revisar autorizaciones y condiciones especiales.');
    }
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(date || '') && (date < '2026-05-01' || date > '2026-12-31')) {
    const reference=minimumSalaryReference(form,liveMinimum);
    if(!reference) alerts.push('No hay una referencia automática verificable para este período, edad o régimen; comprueba el ingreso mínimo vigente.');
    else if(salary>0 && salary<reference.amount) alerts.push(`Sueldo base inferior a la referencia de $${reference.amount.toLocaleString('es-CL')}: revisa edad, jornada y conceptos que legalmente correspondan a sueldo.`);
  }
  if(date>='2026-05-01' && date<='2026-12-31' && liveMinimum?.asOf===date && liveMinimum.value!==553553) alerts.push('La fuente en línea y el valor legal registrado difieren; verifica la norma vigente antes de utilizar el cálculo.');
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
