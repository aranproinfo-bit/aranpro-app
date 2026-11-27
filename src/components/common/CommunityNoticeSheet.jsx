import React, { useState, useEffect } from 'react';
import { Printer, X, Eye, LayoutTemplate } from 'lucide-react';
import { formatCLP, formatRut } from '../../utils/formatters';
import { printDocumentDirectly } from '../../utils/printDocument';

const MONTHS_LONG = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

const MONTHS_SHORT_UPPER = [
  'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN',
  'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'
];

const MONTHS_SHORT_LOWER = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic'
];

function parseIsoDate(dateStr) {
  if (!dateStr) return null;
  const clean = String(dateStr).trim().slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(clean);
  if (!m) return null;
  const year = Number(m[1]);
  const monthIdx = Number(m[2]) - 1;
  const day = Number(m[3]);
  if (monthIdx < 0 || monthIdx > 11) return null;
  return { year, monthIdx, day, dayPadded: m[3] };
}

function formatLongDate(dateStr) {
  const p = parseIsoDate(dateStr);
  if (!p) return dateStr || 'Fecha vigente';
  return `${p.day} de ${MONTHS_LONG[p.monthIdx]} de ${p.year}`;
}

function formatShortDate(dateStr) {
  const p = parseIsoDate(dateStr);
  if (!p) return dateStr || 'Fecha vigente';
  return `${p.dayPadded} ${MONTHS_SHORT_LOWER[p.monthIdx]} ${p.year}`;
}

function formatBigDayMonth(dateStr) {
  const p = parseIsoDate(dateStr);
  if (!p) return String(dateStr || 'PRÓXIMA').slice(0, 10).toUpperCase();
  return `${p.dayPadded} ${MONTHS_SHORT_UPPER[p.monthIdx]}`;
}

export function resolveNoticeVariant(notice = {}) {
  if (notice.variant) return notice.variant;
  const cat = String(notice.category || '').toLowerCase();
  const title = String(notice.title || '').toLowerCase();
  if (cat.includes('multa') || notice.amountClp > 0) return 'fine';
  if (cat.includes('advertencia') || cat.includes('apercibimiento')) return 'warning';
  if (
    cat.includes('visita') ||
    cat.includes('mantención') ||
    cat.includes('mantencion') ||
    cat.includes('servicios') ||
    title.includes('visita') ||
    title.includes('mantención') ||
    title.includes('mantencion') ||
    title.includes('revisión') ||
    title.includes('corte')
  ) {
    return 'visit';
  }
  return 'convivencia';
}

export function printCommunityNoticeSheet(elementId, filename) {
  printDocumentDirectly(elementId, filename, {
    pageSize: 'letter portrait',
    margin: '6.5mm 8mm',
    pdfStyle: 'neutral',
    useBundledStyles: true,
    waitForAssets: true,
    extraStyles: `
      @media print {
        html, body {
          background: #ffffff !important;
          margin: 0 !important;
          padding: 0 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .community-notice-sheet {
          max-width: none !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          box-shadow: none !important;
          border: none !important;
          background: #ffffff !important;
        }
        .community-notice-card {
          height: 127mm !important;
          min-height: 127mm !important;
          max-height: 127mm !important;
          overflow: hidden !important;
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }
        .community-notice-cutline {
          height: 9.5mm !important;
          margin: 0 !important;
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }
      }
    `
  });
}

