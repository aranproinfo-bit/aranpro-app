import React from 'react';
import { CanonicalPdfHeader, CanonicalPdfPageFooter, CanonicalPdfFinalSignature, canonicalPdfHeaderStyles } from '../../common/CanonicalPdfParts';

// Medidas específicas de la pauta aprobada; no afectan los demás documentos.
export const transitionChecklistPrintStyles = `
  @page { size: letter portrait; margin: 0 !important; }
  .dossier-page {
    height: 279.4mm !important; min-height: 279.4mm !important; max-height: 279.4mm !important;
    padding: 8mm 16mm 8mm 17mm !important;
    border-left: 3.3mm solid #0F3D2E !important;
    background-image: linear-gradient(#D4B895, #D4B895) !important;
    background-size: 1.2mm 100% !important; background-position: 0.5mm 0 !important;
    background-repeat: no-repeat !important;
    font-size: 10.5px !important; line-height: 1.3 !important;
  }
  .dossier-page img[src*="ARANPRO_logo_horizontal"] {
    width: 37mm !important; max-width: 37mm !important;
    height: auto !important; max-height: 11mm !important; object-fit: contain !important;
  }
  ${canonicalPdfHeaderStyles}
  .transition-title { margin-top: 4mm !important; margin-bottom: 4mm !important; }
  .transition-title h2 { font-family: Arial, sans-serif !important; font-size: 14pt !important; line-height: 16pt !important; font-weight: 700 !important; }
  .transition-title p { font-size: 8.5pt !important; line-height: 10pt !important; margin-top: 1mm !important; }
  .transition-metadata { font-size: 7.4pt !important; }
  .transition-metadata strong { background: #f8fafc !important; margin: -4px -4px 3px; padding: 3px 4px; }
  .dossier-page table { font-size: 8.075pt !important; line-height: 1.25 !important; }
  .dossier-page table td { padding-top: 5px !important; padding-bottom: 5px !important; }
  .transition-page-with-notes table td { padding-top: 8px !important; padding-bottom: 8px !important; }
  .transition-final-footer { gap: 8px !important; }
  .transition-final-footer .transition-footer-details { gap: 8px !important; flex: 1 1 auto; min-width: 0; }
  .transition-final-footer .transition-footer-seal { flex: 0 0 auto; gap: 6px !important; }
  .transition-final-footer .transition-footer-seal > div { white-space: nowrap; }
  .transition-final-footer .transition-footer-seal > div > div:first-child { font-size: 8px !important; letter-spacing: 0 !important; }
  .transition-final-footer .transition-footer-seal > div > div:last-child { font-size: 7.5px !important; }
  .transition-final-footer .transition-footer-contact { flex: 0 0 auto; white-space: nowrap; font-size: 8px !important; padding-left: 8px !important; }
  .transition-final-footer .transition-footer-signature { flex: 0 0 210px; min-width: 0 !important; }
  .aranpro-print-watermark { display: none !important; }
`;

