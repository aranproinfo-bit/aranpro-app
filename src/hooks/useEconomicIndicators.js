import { useEffect, useState } from 'react';

const ENDPOINT = 'https://indicadores.cl/api/v1/hoy.json';
const CACHE_KEY = 'aranpro-economic-indicators-v1';
const HOUR = 60 * 60 * 1000;
let pending;
let lastAttemptAt = 0;
let lastAttemptDay = '';

// Los indicadores deben compararse con el día civil chileno, no con UTC.
export const chileToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const validNumber = value => typeof value === 'number' && Number.isFinite(value) && value > 0;

export function normalizeEconomicIndicators(data) {
  if (!data || !validNumber(data.uf?.valor) || !/^\d{4}-\d{2}-\d{2}$/.test(data.uf?.fecha || '') || !validNumber(data.utm?.valor) || !/^\d{4}-\d{2}$/.test(data.utm?.mes || '')) throw new Error('Indicadores incompletos');
  return { uf: { value: data.uf.valor, date: data.uf.fecha }, utm: { value: data.utm.valor, month: data.utm.mes }, ipc: Number.isFinite(data.ipc?.variacionMensual) && /^\d{4}-\d{2}$/.test(data.ipc?.mes || '') ? { value: data.ipc.variacionMensual, month: data.ipc.mes } : null };
}

function getCache() {
  try { const saved = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); return saved && Number.isFinite(saved.fetchedAt) && saved.data ? saved : null; } catch { return null; }
}

async function fetchIndicators() {
  if (!pending) pending = (async () => {
    lastAttemptAt = Date.now();
    lastAttemptDay = chileToday();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(ENDPOINT, { signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = { data: normalizeEconomicIndicators(await response.json()), fetchedAt: Date.now() };
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(result)); } catch { /* Cache opcional. */ }
      return result;
    } finally { clearTimeout(timeout); }
  })().finally(() => { pending = null; });
  return pending;
}

export function useEconomicIndicators(enabled = true) {
  const [snapshot, setSnapshot] = useState(getCache);
  const [error, setError] = useState(false);
  const [today, setToday] = useState(chileToday);
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    const refresh = async () => {
      const day = chileToday(); setToday(day);
      const cached = getCache();
      if (cached && Date.now() - cached.fetchedAt < HOUR && cached.data?.uf?.date === day && cached.data?.utm?.month === day.slice(0, 7)) { setSnapshot(cached); setError(false); return; }
      if (!pending && lastAttemptDay === day && Date.now() - lastAttemptAt < HOUR) { setError(true); return; }
      try { const current = await fetchIndicators(); if (active) { setSnapshot(current); setError(false); } }
      catch { if (active) setError(true); }
    };
    refresh();
    // Verifica el cambio de día sin consultar la API más de una vez por hora
    // mientras la caché siga vigente para la fecha chilena.
    const interval = setInterval(refresh, 60 * 1000);
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { active = false; clearInterval(interval); document.removeEventListener('visibilitychange', onVisible); };
  }, [enabled]);
  const data = snapshot?.data;
  return { data, error, today, ufCurrent: !!data && validNumber(data.uf?.value) && data.uf?.date === today, utmCurrent: !!data && validNumber(data.utm?.value) && data.utm?.month === today.slice(0, 7) };
}
