// Utilidades para formato chileno (RUT, Moneda CLP, Fechas)

export const formatCLP = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return '$ 0';
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatRut = (rutRaw) => {
  if (!rutRaw) return '';
  // Limpiar caracteres
  let clean = rutRaw.replace(/[^0-9kK]/g, '').toUpperCase();
  if (clean.length < 2) return clean;
  
  const dv = clean.slice(-1);
  let num = clean.slice(0, -1);
  
  // Agregar puntos
  num = num.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${num}-${dv}`;
};

export const cleanRut = (rut) => {
  if (!rut) return '';
  return rut.replace(/[^0-9kK]/g, '').toUpperCase();
};

export const validateRut = (rutRaw) => {
  if (!rutRaw || typeof rutRaw !== 'string') return false;
  const clean = rutRaw.replace(/[^0-9kK]/g, '').toUpperCase();
  if (clean.length < 8) return false;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  let sum = 0;
  let multiplier = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body.charAt(i), 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const expectedDvNumber = 11 - (sum % 11);
  let expectedDv = '';
  if (expectedDvNumber === 11) expectedDv = '0';
  else if (expectedDvNumber === 10) expectedDv = 'K';
  else expectedDv = expectedDvNumber.toString();
  return dv === expectedDv;
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-CL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

export const getMonthName = (monthNumber) => {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return months[monthNumber - 1] || '';
};

/**
 * Genera automáticamente la propuesta de correo oficial para una comunidad
 * Ej: "Condominio Los Cerezos" -> "admin.loscerezos@aranpro.cl"
 * Ej: "Edificio Las Palmas" -> "admin.laspalmas@aranpro.cl"
 */
export const generateCommunityEmailProposal = (communityName, domain = 'aranpro.cl') => {
  if (!communityName || !communityName.trim()) return '';
  const clean = communityName
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(condominio|edificio|comunidad|strip center|galeria|parcelas|loteo)\b/gi, '')
    .trim()
    .replace(/[^a-z0-9]/g, '');
  const prefix = clean || 'comunidad';
  return `admin.${prefix}@${domain}`;
};
