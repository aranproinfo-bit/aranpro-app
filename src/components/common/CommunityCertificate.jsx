import React from 'react';
import { AranproLogo, AranproOfficialSeal } from './MauranLogo';
import { PortalCode } from './IndividualExpenseBill';
import { formatCLP, formatDate } from '../../utils/formatters';
import { verificationUrl } from '../../services/documentRegistry';
import { CertificateBody } from './CertificateBody';

export function CommunityCertificate({id, cert, community, company}) {
  const url = verificationUrl(cert);
  const noDebt = cert.type.includes('No Deuda');
  return <article id={id} data-pdf-style="neutral" className="bg-white mx-auto max-w-3xl text-slate-900"
    style={{borderLeft:'5px solid #103f32',paddingLeft:3,fontFamily:'Arial, sans-serif',overflowWrap:'anywhere'}}>
    <div style={{borderLeft:'2px solid #bc965e',padding:'16px 20px',minHeight:'235mm',display:'flex',flexDirection:'column',gap:16}}>
      <header style={{display:'grid',gridTemplateColumns:'68px 1fr 68px',gap:8,alignItems:'center',background:'#103f32',color:'white',padding:'16px 12px',borderRadius:8,borderBottom:'3px solid #c5a272'}}>
        <AranproLogo theme="dark" className="w-full h-auto"/>
        <div className="text-center"><h1 style={{fontSize:20,fontWeight:800,lineHeight:1.15}}>{noDebt?'Certificado de gastos comunes al día':cert.type}</h1><p style={{color:'#ead7bd',fontSize:12,marginTop:5}}>{cert.communityName}</p></div>
        {community?.documentLogo && <img src={community.documentLogo} alt="Logo de la comunidad" className="max-h-12 object-contain bg-white rounded p-1"/>}
      </header>
      <div style={{display:'grid',gridTemplateColumns:'1.5fr 1fr 1fr',gap:10,background:'#eef4ef',padding:12,fontSize:12}}>
        <div>Folio<br/><b>{cert.folio}</b></div><div>Emisión<br/><b>{formatDate(cert.date)}</b></div><div>Válido hasta<br/><b>{cert.expiresAt?formatDate(cert.expiresAt):'Sin registro digital'}</b></div>
      </div>
      <div style={{background:'#f3f7f4',border:'1px solid #c6d8cc',padding:12,fontSize:14,lineHeight:1.6}}>
        <b>Identificación de la unidad</b><p>{cert.applicantName} {cert.rut && '· RUT '+cert.rut}</p>
        <p>Unidad {cert.unitNumber}{community?.address && ' · '+community.address}{community?.commune && ' · '+community.commune}</p>
      </div>
      {noDebt ? <section className="space-y-3 text-sm leading-relaxed"><h2 className="font-bold text-lg text-[#103f32]">La administración certifica</h2>
        <p>De acuerdo con los registros de {cert.communityName}, la unidad {cert.unitNumber} presenta un saldo pendiente de <strong>{formatCLP(cert.debtAmount)}</strong> al {formatDate(cert.date)}.</p>
        <h3 className="font-bold">Antecedentes revisados</h3><p>La revisión comprende los cargos, pagos y ajustes incorporados al estado de cuenta hasta la fecha de corte y el saldo pendiente de convenios registrados para la unidad.</p>
        <h3 className="font-bold">Alcance del certificado</h3><p>Los cobros o pagos posteriores pueden modificar el saldo. El detalle de movimientos puede solicitarse a la administración.</p>
        {cert.purpose && <p><b>Finalidad.</b> {cert.purpose}</p>}{cert.notes && <p>{cert.notes}</p>}
      </section> : <CertificateBody previewCert={cert} currentCommunity={community} companySettings={company}/>}
      <footer style={{marginTop:'auto',paddingTop:18,fontSize:11}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,alignItems:'end'}}>
          {url ? <div className="flex items-center gap-2 bg-[#f1f6f2] p-2"><PortalCode url={url} label="Verificar este certificado"/><span><b>Verificación digital</b><br/>Escanee para comparar los datos y consultar la vigencia.</span></div> : <p>Sin verificación pública. Solicite una emisión registrada a la administración.</p>}
          <div className="text-center"><div className="flex justify-center items-center gap-2"><AranproOfficialSeal showText size="sm"/>{company?.signatureDataUrl && <img src={company.signatureDataUrl} alt="Firma" className="w-16 max-h-12 object-contain"/>}</div><hr className="mt-2"/><b>{cert.issuedBy}</b><p>Administración de la comunidad</p></div>
        </div>
        <div style={{borderTop:'1px solid #b48e60',marginTop:13,paddingTop:8,display:'flex',justifyContent:'space-between'}}><span>Conoce ARANPRO · Gestión integral de comunidades</span><a href="https://aranpro.cl">Visita aranpro.cl</a></div>
      </footer>
    </div>
  </article>;
}
