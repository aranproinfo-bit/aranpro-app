const DAY=86400000;
function parse(value) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
  const d=new Date(value+'T00:00:00Z');
  return Number.isFinite(+d) && d.toISOString().slice(0,10)===value?d:null;
}
function afterMonths(date,months) {
  const month=date.getUTCMonth()+months, year=date.getUTCFullYear();
  return new Date(Date.UTC(year,month,Math.min(date.getUTCDate(),new Date(Date.UTC(year,month+1,0)).getUTCDate())));
}
export function settlementFigures(f) {
  const issues=[];
  const start=parse(f.entry),end=parse(f.end), notice=parse(f.notice),payment=parse(f.paymentDate);
  const employerDismissal=f.cause==='161_1';
  if(!start || !end || end<start) issues.push('Revisa el ingreso original y la fecha de separación.');
  const value=(k,label,optional=false)=>{
    if(optional && (f[k]==null || f[k]==='')) return 0;
    const n=Number(f[k]);
    if((!optional && (f[k]==null||f[k]===''))||!Number.isFinite(n)||n<0){issues.push('Revisa «'+label+'».');return 0;}
    return n;
  };
  const days=value('days','días remunerados del período final');
  if(!Number.isInteger(days)||days>30||(end&&days>end.getUTCDate())) issues.push('Los días de este mes deben coincidir con la fecha de separación. Registra diferencias anteriores como partidas separadas.');
  const vacationDays=value('vacDays','saldo de feriado en días hábiles');
  const balanceProof=String(f.vacProof||'').trim();
  if(!balanceProof) issues.push('Identifica el registro de feriados, días usados y proporcionales.');
  const holidayList=String(f.holidays||'').split(/[,;\s]+/).filter(Boolean);
  if(holidayList.some(h=>!parse(h))) issues.push('Escribe cada feriado como AAAA-MM-DD.');
  const holidays=new Set(holidayList);
  let remaining=vacationDays,calendarDays=0;
  if(vacationDays>10000) issues.push('El saldo de feriado requiere revisión especial.');
  if(end && vacationDays<=10000) {
    const cursor=new Date(end);
    while(remaining>0.00000001) {
      cursor.setUTCDate(cursor.getUTCDate()+1);
      const working=![6,0].includes(cursor.getUTCDay())&&!holidays.has(cursor.toISOString().slice(0,10));
      const step=working?Math.min(1,remaining):1;
      calendarDays+=step;
      if(working) remaining-=step;
    }
  }
  let deadline='';
  if(end) {
    const cursor=new Date(end);
    for(let daysLeft=10;daysLeft>0;) {
      cursor.setUTCDate(cursor.getUTCDate()+1);
      if(cursor.getUTCDay()!==0&&!holidays.has(cursor.toISOString().slice(0,10))) daysLeft--;
    }
    deadline=cursor.toISOString().slice(0,10);
  }
  let months=0, tail=0, units=0;
  if(start && end && end>=start) {
    months=12*(end.getUTCFullYear()-start.getUTCFullYear())+end.getUTCMonth()-start.getUTCMonth();
    if(afterMonths(start,months)>end) months--;
    tail=Math.round((end-afterMonths(start,months))/DAY);
    const years=Math.floor(months/12);
    if(years>=1) units=Math.min(11,years+Number(end>afterMonths(start,12*years+6)));
  }
  const wage=value('wage','remuneración fija mensual'),vacBase=value('vacBase','remuneración íntegra para feriado',!vacationDays);
  if(wage<=0 || (vacationDays>0&&vacBase<=0)) issues.push('Verifica las bases de remuneración y feriado.');
  let cappedBase=0;
  if(employerDismissal) {
    const base=value('iasBase','base artículo 172'), uf=value('uf','valor de la UF');
    if(base<=0 || uf<=0) issues.push('Verifica la base del artículo 172 y la UF del mes anterior al pago.');
    cappedBase=Math.min(base,90*uf);
    if(f.notice && (!notice || (end && notice>end))) issues.push('El aviso debe ser una fecha válida anterior o igual a la separación.');
    if(f.entry<'1981-08-14') issues.push('La relación anterior al 14 de agosto de 1981 requiere cálculo del régimen transitorio.');
  }
  const ias=employerDismissal?Math.round(units*cappedBase):0;
  const noticePay=employerDismissal&&(!notice||!end||(end-notice)/DAY<30)?Math.round(cappedBase):0;
  const afc=employerDismissal?value('afc','aporte empleador AFC',true):0;
  const validAfc=afc>0&&String(f.afcProof||'').trim() && afc<=ias;
  if(afc>0&&!validAfc) issues.push('Para imputar AFC, identifica el certificado del aporte empleador y verifica que el monto no exceda la indemnización por años.');
  if(!payment || (end&&payment<end)) issues.push('Indica la fecha prevista de puesta a disposición posterior o igual a la separación.');
  const rows=[
    ['Remuneración fija del período final',days+' días × '+wage+' / 30',Math.round(wage/30*days)],
    ['Feriado legal y proporcional',Number(calendarDays.toFixed(5))+' días corridos × '+vacBase+' / 30',Math.round(calendarDays*vacBase/30)]
  ];
  if(employerDismissal) rows.push(['Años de servicio',units+' unidades × '+cappedBase,ias],['Aviso previo',noticePay?'Aviso omitido o inferior a 30 días':'Aviso de al menos 30 días',noticePay]);
  const discountRows=[], priorRows=[];
  if(validAfc) discountRows.push(['Imputación aporte empleador AFC',f.afcProof,afc]);
  for(const line of f.lines || []) {
    if(!['haber','descuento','abono'].includes(line.type)||!String(line.label||'').trim()||!String(line.proof||'').trim()||!Number.isSafeInteger(Number(line.amount))||Number(line.amount)<=0){issues.push('Completa el concepto, período, respaldo y monto de cada partida adicional.');continue;}
    const target=line.type==='haber'?rows:line.type==='abono'?priorRows:discountRows;
    target.push([line.label,line.proof,Number(line.amount)]);
  }
  const sum=list=>list.reduce((a,r)=>a+r[2],0);
  const total=sum(rows),deductions=sum(discountRows),paid=sum(priorRows),net=total-deductions-paid;
  if(net<0) issues.push('Los descuentos y abonos exceden las obligaciones detalladas.');
  const ufDate=payment?new Date(Date.UTC(payment.getUTCFullYear(),payment.getUTCMonth(),0)).toISOString().slice(0,10):'';
  return {issues,months,tail,units,rows,discountRows,priorRows,total,deductions,paid,net,calendarDays,deadline,ufDate};
}

