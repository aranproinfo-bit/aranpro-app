import { DOMAIN_CONFIG } from '../config/domains.js';

function getStaffSessionCreds() {
  if (typeof sessionStorage === 'undefined') return {};
  try {
    return JSON.parse(sessionStorage.getItem('aranpro_staff_session_creds') || '{}') || {};
  } catch {
    return {};
  }
}

export function newDocumentIdentity() {
  const random = () => crypto.randomUUID().replaceAll('-', '');
  return { folio: 'CERT-' + new Date().getFullYear() + '-' + random(), verificationCode: random() };
}

export function verificationUrl(cert) {
  if (!cert?.registered || !cert.folio || !cert.verificationCode) return '';
  const url = new URL(DOMAIN_CONFIG.APP_URL);
  url.searchParams.set('verify', cert.folio);
  url.searchParams.set('hash', cert.verificationCode);
  return url.href;
}

export function certificateDetails(c) {
  const details = {
    type: c.type,
    community: c.communityName,
    unit: String(c.unitNumber ?? ''),
    name: c.applicantName,
    rut: c.rut || '',
    issuer: c.issuedBy
  };
  if (/Deuda/.test(c.type)) details.debt = Number(c.debtAmount ?? 0);
  if (/Alícuota/.test(c.type)) details.aliquot = c.aliquotPercent;
  return details;
}

export function clause(details, folio, date) {
  if (!details || !/No Deuda|Estado de Deuda/.test(details.type)) return '';
  return (
    'Según el certificado ' +
    folio +
    ', emitido el ' +
    date +
    ' por la administración de ' +
    details.community +
    ', la unidad ' +
    details.unit +
    ' registra a esa fecha un saldo pendiente de ' +
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(details.debt) +
    ' por los conceptos comprendidos en el certificado.'
  );
}

export function documentRegistry(client) {
  async function call(name, args) {
    const { data, error } = await client.rpc(name, args);
    if (error) {
      const failure = new Error(
        error.code === '42501'
          ? 'Inicie sesión con su cuenta de Administrador para firmar certificados.'
          : error.message
      );
      failure.code = error.code;
      throw failure;
    }
    return data;
  }

  return {
    async issue(cert) {
      const creds = getStaffSessionCreds();
      const result = await call('aranpro_issue', {
        p_folio: cert.folio,
        p_token: cert.verificationCode,
        p_details: certificateDetails(cert),
        p_admin_rut: creds.rut || null,
        p_admin_password: creds.password || null
      });
      if (!result?.date || !result.expiresAt) throw new Error('Supabase no confirmó la emisión.');
      return { ...result, registered: true, status: 'EMITIDO' };
    },
    async verify(folio, token) {
      if (!folio || !/^[a-f0-9]{32}$/.test(token || '')) return { state: 'invalid' };
      try {
        return (await call('aranpro_verify', { p_folio: folio, p_token: token })) || { state: 'invalid' };
      } catch {
        return { state: 'unavailable' };
      }
    },
    revoke(cert) {
      const creds = getStaffSessionCreds();
      return call('aranpro_revoke', {
        p_folio: cert.folio,
        p_token: cert.verificationCode,
        p_admin_rut: creds.rut || null,
        p_admin_password: creds.password || null
      });
    },
    saveBackup(revision, snapshot) {
      return call('aranpro_save_backup', { p_revision: revision, p_snapshot: snapshot });
    },
    loadBackup() {
      return call('aranpro_load_backup');
    },
    authorized() {
      return call('aranpro_is_issuer');
    }
  };
}
