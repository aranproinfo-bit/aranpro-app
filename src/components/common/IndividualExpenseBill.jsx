import { ResidentInstallHint } from './ResidentInstallHint';
import AccountingSignature from './AccountingSignature';
import { periodCharges } from '../../utils/expenseBilling';
import React, { useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import { DOMAIN_CONFIG } from '../../config/domains';
import { formatCLP, getMonthName } from '../../utils/formatters';
import styles from './communityAccounting.css?raw';

const MONTHS_SHORT_LOWER = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic'
];

const frameDocument = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Colilla de gasto común</title><style>${styles}</style></head><body></body></html>`;

function formatShortDueDate(dateStr) {
  if (!dateStr) return 'Sin informar';
  const clean = String(dateStr).slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(clean);
  if (!match) return clean;
  const idx = Number(match[2]) - 1;
  if (idx < 0 || idx > 11) return clean;
  return `${Number(match[3])} ${MONTHS_SHORT_LOWER[idx]} ${match[1]}`;
}

export function getCommunityInitials(name = '') {
  const words = String(name)
    .replace(/^condominio\s+/i, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return 'AP';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

export function PortalCode({ url, label = 'Abrir portal de residentes', sizePx = 68 }) {
  const { size, path } = useMemo(() => {
    const grid = QRCode.create(url, { errorCorrectionLevel: 'M' }).modules;
    const dots = [];
    for (let y = 0; y < grid.size; y++) {
      for (let x = 0; x < grid.size; x++) {
        if (grid.get(y, x)) dots.push(`M${x + 4} ${y + 4}h1v1h-1z`);
      }
    }
    return { size: grid.size + 8, path: dots.join('') };
  }, [url]);
  return (
    <a href={url} target="_blank" rel="noreferrer" aria-label={label}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={sizePx}
        height={sizePx}
        style={{ display: 'block', flexShrink: 0 }}
        shapeRendering="crispEdges"
      >
        <rect width={size} height={size} fill="#ffffff" />
        <path d={path} fill="#0f172a" />
      </svg>
    </a>
  );
}

function Amount({ label, value, style = '' }) {
  return (
    <div className={'line ' + style}>
      <span>{label}</span>
      <span>{formatCLP(value)}</span>
    </div>
  );
}

export function IndividualExpenseBillSheet({ community, unit, fin, totals, company }) {
  const bank = community.bankInfo || {};
  const period = community.activePeriod || {};
  const month = getMonthName(period.month);
  const periodLabel = [month, period.year].filter(Boolean).join(' de ');
  const type =
    ({ Edificio: 'Depto.', Mixto: 'Unidad', 'Locales Comerciales': 'Local' })[community.type] ||
    'Casa';
  const unitLabel = [type, unit.number, unit.tower].filter(Boolean).join(' ');
  const rate = Number(unit.sharePercentage) || 0;
  const portion = (amount) => Math.round((amount * rate) / 100);
  const groups = new Map();
  const majorWorksList = [];

  for (const item of periodCharges(community)) {
    const { expense, amount, index, count, isFundRecovery } = item;
    if (expense.fundSource === 'fondo_reserva' && !isFundRecovery) continue;
    let category = expense.category?.trim() || 'Gastos operacionales generales';
    if (isFundRecovery) {
      category = `Reposición Fondo Reserva: ${
        expense.recoveryProjectName || expense.description || 'Obra Mayor'
      } (Cuota ${index}/${count})`;
      majorWorksList.push(item);
    }
    groups.set(category, (groups.get(category) || 0) + amount);
  }

  const billingBase = totals.grandTotal - totals.reserveFundAmount;
  const allocationDifference =
    fin.currentCharge - portion(billingBase) - portion(totals.reserveFundAmount);
  const url = DOMAIN_CONFIG.getResidentLoginUrl(community.slug);
  const cleanUrlText = url.replace(/^https?:\/\//, '').split('?')[0];
  const dueFormatted = formatShortDueDate(period.dueDate);
  const balanceLabel = fin.favorBalance > 0 ? 'Saldo a favor' : 'Saldo a pagar';
  const balance = fin.favorBalance || fin.pendingDebt;
  const bankEmail = bank.email || community.email || '';

  return (
    <main className="sheet">
      <div className="mast-header">
        <div className="identity">
          {community.documentLogo ? (
            <img className="symbol" src={community.documentLogo} alt="Logo de la comunidad" />
          ) : (
            <div className="symbol-badge">{getCommunityInitials(community.name)}</div>
          )}
          <div>
            <span className="k">Comunidad</span>
            <b>{community.name}</b>
            <div className="small">{community.city}</div>
          </div>
        </div>

        <div className="header-title">
          <h1>Colilla de gasto común</h1>
          <span className="period-pill">Período de cobro · {periodLabel || 'Sin informar'}</span>
        </div>

        <div className="ap-wrap">
          <img
            className="ap"
            src="/brand/ARANPRO_logo_horizontal_transparente_trimmed.png"
            alt="ARANPRO Gestión Integral"
          />
        </div>
      </div>

      <div className="hero hero-4">
        <div>
          <span className="k">{balanceLabel}</span>
          <strong>{formatCLP(balance)}</strong>
        </div>
        <div>
          <span className="k">Vencimiento</span>
          <strong>{dueFormatted}</strong>
        </div>
        <div>
          <span className="k">Unidad</span>
          <strong>{unitLabel}</strong>
        </div>
        <div>
          <span className="k">Prorrateo</span>
          <strong>
            {rate.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} %
          </strong>
        </div>
      </div>

      <div className="holder">
        <div>
          <span className="k">Copropietario titular</span>
          <b>{unit.owner || 'Sin informar'}</b>
        </div>
        <div>
          <span className="k">RUT titular</span>
          <b>{unit.rut || 'Sin informar'}</b>
        </div>
        <div>
          <span className="k">Referencia de pago</span>
          <b>
            {unitLabel} · {periodLabel || 'Período vigente'}
          </b>
        </div>
      </div>

      <section>
        <div className="row cap">
          <h2>Gastos de la comunidad</h2>
          <span className="small">Montos en pesos chilenos</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Concepto</th>
              <th>Total comunidad</th>
              <th>Cuota de la unidad</th>
            </tr>
          </thead>
          <tbody>
            {Array.from(groups, ([category, amount]) => (
              <tr key={category}>
                <td>{category}</td>
                <td>{formatCLP(amount)}</td>
                <td>{formatCLP(portion(amount))}</td>
              </tr>
            ))}
            <tr>
              <td>Subtotal de operación</td>
              <td>{formatCLP(billingBase)}</td>
              <td>{formatCLP(portion(billingBase))}</td>
            </tr>
            <tr>
              <td>Fondo de reserva · {community.reserveFundPercentage ?? 5} %</td>
              <td>{formatCLP(totals.reserveFundAmount)}</td>
              <td>{formatCLP(portion(totals.reserveFundAmount))}</td>
            </tr>
            {!!allocationDifference && (
              <tr>
                <td>Diferencia entre prorrateo y cuota registrada</td>
                <td>—</td>
                <td>{formatCLP(allocationDifference)}</td>
              </tr>
            )}
            <tr className="sum">
              <td>Gasto común del mes</td>
              <td>{formatCLP(totals.grandTotal)}</td>
              <td>{formatCLP(fin.currentCharge)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="twocol">
        <div>
          <h2 className="cap">Cuenta de la unidad</h2>
          <Amount
            label={'Gasto común de ' + (month ? month.toLowerCase() : 'mes')}
            value={fin.currentCharge}
          />
          {!!fin.extraCharge && (
            <Amount
              label={unit.extraChargeDescription || 'Cargo individual del mes'}
              value={fin.extraCharge}
            />
          )}
          {!!fin.previousDebt && (
            <Amount label="Deuda anterior fuera de convenio" value={fin.previousDebt} />
          )}
          {!!fin.repactedInstallment && (
            <Amount
              label={`Cuota del convenio · ${fin.repactacionPaidInstallments + 1} de ${
                fin.repactacionTotalInstallments
              }`}
              value={fin.repactedInstallment}
            />
          )}
          {!!fin.creditBalance && (
            <Amount label="Saldo a favor anterior" value={-fin.creditBalance} />
          )}
          <Amount label="Total cobrado en el período" value={fin.totalBilledThisPeriod} style="subtotal" />
          {!!fin.paidAmount && <Amount label="Abono registrado" value={-fin.paidAmount} />}
          <Amount label={balanceLabel} value={balance} style="net" />
        </div>

        <div className="bank">
          <h2>Datos para transferir</h2>
          <b>{bank.holderName || community.name}</b>
          <p>
            {bank.bank || 'Banco sin informar'} · {bank.accountType || 'Cuenta corriente'} N.º{' '}
            {bank.accountNumber || 'Sin informar'}
            <br />
            RUT · {bank.rut || community.rut || 'Sin informar'}
          </p>
          <div className="bank-ref-grid">
            <div>
              <span className="k">Referencia</span>
              <b>
                {unitLabel} · {periodLabel}
              </b>
            </div>
            <div>
              <span className="k">Correo avisos</span>
              <b>{bankEmail || 'Sin informar'}</b>
            </div>
          </div>
        </div>
      </section>

      {fin.repactacionActive && (
        <div className="agreement">
          <b>Detalle del convenio de pago</b>
          <p>
            Deuda repactada: {formatCLP(fin.repactacionTotal)} · Cuotas pagadas:{' '}
            {fin.repactacionPaidInstallments} de {fin.repactacionTotalInstallments} (
            {formatCLP(fin.repactacionAlreadyPaidAmount)}). Cuota de este período:{' '}
            {formatCLP(fin.repactedInstallment)} · Cuotas futuras:{' '}
            {formatCLP(
              Math.max(0, fin.repactacionRemainingBeforeThisMonth - fin.repactedInstallment)
            )}
            .
          </p>
        </div>
      )}

      {majorWorksList.length > 0 && (
        <div className="agreement" style={{ borderLeftColor: '#0F3D2E' }}>
          <b>Reposición de Fondos por Trabajos Mayores</b>
          {majorWorksList.map(({ expense, index, count, amount }) => (
            <p key={expense.id}>
              • <strong>{expense.recoveryProjectName || expense.description}</strong>: Inversión de{' '}
              {formatCLP(expense.amount)} cancelada inicialmente al proveedor con cargo a fondos y
              prorrateada en {count} cuotas mensuales. En este mes corresponde la{' '}
              <strong>
                Cuota {index} de {count}
              </strong>{' '}
              ({formatCLP(amount)} para la comunidad).
            </p>
          ))}
        </div>
      )}

      <div className="closing-band">
        <div className="payment-guide-box">
          <PortalCode url={url} label="Abrir portal de residentes" sizePx={68} />
          <div>
            <h2>¿Ya transferiste? Informa tu pago</h2>
            <ol>
              <li>
                Escanea el QR o entra a{' '}
                <a href={url} target="_blank" rel="noreferrer">
                  {cleanUrlText}
                </a>
                . Inicia sesión y elige <b>Informar Pago</b>.
              </li>
              <li>Indica el monto y la fecha de transferencia, folio y comentario.</li>
              <li>
                Adjunta foto, captura o PDF del comprobante y pulsa <b>Registrar Notificación</b>.
              </li>
            </ol>
            <ResidentInstallHint />
          </div>
        </div>

        <AccountingSignature company={company} compact={true} />
      </div>

      <div className="foot">
        <span>{community.name}</span>
        <span>Colilla de gasto común · {periodLabel} · Página 1 de 1</span>
      </div>
    </main>
  );
}

export default function IndividualExpenseBill({ community, unit, fin, totals, company, children }) {
  const frame = useRef(null);
  const [body, setBody] = useState(null);
  const period = community.activePeriod || {};
  const type =
    ({ Edificio: 'Depto.', Mixto: 'Unidad', 'Locales Comerciales': 'Local' })[community.type] ||
    'Casa';
  const unitLabel = [type, unit.number, unit.tower].filter(Boolean).join(' ');

  async function printBill() {
    const doc = frame.current.contentDocument;
    doc.title = ['Colilla_Gasto_Comun', community.name, unitLabel, period.month, period.year]
      .filter(Boolean)
      .join('_');
    await Promise.all(Array.from(doc.images, (image) => image.decode().catch(() => {})));
    frame.current.contentWindow.print();
  }

  return (
    <div className="w-full max-w-4xl bg-white rounded-xl overflow-hidden shadow-xl">
      <iframe
        ref={frame}
        title="Colilla individual de gasto común"
        srcDoc={frameDocument}
        onLoad={(e) => setBody(e.currentTarget.contentDocument.body)}
        style={{ width: '100%', height: 'min(78vh, 1056px)', border: 0 }}
      />
      {body &&
        createPortal(
          <IndividualExpenseBillSheet
            community={community}
            unit={unit}
            fin={fin}
            totals={totals}
            company={company}
          />,
          body
        )}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3">
        <button
          disabled={!body}
          onClick={printBill}
          className="rounded-xl bg-[#0F3D2E] px-4 py-2 text-white text-sm font-bold cursor-pointer"
        >
          Imprimir / Guardar PDF
        </button>
        {children}
      </div>
    </div>
  );
}
