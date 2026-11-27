import React, { useEffect, useState } from 'react';
import { certificateRegistry } from '../../services/supabase';
import { clause } from '../../services/documentRegistry';
import { formatCLP, formatDate, formatRut } from '../../utils/formatters';
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle, WifiOff, Copy, Check, ArrowLeft, RefreshCw } from 'lucide-react';

const STATUS_CONFIG = {
  loading: {
    heading: 'Consultando el registro oficial…',
    badge: 'VERIFICANDO EN LÍNEA',
    headerBg: 'bg-[#103f32]',
    badgeStyle: 'bg-white/15 text-[#dfc39d] border-white/20',
    icon: RefreshCw,
    iconSpin: true
  },
  valid: {
    heading: 'Documento vigente',
    badge: 'AUTENTICIDAD CONFIRMADA',
    headerBg: 'bg-[#103f32]',
    badgeStyle: 'bg-emerald-400/20 text-emerald-200 border-emerald-300/40',
    icon: CheckCircle2
  },
  expired: {
    heading: 'Documento vencido',
    badge: 'PLAZO DE VIGENCIA CUMPLIDO',
    headerBg: 'bg-amber-900',
    badgeStyle: 'bg-amber-300/20 text-amber-100 border-amber-300/40',
    icon: AlertTriangle
  },
  revoked: {
    heading: 'Documento anulado',
    badge: 'REVOCADO POR LA ADMINISTRACIÓN',
    headerBg: 'bg-rose-950',
    badgeStyle: 'bg-rose-400/20 text-rose-200 border-rose-300/40',
    icon: XCircle
  },
  invalid: {
    heading: 'Documento no verificado',
    badge: 'SIN COINCIDENCIA EN REGISTRO',
    headerBg: 'bg-slate-800',
    badgeStyle: 'bg-white/15 text-slate-200 border-white/20',
    icon: HelpCircle
  },
  unavailable: {
    heading: 'No se pudo verificar',
    badge: 'CONSULTA NO DISPONIBLE',
    headerBg: 'bg-slate-800',
    badgeStyle: 'bg-amber-400/20 text-amber-200 border-amber-300/40',
    icon: WifiOff
  }
};

