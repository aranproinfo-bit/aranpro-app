const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));

export const buildFineNotice = ({ fine, community, company, variant = 'b1' }) => {
  const e = escapeHtml;
  const logo = variant === 'b3' ? 'ARANPRO_logo_horizontal_transparente_trimmed.png' : 'ARANPRO_logo_para_fondo_oscuro_trimmed.png';
  const amount = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(fine.amountClp);
  const signature = company?.signatureDataUrl ? `<img class="signature" src="${e(company.signatureDataUrl)}" alt="Firma">` : '';
  const communityLogo = community?.documentLogo ? `<img class="community-logo" src="${e(community.documentLogo)}" alt="Logo comunidad">` : '';
  const card = `<section class="notice ${e(variant)}">
    <aside><img class="brand" src="${window.location.origin}/brand/${logo}" alt="ARANPRO">
      <div class="amount"><small>MONTO DE LA MULTA</small><strong>${e(amount)}</strong></div>
      <div class="unit"><small>UNIDAD NOTIFICADA</small><strong>${e(fine.unitLabel)}</strong></div>
      <div class="sidefoot">Administración de condominios<br><b>aranpro.cl</b></div>
    </aside>
    <main><div class="meta">${communityLogo}<b>${e(fine.communityName)}</b><span>FOLIO ${e(fine.resolutionFolio)}</span></div>
      <div class="rule"></div><h1>Notificación<br>de multa.</h1>
      <p class="intro">Comunicación de multa registrada por la administración.</p>
      <div class="details"><small>INFRACCIÓN REGISTRADA</small><b>${e(fine.reason)}</b>
        ${fine.incidentDate ? `<small>FECHA DEL HECHO</small><b>${e(fine.incidentDate)}</b>` : ''}
        <small>FUNDAMENTO REGLAMENTARIO</small><span>${e(fine.reglamentoArticle || 'No informado')}</span>
        <small>FECHA DE EMISIÓN</small><span>${e(fine.issueDate)}</span></div>
      <div class="contact"><b>Consultas y procedimiento de revisión</b><br>${e(company?.email || 'contacto@aranpro.cl')}</div>
      <footer><div class="seal"><img src="${window.location.origin}/brand/ARANPRO_sello_circular_integral_transparente.png" alt=""><span><b>SELLO OFICIAL DE ADMINISTRACIÓN</b><br>Ley N° 21.442 de Copropiedad Inmobiliaria</span></div><div>${signature}${e(company?.adminName || company?.administratorName || 'Administración')}</div></footer>
    </main></section>`;
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><style>
    @page{size:letter portrait;margin:0}*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;color:#153f30}
    .sheet{padding:7mm 8mm}.notice{display:flex;min-height:128mm;border:1px solid #cbd8ce;break-inside:avoid;overflow-wrap:anywhere}
    .notice+ .notice{margin-top:8mm}aside{position:relative;width:32%;padding:7mm 5mm;background:#0f3d2e;color:#fff;display:flex;flex-direction:column}
    .brand{width:100%;height:22mm;object-fit:contain;margin-bottom:7mm}small{display:block;font-size:8px;font-weight:bold;color:#bd9b74}
    .amount strong{font-size:25px;display:block;margin:2mm 0 6mm}.unit strong{font-size:20px;display:block;margin-top:2mm}
    .sidefoot{margin-top:auto;font-size:9px;line-height:1.5}.b2 aside{border-left:3mm solid #d4b895}.b2 .amount{background:#d4b895;color:#0f3d2e;padding:3mm}.b2 .amount small{color:#0f3d2e}.b3 aside{background:#f5f4ef;color:#0f3d2e;border-left:2mm solid #0f3d2e}.b3 small{color:#5c6661}
    main{width:68%;padding:5mm 6mm;display:flex;flex-direction:column}.meta{display:flex;align-items:center;gap:2mm;font-size:8px;text-transform:uppercase}.meta span{margin-left:auto;color:#555}
    .community-logo{width:8mm;height:8mm;object-fit:contain}.rule{width:10mm;border-top:2px solid #d4b895;margin:3mm 0}
    h1{font-size:25px;line-height:1.04;margin:0;font-weight:900}.intro{font-size:9px;color:#555;border-bottom:1px solid #ddd;padding-bottom:2mm}
    .details{font-size:9px;line-height:1.25}.details small{color:#616967;margin-top:2mm;font-size:7px}.details b,.details span{display:block}
    .contact{margin-top:3mm;background:#f5f4ef;padding:2mm;font-size:8px;color:#354a42}
    footer{margin-top:auto;padding-top:2mm;display:flex;justify-content:space-between;align-items:end;gap:2mm;font-size:7px;color:#53625b}.signature{max-width:23mm;max-height:9mm;display:block}.seal{display:flex;align-items:center;gap:1.5mm;font-size:6px}.seal img{width:9mm;height:9mm;object-fit:contain}
    </style></head><body><div class="sheet">${card}${card}</div></body></html>`;
};
