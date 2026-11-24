import { CommunityLaborHeader, CommunityLaborFooter } from './CommunityLaborStationery';
import { printCommunityLabor } from '../../utils/communityLaborPrint';
import React, { useRef, useState } from 'react';
import blocks from './laborContractMaster.json';
import { laborRoleProfiles, detectLaborRole } from './laborRoleProfiles';
import { formatCLP } from '../../utils/formatters';
import { printDocumentDirectly } from '../../utils/printDocument';
import { loadLaborDraft, saveLaborDraft } from '../../utils/laborContractDraftStorage';
import { laborContractAlerts, minimumSalaryReference, validChileanRut } from '../../utils/laborContractChecks';
import LaborScheduleBuilder from './LaborScheduleBuilder';
import LaborCycleScheduleBuilder from './LaborCycleScheduleBuilder';
import { useLaborMinimumIndicator } from '../../hooks/useLaborMinimumIndicator';
import { chileToday } from '../../hooks/useEconomicIndicators';
import LaborContractSignatures from './LaborContractSignatures';
import LaborPersonnelFields from './LaborPersonnelFields';
import LaborRoleSelect from './LaborRoleSelect';
import { AFP_RATES_CHILE, HEALTH_SYSTEMS_CHILE } from '../../utils/chileanPayrollCalculations';

import LaborContractFields, { groups, steps } from './LaborContractFields';

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
const safeFooter = value => JSON.stringify(String(value || '').replace(/[\r\n]/g, ' '));
const printStyles=(ready,settings)=>`@page{size:letter portrait;margin:19mm 17mm;@bottom-left{content:${safeFooter(`ARANPRO Gestión Integral • ${settings.website || "https://aranpro.cl"}`)};font:8px Arial;color:#62766d}@bottom-center{content:"Página " counter(page) " • ${ready ? 'Contrato de trabajo' : 'Borrador de contrato'}";font:8px Arial;color:#0f3d2e}@bottom-right{content:${safeFooter(`Fono Directo: ${settings.phone || "+56 9 5811 8504"}`)};font:8px Arial;color:#62766d}}.print-wrapper{box-shadow:none!important;padding:0!important}.labor-contract-doc{font-family:Arial,sans-serif!important;color:#1c2925!important;font-size:10.5pt!important;line-height:1.45!important}.labor-contract-doc h2{font-size:15pt!important;color:#0f3d2e!important}.labor-contract-doc h3{font-size:11pt!important;color:#0f3d2e!important;break-after:avoid!important}.labor-contract-doc p{orphans:3;widows:3}.labor-contract-doc .signatures,.labor-contract-end{break-inside:avoid;page-break-inside:avoid}.labor-contract-stripe{position:fixed;left:0;top:0;bottom:0;width:2mm;border-left:1.1mm solid #0f3d2e;border-right:.45mm solid #d4b895}.labor-contract-header-logo{width:22mm!important;height:auto!important;max-height:13mm!important;object-fit:contain!important}.aranpro-print-watermark{display:none!important}`;
const printableDate=x=>/^\d{4}-\d{2}-\d{2}$/.test(String(x||''))?x.split('-').reverse().join('/'):(x||'');
const str=x=>String(x??'').trim();
const localToday=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};

const firstDuty = blocks.findIndex(b => b.type === 'heading' && b.text.startsWith('Segundo.'));
const afterDuties = blocks.findIndex(b => b.type === 'heading' && b.text.startsWith('Tercero.'));
const conserjeDuties = blocks.slice(firstDuty + 1, afterDuties).map(b => b.text).join('\n\n');
const dutiesFor = key => laborRoleProfiles[key]?.duties === null ? conserjeDuties : (laborRoleProfiles[key]?.duties || []).join('\n\n');
const registeredAmounts = (entries) => entries.filter(([,n])=>Number(n)>0).map(([label,n])=>`${label}: ${formatCLP(Number(n))} (periodicidad y condiciones por confirmar)`).join('; ');

