import React from 'react';
import { AranproOfficialSeal } from '../common/MauranLogo';

const normalizedRut = value => String(value || '').replace(/[.\s-]/g, '').toUpperCase();

export default function LaborContractSignatures({ form, settings, includeSignature = false, collective = false, witness, employerKind = 'community', workerCaption = 'FIRMA DEL TRABAJADOR' }) {
  const signature = settings.signatureDataUrl || settings.signature || settings.digitalSignature;
  const administratorRut = normalizedRut(settings.adminRut);
  const representativeRut = normalizedRut(form.rut_representante);
  const sameRepresentative = administratorRut && representativeRut && administratorRut === representativeRut;

  return <div className="labor-contract-end" style={{breakInside:'avoid', pageBreakInside:'avoid', marginTop:28}}>
    {witness && <div className="mb-4 grid grid-cols-2 items-end gap-8 text-[10px] text-slate-700">
      <div><strong>{witness}</strong><div className="mt-2">Nombre y calidad ___________________________________</div><div className="mt-2">Lugar y fecha ______________________________________</div></div>
      <div className="border-t border-slate-800 pt-1 text-center">Firma y timbre de quien interviene</div>
    </div>}
    <div className="labor-signers" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:26, alignItems:'end', textAlign:'center'}}>
      {!collective && <div>
        <div style={{height:56}} />
        <div className="labor-signer-details" style={{borderTop:'1.5px solid #1e293b', paddingTop:5}}>
          <strong style={{display:'block', fontSize:11}}>{form.nombre_trabajador || '[PENDIENTE]'}</strong>
          <div style={{fontSize:9, color:'#475569'}}>RUT: {form.rut_trabajador || '[PENDIENTE]'}</div>
          <div style={{fontSize:9, fontWeight:700, color:'#0f3d2e'}}>{workerCaption}</div>
        </div>
      </div>}
      <div style={{gridColumn:2}}>
        <div style={{height:56, display:'flex', justifyContent:'center', alignItems:'flex-end', gap:8, marginBottom:4}}>
          <AranproOfficialSeal size="sm" showText companyRut={settings.companyRut && !String(settings.companyRut).includes('76.999.888') ? settings.companyRut : ''} rnacNumber={employerKind === 'community' && !sameRepresentative ? '' : settings.rnacNumber || ''} />
          {includeSignature && sameRepresentative && signature && <img src={signature} alt="Firma de administración" className="labor-signature-image" style={{'--sign-scale':Number(settings.signatureScale)||1.35,height:42, width:'auto', maxWidth:100, objectFit:'contain', transform:`scale(${Number(settings.signatureScale)||1.35})`, transformOrigin:'bottom center'}} />}
        </div>
        <div className="labor-signer-details" style={{borderTop:'1.5px solid #1e293b', paddingTop:5}}>
          <strong style={{display:'block', fontSize:11}}>{form.nombre_representante || '[PENDIENTE]'}</strong>
          <div style={{fontSize:9, color:'#475569'}}>RUT: {form.rut_representante || '[PENDIENTE]'}{employerKind==='community' && sameRepresentative && settings.rnacNumber && ' • RNAC Minvu N° '+settings.rnacNumber}</div>
          <div style={{fontSize:9, fontWeight:700, color:'#0f3d2e'}}>{collective && form.calidad_representante && form.calidad_representante+' · '}EN REPRESENTACIÓN {employerKind === 'company' ? 'DEL EMPLEADOR' : 'DE LA COMUNIDAD'}</div>
        </div>
      </div>
    </div>
  </div>;
}
