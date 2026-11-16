export const contractFields = [
  ['signatureDate','Fecha de firma',[]], ['communityRut','RUT de la comunidad',[]], ['communityAddress','Domicilio de la comunidad',[]],
  ['committeeRut','RUT del representante del comité',[]],
  ['providerType','Tipo de prestador',['Persona natural','Persona jurídica']],
  ['legalName','Nombre legal o razón social',[]], ['providerRut','RUT del prestador',[]], ['providerAddress','Domicilio del prestador',[]],
  ['providerAuthority','Representante y personería',['Actúa por sí mismo']],
  ['rnacVerification','Verificación de vigencia RNAC',[]],
  ['appointmentDate','Fecha del acta de designación',[]], ['deed','Escritura, notaría y repertorio',[]],
  ['committeeAuthority','Facultades del representante comunitario',[]], ['feeAgreement','Acuerdo del comité sobre honorarios',[]],
  ['payment','Vencimiento y medio de pago',['Transferencia dentro de los primeros 5 días del mes','Transferencia dentro de los primeros 10 días del mes']],
  ['taxTreatment','Monto neto o total e impuestos',[]],
  ['adjustment','Reajuste',['Sin reajuste durante la vigencia inicial','Reajuste anual según variación del IPC']],
  ['spendingAuthority','Límites y autorizaciones de gasto',['Según presupuesto aprobado y autorización del comité']],
  ['operatingChannel','Horario y canal operativo',[]]
];
export function activeContractDetails(proposal) {
  return proposal.targetCondo?.trim().toLocaleLowerCase('es-CL') === proposal.contractDetailsFor?.trim().toLocaleLowerCase('es-CL') && proposal.targetCondo?.trim() ? (proposal.contractDetails || {}) : {};
}
export function resolveContractDetails(proposal, company, savedCompany = {}) {
  const details = activeContractDetails(proposal);
  const natural = details.providerType === 'Persona natural';
  const defaults = { legalName:natural ? company.adminName : '', providerRut:natural ? company.adminRut : company.companyRut,
    providerAddress:savedCompany.address || '', providerAuthority:natural ? 'Actúa por sí mismo' : '' };
  // Una edición vacía es intencional: no recuperar un dato que el usuario borró.
  return { ...defaults, ...details };
}
