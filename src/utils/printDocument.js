// Utilidad de Impresión y Generación de PDF Aislada para Documentos Oficiales ARANPRO
// Cumple con Ley N° 21.442 y estándares notariales/contables chilenos
// Estándar Visual Predeterminado: Alternativa 4 (Doble Filete Lateral Verde #0F3D2E + Dorado #D4B895 + Logo Vertical Principal + Sello Circular Dorado + Marca de Agua Sutil)

/**
 * Sanitiza una cadena para ser usada de manera segura como nombre de archivo PDF
 */
export const sanitizeFileName = (name) => {
  if (!name) return 'Documento_Oficial_ARANPRO';
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar tildes
    .replace(/[^a-zA-Z0-9_\-.]/g, '_') // Caracteres seguros
    .replace(/_+/g, '_') // Evitar múltiples guiones bajos
    .replace(/^_+|_+$/g, ''); // Limpiar extremos
};

/**
 * Obtiene el estilo visual de PDF activo ('alt4' por defecto)
 */
export const getActivePdfStyle = (options = {}, el = null) => {
  if (options?.pdfStyle) return options.pdfStyle;
  if (el && typeof el.getAttribute === 'function') {
    const attr = el.getAttribute('data-pdf-style');
    if (attr) return attr;
  }
  if (typeof window !== 'undefined') {
    if (window.__aranproPdfStyle) return window.__aranproPdfStyle;
    try {
      const saved = localStorage.getItem('aranpro_pdf_style');
      if (saved) return saved;
    } catch {
      // Ignorar errores de acceso a localStorage
    }
  }
  return 'alt4';
};

/**
 * Genera las reglas CSS específicas para la alternativa visual seleccionada ('alt4' | 'alt1' | 'alt2')
 */
const buildPdfVisualStyleCss = (pdfStyle, hasDossierPages) => {
  const targetSelector = hasDossierPages ? '.dossier-page' : '.print-wrapper';

  if (pdfStyle === 'alt2') {
    // Alternativa 2: Editorial Puro / Minimalista (Sin líneas laterales ni cuadros)
    return `
      ${targetSelector} {
        border: none !important;
        border-radius: 0 !important;
        background-image: none !important;
        padding-left: 8px !important;
        padding-right: 8px !important;
      }
      .aranpro-print-watermark { display: none !important; }
    `;
  }

  if (pdfStyle === 'alt1') {
    // Alternativa 1: Franja Vertical Ejecutiva Izquierda (Línea Verde Bosque #0F3D2E + Detalle Superior Dorado)
    return `
      ${targetSelector} {
        border-top: none !important;
        border-right: none !important;
        border-bottom: none !important;
        border-radius: 0 !important;
        border-left: 3.5px solid #0F3D2E !important;
        padding-left: 16px !important;
        padding-right: 8px !important;
      }
      .aranpro-print-watermark { display: none !important; }
    `;
  }

  // Alternativa 4 (Predeterminada): Doble Filete Lateral (Verde Bosque #0F3D2E + Champán Dorado #D4B895) + Marca de Agua Sutil
  return `
    ${targetSelector} {
      border-top: none !important;
      border-right: none !important;
      border-bottom: none !important;
      border-radius: 0 !important;
      border-left: 2.5px solid #0F3D2E !important;
      background-image: linear-gradient(to bottom, #D4B895, #D4B895) !important;
      background-size: 1.5px 100% !important;
      background-position: 4px 0 !important;
      background-repeat: no-repeat !important;
      padding-left: 18px !important;
      padding-right: 8px !important;
    }
  `;
};

/**
 * Imprime un documento directamente en un iframe aislado, asegurando que:
 * 1. El navegador sugiera el nombre de archivo exacto al guardar en PDF
 * 2. No se capturen elementos del panel/dashboard (sin capturas de pantalla ni botones de interfaz)
 * 3. Se preserven los colores exactos de ARANPRO (#0F3D2E, #D4B895, #F5F4EF)
 * 4. El formato sea formal, sin marcos cuadrados cerrados alrededor de la hoja, con Alternativa 4 por defecto
 * 5. Soporte documentos de 1 sola página o múltiples páginas según corresponda
 */
