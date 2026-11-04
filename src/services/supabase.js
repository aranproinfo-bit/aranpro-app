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
          user_rut: user?.rut || 'DESCONOCIDO',
          user_name: user?.nombre || 'Usuario Desconocido',
          user_role: user?.role || 'asistente',
          details: details || {}
        }
      ]);
    } catch (e) {
      console.warn('Error registrando auditoría:', e);
    }
  }
};
