import './financeClosing.css';
import React from 'react';
import { Printer, X, FileCheck2 } from 'lucide-react';
import { formatCLP } from '../../utils/formatters';
import { DOMAIN_CONFIG } from '../../config/domains';
import { PortalCode, getCommunityInitials } from './IndividualExpenseBill';
import { ResidentInstallHint } from './ResidentInstallHint';
import { printDocumentDirectly } from '../../utils/printDocument';

export function FinanceHeader({ community, title, reference }) {
  const logo = community?.documentLogo || '';
  return (
    <div className="finance-mast-header">
      <div className="finance-identity">
        {logo ? (
          <img className="finance-symbol" src={logo} alt="Logo de la comunidad" />
        ) : (
          <div className="finance-symbol-badge">{getCommunityInitials(community?.name)}</div>
        )}
        <div>
          <span className="finance-identity-k">Comunidad</span>
          <b>{community?.name || 'Condominio'}</b>
          {community?.city ? <div className="finance-identity-sub">{community.city}</div> : null}
        </div>
      </div>

      <div className="finance-header-title">
        <h1>{title}</h1>
        {reference ? <span className="finance-period-pill">{reference}</span> : null}
      </div>

      <div className="finance-ap-wrap">
        <img
          className="finance-ap"
          src="/brand/ARANPRO_logo_horizontal_transparente_trimmed.png"
          alt="ARANPRO Gestión Integral"
        />
      </div>
    </div>
  );
}

