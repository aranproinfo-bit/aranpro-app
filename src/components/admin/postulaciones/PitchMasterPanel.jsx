import React, { useState, useMemo } from 'react';
import {
  Presentation, Copy, Check, Printer, Eye, X, Building2, HardHat,
  Scale, ShieldCheck, AlertTriangle, HelpCircle, ChevronDown, ChevronUp,
  Search, Filter, Sparkles, Phone, Mail, Globe, CheckCircle2, DollarSign,
  FileText, ShieldAlert, Award, Clock, ArrowRight, MessageSquare, AlertCircle
} from 'lucide-react';
import { AranproLogo, AranproOfficialSeal, AranproPdfStyleSelector } from '../../common/MauranLogo';
import { printDocumentDirectly } from '../../../utils/printDocument';

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
  const [targetCondo, setTargetCondo] = useState(
    proposalConfig.targetCondo || currentCommunity?.name || 'Comunidad Los Laureles'
  );
  const [condoType, setCondoType] = useState('vertical'); // 'vertical' | 'horizontal' | 'mixto'
  const [strategyProfile, setStrategyProfile] = useState('tecnico'); // 'tecnico' | 'financiero' | 'legal'

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
      step1What = `Reconocer el agotamiento real del Comité de ${condo} frente a reclamos diarios por fallas de ascensores, bombas de agua que meten ruido o colillas con gastos que nadie sabe de dónde salieron.`;
      step1Phrase = `"Sabemos perfectamente que ustedes como integrantes del Comité están sobrecargados, respondiendo mensajes molestos a deshoras por fallas de la administración saliente. En ARANPRO no venimos a pedirles fe ciega: venimos a quitarles esa carga de los hombros desde hoy mismo con presencia técnica in situ y cuentas de cristal donde cada peso tiene respaldo bancario visible en línea."`;
      step1ProTip = 'No hable de usted todavía. Hable del alivio que ellos sentirán al no tener que ser el "pararrayos" de las quejas vecinales.';
    } else if (condoType === 'horizontal') {
      step1What = `Conectar con la sensación de desprotección perimetral, áreas verdes descuidadas, portones que fallan y vecinos morosos crónicos que nadie se atreve a cobrar en ${condo}.`;
      step1Phrase = `"En un condominio de extensión como ${condo}, el mayor desgaste del Comité es ver cómo se deterioran las calles interiores, los portones y las áreas comunes mientras una minoría no paga sus gastos comunes. Venimos a profesionalizar la gestión con la Ley N° 21.442 para proteger la plusvalía de sus casas sin que ustedes tengan que pelear con sus propios vecinos."`;
      step1ProTip = 'Enfoque la apertura en la plusvalía patrimonial y la paz comunitaria del barrio.';
    } else {
      step1What = `Abordar la fricción habitual entre residentes y locales comerciales/oficinas en ${condo} por el uso de estacionamientos, ruidos y prorrateo de gastos comunes diferenciados.`;
      step1Phrase = `"Un condominio mixto como ${condo} exige un administrador que domine el Art. 6° de la Ley N° 21.442. No se puede administrar un espacio mixto con planillas simples; se requiere contabilidad segregada y reglas claras para que la actividad comercial no opaque la tranquilidad residencial."`;
      step1ProTip = 'Destaque la precisión contable y la segregación de gastos diferenciados.';
    }

    // Minutos 3-5: Diferenciador según perfil estratégico
    let step2Title = '';
    let step2What = '';
    let step2Phrase = '';
    let step2ProTip = '';

    if (strategyProfile === 'tecnico') {
      step2Title = 'El Diferenciador de Constructor Civil en Terreno';
      step2What = `Demostrar que el 60% del gasto común se destina a mantenciones de infraestructura. La mayoría de los administradores son comerciales o contadores que nunca pisan la sala técnica y validan cotizaciones infladas. Tu formación de Constructor Civil ahorra millones en peritajes y fiscalización directa.`;
      step2Phrase = `"Cuando en ${condo} falla una bomba de impulsión, un tablero eléctrico o hay filtraciones en cubiertas, mi primer paso no es llamar a ciegas a un contratista externo para que les pase una factura inflada. Mi primer paso es ponerme el casco, ingresar a la sala de máquinas, medir el amperaje o revisar la pendiente técnica, y cotizar con criterio constructivo real. Ese criterio técnico le ahorra a la comunidad entre 2 a 5 millones de pesos al año."`;
      step2ProTip = 'Muestre físicamente o en pantalla el Informe de Diagnóstico Técnico Inicial Gratuito que acompaña su propuesta.';
    } else if (strategyProfile === 'financiero') {
      step2Title = 'Transparencia Radical & Auditoría Bancaria 24/7';
      step2What = `Enfocarse en la erradicación absoluta de las "cajas negras". Conciliación bancaria peso a peso en tiempo real, cartolas disponibles para el Comité y finiquitos previsionados en el fondo de reserva.`;
      step2Phrase = `"En ARANPRO la cuenta corriente está 100% a nombre exclusivo de la Comunidad de ${condo}. El Comité mantiene la firma electrónica liberadora; nosotros armamos las nóminas con facturas verificadas en el SII y comprobantes bancarios anexos. Cero transferencias a cuentas personales, cero pagos sin factura tributaria."`;
      step2ProTip = 'Resalte la segregación de funciones: la administración propone y documenta, el comité autoriza el banco.';
    } else {
      step2Title = 'Blindaje Legal Ley N° 21.442 & Asesoría Especializada';
      step2What = `Destacar el cumplimiento riguroso de la nueva normativa de copropiedad: asambleas válidas, quórums telemáticos, actualización del reglamento ante el Conservador y cobranza judicial con título ejecutivo.`;
      step2Phrase = `"La Ley N° 21.442 introdujo responsabilidades civiles e incluso penales para los comités que operan con administradores informales. Con nosotros, ${condo} queda completamente blindado: asambleas con quórum digital válido por RUT, reglamentos actualizados y certificados de deuda que constituyen título ejecutivo inmediato ante tribunales civiles."`;
      step2ProTip = 'Enfatice el riesgo que corren los miembros del comité al firmar balances sin auditoría formal.';
    }

    // Minutos 6-8: Demostración Tecnológica en Vivo
    const step3What = `Sacar el teléfono móvil o compartir pantalla para mostrar la Suite Digital ARANPRO en vivo. Enseñar la colilla interactiva, el botón de respaldo bancario con factura tributaria y el Libro Digital de Reclamos conforme al Art. 20°.`;
    const step3Phrase = `"Miren mi teléfono en este momento: cualquier copropietario de ${condo} abre la app, pincha el gasto de mantención de ascensores o bombas y ve inmediatamente la factura del proveedor y el comprobante de transferencia bancaria oficial. Si tiene un reclamo, no manda un WhatsApp que se pierde: ingresa al Libro Oficial de Reclamos Ley 21.442 y recibe un ticket de seguimiento con plazo legal de respuesta. Con esto se acaban las dudas y la violencia en las asambleas."`;
    const step3ProTip = 'Invite a un miembro del comité a escanear con su propia cámara el código QR del brochure para que interactúe.';

    // Minutos 9-10: Cierre y Propuesta de Traspaso Seguro
    const step4What = `Ofrecer la Auditoría Inicial de Traspaso de 30 Días e Inventario Técnico sin costo. ARANPRO asume la gestión directa del traspaso con el administrador saliente, liberando al Comité de fricciones.`;
    const step4Phrase = `"Ustedes no tendrán que desgastarse enfrentando al administrador saliente. ARANPRO se encarga de la auditoría de traspaso formal según el Art. 20° de la Ley N° 21.442, cotejando las cartolas bancarias peso a peso y levantando el Inventario Técnico Inicial sin costo. Si están de acuerdo en dar este salto hacia la tranquilidad de ${condo}, redactamos hoy mismo la carta de designación para iniciar la transición."`;
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
        title: 'Oferta de Traspaso Seguro & Cierre sin Riesgo',
        badge: 'Cierre Comercial',
        what: step4What,
        phrase: step4Phrase,
        protip: step4ProTip,
        docRef: 'Paso 3 • Propuesta Comercial'
      }
    ];
  }, [targetCondo, condoType, strategyProfile]);

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
      categoryLabel: 'Emergencias 24/7 & Obras',
      question: '6. "¿Qué pasa si un sábado a las 2:00 AM colapsa la sala de bombas, se inunda el subterráneo o queda una familia atrapada en el ascensor? ¿Contestan ustedes o nos dejan a la deriva con una grabadora hasta el lunes?"',
      subtext: 'Pánico a enfrentar una catástrofe nocturna solos, con vecinos gritando y teniendo que resolver sin apoyo profesional.',
      fatalError: 'Decir "Para eso está el conserje, él tiene que llamar a los bomberos".',
      basis: 'Protocolo de contingencia operativa con red de contratistas de guardia 24/7 pre-homologados (empresas de ascensores Minvu con tiempo contractualmente exigido <45 min; gasfitería pesada y tableros). Presencia in situ del Constructor Civil ante emergencias críticas.',
      response: `Una comunidad no descansa los fines de semana y las emergencias graves no avisan de lunes a viernes. Contamos con un protocolo de contingencia 24/7 activo: ante rescates de ascensor, exigimos contractualmente a la empresa mantenedora certificada Minvu un tiempo de respuesta inferior a 45 minutos. Si hay colapso de bombas o rotura de matriz en subterráneo, activamos inmediatamente nuestra cuadrilla técnica de emergencia pre-homologada y yo personalmente como Constructor Civil me constituyo en terreno para evaluar el riesgo estructural e hidráulico. El conserje y el Comité cuentan con línea directa prioritaria para emergencias reales.`
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
      basis: 'Art. 20° Ley N° 21.442: el Administrador ejerce su cargo por delegación de confianza. Cláusula de término anticipado con aviso previo de 30 días sin multas ni indemnizaciones.',
      response: `Nosotros creemos en relaciones basadas en la confianza y en los resultados, no en amarres contractuales forzosos. En nuestro contrato de prestación de servicios incluimos una cláusula de evaluación a los 90 días y una cláusula de salida expedita: si en cualquier momento el Comité o la Asamblea consideran que no estamos cumpliendo el estándar pactado, pueden poner término a la administración con un simple aviso previo de 30 días, sin multas, sin indemnizaciones y con la entrega de toda la documentación en regla según el Art. 20° de la ley. Nuestra permanencia en ${targetCondo.trim() || 'su Comunidad'} se gana mes a mes trabajando con excelencia en terreno.`
    }
  ], [targetCondo]);

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
      fitPage: true,
      margin: '4mm 6mm 4mm 6mm'
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
              onChange={(e) => setTargetCondo(e.target.value)}
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
                            Error Fatal del 90% de los Administradores:
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
                    Documento de Apoyo para el Expositor • Formato Oficial ARANPRO (Carta 2 Páginas)
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
            <div
              id="printable-pitch-guide"
              data-pdf-style={pdfStyle}
              className="space-y-6"
            >
              {/* ==================== PÁGINA 1: HOJA DE RUTA DEL PITCH ==================== */}
              <div
                className="dossier-page page-1 bg-white p-7 md:p-9 pl-10 md:pl-12 min-h-[1050px] flex flex-col justify-between max-w-[850px] mx-auto text-slate-900 text-xs shadow-md leading-relaxed"
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              >
                <div className="space-y-3.5">
                  {/* Membrete Maestro */}
                  <div className="flex items-center justify-between border-b-2 border-[#0F3D2E] pb-3">
                    <div className="flex items-center space-x-3.5">
                      <AranproLogo variant="principal" className="h-11 w-auto" />
                      <div>
                        <span className="text-[14px] font-black tracking-wider text-[#0F3D2E] block uppercase">
                          ARANPRO GESTIÓN INMOBILIARIA
                        </span>
                        <span className="text-[9px] font-mono text-slate-500 block">
                          Ingeniería, Construcción & Administración Profesional • Ley N° 21.442
                        </span>
                      </div>
                    </div>
                    <div className="text-right font-mono text-[9px] text-slate-500">
                      <span className="font-bold text-[#0F3D2E] block text-[10.5px]">GUÍA MAESTRA DEL EXPOSITOR</span>
                      <span>Pitch Ejecutivo (10 Minutos)</span>
                    </div>
                  </div>

                  {/* Ficha Técnica de la Presentación */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-[10px]">
                    <div>
                      <span className="text-slate-400 block font-mono">COMUNIDAD DESTINATARIA:</span>
                      <strong className="text-xs text-slate-900">{targetCondo || 'Comunidad Los Laureles'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-mono">TIPOLOGÍA ARQUITECTÓNICA:</span>
                      <strong className="text-slate-800 uppercase">
                        {condoType === 'vertical' ? 'Torre / Edificio en Altura' : condoType === 'horizontal' ? 'Condominio Horizontal / Casas' : 'Condominio Mixto / Comercial'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-mono">PERFIL ESTRATÉGICO:</span>
                      <strong className="text-[#0F3D2E] uppercase">
                        {strategyProfile === 'tecnico' ? 'Constructor Civil • Auditoría In Situ' : strategyProfile === 'financiero' ? 'Transparencia Bancaria 24/7' : 'Regularización Ley 21.442'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-mono">EXPOSITOR TITULAR:</span>
                      <strong className="text-slate-900">{adminName}</strong>
                    </div>
                  </div>

                  {/* Titular */}
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-[#0F3D2E] uppercase tracking-tight">
                      Hoja de Ruta del Pitch de 10 Minutos (Estructura de Cierre)
                    </h3>
                    <p className="text-[10px] text-slate-600 leading-snug">
                      Guion cronometrado para reuniones de licitación ante Comités de Administración o Asambleas. Diseñado para conectar con el dolor del cliente, demostrar solvencia técnica y cerrar el traspaso seguro.
                    </p>
                  </div>

                  {/* Tabla de los 4 Bloques */}
                  <div className="space-y-2.5">
                    {pitchSteps.map((s) => (
                      <div key={s.num} className="p-3 rounded-xl border border-slate-200 bg-white space-y-1.5 shadow-2xs">
                        <div className="flex items-center justify-between text-[10px]">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-[#0F3D2E] text-[#D4B895] font-black font-mono">
                              {s.time}
                            </span>
                            <span className="font-black text-slate-900 text-[11px]">
                              {s.title}
                            </span>
                          </div>
                          <span className="text-slate-400 font-mono text-[9px]">{s.docRef}</span>
                        </div>
                        <p className="text-[10px] text-slate-600 leading-relaxed">
                          <strong className="text-slate-800">Objetivo:</strong> {s.what}
                        </p>
                        <blockquote className="text-[10.5px] italic text-slate-800 bg-slate-50 p-2 rounded-lg border-l-2 border-[#0F3D2E] leading-relaxed">
                          {s.phrase}
                        </blockquote>
                      </div>
                    ))}
                  </div>

                  {/* Regla de Oro */}
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-[9.5px] leading-snug">
                    <strong className="text-amber-900 block font-black mb-0.5">
                      ★ REGLA DE ORO DE LA PRESENTACIÓN:
                    </strong>
                    Escuchar el 60% del tiempo y hablar el 40%. Jamás atacar personalmente al administrador saliente: atacar los métodos obsoletos (planillas manuales, falta de visitas técnicas) y ofrecer la solución técnica definitiva de Constructor Civil.
                  </div>
                </div>

                {/* Pie de Página Página 1 */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[8.5px] text-slate-400 font-mono">
                  <div>ARANPRO Gestión Inmobiliaria • {website}</div>
                  <div className="font-bold text-[#0F3D2E]">Libreto de Pitch Ejecutivo • Ley N° 21.442 (Pág. 1 de 2)</div>
                  <div>{empresaForm.city || 'La Serena, Chile'}</div>
                </div>
              </div>

              {/* ==================== PÁGINA 2: MATRIZ TÁCTICA DE OBJECIONES ==================== */}
              <div
                className="dossier-page page-2 bg-white p-7 md:p-9 pl-10 md:pl-12 min-h-[1050px] flex flex-col justify-between max-w-[850px] mx-auto text-slate-900 text-xs shadow-md leading-relaxed"
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              >
                <div className="space-y-3.5">
                  {/* Membrete Página 2 */}
                  <div className="flex items-center justify-between border-b-2 border-[#0F3D2E] pb-3">
                    <div className="flex items-center space-x-3.5">
                      <AranproLogo variant="principal" className="h-11 w-auto" />
                      <div>
                        <span className="text-[14px] font-black tracking-wider text-[#0F3D2E] block uppercase">
                          ARANPRO GESTIÓN INMOBILIARIA
                        </span>
                        <span className="text-[9px] font-mono text-slate-500 block">
                          Ingeniería, Construcción & Administración Profesional • Ley N° 21.442
                        </span>
                      </div>
                    </div>
                    <div className="text-right font-mono text-[9px] text-slate-500">
                      <span className="font-bold text-[#0F3D2E] block text-[10.5px]">MANUAL TÁCTICO DE CHOQUE</span>
                      <span>Respuestas a Objeciones Críticas</span>
                    </div>
                  </div>

                  {/* Titular */}
                  <div className="space-y-0.5">
                    <h3 className="text-base font-black text-[#0F3D2E] uppercase tracking-tight">
                      Matriz Táctica: Respuestas a Preguntas Ácidas del Comité
                    </h3>
                    <p className="text-[10px] text-slate-600 leading-snug">
                      Respuestas condensadas de alto impacto legal y técnico para consultar rápidamente durante la reunión.
                    </p>
                  </div>

                  {/* 6 Casos Críticos en la Hoja Resumen */}
                  <div className="space-y-2">
                    {OBJECTIONS_ARSENAL.slice(0, 6).map((item, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[10px] space-y-1">
                        <div className="flex items-center justify-between">
                          <strong className="text-slate-900 font-bold block text-[10.5px]">
                            {item.question}
                          </strong>
                          <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-mono text-[8.5px]">
                            {item.categoryLabel}
                          </span>
                        </div>
                        <p className="text-slate-700 leading-relaxed bg-white p-2 rounded-lg border border-slate-200 text-[9.5px]">
                          <strong className="text-[#0F3D2E]">Respuesta Táctica:</strong> "{item.response}"
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Sello y Firma del Administrador */}
                  <div className="pt-2 border-t border-slate-200 flex items-end justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <AranproOfficialSeal
                        size="sm"
                        companyRut={empresaForm.companyRut && !String(empresaForm.companyRut).includes('76.999.888') ? empresaForm.companyRut : ''}
                        rnacNumber=""
                        showCaption={true}
                      />
                      <div className="text-[9px] text-slate-600 border-l border-slate-200 pl-3 space-y-0.5">
                        <p><strong>Contacto Directo:</strong> <span className="font-mono font-bold text-[#0F3D2E]">{phone}</span></p>
                        <p><strong>Correo:</strong> <span className="font-mono">{email}</span></p>
                        <p><strong>Sitio Web:</strong> <span className="font-mono text-[#0F3D2E] font-bold">{website}</span></p>
                      </div>
                    </div>

                    <div className="text-center min-w-[220px]">
                      <div className="h-12 flex items-end justify-center pb-0.5 overflow-visible">
                        {(signatureImage || companySettings?.signatureDataUrl) && (
                          <img
                            src={signatureImage || companySettings?.signatureDataUrl}
                            alt="Firma"
                            className="h-11 max-h-12 w-auto max-w-[220px] object-contain mx-auto"
                            style={{ transform: `scale(${signatureScale})`, transformOrigin: 'bottom center' }}
                          />
                        )}
                      </div>
                      <div className="border-t-[1.5px] border-slate-800 pt-0.5">
                        <span className="text-[10.5px] font-black text-slate-900 block leading-tight">{adminName}</span>
                        <span className="text-[8.5px] text-[#0F3D2E] font-bold block leading-tight">Constructor Civil • Administrador de Condominios</span>
                        <span className="text-[8.5px] text-slate-600 font-mono block">RUT: {adminRut} • Ley N° 21.442</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pie de Página Página 2 */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[8.5px] text-slate-400 font-mono">
                  <div>ARANPRO Gestión Inmobiliaria • {website}</div>
                  <div className="font-bold text-[#0F3D2E]">Libreto de Pitch Ejecutivo • Ley N° 21.442 (Pág. 2 de 2)</div>
                  <div>{empresaForm.city || 'La Serena, Chile'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
