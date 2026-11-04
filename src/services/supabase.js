import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ybztfwzryejmnkfgybvw.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_IJPrHemkbf5AK-JgAINjuw_JUNAv7LR';

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