const sections = [
  ['A. Gobierno y archivo legal', [
    'Reglamento de copropiedad vigente, modificaciones, inscripción y antecedentes de dominio disponibles.',
    'Actas de asambleas y sesiones del Comité, Libro de Actas y respaldo digital de sus documentos.',
    'Registro de copropietarios, arrendatarios y ocupantes actualizado.',
    'RUT, certificados, poderes, mandatos y antecedentes tributarios o administrativos de la comunidad.',
    'Expedientes de procesos judiciales, reclamos ante autoridad y cobranzas en curso.'
  ]],
  ['B. Rendición final y situación financiera', [
    'Rendición documentada y detallada al cierre, con ingresos, egresos y respaldos.',
    'Cartolas bancarias, conciliaciones, saldos, caja chica y comprobantes de transferencias o cheques pendientes.',
    'Estado del fondo de reserva y otros fondos de la comunidad.',
    'Gastos comunes emitidos, padrón de morosidad, convenios de pago, cuentas por cobrar y por pagar.',
    'Libros, comprobantes, facturas y documentación contable disponible; talonarios, si se utilizan.'
  ]],
  ['C. Personal y obligaciones laborales', [
    'Carpetas del personal: contratos, anexos, liquidaciones, vacaciones, licencias, horas extra y bonos.',
    'Comprobantes de cotizaciones, Previred, mutualidad, finiquitos y antecedentes de procesos laborales.',
    'Listado de trabajadores vigentes, funciones, turnos y obligaciones o vencimientos próximos.'
  ]],
  ['D. Proveedores, contratos y operación', [
    'Contratos vigentes, cotizaciones, órdenes de trabajo, garantías y expedientes de proveedores.',
    'Listado de proveedores, contactos, servicios, montos, renovaciones y obligaciones pendientes.',
    'Calendario de mantenciones, bitácoras, inventario y trabajos aprobados, en ejecución o pendientes.',
    'Llaves, controles, tarjetas, sellos, dispositivos y demás bienes bajo custodia física.'
  ]],
  ['E. Seguridad, seguros y antecedentes técnicos', [
    'Pólizas, certificados de cobertura, siniestros, primas y renovaciones de seguros.',
    'Plan de emergencia, evacuación, simulacros y registros de seguridad disponibles.',
    'Certificaciones, mantenciones e informes de ascensores, gas, electricidad, incendios, bombas, generador y otros sistemas aplicables.',
    'Planos, recepciones, manuales, garantías, fichas técnicas y antecedentes de obras o instalaciones.'
  ]],
  ['F. Sistemas y continuidad digital', [
    'Correo institucional, dominios, respaldos y archivos digitales de la comunidad.',
    'Exportación o respaldo de plataforma de administración, base de datos, gastos comunes y libro de novedades.',
    'Traspaso seguro de usuarios administradores, métodos de recuperación y autorizaciones de plataformas bancarias y públicas aplicables.',
    'Cambio de credenciales y revocación de accesos del administrador saliente luego de la recepción.'
  ]],
  ['G. Pendientes y cierre de traspaso', [
    'Listado de reclamos, cobranzas, procedimientos, multas, litigios, trámites y asuntos pendientes.',
    'Presupuesto vigente, obras aprobadas, compromisos próximos y fecha de próxima asamblea o renovación relevante.',
    'Acta final con fecha, modalidad de entrega, pendientes, responsables, plazos y constancia de recepción.'
  ]]
];

export function TransitionChecklistScreen({ status, setStatus, notes, setNotes }) {
  return <div className="space-y-3 max-w-3xl mx-auto">{sections.map(([title, items], section) =>
    <div className="border border-slate-200 rounded-xl overflow-hidden" key={title}>
      <div className="bg-[#0F3D2E] text-white px-3 py-2 font-bold text-xs">{title.toUpperCase()}</div>
      {items.map((item, index) => { const id = `${section}-${index}`; return <div key={id} className="p-2.5 border-t border-slate-100 text-xs space-y-1">
        <div className="font-medium text-slate-700">{item}</div>
        <div className="flex gap-3 items-center flex-wrap"><label><input type="radio" name={id} checked={status[id] === 'entregado'} onChange={() => setStatus(v => ({ ...v, [id]: 'entregado' }))} /> Entregado</label>
        <label><input type="radio" name={id} checked={status[id] === 'na'} onChange={() => setStatus(v => ({ ...v, [id]: 'na' }))} /> No aplica</label>
        <button type="button" className="text-slate-500 underline" onClick={() => setStatus(v => ({ ...v, [id]: '' }))}>Limpiar</button>
        <input className="border rounded px-2 py-1 flex-1 min-w-[160px]" placeholder="Formato / observaciones" value={notes[id] || ''} onChange={e => setNotes(v => ({ ...v, [id]: e.target.value }))} /></div>
      </div>; })}
    </div>)}</div>;
}

