import { supabase } from './supabase.js';

const STAFF_CREDS_KEY = 'aranpro_staff_session_creds';
const RESIDENT_CREDS_KEY = 'aranpro_resident_session_creds';
const LIVE_REVISION_KEY = 'aranpro_live_revision';

function safeGetSession(key) {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function safeSetSession(key, val) {
  if (typeof sessionStorage === 'undefined') return;
  try {
    if (val == null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, JSON.stringify(val));
  } catch {
    // ignore storage quota errors
  }
}

export function getStoredLiveRevision() {
  if (typeof localStorage === 'undefined') return 0;
  return Number(localStorage.getItem(LIVE_REVISION_KEY) || 0);
}

export function setStoredLiveRevision(rev) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(LIVE_REVISION_KEY, String(Number(rev) || 0));
  } catch {
    // ignore
  }
}

/**
 * Fusiona envíos realizados en línea por residentes (pagos informados, reclamos,
 * certificados solicitados, votos y cambios de clave) dentro del estado local del
 * administrador cuando ocurre concurrencia simultánea, evitando perder datos.
 */
export function mergeServerResidentUpdates(localSnapshot, serverSnapshot) {
  if (!serverSnapshot || !Array.isArray(serverSnapshot.communities)) {
    return localSnapshot;
  }

  const serverCommsById = new Map(serverSnapshot.communities.map(c => [c.id, c]));

  const mergedCommunities = (localSnapshot.communities || []).map(localComm => {
    const srvComm = serverCommsById.get(localComm.id);
    if (!srvComm) return localComm;

    // 1. Fusionar paymentReports nuevos enviados por vecinos
    const localPayIds = new Set((localComm.paymentReports || []).map(p => p.id));
    const newServerPayments = (srvComm.paymentReports || []).filter(p => p?.id && !localPayIds.has(p.id));

    // 2. Fusionar communityTickets nuevos enviados por vecinos
    const localTicketIds = new Set((localComm.communityTickets || []).map(t => t.id));
    const newServerTickets = (srvComm.communityTickets || []).filter(t => t?.id && !localTicketIds.has(t.id));

    // 3. Fusionar announcements nuevos publicados por el comité
    const localAnnIds = new Set((localComm.announcements || []).map(a => a.id));
    const newServerAnns = (srvComm.announcements || []).filter(a => a?.id && !localAnnIds.has(a.id));

    // 4. Fusionar votos de consultas escritas
    const srvConsById = new Map((srvComm.writtenConsultations || []).map(cons => [cons.id, cons]));
    const mergedConsultations = (localComm.writtenConsultations || []).map(cons => {
      const srvCons = srvConsById.get(cons.id);
      if (!srvCons) return cons;
      return {
        ...cons,
        votes: { ...(srvCons.votes || {}), ...(cons.votes || {}) }
      };
    });

    // 5. Preservar contraseñas actualizadas por los propios residentes
    const srvUnitsById = new Map((srvComm.units || []).map(u => [u.id, u]));
    const mergedUnits = (localComm.units || []).map(u => {
      const srvU = srvUnitsById.get(u.id);
      if (srvU?.password && !u.password) {
        return { ...u, password: srvU.password };
      }
      return u;
    });

    return {
      ...localComm,
      units: mergedUnits,
      paymentReports: [...newServerPayments, ...(localComm.paymentReports || [])],
      communityTickets: [...newServerTickets, ...(localComm.communityTickets || [])],
      announcements: [...newServerAnns, ...(localComm.announcements || [])],
      writtenConsultations: mergedConsultations
    };
  });

  // 6. Fusionar solicitudes de certificados nuevas
  const localCertIds = new Set((localSnapshot.certificates || []).map(c => c.id));
  const newServerCerts = (serverSnapshot.certificates || []).filter(c => c?.id && !localCertIds.has(c.id));

  return {
    communities: mergedCommunities,
    companySettings: localSnapshot.companySettings || serverSnapshot.companySettings || {},
    certificates: [...newServerCerts, ...(localSnapshot.certificates || [])]
  };
}

