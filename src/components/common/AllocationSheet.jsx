import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { formatCLP, getMonthName } from '../../utils/formatters';
import css from './communityAccounting.css?raw';

export function printAllocationSheet({community, totals, rows, company, unitType, historical}) {
  const period=community.activePeriod || {};
  const expected=totals.grandTotal;
  const issued=rows?.reduce((sum,r)=>sum+r.currentCharge,0) ?? 0;
  const share=rows?.reduce((sum,r)=>sum+Number(r.sharePercentage||0),0) ?? 0;
  const fields=['currentCharge','extraCharge','previousDebt','repactedInstallment','creditBalance','paidAmount','pendingDebt','favorBalance'];
  const headings=['Cuota del mes','Cargos extra','Deuda anterior¹','Cuota convenio','Crédito anterior','Abonos','Saldo a pagar','Saldo a favor'];
  const month=[getMonthName(period.month),period.year].join(' de ');
  const label=(community.billingSplitMode==='equal')?'Partes iguales':'Prorrateo por alícuota';
  const doc=<html lang="es"><head><meta charSet="utf-8"/><base href={window.location.origin+'/'}/><title>{'Planilla de prorrateo · '+community.name+' · '+month}</title><style>{css+`
    @page{size:letter landscape;margin:7mm 0}body{background:white}.sheet{display:block;width:279.4mm;height:auto;min-height:0;padding:0 12mm}.period h1{font-size:20pt}.hero{grid-template-columns:1fr 1fr 1fr}.hero div:first-child strong{font-size:22pt}section{margin-top:3mm}.small{margin:1mm 0 2mm}table small{display:block;color:#50675e}table td,table th{font-size:9pt;padding:1.4mm}.signrow{display:flex;justify-content:space-between;align-items:flex-end;margin-top:6mm;break-inside:avoid}.signrow div{width:30%;text-align:center}.signrow b{display:block;border-top:1px solid #779483;padding-top:1mm}.signrow img{height:12mm;max-width:36mm;object-fit:contain}.twocol{break-inside:avoid}thead{display:table-header-group}
  `}</style></head><body><main className="sheet"><header className="mast"><div className="identity">{community.documentLogo && <img className="symbol" src={community.documentLogo} alt="Logo comunidad"/>}<div><span className="k">Comunidad</span><br/><b>{community.name}</b><div className="small">{community.city}</div></div></div><img className="ap" src="/brand/ARANPRO_logo_horizontal_transparente_trimmed.png" alt="ARANPRO"/></header>
  <div className="period"><h1>Planilla general de prorrateo</h1><div className="right"><span className="k">Período de cobro</span><strong>{month}</strong></div></div>
  <div className="hero"><div><span className="k">Total a distribuir</span><strong>{formatCLP(expected)}</strong></div><div><span className="k">Cuotas registradas</span><strong>{rows?formatCLP(issued):'Sin detalle'}</strong></div><div><span className="k">Diferencia de emisión</span><strong>{rows?formatCLP(issued-expected):'Sin detalle'}</strong></div></div>
  <section><h2>Distribución y saldo por unidad</h2>{rows ? <><p className="small">{label} · {rows.length} unidades · Montos en pesos chilenos</p><table><thead><tr>{['Unidad y titular','Alícuota',...headings].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}><td><b>{unitType} {r.number} {r.tower}</b><small>{r.owner}</small></td><td>{Number(r.sharePercentage||0).toLocaleString('es-CL',{maximumFractionDigits:6})} %</td>{fields.map(k=><td key={k}>{r[k]?formatCLP(r[k]):'—'}</td>)}</tr>)}<tr className="sum"><td>Total</td><td>{share.toLocaleString('es-CL',{maximumFractionDigits:6})} %</td>{fields.map(k=><td key={k}>{formatCLP(rows.reduce((sum,r)=>sum+(r[k]||0),0))}</td>)}</tr></tbody></table><p className="small">¹ Deuda anterior fuera de convenio. La cuota del convenio corresponde al importe exigible del período.</p></>:<p>Este cierre histórico conserva los totales generales. El detalle por unidad no quedó archivado.</p>}</section>
  <section className="twocol"><div><h2>Origen del monto distribuido</h2>{[['Cobros ordinarios del mes',expected-totals.reserveFundAmount],['Aporte al fondo de reserva',totals.reserveFundAmount],['Total a prorratear',expected]].map(([text,value])=><div className="line" key={text}><span>{text}</span><b>{formatCLP(value)}</b></div>)}</div><div className="bank"><h2>Control de emisión</h2><p>{rows ? (issued===expected?'La suma de las cuotas coincide con el monto a distribuir.':'La diferencia corresponde a las cuotas registradas menos el total a distribuir. Revise la distribución y el redondeo por unidad.') : 'Resumen del período archivado.'} Los abonos y créditos se aplican a la cuenta de cada unidad.</p></div></section>
  <div className="signrow"><div><img src="/brand/ARANPRO_sello_circular_integral_transparente.png" alt="Sello ARANPRO"/>{!historical && company?.signatureDataUrl && <img src={company.signatureDataUrl} alt="Firma"/>}<b>{historical?'Administración':company?.adminName || 'Administración delegada'}</b></div><div><b>Visto bueno del comité</b></div></div><footer className="foot"><span>{community.name}</span><span>Planilla general · Administración y comité</span></footer></main></body></html>;
  const popup=window.open('','_blank');
  if(!popup){window.alert('Permite abrir la vista de impresión para esta aplicación.');return;}
  popup.opener=null;
  popup.document.open();popup.document.write('<!doctype html>'+renderToStaticMarkup(doc));popup.document.close();
  Promise.all([...popup.document.images].map(i=>i.decode().catch(()=>{}))).then(()=>{if(!popup.closed)popup.print();});
}
