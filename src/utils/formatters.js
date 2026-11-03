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
