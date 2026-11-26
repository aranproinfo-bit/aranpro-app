import { resendMailService } from './resendService.js';
import { onlineSyncService } from './onlineSyncService.js';
import { DOMAIN_CONFIG } from '../config/domains.js';
import { formatCLP, formatDate } from '../utils/formatters.js';

const DEFAULT_FROM = 'ARANPRO Gestión de Condominios <contacto@aranpro.cl>';
const DEFAULT_ADMIN_EMAIL = 'aranpro.info@gmail.com';

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[ch]));
}

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && !email.includes('demo.');
}

function getAdminRecipientEmails(companySettings, community) {
  const list = new Set([DEFAULT_ADMIN_EMAIL]);
  if (isValidEmail(companySettings?.email) && companySettings.email !== 'contacto@aranpro.cl') {
    list.add(companySettings.email.trim());
  }
  if (isValidEmail(community?.adminNotificationEmail)) {
    list.add(community.adminNotificationEmail.trim());
  }
  return Array.from(list);
}

function getUnitEmails(unit) {
  if (!unit) return [];
  const emails = new Set();
  if (isValidEmail(unit.email)) emails.add(unit.email.trim());
  if (isValidEmail(unit.payerEmail)) emails.add(unit.payerEmail.trim());
  for (const sub of (unit.additionalUsers || [])) {
    if (isValidEmail(sub?.email)) emails.add(sub.email.trim());
  }
  return Array.from(emails);
}

