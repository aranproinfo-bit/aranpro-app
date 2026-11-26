import React,{useState} from 'react';
import { Clause, FieldGroup, LaborDocument } from './CommunityLaborDocument';
import { partyData, partyFields, partyIssues, fieldIssues, readableDate, present } from '../../utils/communityLaborFields';
import {settlementFigures} from '../../utils/communitySettlement';
import {TERMINATION_CAUSES_CHILE,numberToSpanishWords} from '../../utils/chileanPayrollCalculations';
import {formatCLP} from '../../utils/formatters';

const causes=TERMINATION_CAUSES_CHILE.map(c=>[c.id,c.article+' · '+c.name.replace(' (Sin indemnización)','')]);
const facts=[['cause','Causal de término','select',causes],['end','Fecha de separación','date'],['contractType','Duración del contrato'],
  ['reference','Identificación de la carta, renuncia o mutuo acuerdo'],['facts','Hechos comunicados o antecedentes del acuerdo o renuncia','textarea'],
  ['protection','Revisión de fuero, licencias y autorizaciones aplicables','select',[['clear','Revisados, causal habilitada'],['review','Existe impedimento o requiere revisión']]]];
const ledger=[['days','Días remunerados del mes de separación','number'],['wage','Remuneración fija mensual para días trabajados','number'],
  ['vacDays','Feriado pendiente en días hábiles (incluye proporcional)','number'],['vacProof','Registro de feriado, anualidades, días usados y período proporcional'],
  ['vacBase','Base mensual íntegra del feriado','number'],['holidays','Feriados nacionales o locales que inciden, separados por coma (AAAA-MM-DD)']];
const art172=[['iasBase','Base mensual del artículo 172 antes del tope','number'],['baseProof','Componentes permanentes, promedio variable y antecedentes'],['uf','UF del último día del mes anterior al pago','number'],['ufProof','Fecha y fuente del valor UF'],['notice','Fecha del aviso de término, si se otorgó','date'],['afc','Aporte empleador AFC que se solicita imputar','number'],['afcProof','Folio, fecha y monto del certificado AFC, si se imputa']];
const closing=[['signatureDate','Fecha de suscripción propuesta','date'],['paymentDate','Fecha prevista de puesta a disposición','date'],['paymentMethod','Medio, lugar y condiciones de pago'],['social','Instituciones, períodos y comprobantes previsionales revisados','textarea'],
  ['contributions','Estado de cotizaciones exigibles','select',[['checked','Verificadas con respaldos'],['pending','Pendientes de regularización o verificación']]],
  ['alimony','Revisión de retenciones alimenticias','select',[['none','Revisada, sin retención aplicable'],['ordered','Existe resolución de retención']]],
  ['payrollProof','Liquidación final, asistencia, imposiciones y descuentos revisados'],['delivery','Documentos que acompañarán el instrumento'],
  ['route','Vía de formalización','select',[['presencial','Presencial ante ministro de fe'],['DT','Propuesta para el trámite voluntario en Mi DT'],['sindical','Intervención sindical conforme al artículo 177']]]];
