import React, { useState } from 'react';
import blocks from './laborContractMaster.json';
import { laborRoleProfiles, detectLaborRole } from './laborRoleProfiles';
import { formatCLP } from '../../utils/formatters';
import { printDocumentDirectly } from '../../utils/printDocument';
import { loadLaborDraft, saveLaborDraft } from '../../utils/laborContractDraftStorage';
import { laborContractAlerts, minimumSalaryReference } from '../../utils/laborContractChecks';
import LaborScheduleBuilder from './LaborScheduleBuilder';
import LaborCycleScheduleBuilder from './LaborCycleScheduleBuilder';
import { useLaborMinimumIndicator } from '../../hooks/useLaborMinimumIndicator';
import { chileToday } from '../../hooks/useEconomicIndicators';

const fields = [
  ['fecha_evaluacion','Fecha para evaluar jornada y remuneración','date'],
  ['nombre_empleador','Nombre de la comunidad empleadora'],['rut_empleador','RUT de la comunidad'],['domicilio_empleador','Domicilio de la comunidad'],
  ['nombre_representante','Nombre del representante'],['rut_representante','RUT del representante'],['nombre_trabajador','Nombre del trabajador'],['rut_trabajador','RUT del trabajador'],
  ['nombre_condominio','Nombre del lugar de trabajo'],['direccion_centro','Dirección del lugar de trabajo'],['comuna_centro','Comuna del lugar de trabajo'],
  ['comuna_firma','Comuna de firma'],['fecha_real_firma','Fecha de firma','date'],['correo_empleador','Correo del empleador o sin correo'],
  ['calidad_representante','Calidad del representante'],['respaldo_representacion','Respaldo de representación'],
  ['nacionalidad_trabajador','Nacionalidad del trabajador'],['fecha_nacimiento','Fecha de nacimiento','date'],['domicilio_trabajador','Domicilio del trabajador'],['correo_trabajador','Correo del trabajador o sin correo'],
  ['fecha_ingreso','Fecha original de ingreso','date'],['cargo_jefatura','Jefatura'],['responsable_cobertura','Responsable de cobertura'],
  ['horas_semanales_o_promedio','Horas semanales o promedio','number'],['dias_trabajo','Días de trabajo'],['tabla_turnos','Horario, colación y descansos'],['sistema_asistencia','Sistema de asistencia'],
  ['dia_o_regla_de_pago','Día o regla de pago'],['medio_pago','Medio de pago'],['lugar_pago','Lugar de pago o no aplica'],['sueldo_base_monto','Sueldo base mensual','number'],
  ['bonos_pactados_con_monto_y_devengo','Bonos y condiciones o no aplica'],['asignaciones_con_monto_y_condiciones','Asignaciones y condiciones o no aplica'],['clausula_gratificacion_aplicable','Régimen de gratificación']
];
const printStyles=ready=>`@page{size:letter portrait;margin:19mm 17mm;@top-right{content:"ARANPRO · INSTRUMENTO LABORAL";font:8px Arial;color:#0f3d2e}@bottom-left{content:"${ready ? 'CONTRATO INDIVIDUAL DE TRABAJO' : 'BORRADOR · NO APTO PARA FIRMA'}";font:8px Arial;color:#62766d}@bottom-right{content:"Página " counter(page);font:8px Arial;color:#62766d}}@page:first{@top-right{content:none}}.print-wrapper{box-shadow:none!important;padding:0!important}.labor-contract-doc{font-family:Arial,sans-serif!important;color:#1c2925!important;font-size:10.5pt!important;line-height:1.45!important}.labor-contract-doc h2{font-size:15pt!important;color:#0f3d2e!important}.labor-contract-doc h3{font-size:11pt!important;color:#0f3d2e!important;break-after:avoid!important}.labor-contract-doc p{orphans:3;widows:3}.labor-contract-doc .signatures{break-inside:avoid;margin-top:28px}.aranpro-print-watermark{display:none!important}`;
const printableDate=x=>/^\d{4}-\d{2}-\d{2}$/.test(String(x||''))?x.split('-').reverse().join('/'):(x||'');
const str=x=>String(x??'').trim();
const localToday=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};