function buildInstitutionalEmailHtml({ badge, title, communityName, intro, details = [], ctaLabel, ctaUrl, footerNote }) {
  const rowsHtml = details
    .filter(([, val]) => val !== null && val !== undefined && String(val).trim() !== '')
    .map(([label, val]) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#475569;font-size:13px;width:38%;">${escapeHtml(label)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#0f172a;font-weight:700;font-size:13px;">${escapeHtml(val)}</td>
      </tr>
    `)
    .join('');

  return `
    <div style="background:#f5f4ef;padding:24px 12px;font-family:'Segoe UI',Arial,sans-serif;color:#0f172a;">
      <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #d4b895;">
        <div style="background:#0f3d2e;padding:22px 24px;border-bottom:4px solid #d4b895;color:#ffffff;">
          <div style="font-size:11px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;color:#d4b895;">
            ${escapeHtml(badge || 'ARANPRO · Notificación Oficial')}
          </div>
          <h1 style="margin:6px 0 0 0;font-size:20px;line-height:1.25;color:#ffffff;">${escapeHtml(title)}</h1>
          ${communityName ? `<div style="margin-top:6px;font-size:13px;color:#e2e8f0;">${escapeHtml(communityName)}</div>` : ''}
        </div>
        <div style="padding:24px;">
          <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#334155;">${escapeHtml(intro)}</p>
          ${rowsHtml ? `<table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:10px;overflow:hidden;margin-bottom:20px;"><tbody>${rowsHtml}</tbody></table>` : ''}
          ${ctaUrl ? `
            <div style="text-align:center;margin:22px 0;">
              <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background:#0f3d2e;color:#ffffff;text-decoration:none;font-weight:700;font-size:13px;padding:12px 24px;border-radius:10px;border:1px solid #d4b895;">
                ${escapeHtml(ctaLabel || 'Abrir Plataforma ARANPRO')}
              </a>
            </div>
          ` : ''}
          ${footerNote ? `<p style="margin:16px 0 0 0;font-size:12px;line-height:1.5;color:#64748b;">${escapeHtml(footerNote)}</p>` : ''}
        </div>
        <div style="background:#f8fafc;padding:14px 24px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;display:flex;justify-content:space-between;">
          <span>ARANPRO Gestión Integral de Condominios · Ley N° 21.442</span>
          <a href="https://aranpro.cl" style="color:#0f3d2e;font-weight:700;text-decoration:none;">aranpro.cl</a>
        </div>
      </div>
    </div>
  `;
}

export const notificationService = {
  // =========================================================================
  // 1. ALERTAS DE RESIDENTES -> HACIA EL ADMINISTRADOR
  // =========================================================================

  async notifyAdminPaymentReported({ community, report, companySettings }) {
    const to = getAdminRecipientEmails(companySettings, community);
    const amountFmt = formatCLP(report.amount);
    const adminUrl = DOMAIN_CONFIG.getAdminLoginUrl();

    const html = buildInstitutionalEmailHtml({
      badge: 'Aviso a Administración · Pago Informado',
      title: `Nuevo pago informado · Unidad ${report.unitNumber}`,
      communityName: community?.name,
      intro: `Un residente ha registrado un comprobante de pago en línea y se encuentra pendiente de conciliación y aprobación.`,
      details: [
        ['Comunidad', community?.name],
        ['Unidad', `Casa / Depto N° ${report.unitNumber}`],
        ['Titular / Residente', report.owner],
        ['Monto Informado', amountFmt],
        ['Fecha de Pago', formatDate(report.date)],
        ['N° Operación / Transferencia', report.transferNumber],
        ['Observaciones', report.notes || 'Sin observaciones']
      ],
      ctaLabel: 'Revisar y Aprobar Pago en Panel Admin',
      ctaUrl: adminUrl,
      footerNote: 'Ingrese al módulo de Gastos Comunes / Conciliación para validar el abono y emitir el recibo foliado.'
    });

    return resendMailService.sendSingleEmail({
      from: DEFAULT_FROM,
      to,
      subject: `[Pago Informado] ${community?.name || 'Comunidad'} · Unidad ${report.unitNumber} (${amountFmt})`,
      html,
      text: `Nuevo pago informado en ${community?.name}: Unidad ${report.unitNumber} (${report.owner}) por ${amountFmt}. Operación: ${report.transferNumber}. Revisar en: ${adminUrl}`
    });
  },

  async notifyAdminCertificateRequested({ community, cert, companySettings }) {
    const to = getAdminRecipientEmails(companySettings, community);
    const adminUrl = DOMAIN_CONFIG.getAdminLoginUrl();

    const html = buildInstitutionalEmailHtml({
      badge: 'Aviso a Administración · Solicitud de Certificado',
      title: `Solicitud de Certificado · Unidad ${cert.unitNumber}`,
      communityName: cert.communityName || community?.name,
      intro: `Se ha recibido una nueva solicitud de certificado oficial desde el portal en línea.`,
      details: [
        ['Comunidad', cert.communityName || community?.name],
        ['Unidad', cert.unitNumber],
        ['Solicitante', cert.applicantName],
        ['RUT', cert.rut],
        ['Tipo Solicitado', cert.type],
        ['Finalidad', cert.purpose],
        ['Correo de Contacto', cert.email],
        ['Teléfono', cert.phone]
      ],
      ctaLabel: 'Validar y Emitir Certificado',
      ctaUrl: adminUrl
    });

    return resendMailService.sendSingleEmail({
      from: DEFAULT_FROM,
      to,
      subject: `[Solicitud Certificado] ${cert.communityName || community?.name} · Unidad ${cert.unitNumber}`,
      html,
      text: `Nueva solicitud de ${cert.type} para Unidad ${cert.unitNumber} (${cert.applicantName}). Revisar en: ${adminUrl}`
    });
  },

  async notifyAdminTicketCreated({ community, ticket, companySettings }) {
    const to = getAdminRecipientEmails(companySettings, community);
    const adminUrl = DOMAIN_CONFIG.getAdminLoginUrl();

    const html = buildInstitutionalEmailHtml({
      badge: `Libro Digital · Nuevo ${ticket.type || 'Registro'}`,
      title: `${ticket.type || 'Reclamo'}: ${ticket.title}`,
      communityName: community?.name,
      intro: `Un integrante de la comunidad ha ingresado un nuevo caso en el Libro Digital de Sugerencias y Reclamos.`,
      details: [
        ['Folio', ticket.folio],
        ['Comunidad', community?.name],
        ['Unidad Informante', ticket.unitNumber],
        ['Vecino', ticket.residentName],
        ['Categoría / Prioridad', `${ticket.category} · Prioridad ${ticket.priority}`],
        ['Detalle', ticket.description]
      ],
      ctaLabel: 'Responder en Libro Digital',
      ctaUrl: adminUrl
    });

    return resendMailService.sendSingleEmail({
      from: DEFAULT_FROM,
      to,
      subject: `[${ticket.type || 'Reclamo'} ${ticket.folio}] ${community?.name} · ${ticket.unitNumber}`,
      html,
      text: `Nuevo ${ticket.type} (${ticket.folio}) en ${community?.name} - ${ticket.unitNumber}: ${ticket.title}. ${ticket.description}`
    });
  },

  // =========================================================================
  // 2. ALERTAS DE ADMINISTRACIÓN -> HACIA LOS RESIDENTES / VECINOS
  // =========================================================================

  async notifyCommunityAnnouncement({ community, announcement }) {
    if (!community) return;
    const portalUrl = DOMAIN_CONFIG.getResidentLoginUrl(community.slug);

    // 1. Notificación en vivo dentro de la plataforma
    void onlineSyncService.pushAdminNotification({
      communityId: community.id,
      category: 'comunicado',
      title: `📢 ${announcement.title}`,
      message: `${announcement.priority || 'Aviso'}: ${String(announcement.content || '').slice(0, 180)}`,
      meta: { announcementId: announcement.id, priority: announcement.priority }
    });

    // 2. Despacho por correo electrónico a todas las unidades con correo registrado
    const batch = [];
    for (const unit of (community.units || [])) {
      const recipients = getUnitEmails(unit);
      if (recipients.length === 0) continue;

      const html = buildInstitutionalEmailHtml({
        badge: `Comunicado Oficial · ${announcement.priority || 'Informativo'}`,
        title: announcement.title,
        communityName: community.name,
        intro: announcement.content,
        details: [
          ['Comunidad', community.name],
          ['Categoría / Sector', `${announcement.category || 'General'} · ${announcement.location || 'Todo el Condominio'}`],
          ['Fecha de Publicación', formatDate(announcement.date)],
          ['Emitido por', announcement.author || 'Administración ARANPRO']
        ],
        ctaLabel: 'Ver Mural de mi Comunidad',
        ctaUrl: portalUrl
      });

      batch.push({
        from: DEFAULT_FROM,
        to: recipients,
        subject: `[${community.name}] ${announcement.title}`,
        html,
        text: `${announcement.title}\n\n${announcement.content}\n\nPortal de Comunidad: ${portalUrl}`
      });
    }

    if (batch.length > 0) {
      return resendMailService.sendBatchEmails(batch);
    }
    return { success: true, count: 0 };
  },

  async notifyMonthlyBillingIssued({ community, getUnitFinancials }) {
    if (!community) return;
    const portalUrl = DOMAIN_CONFIG.getResidentLoginUrl(community.slug);
    const periodStr = `${String(community.activePeriod?.month || '').padStart(2, '0')}/${community.activePeriod?.year || ''}`;
    const dueStr = community.activePeriod?.dueDate ? formatDate(community.activePeriod.dueDate) : 'Según colilla';

    void onlineSyncService.pushAdminNotification({
      communityId: community.id,
      category: 'gasto_comun',
      title: `📊 Gasto Común Emitido (${periodStr})`,
      message: `Ya se encuentra disponible la liquidación y colilla de gastos comunes del período ${periodStr}. Vencimiento: ${dueStr}.`,
      meta: { period: periodStr, dueDate: community.activePeriod?.dueDate }
    });

    const batch = [];
    for (const unit of (community.units || [])) {
      const recipients = getUnitEmails(unit);
      if (recipients.length === 0) continue;

      const fin = getUnitFinancials ? getUnitFinancials(unit) : {
        currentCharge: Number(unit.currentCharge) || 0,
        pendingDebt: (Number(unit.currentCharge) || 0) + (Number(unit.previousDebt) || 0) + (Number(unit.extraCharge) || 0)
      };

      const html = buildInstitutionalEmailHtml({
        badge: `Liquidación Mensual · Ley N° 21.442`,
        title: `Colilla de Gasto Común · Período ${periodStr}`,
        communityName: community.name,
        intro: `Estimado(a) ${unit.owner || 'Copropietario(a)'}, informamos que se ha emitido el cobro oficial de gastos comunes correspondiente a la Unidad N° ${unit.number}.`,
        details: [
          ['Unidad', `Casa / Depto N° ${unit.number}`],
          ['Cobro del Período', formatCLP(fin.currentCharge)],
          ['Saldo Anterior / Cargos Individuales', formatCLP((fin.previousDebt || 0) + (fin.extraCharge || 0) + (fin.repactedInstallment || 0))],
          ['Total a Pagar', formatCLP(fin.pendingDebt)],
          ['Fecha de Vencimiento', dueStr],
          ['Cuenta de Pago', community.bankInfo?.accountNumber ? `${community.bankInfo.bank} · ${community.bankInfo.accountType} N° ${community.bankInfo.accountNumber}` : 'Ver datos en el Portal']
        ],
        ctaLabel: 'Ver Colilla PDF e Informar Pago',
        ctaUrl: portalUrl,
        footerNote: 'Puede revisar el respaldo íntegro de facturas, boletas y rendición del período ingresando a su Portal de Comunidad.'
      });

      batch.push({
        from: DEFAULT_FROM,
        to: recipients,
        subject: `[Gasto Común ${periodStr}] ${community.name} · Unidad ${unit.number} (${formatCLP(fin.pendingDebt)})`,
        html,
        text: `Colilla Gasto Común ${periodStr} - ${community.name} (Unidad ${unit.number}). Total a pagar: ${formatCLP(fin.pendingDebt)}. Vencimiento: ${dueStr}. Ingrese en: ${portalUrl}`
      });
    }

    if (batch.length > 0) {
      return resendMailService.sendBatchEmails(batch);
    }
    return { success: true, count: 0 };
  },

  async notifyUnitFineApplied({ community, unit, fine }) {
    if (!community || !unit) return;
    const portalUrl = DOMAIN_CONFIG.getResidentLoginUrl(community.slug);
    const amountFmt = formatCLP(fine.amountClp);

    void onlineSyncService.pushAdminNotification({
      communityId: community.id,
      unitId: unit.id,
      unitNumber: unit.number,
      category: 'multa',
      title: `⚠️ Notificación de Multa · Unidad ${unit.number}`,
      message: `Se ha registrado una infracción (${fine.reason}) por ${amountFmt} conforme a ${fine.reglamentoArticle || 'Reglamento de Copropiedad'}.`,
      meta: { folio: fine.resolutionFolio, amountClp: fine.amountClp }
    });

    const recipients = getUnitEmails(unit);
    if (recipients.length === 0) return { success: true, skipped: true };

    const html = buildInstitutionalEmailHtml({
      badge: 'Notificación Formal de Sanción · Ley N° 21.442',
      title: `Notificación de Multa · Unidad N° ${unit.number}`,
      communityName: community.name,
      intro: `Por medio de la presente, la Administración notifica formalmente la aplicación de un cargo individual por infracción al Reglamento de Copropiedad.`,
      details: [
        ['Folio Resolución', fine.resolutionFolio || 'SANC-OFICIAL'],
        ['Unidad Notificada', `Casa / Depto N° ${unit.number} (${unit.owner})`],
        ['Causal / Infracción', fine.reason],
        ['Fundamento Reglamentario', fine.reglamentoArticle || 'Reglamento Interno y Ley N° 21.442'],
        ['Monto Aplicado', `${amountFmt} (${fine.ufEquivalent || ''})`],
        ['Imputación', 'Próxima colilla de Gastos Comunes']
      ],
      ctaLabel: 'Revisar Antecedentes en el Portal',
      ctaUrl: portalUrl,
      footerNote: 'En caso de requerir presentar descargos o apelación ante el Comité de Administración, puede ingresarlos a través del Libro Digital en su portal.'
    });

    return resendMailService.sendSingleEmail({
      from: DEFAULT_FROM,
      to: recipients,
      subject: `[Notificación de Multa] ${community.name} · Unidad N° ${unit.number}`,
      html,
      text: `Notificación de Multa en ${community.name} - Unidad ${unit.number}: ${fine.reason} por ${amountFmt}. Fundamento: ${fine.reglamentoArticle}. Portal: ${portalUrl}`
    });
  },

  async notifyUnitPaymentApproved({ community, unit, payment, receiptFolio }) {
    if (!community || !unit) return;
    const portalUrl = DOMAIN_CONFIG.getResidentLoginUrl(community.slug);
    const amountFmt = formatCLP(payment.amount);

    void onlineSyncService.pushAdminNotification({
      communityId: community.id,
      unitId: unit.id,
      unitNumber: unit.number,
      category: 'pago',
      title: `✅ Pago Aprobado · Recibo ${receiptFolio}`,
      message: `Su pago por ${amountFmt} ha sido conciliado y aprobado. Su comprobante oficial Folio ${receiptFolio} ya está disponible para descarga.`,
      meta: { receiptFolio, amount: payment.amount }
    });

    const recipients = getUnitEmails(unit);
    if (recipients.length === 0) return { success: true, skipped: true };

    const html = buildInstitutionalEmailHtml({
      badge: 'Comprobante Oficial de Pago Conciliado',
      title: `¡Pago Aprobado! Folio ${receiptFolio}`,
      communityName: community.name,
      intro: `Estimado(a) ${unit.owner}, confirmamos la recepción y conciliación bancaria de su pago de gastos comunes. Su recibo oficial timbrado ya se encuentra disponible en su portal.`,
      details: [
        ['Folio Recibo Oficial', receiptFolio],
        ['Unidad', `Casa / Depto N° ${unit.number}`],
        ['Monto Abonado', amountFmt],
        ['Fecha de Pago', formatDate(payment.date)],
        ['Operación Bancaria', payment.transferNumber]
      ],
      ctaLabel: 'Descargar Recibo Oficial PDF',
      ctaUrl: portalUrl
    });

    return resendMailService.sendSingleEmail({
      from: DEFAULT_FROM,
      to: recipients,
      subject: `[Recibo Oficial ${receiptFolio}] Pago Aprobado · ${community.name} (Unidad ${unit.number})`,
      html,
      text: `Su pago por ${amountFmt} en ${community.name} (Unidad ${unit.number}) fue aprobado con Folio ${receiptFolio}. Descárguelo en: ${portalUrl}`
    });
  },

  async notifyUnitCertificateIssued({ community, unit, cert, verifyUrl }) {
    if (!cert) return;
    const portalUrl = verifyUrl || DOMAIN_CONFIG.getResidentLoginUrl(community?.slug);

    if (community?.id) {
      void onlineSyncService.pushAdminNotification({
        communityId: community.id,
        unitId: unit?.id || null,
        unitNumber: cert.unitNumber,
        category: 'certificado',
        title: `📜 Certificado Emitido · Folio ${cert.folio}`,
        message: `Su "${cert.type}" ha sido emitido y registrado digitalmente con verificación QR.`,
        meta: { folio: cert.folio, verifyUrl }
      });
    }

    const recipients = new Set();
    if (isValidEmail(cert.email)) recipients.add(cert.email.trim());
    for (const em of getUnitEmails(unit)) recipients.add(em);
    const to = Array.from(recipients);
    if (to.length === 0) return { success: true, skipped: true };

    const html = buildInstitutionalEmailHtml({
      badge: 'Certificación Oficial con Fe Pública QR',
      title: `${cert.type}`,
      communityName: cert.communityName || community?.name,
      intro: `Su certificado oficial ha sido emitido y firmado digitalmente por la Administración. Puede descargarlo desde su portal o verificar su validez pública en línea.`,
      details: [
        ['Folio Oficial', cert.folio],
        ['Unidad', cert.unitNumber],
        ['Titular', cert.applicantName],
        ['Fecha de Emisión', formatDate(cert.date)],
        ['Válido Hasta', cert.expiresAt ? formatDate(cert.expiresAt) : '30 días corridos']
      ],
      ctaLabel: 'Abrir Verificación Pública / Descargar',
      ctaUrl: portalUrl
    });

    return resendMailService.sendSingleEmail({
      from: DEFAULT_FROM,
      to,
      subject: `[Certificado Emitido] ${cert.type} · Folio ${cert.folio}`,
      html,
      text: `Su certificado ${cert.type} (Folio ${cert.folio}) ha sido emitido. Verificación en línea: ${portalUrl}`
    });
  },

  async notifyUnitTicketResponded({ community, unit, ticket, status, adminResponse }) {
    if (!community || !ticket) return;
    const portalUrl = DOMAIN_CONFIG.getResidentLoginUrl(community.slug);

    void onlineSyncService.pushAdminNotification({
      communityId: community.id,
      unitId: unit?.id || null,
      unitNumber: ticket.unitNumber,
      category: 'reclamo',
      title: `💬 Respuesta a ${ticket.folio} (${status})`,
      message: adminResponse ? `Administración respondió a "${ticket.title}": ${adminResponse}` : `El estado de su caso ${ticket.folio} cambió a ${status}.`,
      meta: { folio: ticket.folio, status }
    });

    const recipients = getUnitEmails(unit);
    if (recipients.length === 0) return { success: true, skipped: true };

    const html = buildInstitutionalEmailHtml({
      badge: `Libro Digital · Actualización de Caso ${ticket.folio}`,
      title: `Respuesta de Administración · ${ticket.title}`,
      communityName: community.name,
      intro: `La Administración ha actualizado su requerimiento ingresado en el Libro Digital de la comunidad.`,
      details: [
        ['Folio', ticket.folio],
        ['Estado Actual', status],
        ['Asunto', ticket.title],
        ['Respuesta Oficial', adminResponse || 'Caso revisado y actualizado por administración.']
      ],
      ctaLabel: 'Ver Respuesta en el Portal',
      ctaUrl: portalUrl
    });

    return resendMailService.sendSingleEmail({
      from: DEFAULT_FROM,
      to: recipients,
      subject: `[Respuesta ${ticket.folio}] ${community.name} · ${ticket.title}`,
      html,
      text: `Actualización caso ${ticket.folio} (${status}): ${adminResponse || ''}. Portal: ${portalUrl}`
    });
  },

  async notifyCommunityDocumentOrConsultation({ community, kind, title, detail }) {
    if (!community) return;
    const portalUrl = DOMAIN_CONFIG.getResidentLoginUrl(community.slug);
    const isCons = kind === 'consulta';

    void onlineSyncService.pushAdminNotification({
      communityId: community.id,
      category: isCons ? 'consulta' : 'documento',
      title: isCons ? `🗳️ Nueva Consulta Escrita: ${title}` : `📁 Nuevo Documento Oficial: ${title}`,
      message: detail || 'Disponible para revisión en el Portal de Comunidad.',
      meta: { kind }
    });

    const batch = [];
    for (const unit of (community.units || [])) {
      const recipients = getUnitEmails(unit);
      if (recipients.length === 0) continue;

      const html = buildInstitutionalEmailHtml({
        badge: isCons ? 'Urna Digital · Consulta por Escrito Ley 21.442' : 'Repositorio Documental Oficial',
        title,
        communityName: community.name,
        intro: detail || 'Se ha publicado nueva información oficial en la plataforma de su comunidad.',
        details: [
          ['Comunidad', community.name],
          ['Tipo de Publicación', isCons ? 'Consulta por Escrito / Votación' : 'Documento Oficial de Comunidad']
        ],
        ctaLabel: isCons ? 'Participar y Votar en Línea' : 'Revisar Documento en el Portal',
        ctaUrl: portalUrl
      });

      batch.push({
        from: DEFAULT_FROM,
        to: recipients,
        subject: `[${community.name}] ${isCons ? 'Consulta Escrita' : 'Nuevo Documento'}: ${title}`,
        html,
        text: `${title}\n${detail || ''}\nRevíselo en: ${portalUrl}`
      });
    }

    if (batch.length > 0) {
      return resendMailService.sendBatchEmails(batch);
    }
    return { success: true, count: 0 };
  }
};
