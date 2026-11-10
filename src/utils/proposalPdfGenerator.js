/**
 * Generador Canónico de PDF para Postulaciones ARANPRO
 * Exporta 1:1 el documento maestro del DOM generado por la aplicación
 * (ARANPRO_Carta_Valor_Comite, Dossier Integral 4 Páginas, Carta Formal de Postulación y Brochure)
 * asegurando la misma tipografía, tamaños, doble filete, colores exactos (#0F3D2E, #D4B895, #F5F4EF)
 * y distribución de página idéntica a la previsualización e impresión oficial.
 */

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Convierte un Blob en DataURL Base64
 */
const blobToDataUrl = (blob) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });

/**
 * Convierte una URL de imagen a DataURL Base64 para prevenir cualquier error de CORS
 * o de canvas contaminado (SecurityError / tainted canvas) en html2canvas.
 */
const urlToDataUrl = async (url) => {
  if (!url || typeof url !== 'string' || url.startsWith('data:')) return url;
  try {
    const res = await fetch(url);
    if (!res.ok) return url;
    const blob = await res.blob();
    const dataUrl = await blobToDataUrl(blob);
    return dataUrl || url;
  } catch {
    return url;
  }
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

  // 1. Obtener el HTML limpio del elemento maestro del DOM
  let contentHtml = targetEl.innerHTML;

  // 2. Resolver rutas relativas a absolutas para asegurar carga
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
    iframe.style.height = '4800px';
    iframe.style.border = '0';
    iframe.style.opacity = '1';
    iframe.style.visibility = 'visible';
    iframe.style.zIndex = '-99999';
    document.body.appendChild(iframe);
  } else {
    iframe.style.width = '816px';
    iframe.style.height = '4800px';
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

  // Esperar a que el iframe compile estilos
  await new Promise((r) => setTimeout(r, 200));

  // Inlinear absolutamente todas las imágenes en Base64 para erradicar cualquier riesgo de tainted canvas
  const iframeImgs = Array.from(iDoc.querySelectorAll('img'));
  await Promise.all(
    iframeImgs.map(async (img) => {
      const src = img.getAttribute('src');
      if (src && !src.startsWith('data:')) {
        const dataUrl = await urlToDataUrl(src);
        if (dataUrl && dataUrl.startsWith('data:')) {
          img.setAttribute('src', dataUrl);
        }
      }
      if (img.complete && img.naturalHeight !== 0) return;
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
        setTimeout(resolve, 600);
      });
    })
  );

  // Seleccionar todas las páginas hijas .dossier-page o el contenedor raíz
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
      allowTaint: false,
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
 * Genera el PDF Canónico exacto para el paso indicado (1, 2, 3 o 4)
 * Exporta directamente el documento maestro del DOM generado por la aplicación,
 * respetando todos los parámetros reales (si viene con nombre o en blanco).
 */
export const generateStepPdfAttachment = async ({
  stepNumber = 1,
  proposalConfig = {},
  empresaForm = {},
  signatureImage = ''
}) => {
  const targetRaw = (proposalConfig.targetCondo || '').trim();
  const targetClean = targetRaw.replace(/[^a-zA-Z0-9]/g, '_');
  const dateClean = (proposalConfig.proposalDate || new Date().toISOString().slice(0, 10)).replace(/[^0-9]/g, '');

  let elementId = 'printable-cold-value-letter';
  let defaultFilename = targetClean
    ? `ARANPRO_Carta_Valor_Comite_${targetClean}_${dateClean}.pdf`
    : `ARANPRO_Carta_Valor_Comite_${dateClean}.pdf`;

  if (stepNumber === 1) {
    elementId = 'printable-cold-value-letter';
    defaultFilename = targetClean
      ? `ARANPRO_Carta_Valor_Comite_${targetClean}_${dateClean}.pdf`
      : `ARANPRO_Carta_Valor_Comite_${dateClean}.pdf`;
  } else if (stepNumber === 2) {
    elementId = 'printable-full-dossier';
    defaultFilename = targetClean
      ? `ARANPRO_Dossier_Integral_${targetClean}_${dateClean}.pdf`
      : `ARANPRO_Dossier_Integral_${dateClean}.pdf`;
  } else if (stepNumber === 3) {
    elementId = 'printable-commercial-proposal';
    defaultFilename = targetClean
      ? `ARANPRO_Carta_Formal_Postulacion_${targetClean}_${dateClean}.pdf`
      : `ARANPRO_Carta_Formal_Postulacion_${dateClean}.pdf`;
  } else if (stepNumber === 4) {
    elementId = 'printable-app-brochure';
    defaultFilename = targetClean
      ? `ARANPRO_Brochure_App_${targetClean}_${dateClean}.pdf`
      : `ARANPRO_Brochure_App_${dateClean}.pdf`;
  }

  if (typeof document !== 'undefined') {
    let el = document.getElementById(elementId);
    if (!el) {
      el = document.querySelector(`[id="${elementId}"]`);
    }

    if (!el) {
      // Reintento breve de 100ms si el elemento se está montando en el DOM
      await new Promise((r) => setTimeout(r, 100));
      el = document.getElementById(elementId) || document.querySelector(`[id="${elementId}"]`);
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

  throw new Error(`No se pudo generar el documento PDF desde el elemento maestro #${elementId}`);
};
