import React, { useState, useMemo } from 'react';
import {
  Presentation, Copy, Check, Printer, Eye, X, Building2, HardHat,
  Scale, ShieldCheck, AlertTriangle, HelpCircle, ChevronDown, ChevronUp,
  Search, Filter, Sparkles, Phone, Mail, Globe, CheckCircle2, DollarSign,
  FileText, ShieldAlert, Award, Clock, ArrowRight, MessageSquare, AlertCircle
} from 'lucide-react';
import { AranproLogo, AranproOfficialSeal, AranproPdfStyleSelector } from '../../common/MauranLogo';
import { printDocumentDirectly } from '../../../utils/printDocument';
import { CanonicalPdfHeader, CanonicalPdfPageFooter, CanonicalPdfFinalSignature, canonicalPdfHeaderStyles } from '../../common/CanonicalPdfParts';
import { activeProposalConditions } from '../../../utils/proposalConditions';
import { saferPitchAnswers } from './pitchCorrections';
import { paginateInspection } from '../../../utils/inspectionPagination';

/**
 * PITCH MASTER PANEL
 * Módulo de Preparación Estratégica para Presentaciones ante Comités y Asambleas
 * 
 * Incluye:
 * 1. Personalización Dinámica del Pitch (Comunidad, Tipología y Perfil Estratégico)
 * 2. Libreto de 10 Minutos estructurado con argumentos técnicos de Constructor Civil
 * 3. Arsenal Táctico de Preguntas Difíciles y Objeciones Hostiles (10 casos de alta fricción)
 * 4. Ficha Resumen Ejecutiva Imprimible / Exportable a PDF oficial ARANPRO (Carta 2 Págs)
 */

