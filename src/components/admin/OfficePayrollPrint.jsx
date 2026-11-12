import React from 'react';
import { formatCLP } from '../../utils/formatters';
import { CanonicalPdfHeader, CanonicalPdfPageFooter, CanonicalPdfFinalSignature, canonicalPdfHeaderStyles } from '../common/CanonicalPdfParts';

export const officePayrollPrintStyles = `${canonicalPdfHeaderStyles}
  @page { size: letter landscape; margin: 0 !important; }
  .dossier-page { height:215.9mm!important; min-height:215.9mm!important; max-height:215.9mm!important; padding:8mm 14mm 8mm 17mm!important; border-left:3.3mm solid #0F3D2E!important; background-image:linear-gradient(#D4B895,#D4B895)!important; background-size:1.2mm 100%!important; background-position:.5mm 0!important; background-repeat:no-repeat!important; }
  .transition-header img[src*="ARANPRO_logo_horizontal"] { width:37mm!important; max-width:37mm!important; height:auto!important; max-height:11mm!important; object-fit:contain!important; }
  .transition-final-footer { gap:8px!important; } .transition-footer-details { gap:8px!important; flex:1 1 auto; min-width:0; } .transition-footer-seal { flex:0 0 auto; gap:6px!important; } .transition-footer-seal > div { white-space:nowrap; } .transition-footer-seal > div > div:first-child { font-size:8px!important; letter-spacing:0!important; } .transition-footer-seal > div > div:last-child { font-size:7.5px!important; } .transition-footer-contact { flex:0 0 auto; white-space:nowrap; font-size:8px!important; padding-left:8px!important; } .transition-footer-signature { flex:0 0 210px; min-width:0!important; } .aranpro-print-watermark { display:none!important; }
`;

export function OfficePayrollPrint({ workers, settings = {}, pdfStyle }) {
  const groups = [];
  let weight = 0;
  for (const worker of workers) {
    const longest = Math.max(...[worker.name, worker.role, worker.assignedCommunities, worker.contractType, worker.afpName, worker.healthSystem].map(value => String(value || '').length));
    const rowWeight = Math.max(1, Math.ceil(longest / 80));
    if (!groups.length || groups[groups.length - 1].length >= 9 || weight + rowWeight > 10) { groups.push([]); weight = 0; }
    groups[groups.length - 1].push(worker);
    weight += rowWeight;
  }
  if (!groups.length) groups.push([]);
  const phone = settings.phone || '', email = settings.email || '', website = settings.website || 'https://aranpro.cl', city = settings.city || '';
  return <div id="printable-office-payroll-sheet" data-pdf-style={pdfStyle}>{groups.map((group, pageIndex) => <div key={pageIndex} className="dossier-page bg-white flex flex-col justify-between text-slate-900 text-xs" style={{fontFamily:'system-ui, -apple-system, sans-serif'}}>
    <div className="space-y-3"><CanonicalPdfHeader badge="NÓMINA INTERNA" description="Contratos e imposiciones" page={pageIndex + 1} brandName={settings.provisionalName || 'ARANPRO • GESTIÓN INTEGRAL'} phone={phone} email={email} city={city} /><h2 className="text-center text-sm font-black text-[#0F3D2E]">Nómina de trabajadores de oficina</h2>
      <table className="w-full border-collapse text-[9px]"><thead><tr className="bg-[#0F3D2E] text-white"><th className="p-2 text-left">Colaborador / RUT</th><th className="p-2 text-left">Cargo y comunidades</th><th className="p-2 text-left">Vínculo / previsión</th><th className="p-2 text-right">Sueldo bruto</th><th className="p-2 text-right">Imposiciones / ret.</th><th className="p-2 text-right">Líquido</th><th className="p-2 text-center">Previred</th></tr></thead><tbody>{group.map(w => { const gross = Number(w.grossSalary) || 0; const imp = w.contractType === 'Boleta de Honorarios' ? Math.round(gross * ((Number(w.afpRate) || 13.75) / 100)) : Math.round(gross * (((Number(w.afpRate) || 11) + (Number(w.healthRate) || 7) + 0.6) / 100)); return <tr key={w.id} className="border-b border-slate-200"><td className="p-2"><strong>{w.name}</strong><br/>RUT: {w.rut}</td><td className="p-2">{w.role}<br/>{w.assignedCommunities}</td><td className="p-2">{w.contractType}<br/>{w.afpName} • {w.healthSystem}</td><td className="p-2 text-right">{formatCLP(gross)}</td><td className="p-2 text-right">{formatCLP(imp)}</td><td className="p-2 text-right">{formatCLP(gross - imp)}</td><td className="p-2 text-center">{w.previredStatus}</td></tr>})}</tbody></table>
      {!group.length && <p className="text-center text-slate-500">No hay trabajadores registrados.</p>}
    </div><div className="mt-auto pt-1.5 space-y-1">{pageIndex < groups.length - 1 ? <div className="border-y border-slate-300 py-2 flex justify-between items-center text-[10px]"><span>Continúa la nómina de oficina.</span><span className="border border-emerald-200 rounded-full bg-emerald-50 px-3 py-1 text-[#0F3D2E] font-bold">Continúa en página {pageIndex + 2} →</span></div> : <CanonicalPdfFinalSignature companyRut={settings.companyRut} phone={phone} email={email} website={website} signature={settings.signatureDataUrl} signatureScale={Number(settings.signatureScale) || 1} adminName={settings.adminName || ''} adminRut={settings.adminRut || ''} />}<CanonicalPdfPageFooter website={website} label="Nómina interna de oficina" page={pageIndex + 1} totalPages={groups.length} city={city} /></div>
  </div>)}</div>;
}
