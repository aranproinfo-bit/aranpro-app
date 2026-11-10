/**
 * LÓGICA DE PREPARACIÓN PARA POSTULAR (CHECKLIST & SEMÁFORO ARANPRO)
 * Catálogo exhaustivo de requisitos según Ley N° 21.442, Minvu, RNAC y comités de administración.
 *
 * Categorías y Niveles de Exigencia:
 *  - 'legal'        → Exigido por Ley N° 21.442 y Reglamento RNAC Minvu (inhabilitante si falta)
 *  - 'habitual'     → Documentación estándar exigida por comités en licitaciones
 *  - 'embudo'       → Documentos oficiales del embudo de postulación (Los 4 Pasos ARANPRO)
 *  - 'diferenciador'→ Formación técnica (Constructor Civil), referencias y calculadora pericial
 *  - 'formal'       → Calidad y consistencia de datos, firma digital, timbres y membretes
 */

const DAY_MS = 86400000;

export const parseDate = (value) => {
  if (!value) return null;
  const d = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const daysBetween = (a, b) => Math.round((a.getTime() - b.getTime()) / DAY_MS);

export const hasFile = (record) => Boolean(record && (record.fileData || (record.fileId && !record.fileError)));

export const DOC_CATEGORIES = [
  { id: 'habilitante', label: 'Habilitación legal (RNAC & Minvu)' },
  { id: 'identidad', label: 'Identidad y antecedentes' },
  { id: 'formacion', label: 'Formación y capacitación' },
  { id: 'tributario', label: 'Tributario y comercial (SII / TGR)' },
  { id: 'garantias', label: 'Seguros y garantías' },
  { id: 'gremial', label: 'Acreditaciones gremiales y técnicas' },
  { id: 'embudo', label: 'Documentos Oficiales del Embudo' },
  { id: 'otros', label: 'Otros respaldos' }
];

const LEGACY_CATEGORY_MAP = [
  [/minvu|rnac|ley 21/i, 'habilitante'],
  [/registro civil|antecedente|identidad/i, 'identidad'],
  [/t[ií]tulo|formaci[oó]n|curso|capacitaci/i, 'formacion'],
  [/sii|tributari|comercial|tgr/i, 'tributario'],
  [/seguro|garant|p[oó]liza/i, 'garantias'],
  [/cgai|agacech|gremi/i, 'gremial']
];

export const normalizeCategory = (category) => {
  if (DOC_CATEGORIES.some((c) => c.id === category)) return category;
  const hit = LEGACY_CATEGORY_MAP.find(([re]) => re.test(category || ''));
  return hit ? hit[1] : 'otros';
};

export const REQUIREMENTS = [
  {
    key: 'rnac',
    tier: 'legal',
    weight: 3,
    category: 'habilitante',
    label: 'Inscripción vigente en el RNAC (MINVU)',
    hint: 'Ficha o certificado descargado del Registro Nacional de Administradores Minvu (Ley N° 21.442). Los comités están obligados a verificar que figure vigente.',
    freshnessDays: 60,
    match: /rnac|registro nacional.*administrador/i
  },
  {
    key: 'antecedentes',
    tier: 'legal',
    weight: 3,
    category: 'identidad',
    label: 'Certificado de antecedentes para fines especiales',
    hint: 'Acredita no estar inhabilitado legalmente para administrar (delitos de los Títulos VIII y IX del Código Penal, Art. 82 Ley N° 21.442).',
    freshnessDays: 60,
    match: /antecedentes/i
  },
  {
    key: 'capacitacion',
    tier: 'legal',
    weight: 3,
    category: 'formacion',
    label: 'Curso de administración de condominios aprobado (OTEC)',
    hint: 'Certificado oficial que acredita la aprobación del curso de capacitación exigido por el Minvu para inscribirse a título oneroso.',
    match: /capacitaci|curso.*(administraci|copropiedad|21\.?442)/i,
    academicMatch: /capacitaci|administraci[oó]n de copropiedad|ley 21\.?442/i
  },
  {
    key: 'licencia_educacion',
    tier: 'legal',
    weight: 3,
    category: 'formacion',
    label: 'Licencia de Enseñanza Media o Título Técnico/Profesional (Art. 82)',
    hint: 'Exigencia legal habilitante para la inscripción en el RNAC (acredita cuarto medio o título en educación superior).',
    match: /licencia.*(media|enseñanza)|t[ií]tulo.*(t[eé]cnico|profesional|constructor|ingenier)/i,
    academicMatch: /constructor|t[ií]tulo|ingenier|licenciatura|media/i
  },
  {
    key: 'cedula',
    tier: 'habitual',
    weight: 2,
    category: 'identidad',
    label: 'Cédula de identidad (ambos lados)',
    hint: 'Identificación oficial del administrador o representante legal requerida para el contrato de administración.',
    match: /c[eé]dula|carnet/i
  },
  {
    key: 'sii',
    tier: 'habitual',
    weight: 2,
    category: 'tributario',
    label: 'Inicio de actividades / Situación tributaria (SII)',
    hint: 'Acredita giro comercial y emisión de boletas de honorarios o facturas exentas.',
    match: /\bsii\b|inicio de actividades|giro|tributari/i
  },
  {
    key: 'tgr',
    tier: 'habitual',
    weight: 2,
    category: 'tributario',
    label: 'Certificado de Deuda Tributaria al Día (TGR / Tesorería General)',
    hint: 'Acredita no registrar deudas fiscales ni convenios impagos ante la Tesorería General de la República.',
    freshnessDays: 60,
    match: /\btgr\b|tesorer[ií]a|deuda tributaria/i
  },
  {
    key: 'garantia',
    tier: 'habitual',
    weight: 2,
    category: 'garantias',
    label: 'Póliza de garantía / Fiel cumplimiento o responsabilidad civil',
    hint: 'Caución o seguro de responsabilidad civil profesional que entrega tranquilidad al comité ante el manejo de fondos.',
    match: /p[oó]liza|garant[ií]a|responsabilidad civil|fiel cumplimiento/i
  },
  {
    key: 'contrato',
    tier: 'habitual',
    weight: 2,
    category: 'otros',
    label: 'Contrato tipo de administración con cláusula de salida',
    hint: 'Modelo de contrato formal con cláusula de término a 30 días sin amarres forzosos para presentar al comité.',
    match: /contrato/i
  }
];

export const TIER_META = {
  legal: { label: '1. Habilitación Legal Exigida por Ley N° 21.442 (RNAC & Minvu)', tone: 'rose', order: 1 },
  habitual: { label: '2. Documentación Habitual Solicitada en Licitaciones', tone: 'amber', order: 2 },
  embudo: { label: '3. Documentos Oficiales del Embudo de Postulación (4 Pasos)', tone: 'emerald', order: 3 },
  diferenciador: { label: '4. Diferenciadores Técnicos & Confianza (Constructor Civil)', tone: 'indigo', order: 4 },
  formal: { label: '5. Calidad Formal, Firma & Membretes Oficiales', tone: 'slate', order: 5 }
};

export const matchRequirementKey = (doc) => {
  if (doc?.requirementKey) return doc.requirementKey;
  const hit = REQUIREMENTS.find((r) => r.match.test(doc?.name || ''));
  return hit ? hit.key : null;
};

export const getDocValidity = (doc, now = new Date()) => {
  const key = matchRequirementKey(doc);
  const req = REQUIREMENTS.find((r) => r.key === key);
  const expiry = parseDate(doc?.expiryDate);
  const issued = parseDate(doc?.issueDate || doc?.date);

  if (expiry) {
    const left = daysBetween(expiry, now);
    if (left < 0) return { state: 'vencido', tone: 'rose', days: left, label: `Vencido hace ${-left} d` };
    if (left <= 30) return { state: 'por_vencer', tone: 'amber', days: left, label: `Vence en ${left} d` };
    return { state: 'vigente', tone: 'emerald', days: left, label: `Vigente (${left} d)` };
  }
  if (req?.freshnessDays) {
    if (!issued) return { state: 'sin_fecha', tone: 'amber', label: 'Falta fecha de emisión' };
    const age = daysBetween(now, issued);
    if (age > req.freshnessDays) {
      return {
        state: 'desactualizado',
        tone: 'amber',
        days: age,
        label: `Emitido hace ${age} d (conviene ≤ ${req.freshnessDays} d)`
      };
    }
    return { state: 'vigente', tone: 'emerald', days: age, label: `Reciente (${age} d)` };
  }
  return { state: 'sin_vencimiento', tone: 'slate', label: 'Sin vencimiento' };
};

const validityIsGood = (v) => ['vigente', 'sin_vencimiento'].includes(v.state);

export const summarizeDocuments = (documents = [], now = new Date()) => {
  const out = { total: documents.length, vigentes: 0, porVencer: 0, vencidos: 0, sinRespaldo: 0 };
  documents.forEach((d) => {
    const v = getDocValidity(d, now);
    if (!hasFile(d)) out.sinRespaldo += 1;
    if (v.state === 'vencido') out.vencidos += 1;
    else if (['por_vencer', 'desactualizado', 'sin_fecha'].includes(v.state)) out.porVencer += 1;
    else out.vigentes += 1;
  });
  return out;
};

/** Valores de ejemplo que no deberían llegar a un cliente */
export const detectPlaceholders = ({ empresaForm = {}, adminPin = '' } = {}) => {
  const list = [];
  const rut = String(empresaForm.companyRut || '').replace(/[.\s]/g, '');
  if (/^76999888/.test(rut)) {
    list.push({
      id: 'companyRut',
      severity: 'critical',
      label: 'RUT de la empresa',
      detail: `"${empresaForm.companyRut}" es un valor de ejemplo y se imprime en el membrete. Cámbialo por el real o déjalo vacío si operas como persona natural.`
    });
  }
  if (adminPin === 'admin123') {
    list.push({
      id: 'adminPin',
      severity: 'security',
      label: 'Clave de administrador por defecto',
      detail: 'La clave sigue siendo "admin123". Cámbiala en Respaldos & Seguridad antes de compartir o presentar el sistema.'
    });
  }
  return list;
};

export const buildProfileLine = (records = []) => {
  const included = records.filter((r) => r.includeInProposal !== false);
  const clean = (t) => String(t || '').replace(/\s*\(.*?\)\s*/g, ' ').trim();
  const titled = included.filter((r) => /titulad|aprobado|certificad|vigente/i.test(r.status || ''));
  const parts = titled.map((r) => clean(r.title)).filter(Boolean);
  return parts.join(' • ');
};

const pointsOf = (status) => (status === 'ok' ? 1 : status === 'warn' ? 0.5 : 0);

/**
 * Cálculo del Checklist Integral & Semáforo de Preparación
 */
export const computeReadiness = ({
  documents = [],
  academicRecords = [],
  references = [],
  hasSignature = false,
  empresaForm = {},
  adminPin = '',
  portfolio = {},
  proposalConfig = {},
  now = new Date()
} = {}) => {
  const items = [];

  // ==========================================
  // 1. REQUISITOS LEGALES & HABITUALES (DOCUMENTOS)
  // ==========================================
  REQUIREMENTS.forEach((req) => {
    const fromDocs = documents.filter((d) => matchRequirementKey(d) === req.key);
    const fromAcademic = req.academicMatch
      ? academicRecords
          .filter((r) => req.academicMatch.test(`${r.title || ''} ${r.category || ''}`))
          .map((r) => ({ ...r, name: r.title, _academic: true }))
      : [];
    const candidates = [...fromDocs, ...fromAcademic];

    const base = {
      key: req.key,
      tier: req.tier,
      weight: req.weight,
      label: req.label,
      hint: req.hint,
      action: 'documents'
    };

    if (!candidates.length) {
      items.push({ ...base, status: 'bad', detail: 'Aún no está registrado en la biblioteca documental.' });
      return;
    }

    const scored = candidates
      .map((d) => ({ d, v: getDocValidity(d, now), file: hasFile(d) }))
      .sort((a, b) => (b.file ? 2 : 0) + (validityIsGood(b.v) ? 1 : 0) - ((a.file ? 2 : 0) + (validityIsGood(a.v) ? 1 : 0)));
    const best = scored[0];

    if (best.v.state === 'vencido') {
      items.push({ ...base, status: 'bad', detail: `${best.v.label}. Sube una versión vigente.` });
    } else if (!best.file) {
      items.push({ ...base, status: 'warn', detail: 'Registrado formalmente, pero falta adjuntar el archivo (PDF o imagen en Bóveda).' });
    } else if (!validityIsGood(best.v)) {
      items.push({ ...base, status: 'warn', detail: best.v.label });
    } else {
      items.push({ ...base, status: 'ok', detail: best.v.label });
    }
  });

  // ==========================================
  // 2. DOCUMENTOS OFICIALES DEL EMBUDO (LOS 4 PASOS)
  // ==========================================
  const targetCondo = (proposalConfig.targetCondo || '').trim();
  const hasTargetCondo = Boolean(targetCondo && targetCondo !== 'Condominio en Evaluación');
  const feeNumber = Number(proposalConfig.proposedMonthlyFee) || 0;
  const hasFee = feeNumber > 0 && !proposalConfig.unknownDetails;

  // Paso 1: Carta de Valor al Comité
  items.push({
    key: 'paso1_carta',
    tier: 'embudo',
    weight: 3,
    action: 'step1',
    label: 'Paso 1 • Carta Formal de Valor al Comité de Administración',
    hint: 'Documento inicial de impacto que aborda los dolores del comité y presenta las credenciales.',
    status: hasTargetCondo ? 'ok' : 'warn',
    detail: hasTargetCondo
      ? `Configurada y personalizada para "${targetCondo}".`
      : 'Falta configurar el nombre del condominio objetivo en el Paso 1.'
  });

  // Paso 2: Dossier Integral de Licitación
  const dossierDocsCount = documents.filter((d) => d.includeInDossier !== false).length;
  const dossierAcademicCount = academicRecords.filter((r) => r.includeInProposal !== false).length;
  const isDossierReady = dossierDocsCount >= 2 && dossierAcademicCount >= 1;
  items.push({
    key: 'paso2_dossier',
    tier: 'embudo',
    weight: 3,
    action: 'step2',
    label: 'Paso 2 • Dossier Maestro de Licitación (6 Páginas)',
    hint: 'Documento ejecutivo completo: portada, presentación, títulos, acreditaciones y referencias.',
    status: isDossierReady ? 'ok' : 'warn',
    detail: isDossierReady
      ? `Compilado con ${dossierDocsCount} acreditaciones legales y ${dossierAcademicCount} diplomas técnicos.`
      : 'Se recomienda tener al menos 2 acreditaciones y 1 título activados para el Dossier.'
  });

  // Paso 3: Propuesta Comercial & Diagnóstico Inicial
  items.push({
    key: 'paso3_propuesta',
    tier: 'embudo',
    weight: 3,
    action: 'step3',
    label: 'Paso 3 • Propuesta Comercial & Diagnóstico Inicial Gratuito',
    hint: 'Oferta económica formal desglosada y el informe técnico constructivo inicial.',
    status: hasFee ? 'ok' : 'warn',
    detail: hasFee
      ? `Honorario formal tasado: $${feeNumber.toLocaleString('es-CL')} / mes.`
      : 'Falta tasar el honorario mensual en la Calculadora o asignarlo en la propuesta.'
  });

  // Paso 4: Brochure de la App Móvil con Demo QR
  items.push({
    key: 'paso4_brochure',
    tier: 'embudo',
    weight: 2,
    action: 'step4',
    label: 'Paso 4 • Brochure de la App Móvil con Código QR Escaneable',
    hint: 'Ficha tecnológica ejecutiva con código QR activo para probar la demo interactiva en el celular.',
    status: 'ok',
    detail: 'Brochure tecnológico listo con código QR y credenciales de prueba en vivo.'
  });

  // ==========================================
  // 3. DIFERENCIADORES TÉCNICOS & CONFIANZA
  // ==========================================
  const titled = academicRecords.filter((r) => /titulad/i.test(r.status || ''));
  const titledWithFile = titled.filter(hasFile);
  items.push({
    key: 'titulo',
    tier: 'diferenciador',
    weight: 3,
    action: 'documents',
    label: 'Título de Constructor Civil / Profesional con respaldo en Bóveda',
    hint: 'La formación en construcción es el diferenciador central de ARANPRO para fiscalizar obras y ahorrar en mantenciones.',
    status: titledWithFile.length ? 'ok' : titled.length ? 'warn' : 'bad',
    detail: titledWithFile.length
      ? `${titledWithFile.length} título(s) con archivo PDF/imagen verificado en Bóveda.`
      : titled.length
        ? 'Hay título registrado, pero falta adjuntar el archivo original escaneado.'
        : 'No hay títulos registrados como "Titulado".'
  });

  const confirmedRefs = references.filter((r) => r.confirmed);
  const pendingRefs = references.length - confirmedRefs.length;
  items.push({
    key: 'referencias',
    tier: 'diferenciador',
    weight: 2,
    action: 'references',
    label: 'Al menos 2 referencias y testimonios de comités autorizados',
    hint: 'Solo se publican en el dossier los testimonios que hayan sido confirmados expresamente.',
    status: confirmedRefs.length >= 2 ? 'ok' : confirmedRefs.length === 1 ? 'warn' : 'bad',
    detail: `${confirmedRefs.length} referencia(s) autorizada(s)${pendingRefs > 0 ? ` • ${pendingRefs} aún pendiente(s)` : ''}.`
  });

  items.push({
    key: 'calculadora_honorarios',
    tier: 'diferenciador',
    weight: 2,
    action: 'calculadora',
    label: 'Tasación Técnica de Honorarios (Modelo Pericial ARANPRO)',
    hint: 'Cálculo de honorarios fundamentado en escala, tipología constructiva, sectores del Art. 6° y equipamiento.',
    status: hasFee ? 'ok' : 'warn',
    detail: hasFee
      ? 'Honorario tasado con la Matriz Pericial de Complejidad ARANPRO.'
      : 'Aún no se ha realizado el cálculo pericial en la Calculadora de Honorarios.'
  });

  const realComms = Number(portfolio.realComms || 0);
  const realUnits = Number(portfolio.realUnits || 0);
  items.push({
    key: 'portafolio',
    tier: 'diferenciador',
    weight: 1,
    action: null,
    label: 'Cifras reales de cartera operativa (comunidades y unidades)',
    hint: 'Métricas de experiencia que respaldan la capacidad de gestión de la empresa.',
    status: realComms > 0 && realUnits > 0 ? 'ok' : 'warn',
    detail: realComms > 0
      ? `${realComms} comunidad(es) • ${realUnits} unidades administradas en el sistema.`
      : 'Sin comunidades operativas registradas en la cartera actual.'
  });

  // ==========================================
  // 4. CALIDAD FORMAL, FIRMA & MEMBRETES
  // ==========================================
  items.push({
    key: 'firma',
    tier: 'formal',
    weight: 2,
    action: 'signature',
    label: 'Firma Digital Manuscrita & Timbre Oficial del Administrador',
    hint: 'Firma que se estampa automáticamente en cartas, contratos, dossier y diagnósticos.',
    status: hasSignature ? 'ok' : 'bad',
    detail: hasSignature ? 'Firma manuscrita y timbre listos en el sistema.' : 'Falta registrar la firma digital en la pestaña Firma Manuscrita.'
  });

  const requiredFields = [
    ['adminName', 'Nombre del Administrador'],
    ['adminRut', 'RUT del Administrador'],
    ['rnacNumber', 'N° Registro RNAC'],
    ['phone', 'Teléfono de contacto'],
    ['email', 'Correo electrónico'],
    ['presentationText', 'Texto de presentación']
  ];
  const missingFields = requiredFields.filter(([k]) => !String(empresaForm[k] || '').trim()).map(([, l]) => l);
  const placeholders = detectPlaceholders({ empresaForm, adminPin }).filter((p) => p.severity === 'critical');
  items.push({
    key: 'perfil',
    tier: 'formal',
    weight: 2,
    action: 'company',
    label: 'Datos de empresa y representante legal completos sin valores de ejemplo',
    hint: 'Información que encabeza los membretes y pies de página de los documentos oficiales.',
    status: missingFields.length ? 'bad' : placeholders.length ? 'warn' : 'ok',
    detail: missingFields.length
      ? `Falta: ${missingFields.join(', ')}.`
      : placeholders.length
        ? placeholders.map((p) => p.label).join(', ') + ' con valor de ejemplo.'
        : 'Datos corporativos completos.'
  });

  // ==========================================
  // PUNTUACIÓN Y EVALUACIÓN FINAL
  // ==========================================
  const totalWeight = items.reduce((a, i) => a + i.weight, 0);
  const earned = items.reduce((a, i) => a + i.weight * pointsOf(i.status), 0);
  const score = Math.round((earned / totalWeight) * 100);

  const blockers = [
    ...items.filter((i) => i.tier === 'legal' && i.status === 'bad').map((i) => ({ id: i.key, label: i.label, detail: i.detail, action: i.action })),
    ...placeholders.map((p) => ({ id: p.id, label: p.label, detail: p.detail, action: 'company' }))
  ];

  const level = blockers.length
    ? { id: 'critico', label: 'Con puntos críticos pendientes', tone: 'rose' }
    : score >= 85
      ? { id: 'listo', label: 'Listo para postular', tone: 'emerald' }
      : score >= 60
        ? { id: 'casi', label: 'Casi listo', tone: 'amber' }
        : { id: 'preparacion', label: 'En preparación', tone: 'slate' };

  return {
    score,
    items,
    blockers,
    level,
    security: detectPlaceholders({ empresaForm, adminPin }).filter((p) => p.severity === 'security')
  };
};
