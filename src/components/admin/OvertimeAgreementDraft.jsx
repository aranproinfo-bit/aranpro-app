import React, { useState } from 'react';
import blocks from './overtimeMasterContent.json';
import { validateOvertimeDraft, monthlyOvertimeReference } from '../../utils/overtimeAgreementValidation';
import { Clause, FieldGroup, LaborDocument } from './CommunityLaborDocument';
import { partyData, partyFields, partyIssues } from '../../utils/communityLaborFields';
import { minimumSalaryReference } from '../../utils/laborContractChecks';
import { useLaborMinimumIndicator } from '../../hooks/useLaborMinimumIndicator';
import { formatCLP } from '../../utils/formatters';

const fields = [
  ['city','Comuna de firma'],['signedDate','Fecha real de firma','date'],['startDate','Inicio del pacto','date'],['endDate','Término del pacto','date'],
  ['contractDate','Fecha del contrato de origen','date'],['workerAddress','Domicilio del trabajador'],['representativeRole','Calidad del representante'],['representation','Respaldo de representación'],
  ['schedule','Distribución de la jornada'],['need','Necesidad temporal concreta'],['tasks','Tareas extraordinarias'],['needPeriod','Período de la necesidad'],['justification','Justificación del trabajo adicional'],
  ['requester','Cargo que solicita las horas'],['communication','Medio de comunicación'],['reliefContact','Responsable de relevo'],['attendanceSystem','Sistema de asistencia'],['correctionChannel','Canal de corrección de asistencia'],
  ['salaryConcepts','Conceptos computables como sueldo'],['monthlySalaryBase','Base mensual computable confirmada','number'],['weeklyHours','Horas semanales aplicables','number'],['premium','Recargo porcentual','number']
];
const v = x => String(x ?? '').trim();
const date = x => /^\d{4}-\d{2}-\d{2}$/.test(x || '') ? x.split('-').reverse().join('/') : (x || '[PENDIENTE]');
export default function OvertimeAgreementDraft({worker, community, settings={}, onClose, employerKind='community'}) {
  const stored=worker.laborContractData?.form || {};
  const indicator=useLaborMinimumIndicator();
  const [form,setForm]=useState(()=>({...partyData(community,worker,settings),birth:stored.fecha_nacimiento||'',weeklyHours:worker.weeklyHours||'',monthlySalaryBase:worker.baseSalary||'',premium:'50',salaryConcepts:'',signedDate:'',startDate:'',endDate:'',schedule:stored.tabla_turnos||'',attendanceSystem:stored.sistema_asistencia||'',reliefContact:stored.responsable_cobertura||'',specialSchedule:/excepcional|ciclo|promedi/i.test(stored.regimen_jornada||'')}));
  const patch=(key,value)=>setForm(s=>({...s,[key]:value,baseConfirmed:false}));
  const data={...form,employerName:form.employer,employerRut:form.employerRut,employerAddress:form.address,representativeName:form.rep,representativeRut:form.repRut,workerName:form.worker,workerRut:form.workerRut,contractDate:form.contract,workerAddress:form.home,representativeRole:form.role,representation:form.authority};
  const problems=[...validateOvertimeDraft(data),...partyIssues(form)];
  if(form.startDate<form.entry || form.startDate<form.contract || form.signedDate<form.contract) problems.push('Revisa las fechas del contrato de origen, ingreso y pacto.');
  const hours=Number(form.weeklyHours);
  const maximum=form.startDate>='2028-04-26'?40:form.startDate>='2026-04-26'?42:form.startDate>='2024-04-26'?44:45;
  if(hours>maximum) problems.push('La jornada ordinaria excede el máximo del período.');
  const birthday=form.birth?new Date(form.birth+'T00:00:00Z'):null;
  if(!birthday || !Number.isFinite(+birthday)) problems.push('Indica la fecha de nacimiento.');
  else { birthday.setUTCFullYear(birthday.getUTCFullYear()+18); if(form.startDate<birthday.toISOString().slice(0,10)) problems.push('El trabajo adolescente protegido no admite horas extraordinarias.'); }
  const minimum=minimumSalaryReference({fecha_evaluacion:form.startDate,fecha_nacimiento:form.birth,regimen_jornada:hours<=30?'Jornada parcial':'Jornada ordinaria general',horas_semanales_o_promedio:hours},indicator.reference);
  const floor=minimum?.amount || Number(form.minimum);
  if(!minimum && (!(floor>0)||!v(form.minimumSource))) problems.push('Verifica la referencia mínima del período e indica su fuente.');
  if(floor>0 && Number(form.monthlySalaryBase)<floor) problems.push('La base de la hora extraordinaria debe alcanzar el mínimo aplicable.');
  if(!v(form.scheduleProof)) problems.push('Confirma el régimen, descansos, condiciones de salud y beneficio superior aplicable.');

  for(const [key,msg] of [['contractDate','Indica la fecha del contrato de origen.'],['workerAddress','Indica el domicilio del trabajador.'],['representativeRole','Indica la calidad del representante.'],['representation','Indica el respaldo de representación.'],['salaryConcepts','Indica los conceptos que forman la base.'],['needPeriod','Indica el período de la necesidad.'],['justification','Explica la justificación.'],['requester','Indica el cargo solicitante.'],['communication','Indica el medio de comunicación.'],['reliefContact','Indica el responsable de relevo.'],['correctionChannel','Indica el canal para corregir asistencia.']]) if(!v(data[key])) problems.push(msg);
  if(!data.baseConfirmed) problems.push('Confirma la clasificación y base de cálculo con los antecedentes laborales.');
  if(Number(data.premium)<50 || !Number.isFinite(Number(data.premium))) problems.push('El recargo de referencia debe ser al menos 50%.');
  const amount=form.baseConfirmed ? monthlyOvertimeReference(form.monthlySalaryBase,form.weeklyHours,form.premium) : null;
  const vars={comuna_firma:form.city,fecha_firma:date(form.signedDate),nombre_empleador:data.employerName,rut_empleador:data.employerRut,domicilio_empleador:data.employerAddress,nombre_representante:data.representativeName,rut_representante:data.representativeRut,calidad_representante:form.role,respaldo_representacion:form.authority,nombre_trabajador:data.workerName,rut_trabajador:data.workerRut,domicilio_trabajador:form.home,cargo:form.job,fecha_contrato_origen:date(form.contract),fecha_ingreso:date(form.entry),nombre_condominio:community.name,direccion_centro:form.address,comuna_centro:form.city,horas_ordinarias:form.weeklyHours,unidad_computo_jornada:'semanales',distribucion_jornada_o_referencia_precisa:form.schedule,respaldo_regimen:form.specialSchedule?'Revisión específica pendiente':form.scheduleProof,descripcion_concreta_necesidad_temporal:form.need,tareas_extraordinarias:form.tasks,periodo_necesidad:form.needPeriod,justificacion_trabajo_adicional:form.justification,fecha_inicio:date(form.startDate),fecha_termino:date(form.endDate),cargo_responsable_solicitud:form.requester,medio_comunicacion:form.communication,responsable_relevo:form.reliefContact,sistema_asistencia:form.attendanceSystem,canal_correccion_asistencia:form.correctionChannel,porcentaje_recargo:form.premium,periodo_referencia_calculo:date(form.startDate),conceptos_sueldo_computables:form.salaryConcepts,base_mensual_calculo:form.monthlySalaryBase?formatCLP(Number(form.monthlySalaryBase)):'',horas_semanales_calculo:form.weeklyHours,formula_aplicable:'base mensual x 7 / (30 x horas semanales) x (1 + recargo / 100)',valor_hora_referencia:amount===null?'':formatCLP(Math.round(amount))};
  const fill=text=>text.replace(/\{\{([^}]+)\}\}/g,(_,key)=>v(vars[key])||'[PENDIENTE]');
  const contextFields=fields.filter(([k])=>!['city','contractDate','workerAddress','representativeRole','representation'].includes(k));
  return <LaborDocument title="Pacto de horas extraordinarias" employerKind={employerKind} community={community} settings={settings} form={form} issues={problems} onClose={onClose} editor={<>
    <FieldGroup title="Partes y contrato de origen" fields={[...partyFields,['contract','Fecha del contrato de origen','date'],['birth','Nacimiento del trabajador','date']]} form={form} patch={patch}/>
    <FieldGroup title="Vigencia, necesidad y organización de las horas" fields={contextFields.filter(([k])=>!['monthlySalaryBase','premium','weeklyHours','salaryConcepts'].includes(k))} form={form} patch={patch} open/>
    <FieldGroup title="Jornada y base del recargo" fields={[...contextFields.filter(([k])=>['monthlySalaryBase','premium','weeklyHours','salaryConcepts'].includes(k)),['scheduleProof','Régimen, descansos, salud y condiciones más favorables revisadas'],...(!minimum?[['minimum','Mínimo mensual aplicable','number'],['minimumSource','Fuente del mínimo y fecha']]:[])]} form={form} patch={patch}/>
    <label className="block text-sm"><input type="checkbox" checked={!!form.specialSchedule} onChange={e=>patch('specialSchedule',e.target.checked)}/> Régimen especial o promediado que requiere revisión específica</label>
    <label className="block text-sm"><input type="checkbox" checked={!!form.baseConfirmed} onChange={e=>setForm({...form,baseConfirmed:e.target.checked})}/> Revisé la base computable, jornada, recargo pactado y respaldo de la necesidad temporal.</label>
  </>}>
    {blocks.slice(1).map((b,i)=>b.type==='heading'?<Clause key={i} title={fill(b.text)}/>:b.type==='table'?<table key={i} style={{width:'100%',borderCollapse:'collapse',fontSize:'9.5pt'}}><tbody>{b.rows.map((r,j)=><tr key={j}>{r.map((c,k)=><td style={{border:'1px solid #cbd9d3',padding:5}} key={k}>{fill(c)}</td>)}</tr>)}</tbody></table>:<p key={i}>{fill(b.text)}</p>)}
  </LaborDocument>;
}
