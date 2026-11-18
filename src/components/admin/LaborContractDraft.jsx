import React, { useState } from 'react';
import blocks from './laborContractMaster.json';
import { laborRoleProfiles, detectLaborRole } from './laborRoleProfiles';
import { formatCLP } from '../../utils/formatters';
import { printDocumentDirectly } from '../../utils/printDocument';

const fields = [
  ['comuna_firma','Comuna de firma'],['fecha_real_firma','Fecha de firma','date'],['correo_empleador','Correo del empleador o sin correo'],
  ['calidad_representante','Calidad del representante'],['respaldo_representacion','Respaldo de representación'],
  ['nacionalidad_trabajador','Nacionalidad del trabajador'],['fecha_nacimiento','Fecha de nacimiento','date'],['domicilio_trabajador','Domicilio del trabajador'],['correo_trabajador','Correo del trabajador o sin correo'],
  ['fecha_ingreso','Fecha original de ingreso','date'],['cargo_jefatura','Jefatura'],['responsable_cobertura','Responsable de cobertura'],
  ['horas_semanales_o_promedio','Horas semanales o promedio','number'],['regimen_jornada','Régimen de jornada'],['dias_trabajo','Días de trabajo'],['tabla_turnos','Horario, colación y descansos'],['sistema_asistencia','Sistema de asistencia'],
  ['dia_o_regla_de_pago','Día o regla de pago'],['medio_pago','Medio de pago'],['lugar_pago','Lugar de pago o no aplica'],['sueldo_base_monto','Sueldo base mensual','number'],
  ['bonos_pactados_con_monto_y_devengo','Bonos y condiciones o no aplica'],['asignaciones_con_monto_y_condiciones','Asignaciones y condiciones o no aplica'],['clausula_gratificacion_aplicable','Régimen de gratificación']
];
const printStyles=`@page{size:letter portrait;margin:19mm 17mm;@top-right{content:"ARANPRO · INSTRUMENTO LABORAL";font:8px Arial;color:#0f3d2e}@bottom-left{content:"BORRADOR · NO APTO PARA FIRMA";font:8px Arial;color:#62766d}@bottom-right{content:"Página " counter(page);font:8px Arial;color:#62766d}}@page:first{@top-right{content:none}}.print-wrapper{box-shadow:none!important;padding:0!important}.labor-contract-doc{font-family:Arial,sans-serif!important;color:#1c2925!important;font-size:10.5pt!important;line-height:1.45!important}.labor-contract-doc h2{font-size:15pt!important;color:#0f3d2e!important}.labor-contract-doc h3{font-size:11pt!important;color:#0f3d2e!important;break-after:avoid!important}.labor-contract-doc p{orphans:3;widows:3}.labor-contract-doc .signatures{break-inside:avoid;margin-top:28px}.aranpro-print-watermark{display:none!important}`;
const printableDate=x=>/^\d{4}-\d{2}-\d{2}$/.test(String(x||''))?x.split('-').reverse().join('/'):(x||'');
const str=x=>String(x??'').trim();

const firstDuty = blocks.findIndex(b => b.type === 'heading' && b.text.startsWith('Segundo.'));
const afterDuties = blocks.findIndex(b => b.type === 'heading' && b.text.startsWith('Tercero.'));
const conserjeDuties = blocks.slice(firstDuty + 1, afterDuties).map(b => b.text).join('\n\n');
const dutiesFor = key => laborRoleProfiles[key]?.duties === null ? conserjeDuties : (laborRoleProfiles[key]?.duties || []).join('\n\n');
const registeredAmounts = (entries) => entries.filter(([,n])=>Number(n)>0).map(([label,n])=>`${label}: ${formatCLP(Number(n))} (periodicidad y condiciones por confirmar)`).join('; ');