function OfficialSealAndSignature({ companySettings, copyIndex, showReceiptLine = false }) {
  const signatureImg = companySettings?.signatureDataUrl || '';
  const adminName =
    companySettings?.adminName ||
    companySettings?.administratorName ||
    'Administración ARANPRO';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 10,
        paddingTop: 4,
        marginTop: 'auto'
      }}
    >
      {/* Sello Oficial Completo ARANPRO */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
        <img
          src="/brand/ARANPRO_sello_circular_integral_transparente.png"
          alt="Sello Oficial ARANPRO"
          style={{ width: 34, height: 34, objectFit: 'contain', flexShrink: 0 }}
        />
        <div style={{ lineHeight: 1.2 }}>
          <div
            style={{
              fontSize: 8.4,
              fontWeight: 800,
              color: '#0F3D2E',
              textTransform: 'uppercase',
              letterSpacing: '0.02em'
            }}
          >
            Sello Oficial de Administración
          </div>
          <div style={{ fontSize: 7.8, color: '#526b5e' }}>
            Ley N° 21.442 de Copropiedad Inmobiliaria
          </div>
        </div>
      </div>

      {/* Constancia formal de entrega en Ejemplar 2 (Conserjería / Comité / Libro) */}
      {showReceiptLine && copyIndex === 1 && (
        <div
          style={{
            flex: '0 1 182px',
            background: '#f8fafc',
            border: '1px dashed #94a3b8',
            borderRadius: 5,
            padding: '3.5px 7px',
            fontSize: 7.4,
            lineHeight: 1.28,
            color: '#334155'
          }}
        >
          <div style={{ fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' }}>
            Constancia Entrega · Conserjería / Libro
          </div>
          <div>☐ Personal &nbsp; ☐ Bajo puerta / buzón</div>
          <div>Fecha/Hora: _________ Firma: _________</div>
        </div>
      )}

      {/* Firma configurada de Administración */}
      <div style={{ width: 148, textAlign: 'center', flexShrink: 0 }}>
        <div
          style={{
            height: 26,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            paddingBottom: 1
          }}
        >
          {signatureImg ? (
            <img
              src={signatureImg}
              alt="Firma de administración"
              style={{ maxHeight: 25, maxWidth: 112, width: 'auto', objectFit: 'contain' }}
            />
          ) : null}
        </div>
        <div style={{ borderTop: '1.5px solid #0F3D2E', paddingTop: 2.5 }}>
          <div style={{ fontSize: 8.4, fontWeight: 800, color: '#0F3D2E', lineHeight: 1.15 }}>
            Firma de administración
          </div>
          <div
            style={{
              fontSize: 7.5,
              color: '#526b5e',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {adminName}
          </div>
        </div>
      </div>
    </div>
  );
}

function CommunityTopIdentity({ communityName, communityLogo, copyBadge, folio }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 10,
        marginBottom: 6
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
        {communityLogo ? (
          <img
            src={communityLogo}
            alt={communityName}
            style={{
              height: 28,
              maxWidth: 64,
              width: 'auto',
              objectFit: 'contain',
              borderRadius: 4,
              flexShrink: 0
            }}
          />
        ) : null}
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 800,
              color: '#0F3D2E',
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              lineHeight: 1.2
            }}
          >
            {communityName}
          </div>
          {!communityLogo && (
            <div style={{ fontSize: 8.2, color: '#64748b', marginTop: 1 }}>
              Administración de Copropiedad
            </div>
          )}
        </div>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div
          style={{
            display: 'inline-block',
            fontSize: 7.8,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            padding: '2px 7px',
            borderRadius: 999,
            background: '#f1f5f9',
            border: '1px solid #cbd5e1',
            color: '#334155'
          }}
        >
          {copyBadge}
        </div>
        {folio ? (
          <div
            style={{
              fontSize: 8.2,
              fontWeight: 700,
              color: '#64748b',
              marginTop: 2,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace'
            }}
          >
            Folio: {folio}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * MODELO A: NOTIFICACIÓN DE MULTA Y ADVERTENCIA LEGAL (Media Carta)
 * Incluye panel izquierdo verde oscuro + caja dorada de monto + cuadro legal rojo Ley 21.442.
 */
function FineOrWarningHalfCard({ notice, community, companySettings, copyIndex, isWarning = false }) {
  const communityName = community?.name || 'Condominio';
  const communityLogo = community?.documentLogo || community?.logo || '';
  const contactEmail = companySettings?.email || 'contacto@aranpro.cl';

  const unitLabel = notice.unitLabel || 'Unidad informada';
  const ownerName = notice.ownerName || '';
  const ownerRut = notice.ownerRut ? formatRut(notice.ownerRut) : '';
  const reason =
    notice.reason ||
    notice.content ||
    'Incumplimiento de normas de convivencia y uso de bienes comunes.';
  const partialArgument = notice.partialArgument || '';
  const article =
    notice.reglamentoArticle || 'Arts. 17°, 20° y 27° Ley N° 21.442 · Reglamento de Copropiedad';
  const evidenceSource = notice.evidenceSource || 'Libro de Novedades de Conserjería';
  const conditionType =
    notice.conditionType ||
    (isWarning ? 'Apercibimiento preventivo' : 'Primera infracción reglamentaria');
  const appealTerm = notice.appealTerm || (isWarning ? '48 horas hábiles' : '5 días hábiles');
  const folio = notice.folio || (isWarning ? 'ADV-2026-01' : 'SANC-2026-01');
  const incidentDateStr = formatShortDate(
    notice.incidentDate || notice.date || new Date().toISOString().slice(0, 10)
  );
  const incidentWhen = notice.incidentTime
    ? `${incidentDateStr} · ${notice.incidentTime}`
    : formatLongDate(notice.date || new Date().toISOString().slice(0, 10));

  const amountFormatted = isWarning
    ? 'APERCIBIMIENTO'
    : formatCLP(Number(notice.amountClp || 0));
  const ufSubtitle = isWarning
    ? 'Preventivo sin recargo ($0)'
    : notice.ufEquivalent && notice.ufEquivalent !== 'Monto fijado' && notice.ufEquivalent !== 'Monto por definir'
    ? `Equivalencia: ${notice.ufEquivalent}`
    : 'Imputable en colilla mensual';

  const copyBadge =
    copyIndex === 0
      ? 'Ejemplar 1 · Residente / Unidad'
      : 'Ejemplar 2 · Conserjería / Registro';

  return (
    <div
      className="community-notice-card"
      style={{
        display: 'grid',
        gridTemplateColumns: '30.5% 69.5%',
        minHeight: 468,
        background: '#ffffff',
        border: '1px solid #c6d4cc',
        boxSizing: 'border-box',
        fontFamily: "'Segoe UI', Inter, -apple-system, BlinkMacSystemFont, sans-serif",
        color: '#0f172a'
      }}
    >
      {/* Panel Izquierdo Verde Corporativo con Filete Dorado y Resumen Operativo */}
      <div
        style={{
          background: '#0F3D2E',
          borderLeft: '5px solid #d4b895',
          padding: '14px 15px 12px 15px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          color: '#ffffff',
          boxSizing: 'border-box'
        }}
      >
        <div>
          <div style={{ textAlign: 'center', marginBottom: 10 }}>
            <img
              src="/brand/ARANPRO_logo_para_fondo_oscuro_trimmed.png"
              alt="ARANPRO"
              style={{ height: 42, maxWidth: '88%', width: 'auto', objectFit: 'contain', margin: '0 auto' }}
            />
          </div>

          {/* Bloque Dorado de Monto / Sanción */}
          <div
            style={{
              background: '#d4b895',
              color: '#0F3D2E',
              padding: '8.5px 11px',
              borderRadius: 5,
              marginBottom: 10
            }}
          >
            <div
              style={{
                fontSize: 8.2,
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: '#0F3D2E',
                marginBottom: 2
              }}
            >
              {isWarning ? 'Medida Aplicada' : 'Monto de la Multa'}
            </div>
            <div
              style={{
                fontSize: isWarning ? 15 : 22.5,
                fontWeight: 900,
                lineHeight: 1.08,
                color: '#0F3D2E',
                letterSpacing: '-0.02em'
              }}
            >
              {amountFormatted}
            </div>
            <div
              style={{
                fontSize: 8.2,
                fontWeight: 700,
                color: '#1e3a2f',
                marginTop: 2
              }}
            >
              {ufSubtitle}
            </div>
          </div>

          {/* Unidad Notificada */}
          <div
            style={{
              paddingBottom: 8,
              marginBottom: 8,
              borderBottom: '1px solid rgba(212, 184, 149, 0.24)'
            }}
          >
            <div
              style={{
                fontSize: 8.2,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#d4b895',
                marginBottom: 2
              }}
            >
              Unidad Sancionada
            </div>
            <div style={{ fontSize: 17.5, fontWeight: 900, color: '#ffffff', lineHeight: 1.12 }}>
              {unitLabel}
            </div>
            <div
              style={{
                fontSize: 8.8,
                color: '#dbe7e0',
                marginTop: 2.5,
                lineHeight: 1.25
              }}
            >
              {ownerName || 'Copropietario / Residente registrado'}
              {ownerRut ? <div style={{ fontSize: 8.2, color: '#b8cec2' }}>RUT: {ownerRut}</div> : null}
            </div>
          </div>

          {/* Ficha Resumen Sincronizada con el Formulario */}
          <div style={{ display: 'grid', gap: 5, fontSize: 8.2, lineHeight: 1.25 }}>
            <div>
              <span style={{ color: '#d4b895', fontWeight: 800, textTransform: 'uppercase', display: 'block', fontSize: 7.5 }}>
                Calificación de la Falta
              </span>
              <span style={{ color: '#ffffff', fontWeight: 700 }}>{conditionType}</span>
            </div>
            <div>
              <span style={{ color: '#d4b895', fontWeight: 800, textTransform: 'uppercase', display: 'block', fontSize: 7.5 }}>
                Modalidad de Imputación
              </span>
              <span style={{ color: '#f1f5f9', fontWeight: 600 }}>
                {isWarning
                  ? 'Registro en hoja de vida de la unidad'
                  : 'Cargo directo en colilla de gasto común'}
              </span>
            </div>
            <div>
              <span style={{ color: '#d4b895', fontWeight: 800, textTransform: 'uppercase', display: 'block', fontSize: 7.5 }}>
                Plazo de Descargos
              </span>
              <span style={{ color: '#f1f5f9', fontWeight: 600 }}>
                {appealTerm} ante Comité / Administración
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(212, 184, 149, 0.28)',
            paddingTop: 6,
            fontSize: 9.8,
            fontWeight: 800,
            color: '#ffffff'
          }}
        >
          <span>aranpro.cl</span>
          <span style={{ fontSize: 7.8, fontWeight: 700, color: '#d4b895' }}>residentes.aranpro.cl</span>
        </div>
      </div>

      {/* Panel Derecho Blanco con Párrafo Formal + Argumentación Parcial + Cuadro Legal Rojo */}
      <div
        style={{
          padding: '12px 18px 10px 18px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxSizing: 'border-box'
        }}
      >
        <div>
          <CommunityTopIdentity
            communityName={communityName}
            communityLogo={communityLogo}
            copyBadge={copyBadge}
            folio={folio}
          />

          <div style={{ marginBottom: 5 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div
                style={{
                  fontSize: 18.5,
                  fontWeight: 900,
                  color: '#0F3D2E',
                  lineHeight: 1.1,
                  letterSpacing: '-0.015em'
                }}
              >
                {isWarning ? 'Notificación formal de advertencia' : 'Notificación de multa reglamentaria'}
              </div>
              {/reincidencia|grave/i.test(conditionType) && (
                <span
                  style={{
                    fontSize: 7.6,
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: '#fee2e2',
                    color: '#991b1b',
                    border: '1px solid #fca5a5',
                    flexShrink: 0
                  }}
                >
                  {conditionType}
                </span>
              )}
            </div>
            <div style={{ height: 1.5, background: '#d4b895', marginTop: 4 }} />
          </div>

          {/* Párrafo solemne de notificación administrativa */}
          <p
            style={{
              margin: '0 0 5.5px 0',
              fontSize: 9,
              lineHeight: 1.32,
              color: '#334155',
              textAlign: 'justify'
            }}
          >
            {isWarning ? (
              <>
                La Administración de <strong>{communityName}</strong>, por mandato del Comité de Administración y la Ley N° 21.442, notifica formalmente <strong>apercibimiento preventivo</strong> al copropietario y/u ocupante de la <strong>{unitLabel}</strong> conforme a los siguientes antecedentes:
              </>
            ) : (
              <>
                La Administración de <strong>{communityName}</strong>, en ejercicio de las facultades conferidas por el Comité de Administración, el Reglamento de Copropiedad y la Ley N° 21.442, notifica a la <strong>{unitLabel}</strong> la aplicación de <strong>multa reglamentaria</strong> según el siguiente detalle:
              </>
            )}
          </p>

          {/* Recuadro Estructurado: Causal + Argumentación Parcial + Fecha/Norma/Respaldo */}
          <div
            style={{
              background: '#f8faf9',
              border: '1px solid #d5e2db',
              borderLeft: '3.5px solid #0F3D2E',
              borderRadius: 6,
              padding: '6px 9.5px',
              marginBottom: 6
            }}
          >
            <div style={{ marginBottom: partialArgument ? 3.5 : 4.5 }}>
              <div
                style={{
                  fontSize: 7.4,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: '#526b5e'
                }}
              >
                Causal e Infracción Constatada
              </div>
              <div
                style={{
                  fontSize: 10.2,
                  fontWeight: 800,
                  color: '#0F3D2E',
                  lineHeight: 1.24,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                {reason}
              </div>
            </div>

            {partialArgument ? (
              <div
                style={{
                  fontSize: 8.6,
                  lineHeight: 1.3,
                  color: '#1e293b',
                  textAlign: 'justify',
                  marginBottom: 4.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                <strong style={{ color: '#0F3D2E' }}>Antecedentes: </strong>
                {partialArgument}
              </div>
            ) : null}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '0.85fr 1.15fr 1fr',
                gap: 7,
                paddingTop: 4,
                borderTop: '1px solid #e2ece6',
                fontSize: 8.2,
                lineHeight: 1.22
              }}
            >
              <div>
                <span style={{ fontSize: 7.1, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block' }}>
                  Fecha / Hora Hecho
                </span>
                <strong style={{ color: '#1e293b' }}>{incidentWhen}</strong>
              </div>
              <div>
                <span style={{ fontSize: 7.1, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block' }}>
                  Norma Infringida
                </span>
                <strong style={{ color: '#1e293b' }}>{article}</strong>
              </div>
              <div>
                <span style={{ fontSize: 7.1, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block' }}>
                  Medio de Verificación
                </span>
                <strong style={{ color: '#1e293b' }}>{evidenceSource}</strong>
              </div>
            </div>
          </div>

          {/* CUADRO LEGAL ROJO DISTINTIVO (LEY N° 21.442) */}
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderLeft: '4px solid #b91c1c',
              borderRadius: 6,
              padding: '5.5px 9px',
              marginBottom: 4
            }}
          >
            <div
              style={{
                fontSize: 8,
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
                color: '#991b1b',
                marginBottom: 1.5
              }}
            >
              ⚖️ Fundamento Legal, Cobro Solidario y Apelación · Ley N° 21.442
            </div>
            <div
              style={{
                fontSize: 8.35,
                lineHeight: 1.29,
                color: '#450a0a',
                textAlign: 'justify'
              }}
            >
              {isWarning ? (
                <>
                  Emitida conforme a los <strong>Arts. 17°, 20° y 21° de la Ley N° 21.442</strong> y al Reglamento de Copropiedad. Todo copropietario u ocupante está obligado a respetar las normas de convivencia. Dispone de <strong>{appealTerm}</strong> para formular descargos en <strong>{contactEmail}</strong>; de persistir o repetirse la conducta, se cursará multa imputable en la colilla mensual.
                </>
              ) : (
                <>
                  Sanción cursada en virtud de los <strong>Arts. 17°, 20°, 21°, 27° y 37° de la Ley N° 21.442</strong> y el Reglamento Interno. El monto se incorpora a la colilla de gastos comunes vigente, respondiendo <strong>solidariamente propietario y arrendatario u ocupante</strong>. Dispone de <strong>{appealTerm}</strong> para presentar reconsideración o descargos fundados ante el Comité o en <strong>{contactEmail}</strong>, sin perjuicio de recurrir al Juzgado de Policía Local. La <strong>reincidencia</strong> faculta duplicar la multa reglamentaria.
                </>
              )}
            </div>
          </div>
        </div>

        <OfficialSealAndSignature
          companySettings={companySettings}
          copyIndex={copyIndex}
          showReceiptLine={true}
        />
      </div>
    </div>
  );
}

/**
 * MODELO B: AVISO DE VISITA DE ADMINISTRACIÓN / MANTENCIÓN TÉCNICA (Media Carta)
 * Panel izquierdo crema (#F5F4EF) con franja verde oscura, fecha grande y horario.
 */
function VisitHalfCard({ notice, community, companySettings, copyIndex }) {
  const communityName = community?.name || 'Condominio';
  const communityLogo = community?.documentLogo || community?.logo || '';
  const contactEmail = companySettings?.email || 'contacto@aranpro.cl';

  const visitDateSource = notice.visitDate || notice.expiresAt || notice.date || new Date().toISOString().slice(0, 10);
  const bigDate = formatBigDayMonth(visitDateSource);
  const fullVisitDate = formatLongDate(visitDateSource);
  const schedule = notice.visitTime || '10:00 a 12:00 h';
  const location = notice.location || 'Áreas comunes y accesos';
  const headline = notice.title || 'Visita de administración';
  const content =
    notice.content ||
    'Revisión presencial de instalaciones, accesos, equipamiento comunitario y seguimiento operativo junto a conserjería.';

  const copyBadge =
    copyIndex === 0
      ? 'Ejemplar 1 · Comunidad / Mural'
      : 'Ejemplar 2 · Conserjería / Registro';

  return (
    <div
      className="community-notice-card"
      style={{
        display: 'grid',
        gridTemplateColumns: '30.5% 69.5%',
        minHeight: 468,
        background: '#ffffff',
        border: '1px solid #c6d4cc',
        boxSizing: 'border-box',
        fontFamily: "'Segoe UI', Inter, -apple-system, BlinkMacSystemFont, sans-serif",
        color: '#0f172a'
      }}
    >
      {/* Panel Izquierdo Crema con Franja Verde */}
      <div
        style={{
          background: '#F5F4EF',
          borderLeft: '5px solid #0F3D2E',
          borderRight: '1px solid #e5e3dc',
          padding: '18px 16px 15px 16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxSizing: 'border-box'
        }}
      >
        <div>
          <div style={{ marginBottom: 20 }}>
            <img
              src="/brand/ARANPRO_logo_horizontal_transparente_trimmed.png"
              alt="ARANPRO"
              style={{ height: 34, maxWidth: '100%', width: 'auto', objectFit: 'contain' }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 8.8,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#526b5e',
                marginBottom: 3
              }}
            >
              Fecha Programada
            </div>
            <div
              style={{
                fontSize: 27,
                fontWeight: 900,
                color: '#0F3D2E',
                lineHeight: 1.05,
                letterSpacing: '-0.02em'
              }}
            >
              {bigDate}
            </div>
            <div style={{ fontSize: 9.2, fontWeight: 600, color: '#526b5e', marginTop: 2 }}>
              {fullVisitDate}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                fontSize: 8.8,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#526b5e',
                marginBottom: 2
              }}
            >
              Horario Estimado
            </div>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#0F3D2E', lineHeight: 1.2 }}>
              {schedule}
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: 8.5,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#526b5e',
                marginBottom: 2
              }}
            >
              Sector / Alcance
            </div>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#1e293b', lineHeight: 1.25 }}>
              {location}
            </div>
          </div>
        </div>

        <div
          style={{
            borderTop: '1px solid #dcd9cf',
            paddingTop: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 10.5,
            fontWeight: 800,
            color: '#0F3D2E'
          }}
        >
          <span>aranpro.cl</span>
          <span style={{ fontSize: 8.2, fontWeight: 700, color: '#64748b' }}>Gestión en terreno</span>
        </div>
      </div>

      {/* Panel Derecho Blanco */}
      <div
        style={{
          padding: '15px 20px 13px 20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxSizing: 'border-box'
        }}
      >
        <div>
          <CommunityTopIdentity
            communityName={communityName}
            communityLogo={communityLogo}
            copyBadge={copyBadge}
            folio={null}
          />

          <div style={{ marginBottom: 10 }}>
            <div
              style={{
                fontSize: 21,
                fontWeight: 900,
                color: '#0F3D2E',
                lineHeight: 1.15,
                letterSpacing: '-0.015em'
              }}
            >
              {headline}
            </div>
            <div style={{ fontSize: 10.8, color: '#475569', marginTop: 2 }}>
              Aviso oficial a residentes, comité y conserjería
            </div>
            <div style={{ height: 1.5, background: '#d4b895', marginTop: 8 }} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                fontSize: 8.8,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: '#526b5e',
                marginBottom: 4
              }}
            >
              Motivo y detalle de la actividad
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#0F3D2E',
                lineHeight: 1.42,
                whiteSpace: 'pre-line',
                display: '-webkit-box',
                WebkitLineClamp: 5,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              {content}
            </div>
          </div>

          <div
            style={{
              background: '#f8faf9',
              border: '1px solid #dce6e0',
              borderRadius: 8,
              padding: '8px 12px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10
            }}
          >
            <div>
              <div style={{ fontSize: 9.5, color: '#334155' }}>
                Para consultas o coordinación previa:
              </div>
              <div style={{ fontSize: 10.8, fontWeight: 800, color: '#0F3D2E', marginTop: 1 }}>
                {contactEmail}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#0F3D2E' }}>
                Ingresa al portal de tu comunidad
              </div>
              <div style={{ fontSize: 9.2, color: '#526b5e', marginTop: 1 }}>
                residentes.aranpro.cl · disponible en tu navegador
              </div>
            </div>
          </div>
        </div>

        <OfficialSealAndSignature
          companySettings={companySettings}
          copyIndex={copyIndex}
          showReceiptLine={true}
        />
      </div>
    </div>
  );
}

/**
 * MODELO C: AFICHE BREVE DE CONVIVENCIA / COMUNICADO MURAL (Media Carta)
 * Panel de color verde oscuro al costado DERECHO con línea divisoria dorada.
 */
function CoexistenceHalfCard({ notice, community, companySettings, copyIndex }) {
  const communityName = community?.name || 'Condominio';
  const communityLogo = community?.documentLogo || community?.logo || '';
  const contactEmail = companySettings?.email || 'contacto@aranpro.cl';

  const title = notice.title || 'Cuidemos la buena convivencia';
  const content =
    notice.content ||
    'Mantengamos el respeto por los espacios comunes, horarios de descanso y normas del condominio.';
  const dateFormatted = formatShortDate(notice.date || new Date().toISOString().slice(0, 10));
  const directedTo = notice.location || 'Toda la comunidad';
  const calloutHeader =
    notice.priority === 'Urgente'
      ? 'AVISO URGENTE A LA COMUNIDAD'
      : 'PARA UNA BUENA CONVIVENCIA';

  return (
    <div
      className="community-notice-card"
      style={{
        display: 'grid',
        gridTemplateColumns: '69.5% 30.5%',
        minHeight: 468,
        background: '#ffffff',
        border: '1px solid #c6d4cc',
        boxSizing: 'border-box',
        fontFamily: "'Segoe UI', Inter, -apple-system, BlinkMacSystemFont, sans-serif",
        color: '#0f172a'
      }}
    >
      {/* Panel Izquierdo Blanco */}
      <div
        style={{
          padding: '16px 22px 13px 22px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxSizing: 'border-box'
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 9.2,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#526b5e'
                }}
              >
                Comunicación a Residentes
              </div>
              <div
                style={{
                  width: 38,
                  height: 3,
                  background: '#c5a272',
                  marginTop: 4,
                  borderRadius: 2
                }}
              />
            </div>

            <span
              style={{
                fontSize: 7.8,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                padding: '2px 7px',
                borderRadius: 999,
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                color: '#475569'
              }}
            >
              {copyIndex === 0 ? 'Ejemplar 1 · Vitrina / Mural' : 'Ejemplar 2 · Conserjería / Acceso'}
            </span>
          </div>

          <div
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: '#0F3D2E',
              lineHeight: 1.14,
              letterSpacing: '-0.015em',
              marginBottom: 4
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: 10.8, color: '#526b5e', marginBottom: 12 }}>
            Una comunidad tranquila, segura y ordenada la construimos entre todos.
          </div>

          {/* Recuadro Verde Suave Redondeado para el Mensaje */}
          <div
            style={{
              background: '#ecf5ef',
              borderRadius: 10,
              padding: '12px 15px',
              marginBottom: 11
            }}
          >
            <div
              style={{
                fontSize: 9.2,
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: '#0F3D2E',
                marginBottom: 5
              }}
            >
              {calloutHeader}
            </div>
            <div
              style={{
                fontSize: 11.6,
                fontWeight: 600,
                color: '#133b2d',
                lineHeight: 1.42,
                whiteSpace: 'pre-line',
                display: '-webkit-box',
                WebkitLineClamp: 6,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}
            >
              {content}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10.5, fontWeight: 800, color: '#0F3D2E' }}>
              ¿Tienes alguna consulta?
            </div>
            <div style={{ fontSize: 9.8, color: '#526b5e', marginTop: 1 }}>
              Contacta a la administración en <strong>{contactEmail}</strong> o ingresa a tu portal vecinal.
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #dce6e0', paddingTop: 6, marginTop: 8 }}>
          <OfficialSealAndSignature
            companySettings={companySettings}
            copyIndex={copyIndex}
            showReceiptLine={false}
          />
        </div>
      </div>

      {/* Panel Derecho Verde Oscuro con Divisor Dorado */}
      <div
        style={{
          background: '#0F3D2E',
          borderLeft: '3.5px solid #d4b895',
          padding: '18px 16px 15px 16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          color: '#ffffff',
          boxSizing: 'border-box'
        }}
      >
        <div>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <img
              src="/brand/ARANPRO_logo_para_fondo_oscuro_trimmed.png"
              alt="ARANPRO"
              style={{ height: 48, maxWidth: '90%', width: 'auto', objectFit: 'contain', margin: '0 auto' }}
            />
          </div>

          <div
            style={{
              paddingBottom: 12,
              marginBottom: 12,
              borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <div
              style={{
                fontSize: 8.2,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#d4b895',
                marginBottom: 2
              }}
            >
              Comunidad
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>
              {communityName.replace(/^Condominio\s+/i, '')}
            </div>
            {communityLogo ? (
              <div
                style={{
                  marginTop: 7,
                  background: '#ffffff',
                  borderRadius: 6,
                  padding: '4px 8px',
                  display: 'inline-block'
                }}
              >
                <img
                  src={communityLogo}
                  alt={communityName}
                  style={{ height: 28, maxWidth: 96, width: 'auto', objectFit: 'contain', display: 'block' }}
                />
              </div>
            ) : (
              <div style={{ fontSize: 8.5, color: '#b7cec3', marginTop: 4, lineHeight: 1.25 }}>
                Comunicado oficial de copropiedad
              </div>
            )}
          </div>

          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                fontSize: 8.2,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#d4b895',
                marginBottom: 2
              }}
            >
              Fecha
            </div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#ffffff' }}>{dateFormatted}</div>
          </div>

          <div>
            <div
              style={{
                fontSize: 8.2,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#d4b895',
                marginBottom: 2
              }}
            >
              Dirigido a
            </div>
            <div style={{ fontSize: 11.5, fontWeight: 800, color: '#ffffff', lineHeight: 1.25 }}>
              {directedTo}
            </div>
          </div>
        </div>

        <div
          style={{
            borderTop: '1px solid rgba(212, 184, 149, 0.28)',
            paddingTop: 8
          }}
        >
          <div
            style={{
              fontSize: 8,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#d4b895'
            }}
          >
            Ingresa a la App
          </div>
          <div style={{ fontSize: 10.2, color: '#e2ece7', marginTop: 1 }}>
            residentes.aranpro.cl
          </div>
          <div style={{ fontSize: 10.5, fontWeight: 800, color: '#ffffff', marginTop: 2 }}>
            aranpro.cl
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hoja Carta completa con 2 ejemplares Media Carta separados por línea de corte.
 */
export function CommunityNoticeSheet({
  id = 'printable-community-notice-sheet',
  notice = {},
  community,
  companySettings
}) {
  const activeVariant = resolveNoticeVariant(notice);

  const renderHalf = (copyIndex) => {
    if (activeVariant === 'fine') {
      return (
        <FineOrWarningHalfCard
          notice={notice}
          community={community}
          companySettings={companySettings}
          copyIndex={copyIndex}
          isWarning={false}
        />
      );
    }
    if (activeVariant === 'warning') {
      return (
        <FineOrWarningHalfCard
          notice={notice}
          community={community}
          companySettings={companySettings}
          copyIndex={copyIndex}
          isWarning={true}
        />
      );
    }
    if (activeVariant === 'visit') {
      return (
        <VisitHalfCard
          notice={notice}
          community={community}
          companySettings={companySettings}
          copyIndex={copyIndex}
        />
      );
    }
    return (
      <CoexistenceHalfCard
        notice={notice}
        community={community}
        companySettings={companySettings}
        copyIndex={copyIndex}
      />
    );
  };

  return (
    <div
      id={id}
      data-pdf-style="neutral"
      className="community-notice-sheet"
      style={{
        width: '100%',
        maxWidth: 816,
        margin: '0 auto',
        background: '#ffffff',
        padding: '14px 16px',
        boxSizing: 'border-box',
        borderRadius: 12,
        boxShadow: '0 6px 24px rgba(15, 23, 42, 0.08)'
      }}
    >
      {/* Ejemplar Superior (1/2 Carta) */}
      {renderHalf(0)}

      {/* Línea de corte central entre ambos ejemplares */}
      <div
        className="community-notice-cutline"
        style={{
          height: 34,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}
      >
        <div
          style={{
            width: '100%',
            borderTop: '1.5px dashed #94a3b8'
          }}
        />
      </div>

      {/* Ejemplar Inferior (1/2 Carta) */}
      {renderHalf(1)}
    </div>
  );
}

/**
 * Modal interactivo de Vista Previa + Impresión Media Carta (2 copias por Hoja Carta).
 * Garantiza 100% paridad entre lo que ve el administrador y el PDF impreso.
 */
export function CommunityNoticePreviewModal({
  isOpen,
  onClose,
  notice,
  community,
  companySettings,
  allowStyleSwitch = false
}) {
  const initialVariant = resolveNoticeVariant(notice || {});
  const [selectedVariant, setSelectedVariant] = useState(initialVariant);

  useEffect(() => {
    setSelectedVariant(resolveNoticeVariant(notice || {}));
  }, [notice]);

  if (!isOpen || !notice) return null;

  const effectiveNotice = allowStyleSwitch
    ? { ...notice, variant: selectedVariant }
    : notice;

  const commSlug = String(community?.name || 'Condominio').replace(/\s+/g, '_');
  const titleSlug = String(
    effectiveNotice.unitLabel || effectiveNotice.title || effectiveNotice.folio || 'Aviso'
  )
    .slice(0, 28)
    .replace(/[^a-zA-Z0-9_-]+/g, '_');
  const prefix =
    effectiveNotice.variant === 'fine'
      ? 'Notificacion_Multa'
      : effectiveNotice.variant === 'warning'
      ? 'Notificacion_Advertencia'
      : effectiveNotice.variant === 'visit'
      ? 'Aviso_Visita'
      : 'Afiche_Convivencia';

  const filename = `ARANPRO_${prefix}_${titleSlug}_${commSlug}`;
  const sheetDomId = 'modal-printable-community-notice-sheet';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* Barra de control superior (no se imprime, solo se imprime el nodo sheetDomId) */}
        <div className="px-5 py-3.5 bg-[#0F3D2E] text-white flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 text-[#D4B895] rounded-xl">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black tracking-tight flex items-center gap-2">
                <span>Vista Previa Oficial · Formato Media Carta (2 Copias por Hoja)</span>
              </h4>
              <p className="text-[11px] text-[#D4B895]">
                Ejemplar 1 para Residente / Mural y Ejemplar 2 para Conserjería, Comité o Libro de Registro
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {allowStyleSwitch && (
              <div className="flex items-center bg-white/10 p-1 rounded-xl border border-white/15 text-[11px]">
                <LayoutTemplate className="w-3.5 h-3.5 text-[#D4B895] ml-1.5 mr-1" />
                <button
                  type="button"
                  onClick={() => setSelectedVariant('convivencia')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                    selectedVariant === 'convivencia'
                      ? 'bg-[#D4B895] text-[#0F3D2E]'
                      : 'text-white/85 hover:text-white'
                  }`}
                >
                  Afiche Convivencia
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedVariant('visit')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                    selectedVariant === 'visit'
                      ? 'bg-[#D4B895] text-[#0F3D2E]'
                      : 'text-white/85 hover:text-white'
                  }`}
                >
                  Aviso de Visita
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => printCommunityNoticeSheet(sheetDomId, filename)}
              className="px-4 py-2 bg-[#D4B895] hover:bg-[#c5a67e] text-[#0F3D2E] font-black text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / PDF Carta (2 Copias)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-white/75 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              title="Cerrar vista previa"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Lienzo de vista previa idéntico al PDF en Hoja Carta */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100">
          <CommunityNoticeSheet
            id={sheetDomId}
            notice={effectiveNotice}
            community={community}
            companySettings={companySettings}
          />
        </div>
      </div>
    </div>
  );
}
