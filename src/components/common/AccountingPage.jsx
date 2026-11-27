import { ResidentInstallHint } from './ResidentInstallHint';
import AccountingSignature from './AccountingSignature';
import React, { useRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PortalCode, getCommunityInitials } from './IndividualExpenseBill';
import { DOMAIN_CONFIG } from '../../config/domains';
import { formatCLP, getMonthName } from '../../utils/formatters';
import css from './communityAccounting.css?raw';

export const periodKey = (p) =>
  p?.year && p?.month ? p.year + '-' + String(p.month).padStart(2, '0') : '';
const periodName = (key) =>
  key ? getMonthName(Number(key.slice(5))) + ' de ' + key.slice(0, 4) : '';
const date = (d) => d?.slice(0, 10).split('-').reverse().join('/') || 'Sin informar';
const amount = (n) => formatCLP(Math.abs(n));
const balance = (n) => (n < 0 ? amount(n) + ' a favor' : amount(n));

export function AccountingPageSheet({ community, company, title, reference, hero, children }) {
  const url = DOMAIN_CONFIG.getResidentLoginUrl(community.slug);
  const cleanUrlText = url.replace(/^https?:\/\//, '').split('?')[0];

  return (
    <main className="sheet">
      <div className="mast-header">
        <div className="identity">
          {community.documentLogo ? (
            <img className="symbol" src={community.documentLogo} alt="Logo comunidad" />
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
          <h1>{title}</h1>
          {reference ? <span className="period-pill">{reference}</span> : null}
        </div>

        <div className="ap-wrap">
          <img
            className="ap"
            src="/brand/ARANPRO_logo_horizontal_transparente_trimmed.png"
            alt="ARANPRO"
          />
        </div>
      </div>

      <div className={'hero ' + (hero.length === 4 ? 'hero-4' : '')}>
        {hero.map(([label, value]) => (
          <div key={label}>
            <span className="k">{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      {children}

      <div className="closing-band">
        <div className="payment-guide-box">
          <PortalCode url={url} label="Consultar portal de residentes" sizePx={68} />
          <div>
            <h2>Consulta tus recibos en el portal</h2>
            <p style={{ marginTop: 0, fontSize: '8.6pt', lineHeight: 1.35, color: '#19382e' }}>
              Escanea el QR o visita{' '}
              <a href={url} target="_blank" rel="noreferrer">
                {cleanUrlText}
              </a>
              . Entra a <b>Mis Pagos y Recibos</b> y selecciona <b>Ver Recibo Oficial</b>.
            </p>
            <ResidentInstallHint />
          </div>
        </div>

        <AccountingSignature company={company} compact={true} />
      </div>

      <div className="foot">
        <span>{community.name}</span>
        <span>
          {title} · {reference} · Página 1 de 1
        </span>
      </div>
    </main>
  );
}

export function AccountingPage({ community, company, title, reference, hero, children, onClose }) {
  const frame = useRef(null);
  const doc = (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <base href={window.location.origin + '/'} />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>{[title, community.name, reference].filter(Boolean).join(' · ')}</title>
        <style>{css}</style>
      </head>
      <body>
        <AccountingPageSheet
          community={community}
          company={company}
          title={title}
          reference={reference}
          hero={hero}
        >
          {children}
        </AccountingPageSheet>
      </body>
    </html>
  );

  async function print() {
    const docEl = frame.current.contentDocument;
    await Promise.all([...docEl.images].map((i) => i.decode().catch(() => {})));
    frame.current.contentWindow.print();
  }

  return (
    <div className="bg-white rounded-xl overflow-hidden w-full max-w-4xl mx-auto">
      <div className="flex justify-end items-center gap-4 p-3 bg-[#103f32] text-white text-sm font-bold">
        <button onClick={print} className="cursor-pointer">
          Imprimir / Guardar PDF
        </button>
        {onClose && (
          <button onClick={onClose} className="cursor-pointer">
            Cerrar
          </button>
        )}
      </div>
      <iframe
        ref={frame}
        title={title}
        className="w-full border-0 h-[75vh]"
        srcDoc={'<!doctype html>' + renderToStaticMarkup(doc)}
      />
    </div>
  );
}

export function PaymentReceipt({ payment, community, company, onClose }) {
  const snapshot = payment.accountSnapshot;
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 flex items-center justify-center p-3">
      <AccountingPage
        community={community}
        company={company}
        title="Recibo oficial de pago"
        reference={payment.receiptFolio ? 'Folio ' + payment.receiptFolio : 'Folio sin registrar'}
        onClose={onClose}
        hero={[
          ['Monto recibido', amount(payment.amount)],
          ['Fecha del pago', date(payment.date)],
          ['Unidad', payment.unitNumber]
        ]}
      >
        <section>
          <h2>Constancia de recepción</h2>
          <p>
            La administración de {community.name} registró un abono de <b>{amount(payment.amount)}</b>{' '}
            en la cuenta de la unidad {payment.unitNumber}
            {payment.owner ? ' a nombre de ' + payment.owner : ''}
            {snapshot?.period ? ', correspondiente a ' + periodName(snapshot.period) : ''}.
          </p>
        </section>
        {snapshot && (
          <section>
            <h2>Cómo quedó la cuenta al registrar el pago</h2>
            <table>
              <thead>
                <tr>
                  <th>Movimiento</th>
                  <th>Importe</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Saldo antes del abono</td>
                  <td>{balance(snapshot.before)}</td>
                </tr>
                <tr>
                  <td>Abono de este recibo</td>
                  <td>−{amount(payment.amount)}</td>
                </tr>
                <tr className="sum">
                  <td>
                    {snapshot.after < 0
                      ? 'Saldo a favor después del abono'
                      : 'Saldo pendiente después del abono'}
                  </td>
                  <td>{amount(snapshot.after)}</td>
                </tr>
              </tbody>
            </table>
          </section>
        )}
        <section>
          <h2>Identificación del movimiento</h2>
          <div className="line">
            <span>Referencia de operación</span>
            <b>{payment.transferNumber || 'Sin registrar'}</b>
          </div>
          {snapshot?.period && (
            <div className="line">
              <span>Período del cobro</span>
              <b>{periodName(snapshot.period)}</b>
            </div>
          )}
        </section>
      </AccountingPage>
    </div>
  );
}
