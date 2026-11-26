import React from 'react';
import { PortalCode } from './IndividualExpenseBill';
import { formatCLP, formatRut } from '../../utils/formatters';
import { verificationUrl } from '../../services/documentRegistry';
import { printDocumentDirectly } from '../../utils/printDocument';

const MONTHS_LONG = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

const MONTHS_SHORT = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic'
];

function parseIsoParts(dateStr) {
  if (!dateStr) return null;
  const clean = String(dateStr).slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(clean);
  if (!match) return null;
  const year = Number(match[1]);
  const monthIdx = Number(match[2]) - 1;
  const day = Number(match[3]);
  if (monthIdx < 0 || monthIdx > 11) return null;
  return { year, monthIdx, day, dayPadded: match[3] };
}

function formatLongEsDate(dateStr) {
  const parts = parseIsoParts(dateStr);
  if (!parts) return dateStr || 'Sin fecha';
  return `${parts.day} de ${MONTHS_LONG[parts.monthIdx]} de ${parts.year}`;
}

function formatShortEsDate(dateStr) {
  const parts = parseIsoParts(dateStr);
  if (!parts) return dateStr || 'Sin fecha';
  return `${parts.dayPadded} ${MONTHS_SHORT[parts.monthIdx]} ${parts.year}`;
}

function formatAliquotDisplay(val) {
  if (val === null || val === undefined || String(val).trim() === '') return 'Sin informar';
  const num = Number(String(val).replace(',', '.'));
  if (!Number.isFinite(num)) return `${val} %`;
  return `${num.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} %`;
}

function getUnitPrefix(communityType) {
  if (communityType === 'Edificio') return 'Depto.';
  if (communityType === 'Locales Comerciales') return 'Local';
  if (communityType === 'Mixto') return 'Unidad';
  return 'Casa';
}

function resolveCertificateKind(typeStr = '') {
  if (/Residencia/i.test(typeStr)) return 'residencia';
  if (/No Deuda|al Día/i.test(typeStr)) return 'no_deuda';
  if (/Estado de Deuda|Morosa/i.test(typeStr)) return 'deuda';
  if (/Alícuota|Alicuota|Prorrateo/i.test(typeStr)) return 'alicuota';
  if (/Mudanza|Salvoconducto/i.test(typeStr)) return 'mudanza';
  if (/Comité|Comite/i.test(typeStr)) return 'comite';
  if (/Convivencia|Infraccion/i.test(typeStr)) return 'convivencia';
  return 'general';
}

function resolveHeaderTitle(kind, rawType) {
  switch (kind) {
    case 'residencia':
      return 'Certificado de Residencia y Domicilio';
    case 'no_deuda':
      return 'Certificado de Gastos Comunes al Día';
    case 'deuda':
      return 'Certificado de Estado de Deuda';
    case 'alicuota':
      return 'Constancia de Alícuota y Copropiedad';
    case 'mudanza':
      return 'Constancia y Autorización de Mudanza';
    case 'comite':
      return 'Certificado de Integrante del Comité';
    case 'convivencia':
      return 'Certificado de Buena Convivencia';
    default:
      return String(rawType || 'Certificado Oficial');
  }
}

/**
 * Recuadro central redondeado con sombreado suave y filete curvo verde bosque a la izquierda
 */
