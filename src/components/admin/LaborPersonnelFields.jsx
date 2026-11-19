import React from 'react';
import { AFP_RATES_CHILE, HEALTH_SYSTEMS_CHILE, MUTUAL_ENTITIES_CHILE } from '../../utils/chileanPayrollCalculations';

export default function LaborPersonnelFields({ data, onChange, section }) {
  const field = (key,label,type='text') => <label className="block text-sm font-bold text-slate-700" key={key}>{label}
    <input type={type} min={type==='number'?'0':undefined} value={data[key]??''} onChange={e=>onChange(key,e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-normal" />
  </label>;
  if (section==='personal') return <section className="rounded-xl border border-slate-200 bg-white p-4"><h4 className="mb-3 font-bold text-[#0F3D2E]">Contacto del trabajador</h4>{field('phone','Teléfono / WhatsApp')}</section>;
  return <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4"><h4 className="font-bold text-[#0F3D2E]">Datos para remuneraciones</h4>
    <p className="text-sm text-slate-600">Estos datos se guardan en la ficha del trabajador para su liquidación.</p>
    <div className="grid gap-4 sm:grid-cols-2">
      {field('contractualNightBonus','Bono nocturno mensual ($)','number')}
      {field('contractualResponsibilityBonus','Bono de responsabilidad mensual ($)','number')}
      {field('allowanceColacion','Asignación mensual de colación ($)','number')}
      {field('allowanceMovilizacion','Asignación mensual de movilización ($)','number')}
      <label className="text-sm font-bold text-slate-700">Gratificación legal
        <select id="labor-field-hasLegalGratification" value={data.hasLegalGratification === true ? 'si' : data.hasLegalGratification === false ? 'no' : ''} onChange={e=>onChange('hasLegalGratification',e.target.value === '' ? null : e.target.value === 'si')} className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2">
          <option value="">Seleccionar</option><option value="si">Artículo 50 · 25 % con tope legal</option><option value="no">Otra modalidad o no aplica</option>
        </select>
      </label>
      <label className="text-sm font-bold text-slate-700">AFP
        <select id="labor-field-afpId" value={data.afpId||''} onChange={e=>onChange('afpId',e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2"><option value="">Seleccionar AFP</option>{AFP_RATES_CHILE.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select>
      </label>
      <label className="text-sm font-bold text-slate-700">Sistema de salud
        <select id="labor-field-healthId" value={data.healthId||''} onChange={e=>onChange('healthId',e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2"><option value="">Seleccionar sistema</option>{HEALTH_SYSTEMS_CHILE.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select>
      </label>
      <label className="text-sm font-bold text-slate-700">Mutualidad
        <select value={data.mutualEntity||''} onChange={e=>onChange('mutualEntity',e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2"><option value="">Seleccionar mutualidad</option>{data.mutualEntity && !MUTUAL_ENTITIES_CHILE.some(item=>item.name===data.mutualEntity) && <option>{data.mutualEntity}</option>}{MUTUAL_ENTITIES_CHILE.map(item=><option key={item.id} value={item.name}>{item.name}</option>)}</select>
      </label>
      {field('mutualRate','Tasa de mutualidad (%)','number')}
      <label className="text-sm text-slate-700"><input type="checkbox" checked={!!data.isExemptFromAfc} onChange={e=>onChange('isExemptFromAfc',e.target.checked)} /> Exento de AFC cuando corresponda</label>
      {field('bankName','Banco para pago')}
      {field('accountType','Tipo de cuenta')}
      {field('accountNumber','Número de cuenta')}
    </div>
  </section>;
}
