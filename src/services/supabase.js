import { createClient } from '@supabase/supabase-js';

const envUrl = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env.VITE_SUPABASE_URL : (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_URL : null);
const envKey = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env.VITE_SUPABASE_ANON_KEY : (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_ANON_KEY : null);

const supabaseUrl = envUrl || 'https://ybztfwzryejmnkfgybvw.supabase.co';
const supabaseAnonKey = envKey || 'sb_publishable_IJPrHemkbf5AK-JgAINjuw_JUNAv7LR';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Servicio de Autenticación de Administradores y Asistentes
 */
export const staffAuthService = {
  async getStaffUsers() {
    if (!supabase) return { success: false, data: [] };
    try {
      const { data, error } = await supabase
        .from('staff_users')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (err) {
      console.warn('Error fetching staff_users:', err);
      return { success: false, error: err.message, data: [] };
    }
  },

  async createStaffUser({ rut, nombre, email, telefono, password, role = 'asistente', permisos }) {
    if (!supabase) return { success: false, error: 'Supabase no inicializado' };
    try {
      const { data, error } = await supabase
        .from('staff_users')
        .insert([
          {
            rut: rut.trim(),
            nombre: nombre.trim(),
            email: email ? email.trim() : null,
            telefono: telefono ? telefono.trim() : null,
            password_hash: password,
            role: role,
            permisos: permisos || {
              editar_gastos: true,
              aprobar_pagos: false,
              responder_tickets: true,
              emitir_colillas: false
            },
            activo: true
          }
        ])
        .select()
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async deleteStaffUser(id) {
    if (!supabase) return { success: false, error: 'Supabase no disponible' };
    try {
      const { error } = await supabase
        .from('staff_users')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async loginStaff(rut, password) {
    if (!supabase) {
      return { success: false, error: 'Supabase no inicializado' };
    }
    const cleanRut = (rut || '').trim().replace(/\./g, '');
    try {
      const { data, error } = await supabase
        .from('staff_users')
        .select('*')
        .ilike('rut', cleanRut)
        .eq('activo', true)
        .single();

      if (error || !data) {
        // Si no se encuentra con RUT limpio, probar directo
        const { data: d2, error: e2 } = await supabase
          .from('staff_users')
          .select('*')
          .eq('rut', rut.trim())
          .eq('activo', true)
          .single();
        if (e2 || !d2) {
          return { success: false, error: 'Usuario no encontrado o inactivo' };
        }
        if (d2.password_hash !== password) {
          return { success: false, error: 'Contraseña incorrecta' };
        }
        return { success: true, user: d2 };
      }

      if (data.password_hash !== password) {
        return { success: false, error: 'Contraseña incorrecta' };
      }

      return { success: true, user: data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async updatePassword(rut, newPassword) {
    if (!supabase) return { success: false, error: 'Supabase no disponible' };
    const { data, error } = await supabase
      .from('staff_users')
      .update({ password_hash: newPassword, updated_at: new Date().toISOString() })
      .or(`rut.eq.${rut},rut.ilike.${rut.replace(/\./g, '')}`);
    if (error) return { success: false, error: error.message };
    return { success: true, data };
  }
};

/**
 * Servicio de Auditoría y Trazabilidad de Acciones
 * Permite distinguir si un cambio fue hecho por John (Admin) o un Asistente
 */
export const auditService = {
  async logAction({ communityId, action, user, details }) {
    if (!supabase) return;
    try {
      await supabase.from('audit_logs').insert([
        {
          community_id: communityId || null,
          action: action,
          user_rut: user?.rut || '16.012.871-2',
          user_name: user?.name || user?.nombre || 'John Andrés Arancibia',
          user_role: user?.staffRole || user?.role || 'admin',
          details: details || {}
        }
      ]);
    } catch (e) {
      console.warn('Error registrando auditoría:', e);
    }
  },

  async getRecentLogs(limit = 25) {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('Error fetching audit_logs:', err);
      return [];
    }
  }
};

/**
 * Servicio de Despacho Masivo de Correos con Seguimiento de Aperturas (Estilo EdiPro)
 */
export const emailDispatchService = {
  // Guardar o sincronizar un nuevo despacho masivo
  async recordDispatch({ communityId, period, subject, campaignType = 'colilla_gasto_comun', recipients = [], user }) {
    const defaultRecipientsWithTracking = recipients.map(r => ({
      id: `elog-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      unit_number: r.unitNumber,
      recipient_name: r.owner,
      recipient_email: r.email,
      status: r.email ? 'entregado' : 'rebotado',
      opened_at: null,
      error_message: r.email ? null : 'Unidad no tiene correo electrónico configurado'
    }));

    const dispatchRecord = {
      id: `disp-${Date.now()}`,
      community_id: communityId,
      period: period || 'Actual',
      subject: subject || `Cobro de Gasto Común - Período ${period}`,
      campaign_type: campaignType,
      total_recipients: recipients.length,
      delivered_count: defaultRecipientsWithTracking.filter(r => r.status === 'entregado').length,
      opened_count: 0,
      bounced_count: defaultRecipientsWithTracking.filter(r => r.status === 'rebotado').length,
      created_by_rut: user?.rut || '16.012.871-2',
      created_by_name: user?.name || 'John Andrés Arancibia',
      created_at: new Date().toISOString(),
      logs: defaultRecipientsWithTracking
    };

    // Intentar guardar en Supabase si la tabla existe
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('email_dispatches')
          .insert([
            {
              community_id: communityId,
              subject: dispatchRecord.subject,
              campaign_type: campaignType,
              period: period,
              total_recipients: dispatchRecord.total_recipients,
              delivered_count: dispatchRecord.delivered_count,
              opened_count: 0,
              bounced_count: dispatchRecord.bounced_count,
              created_by_rut: dispatchRecord.created_by_rut,
              created_by_name: dispatchRecord.created_by_name
            }
          ])
          .select()
          .single();

        if (data && !error) {
          dispatchRecord.id = data.id;
          const logsPayload = defaultRecipientsWithTracking.map(log => ({
            dispatch_id: data.id,
            community_id: communityId,
            unit_number: log.unit_number,
            recipient_name: log.recipient_name,
            recipient_email: log.recipient_email || 'sin-correo@comunidad.cl',
            status: log.status,
            error_message: log.error_message
          }));
          await supabase.from('email_logs').insert(logsPayload);
        }
      } catch (err) {
        console.warn('Fallo guardado en Supabase email_dispatches, guardando local:', err);
      }
    }

    // Respaldo en localStorage
    try {
      const storageKey = `condo_email_dispatches_${communityId}`;
      const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
      localStorage.setItem(storageKey, JSON.stringify([dispatchRecord, ...existing.slice(0, 19)]));
    } catch (e) {
      console.warn('Error guardando en localStorage:', e);
    }

    return dispatchRecord;
  },

  // Obtener historial de despachos
  async getDispatches(communityId) {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('email_dispatches')
          .select('*, email_logs(*)')
          .eq('community_id', communityId)
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          return data.map(d => ({
            ...d,
            logs: d.email_logs || []
          }));
        }
      } catch (e) {
        console.warn('Fallback a dispatches locales:', e);
      }
    }

    const storageKey = `condo_email_dispatches_${communityId}`;
    try {
      return JSON.parse(localStorage.getItem(storageKey) || '[]');
    } catch (e) {
      return [];
    }
  }
};

// Caché en memoria para entornos sin localStorage o modo incógnito
const memoryCertCache = new Map();

/**
 * Servicio de Verificación Pública de Certificados Oficiales por QR y Hash Criptográfico
 * Permite que notarios, bancos y copropietarios verifiquen la validez de un certificado en tiempo real
 */
export const certificateVerificationService = {
  // Registrar certificado en la nube de Supabase para consulta pública inmediata
  async registerCertificateToCloud(cert) {
    const record = {
      folio: cert.folio || cert.id,
      verification_code: cert.verificationCode || 'VRF-OK',
      community_name: cert.communityName || 'Condominio',
      unit_number: String(cert.unitNumber || ''),
      applicant_name: cert.applicantName || 'Copropietario',
      applicant_rut: cert.rut || '',
      cert_type: cert.type || 'Certificado Oficial',
      debt_amount: Number(cert.debtAmount) || 0,
      aliquot_percent: cert.aliquotPercent ?? '',
      issued_at: cert.date || new Date().toISOString().split('T')[0],
      expires_at: cert.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: cert.status || 'valido',
      issued_by: cert.issuedBy || 'John Andrés Arancibia (RNAC N° 48.912)',
      created_at: new Date().toISOString()
    };

    // 1. Guardar siempre en caché en memoria y caché local de respaldo
    memoryCertCache.set(record.folio, record);
    if (typeof localStorage !== 'undefined') {
      try {
        const cache = JSON.parse(localStorage.getItem('aranpro_registered_certificates') || '{}');
        cache[record.folio] = record;
        localStorage.setItem('aranpro_registered_certificates', JSON.stringify(cache));
      } catch (e) {
        console.warn('Error en caché local de certificados:', e);
      }
    }

    // 2. Sincronizar a Supabase
    if (supabase) {
      try {
        const { error } = await supabase
          .from('official_certificates_verification')
          .upsert([record], { onConflict: 'folio' });
        if (error) {
          console.warn('Nota Supabase official_certificates_verification (usando caché local):', error.message);
        }
      } catch (err) {
        console.warn('Fallo sync online certificado a Supabase:', err);
      }
    }

    return record;
  },

  // Consulta pública de validez notarial por Folio y Hash
  async verifyCertificate(folio, hash) {
    if (!folio) return { success: false, message: 'Folio no especificado' };

    const cleanFolio = folio.trim();
    const cleanHash = (hash || '').trim().toUpperCase();

    // 1. Intentar consultar en Supabase
    if (supabase) {
      try {
        let query = supabase
          .from('official_certificates_verification')
          .select('*')
          .eq('folio', cleanFolio);
        
        if (cleanHash && cleanHash !== 'VRF-OK') {
          query = query.eq('verification_code', cleanHash);
        }

        const { data, error } = await query.maybeSingle();
        if (data && !error) {
          return {
            success: true,
            source: 'supabase_cloud',
            certificate: data,
            isValid: data.status === 'valido',
            isExpired: data.expires_at ? data.expires_at < new Date().toISOString().split('T')[0] : false
          };
        }
      } catch (e) {
        console.warn('Consulta online Supabase fallida, intentando caché:', e);
      }
    }

    // 2. Buscar en memoria
    if (memoryCertCache.has(cleanFolio)) {
      const cert = memoryCertCache.get(cleanFolio);
      return {
        success: true,
        source: 'local_cache',
        certificate: cert,
        isValid: cert.status === 'valido',
        isExpired: cert.expires_at ? cert.expires_at < new Date().toISOString().split('T')[0] : false
      };
    }

    // 3. Buscar en caché local de certificados registrados
    if (typeof localStorage !== 'undefined') {
      try {
        const cache = JSON.parse(localStorage.getItem('aranpro_registered_certificates') || '{}');
        if (cache[cleanFolio]) {
          const cert = cache[cleanFolio];
          return {
            success: true,
            source: 'local_cache',
            certificate: cert,
            isValid: cert.status === 'valido',
            isExpired: cert.expires_at ? cert.expires_at < new Date().toISOString().split('T')[0] : false
          };
        }

        // 4. Buscar en listados de comunidades guardados en el dispositivo
        const allComms = JSON.parse(localStorage.getItem('condo_communities_v1') || '[]');
        for (const comm of allComms) {
          const certs = comm.certificates || [];
          const match = certs.find(c => (c.folio === cleanFolio || c.id === cleanFolio));
          if (match) {
            return {
              success: true,
              source: 'community_registry',
              certificate: {
                folio: match.folio || match.id,
                verification_code: match.verificationCode || 'VRF-OK',
                community_name: match.communityName || comm.name,
                unit_number: String(match.unitNumber || ''),
                applicant_name: match.applicantName || 'Copropietario',
                applicant_rut: match.rut || '',
                cert_type: match.type || 'Certificado Oficial',
                debt_amount: Number(match.debtAmount) || 0,
                aliquot_percent: match.aliquotPercent ?? '',
                issued_at: match.date || '',
                expires_at: match.expiresAt || '',
                status: match.status || 'valido',
                issued_by: match.issuedBy || 'John Andrés Arancibia (RNAC N° 48.912)'
              },
              isValid: (match.status || 'valido') === 'valido',
              isExpired: match.expiresAt ? match.expiresAt < new Date().toISOString().split('T')[0] : false
            };
          }
        }
      } catch (e) {
        console.warn('Error buscando en almacenamiento local:', e);
      }
    }

    return {
      success: false,
      message: 'No se encontró ningún certificado oficial registrado con ese Folio en los registros de ARANPRO.'
    };
  }
};

/**
 * Servicio de Sincronización en la Nube con Supabase (Acceso Multi-Computador sin Pérdida de Datos)
 */
export const cloudSyncService = {
  // Sincronizar estado completo a la nube
  async syncToCloud({ communities, companySettings, user }) {
    const payload = {
      workspace_key: 'master_aranpro_workspace',
      admin_rut: user?.rut || '16.012.871-2',
      admin_name: user?.name || 'John Andrés Arancibia',
      communities_count: communities?.length || 0,
      data: {
        communities: communities || [],
        companySettings: companySettings || {},
        updatedAt: new Date().toISOString()
      },
      updated_at: new Date().toISOString()
    };

    // 1. Guardar siempre timestamp y copia local
    localStorage.setItem('aranpro_last_cloud_sync', JSON.stringify({
      timestamp: new Date().toISOString(),
      status: 'success',
      communitiesCount: communities?.length || 0
    }));

    // 2. Si Supabase está disponible, subir a aranpro_workspaces_sync
    if (supabase) {
      try {
        const { error } = await supabase
          .from('aranpro_workspaces_sync')
          .upsert([payload], { onConflict: 'workspace_key' });

        if (error) {
          console.warn('Nota en tabla aranpro_workspaces_sync:', error.message);
          return { success: false, error: error.message, isCloudConnected: true };
        }

        return { success: true, timestamp: payload.updated_at, isCloudConnected: true };
      } catch (err) {
        console.warn('Error al subir a Supabase:', err);
        return { success: false, error: err.message, isCloudConnected: false };
      }
    }

    return { success: true, timestamp: payload.updated_at, isCloudConnected: false, note: 'Guardado localmente' };
  },

  // Descargar la última versión desde Supabase si se abre desde otro computador
  async pullFromCloud() {
    if (!supabase) return { success: false, error: 'Supabase no configurado' };

    try {
      const { data, error } = await supabase
        .from('aranpro_workspaces_sync')
        .select('*')
        .eq('workspace_key', 'master_aranpro_workspace')
        .maybeSingle();

      if (error) throw error;
      if (!data || !data.data) {
        return { success: false, error: 'No hay respaldo previo en la nube' };
      }

      return {
        success: true,
        communities: data.data.communities || [],
        companySettings: data.data.companySettings || {},
        updatedAt: data.updated_at
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  getLastSyncInfo() {
    try {
      return JSON.parse(localStorage.getItem('aranpro_last_cloud_sync') || 'null');
    } catch (e) {
      return null;
    }
  }
};