const showMoney=n=>formatCLP(n);
function Amounts({rows}) {
  return <table style={{width:'100%',borderCollapse:'collapse',fontSize:'9.5pt'}}><thead><tr>{['Concepto','Base, período o respaldo','Pesos'].map(t=><th key={t} style={{textAlign:'left',padding:5,background:'#e8f1ec'}}>{t}</th>)}</tr></thead><tbody>{rows.map(([s,b,n],i)=><tr key={i}>{[s,b,showMoney(n)].map((v,j)=><td key={j} style={{borderBottom:'1px solid #d5dfd9',padding:5,textAlign:j===2?'right':'left'}}>{v}</td>)}</tr>)}</tbody></table>;
}
export default function CommunitySettlementDocument({community,worker,settings,onClose,employerKind='community',initialMode='settlement'}) {
  const isOffice=employerKind==='company';
  const [form,setForm]=useState(()=>({...partyData(community,worker,settings),wage:worker.baseSalary||'',contractType:worker.contractType||'',lines:[],mode:initialMode==='letter'?'letter':'settlement',cause:initialMode==='letter'?'161_1':''}));
  const patch=(key,value)=>setForm(f=>({...f,[key]:value,review:false}));
  const summary=settlementFigures(form),cause=causes.find(([id])=>id===form.cause)?.[1];
  const unilateral=['161_1','160','159_4','159_5'].includes(form.cause), is161=form.cause==='161_1',letter=unilateral && form.mode==='letter';
  const issues=[...partyIssues(form),...fieldIssues(facts,form)];
  if(form.protection!=='clear') issues.push('Revisa la procedencia de la causal antes de emitir.');
  if(!form.end || form.end<form.entry) issues.push('La separación debe ser posterior o igual al ingreso.');
  if(form.cause==='159_5') issues.push('La obra o faena requiere módulo de indemnización por tiempo servido y revisión del contrato de origen.');
  if(form.cause==='160' && !form.numeral?.trim()) issues.push('Especifica numeral, letra y hechos del artículo 160.');
  if(form.cause==='159_4' && !/plazo\s*fijo/i.test(form.contractType||'')) issues.push('El vencimiento de plazo exige un contrato a plazo fijo vigente. Comprueba renovaciones y continuidad.');
  if(!letter) {
    issues.push(...summary.issues,...fieldIssues(closing,form));
    if(summary.net>=1000000000) issues.push('El monto excede el rango de la conversión validada a palabras.');
    if(Number(form.days)>0 && !form.lines.some(l=>l.type==='descuento' && !l.alimony && Number(l.amount)>0) && !form.noDeductions?.trim()) issues.push('Detalla los descuentos de la liquidación final o documenta por qué no corresponde descontar saldo adicional.');
    if(form.signatureDate<form.end) issues.push('La fecha propuesta de suscripción es anterior a la separación.');
    if(form.alimony==='ordered' && (!form.court?.trim() || !form.lines.some(l=>l.type==='descuento' && l.alimony))) issues.push('Identifica la resolución, base y destino y marca su partida de retención.');
    if(form.alimony!=='ordered' && form.lines.some(l=>l.alimony)) issues.push('La retención alimenticia debe coincidir con la revisión de la resolución.');
    if(is161) issues.push(...fieldIssues(art172.slice(0,4),form));
    if(is161 && summary.ufDate && form.ufAsOf!==summary.ufDate) issues.push('La fecha de la UF debe ser '+readableDate(summary.ufDate)+'.');
    if(!form.calendarChecked) issues.push('Verifica el calendario de feriados del lugar de trabajo para feriado y plazo de pago.');
    if(!form.authorityEnd?.trim()) issues.push('Identifica el acuerdo o delegación que respalda este término.');
    if(form.contributions!=='checked' && unilateral) issues.push('Verifica y regulariza las cotizaciones exigibles para la causal.');
    if(form.route==='sindical' && !form.unionRole?.trim()) issues.push('Identifica el presidente del sindicato o delegado sindical y el antecedente de su calidad.');
    if(form.route==='presencial' && !form.minister) issues.push('Selecciona el ministro de fe para la vía presencial.');
    if(form.paymentPlan) issues.push('El pago en cuotas requiere un pacto específico y formalización separada.');
  } else {
    issues.push(...fieldIssues([['notice','Fecha de la carta','date'],['social','Antecedentes previsionales'],['paymentMethod','Lugar, modalidad y disponibilidad del finiquito'],['authorityEnd','Acuerdo que respalda el término']],form));
    if(form.contributions!=='checked') issues.push('Verifica las cotizaciones y los comprobantes que acompañarán la carta.');
    if(is161 && !form.noticeOffer?.trim()) issues.push('Individualiza los montos que ofrece pagar la comunidad conforme al artículo 162.');
  }
  if(!form.review) issues.push('Confirma que revisaste los respaldos y las partidas aplicables.');
  const val=k=>present(form[k])?readableDate(form[k]):'〔Pendiente〕';
  const updateLine=(index,key,value)=>patch('lines',form.lines.map((l,i)=>i===index?{...l,[key]:value}:l));
  const extraFields=[['authorityEnd',isOffice?'Respaldo o representación del empleador y fecha':'Acuerdo del comité sobre este término o delegación y fecha'],...(form.cause==='160'?[['numeral','Numeral, letra y supuesto legal concreto']]:[])];
  const title=letter?'Carta de término de contrato de trabajo':'Finiquito de contrato de trabajo';
  return <LaborDocument title={title} employerKind={employerKind} witness={!letter && (form.route==='presencial' ? 'Actuación del ministro de fe' : form.route==='sindical' ? 'Intervención sindical' : null)} workerCaption={letter?'RECEPCIÓN DE COPIA POR EL TRABAJADOR':'FIRMA DE LA PERSONA TRABAJADORA'} form={form} community={community} settings={settings} issues={issues} onClose={onClose} editor={<>
    <FieldGroup title="Partes y representación" fields={partyFields} form={form} patch={patch}/>
    <FieldGroup title="Antecedentes de la separación" fields={[...facts,...extraFields]} form={form} patch={patch} open/>
    {unilateral&&<fieldset className="flex gap-3"><legend>Documento</legend>{[['settlement','Finiquito'],['letter','Carta de término']].map(([k,l])=><label key={k}><input type="radio" checked={form.mode===k} onChange={()=>patch('mode',k)}/> {l}</label>)}</fieldset>}
    {letter?<FieldGroup title="Comunicación de término" fields={[['notice','Fecha de la carta','date'],closing[2],closing[3],closing[4],...(is161?[['noticeOffer','Indemnizaciones ofrecidas y montos']]:[])]} form={form} patch={patch} open/>:<>
      <FieldGroup title="Remuneración y feriado" fields={ledger} form={form} patch={patch} open/>
      <label className="block text-sm"><input type="checkbox" checked={!!form.calendarChecked} onChange={e=>patch('calendarChecked',e.target.checked)}/> Revisé sábados, domingos y festivos nacionales y locales del período.</label>
      {is161&&<FieldGroup title="Indemnizaciones y aviso previo" fields={[...art172,['ufAsOf','Fecha de la cotización UF','date']]} form={form} patch={patch} open/>}
      <details className="rounded-xl border p-4"><summary className="font-bold">Otros haberes, descuentos y pagos acreditados ({form.lines.length})</summary>
        {form.lines.map((l,i)=><div key={i} className="my-3 grid gap-2 sm:grid-cols-2"><label>Tipo<select aria-label="Tipo" value={l.type} onChange={e=>updateLine(i,'type',e.target.value)}>{[['haber','Haber adicional'],['descuento','Descuento o retención'],['abono','Abono ya pagado']].map(([k,n])=><option key={k} value={k}>{n}</option>)}</select></label>
        {[['label','Concepto'],['proof','Período, fundamento, base, comprobante y destino'],['amount','Monto en pesos']].map(([k,n])=><label key={k}>{n}<input className="block border rounded w-full p-1" type={k==='amount'?'number':'text'} value={l[k]||''} onChange={e=>updateLine(i,k,e.target.value)}/></label>)}
        {l.type==='descuento'&&<label><input type="checkbox" checked={!!l.alimony} onChange={e=>updateLine(i,'alimony',e.target.checked)}/> Retención por pensión de alimentos</label>}<button onClick={()=>patch('lines',form.lines.filter((_,j)=>i!==j))}>Retirar partida</button></div>)}
        <button type="button" className="mt-2 border rounded px-2" onClick={()=>patch('lines',[...form.lines,{type:'haber'}])}>Agregar partida</button></details>
      <FieldGroup title="Pago, documentos y formalización" fields={[...closing,...(form.alimony==='ordered'?[['court','Tribunal, causa, resolución, base, destino y estado de entero']]:[]),
        ...(form.route==='sindical'?[['unionRole','Representación sindical']]:[]),...(form.route==='presencial'?[['minister','Ministro de fe previsto','select',['Inspector del trabajo','Notario público de la localidad','Oficial del Registro Civil de la comuna o sección','Secretario municipal correspondiente'].map(s=>[s,s])]]:[]),
        ['noDeductions','Fundamento si la liquidación del período ya está saldada o exenta de descuentos'],['reserved','Reserva íntegra que solicita incorporar el trabajador (opcional)','textarea'],['disputes','Obligaciones pendientes, conceptos controvertidos y fechas, si existen','textarea']]} form={form} patch={patch}/>
      <label className="block text-sm"><input type="checkbox" checked={!!form.paymentPlan} onChange={e=>patch('paymentPlan',e.target.checked)}/> Se contempla pago en cuotas</label>
    </>}
    <label className="block text-sm"><input type="checkbox" checked={!!form.review} onChange={e=>setForm({...form,review:e.target.checked})}/> Revisé el expediente, la causal y los antecedentes económicos contra los registros de la comunidad.</label>
  </>}>
    <p>{val('city')} · {val(letter?'notice':'signatureDate')}. {val('employer')}, RUT {val('employerRut')}, con domicilio en {val('address')}, representada por {val('rep')}, RUT {val('repRut')}, en calidad de {val('role')}, según {val('authority')}. Persona trabajadora · {val('worker')}, RUT {val('workerRut')}, domiciliada en {val('home')}.</p>
    <Clause title="Relación laboral y fundamento del término"><p>Ingreso {val('entry')} · Separación {val('end')} · Cargo {val('job')} · Contrato {val('contractType')}. Causal invocada · {cause||'Pendiente'} {form.cause==='160'&&form.numeral}. Antecedente · {val('reference')}. {isOffice?'Respaldo de representación del empleador':'Acuerdo o delegación de la comunidad conforme al artículo 20 N.º 10 de la Ley 21.442'} · {val('authorityEnd')}.</p><p style={{whiteSpace:'pre-line'}}>{val('facts')}</p></Clause>
    {letter?<><Clause title={isOffice?'Comunicación del empleador':'Comunicación de la comunidad'}><p>Por medio de la presente {isOffice?'el empleador':'la comunidad'} comunica su decisión de poner término al contrato individual en la fecha y por la causal y hechos individualizados. {is161&&'Indemnizaciones ofrecidas · '+val('noticeOffer')+'.'}</p></Clause><Clause title="Cotizaciones, finiquito y reserva"><p>Antecedentes previsionales y comprobantes individualizados · {val('social')}. Modalidad y lugar propuestos para el finiquito · {val('paymentMethod')}. La persona trabajadora podrá elegir la vía presencial, aceptar voluntariamente la vía electrónica legal y formular reserva de derechos. {isOffice?'El empleador':'La comunidad'} conservará los comprobantes de notificación y remisión correspondientes.</p></Clause></>:<>
    <Clause title="Determinación de haberes e indemnizaciones"><p>Se individualizan las cantidades y bases de cada partida. La antigüedad efectiva comprende {summary.months} meses y {summary.tail} días. {is161&&'La indemnización legal considera la fracción superior a seis meses cuando se ha cumplido un año. La base se limita a 90 UF del último día del mes anterior al pago, sin perjuicio de beneficios convencionales superiores.'}</p>
    {is161&&<p>Base documentada · {val('baseProof')}. UF · {val('uf')} al {val('ufAsOf')} según {val('ufProof')}. Aviso · {form.notice?readableDate(form.notice):'sin aviso anticipado consignado'}.</p>}
    <p>Feriado · {val('vacDays')} días hábiles pendientes conforme a {val('vacProof')}. Se cuentan desde el día siguiente a la separación e incluyen los inhábiles intermedios. Feriados adicionales ingresados · {form.holidays|| (form.calendarChecked?'ninguno en el período':'calendario pendiente')}.</p><Amounts rows={summary.rows}/></Clause>
    <Clause title="Descuentos, abonos y saldo">{summary.discountRows.length>0&&<Amounts rows={summary.discountRows}/>} {summary.priorRows.length>0&&<Amounts rows={summary.priorRows}/>}<p>Total bruto {showMoney(summary.total)} · Descuentos y retenciones {showMoney(summary.deductions)} · Pagos previos acreditados {showMoney(summary.paid)}.</p><p><strong>Saldo según las partidas registradas · {showMoney(summary.net)}</strong>{summary.net>=0&&summary.net<1000000000&&' ('+numberToSpanishWords(summary.net)+')'}</p><p>Asistencia y liquidación de respaldo · {val('payrollProof')}. {form.noDeductions} {form.alimony==='ordered'&&'Retención alimenticia · '+val('court')+'.'}</p></Clause>
    <Clause title="Puesta a disposición y cotizaciones"><p>Modalidad de pago · {val('paymentMethod')}. Fecha prevista · {val('paymentDate')}. {form.calendarChecked&&summary.deadline&&'Plazo ordinario de diez días hábiles desde la separación · '+readableDate(summary.deadline)+'. '}El recibo de las sumas requiere comprobante que identifique importe, fecha y concepto. Un saldo pendiente conserva su exigibilidad.</p><p>Antecedentes previsionales por institución y período · {val('social')}. Las obligaciones del mes de separación se individualizan por separado de las ya exigibles. La firma del finiquito no sustituye el entero de cotizaciones.</p></Clause>
    <Clause title="Reserva de derechos y alcance"><p>La persona trabajadora puede formular reserva al suscribir, sin autorización del empleador y conservando el derecho al pago de las sumas no discutidas. El efecto liberatorio alcanza únicamente las materias expresamente acordadas conforme al artículo 177 del Código del Trabajo.</p><p style={{whiteSpace:'pre-wrap'}}>{form.reserved||'Reserva de la persona trabajadora al suscribir · ______________________________________'}</p>{form.disputes&&<p style={{whiteSpace:'pre-wrap'}}>Materias pendientes o controvertidas · {form.disputes}</p>}</Clause>
    <Clause title="Entrega y formalización"><p>Documentos previstos · {val('delivery')}. La restitución de bienes se registra por separado. Cada parte conservará un ejemplar íntegro con su detalle y reservas.</p><p>{form.route==='DT'?'La propuesta se tramitará voluntariamente mediante Mi DT. La plataforma oficial registrará la aceptación, reserva, ratificación y pago que efectivamente tengan lugar.':form.route==='sindical'?'Intervención sindical prevista · '+val('unionRole')+'.':'Vía presencial · '+(form.minister||'ministro de fe por individualizar')+'.'}</p></Clause>
    </>}
  </LaborDocument>;
}

