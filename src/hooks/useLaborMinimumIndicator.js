import { useEffect, useState } from 'react';
import { chileToday } from './useEconomicIndicators';
import { normalizeLaborMinimum } from '../utils/laborMinimumIndicator';

// Referencia externa: no habilita por sí sola una emisión para firma.
export function useLaborMinimumIndicator() {
  const [state,setState]=useState({reference:null,status:'cargando',today:chileToday()});
  useEffect(()=>{
    let active=true;const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),12000);const today=chileToday();
    fetch('https://indicadores.cl/api/v1/hoy.json',{signal:controller.signal}).then(r=>{if(!r.ok)throw new Error('No disponible');return r.json();}).then(data=>{const reference=normalizeLaborMinimum(data,today);if(active)setState({reference,status:reference?'vigente':'no_disponible',today});}).catch(()=>{if(active)setState({reference:null,status:'no_disponible',today});}).finally(()=>clearTimeout(timer));
    return ()=>{active=false;clearTimeout(timer);controller.abort();};
  },[]);
  return state;
}