export default function LaborContractDraft({worker,community,settings={},onClose,onSaveWorker,employerKind='community'}) {
  const minimumIndicator=useLaborMinimumIndicator();
  const [saved] = useState(() => {
    try {
      const local = loadLaborDraft(window.localStorage, community.id, worker.id);
      const stored = worker.laborContractData;
      if (!stored) return local;
      if (local?.updatedAt && local.updatedAt > (stored.updatedAt || 0)) return local;
      return stored;
    } catch { return worker.laborContractData || null; }
  });
  const [saveMessage,setSaveMessage] = useState('');
  const [signatureConsent,setSignatureConsent] = useState('');
  const [personnel,setPersonnel] = useState(()=>({
    phone:worker.phone||'', afpId:worker.afpId||'', healthId:worker.healthId||'',
    bankName:worker.bankName||'', accountType:worker.accountType||'', accountNumber:worker.accountNumber||'',
    mutualEntity:worker.mutualEntity||'', mutualRate:worker.mutualRate ?? '', isExemptFromAfc:!!worker.isExemptFromAfc,
    hasLegalGratification:worker.hasLegalGratification ?? null,
    contractualNightBonus:worker.contractualNightBonus ?? '', contractualResponsibilityBonus:worker.contractualResponsibilityBonus ?? '',
    allowanceColacion:worker.allowanceColacion ?? '', allowanceMovilizacion:worker.allowanceMovilizacion ?? '',
    ...(saved?.personnel || {})
  }));
  const [profile,setProfile]=useState(()=>laborRoleProfiles[saved?.profile] ? saved.profile : detectLaborRole(worker.role));
  const [duties,setDuties]=useState(()=>typeof saved?.duties === 'string' ? saved.duties : dutiesFor(detectLaborRole(worker.role)));
  const [additionalTerms,setAdditionalTerms]=useState(()=>typeof saved?.additionalTerms === 'string' ? saved.additionalTerms : '');
  const [form,setForm]=useState(()=>({fecha_evaluacion:localToday(),nombre_empleador:employerKind==='company' ? (community.bankInfo?.holderName||'') : (community.bankInfo?.holderName||community.name||''),rut_empleador:community.bankInfo?.rut||'',domicilio_empleador:community.address||'',nombre_representante:settings.adminName||'',rut_representante:settings.adminRut||'',nombre_trabajador:worker.name||'',rut_trabajador:worker.rut||'',nombre_condominio:community.name||'',direccion_centro:community.address||'',comuna_centro:community.city||'',comuna_firma:community.city||'',domicilio_trabajador:worker.address||'',correo_trabajador:worker.email||'',fecha_ingreso:worker.startDate||'',horas_semanales_o_promedio:worker.weeklyHours||'',tabla_turnos:worker.shift ? `${worker.shift}; [colación y descansos pendientes]` : '', sueldo_base_monto:worker.baseSalary||'', bonos_pactados_con_monto_y_devengo:registeredAmounts([['Bono nocturno',worker.contractualNightBonus],['Bono de responsabilidad',worker.contractualResponsibilityBonus]]), asignaciones_con_monto_y_condiciones:registeredAmounts([['Colación',worker.allowanceColacion],['Movilización',worker.allowanceMovilizacion]]), contractType: /indefinid/i.test(worker.contractType||'') ? 'indefinido' : /plazo fijo/i.test(worker.contractType||'') ? 'plazo_fijo' : '', ...(saved?.form && typeof saved.form==='object' ? saved.form : {})}));
  const update=(key,value)=>{setForm(s=>({...s,[key]:value,...(['dias_trabajo','tabla_turnos','horas_semanales_o_promedio'].includes(key)&&(s.scheduleApplied||s.cycleApplied)?{scheduleApplied:false,cycleApplied:false}:{})}));setSaveMessage('');};
  const personnelChange=(key,value)=>{
    const next={...personnel,[key]:value};
    setPersonnel(next);
    if (['contractualNightBonus','contractualResponsibilityBonus'].includes(key)) {
      const amounts=registeredAmounts([['Bono nocturno',next.contractualNightBonus],['Bono de responsabilidad',next.contractualResponsibilityBonus]]);
      update('bonos_pactados_con_monto_y_devengo', amounts || 'Sin bonos pactados');
    } else if (['allowanceColacion','allowanceMovilizacion'].includes(key)) {
      const amounts=registeredAmounts([['Colación',next.allowanceColacion],['Movilización',next.allowanceMovilizacion]]);
      update('asignaciones_con_monto_y_condiciones', amounts || 'Sin asignaciones pactadas');
    } else if (key==='hasLegalGratification') {
      update('clausula_gratificacion_aplicable', value === true ? 'Gratificación conforme al artículo 50 del Código del Trabajo, según sus condiciones y tope legal.' : '');
    } else setSaveMessage('');
  };
  const save=()=>{
    const draft={form,profile,duties,additionalTerms,personnel,workerRole:form.nombre_cargo ?? worker.role ?? '',updatedAt:Date.now()};
    try {
      saveLaborDraft(window.localStorage,community.id,worker.id,draft);
      if (!onSaveWorker) { setSaveMessage('Borrador guardado en este navegador.'); return true; }
      const name=str(form.nombre_trabajador), rut=str(form.rut_trabajador), role=str(form.nombre_cargo ?? worker.role);
      const salary=Number(form.sueldo_base_monto), hours=Number(form.horas_semanales_o_promedio);
      const afp=AFP_RATES_CHILE.find(item=>item.id===personnel.afpId);
      const health=HEALTH_SYSTEMS_CHILE.find(item=>item.id===personnel.healthId);
      if (!name || !validChileanRut(rut) || !role || !form.fecha_ingreso || !form.contractType || !(salary>0) || !(hours>0) || !afp || !health || personnel.hasLegalGratification===null) {
        setSaveMessage('Borrador guardado en este navegador. Para guardar la ficha, indica nombre, RUT válido, cargo, fecha de ingreso, duración, sueldo, horas, AFP, salud y gratificación.');
        return false;
      }
      const numeric = key => personnel[key] === '' ? 0 : Number(personnel[key]);
      if (['contractualNightBonus','contractualResponsibilityBonus','allowanceColacion','allowanceMovilizacion'].some(key=>!Number.isFinite(numeric(key)) || numeric(key)<0)) {
        setSaveMessage('Revisa que los bonos y asignaciones sean montos válidos iguales o mayores a cero.');
        return false;
      }
      const details = {
        ...worker, ...personnel, id:worker.id, name, rut, role,
        category:worker.role===role && worker.category ? worker.category : laborRoleProfiles[detectLaborRole(role)]?.label || 'Personal',
        address:str(form.domicilio_trabajador),
        email:str(form.correo_trabajador)==='Sin correo electrónico'?'':str(form.correo_trabajador),
        startDate:form.fecha_ingreso || worker.startDate || '', baseSalary:salary, weeklyHours:hours,
        contractType:form.contractType==='indefinido'?'Contrato Indefinido':form.contractType==='plazo_fijo'?'Contrato a Plazo Fijo':worker.contractType||'',
        shift:form.tabla_turnos||worker.shift||'', status:worker.status||'ACTIVO',
        contractualNightBonus:numeric('contractualNightBonus'), contractualResponsibilityBonus:numeric('contractualResponsibilityBonus'),
        allowanceColacion:numeric('allowanceColacion'), allowanceMovilizacion:numeric('allowanceMovilizacion'),
        afpName:afp.name, afpRate:afp.rate, healthName:health.name, healthRate:health.defaultRate,
        laborContractData:draft
      };
      onSaveWorker(details);
      setSaveMessage('Ficha y contrato guardados.');
      return true;
    } catch (error) {setSaveMessage(error?.message==='DUPLICATE_RUT' ? 'Ya existe un trabajador con este RUT en la comunidad. Abre su ficha para editarla.' : 'No se pudo guardar. Revisa el almacenamiento del navegador.');return false;}
  };
  const fixed={nombre_cargo:form.nombre_cargo ?? worker.role};
  const variables={...fixed,...form};
  const signatureKey=JSON.stringify({form,profile,duties,additionalTerms});
  const includeSignature=Boolean(signatureConsent && signatureConsent===signatureKey);
  const signatureRut = value => String(value || '').replace(/[.\s-]/g,'').toUpperCase();
  const signatureMatches = Boolean(signatureRut(settings.adminRut) && signatureRut(settings.adminRut)===signatureRut(form.rut_representante));
  if(['Jornada promediada','Sistema excepcional','Otro régimen'].includes(form.regimen_jornada)) variables.regimen_jornada=`${form.regimen_jornada}; respaldo: ${str(form.respaldo_jornada)||'[PENDIENTE]'}`;
  for(const k of ['fecha_real_firma','fecha_ingreso','fecha_nacimiento','fecha_inicio_contrato','fecha_termino_pactada']) variables[k]=printableDate(variables[k]);
  if(Number(form.sueldo_base_monto)>0) variables.sueldo_base_monto=formatCLP(Number(form.sueldo_base_monto)).replace(/^\$/, '');
  const fill=text=>{
    const adjusted = employerKind === 'company'
      ? text.replaceAll('solicitudes de residentes','solicitudes de clientes').replaceAll('reglamento de la comunidad','reglamento aplicable del empleador')
      : text;
    return adjusted.replace(/\{\{([^}]+)\}\}/g,(_,k)=>str(variables[k])||'[PENDIENTE]');
  };
  const [step,setStep] = useState(0);
  const panel = useRef(null);
  const scroller = useRef(null);
  const [loadedKeys] = useState(() => Object.keys(form).filter(key=>str(form[key])));
  const targets = new Map();
  const issues = [];
  const issue = (field,message) => { targets.set(message,field); issues.push(message); };
  const companyFieldLabels = {nombre_empleador:'Nombre o razón social del empleador',rut_empleador:'RUT del empleador',domicilio_empleador:'Domicilio del empleador'};
  for (const [key,label] of fields) if (!str(form[key])) issue(key,employerKind==='company' ? companyFieldLabels[key] || label : label);
  if (onSaveWorker && !personnel.afpId) issue('afpId','Selecciona la AFP del trabajador');
  if (onSaveWorker && !personnel.healthId) issue('healthId','Selecciona el sistema de salud');
  if (onSaveWorker && personnel.hasLegalGratification===null) issue('hasLegalGratification','Selecciona la modalidad de gratificación');
  if (!str(fixed.nombre_cargo)) issue('nombre_cargo','Cargo pactado');
  if(!form.contractType) issue('contractType', 'Tipo de contrato');
  if (employerKind==='community' && !form.autorizacion_tipo) issue('autorizacion_tipo','Indica el acuerdo o delegación para contratar');
  if (employerKind==='community' && form.autorizacion_tipo && !str(form.autorizacion_respaldo)) issue('autorizacion_respaldo','Identifica el acta o documento que respalda la contratación');
  if(!str(form.regimen_jornada)) issue('regimen_jornada', 'Régimen de jornada');
  if(['Jornada promediada','Sistema excepcional','Otro régimen'].includes(form.regimen_jornada) && !str(form.respaldo_jornada)) issue('respaldo_jornada', 'Fundamento y respaldo del régimen de jornada');
  if(['rondin','porteria','guardia'].includes(profile) && !str(form.securityReview)) issue('securityReview', 'Revisión de funciones y requisitos de seguridad privada');
  if(form.contractType==='plazo_fijo' && form.fecha_ingreso && form.fecha_termino_pactada && form.fecha_termino_pactada < form.fecha_ingreso) issue('fecha_termino_pactada', 'La fecha de término es anterior al ingreso');
  if(form.fecha_nacimiento && form.fecha_ingreso && form.fecha_nacimiento >= form.fecha_ingreso) issue('fecha_nacimiento', 'Revisar fechas de nacimiento e ingreso');
  if(form.contractType==='plazo_fijo'&&!form.fecha_termino_pactada) issue('fecha_termino_pactada', 'Fecha de término pactada');
  if(!str(duties)) issue('duties', 'Funciones del cargo');
  if(form.scheduleMode!=='cycle' && form.scheduleRows?.some(r=>r?.active) && !form.scheduleApplied) issue('scheduleMode', 'Revisar y aplicar el horario semanal editado');
  if(form.scheduleMode==='cycle' && !form.cycleApplied) issue('scheduleMode', 'Revisar y aplicar el ciclo rotativo');
  if(str(form.tabla_turnos).includes('[colación y descansos pendientes]')) issue('tabla_turnos', 'Completar colación y descansos de la jornada');
  if(/condiciones por confirmar/.test(`${form.bonos_pactados_con_monto_y_devengo||''} ${form.asignaciones_con_monto_y_condiciones||''}`)) issue('bonos_pactados_con_monto_y_devengo', 'Confirmar periodicidad y condiciones de bonos y asignaciones');
  const liveMinimum=minimumIndicator.reference?.asOf===chileToday()?minimumIndicator.reference:null;
  const reviews = [];
  const legalAlerts = laborContractAlerts(form,liveMinimum,reviews,targets);
  const minimumReference = minimumSalaryReference(form,liveMinimum);
  const needsManualMinimum = !minimumReference && !!form.regimen_jornada && !!form.fecha_evaluacion;
  const missingForMinimum = [
    ['fecha_nacimiento','la fecha de nacimiento'], ['horas_semanales_o_promedio','las horas pactadas']
  ].filter(([key])=>!str(form[key]));
  if (needsManualMinimum && !missingForMinimum.length) {
    const manual = Number(form.minimumReviewed);
    if (!(Number.isFinite(manual) && manual > 0) || !str(form.minimumSource))
      issue('minimumReviewed', 'Mínimo mensual aplicable y fuente para la jornada pactada');
    else if (Number(form.sueldo_base_monto) < manual)
      issue('sueldo_base_monto', 'El sueldo base es inferior al mínimo mensual informado.');
  }
  const pending = /\[PENDIENTE\]|\{\{[^}]+\}\}/i;
  const printedBlocks = blocks.filter(block => !block.mode || block.mode === form.contractType);
  if (!issues.length && (printedBlocks.some(block => pending.test(fill(block.text))) || pending.test(duties) || pending.test(additionalTerms)))
    issue('preview', 'Reemplazar los marcadores pendientes del contrato');
  const reviewKey = JSON.stringify([reviews,form.fecha_evaluacion,form.fecha_nacimiento,form.regimen_jornada,
    form.horas_semanales_o_promedio,form.tabla_turnos,form.fecha_inicio_contrato,form.fecha_termino_pactada,
    form.minimumReviewed,form.minimumSource,form.sueldo_base_monto,profile]);
  const reviewNote = form.reviewKey === reviewKey ? form.reviewNote || '' : '';
  if (reviews.length && !str(reviewNote)) issue('reviewNote', 'Registrar los antecedentes de la revisión indicada');
  const ready = !issues.length && !legalAlerts.length;
  const printContract = () => {
    if (ready && onSaveWorker && !save()) return;
    const prefix = ready ? 'ARANPRO_Contrato_Trabajo' : 'ARANPRO_Borrador_Contrato_Trabajo';
    if (employerKind === 'community') return printCommunityLabor('labor-contract-draft', prefix + '_' + form.nombre_trabajador);
    printDocumentDirectly('labor-contract-draft', prefix + '_' + form.nombre_trabajador, {
      pageSize:'letter portrait', fitPage:false, margin:'19mm 17mm', pdfStyle:'neutral', extraStyles:printStyles(ready,settings)
    });
  };

  const specialFields = {
    nombre_cargo:1, duties:1, contractType:1, fecha_inicio_contrato:1, fecha_termino_pactada:1,
    fixedRenewals:1, securityReview:1, regimen_jornada:2, respaldo_jornada:2, scheduleMode:2,
    minimumReviewed:3, reviewNote:3, preview:4, afpId:3, healthId:3, hasLegalGratification:3,
    autorizacion_tipo:1, autorizacion_respaldo:1
  };
  const stepFor = field => groups.find(group=>group.keys.includes(field))?.step ?? specialFields[field] ?? 4;
  const displaySteps = employerKind==='company' ? ['Personas y empresa', ...steps.slice(1)] : steps;
  const pendingByStep = displaySteps.map(()=>[]);
  for (const message of [...issues,...legalAlerts]) {
    const field = targets.get(message);
    pendingByStep[stepFor(field)].push({message,field});
  }
  const navigate = (index,field) => {
    setStep(index);
    requestAnimationFrame(()=>{
      const target = field && document.getElementById('labor-field-'+field);
      if (target) {
        let ancestor = target.parentElement;
        while (ancestor) {
          if (ancestor.tagName === 'DETAILS') ancestor.open = true;
          ancestor = ancestor.parentElement;
        }
        target.focus({preventScroll:true});
        target.scrollIntoView({block:'center'});
      } else {
        scroller.current?.scrollTo(0,0);
        panel.current?.focus({preventScroll:true});
      }
    });
  };
  const renderGroups = (index,skip=[]) => groups.filter(group=>group.step===index && !skip.includes(group.keys[0])).map(group=>
    <LaborContractFields key={group.title} group={group} fields={fields} form={form} update={update} employerKind={employerKind} collapseKeys={index===0?loadedKeys:[]} />);
  const instructions = ['Completa los datos que faltan. Puedes consultar y corregir los que ya estaban cargados.',
    'Confirma qué hará la persona, dónde trabajará y por cuánto tiempo.',
    'Arma el turno y aplícalo al contrato, o ingresa directamente el horario pactado.',
    'Confirma el sueldo y selecciona las condiciones acordadas. Puedes escribir una respuesta propia.',
    'Revisa el documento. Selecciona un pendiente para corregirlo en su campo.'];
  return <div ref={scroller} role="dialog" aria-modal="true" aria-labelledby="labor-title" className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 p-1 sm:p-5">
    <div className="mx-auto max-w-5xl rounded-2xl bg-slate-50 shadow-xl">
      <header className="flex items-start justify-between gap-3 rounded-t-2xl border-b border-slate-100 bg-white px-6 py-5 text-slate-900">
        <div><span className="rounded bg-emerald-50 px-2 py-1 text-xs font-bold text-[#0F3D2E]">CONTRATACIÓN Y PERSONAL</span><h2 id="labor-title" className="mt-2 text-lg font-black">{form.nombre_trabajador || 'Nuevo trabajador'} · {community.name}</h2></div>
        <button type="button" className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm" onClick={onClose}>Cerrar</button>
      </header>
      <div className="grid md:grid-cols-[13rem_1fr]">
        <nav aria-label="Pasos del contrato" className="border-b border-slate-200 p-3 md:border-b-0 md:border-r">
          <select className="w-full rounded-lg border bg-white p-2 md:hidden" aria-label="Ir al paso" value={step} onChange={e=>navigate(Number(e.target.value))}>
            {displaySteps.map((title,i)=><option key={title} value={i}>{i+1} de 5 · {title}</option>)}
          </select>
          <div className="hidden space-y-1 md:block">{displaySteps.map((title,i)=><button type="button" key={title} aria-current={step===i?'step':undefined} onClick={()=>navigate(i)}
            className={'block w-full rounded-lg px-3 py-3 text-left text-sm '+(step===i?'bg-[#0F3D2E] font-bold text-white':'text-slate-700 hover:bg-slate-200')}>
            {i+1}. {title}</button>)}</div>
        </nav>
        <div className="min-w-0 space-y-4 p-4 sm:p-6">
          <div ref={panel} tabIndex={-1}><h3 className="text-xl font-bold text-[#0F3D2E]">{displaySteps[step]}</h3><p className="mt-1 text-sm text-slate-600">{instructions[step]}</p></div>
          {step===0 && <>{renderGroups(0)}<LaborPersonnelFields data={personnel} onChange={personnelChange} section="personal" /></>}
          {step===1 && <>
    {employerKind==='community' && <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
      <h4 className="font-bold text-[#0F3D2E]">Autorización de contratación</h4>
      <p className="text-sm text-slate-600">Para el personal de la copropiedad, indica el acuerdo del comité o la delegación acordada por la asamblea.</p>
      <label className="block text-sm font-bold">Respaldo<select id="labor-field-autorizacion_tipo" value={form.autorizacion_tipo||''} onChange={e=>update('autorizacion_tipo',e.target.value)} className="block w-full rounded-xl border p-2">
        <option value="">Seleccionar</option><option value="comite">Acuerdo del comité</option><option value="asamblea">Facultad delegada por la asamblea</option>
      </select></label>
      {form.autorizacion_tipo && <label className="block text-sm font-bold">Acta, fecha y referencia del acuerdo<input id="labor-field-autorizacion_respaldo" value={form.autorizacion_respaldo||''} onChange={e=>update('autorizacion_respaldo',e.target.value)} className="block w-full rounded-xl border p-2" /></label>}
    </section>}
    {saved && saved.workerRole !== (worker.role||'') && <div className="bg-amber-50 p-3 text-sm">El cargo de la ficha cambió desde el último guardado. Revisa las funciones del borrador.</div>}
    <div id="labor-field-nombre_cargo" tabIndex={-1}><LaborRoleSelect value={fixed.nombre_cargo||''} onChange={value=>{update('nombre_cargo',value);const next=detectLaborRole(value);setProfile(next);setDuties(dutiesFor(next));}} /></div>
    <label className="block text-xs font-bold">Funciones según cargo<select className="block border rounded px-2 py-2 mt-1" value={profile} onChange={e=>{setProfile(e.target.value);setDuties(dutiesFor(e.target.value));setSaveMessage('');}}>{Object.entries(laborRoleProfiles).map(([key,item])=><option key={key} value={key}>{item.label}</option>)}</select></label>
<details className="rounded-lg border bg-white p-3"><summary className="cursor-pointer text-sm font-semibold">Ver o editar las funciones propuestas</summary>
    <label className="block text-xs font-bold">Funciones acordadas (editable)<textarea id="labor-field-duties" className="block w-full border rounded px-2 py-2 mt-1 font-normal" rows={8} value={duties} onChange={e=>{setDuties(e.target.value);setSaveMessage('');}} /></label>
</details>
    {['rondin','porteria','guardia'].includes(profile)&&<div className="bg-amber-50 p-3 text-sm">Revisa las funciones efectivas y, cuando corresponda, los requisitos de seguridad privada, autorizaciones, capacitación y seguro aplicables. El nombre del cargo no acredita su cumplimiento.</div>}
    {['rondin','porteria','guardia'].includes(profile)&&<label className="block text-xs font-bold">Revisión de seguridad privada<input id="labor-field-securityReview" className="block w-full border rounded px-2 py-2 mt-1" value={form.securityReview||''} onChange={e=>update('securityReview',e.target.value)} placeholder="Funciones y antecedentes por verificar"/><span className="font-normal">Registra qué se revisó; escribirlo no certifica autorizaciones.</span></label>}
    <label className="block text-xs font-bold">Duración<select id="labor-field-contractType" className="block border rounded px-2 py-2 mt-1" value={form.contractType} onChange={e=>update('contractType',e.target.value)}><option value="">Selecciona una duración</option><option value="indefinido">Indefinido</option><option value="plazo_fijo">Plazo fijo</option></select></label>
    {form.contractType==='plazo_fijo'&&<div className="grid grid-cols-1 md:grid-cols-3 gap-3"><label className="block text-xs font-bold">Inicio de este contrato<input className="block border rounded px-2 py-2" id="labor-field-fecha_inicio_contrato" type="date" value={form.fecha_inicio_contrato||''} onChange={e=>update('fecha_inicio_contrato',e.target.value)}/></label><label className="block text-xs font-bold">Fecha de término pactada<input className="block border rounded px-2 py-2" id="labor-field-fecha_termino_pactada" type="date" value={form.fecha_termino_pactada||''} onChange={e=>update('fecha_termino_pactada',e.target.value)}/></label><label className="block text-xs font-bold">Renovaciones previas<select id="labor-field-fixedRenewals" className="block border rounded px-2 py-2" value={form.fixedRenewals||''} onChange={e=>update('fixedRenewals',e.target.value)}><option value="">Seleccionar</option><option value="0">Ninguna</option><option value="1">Una</option><option value="2+">Dos o más</option></select></label></div>}
{renderGroups(1)}
<details className="rounded-lg border bg-white p-3"><summary className="cursor-pointer text-sm font-semibold">Agregar o editar un acuerdo particular{str(additionalTerms)?' · ingresado':''}</summary>
    <label className="block text-xs font-bold">Acuerdos particulares (opcional)<textarea className="block w-full border rounded px-2 py-2 mt-1 font-normal" rows={4} value={additionalTerms} onChange={e=>{setAdditionalTerms(e.target.value);setSaveMessage('');}} placeholder="Escribe aquí el acuerdo específico, si corresponde"/><span className="block font-normal text-slate-500 mt-1">Se incluye solo cuando escribes contenido. Debe revisarse junto con el resto del contrato.</span></label>
</details></>}
{step===2 && <>
    <label className="block text-xs font-bold">Régimen de jornada<select id="labor-field-regimen_jornada" className="block border rounded px-2 py-2 mt-1" value={form.regimen_jornada||''} onChange={e=>update('regimen_jornada',e.target.value)}><option value="">Seleccionar</option>{form.regimen_jornada&&!['Jornada ordinaria general','Jornada parcial','Jornada promediada','Sistema excepcional','Otro régimen'].includes(form.regimen_jornada)&&<option value={form.regimen_jornada}>{form.regimen_jornada} (valor guardado)</option>}<option>Jornada ordinaria general</option><option>Jornada parcial</option><option>Jornada promediada</option><option>Sistema excepcional</option><option>Otro régimen</option></select></label>
    {['Jornada promediada','Sistema excepcional','Otro régimen'].includes(form.regimen_jornada)&&<label className="block text-xs font-bold">Fundamento y respaldo del régimen<input id="labor-field-respaldo_jornada" className="block w-full border rounded px-2 py-2 mt-1" value={form.respaldo_jornada||''} onChange={e=>update('respaldo_jornada',e.target.value)}/><span className="font-normal">Indica el acuerdo o resolución aplicable; requiere revisión específica.</span></label>}
    <label className="block text-xs font-bold">Forma de organizar los turnos<select id="labor-field-scheduleMode" className="block border rounded px-2 py-2 mt-1" value={form.scheduleMode||'weekly'} onChange={e=>{const mode=e.target.value;setForm(s=>({...s,scheduleMode:mode,scheduleApplied:false,cycleApplied:false,...((s.scheduleApplied||s.cycleApplied)?{dias_trabajo:'',tabla_turnos:'',horas_semanales_o_promedio:''}:{})}));setSaveMessage('');}}><option value="weekly">Semana fija</option><option value="cycle">Ciclo rotativo</option></select></label>
    {form.scheduleMode==='cycle' ? <LaborCycleScheduleBuilder length={form.cycleLength||''} startDate={form.cycleStart||''} rows={form.cycleRows||[]} applied={!!form.cycleApplied} onChange={changes=>{setForm(s=>({...s,...('length'in changes?{cycleLength:changes.length}:{}),...('startDate'in changes?{cycleStart:changes.startDate}:{}),...('rows'in changes?{cycleRows:changes.rows}:{}),cycleApplied:false,...(s.cycleApplied?{dias_trabajo:'',tabla_turnos:'',horas_semanales_o_promedio:''}:{})}));setSaveMessage('');}} onApply={result=>{setForm(s=>({...s,dias_trabajo:`Ciclo de ${s.cycleLength} días con inicio ${s.cycleStart}`,tabla_turnos:result.details.join(' | '),horas_semanales_o_promedio:Number(result.weeklyHours.toFixed(4)),cycleApplied:true}));setSaveMessage('');}} /> : <LaborScheduleBuilder rows={form.scheduleRows||[]} applied={!!form.scheduleApplied} onChange={rows=>{setForm(s=>({...s,scheduleRows:rows,scheduleApplied:false,...(s.scheduleApplied?{dias_trabajo:'',tabla_turnos:'',horas_semanales_o_promedio:''}:{})}));setSaveMessage('');}} onApply={result=>{setForm(s=>({...s,dias_trabajo:result.days.join(', '),tabla_turnos:result.details.join(' | '),horas_semanales_o_promedio:Number((result.totalMinutes/60).toFixed(4)),scheduleApplied:true}));setSaveMessage('');}} />}
<details className="rounded-lg border bg-white p-3"><summary className="cursor-pointer text-sm font-semibold">{form.cycleApplied||form.scheduleApplied ? 'Horario aplicado · '+form.horas_semanales_o_promedio+' h semanales · Ver detalle' : 'Ingresar o editar el horario por escrito'}</summary>
<LaborContractFields group={groups.find(group=>group.keys.includes('tabla_turnos'))} fields={fields} form={form} update={update}/></details>
{renderGroups(2,['horas_semanales_o_promedio'])}</>}
{step===3 && <><LaborPersonnelFields data={personnel} onChange={personnelChange} section="payroll" />{renderGroups(3)}
    {minimumReference&&<div className="text-xs bg-slate-50 p-3"><strong>Ingreso mínimo de referencia:</strong> {formatCLP(minimumReference.amount)} mensuales para la fecha de evaluación{minimumReference.partial?` (${minimumReference.hours} horas de ${minimumReference.divisor}, cálculo proporcional)`:' (jornada sobre 30 horas)'}. Fuente: {minimumReference.source}. Este cálculo usa la edad y el régimen ingresados; no acredita por sí solo la validez del contrato.</div>}
    {minimumIndicator.status==='no_disponible'&&<div className="text-xs text-slate-600">No fue posible comprobar el indicador en línea; las referencias históricas disponibles siguen utilizándose cuando corresponda.</div>}
    {needsManualMinimum && missingForMinimum.length>0 && <div className="rounded-lg bg-slate-100 p-3 text-sm">Para calcular el mínimo, completa {missingForMinimum.map(([key,label])=><button type="button" key={key} className="mx-1 text-emerald-800 underline" onClick={()=>navigate(stepFor(key),key)}>{label}</button>)}</div>}
    {needsManualMinimum && !missingForMinimum.length && <fieldset className="grid gap-2 bg-slate-50 p-3 text-sm"><legend>Referencia de remuneración para este caso</legend>
      <label>Mínimo mensual aplicable a esta jornada ($)<input id="labor-field-minimumReviewed" type="number" min="1" className="block border rounded p-2" value={form.minimumReviewed||''} onChange={e=>update('minimumReviewed',e.target.value)} /></label>
      <label>Fuente y vigencia del monto<input className="block w-full border rounded p-2" value={form.minimumSource||''} onChange={e=>update('minimumSource',e.target.value)} /></label>
    </fieldset>}
    {reviews.length>0 && <div className="bg-amber-50 p-3 text-sm"><ul>{reviews.map(message=><li key={message}>{message}</li>)}</ul>
      <label>Antecedentes revisados y fundamento aplicable<textarea id="labor-field-reviewNote" className="block w-full border rounded p-2" value={reviewNote} onChange={e=>{setForm(s=>({...s,reviewKey,reviewNote:e.target.value}));setSaveMessage('');}} /></label>
    </div>}
</>}
{step===4 && <>
  <section className="rounded-xl border bg-white p-4 space-y-2 text-sm">
    <h4 className="font-bold text-[#0F3D2E]">Firma y registro</h4>
    <p>Revisa el contrato con ambas partes. La firma cargada se incorporará únicamente si la autorizas para este documento y el RUT del representante coincide con el del administrador configurado.</p>
    {(settings.signatureDataUrl || settings.signature || settings.digitalSignature) && signatureMatches && <label className="flex items-center gap-2"><input type="checkbox" checked={includeSignature} onChange={e=>setSignatureConsent(e.target.checked ? signatureKey : '')} /> Incorporar la firma cargada en este documento</label>}
    {(settings.signatureDataUrl || settings.signature || settings.digitalSignature) && !signatureMatches && <p className="text-amber-900">La firma cargada no corresponde al RUT del representante informado. El espacio queda disponible para firmar.</p>}
    <p>Después de la firma, entrega una copia al trabajador y registra el contrato en la Dirección del Trabajo dentro del plazo correspondiente.</p>
    <a href="https://www.dt.gob.cl/portal/1628/w3-article-121030.html" target="_blank" rel="noopener noreferrer" className="text-emerald-800 underline">Consultar registro de contrato en la Dirección del Trabajo</a>
    <label className="block">Estado de registro<select value={form.estado_registro_dt||''} onChange={e=>update('estado_registro_dt',e.target.value)} className="ml-2 rounded border p-2"><option value="">Sin registrar / pendiente</option><option value="registrado">Registrado por el administrador</option></select></label>
    {form.estado_registro_dt==='registrado' && <label className="block">Fecha y referencia del registro<input value={form.respaldo_registro_dt||''} onChange={e=>update('respaldo_registro_dt',e.target.value)} className="block w-full rounded border p-2" /></label>}
  </section>
  <div className="rounded-xl border border-slate-200 bg-white p-4"><strong>{ready?'Listo para firma':'Pendientes para emitir'}</strong>
    {pendingByStep.map((items,i)=>items.length>0 && <details key={i} open={i===pendingByStep.findIndex(list=>list.length)}>
      <summary className="cursor-pointer py-2 text-sm font-semibold">{displaySteps[i]} · {items.length}</summary>
      <ul className="space-y-1">{items.map(({message,field})=><li key={message}><button type="button" className="text-left text-sm text-emerald-800 underline" onClick={()=>navigate(i,field)}>{message}</button></li>)}</ul>
    </details>)}
  </div>
    <button type="button" className="bg-[#0F3D2E] text-white rounded px-4 py-2 text-sm" onClick={printContract}>{ready ? 'Emitir contrato para firma' : 'Imprimir borrador'}</button>
<details id="labor-field-preview" tabIndex={-1} className="rounded-lg border bg-white p-3"><summary className="cursor-pointer text-sm font-semibold">Vista previa del contrato</summary>
    <div className="bg-slate-100 p-4 overflow-auto"><div id="labor-contract-draft"><div className="labor-contract-doc bg-white max-w-[800px] mx-auto p-8 text-sm leading-relaxed text-slate-800">
    {employerKind === 'community' ? <CommunityLaborHeader community={community} settings={settings} badge="INSTRUMENTO LABORAL" title="Contrato individual de trabajo"/> : <>
    <div className="labor-contract-stripe" aria-hidden="true" />
    <div className="labor-contract-header" style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12,borderBottom:'2px solid #0F3D2E',paddingBottom:12,marginBottom:14}}>
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <img className="labor-contract-header-logo" src="/brand/ARANPRO_isotipo_trimmed.png" alt="ARANPRO" style={{width:'22mm',height:'auto',objectFit:'contain'}} />
        <div><strong style={{fontSize:13,color:'#0F3D2E'}}>{settings.brandName || 'ARANPRO'} • {settings.subtitle || 'Gestión Integral'}</strong>
          <div style={{fontSize:9,fontWeight:700,color:'#475569'}}>ADMINISTRACIÓN DE CONDOMINIOS • RECURSOS HUMANOS</div>
          <div style={{fontSize:8,color:'#64748b'}}>{settings.companyRut && !String(settings.companyRut).includes('76.999.888') && <>RUT Empresa: {settings.companyRut} • </>}Ley N° 21.442 de Copropiedad Inmobiliaria</div>
        </div>
      </div>
      <div style={{textAlign:'right',maxWidth:'42%'}}>
        <span style={{display:'inline-block',border:'1px solid #a7f3d0',borderRadius:4,background:'#ecfdf5',padding:'2px 8px',fontSize:9,fontWeight:800,color:'#0F3D2E'}}>INSTRUMENTO LABORAL</span>
        <div style={{fontSize:10,fontWeight:800}}>CONTRATO INDIVIDUAL DE TRABAJO</div>
        <div style={{fontSize:9,color:'#64748b'}}>{community.name}</div>
      </div>
    </div>
    </>}
    {!ready && <p className="font-bold text-center text-amber-900">BORRADOR DE REVISIÓN · NO APTO PARA FIRMA</p>}<h2 className="font-bold my-3">Contrato individual de trabajo</h2>
    {blocks.slice(0, firstDuty).filter(b=>!b.mode||b.mode===form.contractType).map((b,i)=>b.type==='heading'?<h3 className="font-bold mt-4 mb-1" key={i}>{fill(b.text)}</h3>:<p className="my-2 text-justify" key={i}>{fill(b.text)}</p>)}
    <h3 className="font-bold mt-4 mb-1">Segundo. Funciones del cargo</h3>{duties.split(/\n\s*\n/).filter(Boolean).map((text,i)=><p className="my-2 text-justify" key={i}>{text}</p>)}
    {blocks.slice(afterDuties).filter(b=>!b.mode||b.mode===form.contractType).map((b,i)=>b.type==='heading'?<h3 className="font-bold mt-4 mb-1" key={i}>{fill(b.text)}</h3>:<p className="my-2 text-justify" key={i}>{fill((b.mode==='plazo_fijo'?b.text.replace('{{fecha_ingreso}}','{{fecha_inicio_contrato}}'):b.text).replace('reglamento de la comunidad','reglamento aplicable del empleador'))}</p>)}
    {str(additionalTerms)&&<section><h3 className="font-bold mt-4 mb-1">Acuerdos particulares</h3><p className="my-2 text-justify" style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{additionalTerms.trim()}</p></section>}
    <LaborContractSignatures form={form} settings={settings} includeSignature={includeSignature} employerKind={employerKind} />
    {employerKind === 'community' && <div hidden data-footer-template=""><CommunityLaborFooter settings={settings} title={ready ? 'Contrato individual de trabajo' : 'Borrador · Contrato individual de trabajo'}/></div>}
    </div></div></div>
</details></>}
  <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
    <div><button type="button" onClick={save} className="rounded-lg border bg-white px-3 py-2 text-sm">{onSaveWorker ? 'Guardar ficha y contrato' : 'Guardar borrador'}</button>
      <p role="status" className="mt-1 text-xs text-slate-600">{saveMessage || 'Los cambios se guardan al pulsar el botón.'}</p></div>
    <div className="flex gap-2">{step>0 && <button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={()=>navigate(step-1)}>Atrás</button>}
      {step<4 && <button type="button" className="rounded-lg bg-[#0F3D2E] px-4 py-2 text-sm font-semibold text-white" onClick={()=>navigate(step+1)}>Continuar</button>}</div>
  </footer>
</div></div></div></div>;
}
