// Propuestas editables: las funciones reales y habilitaciones requieren confirmación.
export const laborRoleProfiles = {
  conserjeria: { label: 'Conserjería', duties: null },
  rondin: { label: 'Rondín / rondas', duties: [
    'Realizar las rondas y verificaciones visuales de las áreas autorizadas, según las instrucciones, horarios, capacitación y medios entregados por el empleador.',
    'Registrar y comunicar novedades, incidentes y desperfectos observados; entregar información y medios de trabajo en el relevo.',
    'Ante una emergencia o situación de riesgo, resguardarse y dar aviso a los canales designados, conforme a su capacitación y al plan aplicable.',
    'Utilizar llaves, credenciales y equipos solo para tareas autorizadas. Las actividades de seguridad privada o sujetas a habilitación específica se realizarán solo cuando se cumplan los requisitos legales y operativos aplicables.'
  ]},
  aseo: { label: 'Aseo y espacios comunes', duties: [
    'Realizar las tareas de limpieza de las áreas comunes y superficies que determine el empleador dentro de los lugares y horarios acordados.',
    'Utilizar y conservar los implementos y productos entregados, siguiendo las instrucciones de seguridad y las fichas correspondientes; informar faltantes o desperfectos.',
    'Clasificar y trasladar residuos conforme al procedimiento informado y a las condiciones de seguridad del lugar.',
    'Informar riesgos, daños o necesidades de reposición observadas. No intervenir instalaciones o realizar trabajos especializados sin la capacitación y habilitación que correspondan.'
  ]},
  jardin: { label: 'Jardinería y áreas verdes', duties: [
    'Mantener las áreas verdes asignadas mediante labores de riego, limpieza, poda y cuidado de vegetación que hayan sido acordadas y para las que exista capacitación.',
    'Revisar visualmente herramientas y equipos antes de utilizarlos, informar fallas y emplear los elementos de protección y procedimientos entregados.',
    'Retirar y disponer residuos vegetales según las instrucciones del empleador, cuidando los accesos y la seguridad de las personas.',
    'No aplicar productos, intervenir instalaciones ni ejecutar trabajos especializados o de altura sin evaluación de riesgos, capacitación y habilitaciones cuando correspondan.'
  ]},
  mayordomo: { label: 'Mayordomía', duties: [
    'Coordinar las tareas operativas del personal y los turnos conforme a las instrucciones y atribuciones que entregue la administración.',
    'Revisar visualmente las áreas comunes, registrar novedades y comunicar a la administración fallas, riesgos y necesidades de mantención.',
    'Coordinar el acceso y seguimiento de proveedores autorizados, sin sustituir las atribuciones de contratación o autorización de gastos que correspondan a otros órganos.',
    'Apoyar la entrega de información y la aplicación de procedimientos de emergencia, dentro de sus funciones, capacitación y medios disponibles.'
  ]},
  otro: { label: 'Otro cargo', duties: [] }
};
export function detectLaborRole(role) {
  const value = String(role || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  if (/conserj/.test(value)) return 'conserjeria';
  if (/rondin|rondero|rondas/.test(value)) return 'rondin';
  if (/aseo|limpieza/.test(value)) return 'aseo';
  if (/jardin|areas verdes/.test(value)) return 'jardin';
  if (/mayordom/.test(value)) return 'mayordomo';
  return 'otro';
}
