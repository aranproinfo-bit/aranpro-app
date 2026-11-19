export const weekDays = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
const minutes = (value) => {
  const m=/^(\d{2}):(\d{2})$/.exec(value||'');
  if(!m||Number(m[1])>23||Number(m[2])>59) return null;
  return Number(m[1])*60+Number(m[2]);
};
// Jornada fija semanal. Los ciclos y jornadas excepcionales se revisan aparte.
export function summarizeWeeklySchedule(rows) {
  const errors=[], intervals=[], details=[]; let total=0;
  for(let i=0;i<7;i++) {
    const r=rows?.[i]; if(!r?.active) continue;
    const start=minutes(r.start), end=minutes(r.end), meal=Number(r.mealMinutes);
    if(start===null||end===null||start===end){errors.push(`${weekDays[i]}: indica inicio y término válidos y distintos.`);continue;}
    if(r.mealMinutes===''||r.mealMinutes==null||!Number.isInteger(meal)||meal<0||!['yes','no'].includes(r.mealIncluded)){errors.push(`${weekDays[i]}: indica minutos y tratamiento de colación.`);continue;}
    const span=(end-start+1440)%1440;
    if(meal>span){errors.push(`${weekDays[i]}: la colación supera el turno.`);continue;}
    const working=span-(r.mealIncluded==='no'?meal:0);
    if(working<=0){errors.push(`${weekDays[i]}: la jornada debe ser mayor que cero.`);continue;}
    if(working>600) errors.push(`${weekDays[i]}: supera 10 horas; revisa si existe un régimen especial aplicable.`);
    const absoluteStart=i*1440+start; intervals.push([absoluteStart,absoluteStart+span,i]);
    total+=working;
    details.push(`${weekDays[i]} ${r.start} a ${r.end}${end<start?' del día siguiente':''}; colación ${meal} minutos ${r.mealIncluded==='yes'?'imputada':'no imputada'} a la jornada`);
  }
  if(!details.length&&!errors.length) errors.push('Agrega al menos un día de trabajo.');
  for(let a=0;a<intervals.length;a++)for(let b=a+1;b<intervals.length;b++)for(const offset of [0,10080,-10080]) {
    const [s1,e1,i]=intervals[a], [s2,e2,j]=intervals[b];
    if(s1<e2+offset&&s2+offset<e1){errors.push(`Se superponen los turnos de ${weekDays[i]} y ${weekDays[j]}.`);break;}
  }
  return {errors:[...new Set(errors)],totalMinutes:total,details,days:details.map((_,idx)=>weekDays[intervals[idx][2]])};
}
