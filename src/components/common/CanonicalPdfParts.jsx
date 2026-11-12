import React from 'react';
import { AranproOfficialSeal } from './MauranLogo';

// Estilos de la cabecera aprobada. Se aplican únicamente a documentos que los incorporen.
export const canonicalPdfHeaderStyles = `
  .transition-header { position: relative !important; min-height: 14mm !important; padding-bottom: 2mm !important; border-bottom: 0.55pt solid #0F3D2E !important; font-size: 6.5pt !important; line-height: 1.2 !important; }
  .transition-header::after { content: ''; position: absolute; left: 0; right: 0; bottom: -2px; border-bottom: 1pt solid #D4B895; }
  .transition-header .transition-header-brand { flex: 1 1 auto; min-width: 0; }
  .transition-header .transition-header-contact { font-size: 6pt !important; }
  .transition-header .transition-header-right { width: 44mm; flex: 0 0 44mm; font-size: 6.2pt !important; }
  .transition-header .transition-header-right strong { display: table !important; width: auto !important; margin-left: auto !important; text-align: center !important; font-size: 6.3pt !important; padding: 1mm 3mm !important; white-space: nowrap !important; }
`;

export const canonicalPortraitPrintStyles = `${canonicalPdfHeaderStyles}
  @page { size: letter portrait; margin: 0 !important; }
  .dossier-page { height:279.4mm!important; min-height:279.4mm!important; max-height:279.4mm!important; padding:8mm 16mm 8mm 17mm!important; border-left:3.3mm solid #0F3D2E!important; background-image:linear-gradient(#D4B895,#D4B895)!important; background-size:1.2mm 100%!important; background-position:.5mm 0!important; background-repeat:no-repeat!important; }
  .dossier-page > div[aria-hidden="true"], .aranpro-print-watermark { display:none!important; }
  .transition-header img[src*="ARANPRO_logo_horizontal"] { width:37mm!important; max-width:37mm!important; height:auto!important; max-height:11mm!important; object-fit:contain!important; }
  .transition-final-footer { gap:8px!important; } .transition-footer-details { gap:8px!important; flex:1 1 auto; min-width:0; } .transition-footer-seal { flex:0 0 auto; gap:6px!important; } .transition-footer-seal > div { white-space:nowrap; } .transition-footer-seal > div > div:first-child { font-size:8px!important; letter-spacing:0!important; } .transition-footer-seal > div > div:last-child { font-size:7.5px!important; } .transition-footer-contact { flex:0 0 auto; white-space:nowrap; font-size:8px!important; padding-left:8px!important; } .transition-footer-signature { flex:0 0 210px; min-width:0!important; }
`;

export const canonicalLandscapePrintStyles = canonicalPortraitPrintStyles
  .replace('letter portrait', 'letter landscape')
  .replaceAll('279.4mm', '215.9mm');

/** Cabecera institucional común; cada documento aporta su título y datos reales. */
export function CanonicalPdfHeader({ badge, description, community, page, email, phone, city, legalText = 'Ley N° 21.442 de Copropiedad Inmobiliaria', brandName = 'ARANPRO • GESTIÓN INTEGRAL' }) {
  return <div className="transition-header flex items-center justify-between gap-3 border-b-2 border-[#0F3D2E] pb-2">
    <div className="transition-header-brand flex items-center gap-3">
      <img src="/brand/ARANPRO_logo_horizontal_transparente_trimmed.png" alt="ARANPRO" style={{height:'42px', width:'auto'}} />
      <div className="border-l border-slate-300 pl-3">
        <strong className="text-[#0F3D2E] block">{brandName}</strong>
        <span className="block text-slate-600">{legalText}</span>
        <span className="transition-header-contact block text-slate-500">{email} • {phone} • {city}</span>
      </div>
    </div>
    <div className="transition-header-right text-right">
      <strong className="block text-[#0F3D2E] border border-[#D4B895] bg-slate-50 rounded px-3 py-1 mb-1">{badge}</strong>
      <span className="block font-bold">{description}</span>
      {(community || page) && <span className="text-slate-500">{community}{community && page ? ' • ' : ''}{page ? `Página ${page}` : ''}</span>}
    </div>
  </div>;
}

/** Pie de identificación, adaptable a la cantidad de páginas y tipo de documento. */
export function CanonicalPdfPageFooter({ website, label, page, totalPages, city }) {
  return <div className="pt-1 border-t border-slate-200 flex justify-between text-[8.5px] text-slate-400 font-mono">
    <span>ARANPRO Gestión Integral • {website}</span>
    <strong className="text-[#0F3D2E]">{label} • Ley N° 21.442 (Pág. {page} de {totalPages})</strong>
    <span>{city}</span>
  </div>;
}

/** Pie institucional final; la firma siempre procede de la configuración de la empresa. */
export function CanonicalPdfFinalSignature({ companyRut, phone, email, website, signature, signatureScale = 1, adminName, adminRut }) {
  return <div className="transition-final-footer pt-1.5 border-t border-slate-200 flex items-end justify-between gap-4">
    <div className="transition-footer-details flex items-center gap-3">
      <AranproOfficialSeal className="transition-footer-seal" size="sm" companyRut={companyRut || ''} rnacNumber="" showCaption={true} />
      <div className="transition-footer-contact text-[9px] text-slate-600 border-l border-slate-200 pl-3 space-y-0.5">
        <p><strong>Contacto Directo:</strong> <span className="font-mono font-bold text-[#0F3D2E]">{phone}</span></p>
        <p><strong>Correo:</strong> <span className="font-mono">{email}</span></p>
        <p><strong>Sitio Web:</strong> <span className="font-mono text-[#0F3D2E] font-bold">{website}</span></p>
      </div>
    </div>
    <div className="transition-footer-signature text-center min-w-[220px]">
      <div className="h-12 flex items-end justify-center pb-0.5 overflow-visible">
        {signature && <img src={signature} alt="Firma" className="h-11 max-h-12 w-auto max-w-[220px] object-contain mx-auto" style={{transform:`scale(${signatureScale})`,transformOrigin:'bottom center'}} />}
      </div>
      <div className="border-t-[1.5px] border-slate-800 pt-0.5">
        <span className="text-[10.5px] font-black block leading-tight">{adminName}</span>
        <span className="text-[8.5px] text-[#0F3D2E] font-bold block leading-tight">Constructor Civil • Administrador de Condominios</span>
        <span className="text-[8.5px] text-slate-600 font-mono block">RUT: {adminRut} • Ley N° 21.442</span>
      </div>
    </div>
  </div>;
}
