// Catálogo Oficial de Plantillas de Respuestas y Notificaciones para el Libro de Reclamos y Sugerencias
// Cumple con la Ley N° 21.442 de Copropiedad Inmobiliaria, Ley N° 21.020 (Tenencia Responsable) y Reglamentos Internos

export const COMPLAINT_RESPONSE_TEMPLATES = [
  {
    id: 'ruidos_molestos',
    category: 'Ruidos Molestos / Convivencia',
    icon: 'Volume2',
    label: 'Ruidos Molestos en Horario de Descanso (Art. 14° y 21°)',
    suggestedStatus: 'EN_GESTION',
    suggestedPriority: 'Alta',
    description: 'Música alta, fiestas, ladridos nocturnos o ruidos que impiden el descanso nocturno.',
    adminResponse: 'Estimado(a) {complainantName}, se acogió su requerimiento en el Libro Oficial. Se procedió a cursar Notificación y Carta de Advertencia Formal a los ocupantes de {implicatedUnit} recordando los horarios de silencio y normas de convivencia según el Reglamento Interno y Ley N° 21.442. En caso de reiteración, se aplicará la multa reglamentaria correspondiente en la próxima colilla de gastos comunes.',
    complainantNotice: 'Estimado(a) {complainantName} ({complainantUnit}): Le informamos que la Administración ARANPRO ha acogido su reclamo Folio {folio}. Ya se notificó formalmente a {implicatedUnit} mediante Carta de Advertencia Preventiva con apercibimiento de multa reglamentaria. Agradecemos su compromiso con la tranquilidad y convivencia de {communityName}.',
    implicatedNotice: 'NOTIFICACIÓN FORMAL DE ADVERTENCIA PREVENTIVA\nComunidad: {communityName}\nDestinatario: Ocupantes / Copropietario {implicatedUnit}\nReferencia: Reclamo por Ruidos Molestos en Horario de Descanso (Folio {folio})\n\nEstimado(a) vecino(a):\nPor medio de la presente, la Administración ARANPRO le notifica que se ha recepcionado una denuncia formal por emisión de ruidos molestos / música a volumen excesivo en horario de madrugada, vulnerando el derecho al descanso y las normas del Reglamento de Copropiedad (Art. 14°) y los Artículos 20° y 21° de la Ley N° 21.442.\n\nLe solicitamos encarecidamente adoptar las medidas necesarias para moderar los niveles sonoros. Le informamos que dispone de un plazo de 48 horas hábiles para formular sus descargos ante esta administración. En caso de reincidencia comprobada, se procederá a cursar la multa reglamentaria estipulada en el Reglamento Interno, la cual será incorporada en su próxima colilla de cobro de gastos comunes.\n\nAtentamente,\nAdministración ARANPRO & Comité de Administración'
  },
  {
    id: 'porton_seguridad',
    category: 'Seguridad / Portón',
    icon: 'ShieldAlert',
    label: 'Descalibración o Falla en Portón Vehicular / Accesos (Art. 40°)',
    suggestedStatus: 'EN_GESTION',
    suggestedPriority: 'Urgente',
    description: 'Falla de fotoceldas, motor atascado o peligro de golpe a vehículos y peatones.',
    adminResponse: 'Estimado(a) {complainantName}, agradecemos su urgente reporte. Se activó de inmediato el protocolo de mantención preventiva (Art. 40 Ley 21.442) y se emitió orden de servicio a la empresa proveedora de automatización para la calibración de fotoceldas y revisión de finales de carrera en un plazo máximo de 24 horas. Se solicitó a conserjería/vigilancia operar en modalidad supervisada mientras se concluye el ajuste.',
    complainantNotice: 'Estimado(a) {complainantName}: Respecto a su reporte Folio {folio} sobre el portón de acceso, le confirmamos que el técnico especialista ya fue despachado para la inspección y recalibración del sistema anti-aplastamiento en el transcurso del día. Agradecemos alertar oportunamente para la seguridad de toda la comunidad.',
    implicatedNotice: 'AVISO DE PRECAUCIÓN A LA COMUNIDAD\nComunidad: {communityName}\nEstimados vecinos y conductores: El portón vehicular se encuentra en proceso de calibración y mantención técnica preventiva durante el día de hoy por la empresa especialista. Rogamos ingresar a baja velocidad y verificar la apertura completa antes del cruce. Administración ARANPRO.'
  },
  {
    id: 'mascotas_tenencia',
    category: 'Mascotas / Tenencia Responsable',
    icon: 'Dog',
    label: 'Tenencia Responsable de Mascotas (Ley N° 21.020 "Cholito")',
    suggestedStatus: 'EN_GESTION',
    suggestedPriority: 'Media',
    description: 'Paseo sin correa, no recolección de fecas o ladridos constantes en áreas comunes.',
    adminResponse: 'Estimado(a) {complainantName}, informamos que se notificó por escrito a los tutores de la mascota en {implicatedUnit}, recordando la estricta obligatoriedad del uso de correa en bienes comunes y el retiro inmediato de desechos, conforme a la Ley N° 21.020 y Reglamento Interno. Se fijó apercibimiento de multa en caso de persistir el incumplimiento.',
    complainantNotice: 'Estimado(a) {complainantName} ({complainantUnit}): Su requerimiento Folio {folio} sobre tenencia de mascotas ha sido atendido. La administración cursó notificación formal a los residentes de {implicatedUnit} exigiendo el cumplimiento estricto de la Ley 21.020 y Reglamento Interno.',
    implicatedNotice: 'NOTIFICACIÓN DE TENENCIA RESPONSABLE DE MASCOTAS\nComunidad: {communityName}\nDestinatario: Residentes / Copropietarios {implicatedUnit}\nReferencia: Cumplimiento Ley N° 21.020 y Reglamento de Copropiedad (Folio {folio})\n\nEstimado(a) vecino(a):\nLe recordamos que conforme a la legislación vigente y las normas de nuestro condominio, toda mascota debe transitar por bienes comunes debidamente sujeta con correa o arnés, y sus tutores deben recoger de manera inmediata sus deposiciones y disponerlas en basureros cerrados.\n\nLe solicitamos su colaboración para mantener la higiene, salubridad y seguridad de nuestros niños y familias. El incumplimiento reiterado facultará a la administración para aplicar la sanción monetaria prevista en el Reglamento Interno.\n\nAtentamente,\nAdministración ARANPRO'
  },
  {
    id: 'estacionamiento_mal_uso',
    category: 'Estacionamientos / Tránsito',
    icon: 'Car',
    label: 'Uso Indebido de Estacionamientos o Bloqueo de Vías',
    suggestedStatus: 'EN_GESTION',
    suggestedPriority: 'Alta',
    description: 'Vehículo mal estacionado, ocupación de puesto ajeno o sobreuso de estacionamiento de visitas.',
    adminResponse: 'Estimado(a) {complainantName}, se verificó la patente en el registro vehicular de la comunidad y se contactó al conductor de {implicatedUnit} para el retiro y reubicación inmediata del vehículo. Se cursó advertencia formal sobre los límites de uso de estacionamientos de visitas y vías de evacuación de emergencia.',
    complainantNotice: 'Estimado(a) {complainantName}: El reclamo Folio {folio} sobre el vehículo estacionado indebidamente fue gestionado con la unidad {implicatedUnit}. Se le exigió el retiro inmediato y se registró la advertencia en su hoja de vida comunitaria.',
    implicatedNotice: 'REQUERIMIENTO URGENTE DE RETIRO VEHICULAR\nComunidad: {communityName}\nDestinatario: Unidad {implicatedUnit} / Conductor\n\nEstimado(a) vecino(a):\nSe ha detectado que su vehículo se encuentra obstaculizando una vía de circulación o haciendo uso de un estacionamiento asignado a otra vivienda sin autorización previa. Le solicitamos proceder a su reubicación inmediata. Le recordamos que las zonas de circulación y accesos deben permanecer despejadas en todo momento para vehículos de emergencia y vecinos. En caso de persistir, se aplicará la multa del Reglamento Interno.\n\nAdministración ARANPRO'
  },
  {
    id: 'filtraciones_humedad',
    category: 'Filtraciones & Gasfitería',
    icon: 'Droplets',
    label: 'Filtración de Agua o Daño entre Unidades Colindantes',
    suggestedStatus: 'EN_GESTION',
    suggestedPriority: 'Urgente',
    description: 'Humedad en cielo/muros proveniente de la unidad superior o matriz común.',
    adminResponse: 'Estimado(a) {complainantName}, se coordinó visita técnica inspectiva del gasfíter de la administración para hoy a las 15:00 hrs con el fin de certificar el punto de origen de la filtración (sello de tina, desagüe o matriz común). Se contactó a los ocupantes de {implicatedUnit} para facilitar el acceso a la llave de paso y coordinar las reparaciones urgentes correspondientes.',
    complainantNotice: 'Estimado(a) {complainantName} ({complainantUnit}): La administración ya coordinó la visita técnica para inspeccionar la filtración y certificar el daño en su vivienda. Se notificó a {implicatedUnit} para la revisión conjunta en el transcurso del día.',
    implicatedNotice: 'NOTIFICACIÓN DE INSPECCIÓN URGENTE POR FILTRACIÓN\nComunidad: {communityName}\nDestinatario: Residente / Propietario {implicatedUnit}\n\nEstimado(a) vecino(a):\nSe nos ha reportado una filtración activa proveniente de su unidad hacia la vivienda inferior. Conforme a las facultades del Administrador (Art. 20 Ley 21.442) para resguardar la seguridad del inmueble, le solicitamos facilitar el ingreso del personal técnico autorizado para la revisión de llaves de paso, artefactos sanitarios y sellos. Rogamos su máxima colaboración para evitar daños mayores a la estructura común.\n\nAdministración ARANPRO'
  },
  {
    id: 'basura_areas_verdes',
    category: 'Espacios Comunes & Aseo',
    icon: 'Trash2',
    label: 'Disposición Inadecuada de Basura o Daño en Bienes Comunes',
    suggestedStatus: 'RESUELTO',
    suggestedPriority: 'Normal',
    description: 'Bolsas de basura en pasillos, escombros o mal uso de contenedores comunes.',
    adminResponse: 'Estimado(a) {complainantName}, el personal de aseo procedió al retiro y sanitización del sector informado. Se envió comunicado recordatorio a los vecinos del pasillo/torre recordando los horarios de extracción municipal y la prohibición sanitaria de acopiar residuos en áreas de tránsito común.',
    complainantNotice: 'Estimado(a) {complainantName}: Le informamos que el sector reportado en el Folio {folio} fue completamente limpiado y despejado por nuestro equipo de mantención. Gracias por cuidar el entorno de nuestra comunidad.',
    implicatedNotice: 'COMUNICADO SANITARIO: DISPOSICIÓN DE RESIDUOS\nComunidad: {communityName}\nRecordamos a todos los residentes que por estrictas razones sanitarias y de convivencia, está prohibido depositar bolsas de basura fuera de los contenedores o en pasillos comunes. Se aplicarán las sanciones del Reglamento Interno a quienes sean sorprendidos infringiendo esta norma. Administración ARANPRO.'
  },
  {
    id: 'sugerencia_asamblea',
    category: 'Espacios Comunes & Sustentabilidad',
    icon: 'Sparkles',
    label: 'Sugerencia Comunitaria / Propuesta de Mejora (Elevada a Asamblea)',
    suggestedStatus: 'RESUELTO',
    suggestedPriority: 'Normal',
    description: 'Proyectos de reciclaje, mejoras de iluminación, cámaras, quinchos o normas internas.',
    adminResponse: 'Estimado(a) {complainantName}, excelente iniciativa. La administración y el Comité de Administración evaluaron positivamente su propuesta y ha sido formalmente elevada para ser incorporada como punto de tabla en la próxima Asamblea Ordinaria / Consulta por Escrito (Art. 15 Ley 21.442) para su discusión y asignación presupuestaria.',
    complainantNotice: 'Estimado(a) {complainantName} ({complainantUnit}): ¡Muchas gracias por su valiosa propuesta! Su requerimiento Folio {folio} fue evaluado favorablemente por la administración y fue marcado como ★ Elevado a Tema de Asamblea para la próxima reunión de copropietarios de {communityName}.',
    implicatedNotice: ''
  }
];

export const getResponseTemplateById = (templateId) => {
  return COMPLAINT_RESPONSE_TEMPLATES.find(t => t.id === templateId) || null;
};