export function PublicCertificateVerificationView({ folio, hash, onBackToPortal }) {
  const [result, setResult] = useState({ state: 'loading' });
  const [retry, setRetry] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let current = true;
    setResult({ state: 'loading' });
    setCopied(false);
    certificateRegistry.verify(folio, hash).then((value) => {
      if (current) setResult(value || { state: 'invalid' });
    });
    return () => {
      current = false;
    };
  }, [folio, hash, retry]);

  const cfg = STATUS_CONFIG[result.state] || STATUS_CONFIG.invalid;
  const StatusIcon = cfg.icon;
  const d = result.details;
  const notaryText = result.state === 'valid' && clause(d, result.folio, result.date);

  const rows = d
    ? [
        ['Folio oficial', result.folio],
        ['Comunidad', d.community],
        ['Unidad', d.unit],
        ['Titular / Solicitante', d.name],
        ['RUT', d.rut ? formatRut(d.rut) : null],
        ['Saldo certificado', d.debt != null ? formatCLP(d.debt) : null],
        ['Saldo futuro en convenio', d.convenioDebt != null ? formatCLP(d.convenioDebt) : null],
        ['Alícuota informada', d.aliquot != null && String(d.aliquot) !== '' ? `${d.aliquot} %` : null],
        ['Cargo en comité', d.committeeRole || null],
        ['Fecha de emisión', formatDate(result.date)],
        ['Válido hasta', formatDate(result.expiresAt)],
        ['Emitido por', d.issuer]
      ].filter(([, v]) => v != null && String(v).trim() !== '')
    : [];

  return (
    <main className="min-h-screen bg-[#edf3ef] px-4 py-8 sm:py-14 text-slate-900">
      <article className="mx-auto max-w-2xl rounded-2xl overflow-hidden bg-white shadow-lg border border-slate-200">
        <header className={`${cfg.headerBg} px-6 sm:px-8 py-6 text-white border-b-4 border-[#c59f6d]`}>
          <div className="flex items-center justify-between gap-4">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider border ${cfg.badgeStyle}`}>
              <StatusIcon className={`w-3.5 h-3.5 ${cfg.iconSpin ? 'animate-spin' : ''}`} />
              {cfg.badge}
            </span>
            <img
              src="/brand/ARANPRO_logo_para_fondo_oscuro_trimmed.png"
              alt="ARANPRO"
              className="h-10 w-auto object-contain"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-4 tracking-tight">
            {cfg.heading}
          </h1>
          <p className="text-xs text-white/80 mt-1">
            Portal Oficial de Verificación Pública • Ley N° 21.442 de Copropiedad Inmobiliaria
          </p>
        </header>

        <section aria-live="polite" className="p-6 sm:p-8 space-y-5">
          {result.state === 'invalid' && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 leading-relaxed">
              El folio y el código de seguridad consultados no coinciden con ningún certificado registrado. Verifique haber escaneado el
              código QR completo impreso en el documento original.
            </div>
          )}

          {result.state === 'unavailable' && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3 text-sm text-amber-950">
              <p>
                No se pudo establecer comunicación con el registro oficial en este momento. Compruebe su conexión a internet e intente
                nuevamente.
              </p>
              <button
                type="button"
                onClick={() => setRetry((r) => r + 1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#103f32] text-white text-xs font-bold cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reintentar consulta
              </button>
            </div>
          )}

          {result.state === 'revoked' && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-900 leading-relaxed space-y-1">
              <p className="font-bold">Este certificado fue dejado sin efecto por la administración.</p>
              <p className="text-xs text-rose-800">
                Folio consultado: <span className="font-mono font-bold">{result.folio || folio}</span>. Solicite una nueva emisión
                vigente directamente a la administración de la comunidad.
              </p>
            </div>
          )}

          {d && (
            <>
              <div
                className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                  result.state === 'expired'
                    ? 'bg-amber-50 border-amber-300 text-amber-950 font-semibold'
                    : 'bg-[#eef5f0] border-[#cce0d3] text-[#103f32]'
                }`}
              >
                {result.state === 'expired'
                  ? 'Atención: El plazo de vigencia de 30 días de este documento expiró. Solicite una nueva emisión actualizada antes de cursar trámites.'
                  : 'Contraste cada uno de los datos mostrados a continuación con los impresos en el documento físico o PDF recibido.'}
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Tipo de documento registrado
                </span>
                <h2 className="text-lg font-extrabold text-[#103f32] mt-0.5">{d.type}</h2>
              </div>

              <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-1 text-sm">
                {rows.map(([k, v]) => (
                  <div key={k} className="py-2.5 grid grid-cols-1 sm:grid-cols-[185px_1fr] gap-1 sm:gap-4">
                    <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{k}</dt>
                    <dd className="font-bold text-slate-900 break-words">{v}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}

          {notaryText && (
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2.5 text-xs text-slate-700">
              <div className="font-bold text-[#103f32] uppercase tracking-wider text-[10px]">
                Constancia referencial para escritura o expediente
              </div>
              <p className="leading-relaxed">{notaryText}</p>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(notaryText);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2500);
                  } catch {
                    // ignore clipboard restrictions
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#103f32] text-white font-bold text-xs cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5 text-[#dfc39d]" />}
                <span>{copied ? 'Constancia copiada' : 'Copiar constancia'}</span>
              </button>
            </div>
          )}

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <img
                src="/brand/ARANPRO_sello_circular_integral_transparente.png"
                alt="Sello ARANPRO"
                className="w-7 h-7 object-contain"
              />
              <span>ARANPRO Gestión Integral • aranpro.cl</span>
            </div>
            <button
              type="button"
              onClick={onBackToPortal}
              className="inline-flex items-center gap-1 font-bold text-[#103f32] hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Ir al portal
            </button>
          </div>
        </section>
      </article>
    </main>
  );
}
