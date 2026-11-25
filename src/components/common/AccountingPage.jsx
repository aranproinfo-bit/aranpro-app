import { ResidentInstallHint } from './ResidentInstallHint';
import React, {useRef} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {PortalCode} from './IndividualExpenseBill';
import {DOMAIN_CONFIG} from '../../config/domains';
import {formatCLP,getMonthName} from '../../utils/formatters';
import css from './communityAccounting.css?raw';

export const periodKey=p=>p?.year && p?.month ? p.year+'-'+String(p.month).padStart(2,'0') : '';
const periodName=key=>key ? getMonthName(Number(key.slice(5)))+' de '+key.slice(0,4) : '';
const date=d=>d?.slice(0,10).split('-').reverse().join('/') || 'Sin informar';
const amount=n=>formatCLP(Math.abs(n));
const balance=n=>n<0?amount(n)+' a favor':amount(n);
export function AccountingPage({community,company,title,reference,hero,children,onClose}) {
 const frame=useRef(null);
 const url=DOMAIN_CONFIG.getResidentLoginUrl(community.slug);
 const doc=<html lang="es"><head><meta charSet="utf-8"/><base href={window.location.origin+'/'}/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>{[title,community.name,reference].filter(Boolean).join(' · ')}</title><style>{css+`
 .sheet h1{font-size:24pt}.sheet section{margin-top:6mm}.sheet table{margin-top:2mm}.sheet td,.sheet th{padding:2mm 1.5mm}.sheet table small{display:block;font-size:8pt;color:#52665b}.ledger td:nth-child(2),.ledger th:nth-child(2){text-align:left;white-space:normal}.sheet .bank{width:100%}.sheet .bank b{display:inline}.sheet .auth{padding-top:4mm}.sheet .hero{padding:4mm}.sheet .hero strong{overflow-wrap:anywhere}.sheet .period{gap:3mm}
 @media print{@page{size:letter;margin:7mm 0}.sheet{height:auto;min-height:264mm;padding-top:0;padding-bottom:0}body{background:white}thead{display:table-header-group}}
 `}</style></head><body><main className="sheet"><header className="mast"><div className="identity">{community.documentLogo && <img className="symbol" src={community.documentLogo} alt="Logo comunidad"/>}<div><span className="k">Comunidad</span><br/><b>{community.name}</b><div className="small">{community.city}</div></div></div><img className="ap" src="/brand/ARANPRO_logo_horizontal_transparente_trimmed.png" alt="ARANPRO"/></header>
 <div className="period"><div><span className="k">Gastos comunes</span><h1>{title}</h1></div><div className="right"><strong>{reference}</strong></div></div><div className="hero">{hero.map(([label,value])=><div key={label}><span className="k">{label}</span><strong>{value}</strong></div>)}</div>{children}
 <div className="auth"><img src="/brand/ARANPRO_sello_circular_integral_transparente.png" alt="Sello ARANPRO"/><div><b>Administración delegada</b><small>ARANPRO Gestión Integral</small></div><div className="sign">{company?.signatureDataUrl && <img src={company.signatureDataUrl} alt="Firma"/>}<div className="signature"><b>{company?.adminName || 'Firma de la administración'}</b></div></div></div>
 <aside className="payment-guide"><div><h2>Consulta tus recibos en el portal</h2><p>Escanea el QR o visita <a href={url} target="_blank" rel="noreferrer">portaladministracion.aranpro.cl</a>. Entra a <b>Mis Pagos y Recibos</b> y selecciona <b>Ver Recibo Oficial</b>.</p><ResidentInstallHint/></div><PortalCode url={url}/></aside><footer className="foot"><span>{community.name}</span><span>{title}</span></footer></main></body></html>;
 async function print(){const doc=frame.current.contentDocument;await Promise.all([...doc.images].map(i=>i.decode().catch(()=>{})));frame.current.contentWindow.print();}
 return <div className="bg-white rounded-xl overflow-hidden w-full max-w-4xl mx-auto"><div className="flex justify-end items-center gap-4 p-3 bg-[#103f32] text-white text-sm font-bold"><button onClick={print}>Imprimir / Guardar PDF</button>{onClose && <button onClick={onClose}>Cerrar</button>}</div><iframe ref={frame} title={title} className="w-full border-0 h-[75vh]" srcDoc={'<!doctype html>'+renderToStaticMarkup(doc)}/></div>;
}
export function PaymentReceipt({payment,community,company,onClose}) {
 const snapshot=payment.accountSnapshot;
 return <div className="fixed inset-0 z-50 bg-slate-900/80 flex items-center justify-center p-3"><AccountingPage community={community} company={company} title="Recibo oficial de pago" reference={payment.receiptFolio ? 'Folio '+payment.receiptFolio : 'Folio sin registrar'} onClose={onClose} hero={[[ 'Monto recibido',amount(payment.amount)],['Fecha del pago',date(payment.date)],['Unidad',payment.unitNumber]]}>
 <section><h2>Constancia de recepción</h2><p>La administración de {community.name} registró un abono de <b>{amount(payment.amount)}</b> en la cuenta de la unidad {payment.unitNumber}{payment.owner?' a nombre de '+payment.owner:''}{snapshot?.period?', correspondiente a '+periodName(snapshot.period):''}.</p></section>
 {snapshot && <section><h2>Cómo quedó la cuenta al registrar el pago</h2><table><thead><tr><th>Movimiento</th><th>Importe</th></tr></thead><tbody><tr><td>Saldo antes del abono</td><td>{balance(snapshot.before)}</td></tr><tr><td>Abono de este recibo</td><td>−{amount(payment.amount)}</td></tr><tr className="sum"><td>{snapshot.after<0?'Saldo a favor después del abono':'Saldo pendiente después del abono'}</td><td>{amount(snapshot.after)}</td></tr></tbody></table></section>}
 <section><h2>Identificación del movimiento</h2><div className="line"><span>Referencia de operación</span><b>{payment.transferNumber || 'Sin registrar'}</b></div>{snapshot?.period && <div className="line"><span>Período del cobro</span><b>{periodName(snapshot.period)}</b></div>}</section></AccountingPage></div>;
}
