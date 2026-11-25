import React from 'react';

export default function AccountingSignature({company, showIdentification = false}) {
  const name = company?.adminName || company?.administratorName || 'Firma de la administración';
  return (
    <div className="auth" style={{display:'flex', alignItems:'center', justifyContent:'flex-end', gap:'3mm', marginTop:'auto', padding:'1.5mm 0', breakInside:'avoid', color:'#19382e'}}>
      <img src="/brand/ARANPRO_sello_circular_integral_transparente.png" alt="Sello ARANPRO" style={{width:'11mm',height:'11mm',objectFit:'contain'}}/>
      <div style={{fontSize:'8.4pt'}}><b style={{display:'block'}}>Administración delegada</b><span className="small">ARANPRO Gestión Integral</span></div>
      <div className="sign" style={{textAlign:'center'}}>
        {company?.signatureDataUrl && <img src={company.signatureDataUrl} alt="Firma del administrador" style={{width:'27mm',height:'8mm',objectFit:'contain',margin:'0 auto'}}/>}
        <div className="signature" style={{width:'43mm',borderTop:'1px solid #64786c',paddingTop:'1mm',fontSize:'8.4pt'}}><b>{name}</b>
          {showIdentification && <div style={{fontSize:'7.5pt'}}>{[company?.adminRut && company.adminRut !== '14.882.140-K' && 'RUT '+company.adminRut, company?.rnacNumber && 'RNAC MINVU '+company.rnacNumber].filter(Boolean).join(' · ')}</div>}
        </div>
      </div>
    </div>
  );
}