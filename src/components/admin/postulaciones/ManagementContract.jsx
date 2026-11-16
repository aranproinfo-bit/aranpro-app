import React from 'react';
import { managementContractSections, contractConditionLabels } from '../../../data/managementContract';
import { activeProposalConditions } from '../../../utils/proposalConditions';
import { formatCLP } from '../../../utils/formatters';
import { CanonicalPdfHeader, CanonicalPdfPageFooter, canonicalPortraitPrintStyles } from '../../common/CanonicalPdfParts';
import { AranproOfficialSeal } from '../../common/MauranLogo';

const blank = '____________________';
const value = v => typeof v === 'string' && v.trim() ? v.trim() : blank;
const clauses = managementContractSections.flatMap(section => section.clauses);
const contractPages = [
  { title:'I. Partes, mandato y habilitación', clauses:clauses.slice(0, 2) },
  { title:'II. Naturaleza y continuidad operativa', clauses:clauses.slice(2, 6) },
  { title:'III. Gobierno y control financiero', clauses:clauses.slice(6, 10) },
  { title:'IV. Honorarios y gestión del personal', clauses:clauses.slice(10, 13) },
  { title:'V. Prevención, proveedores y responsabilidad', clauses:clauses.slice(13, 16) },
  { title:'VI. Colaboración, datos y vigencia', clauses:clauses.slice(16, 20) },
  { title:'VII. Término, entrega y aceptación', clauses:clauses.slice(20, 24) }
];

// Un único árbol para vista previa, Paso 5 y Bandeja de Documentos.
// Las condiciones se distribuyen sin truncarlas ni reducir la tipografía.
export function contractConditionPages(terms) {
  const pages = [[]];
  let lines = 0;
  for (const [key, label] of contractConditionLabels) {
    const text = value(terms[key]);
    // También admite datos importados más extensos que los límites del formulario.
    const fragments = text.match(/[\s\S]{1,280}/g) || [text];
    for (const [part, fragment] of fragments.entries()) {
      const weight = fragment.split('\n').reduce((sum, line) => sum + Math.max(1, Math.ceil(line.length / 42)), 0) + 2;
      if (lines + weight > 44 && pages.at(-1).length) { pages.push([]); lines = 0; }
      pages.at(-1).push({ key:`${key}-${part}`, label:part ? `${label} (continuación)` : label, text:fragment });
      lines += weight;
    }
  }
  return pages;
}

