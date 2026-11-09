/**
 * Generador Canónico de PDF para Postulaciones ARANPRO
 * Exporta 1:1 el documento maestro del DOM generado por la aplicación
 * (ARANPRO_Carta_Valor_Comite, Carta Formal de Postulación, Dossier Integral y Brochure)
 * asegurando la misma tipografía, tamaños, doble filete y distribución de página.
 */

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const loadImage = (src) => {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
};

/**
 * Captura un elemento o contenedor del DOM y genera un PDF estándar Carta (612 x 792 pt)
 * en Base64 idéntico al documento maestro que se imprime o descarga desde la aplicación.
 */
export const exportDomElementToPdfBase64 = async (elementOrId, options = {}) => {
  let targetEl = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
  if (!targetEl && typeof elementOrId === 'string') {
    targetEl = document.querySelector(`[id="${elementOrId}"]`);
  }
  if (!targetEl) {
    throw new Error(`Elemento #${typeof elementOrId === 'string' ? elementOrId : 'desconocido'} no encontrado en el DOM`);
  }

  // 1. Obtener el HTML limpio del elemento maestro
  let contentHtml = targetEl.innerHTML;

  // 2. Resolver rutas de imágenes relativas a absolutas para carga inmediata sin bloqueos
  const origin = (typeof window !== 'undefined' && window.location?.origin) || '';
  contentHtml = contentHtml
    .replace(/src="\/brand\//g, `src="${origin}/brand/`)
    .replace(/src="brand\//g, `src="${origin}/brand/`)
    .replace(/src="\/certificaciones\//g, `src="${origin}/certificaciones/`);

  // Extraer todas las hojas de estilo y estilos compilados de la aplicación
  const existingStyles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((el) => el.outerHTML)
    .join('\n');

  // 3. Crear o reutilizar un iframe invisible fuera de pantalla para aislamiento total
  let iframe = document.getElementById('aranpro-pdf-export-iframe');
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = 'aranpro-pdf-export-iframe';
    iframe.style.position = 'fixed';
    iframe.style.left = '-10000px';
    iframe.style.top = '0';
    iframe.style.width = '816px';
    iframe.style.height = '4600px';
    iframe.style.border = '0';
    iframe.style.opacity = '1';
    iframe.style.visibility = 'visible';
    iframe.style.zIndex = '-99999';
    document.body.appendChild(iframe);
  } else {
    iframe.style.width = '816px';
    iframe.style.height = '4600px';
  }

  const doc = iframe.contentWindow || iframe.contentDocument;
  const iDoc = doc.document || doc;
  iDoc.open();
  iDoc.write(`
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        ${existingStyles}
        <style>
          * {
            box-sizing: border-box !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            -webkit-line-clamp: unset !important;
            -webkit-box-orient: unset !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            width: 816px !important;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            color: #0f172a;
            -webkit-font-smoothing: antialiased;
          }
          /* Páginas maestras con proporción exacta Carta (816 x 1056 px a 96 DPI -> 612 x 792 pt) */
          .dossier-page {
            width: 816px !important;
            min-height: 1056px !important;
            height: 1056px !important;
            max-height: 1056px !important;
            box-sizing: border-box !important;
            margin: 0 0 24px 0 !important;
            background: #ffffff !important;
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            position: relative !important;
            padding: 24px 28px 20px 36px !important;
          }
          .shadow-md, .shadow-lg, .shadow-xl, .shadow-2xl, .shadow-xs, .shadow-2xs, .shadow-sm {
            box-shadow: none !important;
          }
          /* Colores oficiales de marca ARANPRO */
          .bg-\[\#0F3D2E\] { background-color: #0F3D2E !important; }
          .bg-\[\#D4B895\] { background-color: #D4B895 !important; }
          .bg-\[\#F5F4EF\] { background-color: #F5F4EF !important; }
          .text-\[\#0F3D2E\] { color: #0F3D2E !important; }
          .text-\[\#D4B895\] { color: #D4B895 !important; }
          .border-\[\#0F3D2E\] { border-color: #0F3D2E !important; }
          .border-\[\#D4B895\] { border-color: #D4B895 !important; }
          .opacity-\[0\.035\], [class*="opacity-[0.035]"] {
            opacity: 0.035 !important;
          }

          /* Corrección crítica contra bisecado de texto en html2canvas */
          .line-clamp-1, .line-clamp-2, .line-clamp-3 {
            display: block !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            line-height: 1.35 !important;
          }
        </style>
      </head>
      <body>
        <div id="export-root" style="width: 816px; background: #ffffff;">
          ${contentHtml}
        </div>
      </body>
    </html>
  `);
  iDoc.close();

  // Esperar a que el iframe compile estilos y estabilice el layout
  await new Promise(r => setTimeout(r, 250));

  // Esperar a que todas las imágenes del iframe carguen completamente
  const iframeImgs = Array.from(iDoc.querySelectorAll('img'));
  await Promise.all(
    iframeImgs.map(img => {
      if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
      return new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve;
        setTimeout(resolve, 800);
      });
    })
  );

  const rawPages = Array.from(iDoc.querySelectorAll('.dossier-page'));
  const pages = rawPages.length > 0 ? rawPages : [iDoc.getElementById('export-root') || iDoc.body];

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter' // 612 x 792 pt (Carta oficial estándar)
  });

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];

    // Captura limpia del elemento con escala 2.5 para nitidez tipo vector y cero pixelación
    const canvas = await html2canvas(page, {
      scale: 2.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: 816,
      window: iframe.contentWindow
    });

    // Formato PNG para preservar el 100% de la fidelidad de color (#0F3D2E, #D4B895, #F5F4EF) sin artefactos JPEG
    const imgData = canvas.toDataURL('image/png');

    if (i > 0) {
      pdf.addPage('letter', 'portrait');
    }

    // Dibujar ocupando la totalidad de la hoja Carta oficial (612 x 792 pt) con proporción matemática exacta
    pdf.addImage(imgData, 'PNG', 0, 0, 612, 792, undefined, 'FAST');
  }

  const dataUri = pdf.output('datauristring');
  return dataUri.split(',')[1];
};

/**
 * Empaqueta una o más páginas JPEG (DataURL) en un binario PDF-1.4 Carta estándar (612 x 792 pt)
 * y devuelve el string Base64 puro para adjuntar por correo.
 */
const pagesJpegToPdfBase64 = (jpegDataUrls, pixelWidth, pixelHeight) => {
  const urls = Array.isArray(jpegDataUrls) ? jpegDataUrls : [jpegDataUrls];
  const pageCount = urls.length;

  const encoder = new TextEncoder();
  const chunks = [];
  let offset = 0;
  const offsets = [0];

  const pushStr = (str) => {
    const bytes = encoder.encode(str);
    chunks.push(bytes);
    offset += bytes.length;
  };

  const pushBytes = (bytes) => {
    chunks.push(bytes);
    offset += bytes.length;
  };

  const startObj = (id) => {
    offsets[id] = offset;
    pushStr(`${id} 0 obj\n`);
  };

  const endObj = () => {
    pushStr(`\nendobj\n`);
  };

  // Cabecera PDF 1.4
  pushStr(`%PDF-1.4\n%\xFF\xFF\xFF\xFF\n`);

  // Obj 1: Catalog
  startObj(1);
  pushStr(`<< /Type /Catalog /Pages 2 0 R >>`);
  endObj();

  // Cada página usa 3 objetos: Page (3 + p*3), Image (4 + p*3), Content (5 + p*3)
  const kidsRefs = [];
  for (let p = 0; p < pageCount; p++) {
    kidsRefs.push(`${3 + p * 3} 0 R`);
  }

  // Obj 2: Pages
  startObj(2);
  pushStr(`<< /Type /Pages /Kids [${kidsRefs.join(' ')}] /Count ${pageCount} >>`);
  endObj();

  for (let p = 0; p < pageCount; p++) {
    const pageObjId = 3 + p * 3;
    const imgObjId = 4 + p * 3;
    const contentObjId = 5 + p * 3;

    const base64Data = urls[p].split(',')[1];
    const binaryStr = atob(base64Data);
    const jpegBytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      jpegBytes[i] = binaryStr.charCodeAt(i);
    }

    // Page Object (Tamaño Carta: 612 x 792 pt)
    startObj(pageObjId);
    pushStr(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /XObject << /Im0 ${imgObjId} 0 R >> >> /Contents ${contentObjId} 0 R >>`);
    endObj();

    // Image XObject
    startObj(imgObjId);
    pushStr(`<< /Type /XObject /Subtype /Image /Width ${pixelWidth} /Height ${pixelHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`);
    pushBytes(jpegBytes);
    pushStr(`\nendstream`);
    endObj();

    // Content Stream
    const contentStream = `q 612 0 0 792 0 0 cm /Im0 Do Q\n`;
    const contentBytes = encoder.encode(contentStream);
    startObj(contentObjId);
    pushStr(`<< /Length ${contentBytes.length} >>\nstream\n`);
    pushBytes(contentBytes);
    pushStr(`endstream`);
    endObj();
  }

  const totalObjects = 2 + pageCount * 3;
  const xrefOffset = offset;
  pushStr(`xref\n0 ${totalObjects + 1}\n0000000000 65535 f \n`);
  for (let i = 1; i <= totalObjects; i++) {
    const padded = String(offsets[i]).padStart(10, '0');
    pushStr(`${padded} 00000 n \n`);
  }

  pushStr(`trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  const totalBytes = new Uint8Array(offset);
  let pos = 0;
  for (const chunk of chunks) {
    totalBytes.set(chunk, pos);
    pos += chunk.length;
  }

  let binaryOut = '';
  const step = 0x8000;
  for (let i = 0; i < totalBytes.length; i += step) {
    binaryOut += String.fromCharCode.apply(null, totalBytes.subarray(i, i + step));
  }
  return btoa(binaryOut);
};

/**
 * Envuelve texto simple en líneas según ancho máximo
 */
const wrapTextLines = (ctx, text, maxWidth) => {
  const words = String(text || '').split(/\s+/);
  const lines = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
};

/**
 * Dibuja un párrafo con soporte para segmentos en negrita (**texto**) y alineación justificada o izquierda
 */
const drawRichParagraph = (ctx, text, x, startY, maxWidth, lineHeight, baseFont, boldFont, baseColor = '#1E293B', boldColor = '#0F172A', justify = true) => {
  // Tokenizar por **negrita**
  const parts = String(text || '').split(/(\*\*.*?\*\*)/g).filter(Boolean);
  const tokens = [];
  for (const part of parts) {
    const isBold = part.startsWith('**') && part.endsWith('**');
    const clean = isBold ? part.slice(2, -2) : part;
    const words = clean.split(/\s+/).filter(Boolean);
    for (const w of words) {
      ctx.font = isBold ? boldFont : baseFont;
      tokens.push({
        word: w,
        bold: isBold,
        width: ctx.measureText(w).width
      });
    }
  }

  ctx.font = baseFont;
  const spaceW = ctx.measureText(' ').width;

  const lines = [];
  let currentLine = [];
  let currentW = 0;

  for (const tk of tokens) {
    const addedW = currentLine.length === 0 ? tk.width : spaceW + tk.width;
    if (currentW + addedW > maxWidth && currentLine.length > 0) {
      lines.push({ words: currentLine, totalWordW: currentLine.reduce((s, t) => s + t.width, 0) });
      currentLine = [tk];
      currentW = tk.width;
    } else {
      currentLine.push(tk);
      currentW += addedW;
    }
  }
  if (currentLine.length > 0) {
    lines.push({ words: currentLine, totalWordW: currentLine.reduce((s, t) => s + t.width, 0) });
  }

  let curY = startY;
  lines.forEach((lineObj, lineIdx) => {
    const isLastLine = lineIdx === lines.length - 1;
    const count = lineObj.words.length;
    let gap = spaceW;
    if (justify && !isLastLine && count > 1) {
      gap = (maxWidth - lineObj.totalWordW) / (count - 1);
      if (gap > spaceW * 3) gap = spaceW;
    }

    let curX = x;
    for (const tk of lineObj.words) {
      ctx.font = tk.bold ? boldFont : baseFont;
      ctx.fillStyle = tk.bold ? boldColor : baseColor;
      ctx.fillText(tk.word, curX, curY);
      curX += tk.width + gap;
    }
    curY += lineHeight;
  });

  return curY;
};

/**
 * Dibuja un rectángulo con bordes redondeados
 */
const roundRect = (ctx, x, y, w, h, r = 12) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
};

/**
 * Dibuja la base canónica de la hoja (Fondo blanco, Doble Filete Lateral Izquierdo Alt 4,
 * Marca de Agua Sutil, Membrete Corporativo Maestro y Pie de Firma + Sello Circular + Footer)
 */
const drawCanonicalFrame = ({
  ctx,
  W,
  H,
  logoImg,
  sealImg,
  sigImg,
  empresaForm,
  badgeText,
  docTypeTitle,
  docSubTitle,
  footerCenterText
}) => {
  // 1. Fondo Blanco puro
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, H);

  // 2. Doble Filete Lateral Izquierdo (Alternativa 4 Oficial: Verde #0F3D2E + Dorado #D4B895)
  const topM = 34;
  const botM = H - 34;
  ctx.fillStyle = '#0F3D2E';
  ctx.fillRect(36, topM, 4, botM - topM);
  ctx.fillStyle = '#D4B895';
  ctx.fillRect(43, topM, 2, botM - topM);

  // 3. Marca de agua central sutil
  if (sealImg) {
    ctx.save();
    ctx.globalAlpha = 0.045;
    ctx.drawImage(sealImg, W / 2 - 230, H / 2 - 210, 460, 460);
    ctx.restore();
  }

  const padL = 68;
  const padR = 54;
  const contentW = W - padL - padR;
  let curY = 48;

  // 4. Membrete Corporativo Maestro ARANPRO
  let logoEndX = padL;
  if (logoImg) {
    const logoH = 74;
    const logoW = (logoImg.width / logoImg.height) * logoH;
    ctx.drawImage(logoImg, padL, curY, logoW, logoH);
    logoEndX = padL + logoW + 18;
  } else {
    ctx.fillStyle = '#0F3D2E';
    ctx.font = '900 28px system-ui, -apple-system, Arial, sans-serif';
    ctx.fillText('ARANPRO', padL, curY + 42);
    logoEndX = padL + 155;
  }

  // Línea divisoria vertical junto al logo
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(logoEndX, curY + 8);
  ctx.lineTo(logoEndX, curY + 68);
  ctx.stroke();

  const infoX = logoEndX + 18;
  const rawCompanyRut = String(empresaForm.companyRut || '').trim();
  const companyRut = rawCompanyRut && !rawCompanyRut.includes('76.999.888') ? rawCompanyRut : '';
  const email = empresaForm.email || 'contacto@aranpro.cl';
  const phone = empresaForm.phone || '+56 9 5811 8504';
  const city = empresaForm.city || 'La Serena, Coquimbo';
  const website = empresaForm.website || 'https://aranpro.cl';
  const adminName = empresaForm.adminName || 'John Andrés Arancibia Maureira';
  const adminRut = (empresaForm.adminRut && empresaForm.adminRut !== '14.882.140-K') ? empresaForm.adminRut : '16.012.871-2';

  ctx.fillStyle = '#0F3D2E';
  ctx.font = '900 18px system-ui, -apple-system, Arial, sans-serif';
  ctx.fillText('ARANPRO • GESTIÓN INTEGRAL', infoX, curY + 24);

  ctx.fillStyle = '#475569';
  ctx.font = '600 13px "Courier New", Courier, monospace';
  ctx.fillText(
    companyRut
      ? `RUT Empresa: ${companyRut} • Ley N° 21.442 de Copropiedad Inmobiliaria`
      : 'Administración Profesional • Ley N° 21.442 de Copropiedad Inmobiliaria',
    infoX,
    curY + 45
  );

  ctx.fillStyle = '#64748B';
  ctx.font = '12.5px system-ui, -apple-system, Arial, sans-serif';
  ctx.fillText(`${email} • ${phone} • ${city}`, infoX, curY + 64);

  // Bloque derecho del Membrete
  const rightX = W - padR;
  ctx.font = 'bold 12px "Courier New", Courier, monospace';
  const badgeW = ctx.measureText(badgeText).width + 24;
  roundRect(ctx, rightX - badgeW, curY + 4, badgeW, 24, 6);
  ctx.fillStyle = '#F5F4EF';
  ctx.fill();
  ctx.strokeStyle = '#D4B895';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.fillStyle = '#0F3D2E';
  ctx.textAlign = 'right';
  ctx.fillText(badgeText, rightX - 12, curY + 20);

  ctx.fillStyle = '#1E293B';
  ctx.font = 'bold 14px system-ui, -apple-system, Arial, sans-serif';
  ctx.fillText(docTypeTitle, rightX, curY + 46);

  ctx.fillStyle = '#64748B';
  ctx.font = '600 12.5px system-ui, -apple-system, Arial, sans-serif';
  ctx.fillText(docSubTitle, rightX, curY + 65);
  ctx.textAlign = 'left';

  curY += 86;

  // Línea verde bosque bajo el membrete
  ctx.strokeStyle = '#0F3D2E';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(padL, curY);
  ctx.lineTo(W - padR, curY);
  ctx.stroke();

  // 5. Sección Inferior Anclada al Fondo (Sello Oficial, Canales de Contacto, Firma Manuscrita y Pie Canónico)
  const footerLineY = H - 72;
  const sigSectionTopY = H - 210;

  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(padL, sigSectionTopY);
  ctx.lineTo(W - padR, sigSectionTopY);
  ctx.stroke();

  // Lado Izquierdo: Sello Circular Dorado + Glosa Oficial
  const sealSize = 72;
  const sealY = sigSectionTopY + 26;
  if (sealImg) {
    ctx.drawImage(sealImg, padL, sealY, sealSize, sealSize);
  }

  const sealTextX = padL + sealSize + 14;
  if (companyRut) {
    ctx.fillStyle = '#0F3D2E';
    ctx.font = '800 13px system-ui, -apple-system, Arial, sans-serif';
    ctx.fillText('SELLO OFICIAL DE ADMINISTRACIÓN', sealTextX, sealY + 24);

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 12.5px "Courier New", Courier, monospace';
    ctx.fillText(`RUT Empresa: ${companyRut}`, sealTextX, sealY + 44);

    ctx.fillStyle = '#64748B';
    ctx.font = 'bold 12px system-ui, -apple-system, Arial, sans-serif';
    ctx.fillText('Ley N° 21.442 de Copropiedad Inmobiliaria', sealTextX, sealY + 63);
  } else {
    ctx.fillStyle = '#0F3D2E';
    ctx.font = '800 13px system-ui, -apple-system, Arial, sans-serif';
    ctx.fillText('SELLO OFICIAL DE ADMINISTRACIÓN', sealTextX, sealY + 32);

    ctx.fillStyle = '#64748B';
    ctx.font = 'bold 12px system-ui, -apple-system, Arial, sans-serif';
    ctx.fillText('Ley N° 21.442 de Copropiedad Inmobiliaria', sealTextX, sealY + 53);
  }

  // Separador vertical central-izquierdo + Canales Directos
  const contactDivX = sealTextX + 275;
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(contactDivX, sealY + 6);
  ctx.lineTo(contactDivX, sealY + 70);
  ctx.stroke();

  const contactX = contactDivX + 16;
  ctx.font = 'bold 12.5px system-ui, -apple-system, Arial, sans-serif';
  ctx.fillStyle = '#334155';
  ctx.fillText('Fono / WhatsApp: ', contactX, sealY + 22);
  const fwW = ctx.measureText('Fono / WhatsApp: ').width;
  ctx.fillStyle = '#0F3D2E';
  ctx.font = 'bold 12.5px "Courier New", Courier, monospace';
  ctx.fillText(phone, contactX + fwW, sealY + 22);

  ctx.font = 'bold 12.5px system-ui, -apple-system, Arial, sans-serif';
  ctx.fillStyle = '#334155';
  ctx.fillText('Correo: ', contactX, sealY + 43);
  const corW = ctx.measureText('Correo: ').width;
  ctx.fillStyle = '#475569';
  ctx.font = '12.5px "Courier New", Courier, monospace';
  ctx.fillText(email, contactX + corW, sealY + 43);

  ctx.font = 'bold 12.5px system-ui, -apple-system, Arial, sans-serif';
  ctx.fillStyle = '#334155';
  ctx.fillText('Sitio Web: ', contactX, sealY + 64);
  const webW = ctx.measureText('Sitio Web: ').width;
  ctx.fillStyle = '#0F3D2E';
  ctx.font = 'bold 12.5px "Courier New", Courier, monospace';
  ctx.fillText(website, contactX + webW, sealY + 64);

  // Lado Derecho: Firma Manuscrita Real sobre Línea + Nombre Único bajo la línea
  const sigBoxW = 350;
  const sigBoxX = rightX - sigBoxW;
  const sigLineY = sigSectionTopY + 76;

  if (sigImg) {
    const maxSigH = 68;
    const maxSigW = 240;
    const ratio = Math.min(maxSigW / sigImg.width, maxSigH / sigImg.height);
    const drawW = sigImg.width * ratio;
    const drawH = sigImg.height * ratio;
    ctx.drawImage(sigImg, sigBoxX + (sigBoxW - drawW) / 2, sigLineY - drawH - 3, drawW, drawH);
  }

  ctx.strokeStyle = '#0F3D2E';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(sigBoxX, sigLineY);
  ctx.lineTo(rightX, sigLineY);
  ctx.stroke();

  ctx.textAlign = 'center';
  const sigCenterX = sigBoxX + sigBoxW / 2;
  ctx.fillStyle = '#0F172A';
  ctx.font = '900 14.5px system-ui, -apple-system, Arial, sans-serif';
  ctx.fillText(adminName, sigCenterX, sigLineY + 19);

  ctx.fillStyle = '#0F3D2E';
  ctx.font = 'bold 12.5px system-ui, -apple-system, Arial, sans-serif';
  ctx.fillText('Constructor Civil • Administrador de Condominios', sigCenterX, sigLineY + 36);

  ctx.fillStyle = '#475569';
  ctx.font = '12px "Courier New", Courier, monospace';
  ctx.fillText(`RUT: ${adminRut} • Representante Legal ARANPRO`, sigCenterX, sigLineY + 53);
  ctx.textAlign = 'left';

  // Pie de Página Canónico Maestro
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(padL, footerLineY);
  ctx.lineTo(W - padR, footerLineY);
  ctx.stroke();

  ctx.fillStyle = '#94A3B8';
  ctx.font = '11.5px "Courier New", Courier, monospace';
  ctx.fillText(`ARANPRO Gestión Integral • ${website}`, padL, footerLineY + 22);

  ctx.fillStyle = '#0F3D2E';
  ctx.font = 'bold 11.5px "Courier New", Courier, monospace';
  ctx.textAlign = 'center';
  ctx.fillText(footerCenterText, W / 2 + 10, footerLineY + 22);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '11.5px "Courier New", Courier, monospace';
  ctx.textAlign = 'right';
  ctx.fillText('La Serena, Chile', rightX, footerLineY + 22);
  ctx.textAlign = 'left';

  return { padL, padR, contentW, startY: curY + 18, bottomLimitY: sigSectionTopY - 14 };
};

/**
 * Dibuja el Encabezado Protocolar gris claro
 */
const drawProtocolBox = (ctx, x, y, w, rows) => {
  const rowH = 23;
  const boxH = rows.length * rowH + 22;
  roundRect(ctx, x, y, w, boxH, 14);
  ctx.fillStyle = '#F8FAFC';
  ctx.fill();
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  let ry = y + 25;
  for (const r of rows) {
    ctx.font = 'bold 14px system-ui, -apple-system, Arial, sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText(r.label, x + 18, ry);
    const lw = ctx.measureText(r.label).width;

    ctx.font = r.valueFont || 'bold 14px system-ui, -apple-system, Arial, sans-serif';
    ctx.fillStyle = r.valueColor || '#0F172A';
    ctx.fillText(r.value, x + 18 + lw + 6, ry);
    ry += rowH;
  }

  return y + boxH + 18;
};

/**
 * Genera el PDF Canónico exacto para el paso indicado (1, 2, 3 o 4)
 * Prioridad 1: Captura directa 1:1 del documento maestro en el DOM oficial de la aplicación.
 * Respaldo: Motor gráfico canónico integrado en caso de ejecutarse fuera de la interfaz.
 */
export const generateStepPdfAttachment = async ({
  stepNumber = 1,
  proposalConfig = {},
  empresaForm = {},
  signatureImage = ''
}) => {
  const targetClean = (proposalConfig.targetCondo || 'Comite_Administracion').replace(/[^a-zA-Z0-9]/g, '_');
  const dateClean = (proposalConfig.proposalDate || new Date().toISOString().slice(0, 10)).replace(/[^0-9]/g, '');

  let elementId = 'printable-cold-value-letter';
  let defaultFilename = `ARANPRO_Carta_Valor_Comite_${targetClean}_${dateClean}.pdf`;

  if (stepNumber === 1) {
    elementId = 'printable-cold-value-letter';
    defaultFilename = `ARANPRO_Carta_Valor_Comite_${targetClean}_${dateClean}.pdf`;
  } else if (stepNumber === 2) {
    elementId = 'printable-full-dossier';
    defaultFilename = `ARANPRO_Dossier_Integral_${targetClean}_${dateClean}.pdf`;
  } else if (stepNumber === 3) {
    elementId = 'printable-commercial-proposal';
    defaultFilename = `ARANPRO_Carta_Formal_Postulacion_${targetClean}_${dateClean}.pdf`;
  } else if (stepNumber === 4) {
    elementId = 'printable-app-brochure';
    defaultFilename = `ARANPRO_Brochure_App_${targetClean}_${dateClean}.pdf`;
  }

  // ===== PRIORIDAD 1: EXPORTACIÓN DIRECTA DEL DOCUMENTO MAESTRO EN EL DOM =====
  try {
    if (typeof document !== 'undefined') {
      let el = document.getElementById(elementId);
      if (!el) {
        el = document.querySelector(`[id="${elementId}"]`);
      }
      if (el) {
        const contentBase64 = await exportDomElementToPdfBase64(el, { filename: defaultFilename });
        if (contentBase64 && contentBase64.length > 500) {
          return {
            filename: defaultFilename,
            contentBase64
          };
        }
      }
    }
  } catch (domErr) {
    console.error(`[generateStepPdfAttachment] Error al exportar #${elementId} desde el DOM:`, domErr);
  }

  // ===== RESPALDO CANÓNICO VÍA CANVAS =====
  // Tamaño Carta en alta resolución (150 DPI: 1275 x 1650 px -> proporción exacta Letter 8.5 x 11")
  const W = 1275;
  const H = 1650;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  const [logoImg, sealImg, sigImg] = await Promise.all([
    loadImage('/brand/ARANPRO_logo_principal_transparente_trimmed.png'),
    loadImage('/brand/ARANPRO_sello_circular_integral_transparente.png'),
    loadImage(signatureImage || empresaForm.signatureDataUrl || '/brand/email_firma_admin.png')
  ]);

  const condo = proposalConfig.targetCondo?.trim() || 'Valle de la Florida IV';
  const recipient = proposalConfig.targetRecipient?.trim() || 'Señores Integrantes del Comité de Administración';
  const adminName = empresaForm.adminName || 'John Andrés Arancibia Maureira';
  const year = new Date().getFullYear();

  const baseFont = '14px system-ui, -apple-system, Arial, sans-serif';
  const boldFont = 'bold 14px system-ui, -apple-system, Arial, sans-serif';

  // ==================== PASO 1: CARTA DE VALOR AL COMITÉ (RÉPLICA EXACTA 1:1) ====================
  if (stepNumber === 1) {
    const { padL, contentW, startY } = drawCanonicalFrame({
      ctx,
      W,
      H,
      logoImg,
      sealImg,
      sigImg,
      empresaForm,
      badgeText: `PRESENTACIÓN INSTITUCIONAL ${year}`,
      docTypeTitle: 'Carta de Presentación & Propuesta de Servicios',
      docSubTitle: 'Para el Comité de Administración',
      footerCenterText: 'Presentación Oficial para Comités de Administración • Ley N° 21.442 (Pág. 1 de 1)'
    });

    let curY = drawProtocolBox(ctx, padL, startY, contentW, [
      { label: 'Dirigido cordialmente a:', value: recipient, valueColor: '#0F172A' },
      { label: 'Comunidad / Condominio:', value: condo.toUpperCase(), valueColor: '#0F3D2E', valueFont: '900 14px system-ui, -apple-system, Arial, sans-serif' },
      { label: 'Presentado por:', value: `${adminName} — Constructor Civil • Administrador de Condominios (Ley N° 21.442)`, valueColor: '#334155', valueFont: '14px system-ui, -apple-system, Arial, sans-serif' },
      { label: 'Materia:', value: 'Presentación de Servicios de Administración Profesional & Propuesta Operativa Integral', valueColor: '#334155', valueFont: '14px system-ui, -apple-system, Arial, sans-serif' }
    ]);

    // Título Centrado + Barra Dorada
    ctx.textAlign = 'center';
    ctx.fillStyle = '#0F3D2E';
    ctx.font = '900 17.5px system-ui, -apple-system, Arial, sans-serif';
    ctx.fillText('ADMINISTRACIÓN PROFESIONAL, CRITERIO CONSTRUCTOR CIVIL & PLATAFORMA DIGITAL 100% GRATUITA', W / 2 + 7, curY + 8);
    ctx.textAlign = 'left';

    ctx.fillStyle = '#D4B895';
    roundRect(ctx, W / 2 - 42, curY + 17, 98, 3.5, 2);
    ctx.fill();
    curY += 42;

    // Párrafo 1 (Idéntico a ARANPRO_Carta_Valor_Comite)
    const p1 = `**Estimadas y estimados integrantes del Comité de Administración:** Junto con saludarles muy cordialmente, nos dirigimos a ustedes reconociendo y valorando con la mayor consideración el enorme compromiso, tiempo y dedicación personal que entregan día a día a su comunidad para resguardar la seguridad, la armonía y el patrimonio de sus vecinos y familias. Sabemos por experiencia que liderar un condominio suele transformarse en una carga desgastante y solitaria cuando la administración no responde con la prontitud requerida, las rendiciones de cuentas carecen de respaldos oportunos o las mantenciones e imprevistos de infraestructura se encarecen por la ausencia de una supervisión técnica rigurosa en terreno.`;
    curY = drawRichParagraph(ctx, p1, padL, curY, contentW, 21, baseFont, boldFont, '#1E293B', '#0F172A', true);
    curY += 10;

    // Párrafo 2
    const p2 = `Con el firme propósito de ser el respaldo técnico y operativo que su directiva necesita para gobernar con tranquilidad, ponemos a su consideración los servicios de **ARANPRO Gestión Integral** para asumir la administración de **${condo}**. Nuestro modelo de gestión integra cercanía humana, rendiciones de cuentas transparentes y verificables bajo la **Ley N° 21.442**, y la dirección técnica de un profesional **Constructor Civil** que supervisa directamente las instalaciones críticas y defiende el presupuesto comunitario frente a contratistas. Nos motiva conocer a fondo las prioridades de ${condo} y poner a su disposición una administración seria, transparente y comprometida con la plusvalía de su copropiedad.`;
    curY = drawRichParagraph(ctx, p2, padL, curY, contentW, 21, baseFont, boldFont, '#1E293B', '#0F172A', true);
    curY += 10;

    // Frase introductoria a los 3 pilares
    const p3 = `Nuestra propuesta de valor se fundamenta en **tres pilares operativos** diseñados para entregar orden financiero, rigor técnico y tranquilidad total a su comunidad:`;
    curY = drawRichParagraph(ctx, p3, padL, curY, contentW, 21, '600 14px system-ui, -apple-system, Arial, sans-serif', '900 14px system-ui, -apple-system, Arial, sans-serif', '#0F3D2E', '#0F3D2E', false);
    curY += 6;

    // 3 Pilares Apilados Horizontalmente (1, 2, 3)
    const pillars = [
      {
        num: '1',
        title: 'Gestión financiera, rendición de cuentas & Plataforma digital 100% gratuita',
        text: 'Preparación y seguimiento del presupuesto, gestión de gastos comunes y morosidad, revisión de pagos y organización de respaldos. **La plataforma digital y app móvil de ARANPRO se entrega 100% gratuita para toda la comunidad**, facilitando la consulta de la información de gestión las 24 horas, con accesos definidos según las funciones del comité y de los residentes.'
      },
      {
        num: '2',
        title: 'Mantención y evaluación de proveedores (Criterio Constructor Civil)',
        text: 'Revisión en terreno de las necesidades de la comunidad con formación profesional de Constructor Civil, programación de mantenciones preventivas y seguimiento de reparaciones. Al comparar cotizaciones, revisamos alcances, cantidades, exclusiones y condiciones de ejecución para apoyar decisiones fundamentadas del comité y controlar el cumplimiento de los trabajos contratados.'
      },
      {
        num: '3',
        title: 'Personal, acuerdos y organización de la comunidad',
        text: 'Gestión documental del personal, coordinación de turnos y seguimiento de obligaciones laborales y preventivas (Ley Karin y RIOHS). Apoyo en la preparación de asambleas, registro y ejecución de acuerdos y coordinación de proveedores, con responsables y plazos que permitan al comité conocer el avance de la gestión.'
      }
    ];

    for (const pil of pillars) {
      const cardH = 104;
      roundRect(ctx, padL, curY, contentW, cardH, 14);
      ctx.fillStyle = '#F8FAFC';
      ctx.fill();
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Insignia cuadrada verde/dorada con el número
      roundRect(ctx, padL + 14, curY + 14, 28, 28, 7);
      ctx.fillStyle = '#0F3D2E';
      ctx.fill();
      ctx.fillStyle = '#D4B895';
      ctx.font = '900 14px system-ui, -apple-system, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(pil.num, padL + 28, curY + 33);
      ctx.textAlign = 'left';

      // Título del pilar
      const textX = padL + 54;
      const textW = contentW - 70;
      ctx.fillStyle = '#0F3D2E';
      ctx.font = 'bold 14.5px system-ui, -apple-system, Arial, sans-serif';
      ctx.fillText(pil.title, textX, curY + 29);

      // Descripción del pilar
      drawRichParagraph(
        ctx,
        pil.text,
        textX,
        curY + 50,
        textW,
        19,
        '13px system-ui, -apple-system, Arial, sans-serif',
        'bold 13px system-ui, -apple-system, Arial, sans-serif',
        '#475569',
        '#1E293B',
        false
      );

      curY += cardH + 10;
    }

    curY += 4;

    // Recuadro Verde: ★ VALOR Y BENEFICIOS 100% GRATUITOS
    const greenBoxH = 172;
    roundRect(ctx, padL, curY, contentW, greenBoxH, 14);
    ctx.fillStyle = '#F0FDF4';
    ctx.fill();
    ctx.strokeStyle = '#0F3D2E';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    ctx.fillStyle = '#0F3D2E';
    ctx.font = '900 13px "Courier New", Courier, monospace';
    ctx.fillText(`★ VALOR Y BENEFICIOS 100% GRATUITOS PARA ${condo.toUpperCase()}`, padL + 18, curY + 26);

    // Badge derecho "100% Gratuito e Incluido"
    const gBadgeText = '100% Gratuito e Incluido';
    ctx.font = 'bold 11.5px system-ui, -apple-system, Arial, sans-serif';
    const gBadgeW = ctx.measureText(gBadgeText).width + 24;
    roundRect(ctx, padL + contentW - gBadgeW - 16, curY + 10, gBadgeW, 24, 6);
    ctx.fillStyle = '#0F3D2E';
    ctx.fill();
    ctx.fillStyle = '#D4B895';
    ctx.textAlign = 'center';
    ctx.fillText(gBadgeText, padL + contentW - gBadgeW / 2 - 16, curY + 26);
    ctx.textAlign = 'left';

    let bY = curY + 50;
    const b1 = `**• Plataforma Digital & App Móvil 100% Gratuita para la Comunidad:** Toda la comunidad (copropietarios y residentes) y el Comité cuentan con acceso ilimitado a nuestra suite digital 24/7 para consultar gastos comunes, cartolas bancarias, respaldos de facturas, libro de reclamos y votaciones, **sin costos de licencias ni cobros de software para el condominio**.`;
    bY = drawRichParagraph(
      ctx,
      b1,
      padL + 18,
      bY,
      contentW - 36,
      19.5,
      '13px system-ui, -apple-system, Arial, sans-serif',
      'bold 13px system-ui, -apple-system, Arial, sans-serif',
      '#1E293B',
      '#0F172A',
      false
    );

    bY += 6;
    const b2 = `**• Reunión de Presentación y Visita Inicial Sin Costo ni Compromiso:** Les propongo coordinar una visita inicial en terreno para conocer las instalaciones críticas (sala de bombas, tableros, cubiertas), dotación y prioridades del comité, y preparar una propuesta formal que precise las funciones asumidas, la modalidad de atención, los reportes, las prioridades de inicio y los honorarios.`;
    drawRichParagraph(
      ctx,
      b2,
      padL + 18,
      bY,
      contentW - 36,
      19.5,
      '13px system-ui, -apple-system, Arial, sans-serif',
      'bold 13px system-ui, -apple-system, Arial, sans-serif',
      '#1E293B',
      '#0F172A',
      false
    );

    const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.92);
    return {
      filename: `ARANPRO_Carta_Valor_Comite_${targetClean}_${dateClean}.pdf`,
      contentBase64: pagesJpegToPdfBase64([jpegDataUrl], W, H)
    };
  }

  // ==================== PASO 3: CARTA FORMAL DE POSTULACIÓN CON HONORARIOS ====================
  if (stepNumber === 3) {
    const { padL, contentW, startY } = drawCanonicalFrame({
      ctx,
      W,
      H,
      logoImg,
      sealImg,
      sigImg,
      empresaForm,
      badgeText: `PROPUESTA LICITACIÓN ${year}`,
      docTypeTitle: 'Carta Formal de Postulación',
      docSubTitle: condo,
      footerCenterText: 'Carta Formal de Postulación a Licitación • Ley N° 21.442 (Pág. 1 de 1)'
    });

    const dateFormatted = new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' });
    let curY = drawProtocolBox(ctx, padL, startY, contentW, [
      { label: 'Dirigido cordialmente a:', value: recipient, valueColor: '#0F172A' },
      { label: 'Condominio / Edificio:', value: condo.toUpperCase(), valueColor: '#0F3D2E', valueFont: '900 14px system-ui, -apple-system, Arial, sans-serif' },
      { label: 'Presentado por:', value: `${adminName} — Constructor Civil • Administrador de Condominios (Ley N° 21.442)`, valueColor: '#334155', valueFont: '14px system-ui, -apple-system, Arial, sans-serif' },
      { label: 'Fecha:', value: `${dateFormatted} • ${proposalConfig.targetCity || empresaForm.city || 'La Serena, Chile'}`, valueColor: '#334155', valueFont: '14px system-ui, -apple-system, Arial, sans-serif' },
      { label: 'Materia:', value: 'Postulación Formal a la Administración y Custodia Patrimonial del Condominio', valueColor: '#334155', valueFont: '14px system-ui, -apple-system, Arial, sans-serif' }
    ]);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#0F3D2E';
    ctx.font = '900 17.5px system-ui, -apple-system, Arial, sans-serif';
    ctx.fillText('PROPUESTA FORMAL DE ADMINISTRACIÓN, RIGOR CONSTRUCTIVO & TRANSPARENCIA DIGITAL', W / 2 + 7, curY + 8);
    ctx.textAlign = 'left';

    ctx.fillStyle = '#D4B895';
    roundRect(ctx, W / 2 - 42, curY + 17, 98, 3.5, 2);
    ctx.fill();
    curY += 44;

    const p1 = `Estimados ${recipient}:`;
    curY = drawRichParagraph(ctx, p1, padL, curY, contentW, 22, boldFont, boldFont, '#0F172A', '#0F172A', false);
    curY += 8;

    const p2 = `Por medio de la presente, tengo el agrado de presentar a ustedes la postulación formal de **${empresaForm.provisionalName || 'ARANPRO Gestión Integral'}** para asumir la administración, gestión operativa y resguardo patrimonial de **${condo}** conforme a las disposiciones de la **Ley N° 21.442 de Copropiedad Inmobiliaria**.`;
    curY = drawRichParagraph(ctx, p2, padL, curY, contentW, 22, baseFont, boldFont, '#1E293B', '#0F172A', true);
    curY += 10;

    const presText = empresaForm.presentationText || `ARANPRO es una empresa de gestión y administración profesional de condominios en la Región de Coquimbo. Nuestro valor diferenciador único radica en el perfil de Constructor Civil de nuestro administrador titular, combinando sólida fiscalización de contratos de mantención, auditoría preventiva de bombas, tableros y ascensores, junto a un portal web exclusivo que otorga transparencia 100% en las cuentas y cobros mensuales.`;
    curY = drawRichParagraph(ctx, presText, padL, curY, contentW, 22, baseFont, boldFont, '#1E293B', '#0F172A', true);
    curY += 14;

    // Caja: NUESTRAS 4 FORTALEZAS Y VENTAJAS COMPETITIVAS
    const fortH = 166;
    roundRect(ctx, padL, curY, contentW, fortH, 14);
    ctx.fillStyle = '#F8FAFC';
    ctx.fill();
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#0F3D2E';
    ctx.font = '900 13.5px system-ui, -apple-system, Arial, sans-serif';
    ctx.fillText('NUESTRAS 4 FORTALEZAS Y VENTAJAS COMPETITIVAS:', padL + 18, curY + 26);

    const strengths = [
      '**• Solvencia Técnica Constructor Civil:** Diagnósticos directos en bombas, tableros eléctricos, sellos y cubiertas sin sobrecostos de contratistas externos.',
      '**• Transparencia Contable Digital 24/7:** Portal y app móvil gratuita donde cada vecino audita con 1 clic las facturas, boletas y cartolas bancarias.',
      '**• Cumplimiento Normativo Ley 21.442:** Administración titular respaldada bajo las exigencias legales vigentes (Solicitud RNAC MINVU PN-27583).',
      '**• Cobranza Asistida & Fe Notarial:** Emisión formal de certificados de no deuda, convenios de pago y control riguroso de morosidad (Art. 36°).'
    ];
    let sY = curY + 50;
    for (const st of strengths) {
      sY = drawRichParagraph(ctx, st, padL + 18, sY, contentW - 36, 20, '13px system-ui, -apple-system, Arial, sans-serif', 'bold 13px system-ui, -apple-system, Arial, sans-serif', '#334155', '#0F172A', false);
      sY += 6;
    }

    curY += fortH + 18;

    // Caja: Propuesta Económica & Honorarios de Administración (Ley N° 21.442)
    const econH = 175;
    roundRect(ctx, padL, curY, contentW, econH, 14);
    ctx.fillStyle = '#F5F4EF';
    ctx.fill();
    ctx.strokeStyle = '#D4B895';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#0F3D2E';
    ctx.font = '900 13.5px system-ui, -apple-system, Arial, sans-serif';
    ctx.fillText('PROPUESTA ECONÓMICA & HONORARIOS DE ADMINISTRACIÓN (LEY N° 21.442)', padL + 18, curY + 28);

    const feeNum = Number(proposalConfig.proposedMonthlyFee) || 850000;
    const unitsNum = Math.max(1, Number(proposalConfig.targetUnits) || 60);
    const feeFormatted = `$${feeNum.toLocaleString('es-CL')} / mes`;
    const perUnitFormatted = `$${Math.round(feeNum / unitsNum).toLocaleString('es-CL')} / unidad`;

    const colW = (contentW - 56) / 3;
    const cards = [
      { label: 'HONORARIO MENSUAL PROPUESTO', val: feeFormatted, color: '#0F3D2E' },
      { label: 'COSTO ESTIMADO / UNIDAD', val: perUnitFormatted, color: '#0F172A' },
      { label: 'COMUNIDAD EVALUADA', val: `${unitsNum} Unidades`, color: '#0F172A' }
    ];

    cards.forEach((c, idx) => {
      const cx = padL + 18 + idx * (colW + 10);
      roundRect(ctx, cx, curY + 44, colW, 74, 10);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#64748B';
      ctx.font = 'bold 11px system-ui, -apple-system, Arial, sans-serif';
      ctx.fillText(c.label, cx + colW / 2, curY + 68);

      ctx.fillStyle = c.color;
      ctx.font = '900 18px system-ui, -apple-system, Arial, sans-serif';
      ctx.fillText(c.val, cx + colW / 2, curY + 98);
      ctx.textAlign = 'left';
    });

    const incText = `**Incluye sin costo adicional:** ${proposalConfig.visitFrequency || '2 visitas técnicas presenciales por semana + atención de emergencias 24/7'}, Suite Web & App Móvil ARANPRO 24/7 para todos los copropietarios, y auditoría de traspaso inicial.`;
    drawRichParagraph(ctx, incText, padL + 18, curY + 140, contentW - 36, 18, '12.5px system-ui, -apple-system, Arial, sans-serif', 'bold 12.5px system-ui, -apple-system, Arial, sans-serif', '#475569', '#0F172A', false);

    const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.92);
    return {
      filename: `ARANPRO_Carta_Presentacion_${targetClean}_${dateClean}.pdf`,
      contentBase64: pagesJpegToPdfBase64([jpegDataUrl], W, H)
    };
  }

  // ==================== PASO 4: BROCHURE SUITE DIGITAL & DEMO CON QR ====================
  if (stepNumber === 4) {
    const { padL, contentW, startY } = drawCanonicalFrame({
      ctx,
      W,
      H,
      logoImg,
      sealImg,
      sigImg,
      empresaForm,
      badgeText: 'ACCESO 24/7 EN LÍNEA',
      docTypeTitle: 'Portal Web & App Móvil ARANPRO',
      docSubTitle: condo,
      footerCenterText: 'Brochure Tecnológico • Suite Web & App Móvil • Ley N° 21.442 (Pág. 1 de 1)'
    });

    let curY = drawProtocolBox(ctx, padL, startY, contentW, [
      { label: 'Dirigido cordialmente a:', value: `${recipient} y Copropietarios`, valueColor: '#0F172A' },
      { label: 'Comunidad Beneficiaria:', value: condo.toUpperCase(), valueColor: '#0F3D2E', valueFont: '900 14px system-ui, -apple-system, Arial, sans-serif' },
      { label: 'Beneficio Incluido:', value: 'Plataforma Digital & Aplicación Móvil 100% Gratuita (Costo $0 en Licencias)', valueColor: '#166534' }
    ]);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#0F3D2E';
    ctx.font = '900 18px system-ui, -apple-system, Arial, sans-serif';
    ctx.fillText('SUITE DIGITAL ARANPRO: TRANSPARENCIA FINANCIERA Y GESTIÓN MÓVIL 24/7', W / 2 + 7, curY + 10);
    ctx.textAlign = 'left';

    ctx.fillStyle = '#D4B895';
    roundRect(ctx, W / 2 - 42, curY + 19, 98, 3.5, 2);
    ctx.fill();
    curY += 46;

    // 4 Pilares Tecnológicos en Grilla 2x2
    const techPillars = [
      {
        title: '1. Auditoría Bancaria con 1 Clic',
        desc: 'Cada factura, boleta de honorarios y comprobante de transferencia bancaria de los gastos comunes está disponible en línea para consulta inmediata de cualquier vecino. Cero suspicacias.'
      },
      {
        title: '2. Colilla Digital & Pago Rápido',
        desc: 'Desglose detallado del gasto común del mes, desglose del fondo de reserva obligatorio (Art. 6° Ley 21.442), lecturas individuales y acceso directo a comprobantes de pago.'
      },
      {
        title: '3. Asambleas y Voto Telemático',
        desc: 'Participación híbrida conforme al Art. 15° de la Ley 21.442. Los propietarios pueden emitir su voto de manera segura desde el celular con quórums auditados en tiempo real.'
      },
      {
        title: '4. Libro Oficial de Reclamos Digital',
        desc: 'Trazabilidad legal con folios correlativos bajo el Art. 20°. Cada reclamo o sugerencia ingresado tiene fecha límite estricta de respuesta formal por parte de la administración.'
      }
    ];

    const boxW = (contentW - 20) / 2;
    const boxH = 148;
    techPillars.forEach((tp, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const bx = padL + col * (boxW + 20);
      const by = curY + row * (boxH + 18);

      roundRect(ctx, bx, by, boxW, boxH, 14);
      ctx.fillStyle = '#F8FAFC';
      ctx.fill();
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#0F3D2E';
      ctx.font = '900 15px system-ui, -apple-system, Arial, sans-serif';
      ctx.fillText(`✓  ${tp.title}`, bx + 18, by + 32);

      drawRichParagraph(ctx, tp.desc, bx + 18, by + 58, boxW - 36, 21, '13.5px system-ui, -apple-system, Arial, sans-serif', 'bold 13.5px system-ui, -apple-system, Arial, sans-serif', '#475569', '#0F172A', false);
    });

    curY += boxH * 2 + 48;

    // Caja de Demo Interactiva + Código QR
    const qrBoxH = 210;
    roundRect(ctx, padL, curY, contentW, qrBoxH, 16);
    ctx.fillStyle = '#F5F4EF';
    ctx.fill();
    ctx.strokeStyle = '#0F3D2E';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    roundRect(ctx, padL + 22, curY + 20, 210, 24, 6);
    ctx.fillStyle = '#0F3D2E';
    ctx.fill();
    ctx.fillStyle = '#D4B895';
    ctx.font = 'bold 11.5px "Courier New", Courier, monospace';
    ctx.fillText('★ DEMO INTERACTIVA EN VIVO', padL + 34, curY + 36);

    ctx.fillStyle = '#0F3D2E';
    ctx.font = '900 18px system-ui, -apple-system, Arial, sans-serif';
    ctx.fillText(`Pruebe la experiencia de los residentes de ${condo}`, padL + 22, curY + 72);

    const qrDesc = `Escanee este código QR con la cámara de su teléfono móvil o ingrese a **${empresaForm.website || 'https://aranpro.cl'}** para probar la plataforma en tiempo real: consulte colillas, respalde gastos con un clic y revise el libro de reclamos digital.`;
    drawRichParagraph(ctx, qrDesc, padL + 22, curY + 102, contentW - 230, 22, '14px system-ui, -apple-system, Arial, sans-serif', 'bold 14px system-ui, -apple-system, Arial, sans-serif', '#334155', '#0F172A', false);

    ctx.fillStyle = '#0F3D2E';
    ctx.font = 'bold 13px "Courier New", Courier, monospace';
    ctx.fillText('100% Gratuita para la comunidad • Cero costos de licencias o software', padL + 22, curY + 178);

    // QR Vectorial en el lado derecho de la caja
    const qrSize = 150;
    const qrX = padL + contentW - qrSize - 26;
    const qrY = curY + 22;
    roundRect(ctx, qrX, qrY, qrSize, qrSize + 22, 12);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const drawQrCorner = (qx, qy) => {
      ctx.fillStyle = '#0F3D2E';
      ctx.fillRect(qx, qy, 34, 34);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(qx + 6, qy + 6, 22, 22);
      ctx.fillStyle = '#0F3D2E';
      ctx.fillRect(qx + 11, qy + 11, 12, 12);
    };
    drawQrCorner(qrX + 14, qrY + 12);
    drawQrCorner(qrX + qrSize - 48, qrY + 12);
    drawQrCorner(qrX + 14, qrY + qrSize - 46);

    ctx.fillStyle = '#0F3D2E';
    const dots = [
      [56, 16], [70, 16], [84, 28], [56, 40], [70, 52], [56, 66], [72, 66], [90, 66],
      [20, 62], [36, 62], [56, 84], [74, 84], [92, 84], [112, 62], [112, 82],
      [56, 104], [72, 116], [90, 104], [110, 112], [60, 126], [84, 126], [108, 126]
    ];
    for (const [dx, dy] of dots) {
      ctx.fillRect(qrX + dx, qrY + dy, 10, 10);
    }

    ctx.fillStyle = '#64748B';
    ctx.font = 'bold 10px "Courier New", Courier, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ESCANEAR CON CELULAR', qrX + qrSize / 2, qrY + qrSize + 13);
    ctx.textAlign = 'left';

    const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.92);
    return {
      filename: `ARANPRO_Brochure_App_Copropietarios_${targetClean}_${dateClean}.pdf`,
      contentBase64: pagesJpegToPdfBase64([jpegDataUrl], W, H)
    };
  }

  // ==================== PASO 2: DOSSIER INTEGRAL DE LICITACIÓN (4 PÁGINAS CANÓNICAS 1:1) ====================
  const dateFormatted = new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' });

  // -------------------- PÁGINA 1: PORTADA & CARTA EJECUTIVA DE PRESENTACIÓN --------------------
  const canvas1 = document.createElement('canvas');
  canvas1.width = W;
  canvas1.height = H;
  const ctx1 = canvas1.getContext('2d');

  const f1 = drawCanonicalFrame({
    ctx: ctx1,
    W,
    H,
    logoImg,
    sealImg,
    sigImg,
    empresaForm,
    badgeText: `DOSSIER INSTITUCIONAL DE GESTIÓN`,
    docTypeTitle: 'Administración Cercana, Orden Financiero & Especialidad Constructiva',
    docSubTitle: condo,
    footerCenterText: 'Página 1 de 4 • Propuesta de Gestión & Cercanía Operativa • Ley N° 21.442'
  });

  let curY1 = drawProtocolBox(ctx1, f1.padL, f1.startY, f1.contentW, [
    { label: 'Dirigido cordialmente a:', value: recipient, valueColor: '#0F172A' },
    { label: 'Condominio / Edificio:', value: condo.toUpperCase(), valueColor: '#0F3D2E', valueFont: '900 14px system-ui, -apple-system, Arial, sans-serif' },
    { label: 'Presentado por:', value: `${adminName} — Especialista Constructor Civil • Administrador de Condominios (Ley N° 21.442)`, valueColor: '#334155', valueFont: '14px system-ui, -apple-system, Arial, sans-serif' },
    { label: 'Fecha y Lugar:', value: `${dateFormatted} • ${proposalConfig.targetCity || empresaForm.city || 'La Serena, Región de Coquimbo'}`, valueColor: '#334155', valueFont: '14px system-ui, -apple-system, Arial, sans-serif' },
    { label: 'Materia:', value: 'Presentación de Metodología de Trabajo, Respaldo Técnico Constructivo y Custodia de Bienes Comunes', valueColor: '#334155', valueFont: '14px system-ui, -apple-system, Arial, sans-serif' }
  ]);

  ctx1.textAlign = 'center';
  ctx1.fillStyle = '#0F3D2E';
  ctx1.font = '900 16px system-ui, -apple-system, Arial, sans-serif';
  ctx1.fillText('DOSSIER INSTITUCIONAL DE GESTIÓN, CERCANÍA OPERATIVA & ESPECIALIDAD CONSTRUCTIVA', W / 2 + 7, curY1 + 8);
  ctx1.fillStyle = '#64748B';
  ctx1.font = 'bold 11px system-ui, -apple-system, Arial, sans-serif';
  ctx1.fillText('Presencia en Terreno • Seguimiento Financiero Transparente • Especialista Constructor Civil • Ley N° 21.442', W / 2 + 7, curY1 + 24);
  ctx1.textAlign = 'left';

  ctx1.fillStyle = '#D4B895';
  roundRect(ctx1, W / 2 - 42, curY1 + 30, 98, 3.5, 2);
  ctx1.fill();
  curY1 += 44;

  const dp0 = `Estimados ${recipient}:`;
  curY1 = drawRichParagraph(ctx1, dp0, f1.padL, curY1, f1.contentW, 19, boldFont, boldFont, '#0F172A', '#0F172A', false);
  curY1 += 6;

  const dp1 = `Junto con saludarles cordialmente, ponemos a su disposición este Dossier con el propósito de presentar la forma de trabajo de **ARANPRO • Gestión Integral**. Ofrecemos una administración cercana, metódica y profundamente orientada al cuidado de los bienes comunes y la armonía vecinal de **${condo}**. Nuestra propuesta integra seguimiento financiero riguroso, coordinación disciplinada del personal y proveedores, presencia periódica en terreno y herramientas digitales gratuitas para que el Comité conozca en todo momento el estado de la gestión y pueda **decidir con antecedentes claros, oportunos y verificables**.`;
  curY1 = drawRichParagraph(ctx1, dp1, f1.padL, curY1, f1.contentW, 19, baseFont, boldFont, '#1E293B', '#0F172A', true);
  curY1 += 7;

  const dp2 = `Como **Especialista Constructor Civil y Administrador de Condominios bajo la Ley N° 21.442**, cuento con formación complementaria certificada en **Inspección Técnica de Obras (ITO), Aseguramiento de Calidad (PAC), Control de Presupuestos, Gestión de Proyectos (Project Management), Contabilidad General (PUC) y Normativa SEC**. Aplico directamente estas competencias a la revisión técnica de alcances y cantidades (cubicaciones), al seguimiento programado de mantenciones preventivas y a la documentación rigurosa de observaciones en terreno, coordinando especialistas habilitados cada vez que la intervención lo requiere.`;
  curY1 = drawRichParagraph(ctx1, dp2, f1.padL, curY1, f1.contentW, 19, baseFont, boldFont, '#1E293B', '#0F172A', true);
  curY1 += 7;

  const dp3 = `Sabemos que cada comunidad tiene una identidad y prioridades distintas. Este documento presenta nuestra metodología y las capacidades técnicas y operativas que ponemos a su servicio; nuestra visita inicial nos permitirá conocer en terreno sus requerimientos y estructurar un plan de trabajo con frecuencias de atención, responsabilidades y entregables claramente definidos.`;
  curY1 = drawRichParagraph(ctx1, dp3, f1.padL, curY1, f1.contentW, 19, baseFont, boldFont, '#1E293B', '#0F172A', true);
  curY1 += 12;

  // 4 Pills de Especialidad
  const pills1 = [
    { cat: 'ESPECIALIDAD TITULAR', title: 'Especialista Constructor Civil' },
    { cat: 'MARCO NORMATIVO', title: 'Ley N° 21.442 & ITO' },
    { cat: 'GESTIÓN & RESPALDO', title: 'Financiero, Laboral y Terreno' },
    { cat: 'PLATAFORMA COMUNIDAD', title: 'Web & App 100% Gratuita' }
  ];
  const pillW = (f1.contentW - 30) / 4;
  pills1.forEach((pl, idx) => {
    const px = f1.padL + idx * (pillW + 10);
    roundRect(ctx1, px, curY1, pillW, 46, 8);
    ctx1.fillStyle = '#F8FAFC';
    ctx1.fill();
    ctx1.strokeStyle = '#E2E8F0';
    ctx1.lineWidth = 1;
    ctx1.stroke();

    ctx1.fillStyle = '#64748B';
    ctx1.font = 'bold 9.5px "Courier New", Courier, monospace';
    ctx1.textAlign = 'center';
    ctx1.fillText(pl.cat, px + pillW / 2, curY1 + 16);

    ctx1.fillStyle = '#0F3D2E';
    ctx1.font = '900 11.5px system-ui, -apple-system, Arial, sans-serif';
    ctx1.fillText(pl.title, px + pillW / 2, curY1 + 34);
    ctx1.textAlign = 'left';
  });
  curY1 += 58;

  // Recuadro: TRANSICIÓN ORDENADA & POLÍTICA DE HONORARIOS (PRIMEROS 3 MESES)
  const transBoxH = 158;
  roundRect(ctx1, f1.padL, curY1, f1.contentW, transBoxH, 12);
  ctx1.fillStyle = '#F5F4EF';
  ctx1.fill();
  ctx1.strokeStyle = '#D4B895';
  ctx1.lineWidth = 1.5;
  ctx1.stroke();

  // Badge y Título
  roundRect(ctx1, f1.padL + 14, curY1 + 10, 140, 20, 5);
  ctx1.fillStyle = '#0F3D2E';
  ctx1.fill();
  ctx1.fillStyle = '#D4B895';
  ctx1.font = 'bold 9.5px system-ui, -apple-system, Arial, sans-serif';
  ctx1.textAlign = 'center';
  ctx1.fillText('TRANSICIÓN ORDENADA', f1.padL + 84, curY1 + 24);
  ctx1.textAlign = 'left';

  ctx1.fillStyle = '#0F3D2E';
  ctx1.font = '900 12.5px system-ui, -apple-system, Arial, sans-serif';
  ctx1.fillText('POLÍTICA DE HONORARIOS & PERÍODO DE DIAGNÓSTICO (PRIMEROS 3 MESES)', f1.padL + 164, curY1 + 24);

  ctx1.fillStyle = '#166534';
  ctx1.font = 'bold 11px system-ui, -apple-system, Arial, sans-serif';
  ctx1.textAlign = 'right';
  ctx1.fillText('Sin Incremento Inicial en Gasto Común', f1.padL + f1.contentW - 16, curY1 + 24);
  ctx1.textAlign = 'left';

  // 3 Columnas de Transición
  const tCols = [
    { num: '1', title: 'Ajuste al Valor Actual', desc: 'Durante los primeros 3 meses, ARANPRO se ajusta al mismo valor de honorarios que la comunidad mantiene vigente, asegurando continuidad operativa sin alterar el presupuesto vecinal.', badge: 'Meses 1 al 3: Valor Actual Vigente' },
    { num: '2', title: 'Diagnóstico & Ordenamiento', desc: 'En este trimestre realizamos el levantamiento técnico en terreno, revisión de alcances con proveedores, conciliación financiera y puesta en marcha de los controles de mantenimiento.', badge: 'Levantamiento Técnico y Contable' },
    { num: '3', title: 'Acuerdo Definitivo al 3er Mes', desc: 'Con el diagnóstico real de la comunidad y las mejoras ya encaminadas, revisamos en conjunto con el Comité la propuesta definitiva de servicios, frecuencias y honorarios.', badge: 'Decisión con Antecedentes Claros' }
  ];
  const tcW = (f1.contentW - 40) / 3;
  tCols.forEach((tc, idx) => {
    const tcx = f1.padL + 14 + idx * (tcW + 6);
    const tcy = curY1 + 38;
    roundRect(ctx1, tcx, tcy, tcW, 108, 8);
    ctx1.fillStyle = '#FFFFFF';
    ctx1.fill();
    ctx1.strokeStyle = '#E2E8F0';
    ctx1.lineWidth = 1;
    ctx1.stroke();

    ctx1.fillStyle = '#0F3D2E';
    ctx1.font = '900 12px system-ui, -apple-system, Arial, sans-serif';
    ctx1.fillText(`${tc.num}  ${tc.title}`, tcx + 10, tcy + 20);

    drawRichParagraph(ctx1, tc.desc, tcx + 10, tcy + 34, tcW - 20, 14, '10.5px system-ui, -apple-system, Arial, sans-serif', 'bold 10.5px system-ui, -apple-system, Arial, sans-serif', '#475569', '#0F172A', false);

    ctx1.fillStyle = '#64748B';
    ctx1.font = 'bold 9.5px "Courier New", Courier, monospace';
    ctx1.textAlign = 'center';
    ctx1.fillText(tc.badge, tcx + tcW / 2, tcy + 98);
    ctx1.textAlign = 'left';
  });
  curY1 += transBoxH + 12;

  // Box Entregables Incluidos
  roundRect(ctx1, f1.padL, curY1, f1.contentW, 36, 8);
  ctx1.fillStyle = '#F0FDF4';
  ctx1.fill();
  ctx1.strokeStyle = '#86EFAC';
  ctx1.lineWidth = 1;
  ctx1.stroke();

  ctx1.fillStyle = '#0F3D2E';
  ctx1.font = 'bold 10.5px system-ui, -apple-system, Arial, sans-serif';
  ctx1.fillText('Entregables incluidos desde el primer día: Acceso gratuito a la plataforma Web & App Móvil para residentes y Comité,', f1.padL + 14, curY1 + 16);
  ctx1.fillText('presencia programada en terreno, seguimiento documentado de mantenciones y atención de contingencias.', f1.padL + 14, curY1 + 29);

  ctx1.fillStyle = '#166534';
  ctx1.font = 'bold 10.5px "Courier New", Courier, monospace';
  ctx1.textAlign = 'right';
  ctx1.fillText('Factura Exenta / Boleta de Honorarios Profesional', f1.padL + f1.contentW - 14, curY1 + 23);
  ctx1.textAlign = 'left';

  const p1Jpeg = canvas1.toDataURL('image/jpeg', 0.95);

  // -------------------- PÁGINA 2: METODOLOGÍA, INFRAESTRUCTURA & PLAN 30 DÍAS --------------------
  const canvas2 = document.createElement('canvas');
  canvas2.width = W;
  canvas2.height = H;
  const ctx2 = canvas2.getContext('2d');

  const f2 = drawCanonicalFrame({
    ctx: ctx2,
    W,
    H,
    logoImg,
    sealImg,
    sigImg,
    empresaForm,
    badgeText: 'METODOLOGÍA & TERRENO',
    docTypeTitle: 'Especialista Constructor Civil • Seguimiento Financiero, Operativo y Mantenciones',
    docSubTitle: '• Ley N° 21.442',
    footerCenterText: 'Página 2 de 4 • Metodología Técnica, Financiera y Plan de 30 Días • Ley N° 21.442'
  });

  let curY2 = f2.startY + 6;

  // 1 METODOLOGÍA DE TRABAJO
  ctx2.fillStyle = '#0F3D2E';
  ctx2.font = '900 14px system-ui, -apple-system, Arial, sans-serif';
  ctx2.fillText('1   METODOLOGÍA DE TRABAJO: ESPECIALIDAD CONSTRUCTIVA, ORDEN FINANCIERO Y PRESENCIA EN TERRENO', f2.padL, curY2);
  curY2 += 16;
  ctx2.fillStyle = '#64748B';
  ctx2.font = '11px system-ui, -apple-system, Arial, sans-serif';
  ctx2.fillText('Aplicación práctica de nuestras competencias técnicas y administrativas para respaldar la toma de decisiones del Comité', f2.padL, curY2);
  curY2 += 14;

  const specs2 = [
    { title: '✓ Revisión de Alcances, Cubicaciones y Control ITO', desc: 'Aplicación de criterios de Inspección Técnica de Obras (ITO) y Aseguramiento de Calidad (PAC) para definir alcances claros, verificar cantidades (cubicaciones) en cotizaciones y documentar recepciones conformes antes de cursar pagos.' },
    { title: '✓ Seguimiento de Mantenciones e Infraestructura', desc: 'Inspección programada de salas de bombas hidroneumáticas, cubiertas, evacuación de aguas lluvia, tableros eléctricos, grupos electrógenos y redes de gas/calderas (SEC), coordinando especialistas habilitados cuando la intervención lo requiere.' },
    { title: '✓ Seguimiento Financiero y Coordinación del Personal', desc: 'Conciliaciones bancarias mensuales al centavo, rendición clara de ingresos y egresos, control presupuestario del Fondo de Reserva y coordinación cercana del personal de conserjería y aseo (turnos, cumplimiento laboral y F30-1).' },
    { title: '✓ Documentación de Observaciones y Cercanía con el Comité', desc: 'Levantamiento fotográfico y reportes ejecutivos periódicos para que el Comité cuente siempre con antecedentes objetivos, comparativos de presupuestos y trazabilidad completa de cada requerimiento comunitario.' }
  ];

  const spW2 = (f2.contentW - 16) / 2;
  const spH2 = 98;
  specs2.forEach((sp, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const sx = f2.padL + col * (spW2 + 16);
    const sy = curY2 + row * (spH2 + 10);

    roundRect(ctx2, sx, sy, spW2, spH2, 10);
    ctx2.fillStyle = '#FFFFFF';
    ctx2.fill();
    ctx2.strokeStyle = '#CBD5E1';
    ctx2.lineWidth = 1.2;
    ctx2.stroke();

    ctx2.fillStyle = '#0F3D2E';
    ctx2.font = '900 12.5px system-ui, -apple-system, Arial, sans-serif';
    ctx2.fillText(sp.title, sx + 12, sy + 22);

    drawRichParagraph(ctx2, sp.desc, sx + 12, sy + 38, spW2 - 24, 15, '11px system-ui, -apple-system, Arial, sans-serif', 'bold 11px system-ui, -apple-system, Arial, sans-serif', '#475569', '#0F172A', false);
  });
  curY2 += spH2 * 2 + 24;

  // PLAN DE TRABAJO INICIAL (PRIMEROS 30 DÍAS)
  ctx2.fillStyle = '#0F3D2E';
  ctx2.font = '900 13.5px system-ui, -apple-system, Arial, sans-serif';
  ctx2.fillText('PLAN DE TRABAJO INICIAL & PUESTA EN MARCHA ORDENADA (PRIMEROS 30 DÍAS)', f2.padL, curY2);

  ctx2.fillStyle = '#166534';
  ctx2.font = 'bold 11px system-ui, -apple-system, Arial, sans-serif';
  ctx2.textAlign = 'right';
  ctx2.fillText('Metodología con Entregables Definidos', f2.padL + f2.contentW, curY2);
  ctx2.textAlign = 'left';
  curY2 += 14;

  const planTimeline = [
    { badge: 'DÍAS 1 - 10', title: 'Recepción Documentada, Conciliación Financiera y Revisión Legal', desc: 'Recepción ordenada de cuentas bancarias, libros contables y contratos vigentes. Revisión del Fondo de Reserva Legal (Art. 39° Ley N° 21.442), estado de cobranza de gastos comunes, vigencia de pólizas de seguro y coordinación de habilitaciones bancarias con el Comité.' },
    { badge: 'DÍAS 11 - 20', title: 'Inspección Técnica de Bienes Comunes y Coordinación de Equipos', desc: 'Recorrido técnico en terreno de salas de bombas, cubiertas, luminarias, accesos y equipamiento crítico para documentar observaciones y estado de mantenciones. Reunión de coordinación con el personal del condominio y verificación de carpetas laborales y previsionales.' },
    { badge: 'DÍAS 21 - 30', title: 'Habilitación de Herramientas Digitales y Entrega de Informe Inicial', desc: 'Puesta en marcha de la plataforma digital y App móvil para los residentes y el Comité, apertura del Libro Digital de Novedades y Solicitudes (Art. 20°) y presentación del Informe de Diagnóstico Inicial con prioridades técnicas, calendario preventivo y propuestas de mejora.' }
  ];

  const tlineH = 76;
  planTimeline.forEach((pt, idx) => {
    const py = curY2 + idx * (tlineH + 8);
    roundRect(ctx2, f2.padL, py, f2.contentW, tlineH, 8);
    ctx2.fillStyle = '#FFFFFF';
    ctx2.fill();
    ctx2.strokeStyle = '#E2E8F0';
    ctx2.lineWidth = 1;
    ctx2.stroke();

    // Badge DÍAS
    roundRect(ctx2, f2.padL + 12, py + 14, 88, 22, 5);
    ctx2.fillStyle = '#0F3D2E';
    ctx2.fill();
    ctx2.fillStyle = '#D4B895';
    ctx2.font = 'bold 10px "Courier New", Courier, monospace';
    ctx2.textAlign = 'center';
    ctx2.fillText(pt.badge, f2.padL + 56, py + 29);
    ctx2.textAlign = 'left';

    ctx2.fillStyle = '#0F3D2E';
    ctx2.font = '900 12px system-ui, -apple-system, Arial, sans-serif';
    ctx2.fillText(pt.title, f2.padL + 112, py + 24);

    drawRichParagraph(ctx2, pt.desc, f2.padL + 112, py + 38, f2.contentW - 124, 15, '10.5px system-ui, -apple-system, Arial, sans-serif', 'bold 10.5px system-ui, -apple-system, Arial, sans-serif', '#475569', '#0F172A', false);
  });
  curY2 += (tlineH + 8) * 3 + 12;

  // Box Compromiso de Cercanía
  const compH = 82;
  roundRect(ctx2, f2.padL, curY2, f2.contentW, compH, 10);
  ctx2.fillStyle = '#F8FAFC';
  ctx2.fill();
  ctx2.strokeStyle = '#CBD5E1';
  ctx2.lineWidth = 1;
  ctx2.stroke();

  ctx2.fillStyle = '#0F3D2E';
  ctx2.font = '900 12px system-ui, -apple-system, Arial, sans-serif';
  ctx2.fillText('Compromiso de Cercanía: Presencia en Terreno & Comunicación Directa', f2.padL + 14, curY2 + 20);

  const colW2 = (f2.contentW - 36) / 2;
  const c1Text = '**• Visitas Presenciales Programadas:** Presencia periódica en el condominio para supervisar labores del personal, verificar trabajos de proveedores y atender inquietudes en terreno.';
  const c2Text = '**• Canal Directo con el Comité y Emergencias:** Comunicación fluida para el seguimiento semanal de acuerdos y disponibilidad inmediata ante urgencias operativas de la comunidad.';

  drawRichParagraph(ctx2, c1Text, f2.padL + 14, curY2 + 36, colW2, 16, '11px system-ui, -apple-system, Arial, sans-serif', 'bold 11px system-ui, -apple-system, Arial, sans-serif', '#334155', '#0F172A', false);
  drawRichParagraph(ctx2, c2Text, f2.padL + 22 + colW2, curY2 + 36, colW2, 16, '11px system-ui, -apple-system, Arial, sans-serif', 'bold 11px system-ui, -apple-system, Arial, sans-serif', '#334155', '#0F172A', false);

  const p2Jpeg = canvas2.toDataURL('image/jpeg', 0.95);

  // -------------------- PÁGINA 3: ACREDITACIONES PROFESIONALES, MARCO LEGAL & REFERENCIAS --------------------
  const canvas3 = document.createElement('canvas');
  canvas3.width = W;
  canvas3.height = H;
  const ctx3 = canvas3.getContext('2d');

  const f3 = drawCanonicalFrame({
    ctx: ctx3,
    W,
    H,
    logoImg,
    sealImg,
    sigImg,
    empresaForm,
    badgeText: 'ACREDITACIÓN & REFERENCIAS',
    docTypeTitle: 'Especialidad Constructiva, Acreditaciones Profesionales y Referencias de Comités',
    docSubTitle: '• Ley N° 21.442',
    footerCenterText: 'Página 3 de 4 • Certificaciones Acreditadas, Carpeta de Anexos y Referencias • Ley N° 21.442'
  });

  let curY3 = f3.startY + 6;

  // 2 ESPECIALIDAD CONSTRUCTIVA & FORMACIÓN
  ctx3.fillStyle = '#0F3D2E';
  ctx3.font = '900 13.5px system-ui, -apple-system, Arial, sans-serif';
  ctx3.fillText('2   ESPECIALIDAD CONSTRUCTIVA, FORMACIÓN PROFESIONAL Y CAPACITACIONES CERTIFICADAS', f3.padL, curY3);
  curY3 += 16;
  ctx3.fillStyle = '#64748B';
  ctx3.font = '11px system-ui, -apple-system, Arial, sans-serif';
  ctx3.fillText(`Respaldos académicos y competencias técnicas del Administrador Titular (${adminName}) aplicadas directamente al condominio`, f3.padL, curY3);
  curY3 += 14;

  const creds6 = [
    { title: 'Constructor Civil • Especialista en Construcción Civil', badge: 'Titulado 2018', inst: 'Instituto Profesional / Santo Tomás', desc: 'Revisión técnica de alcances, partidas y cubicaciones, inspección en terreno de infraestructura común, seguimiento de mantenciones preventivas y coordinación de...', file: '01_Titulo_Profesional_Constructor_Civil_Santo_Tomas.pdf' },
    { title: 'Curso Oficial de Copropiedad Inmobiliaria (Ley N° 21.442)', badge: 'Aprobado y Certificado 2022', inst: 'Learning Group / OTEC Acreditada SENCE (Resolución MINVU)', desc: 'Habilitación oficial obligatoria para administración de copropiedades, cumplimiento normativo Ley N° 21.442, gestión de fondos de reserva, seguros de incendio y...', file: '08_CERTIFICADO ley 21442_JOHN_ARANCIBIA_M.pdf' },
    { title: 'Inspección Técnica de Obras (ITO) & Plan de Calidad PAC', badge: 'Certificado 2021', inst: 'Normativa MOP / ISO 9001 (Control de Calidad)', desc: 'Control de especificaciones técnicas, supervisión de alcances y partidas, recepción documentada de trabajos y seguimiento riguroso de mantenciones.', file: '02_Certificado_Inspeccion_Tecnica_de_Obras_ITO.pdf' },
    { title: 'Instalador de Gas Clase 3 Autorizado SEC', badge: 'Licencia Vigente', inst: 'Superintendencia de Electricidad y Combustibles (SEC)', desc: 'Revisión técnica de matrices de gas, centrales térmicas y calderas comunitarias, control de sellos verdes y coordinación de especialistas bajo D.S. N° 66.', file: '06_Certificado_SEC_Superintendencia_Electricidad_y_Combustibles...' },
    { title: 'Contabilidad General & Gestión Financiera de Condominios', badge: 'Certificado UC 2020', inst: 'TELEDUC • Pontificia Universidad Católica de Chile', desc: 'Seguimiento financiero ordenado, conciliaciones bancarias al centavo, balances de gastos comunes, control presupuestario y rendición mensual clara para el Comité.', file: '06_Certificado_Curso_Contabilidad_General.pdf' },
    { title: 'Gestión de Proyectos (Project Management) & Presupuestos', badge: 'Certificación Profesional 2021', inst: 'Google / Coursera & Instituto Profesional IPLACEX', desc: 'Planificación metódica de mejoras, evaluación comparativa de presupuestos, control de costos unitarios y programación anual de mantenciones.', file: '05_Certificado_Internacional_Project_Management_Google_Coursera...' }
  ];

  const crW = (f3.contentW - 16) / 2;
  const crH = 88;
  creds6.forEach((cr, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const cx = f3.padL + col * (crW + 16);
    const cy = curY3 + row * (crH + 8);

    roundRect(ctx3, cx, cy, crW, crH, 8);
    ctx3.fillStyle = '#FFFFFF';
    ctx3.fill();
    ctx3.strokeStyle = '#CBD5E1';
    ctx3.lineWidth = 1;
    ctx3.stroke();

    ctx3.fillStyle = '#0F3D2E';
    ctx3.font = '900 11.5px system-ui, -apple-system, Arial, sans-serif';
    ctx3.fillText(cr.title, cx + 10, cy + 18);

    ctx3.fillStyle = '#64748B';
    ctx3.font = 'bold 9.5px system-ui, -apple-system, Arial, sans-serif';
    ctx3.fillText(`Institución: ${cr.inst} • ${cr.badge}`, cx + 10, cy + 32);

    drawRichParagraph(ctx3, cr.desc, cx + 10, cy + 44, crW - 20, 13, '10px system-ui, -apple-system, Arial, sans-serif', 'bold 10px system-ui, -apple-system, Arial, sans-serif', '#475569', '#0F172A', false);

    ctx3.fillStyle = '#166534';
    ctx3.font = 'bold 9px "Courier New", Courier, monospace';
    ctx3.fillText(`✓ Respaldo Oficial: ${cr.file}`, cx + 10, cy + 78);
  });
  curY3 += (crH + 8) * 3 + 12;

  // CARPETA OFICIAL DE DOCUMENTOS LEGALES (ANEXOS 1 AL 6)
  ctx3.fillStyle = '#0F3D2E';
  ctx3.font = '900 11.5px system-ui, -apple-system, Arial, sans-serif';
  ctx3.fillText('CARPETA OFICIAL DE DOCUMENTOS LEGALES, NORMATIVOS Y DE ESPECIALIDAD:', f3.padL, curY3);
  curY3 += 12;

  const annexes = [
    { title: 'Anexo 1: Comprobante de Inscripción Registro Nacional de Ad...', sub: 'Ministerio de Vivienda y Urbanismo (Minvu) • Ley N° 21.442 • En Trámite', state: '✓ En trámite ★★★' },
    { title: 'Anexo 2: Certificado de Título Profesional — Especialista Constructor C...', sub: 'Instituto Profesional / Santo Tomás • Registro Profesional Oficial', state: '✓ Vigente' },
    { title: 'Anexo 3: Certificado Oficial Aprobación Curso Copropiedad Inmobiliaria', sub: 'Learning Group / SENCE • Resolución Acreditada MINVU', state: '✓ Vigente' },
    { title: 'Anexo 4: Licencia Instalador de Gas Clase 3 Autorizado SEC', sub: 'Superintendencia de Electricidad y Combustibles (SEC) • RUT 16.012.871-2', state: '✓ Vigente' },
    { title: 'Anexo 5: Certificado de Inspección Técnica de Obras (ITO) & Aseguram...', sub: 'Organismo Certificador de Obras • Normativa MOP / ISO 9001', state: '✓ Vigente' },
    { title: 'Anexo 6: Certificado de Antecedentes para Fines Especiales', sub: 'Servicio de Registro Civil e Identificación • Art. 84° Ley N° 21.442', state: '✓ Vigente' }
  ];

  const anW = (f3.contentW - 16) / 2;
  const anH = 34;
  annexes.forEach((an, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const ax = f3.padL + col * (anW + 16);
    const ay = curY3 + row * (anH + 6);

    roundRect(ctx3, ax, ay, anW, anH, 6);
    ctx3.fillStyle = '#F8FAFC';
    ctx3.fill();
    ctx3.strokeStyle = '#E2E8F0';
    ctx3.lineWidth = 1;
    ctx3.stroke();

    ctx3.fillStyle = '#0F3D2E';
    ctx3.font = '900 10.5px system-ui, -apple-system, Arial, sans-serif';
    ctx3.fillText(an.title, ax + 8, ay + 14);

    ctx3.fillStyle = '#64748B';
    ctx3.font = '9px system-ui, -apple-system, Arial, sans-serif';
    ctx3.fillText(an.sub, ax + 8, ay + 26);

    ctx3.fillStyle = '#166534';
    ctx3.font = 'bold 9.5px "Courier New", Courier, monospace';
    ctx3.textAlign = 'right';
    ctx3.fillText(an.state, ax + anW - 8, ay + 20);
    ctx3.textAlign = 'left';
  });
  curY3 += (anH + 6) * 3 + 12;

  // 3 REFERENCIAS COMPROBABLES DE COMITÉS DE ADMINISTRACIÓN
  ctx3.fillStyle = '#0F3D2E';
  ctx3.font = '900 13px system-ui, -apple-system, Arial, sans-serif';
  ctx3.fillText('3   REFERENCIAS COMPROBABLES DE COMITÉS DE ADMINISTRACIÓN', f3.padL, curY3);
  curY3 += 14;

  const refs2 = [
    { name: 'Carlos Morales Rojas', role: 'Presidente del Comité • Condominio Los Cerezos', fono: '+56 9 8877 6655', quote: '"Gestión muy cercana, ordenada y con gran dominio técnico en terreno. El seguimiento de las mantenciones de salas de bombas y la claridad en los informes nos permiten tomar decisiones con total tranquilidad."' },
    { name: 'Marcela Castillo Gómez', role: 'Tesorera del Comité • Condominio Los Cerezos', fono: '+56 9 7766 5544', quote: '"La plataforma digital ha traído una transparencia total. Cada factura y boleta del mes está visible en línea para los copropietarios."' }
  ];

  const refW2 = (f3.contentW - 16) / 2;
  const refH2 = 82;
  refs2.forEach((rf, idx) => {
    const rx = f3.padL + idx * (refW2 + 16);
    roundRect(ctx3, rx, curY3, refW2, refH2, 8);
    ctx3.fillStyle = '#FFFFFF';
    ctx3.fill();
    ctx3.strokeStyle = '#CBD5E1';
    ctx3.lineWidth = 1;
    ctx3.stroke();

    ctx3.fillStyle = '#0F3D2E';
    ctx3.font = '900 12px system-ui, -apple-system, Arial, sans-serif';
    ctx3.fillText(rf.name, rx + 10, curY3 + 18);

    ctx3.fillStyle = '#475569';
    ctx3.font = 'bold 10px system-ui, -apple-system, Arial, sans-serif';
    ctx3.fillText(rf.role, rx + 10, curY3 + 30);

    ctx3.fillStyle = '#166534';
    ctx3.font = 'bold 9.5px "Courier New", Courier, monospace';
    ctx3.fillText(`Fono Contacto: ${rf.fono}`, rx + 10, curY3 + 42);

    drawRichParagraph(ctx3, rf.quote, rx + 10, curY3 + 52, refW2 - 20, 13, 'italic 9.5px system-ui, -apple-system, Arial, sans-serif', 'bold italic 9.5px system-ui, -apple-system, Arial, sans-serif', '#475569', '#0F172A', false);
  });
  curY3 += refH2 + 10;

  // Banner Garantía Institucional
  roundRect(ctx3, f3.padL, curY3, f3.contentW, 36, 8);
  ctx3.fillStyle = '#F8FAFC';
  ctx3.fill();
  ctx3.strokeStyle = '#E2E8F0';
  ctx3.lineWidth = 1;
  ctx3.stroke();

  ctx3.fillStyle = '#0F3D2E';
  ctx3.font = 'bold 10px system-ui, -apple-system, Arial, sans-serif';
  ctx3.fillText('Garantía Institucional de Respaldo ARANPRO: Nuestra postulación se formaliza bajo contrato de prestación de servicios con entregables claramente', f3.padL + 12, curY3 + 15);
  ctx3.fillText('estipulados, rendición mensual de cuentas documentada y fiscalización contable continua, garantizando a la comunidad el fiel cumplimiento de la Ley N° 21.442.', f3.padL + 12, curY3 + 28);

  const p3Jpeg = canvas3.toDataURL('image/jpeg', 0.95);

  // -------------------- PÁGINA 4: SUITE DIGITAL ARANPRO & DEMOSTRACIÓN EN VIVO CON QR --------------------
  const canvas4 = document.createElement('canvas');
  canvas4.width = W;
  canvas4.height = H;
  const ctx4 = canvas4.getContext('2d');

  const f4 = drawCanonicalFrame({
    ctx: ctx4,
    W,
    H,
    logoImg,
    sealImg,
    sigImg,
    empresaForm,
    badgeText: 'SUITE DIGITAL & DEMO EN VIVO',
    docTypeTitle: 'Plataforma Digital Gratuita, Transparencia Contable 24/7 y Demo Interactiva',
    docSubTitle: '• Ley N° 21.442',
    footerCenterText: 'Página 4 de 4 • Ecosistema Tecnológico, Demo Interactiva y Firma Oficial'
  });

  let curY4 = f4.startY + 6;

  // PRESENTACIÓN OFICIAL INSTITUCIONAL DE LA SUITE DIGITAL ARANPRO
  const appBoxH = 148;
  roundRect(ctx4, f4.padL, curY4, f4.contentW, appBoxH, 12);
  ctx4.fillStyle = '#F5F4EF';
  ctx4.fill();
  ctx4.strokeStyle = '#0F3D2E';
  ctx4.lineWidth = 1.5;
  ctx4.stroke();

  ctx4.fillStyle = '#0F3D2E';
  ctx4.font = '900 12.5px system-ui, -apple-system, Arial, sans-serif';
  ctx4.fillText('★   PRESENTACIÓN OFICIAL: SUITE DIGITAL ARANPRO • ECOSISTEMA DE COPROPIEDAD Y TRANSPARENCIA', f4.padL + 14, curY4 + 20);

  ctx4.fillStyle = '#166534';
  ctx4.font = 'bold 11px system-ui, -apple-system, Arial, sans-serif';
  ctx4.textAlign = 'right';
  ctx4.fillText('✓ 100% Incluida Sin Costo', f4.padL + f4.contentW - 14, curY4 + 20);
  ctx4.textAlign = 'left';

  const tAp1 = `La **Suite Digital ARANPRO** no es una suscripción arrendada a terceros ni una planilla genérica de cálculo; es un **sistema integral de gestión, contabilidad y fiscalización inmobiliaria de desarrollo propio**, concebido y programado específicamente bajo la arquitectura técnica y legal de la **Nueva Ley de Copropiedad Inmobiliaria N° 21.442 y su Reglamento (Decreto N° 58)**. Su diseño responde al compromiso de erradicar de raíz la opacidad en las cuentas de los condominios, dotando a la comunidad de un estándar institucional de trazabilidad que garantiza que cada peso recaudado cuente con su correspondiente respaldo bancario y tributario visible en tiempo real.`;
  drawRichParagraph(ctx4, tAp1, f4.padL + 14, curY4 + 32, f4.contentW - 28, 14, '10px system-ui, -apple-system, Arial, sans-serif', 'bold 10px system-ui, -apple-system, Arial, sans-serif', '#334155', '#0F172A', true);

  const tAp2 = `A diferencia del modelo tradicional del mercado —donde las administraciones contratan plataformas externas (como ComunidadFeliz, Kastor o Edipro) y traspasan mensualmente ese sobrecosto al gasto común de los vecinos—, **ARANPRO entrega su suite digital 100% incluida, sin costo de licencias ni cobros por vivienda**. Esto se traduce en un **ahorro financiero directo y comprobado de $600.000 a $1.500.000 anuales** para la comunidad, garantizando a la vez soporte técnico personalizado del Administrador, soberanía sobre los datos y custodia permanente del Libro de Copropietarios (Art. 17°).`;
  drawRichParagraph(ctx4, tAp2, f4.padL + 14, curY4 + 72, f4.contentW - 28, 14, '10px system-ui, -apple-system, Arial, sans-serif', 'bold 10px system-ui, -apple-system, Arial, sans-serif', '#334155', '#0F172A', true);

  // 3 Mini cards
  const miniW = (f4.contentW - 40) / 3;
  const minis = [
    { title: '🏛️ Libros Abiertos 24/7', desc: 'Cada factura fiscal, boleta de honorarios y cartola bancaria está digitalizada y accesible en línea para auditoría inmediata del Comité.' },
    { title: '📱 Autonomía PWA en Celular', desc: 'Plataforma web progresiva multi-dispositivo (iOS, Android, PC): sin descargas en tiendas, con emisión de certificados y respaldo de pagos.' },
    { title: '💰 Cero Costo de Licencias', desc: 'Ahorro comprobado de $50.000 a $120.000 mensuales en software que no se le cobran a la comunidad ni a los copropietarios.' }
  ];
  minis.forEach((mn, idx) => {
    const mx = f4.padL + 14 + idx * (miniW + 6);
    roundRect(ctx4, mx, curY4 + 112, miniW, 28, 5);
    ctx4.fillStyle = '#FFFFFF';
    ctx4.fill();
    ctx4.strokeStyle = '#E2E8F0';
    ctx4.stroke();

    ctx4.fillStyle = '#0F3D2E';
    ctx4.font = '900 10px system-ui, -apple-system, Arial, sans-serif';
    ctx4.fillText(mn.title, mx + 6, curY4 + 124);

    ctx4.fillStyle = '#64748B';
    ctx4.font = '8px system-ui, -apple-system, Arial, sans-serif';
    ctx4.fillText(mn.desc.slice(0, 52) + '...', mx + 6, curY4 + 135);
  });
  curY4 += appBoxH + 12;

  // 6 MÓDULOS TECNOLÓGICOS EN GRILLA 2x3
  const modules4 = [
    { title: '📜 Certificados Oficiales en Línea (Ley 21.442)', desc: 'Emisión y descarga inmediata de Certificados de Gastos Comunes al Día (No Deuda) para compraventas y estudios de títulos (Arts. 20° y 36°), Certificados de Residencia y Vigencia de Copropietario. Con folio único correlativo, timbre institucional, código QR y firma digital válida para notarías y bancos.' },
    { title: '💳 Notificación & Validación de Pagos con Respaldo', desc: 'El residente informa su transferencia bancaria adjuntando directamente la captura o comprobante PDF desde su celular. La administración concilia contra la cartola bancaria y emite en el acto el Recibo Oficial Foliado con timbre digital, listo para descargar o compartir por WhatsApp.' },
    { title: '📑 Colilla Digital, Prorrateo & Compartir WhatsApp', desc: 'Desglose automatizado según alícuota de copropiedad: gasto operacional, Fondo de Reserva obligatorio (Art. 39°), cargos individuales de consumos y control de Convenios de Repactación histórica. Incluye botón directo para compartir la colilla a WhatsApp con los datos de cuenta bancaria.' },
    { title: '🛡️ Panel de Auditoría 24/7 para el Comité', desc: 'Auditoría abierta y permanente de cartolas bancarias, visualización directa de la factura electrónica o boleta de cada egreso, aprobación ágil de transferencias a proveedores y seguimiento en terreno de mantenciones preventivas con registro fotográfico.' },
    { title: '📊 Rendición Mensual Oficial e Informe Contable', desc: 'Generación instantánea del Informe Oficial de Rendición de Gastos Comunes según el Art. 20° de la Ley N° 21.442: clasificación legal de egresos ordinarios/extraordinarios, nómina detallada de proveedores con RUT y folio fiscal, libro diario contable y balance financiero de caja.' },
    { title: '🗳️ Asambleas Híbridas, Voto y Libro de Reclamos', desc: 'Participación telemática legal (Art. 15°) con emisión de votos verificados desde el móvil, quórums automatizados y Libro Digital de Reclamos y Sugerencias inalterable (Art. 20°), con trazabilidad correlativa de fechas y plazos de respuesta obligatorios.' }
  ];

  const mH4 = 78;
  const mW4 = (f4.contentW - 16) / 2;
  modules4.forEach((mod, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const mx = f4.padL + col * (mW4 + 16);
    const my = curY4 + row * (mH4 + 8);

    roundRect(ctx4, mx, my, mW4, mH4, 8);
    ctx4.fillStyle = '#FFFFFF';
    ctx4.fill();
    ctx4.strokeStyle = '#CBD5E1';
    ctx4.lineWidth = 1;
    ctx4.stroke();

    ctx4.fillStyle = '#0F3D2E';
    ctx4.font = '900 11.5px system-ui, -apple-system, Arial, sans-serif';
    ctx4.fillText(mod.title, mx + 10, my + 18);

    drawRichParagraph(ctx4, mod.desc, mx + 10, my + 30, mW4 - 20, 13, '9.5px system-ui, -apple-system, Arial, sans-serif', 'bold 9.5px system-ui, -apple-system, Arial, sans-serif', '#475569', '#0F172A', false);
  });
  curY4 += (mH4 + 8) * 3 + 10;

  // DEMO INTERACTIVA CON CÓDIGO QR
  const demoBoxH = 110;
  roundRect(ctx4, f4.padL, curY4, f4.contentW, demoBoxH, 10);
  ctx4.fillStyle = '#F5F4EF';
  ctx4.fill();
  ctx4.strokeStyle = '#0F3D2E';
  ctx4.lineWidth = 1.5;
  ctx4.stroke();

  const qrSize4 = 82;
  const qrX4 = f4.padL + f4.contentW - qrSize4 - 18;
  const qrY4 = curY4 + 14;

  roundRect(ctx4, qrX4 - 4, qrY4 - 4, qrSize4 + 8, qrSize4 + 8, 8);
  ctx4.fillStyle = '#FFFFFF';
  ctx4.fill();
  ctx4.strokeStyle = '#CBD5E1';
  ctx4.stroke();

  // Esquinas QR
  const drawQrBox = (qx, qy) => {
    ctx4.fillStyle = '#0F3D2E';
    ctx4.fillRect(qx, qy, 22, 22);
    ctx4.fillStyle = '#FFFFFF';
    ctx4.fillRect(qx + 4, qy + 4, 14, 14);
    ctx4.fillStyle = '#0F3D2E';
    ctx4.fillRect(qx + 7, qy + 7, 8, 8);
  };
  drawQrBox(qrX4 + 5, qrY4 + 5);
  drawQrBox(qrX4 + qrSize4 - 27, qrY4 + 5);
  drawQrBox(qrX4 + 5, qrY4 + qrSize4 - 27);

  ctx4.fillStyle = '#0F3D2E';
  const qrDots4 = [
    [36, 8], [46, 8], [56, 16], [36, 24], [46, 32], [36, 42], [48, 42], [58, 42],
    [12, 40], [22, 40], [36, 52], [48, 52], [60, 52], [70, 40], [70, 50],
    [36, 64], [46, 72], [56, 64], [68, 68], [40, 76], [56, 76]
  ];
  for (const [dx, dy] of qrDots4) {
    ctx4.fillRect(qrX4 + dx, qrY4 + dy, 6, 6);
  }

  ctx4.fillStyle = '#0F3D2E';
  ctx4.font = 'bold 8px "Courier New", Courier, monospace';
  ctx4.textAlign = 'center';
  ctx4.fillText('ESCANEAR CON CELULAR', qrX4 + qrSize4 / 2, qrY4 + qrSize4 + 10);
  ctx4.textAlign = 'left';

  // Texto explicativo a la izquierda del QR
  const textDemoW = qrX4 - f4.padL - 24;
  ctx4.fillStyle = '#0F3D2E';
  ctx4.font = '900 12px system-ui, -apple-system, Arial, sans-serif';
  ctx4.fillText('★ DEMO INTERACTIVA EN VIVO — Acceso directo: aranpro.cl/?demo=comunidad', f4.padL + 14, curY4 + 18);

  ctx4.fillStyle = '#0F3D2E';
  ctx4.font = 'bold 11px system-ui, -apple-system, Arial, sans-serif';
  ctx4.fillText('Pruebe la aplicación en su teléfono celular ahora mismo (Acceso 1-Clic)', f4.padL + 14, curY4 + 32);

  const demoExpl = `Escanee el código QR con la cámara de su smartphone para evaluar las dos vistas principales de forma interactiva y sin claves:`;
  drawRichParagraph(ctx4, demoExpl, f4.padL + 14, curY4 + 44, textDemoW, 14, '10px system-ui, -apple-system, Arial, sans-serif', 'bold 10px system-ui, -apple-system, Arial, sans-serif', '#334155', '#0F172A', false);

  const demoViews = [
    '• **🛡️ Vista Integrante del Comité (Casa 1):** Audite facturas de egresos, revise la cartola bancaria y publique comunicados oficiales.',
    '• **🏠 Vista Copropietario (Casa 6):** Consulte su colilla digital, emita certificados oficiales en PDF e informe transferencias con comprobante.'
  ];
  let dvy = curY4 + 68;
  demoViews.forEach(dv => {
    dvy = drawRichParagraph(ctx4, dv, f4.padL + 14, dvy, textDemoW, 14, '10px system-ui, -apple-system, Arial, sans-serif', 'bold 10px system-ui, -apple-system, Arial, sans-serif', '#1E293B', '#0F172A', false);
    dvy += 2;
  });

  const p4Jpeg = canvas4.toDataURL('image/jpeg', 0.95);

  // Retornar las 4 páginas completas empaquetadas en un único binario PDF estándar
  return {
    filename: `ARANPRO_Dossier_Integral_${targetClean}_${dateClean}.pdf`,
    contentBase64: pagesJpegToPdfBase64([p1Jpeg, p2Jpeg, p3Jpeg, p4Jpeg], W, H)
  };
};
