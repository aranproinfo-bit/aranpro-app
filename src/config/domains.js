// Configuración Oficial y Estratégica de Dominios y Subdominios de ARANPRO
// Separa Sitio Comercial (aranpro.cl), Panel de Administración (admin.aranpro.cl)
// y Portal de Copropietarios/Vecinos (residentes.aranpro.cl), manteniendo
// compatibilidad universal con portaladministracion.aranpro.cl para QR históricos.

const UNIVERSAL_APP_URL = 'https://portaladministracion.aranpro.cl';
const ADMIN_DEDICATED_URL = 'https://admin.aranpro.cl';
const RESIDENT_DEDICATED_URL = 'https://residentes.aranpro.cl';

export function getSubdomainMode(hostnameInput) {
  const host = (
    hostnameInput ||
    (typeof window !== 'undefined' ? window.location.hostname : '') ||
    ''
  ).toLowerCase();

  if (
    host.startsWith('admin.') ||
    host.startsWith('oficina.') ||
    host.startsWith('gestion.')
  ) {
    return 'admin';
  }

  if (
    host.startsWith('residentes.') ||
    host.startsWith('vecinos.') ||
    host.startsWith('comunidad.') ||
    host.startsWith('copropietarios.') ||
    host.startsWith('micasa.')
  ) {
    return 'resident';
  }

  return 'universal';
}

function areDedicatedSubdomainsEnabled() {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_DEDICATED_SUBDOMAINS === 'false') {
    return false;
  }
  if (typeof window !== 'undefined') {
    try {
      if (localStorage.getItem('aranpro_dedicated_subdomains') === 'false') {
        return false;
      }
    } catch {
      // ignore storage restrictions
    }
  }
  return true;
}

export const DOMAIN_CONFIG = {
  // Sitio Web Comercial (Front informativo y captación)
  COMMERCIAL_WEB_URL: 'https://aranpro.cl',

  // URL universal de verificación pública y compatibilidad de QR impresos
  APP_URL: UNIVERSAL_APP_URL,

  // Subdominios dedicados estratégicos
  ADMIN_URL: ADMIN_DEDICATED_URL,
  RESIDENT_URL: RESIDENT_DEDICATED_URL,

  // Detectar contexto del subdominio actual ('admin' | 'resident' | 'universal')
  getSubdomainMode,

  // Enlace directo al portal de residentes con slug opcional
  getResidentLoginUrl: (communitySlug = '') => {
    const base = areDedicatedSubdomainsEnabled() ? RESIDENT_DEDICATED_URL : UNIVERSAL_APP_URL;
    return communitySlug ? `${base}?c=${encodeURIComponent(communitySlug)}` : base;
  },

  // Enlace directo al acceso de administrador
  getAdminLoginUrl: () => {
    return areDedicatedSubdomainsEnabled()
      ? ADMIN_DEDICATED_URL
      : `${UNIVERSAL_APP_URL}?role=admin`;
  }
};
