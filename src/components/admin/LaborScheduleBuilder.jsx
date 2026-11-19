import React from 'react';
import { weekDays, summarizeWeeklySchedule } from '../../utils/laborWeeklySchedule';

export default function LaborScheduleBuilder({rows=[],onChange,onApply,applied}) {
  const result=summarizeWeeklySchedule(rows);
  const source = rows.find(row => row?.active && row.start && row.end && row.mealIncluded && String(row.mealMinutes ?? '') !== '');
  const emptyDay = row => row?.active && !row.start && !row.end && !row.mealIncluded && String(row.mealMinutes ?? '') === '';
  const copyHours = () => onChange(rows.map(row => emptyDay(row) ? {...source, active:true} : row));
  const set=(i,key,value)=>{const next=Array.from({length:7},(_,n)=>({...rows[n]}));next[i][key]=value;onChange(next);};
  return <section className="border border-slate-300 rounded-xl p-3 space-y-3">
    <h3 className="font-bold text-sm text-[#0F3D2E]">Horario semanal fijo</h3>
    <p className="text-xs text-slate-600">Marca los días de trabajo. Si varios tienen el mismo horario, completa uno y copia sus horas a los demás.</p>
    {weekDays.map((day,i)=>{const r=rows[i]||{};return <div key={day} className="grid grid-cols-2 md:grid-cols-5 gap-2 items-end text-xs">
      <label><input type="checkbox" checked={!!r.active} onChange={e=>set(i,'active',e.target.checked)}/> {day}</label>
      {r.active&&<><label>Entrada<input aria-label={`${day} entrada`} type="time" className="block border rounded p-1 w-full" value={r.start||''} onChange={e=>set(i,'start',e.target.value)}/></label>
      <label>Salida<input aria-label={`${day} salida`} type="time" className="block border rounded p-1 w-full" value={r.end||''} onChange={e=>set(i,'end',e.target.value)}/></label>
      <label>Colación (minutos)<input aria-label={`${day} minutos de colación`} type="number" min="0" step="1" className="block border rounded p-1 w-full" value={r.mealMinutes??''} onChange={e=>set(i,'mealMinutes',e.target.value)}/></label>
      <label>Colación<select aria-label={`${day} tratamiento de colación`} className="block border rounded p-1 w-full" value={r.mealIncluded||''} onChange={e=>set(i,'mealIncluded',e.target.value)}><option value="">Seleccionar</option><option value="no">No imputada</option><option value="yes">Imputada</option></select></label></>}
    </div>})}
    {source && rows.some(emptyDay) && <button type="button" onClick={copyHours} className="rounded border px-3 py-2 text-xs">Copiar horario de {weekDays[rows.indexOf(source)]} a los días marcados vacíos</button>}
    {result.errors.length>0?<ul className="text-xs text-amber-900 list-disc pl-4">{result.errors.map((e,i)=><li key={i}>{e}</li>)}</ul>:<p className="text-xs font-bold">Total calculado: {Math.floor(result.totalMinutes/60)} h {result.totalMinutes%60} min semanales.</p>}
    <button type="button" disabled={result.errors.length>0} className="border rounded px-3 py-1 text-xs disabled:opacity-40" onClick={()=>onApply(result)}>Usar horario en el contrato</button>
    {applied&&<span className="text-xs text-green-800 ml-2">Horario incorporado al borrador.</span>}
  </section>;
}