const firstDuty = blocks.findIndex(b => b.type === 'heading' && b.text.startsWith('Segundo.'));
const afterDuties = blocks.findIndex(b => b.type === 'heading' && b.text.startsWith('Tercero.'));
const conserjeDuties = blocks.slice(firstDuty + 1, afterDuties).map(b => b.text).join('\n\n');
const dutiesFor = key => laborRoleProfiles[key]?.duties === null ? conserjeDuties : (laborRoleProfiles[key]?.duties || []).join('\n\n');
const registeredAmounts = (entries) => entries.filter(([,n])=>Number(n)>0).map(([label,n])=>`${label}: ${formatCLP(Number(n))} (periodicidad y condiciones por confirmar)`).join('; ');

export default function LaborContractDraft({worker,community,settings={},onClose}) {
  const minimumIndicator=useLaborMinimumIndicator();
  const [saved] = useState(() => { try { return loadLaborDraft(window.localStorage, community.id, worker.id); } catch { return null; } });
  const [saveMessage,setSaveMessage] = useState('');
  const [profile,setProfile]=useState(()=>laborRoleProfiles[saved?.profile] ? saved.profile : detectLaborRole(worker.role));
  const [duties,setDuties]=useState(()=>typeof saved?.duties === 'string' ? saved.duties : dutiesFor(detectLaborRole(worker.role)));
  const [additionalTerms,setAdditionalTerms]=useState(()=>typeof saved?.additionalTerms === 'string' ? saved.additionalTerms : '');
  const [form,setForm]=useState(()=>({fecha_evaluacion:localToday(),nombre_empleador:community.bankInfo?.holderName||community.name||'',rut_empleador:community.bankInfo?.rut||'',domicilio_empleador:community.address||'',nombre_representante:settings.adminName||'',rut_representante:settings.adminRut||'',nombre_trabajador:worker.name||'',rut_trabajador:worker.rut||'',nombre_condominio:community.name||'',direccion_centro:community.address||'',comuna_centro:community.city||'',comuna_firma:community.city||'',domicilio_trabajador:worker.address||'',correo_trabajador:worker.email||'',fecha_ingreso:worker.startDate||'',horas_semanales_o_promedio:worker.weeklyHours||'',tabla_turnos:worker.shift ? `${worker.shift}; [colación y descansos pendientes]` : '', sueldo_base_monto:worker.baseSalary||'', bonos_pactados_con_monto_y_devengo:registeredAmounts([['Bono nocturno',worker.contractualNightBonus],['Bono de responsabilidad',worker.contractualResponsibilityBonus]]), asignaciones_con_monto_y_condiciones:registeredAmounts([['Colación',worker.allowanceColacion],['Movilización',worker.allowanceMovilizacion]]), contractType: /indefinid/i.test(worker.contractType||'') ? 'indefinido' : /plazo fijo/i.test(worker.contractType||'') ? 'plazo_fijo' : '', ...(saved?.form && typeof saved.form==='object' ? saved.form : {})}));
  const update=(key,value)=>{setForm(s=>({...s,[key]:value,...(['dias_trabajo','tabla_turnos','horas_semanales_o_promedio'].includes(key)&&(s.scheduleApplied||s.cycleApplied)?{scheduleApplied:false,cycleApplied:false}:{})}));setSaveMessage('');};
  const save=()=>{try{saveLaborDraft(window.localStorage,community.id,worker.id,{form,profile,duties,additionalTerms,workerRole:worker.role||''});setSaveMessage('Borrador guardado en este navegador.');}catch{setSaveMessage('No se pudo guardar el borrador. Revisa el almacenamiento del navegador.');}};
  const fixed={nombre_cargo:form.nombre_cargo ?? worker.role};
  const variables={...fixed,...form};
  if(['Jornada promediada','Sistema excepcional','Otro régimen'].includes(form.regimen_jornada)) variables.regimen_jornada=`${form.regimen_jornada}; respaldo: ${str(form.respaldo_jornada)||'[PENDIENTE]'}`;
  for(const k of ['fecha_real_firma','fecha_ingreso','fecha_nacimiento','fecha_inicio_contrato','fecha_termino_pactada']) variables[k]=printableDate(variables[k]);
  if(Number(form.sueldo_base_monto)>0) variables.sueldo_base_monto=formatCLP(Number(form.sueldo_base_monto)).replace(/^\$/, '');
  const fill=text=>text.replace(/\{\{([^}]+)\}\}/g,(_,k)=>str(variables[k])||'[PENDIENTE]');
  const issues=[...fields.filter(([key])=>!str(form[key])).map(([,label])=>label),...Object.entries(fixed).filter(([,value])=>!str(value)).map(([key])=>`Dato de comunidad o trabajador: ${key.replaceAll('_',' ')}`)];
  if(!form.contractType) issues.push('Tipo de contrato');
  if(!str(form.regimen_jornada)) issues.push('Régimen de jornada');
  if(['Jornada promediada','Sistema excepcional','Otro régimen'].includes(form.regimen_jornada) && !str(form.respaldo_jornada)) issues.push('Fundamento y respaldo del régimen de jornada');
  if(['rondin','porteria','guardia'].includes(profile) && !str(form.securityReview)) issues.push('Revisión de funciones y requisitos de seguridad privada');
  if(form.contractType==='plazo_fijo' && form.fecha_ingreso && form.fecha_termino_pactada && form.fecha_termino_pactada < form.fecha_ingreso) issues.push('La fecha de término es anterior al ingreso');
  if(form.fecha_nacimiento && form.fecha_ingreso && form.fecha_nacimiento >= form.fecha_ingreso) issues.push('Revisar fechas de nacimiento e ingreso');
  if(form.contractType==='plazo_fijo'&&!form.fecha_termino_pactada) issues.push('Fecha de término pactada');
  if(!str(duties)) issues.push('Funciones del cargo');
  if(form.scheduleMode!=='cycle' && form.scheduleRows?.some(r=>r?.active) && !form.scheduleApplied) issues.push('Revisar y aplicar el horario semanal editado');
  if(form.scheduleMode==='cycle' && !form.cycleApplied) issues.push('Revisar y aplicar el ciclo rotativo');
  if(str(form.tabla_turnos).includes('[colación y descansos pendientes]')) issues.push('Completar colación y descansos de la jornada');
  if(/condiciones por confirmar/.test(`${form.bonos_pactados_con_monto_y_devengo||''} ${form.asignaciones_con_monto_y_condiciones||''}`)) issues.push('Confirmar periodicidad y condiciones de bonos y asignaciones');
  const liveMinimum=minimumIndicator.reference?.asOf===chileToday()?minimumIndicator.reference:null;
  const reviews = [];
  const legalAlerts = laborContractAlerts(form,liveMinimum,reviews);
  const minimumReference = minimumSalaryReference(form,liveMinimum);
  const needsManualMinimum = !minimumReference && !!form.regimen_jornada && !!form.fecha_evaluacion;
  if (needsManualMinimum) {
    const manual = Number(form.minimumReviewed);
    if (!(Number.isFinite(manual) && manual > 0) || !str(form.minimumSource))
      issues.push('Mínimo mensual aplicable y fuente para la jornada pactada');
    else if (Number(form.sueldo_base_monto) < manual)
      legalAlerts.push('El sueldo base es inferior al mínimo mensual informado.');
  }
  const pending = /\[PENDIENTE\]|\{\{[^}]+\}\}/i;
  const printedBlocks = blocks.filter(block => !block.mode || block.mode === form.contractType);
  if (printedBlocks.some(block => pending.test(fill(block.text))) || pending.test(duties) || pending.test(additionalTerms))
    issues.push('Reemplazar los marcadores pendientes del contrato');
  const reviewKey = JSON.stringify([reviews,form.fecha_evaluacion,form.fecha_nacimiento,form.regimen_jornada,
    form.horas_semanales_o_promedio,form.tabla_turnos,form.fecha_inicio_contrato,form.fecha_termino_pactada,
    form.minimumReviewed,form.minimumSource,form.sueldo_base_monto,profile]);
  const reviewNote = form.reviewKey === reviewKey ? form.reviewNote || '' : '';
  if (reviews.length && !str(reviewNote)) issues.push('Registrar los antecedentes de la revisión indicada');
  const ready = !issues.length && !legalAlerts.length;
  const printContract = () => {
    const prefix = ready ? 'ARANPRO_Contrato_Trabajo' : 'ARANPRO_Borrador_Contrato_Trabajo';
    printDocumentDirectly('labor-contract-draft', prefix + '_' + form.nombre_trabajador, {
      pageSize:'letter portrait', fitPage:false, margin:'19mm 17mm', pdfStyle:'neutral', extraStyles:printStyles(ready)
    });
  };
  return <div className="fixed inset-0 z-50 bg-black/60 p-4 overflow-y-auto"><div className="mx-auto max-w-5xl bg-white rounded-2xl p-5 space-y-4">
    <div className="flex justify-between"><div><h2 className="font-black text-[#0F3D2E]">Contrato individual de trabajo</h2><p className="text-xs">{worker.name} · {ready ? 'Listo para firma' : 'Borrador de revisión'}</p></div><button type="button" onClick={onClose}>Cerrar</button></div>
    <div className="text-sm text-amber-900 bg-amber-50 p-3">Las funciones se proponen según el cargo de la ficha y se pueden editar. Los cambios aquí no modifican la ficha. El borrador se guarda solo en este navegador y puede ser accesible para quien use este perfil; no se sincroniza entre dispositivos.</div>
    {saved && saved.workerRole !== (worker.role||'') && <div className="bg-amber-50 p-3 text-sm">El cargo de la ficha cambió desde el último guardado. Revisa las funciones del borrador.</div>}
    <label className="block text-xs font-bold">Cargo pactado<input className="block w-full border rounded px-2 py-2" value={fixed.nombre_cargo||''} onChange={e=>update('nombre_cargo',e.target.value)} /></label>
    <label className="block text-xs font-bold">Funciones según cargo<select className="block border rounded px-2 py-2 mt-1" value={profile} onChange={e=>{setProfile(e.target.value);setDuties(dutiesFor(e.target.value));setSaveMessage('');}}>{Object.entries(laborRoleProfiles).map(([key,item])=><option key={key} value={key}>{item.label}</option>)}</select></label>
    <label className="block text-xs font-bold">Funciones acordadas (editable)<textarea className="block w-full border rounded px-2 py-2 mt-1 font-normal" rows={8} value={duties} onChange={e=>{setDuties(e.target.value);setSaveMessage('');}} /></label>
    {['rondin','porteria','guardia'].includes(profile)&&<div className="bg-amber-50 p-3 text-sm">Revisa las funciones efectivas y, cuando corresponda, los requisitos de seguridad privada, autorizaciones, capacitación y seguro aplicables. El nombre del cargo no acredita su cumplimiento.</div>}
    <label className="block text-xs font-bold">Duración<select className="block border rounded px-2 py-2 mt-1" value={form.contractType} onChange={e=>update('contractType',e.target.value)}><option value="">Selecciona una duración</option><option value="indefinido">Indefinido</option><option value="plazo_fijo">Plazo fijo</option></select></label>
    {form.contractType==='plazo_fijo'&&<div className="grid grid-cols-1 md:grid-cols-3 gap-3"><label className="block text-xs font-bold">Inicio de este contrato<input className="block border rounded px-2 py-2" type="date" value={form.fecha_inicio_contrato||''} onChange={e=>update('fecha_inicio_contrato',e.target.value)}/></label><label className="block text-xs font-bold">Fecha de término pactada<input className="block border rounded px-2 py-2" type="date" value={form.fecha_termino_pactada||''} onChange={e=>update('fecha_termino_pactada',e.target.value)}/></label><label className="block text-xs font-bold">Renovaciones previas<select className="block border rounded px-2 py-2" value={form.fixedRenewals||''} onChange={e=>update('fixedRenewals',e.target.value)}><option value="">Seleccionar</option><option value="0">Ninguna</option><option value="1">Una</option><option value="2+">Dos o más</option></select></label></div>}
    <label className="block text-xs font-bold">Régimen de jornada<select className="block border rounded px-2 py-2 mt-1" value={form.regimen_jornada||''} onChange={e=>update('regimen_jornada',e.target.value)}><option value="">Seleccionar</option>{form.regimen_jornada&&!['Jornada ordinaria general','Jornada parcial','Jornada promediada','Sistema excepcional','Otro régimen'].includes(form.regimen_jornada)&&<option value={form.regimen_jornada}>{form.regimen_jornada} (valor guardado)</option>}<option>Jornada ordinaria general</option><option>Jornada parcial</option><option>Jornada promediada</option><option>Sistema excepcional</option><option>Otro régimen</option></select></label>
    {['Jornada promediada','Sistema excepcional','Otro régimen'].includes(form.regimen_jornada)&&<label className="block text-xs font-bold">Fundamento y respaldo del régimen<input className="block w-full border rounded px-2 py-2 mt-1" value={form.respaldo_jornada||''} onChange={e=>update('respaldo_jornada',e.target.value)}/><span className="font-normal">Indica el acuerdo o resolución aplicable; requiere revisión específica.</span></label>}
    {['rondin','porteria','guardia'].includes(profile)&&<label className="block text-xs font-bold">Revisión de seguridad privada<input className="block w-full border rounded px-2 py-2 mt-1" value={form.securityReview||''} onChange={e=>update('securityReview',e.target.value)} placeholder="Funciones y antecedentes por verificar"/><span className="font-normal">Registra qué se revisó; escribirlo no certifica autorizaciones.</span></label>}
    <label className="block text-xs font-bold">Forma de organizar los turnos<select className="block border rounded px-2 py-2 mt-1" value={form.scheduleMode||'weekly'} onChange={e=>{const mode=e.target.value;setForm(s=>({...s,scheduleMode:mode,scheduleApplied:false,cycleApplied:false,...((s.scheduleApplied||s.cycleApplied)?{dias_trabajo:'',tabla_turnos:'',horas_semanales_o_promedio:''}:{})}));setSaveMessage('');}}><option value="weekly">Semana fija</option><option value="cycle">Ciclo rotativo</option></select></label>
    {form.scheduleMode==='cycle' ? <LaborCycleScheduleBuilder length={form.cycleLength||''} startDate={form.cycleStart||''} rows={form.cycleRows||[]} applied={!!form.cycleApplied} onChange={changes=>{setForm(s=>({...s,...('length'in changes?{cycleLength:changes.length}:{}),...('startDate'in changes?{cycleStart:changes.startDate}:{}),...('rows'in changes?{cycleRows:changes.rows}:{}),cycleApplied:false,...(s.cycleApplied?{dias_trabajo:'',tabla_turnos:'',horas_semanales_o_promedio:''}:{})}));setSaveMessage('');}} onApply={result=>{setForm(s=>({...s,dias_trabajo:`Ciclo de ${s.cycleLength} días con inicio ${s.cycleStart}`,tabla_turnos:result.details.join(' | '),horas_semanales_o_promedio:Number(result.weeklyHours.toFixed(4)),cycleApplied:true}));setSaveMessage('');}} /> : <LaborScheduleBuilder rows={form.scheduleRows||[]} applied={!!form.scheduleApplied} onChange={rows=>{setForm(s=>({...s,scheduleRows:rows,scheduleApplied:false,...(s.scheduleApplied?{dias_trabajo:'',tabla_turnos:'',horas_semanales_o_promedio:''}:{})}));setSaveMessage('');}} onApply={result=>{setForm(s=>({...s,dias_trabajo:result.days.join(', '),tabla_turnos:result.details.join(' | '),horas_semanales_o_promedio:Number((result.totalMinutes/60).toFixed(4)),scheduleApplied:true}));setSaveMessage('');}} />}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">{fields.map(([key,label,type='text'])=><label className="text-xs font-bold" key={key}>{label}<input className="block w-full border border-slate-300 rounded px-2 py-2 mt-1" type={type} value={form[key]??''} onChange={e=>update(key,e.target.value)}/></label>)}</div>
    <label className="block text-xs font-bold">Acuerdos particulares de la comunidad (opcional)<textarea className="block w-full border rounded px-2 py-2 mt-1 font-normal" rows={4} value={additionalTerms} onChange={e=>{setAdditionalTerms(e.target.value);setSaveMessage('');}} placeholder="Escribe aquí el acuerdo específico, si corresponde"/><span className="block font-normal text-slate-500 mt-1">Se incluye solo cuando escribes contenido. Debe revisarse junto con el resto del contrato.</span></label>
    {needsManualMinimum && <fieldset className="grid gap-2 bg-slate-50 p-3 text-sm"><legend>Referencia de remuneración para este caso</legend>
      <label>Mínimo mensual aplicable a esta jornada ($)<input type="number" min="1" className="block border rounded p-2" value={form.minimumReviewed||''} onChange={e=>update('minimumReviewed',e.target.value)} /></label>
      <label>Fuente y vigencia del monto<input className="block w-full border rounded p-2" value={form.minimumSource||''} onChange={e=>update('minimumSource',e.target.value)} /></label>
    </fieldset>}
    {reviews.length>0 && <div className="bg-amber-50 p-3 text-sm"><ul>{reviews.map(message=><li key={message}>{message}</li>)}</ul>
      <label>Antecedentes revisados y fundamento aplicable<textarea className="block w-full border rounded p-2" value={reviewNote} onChange={e=>{setForm(s=>({...s,reviewKey,reviewNote:e.target.value}));setSaveMessage('');}} /></label>
    </div>}
    {issues.length>0&&<div className="text-xs bg-amber-50 p-3"><strong>Faltan antecedentes:</strong> {issues.join(' · ')}</div>}
    {minimumReference&&<div className="text-xs bg-slate-50 p-3"><strong>Ingreso mínimo de referencia:</strong> {formatCLP(minimumReference.amount)} mensuales para la fecha de evaluación{minimumReference.partial?` (${minimumReference.hours} horas de ${minimumReference.divisor}, cálculo proporcional)`:' (jornada sobre 30 horas)'}. Fuente: {minimumReference.source}. Este cálculo usa la edad y el régimen ingresados; no acredita por sí solo la validez del contrato.</div>}
    {minimumIndicator.status==='no_disponible'&&<div className="text-xs text-slate-600">No fue posible comprobar el indicador en línea; las referencias históricas disponibles siguen utilizándose cuando corresponda.</div>}
    {legalAlerts.length>0&&<div className="text-xs bg-rose-50 p-3"><strong>Revisar antes de usar:</strong><ul className="list-disc pl-5">{legalAlerts.map((message,i)=><li key={i}>{message}</li>)}</ul></div>}
    <div className="flex flex-wrap gap-3 items-center"><button type="button" className="border border-[#0F3D2E] rounded px-4 py-2 text-sm" onClick={save}>Guardar borrador</button><span role="status" className="text-xs">{saveMessage}</span></div>
    <button type="button" className="bg-[#0F3D2E] text-white rounded px-4 py-2 text-sm" onClick={printContract}>{ready ? 'Emitir contrato para firma' : 'Imprimir borrador'}</button>
    <div className="bg-slate-100 p-4 overflow-auto"><div id="labor-contract-draft"><div className="labor-contract-doc bg-white max-w-[800px] mx-auto p-8 text-sm leading-relaxed text-slate-800"><div className="flex items-center justify-between border-b-2 border-[#0F3D2E] pb-3 mb-4"><div className="flex items-center gap-3"><img src="/brand/ARANPRO_isotipo_trimmed.png" alt="ARANPRO" style={{width:55}}/><strong>ARANPRO · GESTIÓN INTEGRAL</strong></div><span>INSTRUMENTO LABORAL</span></div>{!ready && <p className="font-bold text-center text-amber-900">BORRADOR DE REVISIÓN · NO APTO PARA FIRMA</p>}<h2 className="font-bold my-3">Contrato individual de trabajo</h2>
    {blocks.slice(0, firstDuty).filter(b=>!b.mode||b.mode===form.contractType).map((b,i)=>b.type==='heading'?<h3 className="font-bold mt-4 mb-1" key={i}>{fill(b.text)}</h3>:<p className="my-2 text-justify" key={i}>{fill(b.text)}</p>)}
    <h3 className="font-bold mt-4 mb-1">Segundo. Funciones del cargo</h3>{duties.split(/\n\s*\n/).filter(Boolean).map((text,i)=><p className="my-2 text-justify" key={i}>{text}</p>)}
    {blocks.slice(afterDuties).filter(b=>!b.mode||b.mode===form.contractType).map((b,i)=>b.type==='heading'?<h3 className="font-bold mt-4 mb-1" key={i}>{fill(b.text)}</h3>:<p className="my-2 text-justify" key={i}>{fill(b.mode==='plazo_fijo'?b.text.replace('{{fecha_ingreso}}','{{fecha_inicio_contrato}}'):b.text)}</p>)}
    {str(additionalTerms)&&<section><h3 className="font-bold mt-4 mb-1">Acuerdos particulares</h3><p className="my-2 text-justify" style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{additionalTerms.trim()}</p></section>}
    <div className="signatures grid grid-cols-2 gap-8 pt-10 text-center text-xs"><div>____________________________<br/>{form.nombre_trabajador||'[PENDIENTE]'}<br/>Persona trabajadora</div><div>____________________________<br/>{form.nombre_representante||'[PENDIENTE]'}<br/>Por {form.nombre_empleador||'[PENDIENTE]'}</div></div></div></div></div>
  </div></div>;
}
