/**
 * Generador CanÃ³nico de PDF para Postulaciones ARANPRO
 * Exporta 1:1 el documento maestro del DOM generado por la aplicaciÃ³n
 * (ARANPRO_Carta_Valor_Comite, Dossier Integral 4 PÃ¡ginas, Carta Formal de PostulaciÃ³n y Brochure)
 * asegurando la misma tipografÃ­a, tamaÃ±os, doble filete, colores exactos (#0F3D2E, #D4B895, #F5F4EF)
 * y distribuciÃ³n de pÃ¡gina idÃ©ntica a la previsualizaciÃ³n e impresiÃ³n oficial.
 */

import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import { canonicalPdfHeaderStyles } from '../components/common/CanonicalPdfParts';

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
 * Precarga y cachea la marca de agua corporativa como DataURL Base64
 * para eliminar al 100% cualquier riesgo de tainted canvas en html2canvas.
 */
let cachedWatermarkDataUrl = null;
const getWatermarkBase64 = async () => {
  if (cachedWatermarkDataUrl) return cachedWatermarkDataUrl;
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch('/brand/ARANPRO_sello_circular_integral_transparente.png');
    if (res.ok) {
      const blob = await res.blob();
      cachedWatermarkDataUrl = await blobToDataUrl(blob);
      return cachedWatermarkDataUrl;
    }
  } catch (err) {
    console.warn('[proposalPdfGenerator] No se pudo precargar la marca de agua:', err);
  }
  return null;
};

/**
 * Captura un elemento o contenedor del DOM y genera un PDF estÃ¡ndar Carta (612 x 792 pt)
 * en Base64 idÃ©ntico al documento maestro que se imprime o descarga desde la aplicaciÃ³n.
 */
export const exportDomElementToPdfBase64 = async (elementOrId, options = {}) => {
  let targetEl = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
  if (!targetEl && typeof elementOrId === 'string') {
    targetEl = document.querySelector(`[id="${elementOrId}"]`);
  }
  if (!targetEl) {
    throw new Error(`Elemento #${typeof elementOrId === 'string' ? elementOrId : 'desconocido'} no encontrado en el DOM`);
  }

  // 1. Obtener pÃ¡ginas hijas (.dossier-page) o el contenedor raÃ­z
  const rawPages = Array.from(targetEl.querySelectorAll('.dossier-page'));
  const pages = rawPages.length > 0 ? rawPages : [targetEl];

  // 2. Precargar marca de agua corporativa en Base64
  const watermarkBase64 = await getWatermarkBase64();

  // 3. Crear documento PDF oficial tamaÃ±o Carta estÃ¡ndar (612 x 792 pt)
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter'
  });

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];

    // Captura limpia y directa del elemento con escala 2 para nitidez tipogrÃ¡fica y colores puros
    const canvas = await html2canvas(page, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      x: 0,
      y: 0,
      width: 816,
      height: 1056,
      windowWidth: 816,
      windowHeight: 1056,
      onclone: (clonedDoc, clonedEl) => {
        // En el clon, inlinear todas las marcas de agua a Base64 para asegurar cero errores de seguridad
        if (watermarkBase64) {
          const imgs = clonedEl.querySelectorAll('img');
          imgs.forEach((img) => {
            const src = img.getAttribute('src') || '';
            if (src.includes('ARANPRO_sello_circular') || src.includes('sello_circular')) {
              img.setAttribute('src', watermarkBase64);
            }
          });
        }

        // Posicionar el clon como elemento Ãºnico en la raÃ­z del documento clonado
        clonedDoc.body.innerHTML = '';
        clonedDoc.body.appendChild(clonedEl);
        clonedDoc.body.style.margin = '0';
        clonedDoc.body.style.padding = '0';
        clonedDoc.body.style.background = '#ffffff';

        // La descarga y el adjunto parten del mismo documento. Aplicar aquí las
        // medidas de impresión aprobadas: html2canvas no ejecuta @media print.
        const canonicalStyle = clonedDoc.createElement('style');
        canonicalStyle.textContent = `${canonicalPdfHeaderStyles}
          .dossier-page { box-sizing:border-box!important; height:1056px!important; min-height:1056px!important; max-height:1056px!important;
            padding:30.2px 60.5px 30.2px 64.3px!important; border:0!important; border-left:12.5px solid #0F3D2E!important;
            background-color:#fff!important; background-image:linear-gradient(#D4B895,#D4B895)!important;
            background-size:4.5px 100%!important; background-position:1.9px 0!important; background-repeat:no-repeat!important; }
          .dossier-page > div[aria-hidden="true"], .aranpro-print-watermark { display:none!important; }
          ${options.hideDecorativeWatermark ? '.dossier-page > img[aria-hidden="true"] { display:none!important; } .dossier-page h1 { font-size:12px!important; }' : ''}
          .transition-header img[src*="ARANPRO_logo_horizontal"] { width:140px!important; max-width:140px!important; height:auto!important; max-height:42px!important; object-fit:contain!important; }
          .proposal-page-footer,.brochure-footer { gap:8px!important; font-size:8px!important; white-space:nowrap!important; }
          .transition-final-footer { gap:8px!important; }
          .transition-footer-details { gap:8px!important; flex:1 1 auto; min-width:0; }
          .transition-footer-seal { flex:0 0 auto; gap:6px!important; }
          .transition-footer-seal > div { white-space:nowrap; }
          .transition-footer-seal > div > div:first-child { font-size:8px!important; letter-spacing:0!important; }
          .transition-footer-seal > div > div:last-child { font-size:7.5px!important; }
          .transition-footer-contact { flex:0 0 auto; white-space:nowrap; font-size:8px!important; padding-left:8px!important; }
          .transition-footer-signature { flex:0 0 210px; min-width:0!important; }`;
        clonedDoc.head.appendChild(canonicalStyle);

        clonedEl.style.width = '816px';
        clonedEl.style.minHeight = '1056px';
        clonedEl.style.height = '1056px';
        clonedEl.style.maxHeight = '1056px';
        clonedEl.style.boxShadow = 'none';
        clonedEl.style.margin = '0';
        clonedEl.style.overflow = 'hidden';
        clonedEl.style.position = 'relative';
        clonedEl.style.top = '0';
        clonedEl.style.left = '0';
        clonedEl.style.display = 'flex';
        clonedEl.style.flexDirection = 'column';
        clonedEl.style.justifyContent = 'space-between';
        clonedEl.style.opacity = '1';
        clonedEl.style.visibility = 'visible';

        // Desactivar line-clamp que corte texto verticalmente
        const clamps = clonedEl.querySelectorAll('[class*="line-clamp"]');
        clamps.forEach((c) => {
          c.style.webkitLineClamp = 'unset';
          c.style.webkitBoxOrient = 'unset';
          c.style.display = 'block';
        });
      }
    });

    // Formato PNG para preservar el 100% de fidelidad de color (#0F3D2E, #D4B895, #F5F4EF)
    const imgData = canvas.toDataURL('image/png');

    if (i > 0) {
      pdf.addPage('letter', 'portrait');
    }

    // Dibujar ocupando la totalidad de la hoja Carta oficial (612 x 792 pt) con proporciÃ³n matemÃ¡tica exacta
    pdf.addImage(imgData, 'PNG', 0, 0, 612, 792, undefined, 'FAST');
  }

  const dataUri = pdf.output('datauristring');
  return dataUri.split(',')[1];
};