export function TransitionChecklistPrint({ condo, city, adminName, adminRut, phone, email, website, signature, signatureScale, companyRut, pdfStyle, status, notes, outgoingAdmin, committeePresident, endDate }) {
  const pages = [[0, 1], [2, 3, 4], [5, 6]];
  return <div id="printable-transition-checklist" data-pdf-style={pdfStyle}>
    {pages.map((indexes, pageIndex) => <div key={pageIndex} data-pdf-style={pdfStyle} className={`dossier-page ${pageIndex < 2 ? 'transition-page-with-notes' : ''} bg-white p-6 pl-10 flex flex-col justify-between text-slate-900 relative overflow-hidden`} style={{fontFamily:'Arial, sans-serif', minHeight:'1050px', fontSize:'10px'}}>
      <div>
        <CanonicalPdfHeader badge="PAUTA DE TRASPASO" description="Checklist de entrega de administración" community={condo} page={pageIndex + 1} email={email} phone={phone} city={city} />
        <div className="transition-title text-center mt-3 mb-3"><h2 className="text-sm font-black">PAUTA DE TRASPASO DE ADMINISTRACIÓN</h2><p className="text-[#0F3D2E] font-bold">{pageIndex === 0 ? 'Pauta para solicitud, control y recepción de antecedentes' : pageIndex === 1 ? 'Antecedentes operacionales, técnicos y de continuidad' : 'Sistemas, asuntos pendientes y cierre documentado'}</p></div>
        {pageIndex === 0 && <><div className="transition-metadata grid grid-cols-3 border border-slate-300 text-[9px] mb-3">{['COMUNIDAD', 'FECHA DE ENTREGA', 'MODALIDAD', 'ADMINISTRADOR(A) SALIENTE', 'REPRESENTANTE DEL COMITÉ', 'PLAZO COMPLEMENTARIO'].map((label, i) => <div key={label} className="border border-slate-200 p-1"><strong className="block">{label}</strong><span>{[condo, endDate, 'Física ☐  Digital ☐  Mixta ☐', outgoingAdmin, committeePresident, ''][i] || '________________________'}</span></div>)}</div><p className="bg-emerald-50 border border-emerald-200 p-2 mb-3"><strong>Uso del Comité.</strong> Esta pauta ordena la solicitud y recepción de antecedentes para asegurar continuidad operativa. Se apoya en la Ley 21.442 y su reglamento. La recepción material no implica aprobación, conformidad ni liberación de responsabilidades; los antecedentes deben revisarse por integridad, vigencia y consistencia.</p></>}
        {pageIndex === 0 && <p className="mb-2 text-slate-600">Marque una opción por antecedente. Si ambas casillas están vacías, el estado no está registrado; anote los pendientes en observaciones.</p>}
        {indexes.map(index => { const [title, items] = sections[index]; return <div key={title} className="border border-slate-300 mb-3"><div className="bg-[#0F3D2E] text-white font-bold px-2 py-1 uppercase">{title}</div><table className="w-full border-collapse" style={{tableLayout:'fixed', fontSize:'9.5px'}}><colgroup><col style={{width:'53%'}}/><col style={{width:'10%'}}/><col style={{width:'10%'}}/><col style={{width:'27%'}}/></colgroup><thead><tr className="bg-slate-100"><th className="border border-slate-300 p-1 text-left">Antecedente</th><th className="border border-slate-300 p-1">Entregado</th><th className="border border-slate-300 p-1">No aplica</th><th className="border border-slate-300 p-1 text-left">Formato / observaciones</th></tr></thead><tbody>{items.map((item, itemIndex) => { const id = `${index}-${itemIndex}`; return <tr key={item}><td className="border border-slate-300 p-1.5">{item}</td><td className="border border-slate-300 text-center">{status[id] === 'entregado' ? '☒' : '☐'}</td><td className="border border-slate-300 text-center">{status[id] === 'na' ? '☒' : '☐'}</td><td className="border border-slate-300 p-1" style={{overflowWrap:'anywhere'}}>{notes[id] || '________________________'}</td></tr>; })}</tbody></table></div>; })}
        {pageIndex === 2 && <><p className="mt-3"><strong>Constancia de cierre.</strong> Las partes dejan constancia de la fecha, forma de entrega y antecedentes pendientes indicados en esta pauta. Los usuarios y autorizaciones deben traspasarse mediante mecanismos seguros y las credenciales del administrador saliente deben modificarse o revocarse una vez verificada la continuidad de la comunidad.</p><div className="grid grid-cols-2 gap-x-10 gap-y-16 mt-16 text-[10px]">{['Por el Comité de Administración|Nombre y cargo','Administrador(a) saliente|Nombre y RUT','Administrador(a) entrante|Nombre y RUT','Testigo o receptor(a) de respaldo|Nombre y cargo'].map(label => <div className="border-t border-slate-500 pt-1" key={label}><strong className="block">{label.split('|')[0]}</strong><span>{label.split('|')[1]}</span></div>)}</div></>}
      </div>
      <div>{pageIndex < 2 ? <div className="border-y border-slate-300 py-2 flex justify-between items-center text-slate-600"><span>{pageIndex === 0 ? 'Continúa: personal, proveedores, seguridad y antecedentes técnicos.' : 'Continúa: sistemas, pendientes y cierre del traspaso.'}</span><span className="border border-emerald-200 rounded-full bg-emerald-50 px-4 py-1 text-[#0F3D2E] font-bold">Continúa en página {pageIndex + 2} →</span></div> : <CanonicalPdfFinalSignature companyRut={companyRut} phone={phone} email={email} website={website} signature={signature} signatureScale={signatureScale} adminName={adminName} adminRut={adminRut} />}
      <CanonicalPdfPageFooter website={website} label="Pauta de Traspaso" page={pageIndex + 1} totalPages={3} city={city} /></div>
    </div>)}
  </div>;
}
