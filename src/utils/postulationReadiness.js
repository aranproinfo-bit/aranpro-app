/**
 * Lógica pura de "preparación para postular": catálogo de requisitos, vigencia de documentos
 * y puntaje de preparación. Sin dependencias de React para poder probarla aislada.
 *
 * Origen de cada requisito (se muestra al usuario, no se mezcla):
 *  - 'legal'        → lo exige o lo acredita la inscripción RNAC (Ley 21.442, Título sobre administradores)
 *  - 'habitual'     → no lo exige la ley, pero los comités lo piden con frecuencia en licitaciones
 *  - 'diferenciador'→ aumenta las probabilidades de adjudicación
 *  - 'formal'       → calidad/consistencia del propio material
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
  { id: 'habilitante', label: 'Habilitación legal (RNAC)' },
  { id: 'identidad', label: 'Identidad y antecedentes' },
  { id: 'formacion', label: 'Formación y capacitación' },
  { id: 'tributario', label: 'Tributario y comercial' },
  { id: 'garantias', label: 'Seguros y garantías' },
  { id: 'gremial', label: 'Acreditaciones gremiales' },
  { id: 'otros', label: 'Otros respaldos' }
];

// Categorías antiguas (texto libre) → categorías nuevas
const LEGACY_CATEGORY_MAP = [
  [/minvu|rnac|ley 21/i, 'habilitante'],
  [/registro civil|antecedente|identidad/i, 'identidad'],
  [/t[ií]tulo|formaci[oó]n|curso|capacitaci/i, 'formacion'],
  [/sii|tributari|comercial/i, 'tributario'],
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
    hint: 'Ficha o certificado de inscripción descargado del Registro Nacional de Administradores. Los comités están obligados a verificar que figure vigente.',
    freshnessDays: 60,
    match: /rnac|registro nacional/i
  },
  {
    key: 'antecedentes',
    tier: 'legal',
    weight: 3,
    category: 'identidad',
    label: 'Certificado de antecedentes para fines especiales',
    hint: 'Respalda no estar inhabilitado para administrar (condenas por delitos de los Títulos VIII y IX del Libro II del Código Penal).',
    freshnessDays: 60,
    match: /antecedentes/i
  },
  {
    key: 'capacitacion',
    tier: 'legal',
    weight: 3,
    category: 'formacion',
    label: 'Curso de capacitación en administración de condominios aprobado',
    hint: 'Certificado del OTEC que acredita la capacitación requerida para inscribirse a título oneroso.',
    match: /capacitaci|curso.*(administraci|copropiedad|21\.?442)/i,
    academicMatch: /capacitaci|administraci[oó]n de copropiedad|ley 21\.?442/i
  },
  {
    key: 'cedula',
    tier: 'habitual',
    weight: 2,
    category: 'identidad',
    label: 'Cédula de identidad (ambos lados)',
    hint: 'Se solicita para identificar al administrador o representante legal en el contrato.',
    match: /c[eé]dula|carnet/i
  },
  {
    key: 'sii',
    tier: 'habitual',
    weight: 2,
    category: 'tributario',
    label: 'Inicio de actividades / situación tributaria (SII)',
    hint: 'Los comités lo piden para saber si se emitirán boletas de honorarios o facturas.',
    match: /\bsii\b|inicio de actividades|giro|tributari/i
  },
  {
    key: 'garantia',
    tier: 'habitual',
    weight: 2,
    category: 'garantias',
    label: 'Póliza de garantía / fiel cumplimiento o seguro de responsabilidad civil',
    hint: 'La asamblea o el comité pueden exigir una caución en el contrato; tenerla lista acelera la adjudicación.',
    match: /p[oó]liza|garant[ií]a|responsabilidad civil|fiel cumplimiento/i
  },
  {
    key: 'contrato',
    tier: 'habitual',
    weight: 2,
    category: 'otros',
    label: 'Contrato tipo de administración',
    hint: 'Modelo de contrato listo para que el comité lo revise junto con la propuesta.',
    match: /contrato/i
  },
  {
    key: 'honorarios',
    tier: 'habitual',
    weight: 2,
    category: 'otros',
    label: 'Propuesta económica / tabla de honorarios',
    hint: 'Una propuesta de valores clara evita rondas de consultas y demuestra preparación.',
    match: /honorario|propuesta econ|tarifa/i
  }
];

export const TIER_META = {
  legal: { label: 'Exigido por ley', tone: 'rose', order: 1 },
  habitual: { label: 'Lo piden los comités', tone: 'amber', order: 2 },
  diferenciador: { label: 'Te diferencia', tone: 'emerald', order: 3 },
  formal: { label: 'Calidad del material', tone: 'slate', order: 4 }
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

/** Valores de ejemplo / inseguros que no deberían llegar a un documento enviado a terceros. */
export const detectPlaceholders = ({ empresaForm = {}, adminPin = '' } = {}) => {
  const list = [];
  const rut = String(empresaForm.companyRut || '').replace(/[.\s]/g, '');
  if (/^76999888/.test(rut)) {
    list.push({
      id: 'companyRut',
      severity: 'critical',
      label: 'RUT de la empresa',
      detail: `"${empresaForm.companyRut}" parece un valor de ejemplo y se imprime en el membrete del dossier. Reemplázalo por el real (o déjalo vacío si actúas como persona natural).`
    });
  }
  if (adminPin === 'admin123') {
    list.push({
      id: 'adminPin',
      severity: 'security',
      label: 'Clave de administrador por defecto',
      detail: 'La clave sigue siendo "admin123". Cámbiala en Respaldos & Seguridad antes de vender o compartir el sistema.'
    });
  }
  return list;
};

