import React,{useState} from 'react';
import {useCommunity} from '../../context/CommunityContext';
import {AccountingPage,periodKey} from '../common/AccountingPage';
import {formatCLP,getMonthName} from '../../utils/formatters';

const money=n=>formatCLP(Math.abs(n));
const showDate=d=>d?.slice(0,10).split('-').reverse().join('/') || 'Sin fecha';
export const UnitAccountStatementView=({community,initialUnitId,companySettings})=>{
 const {getUnitFinancials}=useCommunity();
 const [unitId,setUnitId]=useState(initialUnitId);
 const [selected,setSelected]=useState('active');
 const units=community?.units || [];
 const unit=units.find(u=>u.id===unitId) || units[0];
 if(!unit)return <p>Agrega una unidad para consultar su estado de cuenta.</p>;
 const archived=selected==='active'?null:community.periodHistory?.find(p=>periodKey(p)===selected);
 const period=archived || community.activePeriod || {};
 const key=periodKey(period);
 const label=[getMonthName(period.month),period.year].filter(Boolean).join(' de ');
 const historicRows=archived?.allocationRows?.filter(r=>r.unitId ? r.unitId===unit.id : String(r.number)===String(unit.number) && (r.tower||'')===(unit.tower||'') && r.owner===unit.owner);
 const fin=archived ? historicRows?.length===1 && historicRows[0] : getUnitFinancials(unit);
 const actions=<div className="flex flex-wrap gap-4 items-center p-3 bg-white"><label>Unidad <select className="border rounded p-1" value={unit.id} onChange={e=>setUnitId(e.target.value)}>{units.map(u=><option key={u.id} value={u.id}>{u.number} {u.tower} · {u.owner}</option>)}</select></label><label>Período <select className="border rounded p-1" value={selected} onChange={e=>setSelected(e.target.value)}><option value="active">Período activo</option>{community.periodHistory?.map(p=><option key={periodKey(p)} value={periodKey(p)}>{getMonthName(p.month)} {p.year}</option>)}</select></label></div>;
 if(!fin)return <>{actions}<p className="bg-white p-4">Este cierre no conserva el desglose de esta unidad.</p></>;
 const date=archived?showDate(archived.closedAt):new Intl.DateTimeFormat('es-CL',{timeZone:'America/Santiago'}).format(new Date());
 const reports=(community.paymentReports || []).filter(p=>key && p.status==='APROBADO' && p.unitId===unit.id && p.accountSnapshot?.period===key);
 const rows=[];
 let running=(fin.previousDebt||0)-(fin.creditBalance||0);
 const open=running;
 function movement(text,charge,payment,detail='',day=label){
   if(!charge && !payment)return;
   running+=charge-payment;
   rows.push({text,charge,payment,detail,day,balance:running});
 }
 movement('Gasto común del mes',fin.currentCharge,0,'Cuota de la unidad');
 movement('Cargo individual',fin.extraCharge,0,archived?'':unit.extraChargeDescription);
 movement('Cuota de convenio',fin.repactedInstallment,0);
 const reported=reports.reduce((sum,p)=>sum+(Number(p.amount)||0),0);
 if(reported<=fin.paidAmount){
   movement('Abonos sin desglose individual',0,fin.paidAmount-reported);
   for(const p of [...reports].sort((a,b)=>String(a.date).localeCompare(String(b.date))))movement('Pago registrado',0,Number(p.amount),[p.receiptFolio,p.transferNumber].filter(Boolean).join(' · '),showDate(p.date));
 }else movement('Abonos registrados al corte',0,fin.paidAmount);
 const charge=rows.reduce((sum,r)=>sum+r.charge,0);
 const value=n=>n<0?money(n)+' a favor':money(n);
 const periodUnit=archived?historicRows[0]:unit;
 return <>{actions}<AccountingPage community={community} company={companySettings} title="Estado de cuenta" reference={label} hero={[[running<0?'Saldo a favor al corte':'Saldo pendiente al corte',money(running)],['Fecha de corte',date],['Unidad',[periodUnit.number,periodUnit.tower].filter(Boolean).join(' ')]]}>
 <div className="holder"><div><span className="k">Titular</span><b>{periodUnit.owner}</b></div><div><span className="k">Alícuota</span><b>{Number(periodUnit.sharePercentage||0).toLocaleString('es-CL',{maximumFractionDigits:6})} %</b></div>{!archived && period.dueDate && <div><span className="k">Vencimiento</span><b>{showDate(period.dueDate)}</b></div>}</div>
 <section><h2>Movimientos de la cuenta</h2><table className="ledger"><thead><tr>{['Fecha o período','Concepto y referencia','Cargo (+)','Abono (−)','Saldo'].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody><tr><td>Inicio del mes</td><td>Saldo anterior<small>Deuda fuera de convenio {money(fin.previousDebt)} · Crédito {money(fin.creditBalance)}</small></td><td>—</td><td>—</td><td>{value(open)}</td></tr>{rows.map((r,i)=><tr key={i}><td>{r.day}</td><td>{r.text}<small>{r.detail}</small></td><td>{r.charge?money(r.charge):'—'}</td><td>{r.payment?money(r.payment):'—'}</td><td>{value(r.balance)}</td></tr>)}<tr className="sum"><td colSpan="2">Totales y saldo al corte</td><td>{money(charge)}</td><td>{money(fin.paidAmount)}</td><td>{value(running)}</td></tr></tbody></table></section>
 {fin.repactacionActive && <section className="bank"><h2>Convenio vigente</h2><p>Cuota incluida en el período: <b>{money(fin.repactedInstallment)}</b>. Importe de cuotas futuras: <b>{money(Math.max(0,fin.repactacionRemainingBeforeThisMonth-fin.repactedInstallment))}</b>.</p></section>}</AccountingPage></>;
};