export const onlineSyncService = {
  getStaffCredentials() {
    return safeGetSession(STAFF_CREDS_KEY);
  },

  setStaffCredentials(rut, password) {
    if (!rut) {
      safeSetSession(STAFF_CREDS_KEY, null);
      return;
    }
    safeSetSession(STAFF_CREDS_KEY, { rut, password: password || '' });
  },

  getResidentCredentials() {
    return safeGetSession(RESIDENT_CREDS_KEY);
  },

  setResidentCredentials(creds) {
    safeSetSession(RESIDENT_CREDS_KEY, creds);
  },

  clearAllCredentials() {
    safeSetSession(STAFF_CREDS_KEY, null);
    safeSetSession(RESIDENT_CREDS_KEY, null);
  },

  async staffLogin(rut, password) {
    if (!supabase) return { ok: false, error: 'Supabase no configurado' };
    try {
      const { data, error } = await supabase.rpc('aranpro_staff_login', {
        p_rut: rut,
        p_password: password
      });
      if (error) throw error;
      if (data?.ok) {
        this.setStaffCredentials(rut, password);
        if (data.revision) setStoredLiveRevision(data.revision);
      }
      return data || { ok: false };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  async pullWorkspace(knownRevision = 0) {
    if (!supabase) return { ok: false };
    const creds = this.getStaffCredentials();
    try {
      const { data, error } = await supabase.rpc('aranpro_workspace_pull', {
        p_admin_rut: creds?.rut || null,
        p_admin_password: creds?.password || null,
        p_known_revision: Number(knownRevision) || 0
      });
      if (error) throw error;
      return data || { ok: false };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  async pushWorkspace(revision, snapshot, force = false) {
    if (!supabase) return { ok: false };
    const creds = this.getStaffCredentials();
    try {
      const { data, error } = await supabase.rpc('aranpro_workspace_push', {
        p_revision: Number(revision) || 0,
        p_snapshot: snapshot,
        p_admin_rut: creds?.rut || null,
        p_admin_password: creds?.password || null,
        p_force: Boolean(force)
      });
      if (error) throw error;
      if (data?.ok && data.revision) {
        setStoredLiveRevision(data.revision);
      }
      return data || { ok: false };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  async fetchPublicCommunities() {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase.rpc('aranpro_public_communities');
      if (error) throw error;
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  async residentPortalSync(rutOrUnit, password, communitySlug = null) {
    if (!supabase) return { ok: false, offline: true };
    try {
      const { data, error } = await supabase.rpc('aranpro_resident_portal_sync', {
        p_rut_or_unit: rutOrUnit,
        p_password: password,
        p_community_slug: communitySlug || null
      });
      if (error) throw error;
      return data || { ok: false };
    } catch (err) {
      return { ok: false, offline: true, error: err.message };
    }
  },

  async residentSubmit(action, payload) {
    if (!supabase) return { ok: false, offline: true };
    const creds = this.getResidentCredentials();
    if (!creds?.communityId || !creds?.unitId || !creds?.password) {
      return { ok: false, noSession: true };
    }
    try {
      const { data, error } = await supabase.rpc('aranpro_resident_submit', {
        p_community_id: creds.communityId,
        p_unit_id: creds.unitId,
        p_rut_or_unit: creds.rutOrUnit || creds.unitNumber,
        p_password: creds.password,
        p_action: action,
        p_payload: payload
      });
      if (error) throw error;
      if (data?.revision) setStoredLiveRevision(data.revision);
      return data || { ok: false };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  async pushAdminNotification({ communityId, category, title, message, unitId = null, unitNumber = null, meta = {} }) {
    if (!supabase) return { ok: false };
    const creds = this.getStaffCredentials();
    try {
      const { data, error } = await supabase.rpc('aranpro_admin_notify', {
        p_admin_rut: creds?.rut || null,
        p_admin_password: creds?.password || null,
        p_community_id: communityId || null,
        p_category: category || 'general',
        p_title: title,
        p_message: message,
        p_unit_id: unitId || null,
        p_unit_number: unitNumber ? String(unitNumber) : null,
        p_meta: meta || {}
      });
      if (error) throw error;
      return data || { ok: false };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  },

  async fetchAdminNotifications(markRead = false) {
    if (!supabase) return [];
    const creds = this.getStaffCredentials();
    try {
      const { data, error } = await supabase.rpc('aranpro_admin_notifications', {
        p_admin_rut: creds?.rut || null,
        p_admin_password: creds?.password || null,
        p_mark_read: Boolean(markRead)
      });
      if (error || !data?.ok) return [];
      return Array.isArray(data.items) ? data.items : [];
    } catch {
      return [];
    }
  },

  async markResidentNotificationsRead() {
    if (!supabase) return;
    const creds = this.getResidentCredentials();
    if (!creds?.communityId || !creds?.unitId) return;
    try {
      await supabase.rpc('aranpro_resident_mark_read', {
        p_community_id: creds.communityId,
        p_unit_id: creds.unitId,
        p_password: creds.password || ''
      });
    } catch {
      // ignore
    }
  }
};