/** "Constructor Civil" derivado de los registros reales. */
export const buildProfileLine = (records = []) => {
  const included = records.filter((r) => r.includeInProposal !== false);
  const clean = (t) => String(t || '').replace(/\s*\(.*?\)\s*/g, ' ').trim();
  const titled = included.filter((r) => /titulad/i.test(r.status || ''));
  const inProgress = included.filter((r) => /en curso/i.test(r.status || ''));
  const parts = [
    ...titled.map((r) => clean(r.title)),
    ...inProgress.map((r) => `Estudiante de ${clean(r.title)}`)
  ].filter(Boolean);
  return parts.join(' • ');
};

const pointsOf = (status) => (status === 'ok' ? 1 : status === 'warn' ? 0.5 : 0);

export const computeReadiness = ({
  documents = [],
  academicRecords = [],
  references = [],
  hasSignature = false,
  empresaForm = {},
  adminPin = '',
  portfolio = {},
  now = new Date()
} = {}) => {
  const items = [];

  // 1) Requisitos documentales (biblioteca + diplomas)
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
      items.push({ ...base, status: 'warn', detail: 'Está registrado, pero falta adjuntar el archivo (PDF o imagen).' });
    } else if (!validityIsGood(best.v)) {
      items.push({ ...base, status: 'warn', detail: best.v.label });
    } else {
      items.push({ ...base, status: 'ok', detail: best.v.label });
    }
  });

  // 2) Diferenciadores
  const titled = academicRecords.filter((r) => /titulad/i.test(r.status || ''));
  const titledWithFile = titled.filter(hasFile);
  items.push({
    key: 'titulo',
    tier: 'diferenciador',
    weight: 2,
    action: 'documents',
    label: 'Título técnico o profesional con respaldo',
    hint: 'Tu formación en construcción es el diferenciador central del dossier; debe estar respaldada por el archivo.',
    status: titledWithFile.length ? 'ok' : titled.length ? 'warn' : 'bad',
    detail: titledWithFile.length
      ? `${titledWithFile.length} título(s) con archivo adjunto.`
      : titled.length
        ? 'Hay título registrado, pero sin archivo adjunto.'
        : 'No hay ningún título registrado como "Titulado".'
  });

  const confirmedRefs = references.filter((r) => r.confirmed);
  const pendingRefs = references.length - confirmedRefs.length;
  items.push({
    key: 'referencias',
    tier: 'diferenciador',
    weight: 2,
    action: 'references',
    label: 'Al menos 2 referencias autorizadas por el firmante',
    hint: 'Solo se publican en el dossier los testimonios que la persona haya autorizado expresamente.',
    status: confirmedRefs.length >= 2 ? 'ok' : confirmedRefs.length === 1 ? 'warn' : 'bad',
    detail: `${confirmedRefs.length} autorizada(s)${pendingRefs > 0 ? ` • ${pendingRefs} aún sin autorización (no se imprimen)` : ''}.`
  });

  const realComms = Number(portfolio.realComms || 0);
  const realUnits = Number(portfolio.realUnits || 0);
  items.push({
    key: 'portafolio',
    tier: 'diferenciador',
    weight: 1,
    action: null,
    label: 'Cifras reales de cartera (comunidades y unidades)',
    hint: 'El dossier imprime estas cifras; deben salir del sistema, nunca de valores de relleno.',
    status: realComms > 0 && realUnits > 0 ? 'ok' : 'warn',
    detail: realComms > 0 ? `${realComms} comunidad(es) • ${realUnits} unidades en el sistema.` : 'Aún no hay comunidades con unidades cargadas.'
  });

  // 3) Calidad del material
  items.push({
    key: 'firma',
    tier: 'formal',
    weight: 1,
    action: 'signature',
    label: 'Firma digital cargada',
    hint: 'Se estampa en la carta, el dossier y el informe técnico.',
    status: hasSignature ? 'ok' : 'bad',
    detail: hasSignature ? 'Firma lista.' : 'Dibuja o sube tu firma en la pestaña "Firma Digital".'
  });

  const requiredFields = [
    ['adminName', 'nombre del administrador'],
    ['adminRut', 'RUT del administrador'],
    ['rnacNumber', 'N° RNAC'],
    ['phone', 'teléfono'],
    ['email', 'correo'],
    ['presentationText', 'texto de presentación']
  ];
  const missingFields = requiredFields.filter(([k]) => !String(empresaForm[k] || '').trim()).map(([, l]) => l);
  const placeholders = detectPlaceholders({ empresaForm, adminPin }).filter((p) => p.severity === 'critical');
  items.push({
    key: 'perfil',
    tier: 'formal',
    weight: 2,
    action: 'company',
    label: 'Datos de empresa y administrador completos y sin valores de ejemplo',
    hint: 'Estos datos forman el membrete y la firma de todo el material.',
    status: missingFields.length ? 'bad' : placeholders.length ? 'warn' : 'ok',
    detail: missingFields.length
      ? `Falta: ${missingFields.join(', ')}.`
      : placeholders.length
        ? placeholders.map((p) => p.label).join(', ') + ' con valor de ejemplo.'
        : 'Datos completos.'
  });

  const totalWeight = items.reduce((a, i) => a + i.weight, 0);
  const earned = items.reduce((a, i) => a + i.weight * pointsOf(i.status), 0);
  const score = Math.round((earned / totalWeight) * 100);

  const blockers = [
    ...items.filter((i) => i.tier === 'legal' && i.status === 'bad').map((i) => ({ id: i.key, label: i.label, detail: i.detail, action: i.action })),
    ...placeholders.map((p) => ({ id: p.id, label: p.label, detail: p.detail, action: 'company' }))
  ];

  const level = blockers.length
    ? { id: 'critico', label: 'Con puntos críticos', tone: 'rose' }
    : score >= 85
      ? { id: 'listo', label: 'Listo para postular', tone: 'emerald' }
      : score >= 60
        ? { id: 'casi', label: 'Casi listo', tone: 'amber' }
        : { id: 'preparacion', label: 'En preparación', tone: 'slate' };

  return { score, items, blockers, level, security: detectPlaceholders({ empresaForm, adminPin }).filter((p) => p.severity === 'security') };
};
