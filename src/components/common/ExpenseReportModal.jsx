import React,{useRef} from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useCommunity } from '../../context/CommunityContext';
import { formatCLP as money, getMonthName } from '../../utils/formatters';
import { DOMAIN_CONFIG } from '../../config/domains';
import { paidToSupplier, periodCharges } from '../../utils/expenseBilling';
import { PortalCode } from './IndividualExpenseBill';
import stationery from './communityAccounting.css?raw';
import reportStyle from './expenseReport.css?raw';

const dateLabel = value => value?.slice(0,10).split('-').reverse().join('/') || 'Sin fecha';
const total = (list, pick) => list.reduce((sum, item) => sum + (Number(pick(item)) || 0), 0);
const pension = e => /previred|cotizaciones previsionales/i.test([e.provider,e.documentType].join(' '));
function Line({label,value,strong}) {
  return <div className={'line '+(strong?'net':'')}><span>{label}</span><span>{money(value)}</span></div>;
}
function save(content,type,name) {
  const url=URL.createObjectURL(new Blob([content],{type}));
  const link=document.createElement('a');
  link.href=url;link.download=name;link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export const ExpenseReportModal = ({isOpen,onClose,community}) => {
  const {companySettings}=useCommunity();
  const frame=useRef(null);
  if (!isOpen || !community) return null;
  const demo=community.isDemo || window.location.search.includes('demo');
  const name=demo?'Comunidad Demostración ARANPRO':community.name;
  const period=community.activePeriod || {};
  const label=[getMonthName(period.month),period.year].filter(Boolean).join(' de ');
  const cutoff=community.reportClosedAt || new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Santiago'}).format(new Date());
  const expenses=community.expenses || [];
  const groups=new Map();
  for(const expense of expenses){
    const category=expense.fundSource==='fondo_reserva'?'Fondo de reserva':expense.category?.trim() || 'Gastos operacionales generales';
    if(!groups.has(category))groups.set(category,[]);
    groups.get(category).push(expense);
  }
  const charges=periodCharges(community);
  const chargesByExpense=new Map(charges.map(charge=>[charge.expense,charge]));
  const previous=charges.filter(charge=>charge.index>1);
  const base=total(charges,e=>e.amount);
  const reserveRate=community.reserveFundPercentage ?? 5;
  const contribution=Math.round(base*reserveRate/100);
  const spent=total(expenses,e=>e.amount);
  const paid=total(expenses,e=>paidToSupplier(e,cutoff));
  const url=DOMAIN_CONFIG.getResidentLoginUrl(demo?'':community.slug);
  const filename=['Rendicion_Gastos',name,period.year,period.month].filter(Boolean).join('_').replace(/[^\p{L}\d_-]/gu,'_');
  function state(e){
    const payment=paidToSupplier(e,cutoff);
    if(e.status==='pagado' && pension(e) && !(e.pensionProofVerified && e.receiptUrl))return 'Pago por verificar';
    return payment && payment>=Number(e.amount)?'Pagado':payment?'Pago parcial':'Por pagar';
  }
  const proof=e=>e.receiptUrl?'Adjunto':e.hasReceipt?'Registrado':'Sin adjunto';
  const document=<html lang="es"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><base href={window.location.origin+'/'}/><title>{filename}</title><style>{stationery+reportStyle}</style></head>
  <body><main className="sheet report">
    <header className="mast"><div className="identity">{!demo && community.documentLogo && <img className="symbol" src={community.documentLogo} alt="Logo de la comunidad"/>}<div><div className="k">Comunidad</div><b>{name}</b><div className="small">{!demo && community.city}</div></div></div><img className="ap" src="/brand/ARANPRO_logo_horizontal_transparente_trimmed.png" alt="ARANPRO"/></header>
    <div className="period"><h1>Rendición general de gastos comunes</h1><div className="right"><span className="k">Período</span><strong>{label || 'Sin informar'}</strong></div></div>
    <div className="hero"><div><span className="k">Gastos del período</span><strong>{money(spent)}</strong></div><div><span className="k">Pagos registrados</span><strong>{money(paid)}</strong></div><div><span className="k">Pendiente de pago</span><strong>{money(spent-paid)}</strong></div></div>
    <section><div className="row cap"><h2>Facturas, boletas y comprobantes por categoría</h2><span className="small">Estado de los pagos al {dateLabel(cutoff)}</span></div>
    {expenses.length===0 ? <p>Sin gastos registrados en este período.</p> : <table className="detail"><thead><tr>{['Fecha','Proveedor y documento','Concepto / destino','Pago al proveedor','Cobro del mes','Importe total'].map(text=><th key={text}>{text}</th>)}</tr></thead>
    {[...groups].map(([category,items])=><tbody key={category}><tr className="category"><td colSpan="4">{category} · {items.length} {items.length===1?'documento':'documentos'}</td><td colSpan="2">Subtotal {money(total(items,e=>e.amount))}</td></tr>
    {items.map((e,i)=>{const charge=chargesByExpense.get(e), amountPaid=paidToSupplier(e,cutoff), status=state(e);
      return <tr key={e.id || i}><td>{dateLabel(e.date)}</td><td><b>{e.provider || 'Sin proveedor'}</b><small>{e.providerRut}</small><small>{[e.documentType,e.documentNumber,proof(e)].filter(Boolean).join(' · ')}</small></td><td>{e.description}</td>
      <td><b className={'status '+(status==='Pagado'?'settled':'pending')}>{status}</b>{status==='Pago parcial' && <small>Abono {money(amountPaid)}<br/>Saldo {money(e.amount-amountPaid)}</small>}{status==='Pagado' && e.paymentDate && <small>{dateLabel(e.paymentDate)}</small>}</td>
      <td>{!charge?'Con cargo al fondo':charge.count>1?<>{'Cuota 1 de '+charge.count}<small>{money(charge.amount)}</small></>:'Cobro único'}</td><td>{money(e.amount)}</td></tr>;})}</tbody>)}</table>}</section>
    {previous.length>0 && <section><h2>Cuotas de gastos de períodos anteriores</h2>{previous.map(({expense,index,count,amount})=><Line key={expense.id} label={[expense.provider,expense.documentNumber,'Cuota '+index+' de '+count].filter(Boolean).join(' · ')} value={amount}/>)}</section>}
    <section className="twocol"><div><h2>¿En qué se gastó?</h2>{[...groups].map(([group,items])=><Line key={group} label={group} value={total(items,e=>e.amount)}/>)}<Line strong label="Total del período" value={spent}/></div><div className="bank"><h2>¿Qué se distribuye entre las unidades?</h2><Line label="Cobros ordinarios del mes" value={base}/><Line label={'Aporte al fondo de reserva · '+reserveRate+' %'} value={contribution}/><Line strong label="Total a prorratear" value={base+contribution}/><p>Se incluye la cuota que corresponde al mes. Los gastos financiados con el fondo de reserva se detallan por separado.</p></div></section>
    <div className="auth"><img src="/brand/ARANPRO_sello_circular_integral_transparente.png" alt="Sello ARANPRO"/><div><b>Administración delegada</b><span className="small">ARANPRO Gestión Integral</span></div><div className="sign">{companySettings?.signatureDataUrl && <img src={companySettings.signatureDataUrl} alt="Firma"/>}<div className="signature"><b>{companySettings?.adminName || 'Firma de la administración'}</b></div></div></div>
    <aside className="payment-guide"><div><h2>Consulta los respaldos del período</h2><p>Ingresa a <a href={url} target="_blank" rel="noreferrer">portaladministracion.aranpro.cl</a> para revisar los gastos y sus comprobantes adjuntos. Para solicitar un respaldo, indica a la administración el período, el proveedor y el número de documento.</p></div><PortalCode url={url}/></aside>
    <footer className="foot"><span>{name}</span><span>Rendición general · {label}</span></footer></main></body></html>;
  const html='<!doctype html>'+renderToStaticMarkup(document);
  function csv(){
    const headers=['Fecha','Categoría','Proveedor','RUT proveedor','Tipo documento','Folio','Concepto','Estado','Monto documento','Abono registrado','Fecha pago','Referencia','Método','Respaldo','Origen','Visado comité','Recurrente','Cuota','Cobro del período'];
    const records=[...expenses,...previous.map(item=>item.expense)].map(e=>{
      const charge=chargesByExpense.get(e),carry=charge?.index>1;
      return [e.date,e.category,e.provider,e.providerRut,e.documentType,e.documentNumber,e.description,carry?'Cuota anterior':state(e),carry?'':e.amount,carry?'':paidToSupplier(e,cutoff),e.paymentDate,e.paymentReference,e.paymentMethod,proof(e),e.fundSource,e.approvedByCommittee?'Sí':'No',e.isRecurring?'Sí':'No',charge?charge.index+'/'+charge.count:'',charge?.amount ?? 0];
    });
    save('\uFEFF'+[headers,...records].map(row=>row.map(value=>'"'+String(value??'').replaceAll('"','""')+'"').join(',')).join('\r\n'),'text/csv;charset=utf-8',filename+'.csv');
  }
  async function print(){const doc=frame.current.contentDocument;await Promise.all([...doc.images].map(i=>i.decode().catch(()=>{})));frame.current.contentWindow.print();}
  return <div role="dialog" aria-label="Rendición general" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-2" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <div className="flex h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white"><div className="flex flex-wrap items-center gap-4 bg-[#103f32] p-3 text-white text-sm"><strong className="mr-auto">Rendición general · {label}</strong><button onClick={csv}>CSV / Excel</button><button onClick={()=>save(html,'text/html;charset=utf-8',filename+'.html')}>HTML</button><button onClick={print}>Imprimir / Guardar PDF</button><button onClick={onClose}>Cerrar</button></div>
    <iframe title="Rendición general de gastos comunes" className="w-full flex-1 border-0" ref={frame} srcDoc={html}/></div></div>;
};