export default function LaborContractDraft({worker,community,settings={},onClose}) {
  const [profile,setProfile]=useState(()=>detectLaborRole(worker.role));
  const [duties,setDuties]=useState(()=>dutiesFor(detectLaborRole(worker.role)));
  const [additionalTerms,setAdditionalTerms]=useState('');
  const [form,setForm]=useState(()=>({comuna_firma:community.city||'',domicilio_trabajador:worker.address||'',correo_trabajador:worker.email||'',fecha_ingreso:worker.startDate||'',horas_semanales_o_promedio:worker.weeklyHours||'',tabla_turnos:worker.shift ? `${worker.shift}; [colación y descansos pendientes]` : '', sueldo_base_monto:worker.baseSalary||'', bonos_pactados_con_monto_y_devengo:registeredAmounts([['Bono nocturno',worker.contractualNightBonus],['Bono de responsabilidad',worker.contractualResponsibilityBonus]]), asignaciones_con_monto_y_condiciones:registeredAmounts([['Colación',worker.allowanceColacion],['Movilización',worker.allowanceMovilizacion]]), contractType: /indefinid/i.test(worker.contractType||'') ? 'indefinido' : /plazo fijo/i.test(worker.contractType||'') ? 'plazo_fijo' : ''}));
  const update=(key,value)=>setForm(s=>({...s,[key]:value}));
  const fixed={nombre_empleador:community.bankInfo?.holderName||community.name,rut_empleador:community.bankInfo?.rut,domicilio_empleador:community.address,nombre_representante:settings.adminName,rut_representante:settings.adminRut,nombre_trabajador:worker.name,rut_trabajador:worker.rut,nombre_cargo:worker.role,nombre_condominio:community.name,direccion_centro:community.address,comuna_centro:community.city};
  const variables={...fixed,...form};
  for(const k of ['fecha_real_firma','fecha_ingreso','fecha_nacimiento','fecha_termino_pactada']) variables[k]=printableDate(variables[k]);
  if(Number(form.sueldo_base_monto)>0) variables.sueldo_base_monto=formatCLP(Number(form.sueldo_base_monto)).replace(/^\$/, '');
  const fill=text=>text.replace(/\{\{([^}]+)\}\}/g,(_,k)=>str(variables[k])||'[PENDIENTE]');
  const issues=[...fields.filter(([key])=>!str(form[key])).map(([,label])=>label),...Object.entries(fixed).filter(([,value])=>!str(value)).map(([key])=>`Dato de comunidad o trabajador: ${key.replaceAll('_',' ')}`)];
  if(!form.contractType) issues.push('Tipo de contrato');
  if(form.contractType==='plazo_fijo'&&!form.fecha_termino_pactada) issues.push('Fecha de término pactada');
  if(!str(duties)) issues.push('Funciones del cargo');
  if(str(form.tabla_turnos).includes('[colación y descansos pendientes]')) issues.push('Completar colación y descansos de la jornada');
  if(/condiciones por confirmar/.test(`${form.bonos_pactados_con_monto_y_devengo||''} ${form.asignaciones_con_monto_y_condiciones||''}`)) issues.push('Confirmar periodicidad y condiciones de bonos y asignaciones');
  return <div className="fixed inset-0 z-50 bg-black/60 p-4 overflow-y-auto"><div className="mx-auto max-w-5xl bg-white rounded-2xl p-5 space-y-4">
    <div className="flex justify-between"><div><h2 className="font-black text-[#0F3D2E]">Contrato individual de trabajo</h2><p className="text-xs">{worker.name} · Borrador de revisión</p></div><button type="button" onClick={onClose}>Cerrar</button></div>
    <div className="text-sm text-amber-900 bg-amber-50 p-3">Las funciones se proponen según el cargo de la ficha y se pueden editar. Revisa jornada, mínimo legal, funciones, régimen y representación antes de firmar. Los campos no se guardan al cerrar.</div>
    <label className="block text-xs font-bold">Funciones según cargo<select className="block border rounded px-2 py-2 mt-1" value={profile} onChange={e=>{setProfile(e.target.value);setDuties(dutiesFor(e.target.value));}}>{Object.entries(laborRoleProfiles).map(([key,item])=><option key={key} value={key}>{item.label}</option>)}</select></label>
    <label className="block text-xs font-bold">Funciones acordadas (editable)<textarea className="block w-full border rounded px-2 py-2 mt-1 font-normal" rows={8} value={duties} onChange={e=>setDuties(e.target.value)} /></label>
    {['rondin','porteria','guardia'].includes(profile)&&<div className="bg-amber-50 p-3 text-sm">Revisa las funciones efectivas y, cuando corresponda, los requisitos de seguridad privada, autorizaciones, capacitación y seguro aplicables. El nombre del cargo no acredita su cumplimiento.</div>}
    <label className="block text-xs font-bold">Duración<select className="block border rounded px-2 py-2 mt-1" value={form.contractType} onChange={e=>update('contractType',e.target.value)}><option value="">Selecciona una duración</option><option value="indefinido">Indefinido</option><option value="plazo_fijo">Plazo fijo</option></select></label>
    {form.contractType==='plazo_fijo'&&<label className="block text-xs font-bold">Fecha de término pactada<input className="block border rounded px-2 py-2" type="date" value={form.fecha_termino_pactada||''} onChange={e=>update('fecha_termino_pactada',e.target.value)}/></label>}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">{fields.map(([key,label,type='text'])=><label className="text-xs font-bold" key={key}>{label}<input className="block w-full border border-slate-300 rounded px-2 py-2 mt-1" type={type} value={form[key]??''} onChange={e=>update(key,e.target.value)}/></label>)}</div>
    <label className="block text-xs font-bold">Acuerdos particulares de la comunidad (opcional)<textarea className="block w-full border rounded px-2 py-2 mt-1 font-normal" rows={4} value={additionalTerms} onChange={e=>setAdditionalTerms(e.target.value)} placeholder="Escribe aquí el acuerdo específico, si corresponde"/><span className="block font-normal text-slate-500 mt-1">Se incluye solo cuando escribes contenido. Debe revisarse junto con el resto del contrato.</span></label>
    {issues.length>0&&<div className="text-xs bg-amber-50 p-3"><strong>Faltan antecedentes:</strong> {issues.join(' · ')}</div>}
    <button type="button" className="bg-[#0F3D2E] text-white rounded px-4 py-2 text-sm" onClick={()=>printDocumentDirectly('labor-contract-draft','ARANPRO_Borrador_Contrato_Trabajo',{pageSize:'letter portrait',fitPage:false,margin:'19mm 17mm',pdfStyle:'neutral',extraStyles:printStyles})}>Imprimir borrador</button>
    <div className="bg-slate-100 p-4 overflow-auto"><div id="labor-contract-draft"><div className="labor-contract-doc bg-white max-w-[800px] mx-auto p-8 text-sm leading-relaxed text-slate-800"><div className="flex items-center justify-between border-b-2 border-[#0F3D2E] pb-3 mb-4"><div className="flex items-center gap-3"><img src="/brand/ARANPRO_isotipo_trimmed.png" alt="ARANPRO" style={{width:55}}/><strong>ARANPRO · GESTIÓN INTEGRAL</strong></div><span>INSTRUMENTO LABORAL</span></div><p className="font-bold text-center text-amber-900">BORRADOR DE REVISIÓN · NO APTO PARA FIRMA</p><h2 className="font-bold my-3">Contrato individual de trabajo</h2>
    {blocks.slice(0, firstDuty).filter(b=>!b.mode||b.mode===form.contractType).map((b,i)=>b.type==='heading'?<h3 className="font-bold mt-4 mb-1" key={i}>{fill(b.text)}</h3>:<p className="my-2 text-justify" key={i}>{fill(b.text)}</p>)}
    <h3 className="font-bold mt-4 mb-1">Segundo. Funciones del cargo</h3>{duties.split(/\n\s*\n/).filter(Boolean).map((text,i)=><p className="my-2 text-justify" key={i}>{text}</p>)}
    {blocks.slice(afterDuties).filter(b=>!b.mode||b.mode===form.contractType).map((b,i)=>b.type==='heading'?<h3 className="font-bold mt-4 mb-1" key={i}>{fill(b.text)}</h3>:<p className="my-2 text-justify" key={i}>{fill(b.text)}</p>)}
    {str(additionalTerms)&&<section><h3 className="font-bold mt-4 mb-1">Acuerdos particulares</h3><p className="my-2 text-justify" style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{additionalTerms.trim()}</p></section>}
    <div className="signatures grid grid-cols-2 gap-8 pt-10 text-center text-xs"><div>____________________________<br/>{worker.name||'[PENDIENTE]'}<br/>Persona trabajadora</div><div>____________________________<br/>{settings.adminName||'[PENDIENTE]'}<br/>Por {community.name||'[PENDIENTE]'}</div></div></div></div></div>
  </div></div>;
}