export const PitchMasterPanel = ({
  empresaForm = {},
  currentCommunity = null,
  proposalConfig = {},
  pdfStyle = 'alt4',
  setPdfStyle = () => {},
  signatureImage = null,
  signatureScale = 1,
  companySettings = {},
  showAlert = () => {},
  renderToolboxNavbar = null
}) => {
  // Estado de personalización dinámica
  const [targetCondo, setTargetCondo] = useState(proposalConfig.targetCondo || currentCommunity?.name || '');
  const [condoType, setCondoType] = useState('vertical'); // 'vertical' | 'horizontal' | 'mixto'
  const [strategyProfile, setStrategyProfile] = useState('tecnico'); // 'tecnico' | 'financiero' | 'legal'
  const [responseOverrides, setResponseOverrides] = useState({});
  const [meetingNotes, setMeetingNotes] = useState('');
  const [meetingChecklist, setMeetingChecklist] = useState({});
  const pitchStorageKey = `aranpro_pitch_${targetCondo.trim().toLocaleLowerCase('es-CL')}`;
  const savePitch = () => { if (!targetCondo.trim()) {showAlert('Falta la comunidad', 'Ingresa el nombre antes de guardar.', 'warning'); return;} try { localStorage.setItem(pitchStorageKey, JSON.stringify({condoType,strategyProfile,responseOverrides,meetingNotes,meetingChecklist})); showAlert('Preparación guardada','Guardada para esta comunidad en este navegador.','success'); } catch {showAlert('No se pudo guardar','Revisa el almacenamiento del navegador.','error');} };
  const loadPitch = () => {try {const saved=JSON.parse(localStorage.getItem(pitchStorageKey) || 'null'); if (!saved) {showAlert('Sin preparación guardada','No hay una preparación para esta comunidad en este navegador.','warning');return;} setCondoType(saved.condoType || 'vertical');setStrategyProfile(saved.strategyProfile || 'tecnico');setResponseOverrides(saved.responseOverrides || {});setMeetingNotes(saved.meetingNotes || '');setMeetingChecklist(saved.meetingChecklist || {});showAlert('Preparación recuperada','Puedes revisar y editar el libreto.','success');} catch {showAlert('No se pudo recuperar','Revisa los datos guardados en el navegador.','error');}};

  // Estado del arsenal de objeciones
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [expandedObjection, setExpandedObjection] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Estado del modal de previsualización e impresión
  const [previewPitchPdfModal, setPreviewPitchPdfModal] = useState(false);

  // Nombre y datos del expositor
  const adminName = empresaForm.adminName || 'John Andrés Arancibia Maureira';
  const adminRut = (empresaForm.adminRut && empresaForm.adminRut !== '14.882.140-K') ? empresaForm.adminRut : '16.012.871-2';
  const adminTitle = 'Constructor Civil • Administrador de Condominios';
  const phone = empresaForm.phone || '+56 9 5811 8504';
  const email = empresaForm.email || 'contacto@aranpro.cl';
  const website = empresaForm.website || 'https://aranpro.cl';
  // El nombre editable del pitch también debe coincidir con la comunidad de la propuesta.
  const terms = activeProposalConditions({ ...proposalConfig, targetCondo });

  // ==========================================
  // 1. GENERADOR DINÁMICO DE LOS 4 PASOS (10 MIN)
  // ==========================================
  const pitchSteps = useMemo(() => {
    const condo = targetCondo.trim() || 'su Comunidad';

    // Minutos 1-2: Apertura según tipología de condominio
    let step1What = '';
    let step1Phrase = '';
    let step1ProTip = '';

    if (condoType === 'vertical') {
      step1What = `Conocer las prioridades del comité de ${condo} y las características de sus instalaciones y su gestión.`;
      step1Phrase = `"Nos interesa conocer cómo funciona ${condo}, cuáles son sus prioridades y qué espera de su administración. A partir de ello podemos presentar una propuesta de gestión técnica, comunicación y rendición adaptada a sus necesidades."`;
      step1ProTip = 'No hable de usted todavía. Hable del alivio que ellos sentirán al no tener que ser el "pararrayos" de las quejas vecinales.';
    } else if (condoType === 'horizontal') {
      step1What = `Preguntar por las prioridades de ${condo}, incluyendo áreas comunes, accesos y mantenciones, sin suponer problemas no informados.`;
      step1Phrase = `"Queremos conocer las prioridades de ${condo} y cómo podemos apoyar el cuidado de sus espacios comunes con una gestión ordenada y transparente."`;
      step1ProTip = 'Enfoque la apertura en la plusvalía patrimonial y la paz comunitaria del barrio.';
    } else {
      step1What = `Comprender las necesidades residenciales y comerciales de ${condo} y revisar sus reglas y distribución de gastos.`;
      step1Phrase = `"En ${condo} nos interesa comprender las necesidades de sus distintos usuarios y revisar las reglas y antecedentes aplicables para proponer una gestión clara."`;
      step1ProTip = 'Destaque la precisión contable y la segregación de gastos diferenciados.';
    }

    // Minutos 3-5: Diferenciador según perfil estratégico
    let step2Title = '';
    let step2What = '';
    let step2Phrase = '';
    let step2ProTip = '';

    if (strategyProfile === 'tecnico') {
      step2Title = 'El Diferenciador de Constructor Civil en Terreno';
      step2What = `Explicar cómo la formación de Constructor Civil contribuye a revisar alcances, antecedentes y cotizaciones, y a coordinar especialistas cuando corresponda.`;
      step2Phrase = `"Para ${condo}, propongo aplicar criterio constructivo a la revisión de las mantenciones y de sus respaldos. Según la instalación y el trabajo requerido, coordinaremos a los especialistas habilitados y presentaremos al comité los antecedentes para decidir. Las visitas serán ${terms.visitFrequency || 'definidas con el comité'}."`;
      step2ProTip = 'Muestre físicamente o en pantalla el Informe de Diagnóstico Técnico Inicial que acompaña su propuesta.';
    } else if (strategyProfile === 'financiero') {
      step2Title = 'Transparencia Radical & Auditoría Bancaria 24/7';
      step2What = `Presentar el método propuesto de rendición y revisión de respaldos, según las condiciones y accesos acordados.`;
      step2Phrase = `"Proponemos para ${condo} una gestión financiera documentada. La preparación y autorización de pagos, y el acceso a sus respaldos, se definirán con el comité según los acuerdos y las facultades aplicables."`;
      step2ProTip = 'Resalte la segregación de funciones: la administración propone y documenta, el comité autoriza el banco.';
    } else {
      step2Title = 'Blindaje Legal Ley N° 21.442 & Asesoría Especializada';
      step2What = `Explicar la importancia de revisar la normativa y el reglamento aplicables, documentar acuerdos y recurrir a asesoría especializada cuando corresponda.`;
      step2Phrase = `"Proponemos acompañar a ${condo} con gestión documentada y atención a la normativa aplicable. Los acuerdos, las modalidades de asamblea y la cobranza se revisarán según los antecedentes de la comunidad, con asesoría especializada cuando corresponda."`;
      step2ProTip = 'Explique qué respaldo se entregará y qué materias podrían requerir asesoría especializada.';
    }

    // Minutos 6-8: Demostración Tecnológica en Vivo
    const step3What = `Sacar el teléfono móvil o compartir pantalla para mostrar la Suite Digital ARANPRO en vivo. Enseñar la colilla interactiva, el botón de respaldo bancario con factura tributaria y el Libro Digital de Reclamos conforme al Art. 20°.`;
    const step3Phrase = `"Podemos explorar juntos la demostración de la plataforma y revisar cómo presenta la información de gastos, documentos y comunicaciones. Los accesos y funcionalidades disponibles para ${condo} dependerán de la configuración y los servicios acordados."`;
    const step3ProTip = 'Invite a un miembro del comité a escanear con su propia cámara el código QR del brochure para que interactúe.';

    // Minutos 9-10: Cierre y Propuesta de Traspaso Seguro
    const step4What = `Presentar las condiciones de transición para ${condo}: ${terms.transitionConditions || 'por definir con el Comité'}. Servicios incluidos: ${terms.includedServices || 'por definir'}.`;
    const step4Phrase = `"Proponemos coordinar una transición ordenada para ${condo}. Condiciones de transición: ${terms.transitionConditions || 'por definir con el Comité'}."`;
    const step4ProTip = 'Haga un silencio seguro tras la frase de cierre y deje que ellos respondan primero.';

    return [
      {
        num: 1,
        time: 'Minutos 1 - 2',
        title: 'Apertura Empática: Conectar con el Dolor del Comité',
        badge: 'Psicología & Confianza',
        what: step1What,
        phrase: step1Phrase,
        protip: step1ProTip,
        docRef: 'Paso 1 • Carta de Valor'
      },
      {
        num: 2,
        time: 'Minutos 3 - 5',
        title: step2Title,
        badge: 'Ventaja Competitiva',
        what: step2What,
        phrase: step2Phrase,
        protip: step2ProTip,
        docRef: 'Paso 2 • Dossier Integral'
      },
      {
        num: 3,
        time: 'Minutos 6 - 8',
        title: 'Demostración en Vivo: Transparencia Radical en el Teléfono',
        badge: 'Impacto Visual & App',
        what: step3What,
        phrase: step3Phrase,
        protip: step3ProTip,
        docRef: 'Paso 4 • Brochure & Demo'
      },
      {
        num: 4,
        time: 'Minutos 9 - 10',
        title: 'Propuesta de Traspaso Ordenado y Cierre',
        badge: 'Cierre Comercial',
        what: step4What,
        phrase: step4Phrase,
        protip: step4ProTip,
        docRef: 'Paso 3 • Propuesta Comercial'
      }
    ];
  }, [targetCondo, condoType, strategyProfile, terms.transitionConditions, terms.includedServices, terms.visitFrequency]);

  // ==========================================
  // 2. ARSENAL DE PREGUNTAS DIFÍCILES Y OBJECIONES (10 CASOS)
  // ==========================================
  const OBJECTIONS_ARSENAL = useMemo(() => [
    {
      id: 'obj_traspaso_hostil',
      category: 'traspaso',
      categoryLabel: 'Traspaso & Resistencia',
      question: '1. "El administrador saliente lleva muchos años, tiene amigos en la comunidad y amenaza con no entregarnos las claves bancarias, los libros contables ni la base de datos si lo sacamos. ¿Cómo van a tomar la administración sin dejarnos paralizados?"',
      subtext: 'Miedo extremo a quedarse sin agua, sin luz o sin pago de sueldos de conserjes durante semanas por una disputa judicial.',
      fatalError: 'Decir "Tendrán que ponerle una demanda y esperar meses a que el juez ordene la entrega". Eso asusta al comité y cancela el cambio.',
      basis: 'Art. 20° y Art. 14° Ley N° 21.442 (obligación perentoria de rendir cuenta y traspaso en máx 30 días bajo apercibimiento penal y cancelación del Registro Nacional de Administradores Minvu). Notificación notarial inmediata y reducción de acta a escritura pública para cambio expedito de firmas bancarias.',
      response: `Entiendo perfectamente su preocupación, es el temor más común y justamente donde más protegemos al Comité. La Ley N° 21.442 cambió las reglas del juego: hoy retener claves, libros o dineros de la comunidad es una falta gravísima que implica la cancelación inmediata del registro en el Minvu y denuncias ante el Juzgado de Policía Local. El día 1 enviamos un requerimiento notarial formal de traspaso. Paralelamente, con la copia autorizada del acta de designación reducida a escritura pública, acudimos al banco para actualizar los poderes de la cuenta corriente de la comunidad, sin depender de la voluntad del saliente. Realizamos un peritaje contable a "fecha cero" para que cualquier faltante previo quede atribuido legalmente a la administración anterior y el nuevo comité quede completamente blindado.`
    },
    {
      id: 'obj_guerra_precios',
      category: 'honorarios',
      categoryLabel: 'Honorarios & Valor',
      question: '2. "Nos llegó otra cotización de un administrador que cobra $250.000 o $300.000 mensuales mientras ustedes cotizan más. ¿Por qué deberíamos pagar la tarifa de ARANPRO si el otro ofrece administrar igual?"',
      subtext: 'Temor a que la asamblea de copropietarios los acuse de despilfarrar fondos contratando una opción más costosa.',
      fatalError: 'Bajar los honorarios en el acto o descalificar al colega con insultos personales.',
      basis: 'La trampa del "administrador barato de escritorio": quien cobra $250.000 necesita 30 condominios para subsistir, visita 20 minutos al mes y compensa aprobando presupuestos inflados de contratistas donde muchas veces cobran comisiones ocultas.',
      response: `Es una excelente pregunta y es muy sano que cuiden el presupuesto de la comunidad. La diferencia es simple: un administrador de $250.000 necesita manejar 25 o 30 edificios a la vez para subsistir; eso significa que jamás pisará la sala de bombas, no revisará una techumbre y se limitará a reenviar cotizaciones externas sin revisarlas. El 60% del gasto común de esta comunidad se va en mantenciones y obras. Si una empresa les cotiza $6.000.000 por una impermeabilización o arreglo de bombas que realmente costaba $3.500.000, el administrador barato ya les costó $2.500.000 adicionales en un solo mes. Con mi formación de Constructor Civil, ese ahorro se logra en terreno desde la primera semana. Nuestro honorario no es un gasto: es una inversión que se paga sola con el control técnico y la transparencia.`
    },
    {
      id: 'obj_seguridad_bancaria',
      category: 'bancos',
      categoryLabel: 'Seguridad Financiera',
      question: '3. "¿Quién maneja la cuenta bancaria? ¿Nos van a pedir que depositemos a una cuenta de ARANPRO o ustedes podrán transferir solos sin autorización del Comité?"',
      subtext: 'El trauma nacional de administradores que desaparecen con los fondos de reserva o hacen "bicicletas" con cuentas colectivas.',
      fatalError: 'Pedir facultades unilaterales para girar cheques o usar cuentas corrientes compartidas entre varios condominios.',
      basis: 'Art. 20° N° 3 Ley N° 21.442: la cuenta bancaria DEBE estar a nombre exclusivo del condominio con su propio RUT. Segregación de funciones absoluta (firmas mancomunadas).',
      response: `La respuesta es tajante: en ARANPRO jamás tocamos un solo peso en cuentas ajenas. La cuenta bancaria está y estará siempre a nombre exclusivo de la Comunidad de ${targetCondo.trim() || 'su Condominio'}, con su RUT tributario propio. Operamos con segregación total de funciones: nosotros elaboramos las nóminas de pago, validamos las facturas en el SII y adjuntamos las cotizaciones, pero el Comité —y únicamente el Comité— es quien ingresa al portal del banco con su clave digipass o firma electrónica para autorizar y liberar cada transferencia. Ni un solo peso sale del banco sin la aprobación previa de ustedes.`
    },
    {
      id: 'obj_tercera_edad',
      category: 'tercera_edad',
      categoryLabel: 'Adultos Mayores & Brecha Digital',
      question: '4. "En nuestra comunidad viven muchos adultos mayores y vecinos que no usan smartphone ni entienden de tecnología. ¿Los van a dejar aislados o desinformados si todo es por aplicación móvil?"',
      subtext: 'Miedo a que los vecinos mayores se sientan discriminados o abandonados, generando protestas internas.',
      fatalError: 'Decir "Tendrán que modernizarse porque el mundo hoy es 100% digital". Provoca rechazo inmediato.',
      basis: 'Estrategia omnicanal e inclusiva: la tecnología potencia el servicio pero no elimina el trato humano ni el formato físico garantizado por ley.',
      response: `Al contrario: la tecnología existe para servir a las personas, no para excluirlas. Nuestra plataforma digital 24/7 convive en perfecta armonía con el formato tradicional. Para los adultos mayores y copropietarios que lo prefieran, imprimimos su colilla en papel de alto gramaje con tipografía grande y legible, entregada en mano en conserjería. Mantenemos el mural físico del edificio actualizado con las circulares oficiales y realizamos jornadas presenciales de inducción para enseñarles con paciencia a revisar sus gastos o consultar a través de sus familiares. Ningún vecino queda atrás en nuestra gestión.`
    },
    {
      id: 'obj_morosidad_cronica',
      category: 'morosidad',
      categoryLabel: 'Morosidad Crónica & Cobranza',
      question: '5. "Tenemos vecinos con 12 a 24 meses de morosidad que acumulan millones de pesos y son personas muy conflictivas. Las administraciones anteriores nunca les cobraron por miedo. ¿Cómo van a recuperar esos fondos sin desatar una guerra civil?"',
      subtext: 'Temor a represalias personales, agresiones o conflictos de convivencia entre vecinos del mismo edificio.',
      fatalError: 'Prometer perdonazos de intereses o titubear por temor a la confrontación vecinal.',
      basis: 'Art. 36° (corte de suministro eléctrico y telecomunicaciones con 3 meses de deuda) y Art. 27° (certificados de deuda emitidos por la administración con mérito ejecutivo para embargo judicial).',
      response: `El gran error de las administraciones anteriores fue personalizar el cobro. Cuando un vecino del comité cobra, se genera un conflicto personal. Con ARANPRO el cobro se institucionaliza bajo la Ley N° 21.442: no cobra el vecino, cobra la ley. Aplicamos un protocolo escalonado y despersonalizado: 1) Notificación formal con liquidación de deuda certificada; 2) Opción de convenio de pago notarial con cuotas fijas más el gasto común al día; 3) Suspensión legal de suministro eléctrico y telecomunicaciones conforme al Art. 36°; y 4) Emisión de Certificado de Deuda que tiene mérito ejecutivo para ingresar inmediatamente demanda civil de embargo con nuestro equipo jurídico. Las reglas se aplican a todos por igual, sin favoritismos ni excepciones.`
    },
    {
      id: 'obj_emergencias_247',
      category: 'tecnico',
      categoryLabel: 'Emergencias & Obras',
      question: '6. "¿Qué pasa si un sábado a las 2:00 AM colapsa la sala de bombas, se inunda el subterráneo o queda una familia atrapada en el ascensor? ¿Contestan ustedes o nos dejan a la deriva con una grabadora hasta el lunes?"',
      subtext: 'Pánico a enfrentar una catástrofe nocturna solos, con vecinos gritando y teniendo que resolver sin apoyo profesional.',
      fatalError: 'Decir "Para eso está el conserje, él tiene que llamar a los bomberos".',
      basis: 'La atención debe ajustarse al protocolo y las condiciones acordadas con la comunidad y sus proveedores.',
      response: `La atención de emergencias propuesta para ${targetCondo.trim() || 'su comunidad'} es: ${terms.emergencyResponse || 'por definir con el Comité'}. La frecuencia de visitas es: ${terms.visitFrequency || 'por definir'}.`
    },
    {
      id: 'obj_asambleas_caos',
      category: 'legal',
      categoryLabel: 'Asambleas & Quórum',
      question: '7. "Nuestras asambleas son eternas, nunca alcanzamos el quórum mínimo legal, los vecinos solo van a descargarse con gritos y terminamos a medianoche sin aprobar ningún acuerdo. ¿Cómo van a ordenar ese caos?"',
      subtext: 'Desgaste emocional inmenso del Comité por tener que aguantar malos tratos y asambleas improductivas.',
      fatalError: 'Permitir que la asamblea se desborde o enganchar con discusiones emocionales fuera de la tabla.',
      basis: 'Art. 15° y Art. 17° Ley N° 21.442: Asambleas híbridas o telemáticas con votación digital validada por RUT en la app. Conducción ejecutiva con orden del día estricto y actas inmediatas.',
      response: `Las asambleas se transforman en campos de batalla cuando la información llega tarde y los vecinos se enteran de las cifras en ese mismo instante. Nosotros eliminamos ese caos con dos herramientas: 1) Enviamos el informe financiero y rendición con 10 días de anticipación con gráficos claros para que no hayan sorpresas; y 2) Implementamos Asambleas Híbridas o Telemáticas según el Art. 15° de la Ley N° 21.442. Los vecinos pueden votar digitalmente desde su teléfono con su RUT, los quórums se calculan de manera automática e instantánea y conducimos la reunión con orden del día estricto, moderando los tiempos a 3 minutos por intervención. Con metodología y datos en mano, las asambleas duran 60 minutos y terminan con acuerdos legalmente blindados.`
    },
    {
      id: 'obj_juicios_laborales',
      category: 'personal',
      categoryLabel: 'Personal DT & Juicios Laborales',
      question: '8. "Tuvimos una demanda millonaria en la Inspección del Trabajo por un conserje despedido por horas extras mal calculadas y libro de asistencia manual alterado. ¿Cómo supervisan al personal para que no nos vuelva a pasar?"',
      subtext: 'Terror a recibir una notificación judicial de la Dirección del Trabajo y que embarguen los fondos de reserva.',
      fatalError: 'Decir que el manejo laboral es secundario o desentenderse de los turnos de conserjería.',
      basis: 'Implementación de Libro de Asistencia Digital certificado por la DT. Turnos 4x4 o 40 horas según Ley N° 21.561, cálculo legal de finiquitos y pago puntual en Previred con certificado F30-1 al día.',
      response: `Los litigios laborales son una de las mayores fugas de dinero de los condominios por culpa de administraciones informales. En ARANPRO aplicamos un estándar corporativo: 1) Eliminamos el libro de papel manipulable e implementamos Libro de Asistencia Digital debidamente certificado por la Dirección del Trabajo (DT); 2) Adecuamos los contratos a la Ley de 40 Horas (Ley N° 21.561) con mallas de turnos 4x4 validadas; y 3) Auditamos mensualmente las cotizaciones en Previred con emisión del certificado F30-1 disponible para el Comité. Cada finiquito se provisiona mensualmente para que la comunidad nunca enfrente un desembolso imprevisto al término de una relación laboral.`
    },
    {
      id: 'obj_equipamiento_antiguo',
      category: 'tecnico',
      categoryLabel: 'Equipos Antiguos & Mantenciones',
      question: '9. "Nuestras instalaciones (bombas, ascensores, calderas) son antiguas y las empresas de mantención siempre dicen que hay que cambiar repuestos carísimos. ¿Cómo sabemos si realmente se requiere o nos están engañando?"',
      subtext: 'Sensación constante de ser estafados por contratistas inescrupulosos que inventan fallas.',
      fatalError: 'Aprobar cotizaciones a ojos cerrados para no asumir la responsabilidad técnica.',
      basis: 'El peritaje del Constructor Civil: revisión in situ de bitácoras foliadas, inspección física del repuesto averiado retirado, medición con instrumental y solicitud de 3 presupuestos con especificaciones técnicas equivalentes.',
      response: `Ese es el valor nuclear de contar con un Constructor Civil a cargo de la administración. La mayoría de los administradores reciben el informe de la empresa, se asustan y le piden al comité que firme el cheque. En mi caso, antes de autorizar un presupuesto mayor: 1) Reviso la bitácora técnica de mantención foliada; 2) Examino físicamente el componente dañado y compruebo el desgaste real con instrumental; y 3) Si la reparación es justificada, levanto especificaciones técnicas homologadas y solicito 3 cotizaciones a proveedores independientes. No permitimos comisiones ocultas ni sobreprecios: los contratistas saben que en este condominio hay una contraparte técnica que entiende de obras y fiscaliza cada tornillo.`
    },
    {
      id: 'obj_garantia_salida',
      category: 'legal',
      categoryLabel: 'Garantía & Salida sin Amarres',
      question: '10. "Todos los administradores prometen el cielo al postular y a los 3 meses desaparecen. Si los contratamos y vemos que no cumplen, ¿quedamos amarrados por un año o cómo podemos terminar la relación sin juicios?"',
      subtext: 'Miedo a quedar atrapados en un contrato forzoso leonino con un mal servicio.',
      fatalError: 'Exigir contratos cerrados de 1 o 2 años sin cláusulas de salida anticipada.',
      basis: 'La duración, renovación y forma de término deben precisarse en la propuesta y el contrato aplicable.',
      response: `Para ${targetCondo.trim() || 'su comunidad'}, la duración propuesta es: ${terms.contractDuration || 'por definir'}. El aviso de término propuesto es: ${terms.noticePeriod || 'por definir'}. Otras condiciones: ${terms.otherConditions || 'por definir'}.`
    }
  ].map(obj => {const corrected=saferPitchAnswers[obj.id] ? {...obj, basis:saferPitchAnswers[obj.id][0], response:saferPitchAnswers[obj.id][1]} : obj; return responseOverrides[obj.id] !== undefined ? {...corrected, response:responseOverrides[obj.id]} : corrected;}), [targetCondo, terms.emergencyResponse, terms.visitFrequency, terms.contractDuration, terms.noticePeriod, terms.otherConditions, responseOverrides]);

  const objectionPages = paginateInspection(OBJECTIONS_ARSENAL.map(obj => ({...obj, notes:obj.response})), {maxWeight:62, maxCards:4, extraWeight: obj => Math.ceil((obj.question || '').length / 75) + 2});

  // Filtrado de objeciones según término de búsqueda y categoría
  const filteredObjections = useMemo(() => {
    return OBJECTIONS_ARSENAL.filter((obj) => {
      const matchCat = categoryFilter === 'all' || obj.category === categoryFilter;
      const matchSearch = !searchTerm.trim() ||
        obj.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        obj.response.toLowerCase().includes(searchTerm.toLowerCase()) ||
        obj.basis.toLowerCase().includes(searchTerm.toLowerCase()) ||
        obj.categoryLabel.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [OBJECTIONS_ARSENAL, searchTerm, categoryFilter]);

  // Copiar respuesta individual
  const handleCopySingleObjection = (obj) => {
    const text = `PREGUNTA COMITÉ:\n${obj.question}\n\nFUNDAMENTO TÉCNICO / LEGAL:\n${obj.basis}\n\nRESPUESTA RECOMENDADA ARANPRO:\n${obj.response}\n\nContacto: ${adminName} • ${phone}`;
    navigator.clipboard.writeText(text);
    setCopiedId(obj.id);
    showAlert('✓ Respuesta Copiada', 'La argumentación maestra se ha copiado al portapapeles.', 'success');
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Copiar Guion Completo de 10 Minutos Personalizado
  const handleCopyFullPitch = () => {
    const condo = targetCondo.trim() || 'su Comunidad';
    let text = `=========================================================\n`;
    text += `GUION MAESTRO ARANPRO • PRESENTACIÓN EN 10 MINUTOS\n`;
    text += `Comunidad: ${condo} | Tipo: ${condoType.toUpperCase()} | Enfoque: ${strategyProfile.toUpperCase()}\n`;
    text += `Expositor: ${adminName} (${adminTitle})\n`;
    text += `=========================================================\n\n`;

    pitchSteps.forEach((s) => {
      text += `[${s.time}] ${s.title.toUpperCase()}\n`;
      text += `OBJETIVO: ${s.what}\n`;
      text += `FRASE MAESTRA:\n${s.phrase}\n`;
      text += `TIP TÁCTICO: ${s.protip}\n\n`;
    });

    text += `Contacto Directo: ${adminName} • ${phone} • ${website}\n`;
    navigator.clipboard.writeText(text);
    showAlert('✓ Guion Completo Copiado', 'El guion adaptado de 10 minutos se copió al portapapeles.', 'success');
  };

  // Imprimir / Exportar Ficha Ejecutiva del Pitch (PDF Carta)
  const handlePrintPitchDoc = () => {
    const targetClean = (targetCondo || 'Comunidad').replace(/[^a-zA-Z0-9]/g, '_');
    const dateClean = new Date().toISOString().slice(0, 10).replace(/[^0-9]/g, '');
    const filename = `ARANPRO_Libreto_Pitch_Ejecutivo_${targetClean}_${dateClean}`;

    printDocumentDirectly('printable-pitch-guide', filename, {
      pageSize: 'letter portrait',
      fitPage: false,
      margin: '0',
      extraStyles: `${canonicalPdfHeaderStyles}
        @page { size: letter portrait; margin: 0 !important; }
        .dossier-page { height: 279.4mm !important; min-height: 279.4mm !important; max-height: 279.4mm !important; padding: 8mm 16mm 8mm 17mm !important; border-left: 3.3mm solid #0F3D2E !important; background-image: linear-gradient(#D4B895, #D4B895) !important; background-size: 1.2mm 100% !important; background-position: 0.5mm 0 !important; background-repeat: no-repeat !important; }
        .dossier-page > div[aria-hidden="true"], .aranpro-print-watermark { display: none !important; }
        .transition-header img[src*="ARANPRO_logo_horizontal"] { width: 37mm !important; max-width: 37mm !important; height: auto !important; max-height: 11mm !important; object-fit: contain !important; }
        .proposal-page-footer { gap: 8px !important; font-size: 8px !important; white-space: nowrap !important; }
        .transition-final-footer { gap: 8px !important; }
        .transition-final-footer .transition-footer-details { gap: 8px !important; flex: 1 1 auto; min-width: 0; }
        .transition-final-footer .transition-footer-seal { flex: 0 0 auto; gap: 6px !important; }
        .transition-final-footer .transition-footer-seal > div { white-space: nowrap; }
        .transition-final-footer .transition-footer-seal > div > div:first-child { font-size: 8px !important; letter-spacing: 0 !important; }
        .transition-final-footer .transition-footer-seal > div > div:last-child { font-size: 7.5px !important; }
        .transition-final-footer .transition-footer-contact { flex: 0 0 auto; white-space: nowrap; font-size: 8px !important; padding-left: 8px !important; }
        .transition-final-footer .transition-footer-signature { flex: 0 0 210px; min-width: 0 !important; }`
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Barra de herramientas contextual unificada */}
      {renderToolboxNavbar && renderToolboxNavbar()}

      {/* ========================================================= */}
      {/* BANNER PRINCIPAL DE LA ESTRATEGIA COMERCIAL DE CIERRE     */}
      {/* ========================================================= */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0F3D2E] via-[#144f3c] to-[#0A291F] text-white shadow-xl relative overflow-hidden border border-[#D4B895]/30">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-[#D4B895]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#D4B895]/20 border border-[#D4B895]/40 text-[#D4B895] text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Estrategia Comercial de Cierre • Licitaciones & Asambleas
              </span>
              <span className="text-emerald-300 text-xs font-mono font-bold">
                10 Minutos • Ley N° 21.442
              </span>
            </div>
            <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Libreto de Pitch Maestro & Arsenal de Preguntas Difíciles
            </h3>
            <p className="text-xs md:text-sm text-slate-200 leading-relaxed">
              Estructura probada para exponer ante comités exigentes. Adapta automáticamente tus argumentos al tipo de comunidad, desactiva preguntas hostiles y presenta con el respaldo técnico inigualable de un <strong>Constructor Civil</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleCopyFullPitch}
              className="px-4 py-2.5 bg-[#D4B895] hover:bg-[#c2a37d] text-[#0F3D2E] font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Copy className="w-4 h-4 text-[#0F3D2E]" />
              Copiar Guion Adaptado
            </button>
            <button
              type="button"
              onClick={() => setPreviewPitchPdfModal(true)}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-4 h-4 text-[#D4B895]" />
              Ver Ficha Imprimible
            </button>
            <button
              type="button"
              onClick={handlePrintPitchDoc}
              className="px-4 py-2.5 bg-[#0F3D2E] hover:bg-[#0A291F] text-white border border-[#D4B895]/40 font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#D4B895]" />
              Imprimir PDF
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* PANEL DE PERSONALIZACIÓN DINÁMICA DEL PITCH (PUNTO 2)     */}
      {/* ========================================================= */}
      <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-[#0F3D2E] border border-emerald-100">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900">
                1. Personalización del Discurso según la Comunidad Objetivo
              </h4>
              <p className="text-[11px] text-slate-500">
                Ajusta las variables y observa cómo los minutos del pitch y sus argumentos se adaptan de forma instantánea.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono font-bold text-[#0F3D2E] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
            Fórmula Dinámica Activa
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Campo 1: Nombre de la Comunidad */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 block text-[11px]">
              Nombre de la Comunidad / Edificio:
            </label>
            <input
              type="text"
              value={targetCondo}
              onChange={(e) => {setTargetCondo(e.target.value); setResponseOverrides({}); setMeetingNotes(''); setMeetingChecklist({}); setCondoType('vertical'); setStrategyProfile('tecnico');}}
              placeholder="Ej: Condominio Las Palmas"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#0F3D2E] focus:border-transparent transition-all"
            />
          </div>

          {/* Campo 2: Tipología de Condominio */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 block text-[11px]">
              Tipología Arquitectónica:
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'vertical', label: '🏢 Torre / Edificio', sub: 'Ascensores & Calderas' },
                { id: 'horizontal', label: '🏡 Casas / Extensión', sub: 'Cercos & Áreas Verdes' },
                { id: 'mixto', label: '🏬 Mixto / Comercio', sub: 'Gastos Diferenciados' }
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setCondoType(t.id)}
                  className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                    condoType === t.id
                      ? 'bg-[#0F3D2E] text-white border-[#0F3D2E] shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="font-black text-[11px] block leading-tight">{t.label}</span>
                  <span className={`text-[9px] block leading-tight ${condoType === t.id ? 'text-emerald-200' : 'text-slate-400'}`}>
                    {t.sub}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Campo 3: Enfoque Estratégico */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 block text-[11px]">
              Perfil Estratégico del Pitch:
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'tecnico', label: '👷‍♂️ Constructor Civil', sub: 'Obras y Ahorro In Situ' },
                { id: 'financiero', label: '💼 Transparencia 24/7', sub: 'Auditoría Bancaria' },
                { id: 'legal', label: '⚖️ Ley N° 21.442', sub: 'Rescate de Comités' }
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setStrategyProfile(p.id)}
                  className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                    strategyProfile === p.id
                      ? 'bg-[#0F3D2E] text-white border-[#0F3D2E] shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="font-black text-[11px] block leading-tight">{p.label}</span>
                  <span className={`text-[9px] block leading-tight ${strategyProfile === p.id ? 'text-emerald-200' : 'text-slate-400'}`}>
                    {p.sub}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-xs text-slate-700"><strong className="text-[#0F3D2E]">Condiciones de la comunidad:</strong> Visitas: {terms.visitFrequency || 'Por definir'} • Emergencias: {terms.emergencyResponse || 'Por definir'} • Servicios incluidos: {terms.includedServices || 'Por definir'} • Servicios adicionales: {terms.additionalServices || 'Por definir'} • Reuniones: {terms.meetingFrequency || 'Por definir'} • Transición: {terms.transitionConditions || 'Por definir'} • Duración: {terms.contractDuration || 'Por definir'} • Aviso: {terms.noticePeriod || 'Por definir'} • Honorario: {targetCondo.trim().toLocaleLowerCase('es-CL') === (proposalConfig.targetCondo || '').trim().toLocaleLowerCase('es-CL') && Number(proposalConfig.proposedMonthlyFee) > 0 && !proposalConfig.unknownDetails ? `$${Number(proposalConfig.proposedMonthlyFee).toLocaleString('es-CL')} / mes` : 'Por definir'}.</div>
        <div className="flex flex-wrap gap-2 text-xs"><button type="button" onClick={savePitch} className="px-3 py-2 rounded-lg bg-[#0F3D2E] text-white font-bold">Guardar preparación</button><button type="button" onClick={loadPitch} className="px-3 py-2 rounded-lg border border-slate-300 font-bold">Recuperar preparación</button><span className="text-slate-500 py-2">Se guarda por nombre de comunidad en este navegador.</span></div>
        <details className="border border-slate-200 rounded-xl p-3 text-xs"><summary className="font-bold text-[#0F3D2E] cursor-pointer">Preparación de la reunión y notas</summary><div className="flex flex-wrap gap-3 mt-3">{['Carta de valor','Dossier','Diagnóstico','Demostración','Propuesta económica'].map(name => <label key={name} className="flex gap-1 items-center"><input type="checkbox" checked={!!meetingChecklist[name]} onChange={e => setMeetingChecklist(prev => ({...prev,[name]:e.target.checked}))} />{name}</label>)}</div><label className="block font-bold mt-3">Preguntas y acuerdos<textarea value={meetingNotes} onChange={e => setMeetingNotes(e.target.value)} rows={3} className="block w-full mt-1 p-2 border border-slate-300 rounded-lg font-normal" /></label></details>
      </div>

      {/* ========================================================= */}
      {/* TIMELINE DE LOS 4 BLOQUES DEL PITCH DE 10 MINUTOS         */}
      {/* ========================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-[#0F3D2E] text-[#D4B895] flex items-center justify-center font-bold text-xs shadow-xs">
              ⏱
            </span>
            <h4 className="text-sm font-black text-slate-900">
              Estructura Cronometrada de 10 Minutos para la Reunión
            </h4>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Expositor: <strong className="text-slate-800">{adminName}</strong> ({adminTitle})
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pitchSteps.map((step) => (
            <div
              key={step.num}
              className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-3.5 hover:border-emerald-200 hover:shadow-md transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-xl bg-[#0F3D2E] text-[#D4B895] font-black text-xs font-mono">
                      {step.time}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-[#0F3D2E] text-[10px] font-bold border border-emerald-100">
                      {step.badge}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">Paso {step.num} de 4</span>
                </div>

                <h5 className="font-black text-slate-900 text-sm leading-tight">
                  {step.title}
                </h5>

                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong className="text-slate-800">Objetivo:</strong> {step.what}
                </p>
              </div>

              {/* Frase Maestra para Pronunciar de Viva Voz */}
              <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold text-[#0F3D2E]">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3 text-[#D4B895]" />
                    Frase Maestra (Guion Textual):
                  </span>
                  <span className="font-mono text-slate-400">{step.docRef}</span>
                </div>
                <blockquote className="text-xs italic text-slate-800 font-medium leading-relaxed pl-2 border-l-2 border-[#0F3D2E]">
                  {step.phrase}
                </blockquote>
              </div>

              {/* Tip Táctico de Exposición */}
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 text-slate-500">
                <span className="flex items-center gap-1.5 text-amber-700">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <strong>Consejo Clave:</strong> {step.protip}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(step.phrase);
                    showAlert('✓ Frase Copiada', `Frase del paso ${step.num} copiada al portapapeles.`, 'success');
                  }}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
                  title="Copiar Frase"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* ARSENAL TÁCTICO DE PREGUNTAS DIFÍCILES Y OBJECIONES (PUNTO 3) */}
      {/* ========================================================= */}
      <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
                <ShieldAlert className="w-4 h-4" />
              </span>
              <h4 className="text-base font-black text-slate-900">
                Arsenal de Preguntas Difíciles & Objeciones Hostiles del Comité
              </h4>
            </div>
            <p className="text-xs text-slate-500">
              10 situaciones de alta tensión en asambleas y entrevistas. Respuestas tácticas listas para desarmar desconfianzas con base en la Ley N° 21.442 y criterio constructivo.
            </p>
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar objeción o artículo..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#0F3D2E] focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Filtros por Categoría */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {[
            { id: 'all', label: 'Todas las Situaciones', count: OBJECTIONS_ARSENAL.length },
            { id: 'traspaso', label: 'Traspaso & Resistencia', count: OBJECTIONS_ARSENAL.filter(o => o.category === 'traspaso').length },
            { id: 'honorarios', label: 'Honorarios & Precio', count: OBJECTIONS_ARSENAL.filter(o => o.category === 'honorarios').length },
            { id: 'bancos', label: 'Seguridad Bancaria', count: OBJECTIONS_ARSENAL.filter(o => o.category === 'bancos').length },
            { id: 'morosidad', label: 'Morosidad Crónica', count: OBJECTIONS_ARSENAL.filter(o => o.category === 'morosidad').length },
            { id: 'tecnico', label: 'Emergencias & Obras', count: OBJECTIONS_ARSENAL.filter(o => o.category === 'tecnico').length },
            { id: 'tercera_edad', label: 'Tercera Edad', count: OBJECTIONS_ARSENAL.filter(o => o.category === 'tercera_edad').length },
            { id: 'legal', label: 'Asambleas & Salida', count: OBJECTIONS_ARSENAL.filter(o => o.category === 'legal').length },
            { id: 'personal', label: 'Personal DT', count: OBJECTIONS_ARSENAL.filter(o => o.category === 'personal').length }
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs flex items-center gap-1.5 cursor-pointer ${
                categoryFilter === cat.id
                  ? 'bg-[#0F3D2E] text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              <span>{cat.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${categoryFilter === cat.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        {/* Lista Acordeón de Objeciones */}
        <div className="space-y-3">
          {filteredObjections.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs">
              No se encontraron objeciones con el término "{searchTerm}".
            </div>
          ) : (
            filteredObjections.map((obj) => {
              const isExpanded = expandedObjection === obj.id;
              return (
                <div
                  key={obj.id}
                  className={`rounded-2xl border transition-all ${
                    isExpanded
                      ? 'bg-slate-50/70 border-[#0F3D2E]/40 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Encabezado colapsable */}
                  <div
                    onClick={() => setExpandedObjection(isExpanded ? null : obj.id)}
                    className="p-4 flex items-start justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-[#0F3D2E]/10 text-[#0F3D2E] font-bold text-[10px] uppercase font-mono">
                          {obj.categoryLabel}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          Fricción Crítica
                        </span>
                      </div>
                      <h5 className="font-black text-slate-900 text-xs md:text-sm leading-snug">
                        {obj.question}
                      </h5>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopySingleObjection(obj);
                        }}
                        className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          copiedId === obj.id
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                        title="Copiar Respuesta"
                      >
                        {copiedId === obj.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">{copiedId === obj.id ? 'Copiado' : 'Copiar'}</span>
                      </button>
                      <div className="p-2 text-slate-400 hover:text-slate-600">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Detalle Expandido */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-slate-200/80 space-y-3.5 text-xs animate-in fade-in">
                      {/* Psicología y Error Fatal */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                        <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 space-y-1">
                          <span className="font-black text-[11px] flex items-center gap-1 text-amber-800">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            ¿Qué temen realmente en el fondo?
                          </span>
                          <p className="text-[11px] leading-relaxed">
                            {obj.subtext}
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-red-50/80 border border-red-200 text-red-900 space-y-1">
                          <span className="font-black text-[11px] flex items-center gap-1 text-red-800">
                            <X className="w-3.5 h-3.5 text-red-600" />
                            Error que conviene evitar:
                          </span>
                          <p className="text-[11px] leading-relaxed">
                            {obj.fatalError}
                          </p>
                        </div>
                      </div>

                      {/* Fundamento Legal / Técnico */}
                      <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 space-y-1">
                        <span className="font-black text-[11px] flex items-center gap-1 text-[#0F3D2E]">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#0F3D2E]" />
                          Fundamento Legal & Criterio Constructivo:
                        </span>
                        <p className="text-[11.5px] leading-relaxed text-emerald-900">
                          {obj.basis}
                        </p>
                      </div>

                      {/* Respuesta Maestra Verbal */}
                      <div className="p-4 rounded-2xl bg-white border-2 border-[#0F3D2E]/20 shadow-xs space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-black text-[#0F3D2E]">
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-[#D4B895]" />
                            Respuesta Maestra Verbal (Guion de Viva Voz):
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">Listo para decir ante el Comité</span>
                        </div>
                        <p className="text-slate-800 leading-relaxed font-medium text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                          "{obj.response}"
                        </p>
                        <details className="text-xs"><summary className="cursor-pointer font-bold text-[#0F3D2E]">Personalizar respuesta (opcional)</summary><textarea rows={4} value={responseOverrides[obj.id] ?? obj.response} onChange={e => setResponseOverrides(prev => ({...prev,[obj.id]:e.target.value}))} className="w-full p-2 mt-2 border border-slate-300 rounded-lg" /><div className="flex flex-wrap gap-3 mt-1"><button type="button" className="font-bold text-[#0F3D2E]" onClick={() => setResponseOverrides(prev => {const next={...prev};delete next[obj.id];return next;})}>Usar respuesta propuesta</button><button type="button" className="font-bold text-[#0F3D2E]" onClick={() => {const base=saferPitchAnswers[obj.id]?.[1] || obj.response;setResponseOverrides(prev => ({...prev,[obj.id]:base.split(/(?<=[.!?])\s+/).slice(0,2).join(' ')}));}}>Usar propuesta breve</button></div></details>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL / DOCUMENTO IMPRIMIBLE: FICHA EJECUTIVA (PUNTO 4)   */}
      {/* ========================================================= */}
      <div
        className={
          previewPitchPdfModal
            ? 'fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto'
            : 'fixed top-0 left-0 w-[850px] -z-[9999] opacity-100 pointer-events-none'
        }
      >
        <div
          className={
            previewPitchPdfModal
              ? 'bg-white rounded-3xl max-w-4xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col relative space-y-4'
              : 'w-[850px] bg-white'
          }
        >
          {previewPitchPdfModal && (
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-[#0F3D2E] text-[#D4B895]">
                  <Presentation className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    Ficha Ejecutiva del Pitch de 10 Minutos & Matriz de Objeciones
                  </h4>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Documento de Apoyo para el Expositor • Formato Oficial ARANPRO (Carta)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintPitchDoc}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-[#D4B895]" />
                  Imprimir / Descargar PDF (Carta)
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewPitchPdfModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {previewPitchPdfModal && (
            <div className="no-print pb-1">
              <AranproPdfStyleSelector value={pdfStyle} onChange={setPdfStyle} compact />
            </div>
          )}

          {/* CONTENEDOR DEL DOCUMENTO IMPRIMIBLE (2 PÁGINAS) */}
          <div className={previewPitchPdfModal ? "overflow-y-auto flex-1 pr-1 bg-slate-100/70 p-2 md:p-4 rounded-2xl" : "w-[850px]"}>
            <div id="printable-pitch-guide" data-pdf-style={pdfStyle}>
                {[...Array(2 + objectionPages.length)].map((_, pageIndex, pages) => <div key={pageIndex} className="dossier-page bg-white p-6 flex flex-col justify-between max-w-[850px] mx-auto text-slate-900 text-xs shadow-md leading-relaxed" style={{fontFamily:'system-ui, -apple-system, sans-serif'}}>
                <div className="space-y-3"><CanonicalPdfHeader badge="GUÍA DE PRESENTACIÓN" description={pageIndex < 2 ? 'Hoja de ruta del pitch' : 'Respuestas a objeciones'} page={pageIndex + 1} community={targetCondo || 'Comunidad'} brandName={empresaForm.provisionalName || 'ARANPRO • GESTIÓN INTEGRAL'} email={email} phone={phone} city={empresaForm.city || 'La Serena, Chile'} />
                  {pageIndex < 2 ? <><div className="p-2 bg-slate-50 rounded-xl border border-slate-200 text-[10px]"><strong>Comunidad:</strong> {targetCondo || 'Comunidad'} • <strong>Tipología:</strong> {condoType === 'vertical' ? 'Torre / edificio' : condoType === 'horizontal' ? 'Casas' : 'Mixto'} • <strong>Perfil:</strong> {strategyProfile} • <strong>Expositor:</strong> {adminName}</div><h3 className="text-sm font-black text-[#0F3D2E]">Hoja de ruta del pitch de 10 minutos</h3><div className="space-y-2">{pitchSteps.slice(pageIndex * 2, pageIndex * 2 + 2).map(step => <div key={step.num} className="p-3 rounded-xl border border-slate-200 space-y-1.5"><div className="flex justify-between gap-2"><strong className="text-[#0F3D2E]">{step.time} • {step.title}</strong><span className="text-[9px] text-slate-500">{step.docRef}</span></div><p><strong>Objetivo:</strong> {step.what}</p><blockquote className="italic bg-slate-50 p-2 border-l-2 border-[#0F3D2E]">{step.phrase}</blockquote><p><strong>Consejo:</strong> {step.protip}</p></div>)}</div>{pageIndex === 1 && <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-[10px]"><strong>Regla de oro de la presentación:</strong> Escuchar el 60% del tiempo y hablar el 40%. No atacar personalmente al administrador saliente; centrarse en los métodos y ofrecer soluciones.</div>}</> : <><h3 className="text-sm font-black text-[#0F3D2E]">Respuestas a preguntas del Comité</h3><div className="space-y-2">{objectionPages[pageIndex - 2].map((item, partIndex) => <div key={item.id + "-" + partIndex} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2"><strong>{item.question}{item.continuation ? " (continuación)" : ""}</strong><p className="bg-white p-2 rounded-lg border border-slate-200" style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}><strong className="text-[#0F3D2E]">Respuesta:</strong> {item.notes}</p></div>)}</div></>}
                </div><div className="mt-auto pt-1.5 space-y-1">{pageIndex < pages.length - 1 ? <div className="border-y border-slate-300 py-2 flex justify-between items-center text-[10px] text-slate-600"><span>Continúa: guía de presentación.</span><span className="border border-emerald-200 rounded-full bg-emerald-50 px-3 py-1 text-[#0F3D2E] font-bold">Continúa en página {pageIndex + 2} →</span></div> : <CanonicalPdfFinalSignature companyRut={empresaForm.companyRut} phone={phone} email={email} website={website} signature={signatureImage || companySettings?.signatureDataUrl} signatureScale={signatureScale} adminName={adminName} adminRut={adminRut} />}<CanonicalPdfPageFooter website={website} label="Guía de presentación" page={pageIndex + 1} totalPages={pages.length} city={empresaForm.city || 'La Serena, Chile'} /></div>
              </div>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