export function FinanceHero({ items = [] }) {
  if (!items.length) return null;
  return (
    <div className={`finance-hero ${items.length === 4 ? 'cols-4' : ''}`}>
      {items.map(([label, value]) => (
        <div key={label}>
          <span className="finance-hero-k">{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}

export function FinanceResidentClosingBand({
  community,
  company,
  heading = '¿Ya transferiste? Informa tu pago',
  description
}) {
  const url = DOMAIN_CONFIG.getResidentLoginUrl(community?.slug);
  const cleanUrlText = url.replace(/^https?:\/\//, '').split('?')[0];
  const adminName =
    company?.adminName || company?.administratorName || 'Administración ARANPRO';

  return (
    <div className="finance-closing-band">
      <div className="finance-portal-guide">
        <PortalCode url={url} label="Abrir portal de residentes" sizePx={68} />
        <div>
          <b className="guide-title">{heading}</b>
          <p>
            {description || (
              <>
                Escanea el QR o visita{' '}
                <a href={url} target="_blank" rel="noreferrer">
                  {cleanUrlText}
                </a>
                . Inicia sesión, entra a <b>Informar Pago</b> y adjunta tu comprobante para emitir tu recibo oficial.
              </>
            )}
          </p>
          <ResidentInstallHint />
        </div>
      </div>

      <div className="finance-official-seal-col">
        <div className="finance-seal-row">
          <img
            className="finance-seal-img"
            src="/brand/ARANPRO_sello_circular_integral_transparente.png"
            alt="Sello Oficial ARANPRO"
          />
          <div>
            <div className="finance-seal-title">Sello Oficial de Administración</div>
            <div className="finance-seal-sub">Ley N.º 21.442 de Copropiedad Inmobiliaria</div>
          </div>
        </div>
        <div className="finance-sig-block">
          {company?.signatureDataUrl ? (
            <img src={company.signatureDataUrl} alt="Firma del administrador" />
          ) : null}
          <div className="finance-sig-line">{adminName}</div>
          <div className="finance-sig-role">ARANPRO Gestión Integral · Administración</div>
        </div>
      </div>
    </div>
  );
}

export function FinanceFooter({ community, label }) {
  return (
    <div className="finance-foot">
      <span>{community?.name || 'Comunidad'}</span>
      <span>{label} · ARANPRO Gestión Integral</span>
    </div>
  );
}

export function FinanceSigningBlock({ company, contact = company, roles = [], label }) {
  const name = company?.adminName || company?.administratorName || 'Administración ARANPRO';
  return (
    <div className="finance-signing">
      <div className="finance-signers">
        {roles.map((role) => (
          <div className="finance-signer" key={role}>
            <div className="finance-sign-image" />
            <b>{role}</b>
            <small>Nombre y firma</small>
            {roles.length > 0 && <small>RUT / Timbre __________________</small>}
          </div>
        ))}
        <div className="finance-signer finance-admin">
          <div className="finance-sign-image">
            <img
              className="finance-seal"
              src="/brand/ARANPRO_sello_circular_integral_transparente.png"
              alt="Sello Oficial ARANPRO"
            />
            <div style={{ textAlign: 'left', lineHeight: 1.15 }}>
              <strong>SELLO OFICIAL DE ADMINISTRACIÓN</strong>
              <small>Ley N° 21.442 de Copropiedad Inmobiliaria</small>
            </div>
            {company?.signatureDataUrl && (
              <img
                className="finance-autograph"
                src={company.signatureDataUrl}
                alt="Firma del administrador"
              />
            )}
          </div>
          <b>{name}</b>
          <small>
            {[
              company?.adminRut &&
                company.adminRut !== '14.882.140-K' &&
                'RUT ' + company.adminRut,
              company?.rnacNumber && 'RNAC MINVU ' + company.rnacNumber
            ]
              .filter(Boolean)
              .join(' · ') || 'Administración delegada de la comunidad'}
          </small>
        </div>
      </div>
      <div className="finance-tail">
        <span>ARANPRO Gestión Integral · aranpro.cl</span>
        <b>{label}</b>
        <span>{contact?.phone || ''}</span>
      </div>
    </div>
  );
}

export function PaymentAgreementSheet({ community, company, agreement }) {
  if (!community || !agreement?.unit) return null;
  const { unit, totalHist, cuotaMes, totalCuotas, pagadas = 0, lastInstallment, notes } = agreement;
  const unitLabel = [unit.tower, unit.number].filter(Boolean).join(' · ') || `Unidad ${unit.number}`;
  const adminName =
    company?.adminName ||
    company?.administratorName ||
    '____________________________';

  return (
    <div className="finance-closing-sheet closing-record">
      <FinanceHeader
        community={community}
        title="Convenio de pago de gastos comunes"
        reference={`Unidad ${unit.number}${unit.tower ? ` · ${unit.tower}` : ''}`}
      />

      <FinanceHero
        items={[
          ['Deuda repactada', formatCLP(totalHist)],
          ['Plan acordado', `${totalCuotas} ${totalCuotas === 1 ? 'cuota' : 'cuotas'} (${pagadas} pagadas)`],
          ['Cuota mensual', formatCLP(cuotaMes)],
          ['Unidad', unitLabel]
        ]}
      />

      <div className="finance-holder">
        <div>
          <span className="finance-identity-k">Propietario(a) / Representante</span>
          <b>{unit.owner || '____________________________'}</b>
        </div>
        <div>
          <span className="finance-identity-k">RUT Titular</span>
          <b>{unit.rut || '____________________'}</b>
        </div>
        <div>
          <span className="finance-identity-k">Administrador(a)</span>
          <b>{adminName}</b>
        </div>
      </div>

      <div className="closing-intro">
        <b>Convenio propuesto para firma</b>
        <p>
          La formalización requiere el acuerdo del comité de administración y las firmas de las partes.
        </p>
      </div>

      <h3>1. Identificación y autorización</h3>
      <p>
        Comunidad: {community.name}. Administrador(a): {adminName}.
      </p>
      <p>
        Propietario(a) o representante: {unit.owner || '____________________________'} · RUT:{' '}
        {unit.rut || '____________________'} · Unidad: {unitLabel}.
      </p>
      <p>
        Fecha: ____ / ____ / ________ · Acuerdo del comité, acta y fecha: ____________________________________.
      </p>

      <h3>2. Deuda y forma de pago</h3>
      <p>
        Las partes acuerdan pagar <b>{formatCLP(totalHist)}</b>, correspondiente a obligaciones de la unidad individualizadas en el estado de cuenta que se incorpora como antecedente. Períodos y conceptos comprendidos: ________________________________________________.
      </p>
      <p>
        El monto se pagará en <b>{totalCuotas} cuota(s) mensuales</b>
        {totalCuotas > 1 ? (
          <>
            , las primeras {totalCuotas - 1} de <b>{formatCLP(cuotaMes)}</b> y la última de{' '}
            <b>{formatCLP(lastInstallment)}</b>
          </>
        ) : (
          <>
            {' '}
            de <b>{formatCLP(lastInstallment)}</b>
          </>
        )}
        . La primera vence el ____ / ____ / ________ y las siguientes el mismo día de cada mes, o en la fecha que se acuerde por escrito.
      </p>

      <h3>3. Cobros y seguimiento</h3>
      <p>
        Las cuotas del convenio se informarán junto con los gastos comunes que se devenguen durante su vigencia. La administración registrará los pagos verificados y entregará el detalle de abonos y saldo cuando se solicite.
      </p>
      <p>
        Si una cuota no se paga oportunamente, las partes revisarán el saldo y las medidas aplicables conforme al reglamento de copropiedad, los acuerdos pertinentes y la normativa vigente.
      </p>

      <h3>4. Condiciones adicionales</h3>
      <p>
        {notes?.trim()
          ? notes
          : '________________________________________________________________________________'}
      </p>
      <p>
        Las partes declaran haber revisado los antecedentes de la deuda y reciben un ejemplar del convenio.
      </p>

      <FinanceSigningBlock
        company={company}
        roles={['Propietario(a) o representante']}
        label="Convenio de pago · Ley N° 21.442 · Página 1 de 1"
      />
    </div>
  );
}

export function PaymentAgreementModal({ agreement, community, company, onClose }) {
  if (!agreement || !community) return null;
  const domId = 'payment-agreement-printable-doc';
  const filename = `Convenio_Pago_${agreement.unit?.number || 'Unidad'}_${String(community.name || 'Comunidad').replace(/\s+/g, '_')}`;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col">
        <div className="px-5 py-3.5 bg-[#0F3D2E] text-white flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 text-[#D4B895] rounded-xl">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black">Convenio de Pago de Gastos Comunes (Vista Previa)</h4>
              <p className="text-[11px] text-[#D4B895]">
                Documento oficial en 1 hoja Carta listo para firma de propietario y administración
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                printDocumentDirectly(domId, filename, {
                  pdfStyle: 'neutral',
                  useBundledStyles: true,
                  margin: '7mm 10mm'
                })
              }
              className="px-4 py-2 bg-[#D4B895] hover:bg-[#c5a67e] text-[#0F3D2E] font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / PDF (1 Hoja)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-white/75 hover:text-white hover:bg-white/10 rounded-xl cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100">
          <div
            id={domId}
            className="bg-white max-w-3xl mx-auto p-6 sm:p-8 rounded-2xl shadow-sm"
          >
            <PaymentAgreementSheet
              community={community}
              company={company}
              agreement={agreement}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function closingAmount(value) {
  return value == null ? 'Sin registro' : formatCLP(value);
}

export function ClosingRecord({ community, history, totals, getFinancials, company, period, audit }) {
  const source = history || totals;
  const approval = history ? history.committeeSignoff : community.closingSignoffs?.[period];
  const units = history
    ? history.allocationRows
    : community.units.map((unit) => ({ ...unit, ...getFinancials(unit) }));
  const balances = units?.filter((unit) => unit.pendingDebt > 0 || unit.favorBalance > 0);
  const checks = history ? history.expenseChecks : audit;
  const base =
    source.grandTotal == null || source.reserveFundAmount == null
      ? null
      : source.grandTotal - source.reserveFundAmount;
  const pending = units?.reduce((sum, unit) => sum + (unit.pendingDebt || 0), 0);
  const credit = units?.reduce((sum, unit) => sum + (unit.favorBalance || 0), 0);
  const pages = [balances?.slice(0, 6)];
  for (let i = 6; i < (balances?.length || 0); i += 18) pages.push(balances.slice(i, i + 18));

  return pages.map((rows, index) => (
    <div key={index} className="finance-closing-sheet closing-record">
      <FinanceHeader
        community={community}
        title="Acta de cierre contable"
        reference={`Período ${period} · Hoja ${index + 1} de ${pages.length}`}
      />
      {index === 0 && (
        <>
          <FinanceHero
            items={[
              ['Total distribuido', closingAmount(source.grandTotal)],
              ['Pagos registrados', closingAmount(source.totalCollected)],
              ['Pendiente de cobro', closingAmount(pending)],
              ['Aporte reserva', closingAmount(source.reserveFundAmount)]
            ]}
          />
          <div className="closing-intro">
            <b>
              {history
                ? 'Cierre archivado · ' + history.closedAt
                : 'Revisión previa al cierre mensual'}
            </b>
            <p>
              {history
                ? 'Esta acta reúne las cifras guardadas al archivar el período y permite verificar los saldos de apertura del mes siguiente.'
                : 'La administración presenta al comité los gastos del mes, la recaudación registrada y los saldos que se trasladarían al período siguiente si se cerrara con estas cifras.'}
            </p>
          </div>
          <h3>Determinación del cobro común</h3>
          <table>
            <tbody>
              {[
                ['Gastos ordinarios registrados', source.totalExpenses],
                ['Base que corresponde cobrar en el período', base],
                ['Aporte al fondo de reserva', source.reserveFundAmount],
                ['Total a distribuir entre las unidades', source.grandTotal]
              ].map(([label, value]) => (
                <tr key={label}>
                  <td>{label}</td>
                  <td className="amount">{closingAmount(value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {base != null && source.totalExpenses != null && base !== source.totalExpenses && (
            <p>
              La distribución considera la porción de los gastos que corresponde cobrar este mes según
              la programación de cuotas.
            </p>
          )}
          <h3>Recaudación y saldos</h3>
          <div className="closing-figures">
            {[
              ['Pagos registrados', source.totalCollected],
              ['Pendiente de cobro', pending],
              ['A favor de las unidades', credit]
            ].map(([label, value]) => (
              <div key={label}>
                <small>{label}</small>
                <b>{closingAmount(value)}</b>
              </div>
            ))}
          </div>
          <p>
            El pendiente reúne los saldos individuales después de aplicar los pagos y créditos.
            Puede incluir deuda anterior, cuotas de convenios y cargos adicionales.
          </p>
        </>
      )}
      <h3>{index ? 'Continuación · ' : ''}Unidades con saldo para el próximo período</h3>
      {rows?.length ? (
        <table>
          <thead>
            <tr>
              <th>Unidad</th>
              <th>Titular</th>
              <th>Cuota del mes</th>
              <th>Pendiente</th>
              <th>A favor</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((unit, i) => (
              <tr key={i}>
                <td>{[unit.number, unit.tower].filter(Boolean).join(' · ')}</td>
                <td>{unit.owner}</td>
                {['currentCharge', 'pendingDebt', 'favorBalance'].map((key) => (
                  <td key={key} className="amount">
                    {closingAmount(unit[key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>
          {units
            ? 'Todas las unidades registran saldo cero.'
            : 'El archivo de este período conserva los totales generales. El detalle por unidad no está disponible.'}
        </p>
      )}
      {index === pages.length - 1 && (
        <>
          <h3>Revisión del comité y seguimiento</h3>
          {checks && (
            <p>
              De {checks.totalExpensesCount} gastos registrados, {checks.backedCount} tienen respaldo
              adjunto y {checks.approvedCount} tienen visación individual del comité.
            </p>
          )}
          <p>
            <b>Visación del cierre · </b>
            {approval?.status === 'aprobado'
              ? ['Aprobada', approval.member, approval.role, approval.date]
                  .filter(Boolean)
                  .join(' · ')
              : 'Sin aprobación registrada.'}
          </p>
          <p>
            {history
              ? 'Para iniciar el nuevo período, cotejar los saldos de apertura con esta nómina y los pagos posteriores con la cartola bancaria.'
              : checks?.hasCriticalBlock
              ? 'El cierre está bloqueado. ' + checks.criticalIssues.join(' ')
              : 'Antes de archivar, cotejar los pagos con la cartola bancaria y revisar los saldos que pasarán al próximo mes.'}
          </p>
          <FinanceSigningBlock
            company={history ? history.administratorSignoff : company}
            contact={company}
            roles={['Comité de Administración']}
            label="Acta de cierre contable"
          />
        </>
      )}
    </div>
  ));
}
