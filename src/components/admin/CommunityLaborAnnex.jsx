import React,{useState} from 'react';
import { Clause, FieldGroup, LaborDocument } from './CommunityLaborDocument';
import { partyData, partyFields, partyIssues, fieldIssues, readableDate } from '../../utils/communityLaborFields';
import LaborScheduleBuilder from './LaborScheduleBuilder';
import {summarizeWeeklySchedule} from '../../utils/laborWeeklySchedule';
import {minimumSalaryReference} from '../../utils/laborContractChecks';
import {useLaborMinimumIndicator} from '../../hooks/useLaborMinimumIndicator';

const origin=[['contract','Fecha de firma del contrato de origen','date'],['signed','Fecha de suscripción del anexo','date']];
const timeFields=[['timeClause','Cláusula de jornada que se modifica'],['timeFrom','Fecha de efecto de la jornada','date'],['regime','Régimen de jornada','select',[['general','Semanal ordinaria'],['special','Ciclo o régimen especial']]],['rest','Descansos, relevo y cobertura de domingos y festivos']];
const payFields=[['payClause','Cláusula de remuneración que se modifica'],['payFrom','Fecha de efecto de la remuneración','date'],['concept','Conceptos que cambian'],['detail','Nuevo monto o fórmula, periodicidad y condiciones de devengo','textarea']];
export default function CommunityLaborAnnex({community,worker,settings,onClose,employerKind='community'}) {
  const previous=worker.laborContractData?.form||{};
  const [form,setForm]=useState(()=>({...partyData(community,worker,settings),rows:previous.scheduleRows||[],regime:'general',pay:false,time:false,
    salary:worker.baseSalary||'',birth:previous.fecha_nacimiento||'',weekly:worker.weeklyHours||'',contract:previous.fecha_real_firma||''}));
  const indicator=useLaborMinimumIndicator();
  const patch=(key,value)=>setForm(f=>({...f,[key]:value,review:false}));
  const weekly=summarizeWeeklySchedule(form.rows);
  const hours=form.time && form.regime==='general'?weekly.totalMinutes/60:Number(form.weekly);
  const issues=[...partyIssues(form),...fieldIssues(origin,form)];
  if(!form.time && !form.pay) issues.push('Selecciona qué cambia respecto del contrato vigente.');
  if(form.signed<form.contract) issues.push('La fecha del anexo es anterior al contrato de origen.');
  if(form.time) {
    issues.push(...fieldIssues(timeFields,form));
    if(form.regime==='general') {
      issues.push(...weekly.errors);
      const max=form.timeFrom>='2028-04-26'?40:form.timeFrom>='2026-04-26'?42:form.timeFrom>='2024-04-26'?44:45;
      if(hours>max) issues.push('La jornada ordinaria supera el máximo vigente de '+max+' horas.');
      if(form.rows.some(r=>r.active && Number(r.mealMinutes)<30) || form.rows[6]?.active || (hours>30 && weekly.days.length<5)) {
        if(!form.scheduleBasis?.trim()) issues.push('Documenta el fundamento de la distribución, colación y descansos.');
      }
    } else if(!form.special?.trim() || !(hours>0)) issues.push('Indica ciclo, horarios, horas promedio, descansos y pacto o resolución aplicable.');
    if(form.timeFrom<form.entry) issues.push('La nueva jornada es anterior al ingreso.');
  }
  if(form.pay) {
    issues.push(...fieldIssues(payFields,form));
    if(form.salaryChange && !Number(form.salary)) issues.push('Indica el nuevo sueldo base mensual.');
    if(form.payFrom<form.entry) issues.push('La nueva remuneración es anterior al ingreso.');
  }
  if(worker.baseSalary && Number(form.salary)!==Number(worker.baseSalary) && !(form.pay && form.salaryChange)) issues.push('Selecciona la modificación del sueldo base para que el nuevo importe figure en el anexo.');
  const evaluationDates=[...new Set([form.time&&form.timeFrom,form.pay&&form.payFrom].filter(Boolean))];
  const salaryFields=[['salary','Sueldo base mensual vigente al aplicar el cambio','number'],['birth','Nacimiento del trabajador','date']];
  if(!form.time || form.regime==='special') salaryFields.push(['weekly','Horas semanales pactadas','number']);
  if(form.pay || form.time) {
    issues.push(...fieldIssues(salaryFields,form));
    if(!(Number(form.salary)>0) || !(hours>0)) issues.push('Comprueba el sueldo base y las horas aplicables.');
    for(const date of evaluationDates) {
      const reference=minimumSalaryReference({fecha_evaluacion:date,fecha_nacimiento:form.birth,horas_semanales_o_promedio:hours,regimen_jornada:form.time&&form.regime==='special'?'Especial':hours<=30?'Jornada parcial':'Jornada ordinaria general'},indicator.reference);
      if(reference && Number(form.salary)<reference.amount) issues.push('El sueldo base queda bajo la referencia de '+reference.amount.toLocaleString('es-CL')+' pesos al '+readableDate(date)+'.');
      if(!reference && (!form.minimumProof?.trim()||!(Number(form.manualMinimum)>0)||Number(form.salary)<Number(form.manualMinimum))) issues.push('Confirma el mínimo aplicable, su fuente y que el sueldo lo alcance.');
    }
  }
  if(!form.review) issues.push('Confirma la comparación con el contrato vigente y el acuerdo de ambas partes.');
  const val=key=>readableDate(form[key])||'〔Pendiente〕';
  const times=form.regime==='general'?weekly.details.join('\n'):form.special;
  return <LaborDocument title="Anexo de jornada y remuneraciones" employerKind={employerKind} settings={settings} community={community} form={form} issues={issues} onClose={onClose} editor={<>
    <FieldGroup title="Partes y representación" fields={partyFields} form={form} patch={patch}/>
    <FieldGroup title="Contrato de origen y suscripción" fields={origin} form={form} patch={patch} open/>
    <fieldset className="flex gap-4"><legend className="font-bold">¿Qué acuerdan modificar?</legend>{[['time','Jornada'],['pay','Remuneración']].map(([k,l])=><label key={k}><input type="checkbox" checked={form[k]} onChange={e=>patch(k,e.target.checked)}/> {l}</label>)}</fieldset>
    {form.time&&<><FieldGroup title="Nueva jornada" fields={timeFields} form={form} patch={patch} open/>
      {form.regime==='general'?<><LaborScheduleBuilder rows={form.rows} onChange={rows=>patch('rows',rows)} onApply={()=>patch('applied',true)} applied={form.applied}/><FieldGroup title="Fundamento de una distribución especial" fields={[[ 'scheduleBasis','Acuerdo o fundamento de descansos y colación','textarea']]} form={form} patch={patch}/></>:<FieldGroup title="Ciclo o régimen especial" fields={[[ 'special','Distribución completa y respaldo habilitante','textarea']]} form={form} patch={patch} open/>}</>}
    {form.pay&&<><FieldGroup title="Nueva remuneración" fields={payFields} form={form} patch={patch} open/><label><input type="checkbox" checked={!!form.salaryChange} onChange={e=>patch('salaryChange',e.target.checked)}/> El acuerdo cambia el sueldo base mensual</label></>}
    {(form.time||form.pay)&&<FieldGroup title="Comprobar ingreso mínimo" fields={[...salaryFields,['manualMinimum','Mínimo aplicable cuando requiere verificación manual','number'],['minimumProof','Fuente, período y tramo del mínimo manual']]} form={form} patch={patch}/>}
    <label className="block"><input type="checkbox" checked={!!form.review} onChange={e=>setForm({...form,review:e.target.checked})} /> Revisé antigüedad, fechas, remuneraciones, régimen, descansos y acuerdo con la persona trabajadora.</label>
  </>}>
    <p>En {val('city')}, el {val('signed')}, {val('employer')}, RUT {val('employerRut')}, con domicilio en {val('address')}, representada por {val('rep')}, RUT {val('repRut')}, en calidad de {val('role')}, según {val('authority')}, y {val('worker')}, RUT {val('workerRut')}, con domicilio en {val('home')}, acuerdan modificar el contrato suscrito el {val('contract')}. Se reconoce la fecha original de ingreso del {val('entry')} y el cargo de {val('job')}.</p>
    {form.time&&<Clause title="Primero. Jornada actualizada"><p>Desde el {val('timeFrom')}, la cláusula {val('timeClause')} establece una jornada de {hours||'〔Pendiente〕'} horas {form.regime==='general'?'semanales':'promedio según el ciclo pactado'}.</p><p style={{whiteSpace:'pre-line'}}>{times||'Distribución pendiente.'}</p><p>Descansos y cobertura · {val('rest')}. {form.scheduleBasis}</p><p>La reducción de jornada por aplicación de la ley se hará efectiva sin disminución de remuneraciones.</p></Clause>}
    {form.pay&&<Clause title={(form.time?'Segundo':'Primero')+'. Remuneración actualizada'}><p>A partir del {val('payFrom')}, la cláusula {val('payClause')} se modifica en los siguientes conceptos · {val('concept')}.</p>{form.salaryChange&&<p>Nuevo sueldo base mensual · {Number(form.salary).toLocaleString('es-CL')} pesos.</p>}<p style={{whiteSpace:'pre-line'}}>{val('detail')}</p><p>Las diferencias de períodos anteriores, si corresponden, se calcularán y documentarán en sus respectivas liquidaciones o reliquidaciones.</p></Clause>}
    <Clause title="Continuidad y alcance"><p>Se conservan la antigüedad y las estipulaciones que este anexo no modifica expresamente. Las partes suscriben ejemplares de igual tenor y cada una conservará uno. {employerKind==='company'?'El empleador':'La comunidad'} gestionará el registro que corresponda.</p></Clause>
  </LaborDocument>;
}

