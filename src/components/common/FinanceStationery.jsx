import './financeClosing.css';
import React from 'react';
import {formatCLP} from '../../utils/formatters';

export function FinanceHeader({community,title,reference}) {
  return <header className="finance-mast" style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'4mm',borderBottom:'2px solid #164535',paddingBottom:'3mm',color:'#103f32'}}>
    <div style={{display:'flex',alignItems:'center',gap:'3mm'}}>
    <div style={{width:'18mm',height:'16mm',flexShrink:0,display:'grid',placeItems:'center',boxSizing:'border-box',border:community.documentLogo?'none':'1px solid #bacbc2',borderRadius:'2mm'}}>
      {community.documentLogo
        ? <img src={community.documentLogo} alt="Logo de la comunidad" style={{width:'100%',height:'100%',minHeight:0,objectFit:'contain'}}/>
        : <span style={{fontSize:'7pt',lineHeight:1.25,textAlign:'center',color:'#516d60'}}>Logo de la<br/>comunidad</span>}
    </div>
    <div><small>COMUNIDAD · {community.name}</small><h2 style={{fontSize:'16pt',fontWeight:700,lineHeight:1.2}}>{title}</h2><small>{reference}</small></div></div>
    <img src="/brand/ARANPRO_logo_horizontal_transparente_trimmed.png" alt="ARANPRO" style={{width:'32mm',height:'12mm',objectFit:'contain'}}/></header>;
}
export function FinanceFooter({community,label}) {
  return <footer style={{borderTop:'1px solid #88a499',marginTop:'4mm',paddingTop:'2mm',display:'flex',justifyContent:'space-between',fontSize:'8pt',color:'#466256',breakInside:'avoid'}}><span>{community.name}</span><span>{label} · ARANPRO Gestión Integral</span></footer>;
}
export function FinanceSigningBlock({company, contact = company, roles, label}) {
  const name = company?.adminName || company?.administratorName;
  return <section className="finance-signing">
    <div className="finance-signers">
      {roles.map(role => <div className="finance-signer" key={role}>
        <div className="finance-sign-image"/>
        <b>{role}</b><small>Nombre y firma</small>
        {roles.length > 1 && <small>RUT y unidad __________________</small>}
      </div>)}
      <div className="finance-signer finance-admin">
        <div className="finance-sign-image"><img className="finance-seal" src="/brand/ARANPRO_sello_circular_integral_transparente.png" alt="Timbre ARANPRO"/>
          <div><strong>SELLO OFICIAL DE ADMINISTRACIÓN</strong><small>Ley N° 21.442 de Copropiedad Inmobiliaria</small></div>
          {company?.signatureDataUrl && <img className="finance-autograph" src={company.signatureDataUrl} alt="Firma del administrador"/>}
        </div>
        <b>{name || 'Firma de la administración'}</b>
        <small>{[company?.adminRut && 'RUT '+company.adminRut, company?.rnacNumber && 'RNAC MINVU '+company.rnacNumber].filter(Boolean).join(' · ')}</small>
        <small>Administración delegada de la comunidad</small>
      </div>
    </div>
    <div className="finance-tail"><span>ARANPRO Gestión Integral · aranpro.cl</span><b>{label}</b><span>{contact?.phone}</span></div>
  </section>;
}
function closingAmount(value) {
  return value == null ? 'Sin registro' : formatCLP(value);
}

