import { useEffect, useState } from 'react';
import { chileToday } from './useEconomicIndicators';
import { normalizeLaborMinimum } from '../utils/laborMinimumIndicator';

// Referencia externa: no habilita por sí sola una emisión para firma.
export function useLaborMinimumIndicator() {
  const [state,setState]=useState({reference:null,status:'cargando',today:chileToday()});
  useEffect(()=>{
    let active=true;
    let controller;
    let timer;
    let requestedDay='';
    const refresh=()=>{
      const today=chileToday();
      if (requestedDay===today) return;
      requestedDay=today;
      controller?.abort();
      controller=new AbortController();
      const currentController=controller;
      clearTimeout(timer);
      timer=setTimeout(()=>currentController.abort(),12000);
      setState({reference:null,status:'cargando',today});
      fetch('https://indicadores.cl/api/v1/hoy.json',{signal:currentController.signal})
        .then(r=>{if(!r.ok)throw new Error('No disponible');return r.json();})
        .then(data=>{const reference=normalizeLaborMinimum(data,today);if(active && !currentController.signal.aborted)setState({reference,status:reference?'vigente':'no_disponible',today});})
        .catch(()=>{if(active && currentController===controller)setState({reference:null,status:'no_disponible',today});})
        .finally(()=>{if(currentController===controller)clearTimeout(timer);});
    };
    refresh();
    const interval=setInterval(refresh,60000);
    const onVisible=()=>{if(document.visibilityState==='visible')refresh();};
    document.addEventListener('visibilitychange',onVisible);
    return ()=>{active=false;clearInterval(interval);clearTimeout(timer);controller?.abort();document.removeEventListener('visibilitychange',onVisible);};
  },[]);
  return state;
}
