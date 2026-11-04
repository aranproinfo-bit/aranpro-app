// Utilidad de Impresión y Generación de PDF Aislada para Documentos Oficiales ARANPRO
// Cumple con Ley N° 21.442 y estándares notariales/contables chilenos

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
 * Imprime un documento directamente en un iframe aislado, asegurando que:
 * 1. El navegador sugiera el nombre de archivo exacto al guardar en PDF
 * 2. No se capturen elementos del panel/dashboard (sin capturas de pantalla)
 * 3. Se preserven los colores exactos de ARANPRO (#0F3D2E, #D4B895, #F5F4EF)
 * 4. El formato sea formal, estructurado y de alta calidad legal/notarial
 * 5. Soporte documentos de 1 sola página o múltiples páginas según corresponda
 */
export const printDocumentDirectly = (elementOrId, documentTitle = 'Documento_Oficial_ARANPRO', options = {}) => {
  const sanitizedTitle = sanitizeFileName(documentTitle);
  
  let contentHtml = '';
  if (typeof elementOrId === 'string' && (elementOrId.trim().startsWith('<') || elementOrId.trim().startsWith('<!DOCTYPE'))) {
    contentHtml = elementOrId;
  } else if (typeof elementOrId === 'string') {
    const el = document.getElementById(elementOrId);
    if (el) {
      contentHtml = el.innerHTML;
    } else {
      contentHtml = elementOrId;
    }
  } else if (elementOrId && elementOrId.innerHTML) {
    contentHtml = elementOrId.innerHTML;
  }

  // Convertir rutas relativas de imágenes a absolutas
  const origin = window.location.origin || '';
  contentHtml = contentHtml.replace(/src="\/brand\//g, `src="${origin}/brand/`);

  // Extraer estilos cargados en la aplicación
  const existingStyles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map(el => el.outerHTML)
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

    const fitPageStyle = options.fitPage ? `
      .print-wrapper {
        page-break-after: avoid !important;
        page-break-inside: avoid !important;
      }
      @page {
        size: ${options.pageSize || 'letter portrait'};
        margin: ${options.margin || '5mm 6mm 5mm 6mm'};
      }
    ` : '';

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
              margin: ${options.margin || '5mm 6mm 5mm 6mm'};
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
            .no-print { display: none !important; }
            table { width: 100%; border-collapse: collapse; }
            tr { page-break-inside: avoid !important; break-inside: avoid !important; }
            img { max-width: 100%; height: auto; }
            .page-break-after, .dossier-page-break { page-break-after: always !important; break-after: page !important; }
            .page-break-before { page-break-before: always !important; break-before: page !important; }
            .page-break-inside-avoid, .avoid-break, .break-inside-avoid { page-break-inside: avoid !important; break-inside: avoid !important; }
            
            /* Ajustes finos de bordes y sombras para impresión */
            .shadow-md, .shadow-lg, .shadow-xl, .shadow-2xl, .shadow-xs, .shadow-2xs {
              box-shadow: none !important;
            }
            .border-slate-200 { border-color: #cbd5e1 !important; }
            .bg-slate-50 { background-color: #f8fafc !important; }
            .bg-slate-100 { background-color: #f1f5f9 !important; }

            /* Estructura estricta para páginas del Dossier de 3 páginas */
            .dossier-page {
              box-sizing: border-box !important;
              width: 100% !important;
              min-height: 254mm !important;
              max-height: 254mm !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              page-break-after: always !important;
              break-after: page !important;
              padding: 2mm 0 !important;
              overflow: hidden !important;
            }
            .dossier-page.page-3 {
              page-break-after: avoid !important;
              break-after: avoid !important;
            }

            /* Quitar contenedores y fondos de pantalla en la hoja física impresa */
            #printable-full-dossier,
            #printable-commercial-proposal,
            #printable-app-brochure,
            #printable-technical-inspection,
            #printable-comparison-matrix {
              border: none !important;
              border-radius: 0 !important;
              padding: 0 !important;
              margin: 0 !important;
              box-shadow: none !important;
              width: 100% !important;
              max-width: 100% !important;
              background: transparent !important;
            }
            
            ${fitPageStyle}
            ${options.extraStyles || ''}
          </style>
        </head>
        <body class="p-0 m-0">
          <div class="print-wrapper w-full max-w-4xl mx-auto">
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

    // Escuchar el evento afterprint tanto en la ventana principal como en el iframe
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
        // Fallback seguro: mantener el título durante 2 minutos mientras el usuario guarda el PDF
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
    setTimeout(() => { document.title = previousParentTitle; }, 2500);
  }
};

/**
 * Descarga una copia del documento en formato HTML con estilos integrados
 */
export const downloadHtmlDocument = (elementOrId, fileName = 'documento.html') => {
  const sanitizedName = sanitizeFileName(fileName.replace(/\.html$/i, '')) + '.html';
  let contentHtml = '';
  if (typeof elementOrId === 'string') {
    const el = document.getElementById(elementOrId);
    if (!el) return;
    contentHtml = el.innerHTML;
  } else if (elementOrId?.innerHTML) {
    contentHtml = elementOrId.innerHTML;
  }

  const existingStyles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map(el => el.outerHTML)
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
  </style>
</head>
<body>
  <div style="max-width: 850px; margin: 0 auto;">
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
