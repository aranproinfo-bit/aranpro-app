const clock = value => {
  const m=/^(\d{2}):(\d{2})$/.exec(value||'');
  return m && Number(m[1])<24 && Number(m[2])<60 ? Number(m[1])*60+Number(m[2]) : null;
};
// Cálculo aritmético del ciclo; no determina por sí mismo su autorización legal.
export function summarizeCycleSchedule(rows, length, startDate) {
  const count=Number(length), errors=[], intervals=[], details=[];let total=0;
  if(!Number.isInteger(count)||count<1||count>28) return {errors:['El ciclo debe tener entre 1 y 28 días.'],details:[],weeklyHours:null};
  const startInstant=new Date(`${startDate||''}T00:00:00Z`);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(startDate||'') || Number.isNaN(startInstant.getTime()) || startInstant.toISOString().slice(0,10)!==startDate) errors.push('Indica la fecha de inicio del ciclo.');
  for(let i=0;i<count;i++) {
    const r=rows?.[i]||{};
    if(r.kind==='rest'){details.push(`Día ${i+1}: descanso`);continue;}
    if(r.kind!=='work'){errors.push(`Día ${i+1}: selecciona trabajo o descanso.`);continue;}
    const start=clock(r.start), end=clock(r.end), meal=Number(r.mealMinutes);
    if(start===null||end===null||start===end){errors.push(`Día ${i+1}: indica entrada y salida válidas y distintas.`);continue;}
    if(r.mealMinutes===''||r.mealMinutes==null||!Number.isInteger(meal)||meal<0||!['yes','no'].includes(r.mealIncluded)){errors.push(`Día ${i+1}: indica duración y tratamiento de la colación.`);continue;}
    const span=(end-start+1440)%1440;
    if(meal>span){errors.push(`Día ${i+1}: la colación supera el turno.`);continue;}
    const worked=span-(r.mealIncluded==='no'?meal:0);
    if(worked<=0){errors.push(`Día ${i+1}: el trabajo debe ser mayor que cero.`);continue;}
    if(worked>600) errors.push(`Día ${i+1}: supera 10 horas; requiere revisión de régimen especial.`);
    intervals.push([i*1440+start,i*1440+start+span,i]);total+=worked;
    details.push(`Día ${i+1}: ${r.start} a ${r.end}${end<start?' del día siguiente':''}, colación ${meal} minutos ${r.mealIncluded==='yes'?'imputada':'no imputada'}`);
  }
  if(!intervals.length) errors.push('Agrega al menos un turno de trabajo.');
  for(let a=0;a<intervals.length;a++)for(let b=a+1;b<intervals.length;b++)for(const offset of [0,count*1440,-count*1440]) {
    const [s1,e1,i]=intervals[a],[s2,e2,j]=intervals[b];
    if(s1<e2+offset && s2+offset<e1){errors.push(`Se superponen los turnos de los días ${i+1} y ${j+1}.`);break;}
  }
  return {errors:[...new Set(errors)],totalMinutes:total,weeklyHours:total*7/(count*60),details};
}
