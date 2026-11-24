import React from 'react';

export function CommunityLaborHeader({settings={},community,badge,title,folio,period}) {
  const companyRut=settings?.companyRut;
  return <div data-labor-header="" data-labor-title={title} data-labor-community={community?.name} className="labor-contract-header flex flex-col sm:flex-row sm:items-start justify-between pb-3.5 border-b-2 border-[#0F3D2E] gap-3">
    <div className="flex items-center space-x-3.5">
      <img src="/brand/ARANPRO_isotipo_trimmed.png" alt="ARANPRO" className="payroll-brand-logo h-9 w-auto shrink-0 object-contain"/>
      <div className="space-y-0.5">
        <div className="text-sm font-black text-[#0F3D2E] tracking-tight">{settings?.brandName || 'ARANPRO'} • {settings?.subtitle || 'Gestión Integral'}</div>
        <div className="text-[10px] text-slate-600 font-bold tracking-wide">ADMINISTRACIÓN DE CONDOMINIOS • RECURSOS HUMANOS</div>
        <div className="text-[9px] text-slate-500">{companyRut && !String(companyRut).includes('76.999.888') && <>RUT Empresa: <strong>{companyRut}</strong> • </>}Ley N° 21.442 de Copropiedad Inmobiliaria</div>
      </div>
    </div>
    <div className="labor-document-identity text-right space-y-0.5 shrink-0">
      <span className="text-[10px] font-black uppercase tracking-wider text-[#0F3D2E] bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 inline-block">{badge}</span>
      <div className="text-xs font-black text-slate-900">{title}</div>
      <div className="text-[10px] text-slate-600 font-mono">{community?.name}{folio && ' • Folio: '+folio}</div>
      {(period || community?.city) && <div className="text-[9px] text-slate-400">{[community?.city,period].filter(Boolean).join(' • ')}</div>}
    </div>
  </div>;
}

export function CommunityLaborFooter({settings={},title,page=1,total=1}) {
  return <div data-labor-footer="" className="pt-2.5 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-500 font-mono mt-auto">
    <div>ARANPRO Gestión Integral • {settings?.website || 'https://aranpro.cl'}</div>
    <div className="font-bold text-[#0F3D2E]">Página <span data-page-number="">{page} de {total}</span> • {title}</div>
    <div>Fono Directo: {settings?.phone || '+56 9 5811 8504'}</div>
  </div>;
}

