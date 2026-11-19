export function normalizeLaborMinimum(data,today) {
  const value=data?.ingresoMinimo?.valor, since=data?.ingresoMinimo?.vigenteDesde;
  const d=new Date(`${since||''}T00:00:00Z`);
  if(data?.fecha!==today || !Number.isFinite(value) || value<=0 || !/^\d{4}-\d{2}-\d{2}$/.test(since||'') || Number.isNaN(d.getTime()) || d.toISOString().slice(0,10)!==since || since>today || since.slice(0,4)!==today.slice(0,4)) return null;
  return {value,since,asOf:today};
}
