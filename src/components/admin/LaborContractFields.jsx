import React from 'react';

export const steps = ['Personas y comunidad', 'Cargo y contrato', 'Jornada y turnos', 'Remuneración', 'Revisar y emitir'];

export const groups = [
  [0, 'Persona trabajadora', 'nombre_trabajador rut_trabajador fecha_nacimiento nacionalidad_trabajador domicilio_trabajador correo_trabajador'],
  [0, 'Comunidad empleadora', 'nombre_empleador rut_empleador domicilio_empleador correo_empleador'],
  [0, 'Quién firma por la comunidad', 'nombre_representante rut_representante calidad_representante respaldo_representacion'],
  [1, 'Ingreso y firma', 'fecha_ingreso fecha_real_firma comuna_firma'],
  [1, 'Lugar de trabajo y supervisión', 'nombre_condominio direccion_centro comuna_centro cargo_jefatura'],
  [2, 'Horario que figurará en el contrato', 'horas_semanales_o_promedio dias_trabajo tabla_turnos'],
  [2, 'Asistencia y relevo', 'sistema_asistencia responsable_cobertura'],
  [3, 'Sueldo y forma de pago', 'sueldo_base_monto dia_o_regla_de_pago medio_pago lugar_pago'],
  [3, 'Otros pagos', 'bonos_pactados_con_monto_y_devengo asignaciones_con_monto_y_condiciones clausula_gratificacion_aplicable'],
  [3, 'Referencia para revisar el sueldo', 'fecha_evaluacion']
].map(([step,title,keys])=>({step,title,keys:keys.split(' ')}));

const choices = {
  correo_trabajador:['Sin correo electrónico'], correo_empleador:['Sin correo electrónico'],
  calidad_representante:['Presidente del comité de administración','Administrador de la comunidad'],
  cargo_jefatura:['Administrador de la comunidad','Mayordomo'],
  responsable_cobertura:['Administrador de la comunidad','Mayordomo'],
  sistema_asistencia:['Libro de asistencia','Reloj control','Sistema electrónico de asistencia'],
  medio_pago:['Transferencia bancaria','Cheque'], dia_o_regla_de_pago:['último día hábil del mes'],
  lugar_pago:['Cuenta bancaria indicada por la persona trabajadora','Oficina de administración'],
  bonos_pactados_con_monto_y_devengo:['Sin bonos pactados'],
  asignaciones_con_monto_y_condiciones:['Sin asignaciones pactadas']
};
const hints = {
  calidad_representante:'Indica en qué calidad firma la persona nombrada.',
  respaldo_representacion:'Busca el acta o poder que faculta a esa persona para firmar. Anota su identificación y fecha.',
  fecha_real_firma:'Día en que las partes firmarán el contrato.',
  fecha_ingreso:'Primer día de trabajo en la comunidad.',
  responsable_cobertura:'¿A quién debe avisar el trabajador si su relevo no llega?',
  dia_o_regla_de_pago:'¿Qué día recibe el sueldo cada mes?',
  sueldo_base_monto:'Monto bruto mensual pactado, en pesos, antes de descuentos.',
  bonos_pactados_con_monto_y_devengo:'Para cada bono indica monto, cuándo se paga y qué condición debe cumplirse.',
  asignaciones_con_monto_y_condiciones:'Por ejemplo, colación o movilización. Indica monto y cuándo corresponde pagarlo.',
  clausula_gratificacion_aplicable:'Consulta el acuerdo de remuneración o al encargado de remuneraciones de la comunidad e indica el régimen que corresponde.',
  fecha_evaluacion:'Fecha que se usará para consultar el mínimo y revisar las horas pactadas.'
};

export default function LaborContractFields({group, fields, form, update, collapseKeys=[], employerKind='community'}) {
  const renderField = key => {
    const [,originalLabel,type='text'] = fields.find(([id])=>id===key);
    const companyLabels = {nombre_empleador:'Razón social o nombre del empleador',rut_empleador:'RUT del empleador',domicilio_empleador:'Domicilio del empleador',nombre_condominio:'Nombre del lugar de trabajo'};
    const label = employerKind==='company' ? companyLabels[key] || originalLabel : originalLabel;
    const id='labor-field-'+key;
    return <div key={key} className="min-w-0">
      <label htmlFor={id} className="block text-sm font-semibold text-slate-800">{label}</label>
      {hints[key] && <p id={id+'-help'} className="mt-1 text-xs text-slate-600">{hints[key]}</p>}
      <input id={id} aria-describedby={hints[key] ? id+'-help' : undefined} type={type} value={form[key]??''} onChange={e=>update(key,e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-emerald-700" />
      {choices[key] && <div className="mt-1.5 flex flex-wrap gap-1">{(employerKind==='company' && key==='calidad_representante' ? ['Representante legal del empleador'] : choices[key]).map(option=><button key={option} type="button" onClick={()=>update(key,option)} className="rounded-md bg-emerald-50 px-2 py-1 text-xs text-emerald-900 hover:bg-emerald-100">{option}</button>)}</div>}
    </div>;
  };
  const editable=group.keys.filter(key=>!collapseKeys.includes(key));
  const known=group.keys.filter(key=>collapseKeys.includes(key));
  return <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
    <h4 className="font-bold text-[#0F3D2E]">{employerKind==='company' && group.title==='Comunidad empleadora' ? 'Empresa empleadora' : employerKind==='company' && group.title==='Quién firma por la comunidad' ? 'Quién representa al empleador' : group.title}</h4>
    {editable.length>0 && <div className="grid gap-4 sm:grid-cols-2">{editable.map(renderField)}</div>}
    {known.length>0 && <details><summary className="cursor-pointer text-sm font-semibold text-emerald-800">Ver o editar {known.length} {known.length===1?'dato cargado':'datos cargados'}</summary>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">{known.map(renderField)}</div>
    </details>}
  </section>;
}
