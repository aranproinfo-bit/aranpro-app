import { validChileanRut } from './laborContractChecks.js';

export const readableDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value) ? value.split('-').reverse().join('/') : value;
export const present = value => String(value ?? '').trim().length > 0;
export function partyData(community, worker = {}, settings = {}) {
  const f = worker.laborContractData?.form || {};
  return {
    employer: f.nombre_empleador || community.bankInfo?.holderName || community.name || '',
    employerRut: f.rut_empleador || community.bankInfo?.rut || '',
    address: f.domicilio_empleador || community.address || '',
    city: f.comuna_firma || community.city || '',
    rep: f.nombre_representante || settings.adminName || '',
    repRut: f.rut_representante || settings.adminRut || '',
    role: f.calidad_representante || '', authority: f.respaldo_representacion || '',
    worker: worker.name || f.nombre_trabajador || '', workerRut: worker.rut || f.rut_trabajador || '',
    home: worker.address || f.domicilio_trabajador || '', job: worker.role || f.nombre_cargo || '',
    entry: worker.startDate || f.fecha_ingreso || '', contract: f.fecha_real_firma || ''
  };
}
export const partyFields = [
  ['employer','Comunidad empleadora'], ['employerRut','RUT de la comunidad'], ['address','Domicilio del empleador'],
  ['city','Comuna'], ['rep','Representante'], ['repRut','RUT del representante'], ['role','Calidad del representante'],
  ['authority','Acuerdo del comité o delegación de la asamblea'], ['worker','Persona trabajadora'],
  ['workerRut','RUT del trabajador'], ['home','Domicilio del trabajador'], ['job','Cargo'], ['entry','Fecha original de ingreso','date']
];
export function fieldIssues(fields, form) {
  const issues = [];
  for (const [key,label,type] of fields) {
    const value = form[key];
    if (!present(value)) issues.push('Completa «'+label+'».');
    else if (type === 'date' && !validDate(value)) issues.push('Revisa «'+label+'».');
    else if (type === 'number' && (!Number.isFinite(Number(value)) || Number(value)<0)) issues.push('Revisa «'+label+'».');
  }
  return issues;
}
export function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const d = new Date(value+'T00:00:00Z');
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0,10) === value;
}
export function partyIssues(form) {
  return [...fieldIssues(partyFields,form), ...['employerRut','repRut','workerRut'].filter(k=>form[k] && !validChileanRut(form[k])).map(k=>'Revisa el dígito verificador de «'+partyFields.find(([id])=>id===k)[1]+'».')];
}