const scopedCanonicalStyles = canonicalPortraitPrintStyles.replace(/@page\s*\{[^}]*\}/g, '').replace(/(^|})([^{}]+)\{/g, (_match, end, selectors) => `${end}${selectors.split(',').map(selector => `.management-contract ${selector.trim()}`).join(', ')}{`);
const contractStyles = `${scopedCanonicalStyles}
  .management-contract-page + .management-contract-page { break-before:page!important; page-break-before:always!important; }
  .management-contract-page { font-family:Arial,sans-serif!important; color:#23312c; flex-shrink:0; }
  .management-contract-page .contract-content { font-size:10.5pt!important; line-height:1.3!important; }
  .management-contract-page .contract-content p { margin:0 0 2mm!important; overflow-wrap:anywhere; }
  .management-contract-page .contract-content h2 { color:#0F3D2E; font-size:13pt!important; line-height:1.2!important; margin:4mm 0 3mm!important; padding-bottom:2mm; border-bottom:1pt solid #D4B895; }
  .management-contract-page .contract-content h3 { color:#0F3D2E; font-size:10.5pt!important; line-height:1.25!important; font-weight:700; margin:3mm 0 1.5mm!important; }
  .management-contract-page .contract-heading { text-align:center; font-size:14pt!important; line-height:1.2!important; color:#0F3D2E; font-weight:700; margin:4mm 0 3mm; }
  .management-contract-page .contract-footer { margin-top:auto; padding-top:3mm; flex-shrink:0; }
  .management-contract-page .contract-next { border-top:1px solid #cad5ce; display:flex; justify-content:space-between; align-items:center; gap:3mm; padding:2mm 0; font-size:8pt!important; }
  .management-contract-page .contract-next b { border:1px solid #b5d8c7; border-radius:12px; padding:1mm 3mm; white-space:nowrap; background:#f0faf4; color:#0F3D2E; }
  .management-contract-page .contract-conditions { display:grid; grid-template-columns:1fr 1fr; gap:2mm 4mm; }
  .management-contract-page .contract-condition { border-bottom:1px solid #dce4de; padding:1.5mm 0; min-width:0; }
  .management-contract-page .contract-condition strong { display:block; font-size:9pt!important; color:#0F3D2E; }
  .management-contract-page .contract-condition span { font-size:10pt!important; white-space:pre-wrap; overflow-wrap:anywhere; }
  .management-contract-page .contract-particulars { margin-top:3mm; font-size:9.5pt!important; line-height:1.4!important; }
  .management-contract-page .contract-signatures { display:grid; grid-template-columns:1fr 1fr; gap:10mm; text-align:center; font-size:9pt!important; }
  .management-contract-page .contract-signature-space { height:17mm; display:flex; align-items:flex-end; justify-content:center; border-bottom:1px solid #0F3D2E; margin-bottom:2mm; }
  .management-contract-page .contract-signature-space img { max-height:14mm; max-width:48mm; object-fit:contain; }
  .management-contract-page .contract-seal { display:flex; align-items:center; gap:4mm; border-top:1px solid #cad5ce; margin-top:3mm; padding-top:2mm; font-size:8pt!important; }
`;

export const managementContractPrintStyles = `@page { size:letter portrait; margin:0!important; } .aranpro-print-watermark { display:none!important; } ${contractStyles}`;

