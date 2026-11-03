// Configuración Oficial de Dominios y Subdominios de ARANPRO
// Separa el Sitio Web Comercial (aranpro.cl) de la Aplicación de Gestión (administracion.aranpro.cl)

export const DOMAIN_CONFIG = {
  // Sitio Web Comercial (Front informativo y captación)
  COMMERCIAL_WEB_URL: 'https://aranpro.cl',

  // Aplicación Web Progresiva PWA (Gestión de Administrador & Copropietarios)
  APP_URL: 'https://administracion.aranpro.cl',

  // Enlace directo al portal de residentes con slug opcional
  getResidentLoginUrl: (communitySlug = '') => {
    const base = 'https://administracion.aranpro.cl';
    return communitySlug ? `${base}?c=${encodeURIComponent(communitySlug)}` : base;
  },

  // Enlace directo al acceso de administrador con PIN
  getAdminLoginUrl: () => {
    return 'https://administracion.aranpro.cl?role=admin';
  }
};