/**
 * Genera el PDF CanÃ³nico exacto para el paso indicado (1, 2, 3 o 4)
 * Exporta directamente el documento maestro del DOM generado por la aplicaciÃ³n,
 * respetando todos los parÃ¡metros reales (si viene con nombre o en blanco).
 */
export const generateStepPdfAttachment = async ({
  stepNumber = 1,
  proposalConfig = {},
  empresaForm = {},
  signatureImage = ''
}) => {
  const targetRaw = (proposalConfig.targetCondo || '').trim();
  const targetClean = targetRaw.replace(/[^a-zA-Z0-9]/g, '_');
  const currentLocalDate = new Date();
  const currentDateClean = `${currentLocalDate.getFullYear()}${String(currentLocalDate.getMonth() + 1).padStart(2, '0')}${String(currentLocalDate.getDate()).padStart(2, '0')}`;
  const dateClean = stepNumber === 1 || stepNumber === 2 || stepNumber === 3 ? currentDateClean : (proposalConfig.proposalDate || new Date().toISOString().slice(0, 10)).replace(/[^0-9]/g, '');

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
      ? `ARANPRO_Propuesta_Formal_y_Diagnostico_${targetClean}_${dateClean}.pdf`
      : `ARANPRO_Propuesta_Formal_y_Diagnostico_${dateClean}.pdf`;
  } else if (stepNumber === 4) {
    elementId = 'printable-app-brochure';
    defaultFilename = targetClean
      ? `ARANPRO_Brochure_App_${targetClean}_${dateClean}.pdf`
      : `ARANPRO_Brochure_App_${dateClean}.pdf`;
  } else if (stepNumber === 5) {
    elementId = 'printable-transition-package';
    defaultFilename = targetClean
      ? `ARANPRO_Kit_Asesoria_y_Traspaso_${targetClean}_${dateClean}.pdf`
      : `ARANPRO_Kit_Asesoria_y_Traspaso_${dateClean}.pdf`;
  }

  if (typeof document !== 'undefined') {
    let el = document.getElementById(elementId);
    if (!el) {
      el = document.querySelector(`[id="${elementId}"]`);
    }

    if (!el) {
      // Reintento breve de 150ms si el elemento se estÃ¡ montando en el DOM
      await new Promise((r) => setTimeout(r, 150));
      el = document.getElementById(elementId) || document.querySelector(`[id="${elementId}"]`);
    }

    if (el) {
      if (stepNumber === 2 || stepNumber === 3) {
        const today = currentLocalDate.toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' });
        el.querySelectorAll('[data-current-print-date]').forEach(node => { node.textContent = today; });
      }
      if (stepNumber === 2) {
        const evidenceDeadline = Date.now() + 8000;
        while (el.dataset.dossierEvidenceStatus === 'pending' && Date.now() < evidenceDeadline) {
          await new Promise(resolve => setTimeout(resolve, 80));
        }
        if (el.dataset.dossierEvidenceStatus !== 'ready') {
          throw new Error('No se pudieron cargar todos los archivos seleccionados de la bóveda. Revisa sus respaldos antes de generar el dossier.');
        }
        // Evitar que el PDF capture el QR provisional de otro destino.
        const deadline = Date.now() + 5000;
        let qr = el.querySelector('img[data-qr-value]');
        while ((!qr || qr.dataset.qrReady !== 'true') && Date.now() < deadline) {
          await new Promise(resolve => setTimeout(resolve, 80));
          qr = el.querySelector('img[data-qr-value]');
        }
        if (!qr || qr.dataset.qrReady !== 'true') throw new Error('No se pudo preparar el código QR de la demostración');
      }
      const contentBase64 = await exportDomElementToPdfBase64(el, { filename: defaultFilename, hideDecorativeWatermark: stepNumber === 1 });
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