export function ManagementContract({ proposalConfig = {}, empresaForm = {}, signature = '', signatureScale = 1, pdfStyle = 'alt4' }) {
  const terms = activeProposalConditions(proposalConfig);
  const annexes = contractConditionPages(terms);
  const pages = [...contractPages, ...annexes.map((conditions, i) => ({ title: `Anexo. Condiciones particulares${i ? ' (continuación)' : ''}`, conditions }))];
  const community = value(proposalConfig.targetCondo);
  const city = value(proposalConfig.targetCity);
  const admin = value(empresaForm.adminName);
  const rut = value(empresaForm.adminRut);
  const representative = value(proposalConfig.committeePresidentName);
  const company = value(empresaForm.provisionalName);
  const phone = empresaForm.phone || '';
  const email = empresaForm.email || '';
  const website = empresaForm.website || 'https://aranpro.cl';
  const fee = !proposalConfig.unknownDetails && Number(proposalConfig.proposedMonthlyFee) > 0 ? formatCLP(Number(proposalConfig.proposedMonthlyFee)) : blank;
  return <div className="management-contract">
    <style>{contractStyles}</style>
    {pages.map((page, index) => {
      const last = index === pages.length - 1;
      return <div key={page.title} data-pdf-style={pdfStyle} className="dossier-page management-contract-page bg-white flex flex-col relative mx-auto" style={{ width:'215.9mm', boxSizing:'border-box' }}>
        <div className="contract-main">
          <CanonicalPdfHeader badge="CONTRATO DE ADMINISTRACIÓN" description="Mandato y prestación de servicios" community={community} page={index + 1} email={email} phone={phone} city={city} />
          {index === 0 && <h1 className="contract-heading">CONTRATO DE ADMINISTRACIÓN<br />DE CONDOMINIO Y PRESTACIÓN DE SERVICIOS</h1>}
          <div className="contract-content">
            <h2>{page.title}</h2>
            {index === 0 && <>
              <p>En <strong>{city}</strong>, a {blank}, comparecen la Comunidad <strong>{community}</strong>, RUT {blank}, domiciliada en {blank}, representada para este acto por <strong>{representative}</strong>, RUT {blank}, conforme a la personería individualizada en el anexo; y el prestador individualizado en dicho anexo, con nombre comercial <strong>{company}</strong> y administrador responsable <strong>{admin}</strong>, RUT <strong>{rut}</strong>, en adelante «la Comunidad» y «el Administrador», respectivamente.</p>
              <p>Las partes convienen un encargo de administración con obligaciones recíprocas, mecanismos de control y reglas de continuidad, en los siguientes términos:</p>
            </>}
            {page.clauses?.map(([title, paragraphs]) => <section key={title} data-contract-clause={title.split('.')[0]}><h3>{title}</h3>{paragraphs.map((text, i) => <p key={i}>{text}</p>)}</section>)}
            {page.conditions && <>
              <p>Estas condiciones se incorporan al contrato una vez revisadas y aceptadas por ambas partes. Complementan las cláusulas generales y no reducen los deberes legales del cargo.</p>
              {index === contractPages.length && <p><strong>Comunidad:</strong> {community}. <strong>Honorario mensual:</strong> {fee}. El monto, su carácter neto o total y los impuestos aplicables deben concordarse antes de la firma.</p>}
              <div className="contract-conditions">{page.conditions.map(item => <div key={item.key} className="contract-condition" data-contract-condition={item.key}><strong>{item.label}</strong><span>{item.text}</span></div>)}</div>
              {last && <div className="contract-particulars">
                <p><strong>Identificación del prestador:</strong> ☐ Persona natural ☐ Persona jurídica.<br />Nombre legal o razón social: {blank}. RUT: {blank}.<br />Domicilio: {blank}. Representante y personería, si procede: {blank}.<br />Inscripción RNAC informada: {value(empresaForm.rnacNumber)}. Verificación de vigencia: {blank}.</p>
                <p><strong>Acuerdos habilitantes:</strong> acta de designación de fecha {blank}; escritura pública, notaría y repertorio: {blank}. Facultades del representante comunitario: {blank}. Acuerdo del comité sobre honorarios: {blank}.</p>
                <p><strong>Pago y control:</strong> vencimiento y medio de pago: {blank}. Monto neto/total y tratamiento tributario: {blank}. Fórmula y periodicidad de reajuste, o sin reajuste: {blank}. Límites y autorizaciones de gasto: {blank}.</p>
                <p><strong>Notificaciones:</strong> correo de la Comunidad: {value(proposalConfig.targetEmail)}; correo del Administrador: {value(email)}. Horarios y canal operativo: {blank}. Las partes completan o dejan expresamente sin efecto los campos que no correspondan y aceptan el contrato y su anexo.</p>
              </div>}
            </>}
          </div>
        </div>
        <div className="contract-footer">
          {last ? <>
            <div className="contract-signatures">
              <div><div className="contract-signature-space" /><strong>{representative}</strong><br />Por la Comunidad, según personería<br />RUT: {blank}</div>
              <div><div className="contract-signature-space">{signature && <img src={signature} alt="Firma del administrador" style={{transform:`scale(${signatureScale})`,transformOrigin:'bottom center'}} />}</div><strong>{admin}</strong><br />Por el prestador, según calidad declarada<br />RUT: {rut}</div>
            </div>
            <div className="contract-seal"><AranproOfficialSeal size="sm" companyRut={empresaForm.companyRut || ''} rnacNumber="" showCaption={true} /><span><strong>Contacto:</strong> {phone}<br />{email} • {website}</span></div>
          </> : <div className="contract-next"><span>{pages[index + 1].title}</span><b>Continúa en página {index + 2} →</b></div>}
          <CanonicalPdfPageFooter website={website} label="Contrato de administración" page={index + 1} totalPages={pages.length} city={city} />
        </div>
      </div>;
    })}
  </div>;
}
