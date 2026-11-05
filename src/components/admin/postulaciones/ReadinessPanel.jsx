import React from 'react';
import {
  CheckCircle2, AlertTriangle, XCircle, ArrowRight, ShieldAlert, Download, ClipboardCheck
} from 'lucide-react';
import { TIER_META } from '../../../utils/postulationReadiness';

const RING = {
  emerald: 'stroke-emerald-500',
  amber: 'stroke-amber-500',
  rose: 'stroke-rose-500',
  slate: 'stroke-slate-400'
};

const BADGE = {
  emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  amber: 'bg-amber-50 text-amber-800 border-amber-200',
  rose: 'bg-rose-50 text-rose-800 border-rose-200',
  slate: 'bg-slate-100 text-slate-700 border-slate-200'
};

const ACTION_LABEL = {
  documents: 'Ir a Acreditaciones',
  signature: 'Ir a Firma Digital',
  company: 'Ir a Empresa & RUT',
  references: 'Ir a Referencias'
};

const StatusIcon = ({ status }) => {
  if (status === 'ok') return <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />;
  if (status === 'warn') return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />;
  return <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />;
};

export const ReadinessPanel = ({ readiness, onAction, onDownloadPackage, packageCount }) => {
  const { score, items, blockers, level, security } = readiness;
  const R = 42;
  const C = 2 * Math.PI * R;

  const tiers = ['legal', 'habitual', 'diferenciador', 'formal'];

  return (
    <div className="space-y-5 animate-in fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 p-5 md:p-6 shadow-xs flex flex-col md:flex-row md:items-center gap-5">
        <div className="relative w-28 h-28 shrink-0 self-center">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r={R} fill="none" strokeWidth="9" className="stroke-slate-100" />
            <circle
              cx="50" cy="50" r={R} fill="none" strokeWidth="9" strokeLinecap="round"
              className={RING[level.tone]}
              strokeDasharray={C}
              strokeDashoffset={C * (1 - score / 100)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-slate-900 leading-none">{score}</span>
            <span className="text-[9px] font-bold uppercase text-slate-400">de 100</span>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <span className={`inline-block text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${BADGE[level.tone]}`}>
            {level.label}
          </span>
          <h4 className="text-base font-black text-slate-900">Preparación para postular a nuevas comunidades</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            El puntaje mide si tu material está completo, vigente y respaldado. Los comités revisan primero la habilitación legal (RNAC y antecedentes),
            luego la documentación habitual y por último lo que te diferencia. Corrige primero lo marcado en rojo.
          </p>
          <button
            type="button"
            onClick={onDownloadPackage}
            disabled={!packageCount}
            className="px-3.5 py-2 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#D4B895]" />
            Descargar respaldos numerados ({packageCount} archivo{packageCount === 1 ? '' : 's'})
          </button>
        </div>
      </div>

      {blockers.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2">
          <div className="text-xs font-black text-rose-900 flex items-center gap-1.5">
            <XCircle className="w-4 h-4" />
            Puntos críticos antes de enviar material a un comité ({blockers.length})
          </div>
          <ul className="space-y-2">
            {blockers.map((b) => (
              <li key={b.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white/70 rounded-xl p-2.5 border border-rose-100">
                <div className="text-[11.5px] text-rose-950 leading-snug">
                  <strong>{b.label}.</strong> {b.detail}
                </div>
                {b.action && (
                  <button
                    type="button"
                    onClick={() => onAction(b.action)}
                    className="shrink-0 px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {ACTION_LABEL[b.action]} <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {security.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-[11.5px] text-amber-950 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            {security.map((s) => (
              <p key={s.id}><strong>{s.label}.</strong> {s.detail}</p>
            ))}
          </div>
        </div>
      )}

      {tiers.map((tier) => {
        const group = items.filter((i) => i.tier === tier);
        if (!group.length) return null;
        const meta = TIER_META[tier];
        const done = group.filter((i) => i.status === 'ok').length;
        return (
          <div key={tier} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-[#0F3D2E]" />
                <span className="text-xs font-black text-slate-900 uppercase tracking-wide">{meta.label}</span>
              </div>
              <span className="text-[11px] font-bold text-slate-500">{done}/{group.length} completos</span>
            </div>
            <ul className="divide-y divide-slate-100">
              {group.map((i) => (
                <li key={i.key} className="px-4 py-3 flex items-start gap-2.5">
                  <StatusIcon status={i.status} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-900">{i.label}</div>
                    <div className="text-[11px] text-slate-600 mt-0.5">{i.detail}</div>
                    <div className="text-[10.5px] text-slate-400 mt-0.5">{i.hint}</div>
                  </div>
                  {i.status !== 'ok' && i.action && (
                    <button
                      type="button"
                      onClick={() => onAction(i.action)}
                      className="shrink-0 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      Resolver <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
};
