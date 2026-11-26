import React, { useEffect, useState } from 'react';
import { certificateRegistry } from '../../services/supabase';
import { clause } from '../../services/documentRegistry';
import { formatCLP, formatDate } from '../../utils/formatters';

const headings = {
  loading:'Consultando el registro…', valid:'Documento vigente', expired:'Documento vencido',
  revoked:'Documento anulado', invalid:'Documento no verificado', unavailable:'No se pudo verificar'
};
export function PublicCertificateVerificationView({folio, hash, onBackToPortal}) {
  const [result,setResult] = useState({state:'loading'});
  const [retry,setRetry] = useState(0);
  const [notice,setNotice] = useState('');
  useEffect(() => {
    let current = true;
    setResult({state:'loading'});
    setNotice('');
    certificateRegistry.verify(folio,hash).then(value => {if(current) setResult(value);});
    return () => {current=false;};
  }, [folio,hash,retry]);
  const d=result.details;
  const text = result.state === 'valid' && clause(d,result.folio,result.date);
  return <main className="min-h-screen bg-[#edf3ef] p-5 sm:py-16 text-slate-900">
    <article className="mx-auto max-w-2xl rounded-2xl overflow-hidden bg-white shadow-sm">
      <header className="bg-[#103f32] px-7 py-7 text-white border-b-4 border-[#c29d6e]">
        <p className="text-xs font-bold uppercase tracking-widest">ARANPRO · Verificación de certificados</p>
        <h1 className="text-3xl font-bold mt-3">{headings[result.state] || headings.invalid}</h1>
      </header>
      <section aria-live="polite" className="p-7 space-y-5">
        {result.state==='invalid' && <p>El folio y el código no coinciden con un certificado registrado. Escanee el QR completo del documento.</p>}
        {result.state==='unavailable' && <><p>No se pudo consultar el registro. Compruebe su conexión y vuelva a intentar.</p><button onClick={()=>setRetry(retry+1)}>Reintentar consulta</button></>}
        {result.state==='revoked' && <p>La administración anuló este certificado.</p>}
        {d && <><h2 className="text-lg font-bold">{d.type}</h2>
          <p>{result.state==='expired'?'La vigencia de 30 días terminó. Solicite una nueva emisión.':'Compare estos datos con los del documento recibido.'}</p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 text-sm">
          {Object.entries({'Folio':result.folio,'Comunidad':d.community,'Unidad':d.unit,'Titular':d.name,'RUT':d.rut,'Saldo certificado':d.debt!=null?formatCLP(d.debt):null,'Alícuota':d.aliquot!=null?d.aliquot+'%':null,'Emisión':formatDate(result.date),'Válido hasta':formatDate(result.expiresAt),'Emisor':d.issuer}).filter(([,v])=>v!=null && v!=='').map(([k,v])=><React.Fragment key={k}><dt className="text-slate-600">{k}</dt><dd className="font-semibold break-all">{v}</dd></React.Fragment>)}</dl></>}
        {text && <div className="border-t pt-4 text-sm"><p>{text}</p><button className="font-bold mt-3" onClick={async()=>{try{await navigator.clipboard.writeText(text);setNotice('Texto copiado.');}catch{setNotice('Seleccione el texto para copiarlo.');}}}>Copiar constancia</button> {notice}</div>}
        <button className="text-sm underline" onClick={onBackToPortal}>Volver al portal</button>
      </section>
    </article></main>;
}
