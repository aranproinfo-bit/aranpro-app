import React from 'react';
import { AranproOfficialSeal } from '../../common/MauranLogo';

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
    {pages.map((indexes, pageIndex) => <div key={pageIndex} data-pdf-style={pdfStyle} className="dossier-page bg-white p-6 pl-10 flex flex-col justify-between text-slate-900 relative overflow-hidden" style={{fontFamily:'Arial, sans-serif', minHeight:'1050px', fontSize:'10px'}}>
      <div>
        <div className="flex items-center justify-between gap-3 border-b-2 border-[#0F3D2E] pb-2">
          <div className="flex items-center gap-3"><img src="/brand/ARANPRO_logo_horizontal_transparente_trimmed.png" alt="ARANPRO" style={{height:'42px', width:'auto'}} /><div className="border-l border-slate-300 pl-3"><strong className="text-[#0F3D2E] block">ARANPRO • GESTIÓN INTEGRAL</strong><span className="block text-slate-600">Ley N° 21.442 de Copropiedad Inmobiliaria</span><span className="block text-slate-500">{email} • {phone} • {city}</span></div></div>
          <div className="text-right"><strong className="block text-[#0F3D2E]">PAUTA DE TRASPASO</strong><span className="block font-bold">Checklist de entrega de administración</span><span className="text-slate-500">{condo} • Página {pageIndex + 1}</span></div>
        </div>
        <div className="text-center mt-3 mb-3"><h2 className="text-sm font-black">PAUTA DE TRASPASO DE ADMINISTRACIÓN</h2><p className="text-[#0F3D2E] font-bold">{pageIndex === 0 ? 'Propuesta para solicitud, control y acta de recepción' : pageIndex === 1 ? 'Antecedentes operacionales, técnicos y de continuidad' : 'Sistemas, asuntos pendientes y cierre documentado'}</p></div>
        {pageIndex === 0 && <><div className="grid grid-cols-3 border border-slate-300 text-[9px] mb-3">{['COMUNIDAD', 'FECHA DE ENTREGA', 'MODALIDAD', 'ADMINISTRADOR(A) SALIENTE', 'REPRESENTANTE DEL COMITÉ', 'PLAZO COMPLEMENTARIO'].map((label, i) => <div key={label} className="border border-slate-200 p-1"><strong className="block">{label}</strong><span>{[condo, endDate, 'Física ☐  Digital ☐  Mixta ☐', outgoingAdmin, committeePresident, ''][i] || '________________________'}</span></div>)}</div><p className="bg-emerald-50 border border-emerald-200 p-2 mb-3"><strong>Uso del Comité.</strong> Esta pauta ordena la solicitud y recepción de antecedentes para asegurar continuidad operativa. Se apoya en la Ley 21.442 y su reglamento. La recepción material no implica aprobación, conformidad ni liberación de responsabilidades; los antecedentes deben revisarse por integridad, vigencia y consistencia.</p></>}
        {indexes.map(index => { const [title, items] = sections[index]; return <div key={title} className="border border-slate-300 mb-3"><div className="bg-[#0F3D2E] text-white font-bold px-2 py-1 uppercase">{title}</div><table className="w-full border-collapse" style={{tableLayout:'fixed', fontSize:'9.5px'}}><colgroup><col style={{width:'53%'}}/><col style={{width:'10%'}}/><col style={{width:'10%'}}/><col style={{width:'27%'}}/></colgroup><thead><tr className="bg-slate-100"><th className="border border-slate-300 p-1 text-left">Antecedente</th><th className="border border-slate-300 p-1">Entregado</th><th className="border border-slate-300 p-1">No aplica</th><th className="border border-slate-300 p-1 text-left">Formato / observaciones</th></tr></thead><tbody>{items.map((item, itemIndex) => { const id = `${index}-${itemIndex}`; return <tr key={item}><td className="border border-slate-300 p-1.5">{item}</td><td className="border border-slate-300 text-center">{status[id] === 'entregado' ? '☒' : '☐'}</td><td className="border border-slate-300 text-center">{status[id] === 'na' ? '☒' : '☐'}</td><td className="border border-slate-300 p-1" style={{overflowWrap:'anywhere'}}>{notes[id] || '________________________'}</td></tr>; })}</tbody></table></div>; })}
        {pageIndex === 2 && <><p className="mt-3"><strong>Constancia de cierre.</strong> Las partes dejan constancia de la fecha, forma de entrega y antecedentes pendientes indicados en esta pauta. Los usuarios y autorizaciones deben traspasarse mediante mecanismos seguros y las credenciales del administrador saliente deben modificarse o revocarse una vez verificada la continuidad de la comunidad.</p><div className="grid grid-cols-2 gap-x-10 gap-y-16 mt-16 text-[10px]">{['Por el Comité de Administración|Nombre y cargo','Administrador(a) saliente|Nombre y RUT','Administrador(a) entrante|Nombre y RUT','Testigo o receptor(a) de respaldo|Nombre y cargo'].map(label => <div className="border-t border-slate-500 pt-1" key={label}><strong className="block">{label.split('|')[0]}</strong><span>{label.split('|')[1]}</span></div>)}</div></>}
      </div>
      <div>{pageIndex < 2 ? <div className="border-y border-slate-300 py-2 flex justify-between items-center text-slate-600"><span>{pageIndex === 0 ? 'Continúa: personal, proveedores, seguridad y antecedentes técnicos.' : 'Continúa: sistemas, pendientes y cierre del traspaso.'}</span><span className="border border-emerald-200 rounded-full bg-emerald-50 px-4 py-1 text-[#0F3D2E] font-bold">Continúa en página {pageIndex + 2} →</span></div> : <div className="pt-1.5 border-t border-slate-200 flex items-end justify-between gap-4"><div className="flex items-center gap-3"><AranproOfficialSeal size="sm" companyRut={companyRut || ''} rnacNumber="" showCaption={true}/><div className="text-[9px] text-slate-600 border-l border-slate-200 pl-3 space-y-0.5"><p><strong>Contacto Directo:</strong> <span className="font-mono font-bold text-[#0F3D2E]">{phone}</span></p><p><strong>Correo:</strong> <span className="font-mono">{email}</span></p><p><strong>Sitio Web:</strong> <span className="font-mono text-[#0F3D2E] font-bold">{website}</span></p></div></div><div className="text-center min-w-[220px]"><div className="h-12 flex items-end justify-center pb-0.5 overflow-visible">{signature && <img src={signature} alt="Firma" className="h-11 max-h-12 w-auto max-w-[220px] object-contain mx-auto" style={{transform:`scale(${signatureScale})`,transformOrigin:'bottom center'}}/>}</div><div className="border-t-[1.5px] border-slate-800 pt-0.5"><span className="text-[10.5px] font-black block leading-tight">{adminName}</span><span className="text-[8.5px] text-[#0F3D2E] font-bold block leading-tight">Constructor Civil • Administrador de Condominios</span><span className="text-[8.5px] text-slate-600 font-mono block">RUT: {adminRut} • Ley N° 21.442</span></div></div></div>}
      <div className="pt-1 border-t border-slate-200 flex justify-between text-[8.5px] text-slate-400 font-mono"><span>ARANPRO Gestión Integral • {website}</span><strong className="text-[#0F3D2E]">Pauta de Traspaso • Ley N° 21.442 (Pág. {pageIndex + 1} de 3)</strong><span>{city}</span></div></div>
    </div>)}
  </div>;
}
