/**
 * Generador Canónico de PDF A4 para Postulaciones ARANPRO
 * Renderiza el documento oficial completo en alta resolución (A4, doble filete verde/dorado,
 * logo ARANPRO en cabecera, contenido estructurado, timbre circular dorado y firma manuscrita)
 * y lo empaqueta en un archivo binario PDF 1.4 estándar listo para adjuntar vía Resend.
 */

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
 * Empaqueta una imagen JPEG (DataURL) en un binario PDF-1.4 A4 estándar (595.28 x 841.89 pt)
 * y devuelve el string Base64 puro para adjuntar por correo.
 */
const jpegDataUrlToPdfBase64 = (jpegDataUrl, pixelWidth, pixelHeight) => {
  const base64Data = jpegDataUrl.split(',')[1];
  const binaryStr = atob(base64Data);
  const jpegBytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    jpegBytes[i] = binaryStr.charCodeAt(i);
  }

  const encoder = new TextEncoder();
  const chunks = [];
  let offset = 0;
  const offsets = [0]; // índice 0 libre

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

  // Obj 2: Pages
  startObj(2);
  pushStr(`<< /Type /Pages /Kids [3 0 R] /Count 1 >>`);
  endObj();

  // Obj 3: Page (A4: 595.28 x 841.89 pt)
  startObj(3);
  pushStr(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);
  endObj();

  // Obj 4: Image XObject (JPEG DCTDecode)
  startObj(4);
  pushStr(`<< /Type /XObject /Subtype /Image /Width ${pixelWidth} /Height ${pixelHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`);
  pushBytes(jpegBytes);
  pushStr(`\nendstream`);
  endObj();

  // Obj 5: Content Stream (dibuja la página A4 completa)
  const contentStream = `q 595.28 0 0 841.89 0 0 cm /Im0 Do Q\n`;
  const contentBytes = encoder.encode(contentStream);
  startObj(5);
  pushStr(`<< /Length ${contentBytes.length} >>\nstream\n`);
  pushBytes(contentBytes);
  pushStr(`endstream`);
  endObj();

  // Tabla XREF
  const xrefOffset = offset;
  pushStr(`xref\n0 6\n0000000000 65535 f \n`);
  for (let i = 1; i <= 5; i++) {
    const padded = String(offsets[i]).padStart(10, '0');
    pushStr(`${padded} 00000 n \n`);
  }

  // Trailer
  pushStr(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  // Unir todos los bloques y convertir a Base64
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
 * Envuelve texto en múltiples líneas según un ancho máximo en Canvas
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
 * Genera el PDF A4 oficial correspondiente al paso comercial (1, 2, 3 o 4)
 */
export const generateStepPdfAttachment = async ({
  stepNumber = 1,
  proposalConfig = {},
  empresaForm = {},
  signatureImage = ''
}) => {
  const W = 1240;
  const H = 1754;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // 1. Fondo Blanco A4
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, H);

  // 2. Doble Filete Canónico ARANPRO (Verde Bosque #0F3D2E + Dorado #D4B895)
  ctx.strokeStyle = '#0F3D2E';
  ctx.lineWidth = 4;
  ctx.strokeRect(36, 36, W - 72, H - 72);

  ctx.strokeStyle = '#D4B895';
  ctx.lineWidth = 2;
  ctx.strokeRect(46, 46, W - 92, H - 92);

  // Cargar imágenes de marca y firma
  const [logoImg, sealImg, sigImg] = await Promise.all([
    loadImage('/brand/ARANPRO_logo_principal_transparente_trimmed.png'),
    loadImage('/brand/ARANPRO_sello_circular_integral_transparente.png'),
    loadImage(signatureImage || empresaForm.signatureDataUrl)
  ]);

  const condo = proposalConfig.targetCondo?.trim() || 'Comunidad';
  const city = proposalConfig.targetCity?.trim() || 'La Serena';
  const recipient = proposalConfig.targetRecipient?.trim() || 'Señores Miembros del Comité de Administración';
  const adminName = empresaForm.adminName || 'John Andrés Arancibia Maureira';
  const adminRut = (empresaForm.adminRut && empresaForm.adminRut !== '14.882.140-K') ? empresaForm.adminRut : '16.012.871-2';
  const phone = empresaForm.phone || '+56 9 5811 8504';
  const email = 'contacto@aranpro.cl';
  const dateStr = new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' });

  // Marca de agua central sutil con el sello
  if (sealImg) {
    ctx.save();
    ctx.globalAlpha = 0.04;
    ctx.drawImage(sealImg, W / 2 - 220, H / 2 - 220, 440, 440);
    ctx.restore();
  }

  // 3. Cabecera Oficial con Logo ARANPRO a la izquierda y Folio a la derecha
  const padX = 82;
  let curY = 78;

  if (logoImg) {
    const logoH = 96;
    const logoW = (logoImg.width / logoImg.height) * logoH;
    ctx.drawImage(logoImg, padX, curY, logoW, logoH);
  } else {
    ctx.fillStyle = '#0F3D2E';
    ctx.font = 'bold 34px Arial, sans-serif';
    ctx.fillText('ARANPRO', padX, curY + 42);
    ctx.fillStyle = '#D4B895';
    ctx.font = 'bold 14px Arial, sans-serif';
    ctx.fillText('GESTIÓN INTEGRAL DE CONDOMINIOS', padX, curY + 66);
  }

  // Subtítulo junto al logo
  ctx.fillStyle = '#0F3D2E';
  ctx.font = 'bold 15px Arial, sans-serif';
  ctx.fillText('ADMINISTRACIÓN PROFESIONAL DE CONDOMINIOS Y COMUNIDADES', padX + 185, curY + 36);
  ctx.fillStyle = '#475569';
  ctx.font = 'bold 13px Arial, sans-serif';
  ctx.fillText(`${adminName} • Constructor Civil • Ley N° 21.442`, padX + 185, curY + 58);
  ctx.fillStyle = '#64748b';
  ctx.font = '12px Arial, sans-serif';
  ctx.fillText(`Registro Nacional MINVU: En trámite (Sol. PN-27583) • ${city}, Chile`, padX + 185, curY + 78);

  // Recuadro derecho de Folio y Fecha
  const boxW = 250;
  const boxX = W - padX - boxW;
  roundRect(ctx, boxX, curY + 6, boxW, 82, 10);
  ctx.fillStyle = '#F8FAFC';
  ctx.fill();
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const stepBadges = {
    1: 'CARTA DE PRESENTACIÓN',
    2: 'DOSSIER EJECUTIVO LEY 21.442',
    3: 'PROPUESTA TÉCNICA Y ECONÓMICA',
    4: 'BROCHURE SUITE DIGITAL & QR'
  };

  ctx.fillStyle = '#0F3D2E';
  ctx.font = 'bold 12px Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(stepBadges[stepNumber] || 'DOCUMENTO OFICIAL', boxX + boxW - 14, curY + 30);
  ctx.fillStyle = '#334155';
  ctx.font = '12px Arial, sans-serif';
  ctx.fillText(`${city}, ${dateStr}`, boxX + boxW - 14, curY + 50);
  ctx.fillStyle = '#0F3D2E';
  ctx.font = 'bold 12px Arial, sans-serif';
  ctx.fillText(`Ref.: ${condo}`, boxX + boxW - 14, curY + 70);
  ctx.textAlign = 'left';

  curY += 112;

  // Línea divisoria doble bajo cabecera
  ctx.strokeStyle = '#0F3D2E';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(padX, curY);
  ctx.lineTo(W - padX, curY);
  ctx.stroke();

  ctx.strokeStyle = '#D4B895';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(padX, curY + 5);
  ctx.lineTo(W - padX, curY + 5);
  ctx.stroke();

  curY += 26;

  // 4. Banner de Destinatario y Título del Documento
  roundRect(ctx, padX, curY, W - padX * 2, 104, 14);
  ctx.fillStyle = '#0F3D2E';
  ctx.fill();

  const stepTitles = {
    1: `PRESENTACIÓN DE SERVICIOS DE ADMINISTRACIÓN Y VISITA TÉCNICA GRATUITA`,
    2: `DOSSIER DE ACREDITACIÓN PROFESIONAL Y CUMPLIMIENTO LEY N° 21.442`,
    3: `PROPUESTA FORMAL DE ADMINISTRACIÓN Y HONORARIOS PARA ${condo.toUpperCase()}`,
    4: `SUITE DIGITAL ARANPRO: PLATAFORMA WEB Y APP MÓVIL SIN COSTO PARA ${condo.toUpperCase()}`
  };

  ctx.fillStyle = '#D4B895';
  ctx.font = 'bold 13px Arial, sans-serif';
  ctx.fillText(`DIRIGIDO A: ${recipient.toUpperCase()} • COMUNIDAD ${condo.toUpperCase()}`, padX + 24, curY + 34);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 19px Arial, sans-serif';
  const titleLines = wrapTextLines(ctx, stepTitles[stepNumber] || stepTitles[1], W - padX * 2 - 48);
  titleLines.slice(0, 2).forEach((line, idx) => {
    ctx.fillText(line, padX + 24, curY + 66 + idx * 24);
  });

  curY += 130;

  // 5. Cuerpo Principal según el Paso Comercial
  const contentWidth = W - padX * 2;

  const paragraphsByStep = {
    1: [
      `Estimadas y estimados integrantes del Comité de Administración de ${condo}:`,
      `Junto con saludarles cordialmente y reconociendo la importante labor y responsabilidad que ejercen en representación de su comunidad, me dirijo a ustedes para presentar formalmente los servicios de ARANPRO Gestión Integral y poner a su disposición nuestra administración profesional para ${condo}.`,
      `Como Constructor Civil y Administrador de Condominios (Ley N° 21.442, Solicitud RNAC MINVU PN-27583 en trámite), combino la rigurosidad técnica en terreno —inspección de salas de bombas, tableros eléctricos, cubiertas, ascensores, citofonía y control preventivo de contratistas— con una gestión financiera y laboral 100% transparente y auditable.`,
      `Sabemos que cada condominio tiene una realidad operativa propia. Por ello, antes de entregar una cotización estándar, les ofrezco realizar una Visita Técnica Diagnóstica en Terreno 100% Gratuita y sin compromiso para recorrer las instalaciones junto al Comité, escuchar sus prioridades y presentar una propuesta a la medida exacta de ${condo}.`
    ],
    2: [
      `Estimado Comité de Administración de ${condo}:`,
      `Hago entrega del Resumen Ejecutivo de Acreditación Profesional de ARANPRO Gestión Integral para nuestra reunión técnica en terreno. Nuestro modelo de trabajo asegura el cumplimiento estricto de la Ley N° 21.442 de Copropiedad Inmobiliaria, legislación laboral vigente (Ley Karin, jornada 40 horas) y normativas sanitarias y de seguridad.`,
      `Contamos con respaldo académico de Constructor Civil, Certificado de Antecedentes para Fines Especiales intachable, Curso Oficial de Administración de Copropiedades aprobado y tramitación oficial en el Registro Nacional de Administradores de Condominios MINVU (Solicitud PN-27583).`
    ],
    3: [
      `Estimado Comité de Administración de ${condo}:`,
      `Tras evaluar los antecedentes operativos de su comunidad (${proposalConfig.targetUnits || 60} unidades en ${city}), presentamos nuestra Propuesta Formal de Administración Integral bajo estándar gremial AGACECH y Ley N° 21.442.`,
      `Honorario Mensual Propuesto: $${Number(proposalConfig.proposedMonthlyFee || 850000).toLocaleString('es-CL')} CLP (${proposalConfig.feeTaxMode === 'neto' ? 'Impuesto incluido / Factura Exenta' : 'Bruto con retención legal'}). Incluye ${proposalConfig.weeklyVisits || '2 visitas semanales programadas'} de supervisión técnica en terreno, atención de emergencias 24/7 (SLA ${proposalConfig.emergencySla || '< 2 horas'}) y acceso ilimitado sin costo a la Suite Digital ARANPRO.`
    ],
    4: [
      `Estimado Comité de Administración de ${condo}:`,
      `Junto con nuestra gestión presencial en terreno como Constructor Civil, ${condo} contará desde el primer día con la Suite Digital ARANPRO 100% Gratuita para la comunidad (ahorro directo de $65.000 a $120.000 mensuales en licencias de software).`,
      `Cada copropietario y miembro del Comité tendrá acceso desde su celular o computador a colillas de gasto común, comprobantes de egreso escaneados, libro de novedades de conserjería, control de mantenciones preventivas, votaciones en línea y estado bancario conciliado en tiempo real.`
    ]
  };

  const paragraphs = paragraphsByStep[stepNumber] || paragraphsByStep[1];
  ctx.fillStyle = '#1E293B';
  ctx.font = '15.5px Arial, sans-serif';

  for (let i = 0; i < paragraphs.length; i++) {
    const isFirst = i === 0;
    ctx.font = isFirst ? 'bold 16px Arial, sans-serif' : '15.5px Arial, sans-serif';
    ctx.fillStyle = isFirst ? '#0F3D2E' : '#1E293B';
    const lines = wrapTextLines(ctx, paragraphs[i], contentWidth);
    for (const line of lines) {
      ctx.fillText(line, padX, curY);
      curY += 24;
    }
    curY += 12;
  }

  curY += 6;

  // 6. Tres Pilares de Valor ARANPRO (Cajas Destacadas)
  ctx.fillStyle = '#0F3D2E';
  ctx.font = 'bold 15px Arial, sans-serif';
  ctx.fillText(`PILARES OPERATIVOS Y DIFERENCIADORES PARA ${condo.toUpperCase()}:`, padX, curY);
  curY += 16;

  const pillars = [
    {
      badge: '01 • INGENIERÍA Y TERRENO',
      title: 'Supervisión como Constructor Civil',
      desc: 'Inspección directa de bombas, tableros, techumbres, filtraciones y cubicación real de reparaciones para evitar sobrecostos de contratistas.'
    },
    {
      badge: '02 • TRANSPARENCIA LEY 21.442',
      title: 'Rendición Financiera 100% Auditable',
      desc: 'Conciliación bancaria mensual al centavo, cada gasto respaldado con su factura/boleta digitalizada y cumplimiento laboral (F30-1 y Ley Karin).'
    },
    {
      badge: '03 • TECNOLOGÍA COSTO $0',
      title: 'Suite Web & App Móvil Gratuita',
      desc: 'Plataforma propia incluida sin costo adicional para el condominio: colillas digitales, muro oficial, reclamos con trazabilidad y portal del Comité.'
    }
  ];

  const colW = (contentWidth - 28) / 3;
  const cardH = 195;

  pillars.forEach((p, idx) => {
    const cx = padX + idx * (colW + 14);
    roundRect(ctx, cx, curY, colW, cardH, 12);
    ctx.fillStyle = '#F8FAFC';
    ctx.fill();
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Franja superior verde/dorada en cada tarjeta
    roundRect(ctx, cx, curY, colW, 34, 12);
    ctx.fillStyle = '#0F3D2E';
    ctx.fill();

    ctx.fillStyle = '#D4B895';
    ctx.font = 'bold 11.5px Arial, sans-serif';
    ctx.fillText(p.badge, cx + 14, curY + 22);

    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 14.5px Arial, sans-serif';
    ctx.fillText(p.title, cx + 14, curY + 60);

    ctx.fillStyle = '#334155';
    ctx.font = '13px Arial, sans-serif';
    const descLines = wrapTextLines(ctx, p.desc, colW - 28);
    descLines.slice(0, 5).forEach((l, lIdx) => {
      ctx.fillText(l, cx + 14, curY + 86 + lIdx * 20);
    });
  });

  curY += cardH + 24;

  // 7. Recuadro de Compromiso / Paso Siguiente + Resumen de Acreditación
  const summaryH = 190;
  roundRect(ctx, padX, curY, contentWidth, summaryH, 14);
  ctx.fillStyle = '#F0FDF4';
  ctx.fill();
  ctx.strokeStyle = '#16A34A';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#0F3D2E';
  ctx.font = 'bold 15px Arial, sans-serif';
  ctx.fillText('RESPALDO LEGAL, TÉCNICO Y CANALES DIRECTOS DE COORDINACIÓN:', padX + 22, curY + 32);

  const checkItems = [
    `✓ Profesional a Cargo: ${adminName} • RUT ${adminRut} • Constructor Civil`,
    `✓ Registro Nacional de Administradores MINVU: En trámite oficial (Solicitud PN-27583) • Ley N° 21.442`,
    `✓ Curso Oficial de Administración de Copropiedades Aprobado y Certificado de Antecedentes Intachable`,
    `✓ Incluye Visita Técnica Inicial en Terreno 100% Gratuita y Demostración en Vivo de la Suite Digital ARANPRO`,
    `✓ Contacto Directo Comité: WhatsApp / Teléfono ${phone} • Correo Oficial: ${email} • Web: https://aranpro.cl`
  ];

  ctx.fillStyle = '#14532D';
  ctx.font = 'bold 13.5px Arial, sans-serif';
  checkItems.forEach((item, idx) => {
    ctx.fillText(item, padX + 22, curY + 64 + idx * 25);
  });

  // 8. Pie de Firma y Timbre Oficial Circular Dorado (Anclado en la parte inferior de la hoja A4)
  const footerTopY = H - 255;

  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(padX, footerTopY);
  ctx.lineTo(W - padX, footerTopY);
  ctx.stroke();

  // Izquierda: Sello Circular Dorado Oficial + Leyenda
  const sealSize = 118;
  const sealY = footerTopY + 22;
  if (sealImg) {
    ctx.drawImage(sealImg, padX, sealY, sealSize, sealSize);
  }

  const sealTextX = padX + sealSize + 18;
  ctx.fillStyle = '#0F3D2E';
  ctx.font = 'bold 14px Arial, sans-serif';
  ctx.fillText('SELLO OFICIAL DE ADMINISTRACIÓN', sealTextX, sealY + 34);
  ctx.fillStyle = '#334155';
  ctx.font = 'bold 13px Arial, sans-serif';
  ctx.fillText(`ARANPRO Gestión Integral • RUT: ${adminRut}`, sealTextX, sealY + 56);
  ctx.fillStyle = '#475569';
  ctx.font = '12.5px Arial, sans-serif';
  ctx.fillText('Registro MINVU: En trámite (Sol. PN-27583)', sealTextX, sealY + 78);
  ctx.fillStyle = '#0F3D2E';
  ctx.font = 'bold 12px Arial, sans-serif';
  ctx.fillText('Cumplimiento Ley N° 21.442 de Copropiedad Inmobiliaria', sealTextX, sealY + 98);

  // Derecha: Firma Manuscrita + Línea de Firma del Administrador
  const sigBoxW = 340;
  const sigBoxX = W - padX - sigBoxW;
  const sigLineY = footerTopY + 104;

  if (sigImg) {
    const maxSigH = 82;
    const maxSigW = 260;
    const ratio = Math.min(maxSigW / sigImg.width, maxSigH / sigImg.height);
    const drawW = sigImg.width * ratio;
    const drawH = sigImg.height * ratio;
    ctx.drawImage(sigImg, sigBoxX + (sigBoxW - drawW) / 2, sigLineY - drawH - 4, drawW, drawH);
  } else {
    // Trazo caligráfico manuscrito limpio sin repetir el nombre impreso
    ctx.save();
    ctx.strokeStyle = '#0F3D2E';
    ctx.lineWidth = 2.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const cx = sigBoxX + sigBoxW / 2 - 45;
    const cy = sigLineY - 26;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 12);
    ctx.bezierCurveTo(cx + 15, cy - 28, cx + 35, cy + 18, cx + 52, cy - 12);
    ctx.bezierCurveTo(cx + 68, cy - 34, cx + 82, cy + 14, cx + 108, cy - 6);
    ctx.bezierCurveTo(cx + 122, cy - 16, cx + 135, cy + 6, cx + 152, cy - 4);
    ctx.stroke();
    ctx.restore();
  }

  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(sigBoxX + 20, sigLineY);
  ctx.lineTo(sigBoxX + sigBoxW - 20, sigLineY);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 14.5px Arial, sans-serif';
  ctx.fillText(adminName, sigBoxX + sigBoxW / 2, sigLineY + 22);

  ctx.fillStyle = '#475569';
  ctx.font = 'bold 12.5px Arial, sans-serif';
  ctx.fillText(`RUT: ${adminRut} • Ley N° 21.442`, sigBoxX + sigBoxW / 2, sigLineY + 42);

  ctx.fillStyle = '#0F3D2E';
  ctx.font = 'bold 12.5px Arial, sans-serif';
  ctx.fillText('Constructor Civil • Administrador de Condominios', sigBoxX + sigBoxW / 2, sigLineY + 60);
  ctx.textAlign = 'left';

  // Franja inferior institucional
  roundRect(ctx, 56, H - 90, W - 112, 34, 8);
  ctx.fillStyle = '#0F3D2E';
  ctx.fill();

  ctx.fillStyle = '#D4B895';
  ctx.font = 'bold 11.5px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    `ARANPRO GESTIÓN INTEGRAL • Fono/WhatsApp: ${phone} • Correo: ${email} • Portal Web: https://aranpro.cl`,
    W / 2,
    H - 68
  );
  ctx.textAlign = 'left';

  const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.92);
  const contentBase64 = jpegDataUrlToPdfBase64(jpegDataUrl, W, H);

  const safeCondo = condo.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileNames = {
    1: `Carta_Presentacion_ARANPRO_${safeCondo}.pdf`,
    2: `Dossier_Ejecutivo_ARANPRO_${safeCondo}.pdf`,
    3: `Propuesta_Honorarios_ARANPRO_${safeCondo}.pdf`,
    4: `Brochure_Suite_Digital_ARANPRO_${safeCondo}.pdf`
  };

  return {
    filename: fileNames[stepNumber] || `Propuesta_ARANPRO_${safeCondo}.pdf`,
    contentBase64
  };
};