export function ClosingRecord({community, history, totals, getFinancials, company, period, audit}) {
  const source = history || totals;
  const approval = history ? history.committeeSignoff : community.closingSignoffs?.[period];
  const units = history ? history.allocationRows : community.units.map(unit => ({...unit, ...getFinancials(unit)}));
  const balances = units?.filter(unit => unit.pendingDebt > 0 || unit.favorBalance > 0);
  const checks = history ? history.expenseChecks : audit;
  const base = source.grandTotal == null || source.reserveFundAmount == null ? null : source.grandTotal - source.reserveFundAmount;
  const pending = units?.reduce((sum, unit) => sum + (unit.pendingDebt || 0), 0);
  const credit = units?.reduce((sum, unit) => sum + (unit.favorBalance || 0), 0);
  const pages = [balances?.slice(0, 6)];
  for (let i = 6; i < (balances?.length || 0); i += 18) pages.push(balances.slice(i, i + 18));
  return pages.map((rows, index) => <article key={index} className="finance-closing-sheet closing-record">
    <FinanceHeader community={community} title="Acta de cierre contable" reference={'Período '+period+' · Hoja '+(index+1)+' de '+pages.length}/>
    {index === 0 && <>
      <section className="closing-intro"><b>{history ? 'Cierre archivado · '+history.closedAt : 'Revisión previa al cierre mensual'}</b>
        <p>{history ? 'Esta acta reúne las cifras guardadas al archivar el período y permite verificar los saldos de apertura del mes siguiente.' : 'La administración presenta al comité los gastos del mes, la recaudación registrada y los saldos que se trasladarían al período siguiente si se cerrara con estas cifras.'}</p>
      </section>
      <h3>Determinación del cobro común</h3>
      <table><tbody>{[['Gastos ordinarios registrados',source.totalExpenses],['Base que corresponde cobrar en el período',base],['Aporte al fondo de reserva',source.reserveFundAmount],['Total a distribuir entre las unidades',source.grandTotal]].map(([label,value])=><tr key={label}><td>{label}</td><td className="amount">{closingAmount(value)}</td></tr>)}</tbody></table>
      {base != null && source.totalExpenses != null && base !== source.totalExpenses && <p>La distribución considera la porción de los gastos que corresponde cobrar este mes según la programación de cuotas.</p>}
      <h3>Recaudación y saldos</h3>
      <div className="closing-figures">{[['Pagos registrados',source.totalCollected],['Pendiente de cobro',pending],['A favor de las unidades',credit]].map(([label,value])=><div key={label}><small>{label}</small><b>{closingAmount(value)}</b></div>)}</div>
      <p>El pendiente reúne los saldos individuales después de aplicar los pagos y créditos. Puede incluir deuda anterior, cuotas de convenios y cargos adicionales.</p>
    </>}
    <h3>{index ? 'Continuación · ' : ''}Unidades con saldo para el próximo período</h3>
    {rows?.length ? <table><thead><tr><th>Unidad</th><th>Titular</th><th>Cuota del mes</th><th>Pendiente</th><th>A favor</th></tr></thead>
      <tbody>{rows.map((unit,i)=><tr key={i}><td>{[unit.number,unit.tower].filter(Boolean).join(' · ')}</td><td>{unit.owner}</td>{['currentCharge','pendingDebt','favorBalance'].map(key=><td key={key} className="amount">{closingAmount(unit[key])}</td>)}</tr>)}</tbody></table>
      : <p>{units ? 'Todas las unidades registran saldo cero.' : 'El archivo de este período conserva los totales generales. El detalle por unidad no está disponible.'}</p>}
    {index === pages.length-1 && <>
      <h3>Revisión del comité y seguimiento</h3>
      {checks && <p>De {checks.totalExpensesCount} gastos registrados, {checks.backedCount} tienen respaldo adjunto y {checks.approvedCount} tienen visación individual del comité.</p>}
      <p><b>Visación del cierre · </b>{approval?.status==='aprobado' ? ['Aprobada',approval.member,approval.role,approval.date].filter(Boolean).join(' · ') : 'Sin aprobación registrada.'}</p>
      <p>{history ? 'Para iniciar el nuevo período, cotejar los saldos de apertura con esta nómina y los pagos posteriores con la cartola bancaria.' : checks?.hasCriticalBlock ? 'El cierre está bloqueado. '+checks.criticalIssues.join(' ') : 'Antes de archivar, cotejar los pagos con la cartola bancaria y revisar los saldos que pasarán al próximo mes.'}</p>
      <FinanceSigningBlock company={history ? history.administratorSignoff : company} contact={company} roles={['Comité de Administración']} label="Acta de cierre contable"/>
    </>}
  </article>);
}