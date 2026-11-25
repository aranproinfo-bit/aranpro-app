import React from 'react';
import { formatCLP } from '../../utils/formatters';
import {CommunityLaborHeader, CommunityLaborFooter} from './CommunityLaborStationery';
import LaborContractSignatures from './LaborContractSignatures';

export function OfficePayrollPrint({workers, settings={}, pdfStyle}) {
  const title='Nómina de trabajadores de oficina';
  return <div id="printable-office-payroll-sheet" data-pdf-style={pdfStyle}><article data-staff-report="">
    <CommunityLaborHeader settings={settings} employerKind="company" title={title} badge="NÓMINA INTERNA"/>
      <table data-report-block="" className="w-full border-collapse text-[9px]"><thead><tr className="bg-[#0F3D2E] text-white"><th className="p-2 text-left">Colaborador / RUT</th><th className="p-2 text-left">Cargo y comunidades</th><th className="p-2 text-left">Vínculo / previsión</th><th className="p-2 text-right">Sueldo bruto</th><th className="p-2 text-right">Imposiciones / ret.</th><th className="p-2 text-right">Líquido</th><th className="p-2 text-center">Previred</th></tr></thead><tbody>{workers.map(w => { const gross = Number(w.grossSalary) || 0; const imp = w.contractType === 'Boleta de Honorarios' ? Math.round(gross * ((Number(w.afpRate) || 13.75) / 100)) : Math.round(gross * (((Number(w.afpRate) || 11) + (Number(w.healthRate) || 7) + 0.6) / 100)); return <tr key={w.id} className="border-b border-slate-200"><td className="p-2"><strong>{w.name}</strong><br/>RUT: {w.rut}</td><td className="p-2">{w.role}<br/>{w.assignedCommunities}</td><td className="p-2">{w.contractType}<br/>{w.afpName} • {w.healthSystem}</td><td className="p-2 text-right">{formatCLP(gross)}</td><td className="p-2 text-right">{formatCLP(imp)}</td><td className="p-2 text-right">{formatCLP(gross - imp)}</td><td className="p-2 text-center">{w.previredStatus}</td></tr>})}</tbody></table>
    {!workers.length && <p data-report-block="">No hay trabajadores registrados.</p>}
    <LaborContractSignatures collective employerKind="company" settings={settings} includeSignature
      form={{nombre_representante:settings.adminName,rut_representante:settings.adminRut}}/>
    <CommunityLaborFooter settings={settings} title={title}/>
  </article></div>;
}
