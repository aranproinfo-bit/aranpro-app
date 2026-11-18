import React from 'react';

export const workerRoleOptions = [
  'Conserje Titular Diurno', 'Conserje Nocturno & Rondas', 'Conserje de Reemplazo / Fin de Semana',
  'Mayordomo de Edificio', 'Auxiliar de Aseo & Espacios Comunes', 'Jardinero & Mantenimiento Áreas Verdes',
  'Rondero de Seguridad Nocturna', 'Portero / Control de acceso', 'Nochero', 'Guardia de seguridad',
  'Auxiliar de mantención general', 'Asistente administrativo de comunidad'
];
export default function LaborRoleSelect({ value, onChange }) {
  const custom = !workerRoleOptions.includes(value);
  return <div>
    <label className="block font-bold text-slate-700 mb-1" htmlFor="staff-role-select">Cargo laboral</label>
    <select id="staff-role-select" value={custom ? '__custom__' : value} onChange={e=>onChange(e.target.value==='__custom__'?'':e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold">
      {workerRoleOptions.map(role=><option key={role} value={role}>{role}</option>)}
      <option value="__custom__">Otro cargo (especificar)</option>
    </select>
    {custom&&<label className="block font-bold text-slate-700 mt-2">Especifica el cargo<input required value={value||''} onChange={e=>onChange(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl" /></label>}
  </div>;
}
