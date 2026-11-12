import { paginateInspection } from './inspectionPagination.js';

// Las referencias de demostración antiguas deben excluirse sin borrar los datos
// guardados ni ocultar una referencia real que haya sido editada.
const isExampleReference = ref =>
  (ref.id === 'ref-1' && ref.contactName === 'Carlos Morales Rojas' && ref.phone === '+56988776655' && ref.communityName === 'Condominio Los Cerezos' && String(ref.quote || '').startsWith('Gestión muy cercana, ordenada y con gran dominio técnico en terreno.')) ||
  (ref.id === 'ref-2' && ref.contactName === 'Marcela Castillo Gómez' && ref.phone === '+56977665544' && ref.communityName === 'Condominio Los Cerezos' && String(ref.quote || '').startsWith('La plataforma digital ha traído una transparencia total.'));

const fields = entries => entries.filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '').map(([label, value]) => `${label}: ${value}`).join('\n');

export function dossierEvidencePages(academicRecords = [], accreditationDocs = [], references = []) {
  const cards = [];
  for (const record of academicRecords) {
    if (record.includeInProposal === false || !record.fileData || record.fileError) continue;
    cards.push({ id: `acad-${record.id}`, name: 'Formación profesional con respaldo disponible', notes: fields([['Título',record.title],['Institución',record.institution],['Año',record.year],['Estado informado',record.status],['Aporte',record.relevance],['Archivo',record.fileName]]) });
  }
  for (const record of accreditationDocs) {
    if (record.includeInDossier === false || !record.fileData || record.fileError) continue;
    cards.push({ id: `doc-${record.id}`, name: 'Documento de acreditación con respaldo disponible', notes: fields([['Documento',record.name],['Emisor',record.issuer],['Folio',record.folio],['Estado informado',record.status],['Archivo',record.fileName]]) });
  }
  for (const ref of references) {
    if (!ref.confirmed || isExampleReference(ref)) continue;
    cards.push({ id: `ref-${ref.id}`, name: 'Referencia confirmada por la administración', notes: fields([['Contacto',ref.contactName],['Cargo',ref.role],['Comunidad',ref.communityName],['Teléfono',ref.phone],['Testimonio',ref.quote]]) });
  }
  return paginateInspection(cards);
}
