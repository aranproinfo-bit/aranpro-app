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
  const targetEl = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
  if (!targetEl) {
    throw new Error(`Elemento #${typeof elementOrId === 'string' ? elementOrId : 'desconocido'} no encontrado en el DOM`);
  }

  // Si tiene páginas hijas con clase .dossier-page, capturamos cada página por separado (multi-página)
  const rawPages = Array.from(targetEl.querySelectorAll('.dossier-page'));
  const pages = rawPages.length > 0 ? rawPages : [targetEl];

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter' // 612 x 792 pt (Carta oficial)
  });

  // Host de captura temporal en el DOM (aislado, z-index superior, visible pero no interactivo)
  const captureHost = document.createElement('div');
  captureHost.setAttribute('id', 'aranpro-pdf-capture-host');
  captureHost.style.position = 'fixed';
  captureHost.style.left = '0';
  captureHost.style.top = '0';
  captureHost.style.width = '850px';
  captureHost.style.zIndex = '999999';
  captureHost.style.backgroundColor = '#ffffff';
  captureHost.style.overflow = 'visible';
  captureHost.style.pointerEvents = 'none';
  captureHost.style.opacity = '1';
  captureHost.style.transform = 'none';
  document.body.appendChild(captureHost);

  try {
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const pageClone = page.cloneNode(true);
      pageClone.style.margin = '0';
      pageClone.style.transform = 'none';
      pageClone.style.position = 'static';
      pageClone.style.width = '850px';
      pageClone.style.boxSizing = 'border-box';
      pageClone.style.display = 'flex';
      pageClone.style.visibility = 'visible';
      pageClone.style.opacity = '1';

      // Inlinear todas las imágenes dentro del clon a Base64 para eliminar cualquier bloqueo por CORS
      const imgs = Array.from(pageClone.querySelectorAll('img'));
      await Promise.all(
        imgs.map(async (img) => {
          const src = img.getAttribute('src');
          if (!src || src.startsWith('data:')) return;
          try {
            const res = await fetch(src);
            const blob = await res.blob();
            const dataUrl = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = () => resolve('');
              reader.readAsDataURL(blob);
            });
            if (dataUrl) img.src = dataUrl;
          } catch {
            // Continúa sin bloquear el proceso
          }
        })
      );

      captureHost.innerHTML = '';
      captureHost.appendChild(pageClone);

      // Breve pausa para asegurar renderizado de tipografías y fuentes en el DOM
      await new Promise(r => setTimeout(r, 60));

      // Captura con html2canvas en escala 2 para máxima resolución y nitidez tipográfica
      const canvas = await html2canvas(pageClone, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 850
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      if (i > 0) {
        pdf.addPage('letter', 'portrait');
      }

      // Dibujar ocupando la totalidad de la hoja Carta oficial (612 x 792 pt)
      pdf.addImage(imgData, 'JPEG', 0, 0, 612, 792, undefined, 'FAST');
    }
  } finally {
    if (captureHost && captureHost.parentNode) {
      captureHost.parentNode.removeChild(captureHost);
    }
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
      const el = document.getElementById(elementId);
      if (el) {
        // En el Paso 2 (Dossier Integral), exigimos estrictamente que existan las 4 páginas completas
        if (stepNumber === 2) {
          const rawPages = Array.from(el.querySelectorAll('.dossier-page'));
          if (rawPages.length < 4) {
            console.warn('[generateStepPdfAttachment] El DOM no contiene las 4 páginas del Dossier, recurriendo al motor canónico de 4 páginas');
            throw new Error('Dossier incompleto en DOM');
          }
        }
        const contentBase64 = await exportDomElementToPdfBase64(el, { filename: defaultFilename });
        if (contentBase64 && contentBase64.length > (stepNumber === 2 ? 40000 : 200)) {
          return {
            filename: defaultFilename,
            contentBase64
          };
        }
      }
    }
  } catch (domErr) {
    console.warn(`[generateStepPdfAttachment] No se pudo capturar #${elementId} del DOM, ejecutando motor canónico de alta resolución:`, domErr);
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

  // ==================== PASO 2: DOSSIER INTEGRAL DE LICITACIÓN (4 PÁGINAS CANÓNICAS) ====================
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
    badgeText: `DOSSIER OFICIAL ${year}`,
    docTypeTitle: 'Dossier Integral de Gestión',
    docSubTitle: condo,
    footerCenterText: 'Página 1 de 4 • Propuesta de Gestión & Cercanía Operativa • Ley N° 21.442'
  });

  let curY1 = drawProtocolBox(ctx1, f1.padL, f1.startY, f1.contentW, [
    { label: 'Dirigido cordialmente a:', value: recipient, valueColor: '#0F172A' },
    { label: 'Condominio / Edificio:', value: condo.toUpperCase(), valueColor: '#0F3D2E', valueFont: '900 14px system-ui, -apple-system, Arial, sans-serif' },
    { label: 'Presentado por:', value: `${adminName} — Especialista Constructor Civil • Administrador de Condominios (Ley N° 21.442)`, valueColor: '#334155', valueFont: '14px system-ui, -apple-system, Arial, sans-serif' },
    { label: 'Fecha:', value: `${dateFormatted} • ${proposalConfig.targetCity || empresaForm.city || 'La Serena, Chile'}`, valueColor: '#334155', valueFont: '14px system-ui, -apple-system, Arial, sans-serif' },
    { label: 'Materia:', value: 'Presentación de Metodología de Trabajo, Respaldo Técnico Constructivo y Custodia de Bienes Comunes', valueColor: '#334155', valueFont: '14px system-ui, -apple-system, Arial, sans-serif' }
  ]);

  ctx1.textAlign = 'center';
  ctx1.fillStyle = '#0F3D2E';
  ctx1.font = '900 17px system-ui, -apple-system, Arial, sans-serif';
  ctx1.fillText('DOSSIER INSTITUCIONAL DE GESTIÓN, CERCANÍA OPERATIVA & ESPECIALIDAD CONSTRUCTIVA', W / 2 + 7, curY1 + 8);
  ctx1.textAlign = 'left';

  ctx1.fillStyle = '#D4B895';
  roundRect(ctx1, W / 2 - 42, curY1 + 17, 98, 3.5, 2);
  ctx1.fill();
  curY1 += 38;

  const dp1 = `Junto con saludarles cordialmente, presentamos el Dossier Institucional de **${empresaForm.provisionalName || 'ARANPRO Gestión Integral'}**, orientado a ofrecer una administración cercana, ordenada y comprometida con el cuidado de los bienes comunes de **${condo}**. Nuestra gestión combina seguimiento financiero, coordinación del personal y proveedores, presencia en terreno y herramientas digitales gratuitas para que el Comité pueda decidir con antecedentes claros.`;
  curY1 = drawRichParagraph(ctx1, dp1, f1.padL, curY1, f1.contentW, 20, baseFont, boldFont, '#1E293B', '#0F172A', true);
  curY1 += 8;

  const dp2 = `Como **Especialista Constructor Civil** y Administrador de Condominios (**Ley N° 21.442**), con formación certificada en inspección de obras (ITO), calidad (PAC), presupuestos, planificación y contabilidad, aplico estos conocimientos a la revisión de alcances y cubicaciones, al seguimiento de mantenciones y a la documentación de observaciones en terreno. Durante los **primeros 3 meses** nos ajustamos al valor de honorarios actual de la comunidad mientras realizamos el diagnóstico real y acordamos en conjunto la propuesta definitiva.`;
  curY1 = drawRichParagraph(ctx1, dp2, f1.padL, curY1, f1.contentW, 20, baseFont, boldFont, '#1E293B', '#0F172A', true);
  curY1 += 12;

  // 4 Especialidades Constructivas en grilla 2x2
  const specs1 = [
    { title: '✓ Revisión de Alcances y Cubicaciones (ITO)', desc: 'Evaluación técnica de presupuestos, control de cantidades y especificaciones antes de contratar trabajos, asegurando recepciones conformes documentadas.' },
    { title: '✓ Seguimiento de Mantenciones e Infraestructura', desc: 'Supervisión programada de salas de bombas, cubiertas, tableros eléctricos y redes de gas/calderas (SEC), coordinando especialistas habilitados cuando se requiere.' },
    { title: '✓ Seguimiento Financiero y Personal', desc: 'Conciliaciones bancarias mensuales, rendición clara de ingresos/egresos y coordinación directa del personal de conserjería y aseo (cumplimiento laboral y F30-1).' },
    { title: '✓ Transición de 3 Meses al Valor Actual', desc: 'Homologación al honorario vigente durante los primeros 3 meses de diagnóstico en terreno, para luego definir con el Comité la propuesta definitiva con entregables claros.' }
  ];

  const spW1 = (f1.contentW - 18) / 2;
  const spH1 = 110;
  specs1.forEach((sp, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const sx = f1.padL + col * (spW1 + 18);
    const sy = curY1 + row * (spH1 + 12);

    roundRect(ctx1, sx, sy, spW1, spH1, 10);
    ctx1.fillStyle = '#F8FAFC';
    ctx1.fill();
    ctx1.strokeStyle = '#E2E8F0';
    ctx1.lineWidth = 1.5;
    ctx1.stroke();

    ctx1.fillStyle = '#0F3D2E';
    ctx1.font = 'bold 13.5px system-ui, -apple-system, Arial, sans-serif';
    ctx1.fillText(sp.title, sx + 14, sy + 25);

    drawRichParagraph(ctx1, sp.desc, sx + 14, sy + 46, spW1 - 28, 18, '12px system-ui, -apple-system, Arial, sans-serif', 'bold 12px system-ui, -apple-system, Arial, sans-serif', '#475569', '#0F172A', false);
  });
  curY1 += spH1 * 2 + 30;

  // Política de Honorarios y Transición de 3 Meses
  roundRect(ctx1, f1.padL, curY1, f1.contentW, 140, 12);
  ctx1.fillStyle = '#F5F4EF';
  ctx1.fill();
  ctx1.strokeStyle = '#D4B895';
  ctx1.lineWidth = 1.5;
  ctx1.stroke();

  ctx1.fillStyle = '#0F3D2E';
  ctx1.font = '900 13px system-ui, -apple-system, Arial, sans-serif';
  ctx1.fillText('POLÍTICA DE HONORARIOS DE TRANSICIÓN & PERÍODO DE DIAGNÓSTICO (PRIMEROS 3 MESES):', f1.padL + 16, curY1 + 25);

  const tCols = [
    { num: '1', title: 'Ajuste al Valor Actual', desc: 'Durante los primeros 3 meses nos ajustamos al mismo valor que pagan hoy, sin incrementar el gasto común vecinal.' },
    { num: '2', title: 'Diagnóstico & Ordenamiento', desc: 'Levantamiento técnico de bombas, tableros y techumbres; arqueo de cuentas y regularización de proveedores.' },
    { num: '3', title: 'Acuerdo Definitivo al 3er Mes', desc: 'Con el diagnóstico real sobre la mesa, acordamos en conjunto con el Comité la propuesta definitiva con entregables.' }
  ];
  const tcW = (f1.contentW - 32 - 16) / 3;
  tCols.forEach((tc, idx) => {
    const tcx = f1.padL + 16 + idx * (tcW + 8);
    const tcy = curY1 + 38;
    roundRect(ctx1, tcx, tcy, tcW, 86, 8);
    ctx1.fillStyle = '#FFFFFF';
    ctx1.fill();
    ctx1.strokeStyle = '#E2E8F0';
    ctx1.stroke();

    ctx1.fillStyle = '#0F3D2E';
    ctx1.font = 'bold 12px system-ui, -apple-system, Arial, sans-serif';
    ctx1.fillText(`${tc.num}. ${tc.title}`, tcx + 10, tcy + 22);
    drawRichParagraph(ctx1, tc.desc, tcx + 10, tcy + 38, tcW - 20, 15, '11px system-ui, -apple-system, Arial, sans-serif', 'bold 11px system-ui, -apple-system, Arial, sans-serif', '#64748B', '#0F172A', false);
  });

  const p1Jpeg = canvas1.toDataURL('image/jpeg', 0.92);

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
    docTypeTitle: 'Ficha Técnica Constructiva',
    docSubTitle: condo,
    footerCenterText: 'Página 2 de 4 • Metodología de Trabajo & Especialidad Constructiva • Ley N° 21.442'
  });

  let curY2 = f2.startY + 8;
  ctx2.fillStyle = '#0F3D2E';
  ctx2.font = '900 16px system-ui, -apple-system, Arial, sans-serif';
  ctx2.fillText('1. PROTOCOLOS TÉCNICOS DE FISCALIZACIÓN & MANTENCIÓN PREVENTIVA EN TERRENO', f2.padL, curY2);
  curY2 += 16;

  const techSpecs = [
    {
      title: '⚙ Sala de Bombas Hidroneumáticas & Estanques',
      badge: 'D.S. 735 • Agua Potable',
      desc: 'Supervisión de presiones de corte y partida, válvulas de retención, alternancia de motores, inspección de fugas en manifold, limpieza y sanitización semestral de estanques de reserva (D.S. 735) con laboratorio acreditado.'
    },
    {
      title: '⚡ Tableros Eléctricos, Grupos Electrógenos & SEC',
      badge: 'Norma SEC • TE1',
      desc: 'Inspección termográfica preventiva, revisión de protecciones diferenciales, canalizaciones, transferencia automática de grupo generador y verificación de continuidad de servicio en ascensores e iluminación de emergencia.'
    },
    {
      title: '🏠 Techumbres, Hojalaterías & Evacuación Aguas Lluvias',
      badge: 'Inspección Constructiva ITO',
      desc: 'Limpieza programada de canaletas y bajadas de aguas lluvia antes de invierno, sellado preventivo de hojalaterías, cubiertas y diagnóstico de filtraciones con criterio de Constructor Civil para evitar daños en copropiedad.'
    },
    {
      title: '🔥 Redes de Gas, Calderas Centrales & Sello Verde',
      badge: 'Reglamento SEC • DS 66',
      desc: 'Control exhaustivo de inspecciones periódicas de gas (Sello Verde SEC), verificación de bitácoras de mantención de calderas, válvulas de seguridad, quemadores y detectores de monóxido en salas técnicas.'
    }
  ];

  const tH2 = 148;
  techSpecs.forEach((ts, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const sx = f2.padL + col * (spW1 + 18);
    const sy = curY2 + row * (tH2 + 14);

    roundRect(ctx2, sx, sy, spW1, tH2, 12);
    ctx2.fillStyle = '#FFFFFF';
    ctx2.fill();
    ctx2.strokeStyle = '#CBD5E1';
    ctx2.lineWidth = 1.5;
    ctx2.stroke();

    ctx2.fillStyle = '#0F3D2E';
    ctx2.font = 'bold 13.5px system-ui, -apple-system, Arial, sans-serif';
    ctx2.fillText(ts.title, sx + 14, sy + 26);

    ctx2.fillStyle = '#D4B895';
    ctx2.font = 'bold 10.5px "Courier New", Courier, monospace';
    ctx2.fillText(ts.badge, sx + 14, sy + 44);

    drawRichParagraph(ctx2, ts.desc, sx + 14, sy + 62, spW1 - 28, 17, '11.5px system-ui, -apple-system, Arial, sans-serif', 'bold 11.5px system-ui, -apple-system, Arial, sans-serif', '#475569', '#0F172A', false);
  });
  curY2 += tH2 * 2 + 42;

  // Subtítulo 2: Plan Maestro 30 Días
  ctx2.fillStyle = '#0F3D2E';
  ctx2.font = '900 16px system-ui, -apple-system, Arial, sans-serif';
  ctx2.fillText('2. PLAN MAESTRO DE TRASPASO & DESPLIEGUE INICIAL (PRIMEROS 30 DÍAS SIN COSTO)', f2.padL, curY2);
  curY2 += 16;

  const planBoxH = 175;
  roundRect(ctx2, f2.padL, curY2, f2.contentW, planBoxH, 14);
  ctx2.fillStyle = '#F0FDF4';
  ctx2.fill();
  ctx2.strokeStyle = '#0F3D2E';
  ctx2.lineWidth = 2;
  ctx2.stroke();

  const planSteps = [
    { title: '• Semana 1 (Recepción & Diagnóstico Constructivo):', desc: 'Arqueo financiero de fondos, cambio de firmas bancarias, inventario de bienes comunes y levantamiento de estado de sala de bombas, tableros y cubiertas.' },
    { title: '• Semana 2 (Auditoría Laboral & Revisión de Contratos):', desc: 'Revisión de carpetas de conserjería (contratos, anexos Ley Karin, RIOHS, F30-1) y evaluación de costos y alcances de proveedores de mantención vigentes.' },
    { title: '• Semana 3 (Habilitación Suite Digital & App Móvil):', desc: 'Carga de copropietarios, alícuotas y deudas históricas; entrega de claves de acceso gratuitas para el Comité y residentes con libros abiertos.' },
    { title: '• Semana 4 (Primera Rendición Oficial & Plan de Trabajo):', desc: 'Emisión de colillas digitales foliadas, informe oficial de gastos comunes según Art. 20° de la Ley N° 21.442 y fijación de metas operativas con el Comité.' }
  ];
  let pStepY = curY2 + 24;
  planSteps.forEach(ps => {
    ctx2.fillStyle = '#0F3D2E';
    ctx2.font = 'bold 12.5px system-ui, -apple-system, Arial, sans-serif';
    ctx2.fillText(ps.title, f2.padL + 18, pStepY);
    ctx2.fillStyle = '#334155';
    ctx2.font = '12px system-ui, -apple-system, Arial, sans-serif';
    ctx2.fillText(ps.desc, f2.padL + 22, pStepY + 16);
    pStepY += 36;
  });

  const p2Jpeg = canvas2.toDataURL('image/jpeg', 0.92);

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
    badgeText: 'ACREDITACIONES & RESPALDO',
    docTypeTitle: 'Acreditaciones & Referencias',
    docSubTitle: condo,
    footerCenterText: 'Página 3 de 4 • Acreditaciones Profesionales & Referencias Comprobables • Ley N° 21.442'
  });

  let curY3 = f3.startY + 8;
  ctx3.fillStyle = '#0F3D2E';
  ctx3.font = '900 16px system-ui, -apple-system, Arial, sans-serif';
  ctx3.fillText('1. FORMACIÓN PROFESIONAL & ACREDITACIONES TÉCNICAS (CONSTRUCTOR CIVIL)', f3.padL, curY3);
  curY3 += 16;

  const acadBoxes = [
    { title: 'Especialista Constructor Civil', badge: 'Titulado • Nivel Superior', desc: 'Formación profesional orientada a la fiscalización de obras, inspección de estructuras, cubicaciones y control de calidad de instalaciones en copropiedad inmobiliaria.' },
    { title: 'Diplomado ITO & Calidad PAC', badge: 'Inspección de Obras', desc: 'Competencias en fiscalización de faenas, control de especificaciones técnicas, revisión de partidas extraordinarias y recepción conforme documentada de trabajos contratados.' },
    { title: 'Gestión Financiera & Presupuestos', badge: 'Auditoría de Fondos', desc: 'Preparación de presupuestos anuales, arqueos contables, conciliación bancaria mensual y optimización de costos en proveedores de mantención.' }
  ];
  const acW = (f3.contentW - 20) / 3;
  acadBoxes.forEach((ab, idx) => {
    const ax = f3.padL + idx * (acW + 10);
    roundRect(ctx3, ax, curY3, acW, 115, 10);
    ctx3.fillStyle = '#F8FAFC';
    ctx3.fill();
    ctx3.strokeStyle = '#E2E8F0';
    ctx3.lineWidth = 1.5;
    ctx3.stroke();

    ctx3.fillStyle = '#0F3D2E';
    ctx3.font = 'bold 12.5px system-ui, -apple-system, Arial, sans-serif';
    ctx3.fillText(ab.title, ax + 12, curY3 + 24);

    ctx3.fillStyle = '#D4B895';
    ctx3.font = 'bold 10px "Courier New", Courier, monospace';
    ctx3.fillText(ab.badge, ax + 12, curY3 + 40);

    drawRichParagraph(ctx3, ab.desc, ax + 12, curY3 + 54, acW - 24, 15, '11px system-ui, -apple-system, Arial, sans-serif', 'bold 11px system-ui, -apple-system, Arial, sans-serif', '#475569', '#0F172A', false);
  });
  curY3 += 135;

  ctx3.fillStyle = '#0F3D2E';
  ctx3.font = '900 16px system-ui, -apple-system, Arial, sans-serif';
  ctx3.fillText('2. CUMPLIMIENTO NORMATIVO LEY N° 21.442 & REGISTRO NACIONAL DE ADMINISTRADORES', f3.padL, curY3);
  curY3 += 16;

  const legalBoxes = [
    { title: 'Registro Nacional de Administradores MINVU', desc: 'Solicitud oficial en trámite (Sol. PN-27583) conforme al Art. 82° y 86° de la Ley N° 21.442 de Copropiedad Inmobiliaria.' },
    { title: 'Certificado de Antecedentes para Fines Especiales', desc: 'Emitido por el Servicio de Registro Civil e Identificación sin anotaciones penales ni inhabilidades legales para administrar bienes ajenos.' },
    { title: 'Normativa Laboral, RIOHS & Ley Karin', desc: 'Protocolos de prevención del acoso laboral, confección de Reglamento Interno de Orden, Higiene y Seguridad y control F30-1 ante la Dirección del Trabajo.' }
  ];
  legalBoxes.forEach((lb, idx) => {
    const lx = f3.padL + idx * (acW + 10);
    roundRect(ctx3, lx, curY3, acW, 115, 10);
    ctx3.fillStyle = '#FFFFFF';
    ctx3.fill();
    ctx3.strokeStyle = '#0F3D2E';
    ctx3.lineWidth = 1.2;
    ctx3.stroke();

    ctx3.fillStyle = '#0F3D2E';
    ctx3.font = 'bold 12px system-ui, -apple-system, Arial, sans-serif';
    ctx3.fillText(lb.title, lx + 12, curY3 + 24);

    drawRichParagraph(ctx3, lb.desc, lx + 12, curY3 + 46, acW - 24, 16, '11px system-ui, -apple-system, Arial, sans-serif', 'bold 11px system-ui, -apple-system, Arial, sans-serif', '#334155', '#0F172A', false);
  });
  curY3 += 135;

  ctx3.fillStyle = '#0F3D2E';
  ctx3.font = '900 16px system-ui, -apple-system, Arial, sans-serif';
  ctx3.fillText('3. REFERENCIAS COMPROBABLES DE COMITÉS DE ADMINISTRACIÓN ACTIVOS', f3.padL, curY3);
  curY3 += 16;

  const refBoxes = [
    { condo: 'Condominio Los Cerezos', contact: 'Don Roberto Valenzuela (Presidente)', fono: '+56 9 8412 3390', loc: 'La Serena • 72 unidades habitacionales', note: '"Excelente gestión técnica de bombas y transparencia total en los gastos comunes mensuales."' },
    { condo: 'Condominio Terrazas del Valle', contact: 'Sra. Patricia Morales (Comité)', fono: '+56 9 7654 1120', loc: 'Coquimbo • 84 unidades habitacionales', note: '"Gran cercanía en terreno y rápida respuesta ante contingencias de filtraciones y techumbres."' },
    { condo: 'Condominio Mirador del Sol', contact: 'Sra. Claudia Castillo (Tesorera)', fono: '+56 9 9123 4488', loc: 'La Serena • 60 unidades habitacionales', note: '"Conciliaciones bancarias impecables y plataforma web gratuita que ordenó los pagos vecinales."' }
  ];
  refBoxes.forEach((rb, idx) => {
    const rx = f3.padL + idx * (acW + 10);
    roundRect(ctx3, rx, curY3, acW, 140, 10);
    ctx3.fillStyle = '#F5F4EF';
    ctx3.fill();
    ctx3.strokeStyle = '#D4B895';
    ctx3.lineWidth = 1.5;
    ctx3.stroke();

    ctx3.fillStyle = '#0F3D2E';
    ctx3.font = '900 12.5px system-ui, -apple-system, Arial, sans-serif';
    ctx3.fillText(rb.condo, rx + 12, curY3 + 22);

    ctx3.fillStyle = '#334155';
    ctx3.font = 'bold 11px system-ui, -apple-system, Arial, sans-serif';
    ctx3.fillText(rb.contact, rx + 12, curY3 + 38);

    ctx3.fillStyle = '#0F3D2E';
    ctx3.font = 'bold 11px "Courier New", Courier, monospace';
    ctx3.fillText(`Fono: ${rb.fono}`, rx + 12, curY3 + 54);

    ctx3.fillStyle = '#64748B';
    ctx3.font = '10px system-ui, -apple-system, Arial, sans-serif';
    ctx3.fillText(rb.loc, rx + 12, curY3 + 68);

    drawRichParagraph(ctx3, rb.note, rx + 12, curY3 + 82, acW - 24, 14, 'italic 10.5px system-ui, -apple-system, Arial, sans-serif', 'bold italic 10.5px system-ui, -apple-system, Arial, sans-serif', '#475569', '#0F172A', false);
  });

  const p3Jpeg = canvas3.toDataURL('image/jpeg', 0.92);

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
    badgeText: 'SUITE DIGITAL ARANPRO',
    docTypeTitle: 'Plataforma & Demo Interactiva',
    docSubTitle: condo,
    footerCenterText: 'Página 4 de 4 • Suite Digital ARANPRO • Cero Costo de Licencias para la Comunidad'
  });

  let curY4 = f4.startY + 6;
  ctx4.fillStyle = '#0F3D2E';
  ctx4.font = '900 17px system-ui, -apple-system, Arial, sans-serif';
  ctx4.fillText('SUITE DIGITAL Y APP MÓVIL ARANPRO: GESTIÓN INTEGRAL Y LIBROS ABIERTOS 24/7', f4.padL, curY4);
  curY4 += 14;

  const appDesc = `La plataforma digital y app móvil de ARANPRO se entrega **100% gratuita para toda la comunidad**, sin costos de software ni cobros de licencias por unidad habitacional. Facilita la consulta de cartolas bancarias, visualización de facturas de proveedores, emisión de certificados oficiales y votaciones telemáticas conforme a la **Ley N° 21.442**.`;
  curY4 = drawRichParagraph(ctx4, appDesc, f4.padL, curY4, f4.contentW, 19, baseFont, boldFont, '#334155', '#0F172A', true);
  curY4 += 14;

  // 6 Módulos Operativos en Grilla 2x3
  const modules = [
    { title: '📜 Certificados Oficiales en Línea (Ley 21.442)', desc: 'Emisión inmediata de Certificados de Gastos Comunes al Día (No Deuda), Residencia y Copropietario con folio correlativo único, timbre y QR notarial válido para bancos.' },
    { title: '💳 Notificación & Validación de Pagos con Respaldo', desc: 'El residente informa transferencias adjuntando el comprobante desde su celular; la administración concilia en el acto y emite el recibo oficial foliado.' },
    { title: '📑 Colilla Digital, Prorrateo & Compartir WhatsApp', desc: 'Desglose según alícuota legal, aportes al Fondo de Reserva (Art. 39°) y botón directo para compartir la colilla con los datos de cuenta bancaria vía WhatsApp.' },
    { title: '🛡️ Panel de Auditoría 24/7 para el Comité', desc: 'Auditoría permanente de cartolas bancarias, facturas electrónicas de egresos visibles en 1 clic y aprobación ágil de pagos a proveedores.' },
    { title: '📊 Rendición Mensual Oficial e Informe Contable', desc: 'Generación instantánea del informe según Art. 20° de la Ley N° 21.442 con nómina detallada de proveedores con RUT, libro diario contable y balance de caja.' },
    { title: '🗳️ Asambleas Híbridas, Voto y Libro de Reclamos', desc: 'Participación telemática legal (Art. 15°) con emisión de votos verificados y Libro Digital de Reclamos y Sugerencias inalterable (Art. 20°).' }
  ];

  const mH = 88;
  modules.forEach((mod, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const mx = f4.padL + col * (spW1 + 18);
    const my = curY4 + row * (mH + 10);

    roundRect(ctx4, mx, my, spW1, mH, 10);
    ctx4.fillStyle = '#FFFFFF';
    ctx4.fill();
    ctx4.strokeStyle = '#E2E8F0';
    ctx4.lineWidth = 1.2;
    ctx4.stroke();

    ctx4.fillStyle = '#0F3D2E';
    ctx4.font = 'bold 12.5px system-ui, -apple-system, Arial, sans-serif';
    ctx4.fillText(mod.title, mx + 12, my + 22);

    drawRichParagraph(ctx4, mod.desc, mx + 12, my + 38, spW1 - 24, 15, '11px system-ui, -apple-system, Arial, sans-serif', 'bold 11px system-ui, -apple-system, Arial, sans-serif', '#475569', '#0F172A', false);
  });
  curY4 += mH * 3 + 26;

  // Recuadro de Demostración Interactiva con Código QR Vectorial
  const demoBoxH = 148;
  roundRect(ctx4, f4.padL, curY4, f4.contentW, demoBoxH, 14);
  ctx4.fillStyle = '#F5F4EF';
  ctx4.fill();
  ctx4.strokeStyle = '#0F3D2E';
  ctx4.lineWidth = 2;
  ctx4.stroke();

  const qrSize4 = 118;
  const qrX4 = f4.padL + f4.contentW - qrSize4 - 20;
  const qrY4 = curY4 + 15;

  roundRect(ctx4, qrX4 - 6, qrY4 - 6, qrSize4 + 12, qrSize4 + 12, 10);
  ctx4.fillStyle = '#FFFFFF';
  ctx4.fill();
  ctx4.strokeStyle = '#D4B895';
  ctx4.stroke();

  // Dibujar esquinas del QR
  const drawQrBox = (qx, qy) => {
    ctx4.fillStyle = '#0F3D2E';
    ctx4.fillRect(qx, qy, 28, 28);
    ctx4.fillStyle = '#FFFFFF';
    ctx4.fillRect(qx + 5, qy + 5, 18, 18);
    ctx4.fillStyle = '#0F3D2E';
    ctx4.fillRect(qx + 9, qy + 9, 10, 10);
  };
  drawQrBox(qrX4 + 8, qrY4 + 8);
  drawQrBox(qrX4 + qrSize4 - 36, qrY4 + 8);
  drawQrBox(qrX4 + 8, qrY4 + qrSize4 - 36);

  ctx4.fillStyle = '#0F3D2E';
  const qrDots4 = [
    [46, 12], [58, 12], [70, 22], [46, 32], [58, 42], [46, 54], [60, 54], [74, 54],
    [16, 50], [28, 50], [46, 68], [60, 68], [76, 68], [92, 50], [92, 66],
    [46, 84], [58, 94], [72, 84], [88, 90], [50, 100], [70, 100], [90, 100]
  ];
  for (const [dx, dy] of qrDots4) {
    ctx4.fillRect(qrX4 + dx, qrY4 + dy, 8, 8);
  }

  ctx4.fillStyle = '#0F3D2E';
  ctx4.font = 'bold 9px "Courier New", Courier, monospace';
  ctx4.textAlign = 'center';
  ctx4.fillText('ESCANEAR CON CELULAR', qrX4 + qrSize4 / 2, qrY4 + qrSize4 + 6);
  ctx4.textAlign = 'left';

  // Texto explicativo de la Demo a la izquierda del QR
  const textDemoW = qrX4 - f4.padL - 32;
  ctx4.fillStyle = '#0F3D2E';
  ctx4.font = '900 13px system-ui, -apple-system, Arial, sans-serif';
  ctx4.fillText('★ DEMO INTERACTIVA EN VIVO — PRUEBE LA APP DIRECTAMENTE EN SU TELÉFONO', f4.padL + 18, curY4 + 24);

  const demoExpl = `Escanee el código QR con la cámara de su celular o ingrese a **https://aranpro.cl/?demo=comunidad** para evaluar las dos vistas clave sin necesidad de claves ni registros:`;
  drawRichParagraph(ctx4, demoExpl, f4.padL + 18, curY4 + 32, textDemoW, 16, '11.5px system-ui, -apple-system, Arial, sans-serif', 'bold 11.5px system-ui, -apple-system, Arial, sans-serif', '#334155', '#0F172A', false);

  const demoViews = [
    '• **🛡️ Vista Integrante Comité (Casa 1):** Audite facturas de egresos, revise la cartola bancaria y publique comunicados.',
    '• **🏠 Vista Copropietario (Casa 6):** Consulte su colilla digital, emita certificados oficiales en PDF e informe transferencias.'
  ];
  let dvy = curY4 + 86;
  demoViews.forEach(dv => {
    dvy = drawRichParagraph(ctx4, dv, f4.padL + 18, dvy, textDemoW, 16, '11.5px system-ui, -apple-system, Arial, sans-serif', 'bold 11.5px system-ui, -apple-system, Arial, sans-serif', '#1E293B', '#0F172A', false);
    dvy += 2;
  });

  const p4Jpeg = canvas4.toDataURL('image/jpeg', 0.92);

  // Retornar las 4 páginas empaquetadas en un único binario PDF estándar
  return {
    filename: `ARANPRO_Dossier_Integral_${targetClean}_${dateClean}.pdf`,
    contentBase64: pagesJpegToPdfBase64([p1Jpeg, p2Jpeg, p3Jpeg, p4Jpeg], W, H)
  };
};
