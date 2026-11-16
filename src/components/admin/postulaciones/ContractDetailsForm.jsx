import React from 'react';
import { activeContractDetails, contractFields, resolveContractDetails } from '../../../utils/contractDetails';
export function ContractDetailsForm({ proposalConfig, setProposalConfig, empresaForm, companySettings, onSave }) {
  const details = resolveContractDetails(proposalConfig, empresaForm, companySettings);
  const update = (key, value) => setProposalConfig(prev => ({...prev, contractDetailsFor:prev.targetCondo,
    contractDetails:{...activeContractDetails(prev), [key]:value}}));
  return <details className="rounded-xl border border-emerald-200 bg-white p-4">
    <summary className="font-bold text-[#0F3D2E] cursor-pointer">Datos para formalizar el contrato</summary>
    <p className="text-xs text-slate-600 my-3">La oferta aporta los honorarios y servicios. Mi Empresa aporta administrador, RUT, RNAC, contactos y firma. Completa aquí lo restante para esta comunidad. Guarda en CRM antes de cambiar de comunidad. Las sugerencias requieren tu selección; los campos vacíos permanecen en blanco.</p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <label className="text-xs font-semibold">Representante del comité<input className="block w-full rounded border p-2 mt-1" value={proposalConfig.committeePresidentName || ''} maxLength={120} onChange={e=>setProposalConfig(prev=>({...prev,committeePresidentName:e.target.value}))}/></label>
      {contractFields.map(([key,label,options])=><label key={key} className="text-xs font-semibold" htmlFor={`contract-${key}`}>{label}
        {options.length>0 && <select aria-label={`Sugerencias: ${label}`} className="block w-full border rounded p-1 my-1" value="" onChange={e=>update(key,e.target.value)}><option value="">Elegir propuesta rápida</option>{options.map(option=><option key={option}>{option}</option>)}</select>}
        <input id={`contract-${key}`} className="block w-full rounded border p-2 mt-1 font-normal" maxLength={120} value={details[key] || ''} onChange={e=>update(key,e.target.value)} placeholder="Completar o dejar en blanco"/>
      </label>)}
    </div>
    {onSave && <button type="button" onClick={onSave} className="mt-4 rounded bg-[#0F3D2E] text-white px-4 py-2 text-sm font-bold">Guardar contrato en CRM</button>}
    <p className="text-xs text-slate-600 mt-3">La fecha de firma y la verificación RNAC se ingresan expresamente; no se presumen por generar el documento.</p>
  </details>;
}
