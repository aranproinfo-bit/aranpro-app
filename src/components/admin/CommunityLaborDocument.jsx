import React, { useState } from 'react';
import { printCommunityLabor } from '../../utils/communityLaborPrint';
import { validChileanRut } from '../../utils/laborContractChecks';
import { CommunityLaborHeader, CommunityLaborFooter } from './CommunityLaborStationery';
import LaborContractSignatures from './LaborContractSignatures';

export function FieldGroup({title, fields, form, patch, open=false}) {
  return <details open={open || undefined} className="rounded-xl border border-slate-200 bg-white p-4">
    <summary className="cursor-pointer font-bold text-[#0f3d2e]">{title}</summary>
    <div className="grid gap-3 sm:grid-cols-2 mt-4">{fields.map(([key,label,type='text',options])=><label key={key} className={'block text-sm font-semibold '+(type==='textarea'?'sm:col-span-2':'')}>{label}
      {type==='textarea' ? <textarea aria-label={label} rows={2} className="mt-1 block w-full rounded-lg border p-2 font-normal" value={form[key]??''} onChange={e=>patch(key,e.target.value)}/> :
       type==='select' ? <select aria-label={label} className="mt-1 block w-full rounded-lg border p-2" value={form[key]??''} onChange={e=>patch(key,e.target.value)}><option value="">Seleccionar</option>{options.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select> :
       <input aria-label={label} type={type} step={type==='number'?'any':undefined} className="mt-1 block w-full rounded-lg border p-2 font-normal" value={form[key]??''} onChange={e=>patch(key,e.target.value)}/>}
    </label>)}</div>
  </details>;
}

export function LaborDocument({title, community, settings={}, form, collective=false, issues=[], onClose, editor, children, forceDraft=false, witness, workerCaption, employerKind='community'}) {
  const [signatureToken,setSignatureToken] = useState('');
  const normalize = v => String(v||'').replace(/[.\s-]/g,'').toUpperCase();
  const ready = !forceDraft && issues.length===0;
  const signature = settings.signatureDataUrl || settings.signature || settings.digitalSignature;
  const canSign = ready && !!signature && validChileanRut(form.repRut) && normalize(form.repRut)===normalize(settings.adminRut);
  const token = JSON.stringify([community.id,title,form,signature]);
  const signed = canSign && token===signatureToken;
  const id = 'community-labor-document';
  const print = () => printCommunityLabor(id, 'ARANPRO_'+(ready?'':'Borrador_')+title+'_'+(form.worker || community.name));
  return <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-3 sm:p-6"><div className="mx-auto max-w-5xl space-y-4 rounded-2xl bg-white p-4 sm:p-6">
    <header className="flex items-start justify-between border-b pb-3"><div><span className="text-xs font-bold text-emerald-800">{employerKind==='company' ? 'RECURSOS HUMANOS · MI OFICINA' : 'RECURSOS HUMANOS · COMUNIDADES'}</span><h2 className="text-xl font-bold">{title}</h2><p className="text-sm">{community.name}{form.worker && ' · '+form.worker}</p></div><button type="button" onClick={onClose} className="rounded-lg border px-3 py-2">Cerrar</button></header>
    {editor}
    {issues.length>0 && <details className="rounded-lg bg-amber-50 px-4 py-2 text-sm"><summary>{issues.length} antecedentes por revisar</summary><ul className="list-disc pl-5">{[...new Set(issues)].map(text=><li key={text}>{text}</li>)}</ul></details>}
    {canSign && <label className="block text-sm"><input type="checkbox" checked={signed} onChange={e=>setSignatureToken(e.target.checked?token:'')}/> Incorporar mi firma cargada en este documento</label>}
    <button className="rounded-lg bg-[#0f3d2e] px-4 py-2 font-bold text-white" type="button" onClick={print}>{ready?'Imprimir para suscripción':'Imprimir borrador de revisión'}</button>
    <div className="rounded-lg bg-slate-100 p-2 sm:p-4"><div id={id}><article className="community-paper mx-auto max-w-[800px] space-y-2 bg-white p-6 text-sm text-slate-800" style={{overflowWrap:'anywhere'}}>
      <CommunityLaborHeader settings={settings} community={community} employerKind={employerKind} badge="INSTRUMENTO LABORAL" title={title}/>
      <h2 style={{fontSize:'15pt',fontWeight:700,color:'#0f3d2e'}}>{title}</h2>
      {!ready && <p style={{fontSize:'10pt',color:'#844311',fontWeight:700}}>BORRADOR DE REVISIÓN · {collective?'PENDIENTE DE ADOPCIÓN':'NO APTO PARA FIRMA'}</p>}
      {children}
      <LaborContractSignatures collective={collective} witness={witness} workerCaption={workerCaption} employerKind={employerKind} settings={settings}
        form={{nombre_trabajador:form.worker,rut_trabajador:form.workerRut,nombre_representante:form.rep,rut_representante:form.repRut,calidad_representante:form.role}} includeSignature={signed}/>
      <div hidden data-footer-template=""><CommunityLaborFooter settings={settings} title={(ready?'':'Borrador · ')+title}/></div>
    </article></div></div>
  </div></div>;
}
export function Clause({title, children}) {
  return <section><h3 style={{fontSize:'11pt',fontWeight:700,color:'#0f3d2e',margin:'12px 0 3px',breakAfter:'avoid'}}>{title}</h3>{children}</section>;
}

