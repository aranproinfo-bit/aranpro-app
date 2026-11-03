import React from 'react';
import { ShieldCheck, CheckCircle2, Award, Building, ExternalLink } from 'lucide-react';

export const CgaiBadge = () => {
  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center space-y-4 group max-w-sm w-full">
      {/* Header Tag */}
      <div className="flex items-center justify-between w-full border-b border-slate-100 pb-2.5">
        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200/60">
          Gremio Oficial Chile
        </span>
        <span className="text-[11px] font-bold text-emerald-600 flex items-center">
          <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-500" />
          Socio Vigente
        </span>
      </div>

      {/* Chip Image Container - Clean rounded borders & drop shadow */}
      <div className="relative p-2 rounded-2xl bg-slate-900/5 border border-slate-100 w-full flex items-center justify-center group-hover:scale-[1.03] transition-transform duration-300">
        <img
          src="/certificaciones/chip_cgai_clean.png"
          alt="CGAI Chile Chip - Miembro Nº 13-563 Socio Activo"
          className="w-full max-w-[280px] h-auto object-contain drop-shadow-md rounded-xl"
        />
      </div>

      {/* Text Info */}
      <div className="space-y-1">
        <h4 className="text-base font-black text-slate-900 tracking-tight">
          CGAI Chile
        </h4>
        <p className="text-xs font-semibold text-slate-600">
          Colegio de Gestión y Administración Inmobiliaria
        </p>
        <p className="text-[11px] text-slate-500 pt-0.5">
          Miembro Nº 13-563 • Categoría: Socio Activo ★★★
        </p>
      </div>
    </div>
  );
};

export const AgacechBadge = () => {
  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center space-y-4 group max-w-sm w-full">
      {/* Header Tag */}
      <div className="flex items-center justify-between w-full border-b border-slate-100 pb-2.5">
        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-900 border border-rose-200/60">
          Asociación Gremial
        </span>
        <span className="text-[11px] font-bold text-emerald-600 flex items-center">
          <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-500" />
          Acreditado
        </span>
      </div>

      {/* Chip Image Container - Clean rounded borders & drop shadow */}
      <div className="relative p-2 rounded-2xl bg-slate-900/5 border border-slate-100 w-full flex items-center justify-center group-hover:scale-[1.03] transition-transform duration-300">
        <img
          src="/certificaciones/chip_agacech_clean.png"
          alt="AGACECH Chip - Administrador Acreditado"
          className="w-full max-w-[280px] h-auto object-contain drop-shadow-md rounded-xl"
        />
      </div>

      {/* Text Info */}
      <div className="space-y-1">
        <h4 className="text-base font-black text-slate-900 tracking-tight">
          AGACECH
        </h4>
        <p className="text-xs font-semibold text-slate-600">
          Asociación Gremial de Administradores de Condominios y Edificios de Chile
        </p>
        <p className="text-[11px] text-slate-500 pt-0.5">
          Estado: Administrador Acreditado
        </p>
      </div>
    </div>
  );
};