export const printDocumentDirectly = (elementOrId, documentTitle = 'Documento_Oficial_ARANPRO', options = {}, _retryCount = 0) => {
  const sanitizedTitle = sanitizeFileName(documentTitle);

  let contentHtml = '';
  let targetEl = null;

  if (typeof elementOrId === 'string' && (elementOrId.trim().startsWith('<') || elementOrId.trim().startsWith('<!DOCTYPE'))) {
    contentHtml = elementOrId;
  } else if (typeof elementOrId === 'string') {
    const el = document.getElementById(elementOrId);
    if (el) {
      targetEl = el;
      contentHtml = el.innerHTML;
    } else if (_retryCount < 10) {
      // Si el modal que contiene el elemento se acaba de abrir en React, esperar a que se monte en el DOM
      setTimeout(() => {
        printDocumentDirectly(elementOrId, documentTitle, options, _retryCount + 1);
      }, 60);
      return;
    } else {
      console.warn(`[printDocument] Elemento #${elementOrId} no encontrado en el DOM.`);
      return;
    }
  } else if (elementOrId && elementOrId.innerHTML) {
    targetEl = elementOrId;
    contentHtml = elementOrId.innerHTML;
  }

  const activePdfStyle = getActivePdfStyle(options, targetEl);
  const isDossierDoc =
    contentHtml.includes('dossier-page') ||
    Boolean(targetEl?.classList?.contains('dossier-page')) ||
    [
      'printable-cold-value-letter',
      'printable-commercial-proposal',
      'printable-full-dossier',
      'printable-app-brochure',
      'printable-technical-inspection',
      'printable-comparison-matrix',
      'printable-agacech-fee-sheet'
    ].includes(elementOrId);

  let hasDossierPages = isDossierDoc;

  if (isDossierDoc && !contentHtml.includes('dossier-page')) {
    const existingClasses = targetEl?.className || 'dossier-page page-1';
    const finalClass = existingClasses.includes('dossier-page') ? existingClasses : `dossier-page page-1 ${existingClasses}`;
    contentHtml = `<div class="${finalClass}">${contentHtml}</div>`;
    hasDossierPages = true;
  }

  // Convertir rutas relativas de imágenes a absolutas para que carguen instantáneamente en el iframe
  const origin = window.location.origin || '';
  contentHtml = contentHtml
    .replace(/src="\/brand\//g, `src="${origin}/brand/`)
    .replace(/src="brand\//g, `src="${origin}/brand/`)
    .replace(/src="\/certificaciones\//g, `src="${origin}/certificaciones/`);

  // Extraer estilos cargados en la aplicación
  const existingStyles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((el) => el.outerHTML)
    .join('\n');

  const previousParentTitle = document.title;
  document.title = sanitizedTitle;

  try {
    let iframe = document.getElementById('aranpro-print-iframe');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'aranpro-print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';
      document.body.appendChild(iframe);
    }

    const fitPageStyle = options.fitPage
      ? `
      .print-wrapper, .dossier-page {
        page-break-after: avoid !important;
        page-break-inside: avoid !important;
        break-after: avoid !important;
        break-inside: avoid !important;
        height: 270mm !important;
        min-height: 270mm !important;
        max-height: 271mm !important;
        overflow: hidden !important;
      }
      @page {
        size: ${options.pageSize || 'letter portrait'};
        margin: ${options.margin || '4mm 6mm 4mm 6mm'};
      }
    `
      : '';

    const visualStyleCss = buildPdfVisualStyleCss(activePdfStyle, hasDossierPages);

    const doc = iframe.contentWindow || iframe.contentDocument;
    const iDoc = doc.document || doc;
    iDoc.open();
    iDoc.write(`
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <title>${sanitizedTitle}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          ${existingStyles}
          <style>
            @page {
              size: ${options.pageSize || 'letter portrait'};
              margin: ${options.margin || '4mm 6mm 4mm 6mm'};
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
              box-sizing: border-box;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #0f172a;
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              -webkit-font-smoothing: antialiased;
            }
            .no-print, button.no-print, [data-no-print="true"] { display: none !important; }
            table { width: 100%; border-collapse: collapse; }
            tr { page-break-inside: avoid !important; break-inside: avoid !important; }
            img { max-width: 100%; height: auto; }
            img[src*="ARANPRO_logo_principal"],
            img[src*="ARANPRO_logo_horizontal"],
            img[src*="ARANPRO_isotipo"] {
              height: 46px !important;
              max-height: 50px !important;
              width: auto !important;
              object-fit: contain !important;
            }
            img[src*="ARANPRO_sello_circular"]:not(.aranpro-print-watermark) {
              height: 48px !important;
              width: 48px !important;
              max-height: 54px !important;
              max-width: 54px !important;
              object-fit: contain !important;
            }
            .page-break-after, .dossier-page-break { page-break-after: always !important; break-after: page !important; }
            .page-break-before { page-break-before: always !important; break-before: page !important; }
            .page-break-inside-avoid, .avoid-break, .break-inside-avoid { page-break-inside: avoid !important; break-inside: avoid !important; }

            /* Eliminar sombras y bordes cerrados de modales en impresión */
            .shadow-md, .shadow-lg, .shadow-xl, .shadow-2xl, .shadow-xs, .shadow-2xs, .shadow-sm {
              box-shadow: none !important;
            }
            .border-slate-200 { border-color: #cbd5e1 !important; }
            .bg-slate-50 { background-color: #f8fafc !important; }
            .bg-slate-100 { background-color: #f1f5f9 !important; }

            /* Marca de agua central institucional (Alternativa 4) */
            .aranpro-print-watermark {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 270px;
              height: 270px;
              object-fit: contain;
              opacity: 0.036;
              pointer-events: none;
              z-index: 0;
            }

            .print-wrapper {
              position: relative;
              z-index: 1;
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 auto !important;
              background: transparent !important;
            }

            /* Estructura canónica ARANPRO: exactamente 1 hoja Carta por cada .dossier-page (270mm), ocupando toda la hoja sin cortes ni blancos al final */
            .dossier-page {
              position: relative;
              z-index: 1;
              box-sizing: border-box !important;
              width: 100% !important;
              min-height: 270mm !important;
              height: 270mm !important;
              max-height: 271mm !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              page-break-after: always !important;
              break-after: page !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              padding: 4mm 4mm 3mm 16mm !important;
              margin: 0 !important;
              border: none !important;
              border-radius: 0 !important;
              overflow: hidden !important;
              background-color: transparent !important;
            }
            .dossier-page:only-child,
            .dossier-page:last-child {
              page-break-after: avoid !important;
              break-after: avoid !important;
            }

            /* Quitar contenedores cerrados de TODOS los 32 documentos imprimibles del sistema */
            #printable-full-dossier,
            #printable-commercial-proposal,
            #printable-cold-value-letter,
            #printable-agacech-fee-sheet,
            #printable-app-brochure,
            #printable-technical-inspection,
            #printable-comparison-matrix,
            #printable-official-certificate,
            #unit-bill-printable-doc,
            #resident-bill-printable-doc,
            #payment-receipt-printable-doc,
            #resident-payment-receipt-printable-doc,
            #committee-report-printable-doc,
            #expense-rendition-printable-doc,
            #expense-voucher-printable-doc,
            #receipt-modal-printable-content,
            #collection-letter-printable-doc,
            #unit-bitacora-printable-doc,
            #printable-unit-account-statement,
            #assembly-budget-printable-doc,
            #resident-brochure-printable-doc,
            #official-registry-printable-doc,
            #assembly-citation-printable-doc,
            #assembly-minutes-draft-doc,
            #voting-brochure-printable-doc,
            #assembly-minute-printable-doc,
            #proxy-legal-template-doc,
            #complaints-official-book-printable,
            #single-warning-letter-printable,
            #maintenance-official-log-printable,
            #printable-community-payroll-slip,
            #printable-community-monthly-payroll-sheet,
            #printable-community-previred-sheet,
            #printable-community-staff-roster,
            #printable-community-labor-contract,
            #printable-community-riohs-document,
            #printable-community-vacation-slip,
            #printable-community-severance-doc,
            #printable-community-dismissal-letter,
            #printable-community-overtime-pact,
            #printable-community-karin-protocol {
              border: none !important;
              border-radius: 0 !important;
              padding: 0 !important;
              margin: 0 !important;
              box-shadow: none !important;
              width: 100% !important;
              max-width: 100% !important;
              background: transparent !important;
            }

            ${visualStyleCss}
            ${fitPageStyle}
            ${options.extraStyles || ''}
          </style>
        </head>
        <body class="p-0 m-0">
          ${
            activePdfStyle === 'alt4'
              ? `<img src="${origin}/brand/ARANPRO_sello_circular_integral_transparente.png" alt="" class="aranpro-print-watermark" />`
              : ''
          }
          <div class="print-wrapper">
            ${contentHtml}
          </div>
        </body>
      </html>
    `);
    iDoc.close();

    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      document.title = previousParentTitle;
    };

    window.addEventListener('afterprint', cleanup, { once: true });
    try {
      if (iframe.contentWindow) {
        iframe.contentWindow.addEventListener('afterprint', cleanup, { once: true });
      }
    } catch {
      // Ignorar restricciones de origen cruzado si ocurrieran
    }

    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(cleanup, 120000);
      } catch (err) {
        console.warn('Fallo impresión en iframe, usando fallback', err);
        window.print();
        setTimeout(cleanup, 120000);
      }
    }, 450);
  } catch (e) {
    console.error('Error generando documento de impresión', e);
    window.print();
    setTimeout(() => {
      document.title = previousParentTitle;
    }, 2500);
  }
};

/**
 * Descarga una copia del documento en formato HTML con estilos integrados
 */
export const downloadHtmlDocument = (elementOrId, fileName = 'documento.html') => {
  const sanitizedName = sanitizeFileName(fileName.replace(/\.html$/i, '')) + '.html';
  let contentHtml = '';
  let targetEl = null;
  if (typeof elementOrId === 'string') {
    const el = document.getElementById(elementOrId);
    if (!el) return;
    targetEl = el;
    contentHtml = el.innerHTML;
  } else if (elementOrId?.innerHTML) {
    targetEl = elementOrId;
    contentHtml = elementOrId.innerHTML;
  }

  const origin = window.location.origin || '';
  contentHtml = contentHtml
    .replace(/src="\/brand\//g, `src="${origin}/brand/`)
    .replace(/src="brand\//g, `src="${origin}/brand/`);

  const activePdfStyle = getActivePdfStyle({}, targetEl);
  let hasDossierPages = contentHtml.includes('dossier-page') || Boolean(targetEl?.classList?.contains('dossier-page'));
  if (targetEl?.classList?.contains('dossier-page') && !contentHtml.includes('dossier-page')) {
    contentHtml = `<div class="${targetEl.className}">${contentHtml}</div>`;
    hasDossierPages = true;
  }
  const visualStyleCss = buildPdfVisualStyleCss(activePdfStyle, hasDossierPages);

  const existingStyles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((el) => el.outerHTML)
    .join('\n');

  const fullHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>${sanitizedName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  ${existingStyles}
  <style>
    body { background: #ffffff; padding: 24px; font-family: system-ui, sans-serif; }
    .no-print { display: none !important; }
    img[src*="ARANPRO_logo_principal"],
    img[src*="ARANPRO_logo_horizontal"],
    img[src*="ARANPRO_isotipo"] {
      height: 46px !important;
      max-height: 50px !important;
      width: auto !important;
      object-fit: contain !important;
    }
    img[src*="ARANPRO_sello_circular"]:not(.aranpro-print-watermark) {
      height: 48px !important;
      width: 48px !important;
      max-height: 54px !important;
      max-width: 54px !important;
      object-fit: contain !important;
    }
    ${visualStyleCss}
  </style>
</head>
<body>
  <div class="print-wrapper" style="max-width: 850px; margin: 0 auto;">
    ${contentHtml}
  </div>
</body>
</html>`;

  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = sanitizedName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