function HighlightedCertCard({ heading, leadParagraph, rows = [] }) {
  return (
    <div
      className="cert-highlight-card"
      style={{
        background: '#f3f6f4',
        borderRadius: 14,
        borderLeft: '4.5px solid #0F3D2E',
        boxShadow: '0 3px 10px rgba(15, 61, 46, 0.06)',
        padding: '15px 20px',
        marginTop: 2,
        marginBottom: 2
      }}
    >
      <div
        style={{
          fontSize: 11.5,
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          color: '#0F3D2E',
          marginBottom: leadParagraph ? 7 : 10
        }}
      >
        {heading}
      </div>

      {leadParagraph && (
        <p
          style={{
            margin: rows.length > 0 ? '0 0 12px 0' : 0,
            fontSize: 13,
            lineHeight: 1.6,
            color: '#1e293b'
          }}
        >
          {leadParagraph}
        </p>
      )}

      {rows.length > 0 && (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #dce7e0',
            borderRadius: 10,
            padding: '10px 14px'
          }}
        >
          {rows.map((pair, rowIdx) => (
            <div
              key={rowIdx}
              style={{
                display: 'grid',
                gridTemplateColumns: '1.35fr 1fr',
                gap: 16,
                paddingTop: rowIdx === 0 ? 2 : 8,
                paddingBottom: rowIdx < rows.length - 1 ? 8 : 2,
                borderBottom: rowIdx < rows.length - 1 ? '1px solid #e6efe9' : 'none'
              }}
            >
              {pair.map(([label, value], colIdx) => (
                <div key={colIdx}>
                  <div
                    style={{
                      fontSize: 9.5,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      color: '#5b7266',
                      marginBottom: 2
                    }}
                  >
                    {label}
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F3D2E', lineHeight: 1.25 }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function printCommunityCertificate(id, filename) {
  printDocumentDirectly(id, filename, {
    pageSize: 'letter portrait',
    margin: '7mm 9mm',
    pdfStyle: 'neutral',
    useBundledStyles: true,
    waitForAssets: true,
    extraStyles: `
      @media print {
        html, body {
          background: #ffffff !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .community-certificate {
          max-width: none !important;
          width: 100% !important;
          box-shadow: none !important;
        }
        .community-certificate-inner {
          min-height: 256mm !important;
        }
        .community-certificate .cert-top-banner {
          display: grid !important;
          background: #103f32 !important;
          color: #ffffff !important;
          border-bottom: 4px solid #c5a272 !important;
          break-inside: avoid !important;
        }
        .community-certificate .cert-highlight-card,
        .community-certificate .cert-bottom-footer {
          break-inside: avoid !important;
        }
      }
    `
  });
}

export function CommunityCertificate({ id, cert = {}, community = {}, company = {} }) {
  const kind = resolveCertificateKind(cert.type);
  const headerTitle = resolveHeaderTitle(kind, cert.type);
  const isRevoked = cert.status === 'ANULADO' || cert.revoked === true;
  const isRegistered = Boolean(cert.registered && !isRevoked);
  const url = isRegistered ? verificationUrl(cert) : '';

  const communityName = cert.communityName || community?.name || 'Comunidad';
  const unitPrefix = getUnitPrefix(community?.type);
  const rawUnit = String(cert.unitNumber || '').trim();
  const matchedUnit = (community?.units || []).find((u) => String(u.number) === rawUnit);
  const unitLabel = rawUnit
    ? /^(casa|depto|departamento|unidad|local)/i.test(rawUnit)
      ? rawUnit
      : `${unitPrefix} ${rawUnit}${matchedUnit?.tower ? ` · ${matchedUnit.tower}` : ''}`
    : 'Unidad sin informar';

  const applicantName = cert.applicantName || matchedUnit?.owner || 'Titular no informado';
  const formattedRut = cert.rut ? formatRut(cert.rut) : matchedUnit?.rut ? formatRut(matchedUnit.rut) : 'Sin informar';
  const rawAddress = community?.address || '';
  const communeName =
    community?.commune ||
    (community?.city ? String(community.city).split('/')[0].trim() : '') ||
    'Sin informar';
  const fullDomicile = [rawAddress, unitLabel].filter(Boolean).join(', ');

  const issueDateLong = formatLongEsDate(cert.date);
  const issueDateShort = formatShortEsDate(cert.date);
  const expiresLabel = isRevoked
    ? 'Documento anulado'
    : isRegistered && cert.expiresAt
    ? formatLongEsDate(cert.expiresAt)
    : cert.status === 'SOLICITADO'
    ? 'Solicitud pendiente'
    : 'Sin registro digital';

  const issuerName =
    cert.issuedBy ||
    company?.administratorName ||
    company?.adminName ||
    'Administración ARANPRO';
  const signatureImg = company?.signatureDataUrl || company?.signature || company?.digitalSignature || '';

  const debtAmount = Number(cert.debtAmount || 0);
  const breakdown = cert.debtBreakdown || {};
  const hasBreakdown =
    Number(breakdown.currentCharge || 0) > 0 ||
    Number(breakdown.previousDebt || 0) > 0 ||
    Number(breakdown.extraCharge || 0) > 0 ||
    Number(breakdown.repactedInstallment || 0) > 0;

  const aliquotValue =
    cert.aliquotPercent !== undefined && cert.aliquotPercent !== ''
      ? cert.aliquotPercent
      : matchedUnit?.aliquot ?? matchedUnit?.sharePercentage ?? '';

  const hasConvenio = Boolean(matchedUnit?.repactacion?.active);
  const committeeRole = matchedUnit?.committeeRole || 'Integrante';

  return (
    <div id={id} data-pdf-style="neutral">
      <article
        className="community-certificate bg-white mx-auto max-w-3xl text-slate-900"
        style={{
          borderLeft: '4.5px solid #103f32',
          paddingLeft: 3,
          fontFamily: "'Segoe UI', Arial, Helvetica, sans-serif",
          overflowWrap: 'anywhere'
        }}
      >
        <div
          className="community-certificate-inner"
          style={{
            borderLeft: '2px solid #c5a272',
            padding: '14px 22px 12px 22px',
            minHeight: '246mm',
            display: 'flex',
            flexDirection: 'column',
            gap: 13,
            background: '#ffffff'
          }}
        >
          {/* BARRA SUPERIOR CON CUADRO VERDE, SOMBREADO DORADO INFERIOR, LOGO ARANPRO IZQ Y LOGO COMUNIDAD DER */}
          <div
            className="cert-top-banner"
            style={{
              display: 'grid',
              gridTemplateColumns: '108px 1fr 108px',
              gap: 12,
              alignItems: 'center',
              background: '#103f32',
              color: '#ffffff',
              padding: '14px 18px',
              borderRadius: 12,
              borderBottom: '4px solid #c5a272',
              boxShadow: '0 4px 12px rgba(197, 162, 114, 0.25)'
            }}
          >
            {/* Izquierda: Logo ARANPRO */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
              <img
                src="/brand/ARANPRO_logo_para_fondo_oscuro_trimmed.png"
                alt="ARANPRO Gestión Integral"
                style={{ height: 48, maxWidth: 104, width: 'auto', objectFit: 'contain' }}
              />
            </div>

            {/* Centro: Título del Certificado + Nombre Comunidad */}
            <div style={{ textAlign: 'center', padding: '0 4px' }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: 20,
                  fontWeight: 800,
                  lineHeight: 1.18,
                  color: '#ffffff',
                  letterSpacing: '-0.01em'
                }}
              >
                {headerTitle}
              </h1>
              <p
                style={{
                  margin: '5px 0 0 0',
                  color: '#ead7bd',
                  fontSize: 12.5,
                  fontWeight: 600
                }}
              >
                {communityName}
              </p>
            </div>

            {/* Derecha: Logo de la Comunidad */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              {community?.documentLogo ? (
                <div
                  style={{
                    width: 54,
                    height: 50,
                    borderRadius: 9,
                    background: '#ffffff',
                    padding: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
                    boxSizing: 'border-box'
                  }}
                >
                  <img
                    src={community.documentLogo}
                    alt={`Logo ${communityName}`}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    width: 54,
                    height: 50,
                    borderRadius: 9,
                    border: '1px solid rgba(234, 215, 189, 0.35)',
                    background: 'rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    color: '#ead7bd',
                    fontSize: 7.5,
                    fontWeight: 700,
                    lineHeight: 1.2,
                    textTransform: 'uppercase'
                  }}
                >
                  Logo
                  <br />
                  Comunidad
                </div>
              )}
            </div>
          </div>

          {/* FRANJA DE METADATOS SUAVE: Folio · Fecha de emisión · Válido hasta */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.45fr 1fr 1fr',
              gap: 12,
              background: '#eef4ef',
              borderRadius: 10,
              padding: '10px 14px',
              border: '1px solid #dce8df'
            }}
          >
            <div>
              <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', color: '#526b5e', letterSpacing: '0.03em' }}>
                Folio
              </div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#103f32', marginTop: 2, fontFamily: 'ui-monospace, Consolas, monospace' }}>
                {cert.folio || 'SIN FOLIO'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', color: '#526b5e', letterSpacing: '0.03em' }}>
                Fecha de emisión
              </div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#103f32', marginTop: 2 }}>
                {issueDateLong}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', color: '#526b5e', letterSpacing: '0.03em' }}>
                {kind === 'mudanza' ? 'Constancia válida hasta' : 'Válido hasta'}
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: isRevoked ? '#b91c1c' : isRegistered ? '#103f32' : '#92400e',
                  marginTop: 2
                }}
              >
                {expiresLabel}
              </div>
            </div>
          </div>

          {/* AVISO VISIBLE SOLO CUANDO AÚN NO TIENE REGISTRO EN LÍNEA O ESTÁ ANULADO */}
          {!isRegistered && (
            <div
              style={{
                background: isRevoked ? '#fef2f2' : '#fffbeb',
                border: `1px solid ${isRevoked ? '#fecaca' : '#fde68a'}`,
                color: isRevoked ? '#991b1b' : '#92400e',
                borderRadius: 9,
                padding: '7px 12px',
                fontSize: 11,
                fontWeight: 700
              }}
            >
              {isRevoked
                ? 'DOCUMENTO ANULADO: Este certificado fue revocado por la administración y carece de validez.'
                : cert.status === 'SOLICITADO'
                ? 'SOLICITUD PENDIENTE DE EMISIÓN: Borrador aún no firmado en línea. Pulse «Activar QR» para registrarlo.'
                : 'DOCUMENTO HISTÓRICO O DE DEMOSTRACIÓN: Copia sin registro digital activo. Pulse «Activar QR» para habilitar su verificación.'}
            </div>
          )}

          {/* ==================== CUERPO SEGÚN TIPO DE CERTIFICADO ==================== */}

          {/* 1. CERTIFICADO DE RESIDENCIA */}
          {kind === 'residencia' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11, fontSize: 12.8, lineHeight: 1.56, color: '#1e293b' }}>
              <HighlightedCertCard
                heading="La administración certifica • Identificación y domicilio registrado"
                leadParagraph={
                  <>
                    Según el registro oficial de <strong>{communityName}</strong>, don(a) <strong>{applicantName}</strong> figura como
                    residente de la <strong>{unitLabel}</strong> al {issueDateLong}. Se extiende el presente certificado a solicitud de
                    la persona interesada para ser presentado ante{' '}
                    <strong>
                      {cert.purpose && cert.purpose !== 'Trámite Notarial / Bancario'
                        ? cert.purpose
                        : 'la entidad que requiere constancia de su domicilio'}
                    </strong>
                    .
                  </>
                }
                rows={[
                  [
                    ['Titular', applicantName],
                    ['RUT', formattedRut]
                  ],
                  [
                    ['Domicilio registrado', fullDomicile || unitLabel],
                    ['Comuna', communeName]
                  ]
                ]}
              />

              <div>
                <h3 style={{ fontSize: 13.5, fontWeight: 800, color: '#103f32', margin: '2px 0 3px 0' }}>
                  Fundamento de la constancia
                </h3>
                <p style={{ margin: 0, fontSize: 12.1 }}>
                  La administración mantiene el registro de copropietarios, arrendatarios y demás ocupantes conforme al artículo 9,
                  inciso quinto, numeral 6, de la Ley N° 21.442. Los artículos 5 y 6 de su reglamento regulan la incorporación de las
                  personas y los antecedentes que permiten identificarlas y vincularlas con su unidad.
                </p>
              </div>

              <div>
                <h3 style={{ fontSize: 13.5, fontWeight: 800, color: '#103f32', margin: '2px 0 3px 0' }}>
                  Vigencia y actualización
                </h3>
                <p style={{ margin: 0, fontSize: 12.1 }}>
                  Esta constancia refleja la información registrada al momento de su emisión y tiene una vigencia de 30 días. Si cambia de
                  domicilio o advierte un error en sus datos, el titular puede solicitar a la administración que actualice el registro y
                  emita un nuevo certificado.
                </p>
              </div>
            </div>
          )}

          {/* 2. GASTOS COMUNES AL DÍA */}
          {kind === 'no_deuda' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11, fontSize: 12.8, lineHeight: 1.56, color: '#1e293b' }}>
              <HighlightedCertCard
                heading="La administración certifica • Estado de cuenta al día"
                leadParagraph={
                  <>
                    De acuerdo con los registros contables de la administración, la unidad <strong>{unitLabel}</strong> de{' '}
                    <strong>{communityName}</strong>, asociada a <strong>{applicantName}</strong>
                    {formattedRut !== 'Sin informar' ? ` (RUT ${formattedRut})` : ''}, presenta un saldo pendiente de{' '}
                    <strong>{formatCLP(debtAmount)}</strong> al {issueDateLong}, encontrándose al día respecto de los cargos y pagos
                    registrados hasta esa fecha.
                  </>
                }
                rows={[
                  [
                    ['Unidad y titular', `${unitLabel} · ${applicantName}`],
                    ['Saldo pendiente', formatCLP(debtAmount)]
                  ],
                  [
                    ['Fecha de corte', issueDateLong],
                    ['Convenio', hasConvenio ? 'Convenio registrado al día' : 'Sin convenio registrado']
                  ]
                ]}
              />

              <div>
                <h3 style={{ fontSize: 13.5, fontWeight: 800, color: '#103f32', margin: '2px 0 3px 0' }}>
                  Antecedentes revisados
                </h3>
                <p style={{ margin: 0, fontSize: 12.1 }}>
                  La revisión considera los cargos ordinarios, extraordinarios, fondo de reserva, pagos y ajustes incorporados al estado
                  de cuenta de la unidad hasta la fecha de corte.{' '}
                  {hasConvenio
                    ? 'Se verificó el cumplimiento de las cuotas vencidas del convenio registrado.'
                    : 'No registra convenio de pago pendiente a la fecha de emisión.'}
                </p>
              </div>

              <div>
                <h3 style={{ fontSize: 13.5, fontWeight: 800, color: '#103f32', margin: '2px 0 3px 0' }}>
                  Alcance del certificado
                </h3>
                <p style={{ margin: 0, fontSize: 12.1 }}>
                  El certificado refleja la información disponible a la fecha de corte y tiene una vigencia de 30 días. Los cargos y pagos
                  posteriores pueden modificar el estado de la cuenta.
                  {cert.purpose ? ` Extendido para presentar ante: ${cert.purpose}.` : ''}
                </p>
              </div>
            </div>
          )}

          {/* 3. CERTIFICADO DE ESTADO DE DEUDA */}
          {kind === 'deuda' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12.6, lineHeight: 1.52, color: '#1e293b' }}>
              <HighlightedCertCard
                heading="La administración certifica • Estado de deuda exigible"
                leadParagraph={
                  <>
                    De acuerdo con los registros oficiales de <strong>{communityName}</strong>
                    {rawAddress ? ` (${rawAddress})` : ''}, la unidad <strong>{unitLabel}</strong>, asociada a{' '}
                    <strong>{applicantName}</strong> (RUT {formattedRut}), registra un saldo pendiente exigible de{' '}
                    <strong style={{ color: '#991b1b' }}>{formatCLP(debtAmount)}</strong> a la fecha de corte ({issueDateLong}), conforme
                    a los artículos 20° y 36° de la Ley N° 21.442.
                  </>
                }
              />

              <div style={{ background: '#f8faf9', border: '1px solid #d4e4da', borderRadius: 12, padding: '11px 16px' }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', color: '#103f32', marginBottom: 7 }}>
                  Detalle del saldo registrado
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <tbody>
                    {hasBreakdown ? (
                      <>
                        <tr>
                          <td style={{ padding: '3.5px 0', color: '#475569' }}>Cuota del período</td>
                          <td style={{ padding: '3.5px 0', textAlign: 'right', fontWeight: 700 }}>{formatCLP(breakdown.currentCharge || 0)}</td>
                        </tr>
                        {Number(breakdown.extraCharge || 0) > 0 && (
                          <tr>
                            <td style={{ padding: '3.5px 0', color: '#475569' }}>Cargos individuales / multas</td>
                            <td style={{ padding: '3.5px 0', textAlign: 'right', fontWeight: 700 }}>{formatCLP(breakdown.extraCharge)}</td>
                          </tr>
                        )}
                        {Number(breakdown.previousDebt || 0) > 0 && (
                          <tr>
                            <td style={{ padding: '3.5px 0', color: '#475569' }}>Saldo anterior fuera de convenio</td>
                            <td style={{ padding: '3.5px 0', textAlign: 'right', fontWeight: 700 }}>{formatCLP(breakdown.previousDebt)}</td>
                          </tr>
                        )}
                        {Number(breakdown.repactedInstallment || 0) > 0 && (
                          <tr>
                            <td style={{ padding: '3.5px 0', color: '#475569' }}>Cuota exigible de convenio</td>
                            <td style={{ padding: '3.5px 0', textAlign: 'right', fontWeight: 700 }}>{formatCLP(breakdown.repactedInstallment)}</td>
                          </tr>
                        )}
                      </>
                    ) : (
                      <tr>
                        <td style={{ padding: '3.5px 0', color: '#475569' }}>Gastos comunes y cargos devengados acumulados</td>
                        <td style={{ padding: '3.5px 0', textAlign: 'right', fontWeight: 700 }}>{formatCLP(debtAmount)}</td>
                      </tr>
                    )}
                    <tr style={{ borderTop: '1.5px solid #cbd5e1' }}>
                      <td style={{ paddingTop: 6, fontWeight: 800, color: '#103f32' }}>TOTAL PENDIENTE</td>
                      <td style={{ paddingTop: 6, textAlign: 'right', fontWeight: 800, color: '#991b1b', fontSize: 13.5 }}>
                        {formatCLP(debtAmount)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style={{ fontSize: 11.8, color: '#334155' }}>
                <strong style={{ color: '#103f32' }}>Alcance legal (Art. 36° Ley N° 21.442):</strong> La obligación del propietario por los
                gastos comunes sigue siempre al dominio de su unidad. En caso de compraventa o transferencia, corresponde retener o pagar
                el saldo certificado para liberar de responsabilidad solidaria al adquirente. Vigencia: 30 días.
              </div>
            </div>
          )}

          {/* 4. CONSTANCIA DE ALÍCUOTA */}
          {kind === 'alicuota' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11, fontSize: 12.8, lineHeight: 1.56, color: '#1e293b' }}>
              <HighlightedCertCard
                heading="La administración certifica • Derechos de alícuota y prorrateo"
                leadParagraph={
                  <>
                    Según el reglamento de copropiedad y los registros vigentes de <strong>{communityName}</strong>, a la unidad{' '}
                    <strong>{unitLabel}</strong> (titular: <strong>{applicantName}</strong>
                    {formattedRut !== 'Sin informar' ? `, RUT ${formattedRut}` : ''}) le corresponde el porcentaje de prorrateo sobre
                    bienes de dominio común indicado a continuación.
                  </>
                }
                rows={[
                  [
                    ['Unidad', unitLabel],
                    ['Porcentaje de alícuota', formatAliquotDisplay(aliquotValue)]
                  ],
                  [
                    ['Antecedente', 'Reglamento de copropiedad'],
                    ['Fecha de revisión', issueDateShort]
                  ]
                ]}
              />

              <div>
                <h3 style={{ fontSize: 13.5, fontWeight: 800, color: '#103f32', margin: '2px 0 3px 0' }}>
                  Antecedentes utilizados
                </h3>
                <p style={{ margin: 0, fontSize: 12.1 }}>
                  Porcentaje verificado conforme al cuadro de alícuotas del reglamento de copropiedad aplicable a {communityName} y al
                  registro administrativo vigente de unidades (Artículos 3° y 13° de la Ley N° 21.442).
                </p>
              </div>

              <div>
                <h3 style={{ fontSize: 13.5, fontWeight: 800, color: '#103f32', margin: '2px 0 3px 0' }}>
                  Uso de esta constancia
                </h3>
                <p style={{ margin: 0, fontSize: 12.1 }}>
                  El porcentaje informado rige para el prorrateo de gastos comunes ordinarios y ponderación de voto en asambleas según la
                  ley y el reglamento. El dominio del inmueble se acredita con las inscripciones del Conservador de Bienes Raíces.
                </p>
              </div>
            </div>
          )}

          {/* 5. CONSTANCIA DE MUDANZA */}
          {kind === 'mudanza' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11, fontSize: 12.8, lineHeight: 1.56, color: '#1e293b' }}>
              <HighlightedCertCard
                heading="Coordinación con la comunidad • Autorización de mudanza"
                leadParagraph={
                  <>
                    A solicitud de <strong>{applicantName}</strong>
                    {formattedRut !== 'Sin informar' ? ` (RUT ${formattedRut})` : ''}, la administración de{' '}
                    <strong>{communityName}</strong> deja constancia de la autorización y coordinación para el traslado de bienes muebles
                    correspondiente a la <strong>{unitLabel}</strong>
                    {rawAddress ? `, ubicada en ${rawAddress}, ${communeName}` : ''}.
                  </>
                }
                rows={[
                  [
                    ['Solicitante', applicantName],
                    ['Unidad autorizada', unitLabel]
                  ],
                  [
                    ['Fecha de emisión', issueDateLong],
                    ['Horario reglamentario', 'Lun–Vie 09:00 a 18:00 h · Sáb 09:00 a 14:00 h']
                  ]
                ]}
              />

              <div>
                <h3 style={{ fontSize: 13.5, fontWeight: 800, color: '#103f32', margin: '2px 0 3px 0' }}>
                  El día de la mudanza
                </h3>
                <p style={{ margin: 0, fontSize: 12.1 }}>
                  Al llegar, presente este documento en portería o conserjería para autorizar el acceso de carga. Mantenga despejadas las
                  vías de circulación y resguarde ascensores, portones y espacios comunes conforme al reglamento interno.
                </p>
              </div>

              <div>
                <h3 style={{ fontSize: 13.5, fontWeight: 800, color: '#103f32', margin: '2px 0 3px 0' }}>
                  Declaración para el cambio de domicilio
                </h3>
                <p style={{ margin: 0, fontSize: 12.1 }}>
                  Esta constancia acredita la coordinación interna con la comunidad. Cuando la ley exija declaración jurada de mudanza
                  (DFL N° 216 de 1931 / Ley N° 20.227), corresponde al interesado tramitarla ante notario o Registro Civil competente.
                </p>
              </div>
            </div>
          )}

          {/* 6. INTEGRANTE DEL COMITÉ */}
          {kind === 'comite' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11, fontSize: 12.8, lineHeight: 1.56, color: '#1e293b' }}>
              <HighlightedCertCard
                heading="La administración certifica • Designación en el Comité"
                leadParagraph={
                  <>
                    La administración deja constancia de que <strong>{applicantName}</strong> figura como integrante activo del Comité de
                    Administración de <strong>{communityName}</strong>, según los acuerdos y antecedentes vigentes a la fecha de emisión.
                  </>
                }
                rows={[
                  [
                    ['Integrante', applicantName],
                    ['RUT', formattedRut]
                  ],
                  [
                    ['Unidad asociada', unitLabel],
                    ['Cargo registrado', committeeRole]
                  ]
                ]}
              />

              <div>
                <h3 style={{ fontSize: 13.5, fontWeight: 800, color: '#103f32', margin: '2px 0 3px 0' }}>
                  Antecedentes de respaldo
                </h3>
                <p style={{ margin: 0, fontSize: 12.1 }}>
                  Designación registrada conforme al artículo 17° de la Ley N° 21.442 y al libro de actas de asamblea de copropietarios de
                  la comunidad, revisado por la administración al {issueDateLong}.
                </p>
              </div>

              <div>
                <h3 style={{ fontSize: 13.5, fontWeight: 800, color: '#103f32', margin: '2px 0 3px 0' }}>
                  Presentación del documento
                </h3>
                <p style={{ margin: 0, fontSize: 12.1 }}>
                  Se extiende a solicitud de la persona interesada para los fines de representación e información que correspondan. Las
                  facultades bancarias o especiales se rigen por las actas reducidas a escritura pública pertinentes.
                </p>
              </div>
            </div>
          )}

          {/* 7. BUENA CONVIVENCIA / GENERAL */}
          {(kind === 'convivencia' || kind === 'general') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11, fontSize: 12.8, lineHeight: 1.56, color: '#1e293b' }}>
              <HighlightedCertCard
                heading="La administración certifica • Consulta de convivencia y registros"
                leadParagraph={
                  <>
                    Revisados los libros y registros internos para la <strong>{unitLabel}</strong> de <strong>{communityName}</strong>{' '}
                    (asociada a <strong>{applicantName}</strong>), no figuran infracciones ni sanciones reglamentarias pendientes a la
                    fecha indicada a continuación.
                  </>
                }
                rows={[
                  [
                    ['Unidad', unitLabel],
                    ['Resultado', 'Sin infracciones vigentes']
                  ],
                  [
                    ['Titular / Solicitante', `${applicantName}${formattedRut !== 'Sin informar' ? ` · ${formattedRut}` : ''}`],
                    ['Fecha de revisión', issueDateShort]
                  ]
                ]}
              />

              <div>
                <h3 style={{ fontSize: 13.5, fontWeight: 800, color: '#103f32', margin: '2px 0 3px 0' }}>
                  Alcance de la revisión
                </h3>
                <p style={{ margin: 0, fontSize: 12.1 }}>
                  La consulta comprende el registro de sanciones, reclamos formales y observaciones de convivencia disponibles en la
                  administración al {issueDateLong}.
                </p>
              </div>

              <div>
                <h3 style={{ fontSize: 13.5, fontWeight: 800, color: '#103f32', margin: '2px 0 3px 0' }}>
                  Finalidad de la constancia
                </h3>
                <p style={{ margin: 0, fontSize: 12.1 }}>
                  Se extiende a solicitud de la parte interesada para presentar ante {cert.purpose || 'quien corresponda'}, con una
                  vigencia de 30 días desde su fecha de emisión.
                </p>
              </div>
            </div>
          )}

          {cert.notes && (
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #dce4ec',
                borderRadius: 10,
                padding: '7px 12px',
                fontSize: 11.3,
                color: '#334155',
                fontStyle: 'italic'
              }}
            >
              <strong style={{ fontStyle: 'normal', color: '#0F3D2E' }}>Observación registrada:</strong> {cert.notes}
            </div>
          )}

          {/* PIE OFICIAL AL FINAL DE LA PÁGINA (div.cert-bottom-footer, libre de ocultamiento en @media print) */}
          <div className="cert-bottom-footer" style={{ marginTop: 'auto', paddingTop: 10 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.05fr 1fr',
                gap: 20,
                alignItems: 'end'
              }}
            >
              {/* Bloque Izquierdo: Verificación Digital con QR */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: '#f1f5f2',
                  border: '1px solid #d7e4db',
                  borderRadius: 12,
                  padding: '10px 12px'
                }}
              >
                <div
                  style={{
                    width: 82,
                    height: 82,
                    borderRadius: 8,
                    background: '#ffffff',
                    border: '1px solid #9db7a8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    overflow: 'hidden'
                  }}
                >
                  {url ? (
                    <PortalCode url={url} label="Verificar autenticidad de este certificado" />
                  ) : (
                    <div style={{ textAlign: 'center', padding: 4, color: '#5c7065', fontSize: 9, fontWeight: 800, lineHeight: 1.25 }}>
                      QR
                      <br />
                      <span style={{ fontSize: 7.5, fontWeight: 600 }}>
                        {isRevoked ? 'ANULADO' : cert.status === 'SOLICITADO' ? 'PENDIENTE' : 'SIN REGISTRO'}
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ fontSize: 10.5, lineHeight: 1.38, color: '#1e293b' }}>
                  <div style={{ fontWeight: 800, fontSize: 11, color: '#103f32', textTransform: 'uppercase', marginBottom: 2 }}>
                    Verificación digital
                  </div>
                  {url ? (
                    <>
                      <div>Escanee el QR para contrastar los datos impresos y consultar su vigencia.</div>
                      <div style={{ fontSize: 9.5, color: '#5c7065', marginTop: 4, fontFamily: 'monospace' }}>
                        Código: {String(cert.verificationCode || '').slice(0, 10)}…
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        {isRevoked
                          ? 'Certificado revocado. Sin validez ante terceros.'
                          : cert.status === 'SOLICITADO'
                          ? 'Solicitud en revisión. Se activará al emitir.'
                          : 'Copia histórica sin verificación pública activa.'}
                      </div>
                      <div style={{ fontSize: 9.5, color: '#64748b', marginTop: 3 }}>
                        Código: no verificable
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Bloque Derecho: Sello Oficial Completo + Firma Configurada + Línea de Administración */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    paddingBottom: 6
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <img
                      src="/brand/ARANPRO_sello_circular_integral_transparente.png"
                      alt="Sello Oficial ARANPRO"
                      style={{ width: 44, height: 44, objectFit: 'contain', flexShrink: 0 }}
                    />
                    <div style={{ lineHeight: 1.25 }}>
                      <div style={{ fontSize: 9.5, fontWeight: 800, color: '#103f32', textTransform: 'uppercase' }}>
                        Sello Oficial de Administración
                      </div>
                      <div style={{ fontSize: 8.8, color: '#526b5e' }}>
                        Ley N° 21.442 de Copropiedad Inmobiliaria
                      </div>
                    </div>
                  </div>

                  {signatureImg && (
                    <img
                      src={signatureImg}
                      alt="Firma de la administración"
                      style={{ maxHeight: 44, maxWidth: 115, width: 'auto', objectFit: 'contain' }}
                    />
                  )}
                </div>

                <div style={{ borderTop: '1.5px solid #1e293b', paddingTop: 5, textAlign: 'center' }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#103f32' }}>{issuerName}</div>
                  <div style={{ fontSize: 10, color: '#526b5e' }}>Administración de la comunidad</div>
                </div>
              </div>
            </div>

            {/* Pie Institucional Conoce ARANPRO */}
            <div
              style={{
                borderTop: '1px solid #c59f6d',
                marginTop: 11,
                paddingTop: 7,
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 12
              }}
            >
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#103f32', textTransform: 'uppercase' }}>
                  Conoce ARANPRO
                </div>
                <div style={{ fontSize: 9.5, color: '#526b5e' }}>
                  Gestión integral para comunidades y condominios
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <a
                  href="https://aranpro.cl"
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: 10.5, fontWeight: 800, color: '#103f32', textDecoration: 'none' }}
                >
                  Visita aranpro.cl →
                </a>
                <div style={{ fontSize: 9, color: '#526b5e' }}>Administración ARANPRO</div>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
