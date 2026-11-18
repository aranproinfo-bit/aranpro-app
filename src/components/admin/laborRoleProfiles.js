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
  porteria: { label: 'Portería / recepción de accesos', duties: [
    'Atender la portería y verificar los accesos conforme a los procedimientos autorizados por la comunidad.',
    'Registrar y transmitir novedades pertinentes, resguardar llaves y equipos asignados y efectuar la entrega de turno.',
    'Informar incidentes y activar los canales de emergencia conforme a las instrucciones y capacitación recibidas.'
  ]},
  guardia: { label: 'Guardia de seguridad', duties: [
    'Ejecutar las tareas de seguridad privada específicamente acordadas y autorizadas para la instalación, dentro de las funciones y medios legalmente permitidos.',
    'Registrar novedades y comunicar incidentes por los canales establecidos, de acuerdo con los protocolos y la capacitación aplicables.',
    'Utilizar únicamente los medios autorizados y seguir los procedimientos de emergencia y resguardo de las personas.'
  ]},
  mantenimiento: { label: 'Mantención general', duties: [
    'Ejecutar tareas de mantención general previamente acordadas en las áreas comunes, dentro de su capacitación y de los procedimientos de seguridad informados.',
    'Inspeccionar visualmente instalaciones y comunicar fallas, necesidades de reparación y riesgos a la administración.',
    'Conservar y utilizar herramientas y elementos de protección entregados; las intervenciones sujetas a certificación o habilitación se asignarán a personal autorizado.'
  ]},
  administrativo: { label: 'Apoyo administrativo', duties: [
    'Apoyar la organización de documentos y registros administrativos de la comunidad conforme a las instrucciones de la administración.',
    'Atender consultas y canalizar solicitudes por los medios autorizados, registrando su seguimiento cuando corresponda.',
    'Resguardar la información y las credenciales a las que acceda, utilizando los datos solo para las tareas autorizadas.'
  ]},
  otro: { label: 'Otro cargo', duties: [] }
};
export function detectLaborRole(role) {
  const value = String(role || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  if (/conserj/.test(value)) return 'conserjeria';
  if (/guardia/.test(value)) return 'guardia';
  if (/porter|nochero|nochera/.test(value)) return 'porteria';
  if (/rondin|rondero|rondas/.test(value)) return 'rondin';
  if (/aseo|limpieza/.test(value)) return 'aseo';
  if (/jardin|areas verdes/.test(value)) return 'jardin';
  if (/mayordom/.test(value)) return 'mayordomo';
  if (/mantenedor|mantencion|mantenimiento/.test(value)) return 'mantenimiento';
  if (/administrativo|administrativa|recepcionista/.test(value)) return 'administrativo';
  return 'otro';
}
