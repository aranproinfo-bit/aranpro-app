import React from 'react';
import { AranproOfficialSeal } from '../common/MauranLogo';

const normalizedRut = value => String(value || '').replace(/[.\s-]/g, '').toUpperCase();

export default function LaborContractSignatures({ form, settings, includeSignature = false, employerKind = 'community' }) {
  const signature = settings.signatureDataUrl || settings.signature || settings.digitalSignature;
  const administratorRut = normalizedRut(settings.adminRut);
  const representativeRut = normalizedRut(form.rut_representante);
  const sameRepresentative = administratorRut && representativeRut && administratorRut === representativeRut;

  return <div className="labor-contract-end" style={{breakInside:'avoid', pageBreakInside:'avoid', marginTop:28}}>
    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:26, alignItems:'end', textAlign:'center'}}>
      <div>
        <div style={{height:56}} />
        <div style={{borderTop:'1.5px solid #1e293b', paddingTop:5}}>
          <strong style={{display:'block', fontSize:11}}>{form.nombre_trabajador || '[PENDIENTE]'}</strong>
          <div style={{fontSize:9, color:'#475569'}}>RUT: {form.rut_trabajador || '[PENDIENTE]'}</div>
          <div style={{fontSize:9, fontWeight:700, color:'#0f3d2e'}}>FIRMA DEL TRABAJADOR</div>
        </div>
      </div>
      <div>
        <div style={{height:56, display:'flex', justifyContent:'center', alignItems:'flex-end', gap:8, marginBottom:4}}>
          <AranproOfficialSeal size="sm" showText companyRut={settings.companyRut && !String(settings.companyRut).includes('76.999.888') ? settings.companyRut : ''} rnacNumber={settings.rnacNumber || ''} />
          {includeSignature && sameRepresentative && signature && <img src={signature} alt="Firma de administración" style={{height:42, width:'auto', maxWidth:100, objectFit:'contain', transform:`scale(${Number(settings.signatureScale)||1.35})`, transformOrigin:'bottom center'}} />}
        </div>
        <div style={{borderTop:'1.5px solid #1e293b', paddingTop:5}}>
          <strong style={{display:'block', fontSize:11}}>{form.nombre_representante || '[PENDIENTE]'}</strong>
          <div style={{fontSize:9, color:'#475569'}}>RUT: {form.rut_representante || '[PENDIENTE]'}</div>
          <div style={{fontSize:9, fontWeight:700, color:'#0f3d2e'}}>EN REPRESENTACIÓN {employerKind === 'company' ? 'DEL EMPLEADOR' : 'DE LA COMUNIDAD'}</div>
        </div>
      </div>
    </div>
  </div>;
}
