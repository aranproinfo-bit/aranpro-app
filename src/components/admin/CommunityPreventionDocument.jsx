import React, {useState} from 'react';
import regulation from './communityRegulation.md?raw';
import protocol from './communityKarin.md?raw';
import { Clause, FieldGroup, LaborDocument } from './CommunityLaborDocument';
import { fieldIssues, present, readableDate } from '../../utils/communityLaborFields';
import {validChileanRut} from '../../utils/laborContractChecks';

const versionKeys=['version','fecha_comunicacion','fecha_vigencia','fecha_aprobacion','fecha_firma_aprobacion','fecha_revision','acto_aprobacion'];
const aliases = {
  nombre_empleador:'nombre_comunidad',rut_empleador:'rut_comunidad',domicilio_empleador:'direccion_centro',
  receptor_karin:'receptor_denuncias',suplente_karin:'suplente_denuncias',canal_karin_electronico:'correo_reservado',
  canal_karin_presencial:'direccion_atencion',canal_independiente:'canal_suplente',canal_operativo:'canal_solicitudes_residentes',
  contactos_emergencia:'directorio_emergencias_verificado',respaldo_facultades:'documento_personeria'
};
const labels = {
  canal_rrhh:'Canal de Recursos Humanos', sistema_asistencia:'Sistema de asistencia', responsable_asistencia:'Responsable del registro de asistencia',
  canal_ausencias:'Canal para avisar ausencias', tipos_remuneracion_por_cargo:'Tipos de remuneración por cargo', hora_pago:'Hora de pago',
  lugar_pago:'Lugar de pago', medio_pago:'Medio de pago', cargo_reclamos_igualdad:'Responsable de reclamos de igualdad salarial',
  cargo_reclamos:'Responsable de consultas y reclamos', canal_alternativo_rrhh:'Canal alternativo de Recursos Humanos', plazo_interno_respuesta:'Plazo interno de respuesta',
  nombre_representante:'Nombre del representante',calidad_representante:'Calidad del representante',region:'Región',version:'Versión',
  direccion_atencion:'Dirección de atención presencial', responsable_prevencion:'Responsable de prevención',canal_prevencion:'Canal de prevención',
  empresas_externas:'Empresas externas presentes', canal_solicitudes_residentes:'Canal para solicitudes de residentes', suplente_denuncias:'Receptor suplente de denuncias',
  receptor_denuncias:'Receptor principal de denuncias', centro_asistencial:'Centro asistencial',plazo_descargos:'Plazo para descargos',
  colacion_cobertura:'Colación y cobertura del turno',retencion_cctv:'Plazo de conservación de las grabaciones',finalidad_cctv:'Finalidad del CCTV',
  inventario_cctv:'Cámaras y zonas cubiertas',custodio_cctv:'Custodio de grabaciones',acceso_cctv:'Personas habilitadas para acceder a las imágenes',
  datos_minimos_acceso:'Datos mínimos en el control de acceso',responsable_asistencia_registro:'Responsable del registro',
  fecha_aprobacion:'Fecha del acto de aprobación', fecha_firma_aprobacion:'Fecha real de firma del acto', fecha_revision:'Próxima revisión',
  direccion_emergencia:'Dirección y acceso de emergencia',ayudas_evacuacion:'Apoyos de evacuación', canal_urgente:'Canal de protección urgente',
  responsable_disciplinario:'Responsable del procedimiento disciplinario',centros_de_trabajo:'Centros de trabajo comprendidos',
  respaldo_participacion:'Antecedente de participación del personal', respaldo_asistencia_organismo:'Respaldo de asistencia técnica preventiva',
  confirmacion_canales:'Fecha y responsable de la prueba de los canales', catalogo_cargos:'Cargos, misión, funciones y características técnicas esenciales',

  nombre_comunidad:'Razón social de la comunidad',rut_comunidad:'RUT de la comunidad',direccion_centro:'Domicilio y centro de trabajo',
  dotacion_empleador:'Trabajadores permanentes de la comunidad empleadora',dotacion_centro:'Personas que trabajan en este centro',
  correo_reservado:'Correo reservado de denuncias',canal_suplente:'Medio de contacto independiente del suplente',
  canal_atencion_temprana:'Contacto para atención psicológica temprana', documento_personeria:'Acuerdo o delegación que acredita la representación',
  codigo_cargo:'Cargos y códigos de los turnos',base_jornada:'Régimen y respaldo de los turnos', alarma_ruta_punto:'Alarma, ruta y punto de encuentro',
  evaluacion_local:'Riesgos evaluados, puestos y turnos expuestos, medidas, responsables, plazos e indicadores',
  fecha_comunicacion:'Fecha de comunicación de esta versión',fecha_vigencia:'Entrada en vigencia',organismo_administrador:'Mutualidad o ISL',
  acto_aprobacion:'Acta o resolución de aprobación',plazo_revision_resguardo:'Plazo para revisar las medidas de resguardo',
  instrucciones_y_horarios:'Instrucciones y horarios de atención'
};
const label = key=>labels[key] || (key[0].toUpperCase()+key.slice(1)).replaceAll('_',' ');
const modules=[
  ['access','Conserjería y control de accesos'],['gates','Portones y barreras'],['lift','Ascensores'],['plant','Salas técnicas'],
  ['cctv','CCTV'],['remote','Teletrabajo'],['loads','Carga manual'],['sun','Radiación UV o temperatura'],['noise','Ruido o vibración'],
  ['silica','Sílice'],['altitude','Hipobaria'],['chem','Agentes químicos o biológicos']
];
const optionalLines=[[/^\*\*V-0[34]\./,'remote'],[/^\*\*P-16\./,'loads'],[/^\*\*P-17\./,'sun'],[/^\*\*P-18\./,'noise'],[/^\*\*P-20\./,'silica'],[/^\*\*P-21\./,'altitude'],[/^\*\*P-22\./,'chem'],[/^(?:[12]\. \*\*|\*\*O-22\.)/,'access'],[/^3\. \*\*Portones/,'gates'],[/^4\. \*\*Ascensores/,'lift'],[/^5\. \*\*Salas/,'plant'],[/^(?:6\. \*\*CCTV|\*\*O-24\.)/,'cctv']];
const annexRisks = regulation.split('## C · Fichas')[1].split('## D ·')[0].split('\n').filter(s=>s.startsWith('| ')&&!s.includes('Daño posible')).map(s=>s.split('|')[1].trim());
const shiftKeys=['codigo_cargo','ciclo','horario','colacion_cobertura','horas_descansos','base_jornada','responsable_relevo'];
function selectedText(isReg, form, regime) {
  let text = isReg ? regulation : protocol;
  if (isReg && regime!=='RIOHS') text=text.replace(/# Libro I ·[\s\S]*?(?=# Libro II ·)/,'');
  if (isReg) text=text.split('\n').filter(line=>{
    const option = optionalLines.find(([re])=>re.test(line));
    if(option && !form[option[1]]) return false;
    const task = line.startsWith('| ') ? line.split('|')[1].trim() : '';
    return !annexRisks.includes(task) || form.risks?.includes(task);
  }).join('\n');
  if(isReg && !modules.slice(0,5).some(([k])=>form[k])) text=text.replace(/## B · Conserjería[\s\S]*?(?=## C · Fichas)/,'');
  if(isReg) {
    const scheduleRow='| '+shiftKeys.map(k=>'{{'+k+'}}').join(' | ')+' |';
    const extras=(form.extraShifts||[]).map((_,i)=>'| '+shiftKeys.map(k=>'{{shift'+i+'_'+k+'}}').join(' | ')+' |');
    text=text.replace(scheduleRow,[scheduleRow,...extras].join('\n'));
    if(Number(form.dotacion_empleador)>=200) text=text.replace('Ante ausencias,','Registro de cargos y características técnicas · {{catalogo_cargos}}\n\nAnte ausencias,');
  }
  text=text.replace('La tabla es un banco de cláusulas y no equivale a una evaluación del centro.', 'La evaluación específica y el programa de medidas se individualizan en esta versión.');
  return text.replace(/\{\{(\w+)\}\}/g,(_,key)=>'{{'+(aliases[key]||key)+'}}');
}
function inline(text) {
  return text.replaceAll('\x60','').split(/(\*\*[^*]+\*\*)/g).map((part,i)=>part.startsWith('**')?<strong key={i}>{part.slice(2,-2)}</strong>:part);
}
function Body({source,values}) {
  const fill = line=>line.replace(/\{\{(\w+)\}\}/g,(_,key)=>present(values[key]) ? String(readableDate(values[key])) : '〔'+label(key)+' pendiente〕');
  const blocks=source.replaceAll('\r','').trim().split(/\n\s*\n/).map(s=>s.trim());
  return blocks.map((block,i)=>{
    if (block.startsWith('#')) return <h3 key={i} style={{color:'#0f3d2e',fontWeight:700,fontSize:block.startsWith('# ')?'13pt':'11pt',marginTop:12,breakAfter:'avoid'}}>{block.replace(/^#+\s*/,'')}</h3>;
    if (block.startsWith('|')) {
      const rows=block.trim().split('\n').filter(row=>!row.startsWith('|---')).map(row=>row.split('|').slice(1,-1));
      const row=(cells,Tag)=>cells.map((cell,c)=><Tag style={{border:'1px solid #cbd9d3',padding:'4px 6px',textAlign:'left',verticalAlign:'top'}} key={c}>{inline(fill(cell.trim()))}</Tag>);
      return <table key={i} style={{width:'100%',borderCollapse:'collapse',fontSize:'9pt'}}><thead style={{background:'#e9f2ee'}}><tr>{row(rows[0],'th')}</tr></thead><tbody>{rows.slice(1).map((r,j)=><tr key={j}>{row(r,'td')}</tr>)}</tbody></table>;
    }
    if(block.startsWith('*Fundamento')) return <p key={i} style={{fontSize:'8.5pt',color:'#52665f'}}>{fill(block.replace(/^\*|\*$/g,''))}</p>;
    return <div key={i}>{block.split('\n').map((line,j)=><p key={j} style={{marginBottom:4}}>{inline(fill(line.replace(/^- /,'• ')))}</p>)}</div>;
  });
}
export default function CommunityPreventionDocument({kind,community,settings={},onSave,onClose,employerKind='community'}) {
  const isReg=kind==='regulation';
  const isOffice=employerKind==='company';
  const [form,setForm]=useState(()=>({
    nombre_comunidad:community.bankInfo?.holderName || community.name || '',rut_comunidad:community.bankInfo?.rut || '',
    direccion_centro:community.address || '',centros_de_trabajo:community.address || '', comuna:community.city || '',region:community.region || '',
    nombre_representante:settings.adminName || '',repRut:settings.adminRut || '', ...community.laborPrevention, ...community.laborPrevention?.editions?.[kind]
  }));
  const [message,setMessage]=useState('');
  const patch=(key,value)=>{setMessage('');setForm(f=>({...f,[key]:value,reviewed:false}));};
  const count=Number(form.dotacion_empleador);
  const known=present(form.dotacion_empleador) && Number.isInteger(count) && count>0;
  const regime=known?(count>=10?'RIOHS':'RIHS'):'';
  const name=regime==='RIOHS'?'Reglamento interno de orden, higiene y seguridad':regime==='RIHS'?'Reglamento interno de higiene y seguridad':(isOffice?'Reglamento interno de la empresa':'Reglamento interno de la comunidad');
  const title=isReg?name:'Protocolo de prevención e investigación · Ley Karin';
  const values={...form,titulo_reglamento:name,RIOHS_o_RIHS:regime,nombre_y_calidad_aprobante:[form.nombre_representante,form.calidad_representante].filter(Boolean).join(' · ')};
  for(const [i,shift] of (form.extraShifts||[]).entries()) for(const key of shiftKeys) values['shift'+i+'_'+key]=shift[key]||'';
  const source=selectedText(isReg,form,regime);
  const keys=[...new Set(['dotacion_empleador','dotacion_centro','version','fecha_comunicacion','fecha_vigencia','nombre_comunidad','rut_comunidad','nombre_representante','repRut','calidad_representante','documento_personeria','organismo_administrador','receptor_denuncias','suplente_denuncias','canal_suplente','confirmacion_canales','evaluacion_local',...Array.from(source.matchAll(/\{\{(\w+)\}\}/g),m=>m[1])])].filter(k=>!/^shift[0-9]+_/.test(k) && !['titulo_reglamento','RIOHS_o_RIHS','nombre_y_calidad_aprobante'].includes(k));
  const fields=keys.map(key=>[key,key==='repRut'?'RUT del representante':label(key),['fecha_comunicacion','fecha_vigencia','fecha_aprobacion','fecha_revision','fecha_firma_aprobacion'].includes(key)?'date':key.startsWith('dotacion_')?'number':key==='evaluacion_local'?'textarea':'text']);
  const issues=fieldIssues(fields,form);
  if(isReg) (form.extraShifts||[]).forEach((shift,i)=>{if(shiftKeys.some(k=>!present(shift[k]))) issues.push('Completa la distribución del turno adicional '+(i+1)+'.');});

  if(!known || !Number.isInteger(Number(form.dotacion_centro)) || Number(form.dotacion_centro)<=0) issues.push('Confirma las dotaciones del empleador y del centro.');
  if(!validChileanRut(form.rut_comunidad)||!validChileanRut(form.repRut)) issues.push('Verifica los RUT de comunidad y representante.');
  if(present(form.suplente_denuncias) && form.suplente_denuncias.trim().toLowerCase()===form.receptor_denuncias?.trim().toLowerCase()) issues.push('Identifica un suplente independiente.');
  if(present(form.canal_suplente) && form.canal_suplente.trim().toLowerCase()===form.correo_reservado?.trim().toLowerCase()) issues.push('El canal suplente debe ser independiente del buzón principal.');
  if(isReg && Date.parse(form.fecha_vigencia)-Date.parse(form.fecha_comunicacion)<30*86400000) issues.push('Entre comunicación y vigencia deben mediar al menos 30 días.');
  if(!isReg && ((form.fecha_aprobacion>form.fecha_vigencia)||(form.fecha_revision<=form.fecha_vigencia))) issues.push('Comprueba la secuencia de aprobación, vigencia y próxima revisión.');
  if(!form.reviewed) issues.push('Revisa la aplicabilidad, el programa preventivo y los canales de esta comunidad.');
  const group1=fields.filter(([k])=>/dotacion|comunidad|representante|personeria|^repRut$|^version$|^fecha_|^comuna$|^region$|centro|domicilio/.test(k));
  const group2=fields.filter(f=>!group1.includes(f) && /canal|correo|receptor|suplente|resguardo|atencion|organismo|confirmacion|directorio|inspeccion/.test(f[0]));
  const group3=fields.filter(f=>!group1.includes(f)&&!group2.includes(f));
  const paperForm={...form,rep:form.nombre_representante,role:form.calidad_representante};
  return <LaborDocument title={title} collective employerKind={employerKind} community={community} settings={settings} form={paperForm} issues={issues} onClose={onClose} editor={<>
    <p className="text-sm">El reglamento y el protocolo comparten los contactos y antecedentes preventivos de {community.name}. Registra aquí únicamente información institucional.</p>
    {isReg && <p className="text-sm" aria-live="polite">{known
      ? (count>=10 ? 'Se generará un único reglamento de orden, higiene y seguridad (RIOHS). Incluye las normas de orden y de prevención.' : 'Se generará el reglamento interno de higiene y seguridad (RIHS) para esta dotación.')
      : 'Indica cuántos trabajadores permanentes contrata habitualmente esta comunidad para determinar qué reglamento corresponde.'}</p>}
    <FieldGroup title="Empleador, centro y vigencia" fields={group1} form={form} patch={patch} open/>
    <FieldGroup title="Denuncias, suplencia y emergencias" fields={group2} form={form} patch={patch}/>
    {isReg&&<details className="rounded-xl border p-4"><summary>Instalaciones, tareas y exposiciones verificadas</summary><div className="grid sm:grid-cols-2 gap-2 my-3">{modules.map(([k,l])=><label key={k}><input type="checkbox" checked={!!form[k]} onChange={e=>patch(k,e.target.checked)}/> {l}</label>)}</div><strong>Fichas de riesgo aplicables</strong><div className="grid sm:grid-cols-2 gap-2">{annexRisks.map(task=><label key={task}><input type="checkbox" checked={!!form.risks?.includes(task)} onChange={e=>patch('risks',e.target.checked?[...(form.risks||[]),task]:(form.risks||[]).filter(r=>r!==task))}/> {task}</label>)}</div></details>}
    {isReg&&<details className="rounded-xl border p-4"><summary>Turnos adicionales ({form.extraShifts?.length||0})</summary><p className="my-2 text-sm">El turno principal está en los antecedentes operativos. Agrega aquí las demás distribuciones vigentes.</p>{(form.extraShifts||[]).map((shift,i)=><div key={i} className="my-2"><FieldGroup title={'Turno adicional '+(i+1)} fields={shiftKeys.map(k=>[k,label(k)])} form={shift} patch={(k,v)=>patch('extraShifts',form.extraShifts.map((r,j)=>j===i?{...r,[k]:v}:r))} open/><button onClick={()=>patch('extraShifts',form.extraShifts.filter((_,j)=>i!==j))}>Retirar este turno</button></div>)}<button className="rounded border px-2" onClick={()=>patch('extraShifts',[...(form.extraShifts||[]),{}])}>Agregar turno</button></details>}
    <FieldGroup title="Programa, responsables y antecedentes operativos" fields={group3} form={form} patch={patch}/>
    <label className="block text-sm"><input type="checkbox" checked={!!form.reviewed} onChange={e=>setForm({...form,reviewed:e.target.checked})}/> Revisé dotaciones, turnos, riesgos, responsables, recursos y medios de contacto para esta versión.</label>
    <button className="rounded-lg border px-3 py-2" onClick={()=>{const {editions,...data}=form;delete data.reviewed;const edition={};for(const k of versionKeys){edition[k]=data[k] || '';delete data[k];}onSave({...data,editions:{...editions,[kind]:edition}});setMessage('Configuración guardada para esta comunidad.');}}>Guardar configuración de la comunidad</button><span role="status" className="ml-2 text-sm">{message}</span>
  </>}>
    <Clause title="Aplicación en este centro"><p>{known?regime+' · '+count+' trabajadores permanentes':'Dotación permanente pendiente de confirmación'}. Versión {form.version||'pendiente'}. {isOffice?'Representación del empleador':'Representación de la comunidad'} según {form.documento_personeria||'antecedente pendiente'}.</p><p style={{whiteSpace:'pre-line'}}>{form.evaluacion_local||'Evaluación de riesgos y programa local pendientes.'}</p><p>Canal alternativo independiente · {form.suplente_denuncias||'Pendiente'} · {form.canal_suplente||'Pendiente'}</p></Clause>
    <Body source={source} values={values}/>
    <Clause title="Referencias normativas"><p>Código del Trabajo, artículos 153 a 156 y 211-A a 211-E. Ley N.º 16.744 y D.S. N.º 44 sobre gestión preventiva. Ley N.º 21.643 y D.S. N.º 21 de 2024 sobre investigación de acoso y violencia en el trabajo.{!isOffice && ' Ley N.º 21.442 sobre copropiedad inmobiliaria.'}</p></Clause>
  </LaborDocument>;
}

