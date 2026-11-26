import React, { useEffect, useMemo, useState } from 'react';
import {
  Search, ExternalLink, Download, Upload, Trash2, Scale, BookOpen,
  FileText, X, ShieldCheck, Eye, CheckCircle2
} from 'lucide-react';

/**
 * Biblioteca Legal del Administrador.
 * Herramienta de consulta interna (no pertenece a ninguna comunidad). No genera ni modifica documentos PDF
 * de la plataforma: solo cataloga normas, enlaza a su fuente oficial (BCN LeyChile) y entrega acceso directo
 * a los PDF oficiales incluidos en la app o adjuntados por el administrador.
 */

const bcnLey = (n) => `https://www.bcn.cl/leychile/navegar?idLey=${n}`;
const BCN_HOME = 'https://www.bcn.cl/leychile/';
const bundledUrl = (file) => `${(import.meta.env.BASE_URL || '/').replace(/\/?$/, '/')}leyes/${file}`;

export const LEGAL_CATEGORIES = [
  { id: 'copropiedad', label: 'Copropiedad' },
  { id: 'laboral', label: 'Laboral y personal' },
  { id: 'convivencia', label: 'Convivencia y mascotas' },
  { id: 'seguridad', label: 'Seguridad y guardias' },
  { id: 'sanitario', label: 'Aseo, higiene y medio ambiente' },
  { id: 'datos', label: 'Datos y consumidores' }
];

// Catálogo base. Se pueden agregar nuevas normas o PDF oficiales editando solo esta lista.
export const LEGAL_CATALOG = [
  {
    id: 'ley-21442',
    cat: 'copropiedad',
    number: 'Ley 21.442',
    title: 'Nueva Ley de Copropiedad Inmobiliaria',
    summary: 'Régimen de copropiedad, administrador, comité, asambleas, gastos comunes, multas y morosidad.',
    keywords: 'copropiedad asamblea comité administrador gastos comunes multas morosidad quórum reglamento',
    url: bcnLey(21442),
    bundledPdf: { file: 'ley-21442-copropiedad.pdf', fileName: 'Ley-21442-Copropiedad-Inmobiliaria.pdf', size: 581455 }
  },
  {
    id: 'ds-7-2025',
    cat: 'copropiedad',
    number: 'DS 7 MINVU (2025)',
    title: 'Reglamento de la Ley 21.442',
    summary: 'Reglamento que detalla la aplicación de la Ley de Copropiedad (registro de administradores, procedimientos).',
    keywords: 'reglamento registro nacional administradores rnac minvu procedimientos',
    url: BCN_HOME,
    note: 'Buscar "Decreto 7 Vivienda y Urbanismo 2025" en LeyChile para verificar actualizaciones.',
    bundledPdf: { file: 'ds-7-reglamento-ley-21442.pdf', fileName: 'Reglamento-Ley-21442-DS7.pdf', size: 456676 }
  },
  {
    id: 'ley-20296',
    cat: 'copropiedad',
    number: 'Ley 20.296',
    title: 'Instalación, mantención e inspección periódica de ascensores',
    summary: 'Obligaciones de mantención, certificación periódica y registro MINVU para ascensores, montacargas y escaleras mecánicas en edificios.',
    keywords: 'ascensores mantención certificación transporte vertical montacargas escaleras mecánicas minvu dom multas',
    url: 'https://bcn.cl/37bsf',
    bundledPdf: { file: 'ley-20296-ascensores.pdf', fileName: 'Ley-20296-Ascensores.pdf', size: 51139 }
  },
  {
    id: 'ley-19537',
    cat: 'copropiedad',
    number: 'Ley 19.537',
    title: 'Ley de Copropiedad Inmobiliaria anterior (derogada)',
    summary: 'Texto histórico derogado por la Ley 21.442. Útil para reglamentos antiguos y consultas de transición.',
    keywords: 'derogada histórica copropiedad antigua transición reglamento',
    url: bcnLey(19537)
  },
  {
    id: 'ley-19496',
    cat: 'datos',
    number: 'Ley 19.496',
    title: 'Protección de los Derechos de los Consumidores',
    summary: 'Relevante para contratos con proveedores y servicios contratados por la comunidad.',
    keywords: 'consumidor sernac contratos proveedores',
    url: bcnLey(19496)
  },
  {
    id: 'ley-21719',
    cat: 'datos',
    number: 'Ley 21.719',
    title: 'Protección y Tratamiento de Datos Personales',
    summary: 'Obligaciones sobre datos de residentes, cámaras, registros y libros de visitas.',
    keywords: 'datos personales privacidad cámaras visitas residentes registro',
    url: bcnLey(21719)
  },
  {
    id: 'ley-19628',
    cat: 'datos',
    number: 'Ley 19.628',
    title: 'Protección de la Vida Privada',
    summary: 'Norma anterior sobre datos personales, en transición hacia la Ley 21.719.',
    keywords: 'vida privada datos personales',
    url: bcnLey(19628)
  },
  {
    id: 'ct',
    cat: 'laboral',
    number: 'DFL 1 (2002)',
    title: 'Código del Trabajo',
    summary: 'Contratos, jornada, turnos, descansos, remuneraciones, feriados, término de contrato y finiquitos.',
    keywords: 'contrato trabajo jornada turnos horas extra descanso feriado vacaciones finiquito despido remuneraciones conserje',
    url: 'https://www.bcn.cl/leychile/navegar?idNorma=207436',
    note: 'PDF oficial publicado por la Dirección del Trabajo (DT).',
    bundledPdf: { file: 'codigo-del-trabajo-dt.pdf', fileName: 'Codigo-del-Trabajo-DT.pdf', size: 3901026 }
  },
  {
    id: 'ley-21643',
    cat: 'laboral',
    number: 'Ley 21.643 (Ley Karin)',
    title: 'Prevención del acoso laboral, sexual y violencia en el trabajo',
    summary: 'Protocolos de prevención, denuncia e investigación. Obligación de protocolo en el lugar de trabajo.',
    keywords: 'ley karin acoso laboral sexual violencia protocolo denuncia investigación',
    url: bcnLey(21643),
    bundledPdf: { file: 'ley-21643-karin.pdf', fileName: 'Ley-21643-Ley-Karin.pdf', size: 117358 }
  },
  {
    id: 'ley-21561',
    cat: 'laboral',
    number: 'Ley 21.561',
    title: 'Reducción de la jornada laboral a 40 horas',
    summary: 'Gradualidad de la jornada semanal, turnos y distribución de horas.',
    keywords: '40 horas jornada turnos semana reducción gradualidad',
    url: bcnLey(21561),
    bundledPdf: { file: 'ley-21561-40-horas.pdf', fileName: 'Ley-21561-40-Horas.pdf', size: 108885 }
  },
  {
    id: 'ley-16744',
    cat: 'laboral',
    number: 'Ley 16.744',
    title: 'Accidentes del Trabajo y Enfermedades Profesionales',
    summary: 'Seguro obligatorio, mutualidad, prevención de riesgos y reglamento interno.',
    keywords: 'accidentes trabajo mutual seguro riesgos enfermedad profesional prevención',
    url: bcnLey(16744)
  },
  {
    id: 'ley-19631',
    cat: 'laboral',
    number: 'Ley 19.631 (Ley Bustos)',
    title: 'Nulidad del despido por cotizaciones impagas',
    summary: 'Obliga a tener cotizaciones previsionales al día para que el despido produzca efectos.',
    keywords: 'bustos nulidad despido cotizaciones previred finiquito',
    url: bcnLey(19631)
  },
  {
    id: 'ley-20123',
    cat: 'laboral',
    number: 'Ley 20.123',
    title: 'Subcontratación y servicios transitorios',
    summary: 'Responsabilidad solidaria o subsidiaria al contratar empresas de aseo, guardias o mantención.',
    keywords: 'subcontratación empresas externas aseo guardias solidaria subsidiaria contratistas',
    url: bcnLey(20123)
  },
  {
    id: 'ley-17322',
    cat: 'laboral',
    number: 'Ley 17.322',
    title: 'Cobranza judicial de cotizaciones previsionales',
    summary: 'Procedimiento por cotizaciones adeudadas.',
    keywords: 'cotizaciones cobranza previsional deuda',
    url: bcnLey(17322)
  },
  {
    id: 'ley-21220',
    cat: 'laboral',
    number: 'Ley 21.220',
    title: 'Trabajo a distancia y teletrabajo',
    summary: 'Condiciones del trabajo a distancia, útil para personal administrativo.',
    keywords: 'teletrabajo distancia remoto',
    url: bcnLey(21220)
  },
  {
    id: 'ley-21020',
    cat: 'convivencia',
    number: 'Ley 21.020',
    title: 'Tenencia Responsable de Mascotas y Animales de Compañía',
    summary: 'Obligaciones de los dueños, animales potencialmente peligrosos y sanciones.',
    keywords: 'mascotas perros gatos animales ladridos tenencia responsable peligrosos',
    url: bcnLey(21020)
  },
  {
    id: 'ley-20422',
    cat: 'convivencia',
    number: 'Ley 20.422',
    title: 'Igualdad de oportunidades e inclusión de personas con discapacidad',
    summary: 'Accesibilidad en espacios comunes.',
    keywords: 'discapacidad accesibilidad rampas inclusión',
    url: bcnLey(20422)
  },
  {
    id: 'ds-38-2011',
    cat: 'convivencia',
    number: 'DS 38 MMA (2011)',
    title: 'Norma de emisión de ruidos',
    summary: 'Límites de ruido para actividades y fuentes fijas. Útil en reclamos por ruidos molestos.',
    keywords: 'ruido ruidos molestos decibeles fiesta convivencia',
    url: BCN_HOME,
    note: 'Buscar "Decreto 38 Medio Ambiente 2011" en LeyChile.'
  },
  {
    id: 'ley-21659',
    cat: 'seguridad',
    number: 'Ley 21.659',
    title: 'Ley de Seguridad Privada',
    summary: 'Regula guardias, vigilantes, conserjes con funciones de seguridad y empresas del rubro.',
    keywords: 'seguridad privada guardias vigilantes os-10 conserje portería',
    url: bcnLey(21659)
  },
  {
    id: 'ds-594',
    cat: 'sanitario',
    number: 'DS 594 MINSAL (1999)',
    title: 'Condiciones sanitarias y ambientales básicas en lugares de trabajo',
    summary: 'Higiene, baños, comedores y ambiente laboral del personal de la comunidad.',
    keywords: 'aseo higiene baños comedor lugar de trabajo sanitario personal',
    url: BCN_HOME,
    note: 'Buscar "Decreto 594 Salud 1999" en LeyChile.'
  },
  {
    id: 'ley-20920',
    cat: 'sanitario',
    number: 'Ley 20.920',
    title: 'Gestión de Residuos y Responsabilidad Extendida del Productor',
    summary: 'Reciclaje y gestión de residuos en comunidades.',
    keywords: 'residuos reciclaje basura aseo rep',
    url: bcnLey(20920)
  }
];

// ---- Almacenamiento local de PDF oficiales adjuntados por el administrador (IndexedDB) ----
const DB_NAME = 'aranpro_legal_library';
const STORE = 'pdfs';

const openDb = () => new Promise((resolve, reject) => {
  const req = indexedDB.open(DB_NAME, 1);
  req.onupgradeneeded = () => req.result.createObjectStore(STORE);
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});
const dbOp = async (mode, fn) => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const result = fn(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(result && result.result !== undefined ? result.result : undefined);
    tx.onerror = () => reject(tx.error);
  });
};
const listAttached = async () => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const out = {};
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).openCursor();
    req.onsuccess = () => {
      const c = req.result;
      if (c) { out[c.key] = { name: c.value.name, size: c.value.size, savedAt: c.value.savedAt }; c.continue(); } else resolve(out);
    };
    req.onerror = () => reject(req.error);
  });
};

const normalize = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const fmtSize = (b) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

export const LegalLibraryModule = ({ showAlert }) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('todas');
  const [onlyWithPdf, setOnlyWithPdf] = useState(false);
  const [attached, setAttached] = useState({});
  const [error, setError] = useState('');

  const refresh = () => listAttached().then(setAttached).catch(() => setError('Tu navegador no permite guardar archivos locales; igual podrás usar los PDF incluidos y los enlaces oficiales.'));
  useEffect(() => { refresh(); }, []);

  const totalWithPdf = useMemo(
    () => LEGAL_CATALOG.filter((law) => Boolean(law.bundledPdf || attached[law.id])).length,
    [attached]
  );

  const results = useMemo(() => {
    const terms = normalize(query).split(/\s+/).filter(Boolean);
    return LEGAL_CATALOG.filter((law) => {
      if (category !== 'todas' && law.cat !== category) return false;
      if (onlyWithPdf && !law.bundledPdf && !attached[law.id]) return false;
      if (!terms.length) return true;
      const hay = normalize(`${law.number} ${law.title} ${law.summary} ${law.keywords}`);
      return terms.every((t) => hay.includes(t));
    });
  }, [query, category, onlyWithPdf, attached]);

  const attach = async (law, file) => {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      showAlert?.('Archivo no válido', 'Adjunta el PDF oficial de la norma.', 'error');
      return;
    }
    try {
      await dbOp('readwrite', (s) => s.put({ name: file.name, size: file.size, savedAt: new Date().toISOString(), blob: file }, law.id));
      await refresh();
      showAlert?.('PDF guardado', `${law.number} quedó disponible para ver y descargar.`, 'success');
    } catch {
      showAlert?.('No se pudo guardar', 'El almacenamiento local del navegador rechazó el archivo.', 'error');
    }
  };

  const openAttached = async (law, asDownload) => {
    const db = await openDb();
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(law.id);
    req.onsuccess = () => {
      const rec = req.result;
      if (!rec) return;
      const url = URL.createObjectURL(rec.blob);
      if (asDownload) {
        const a = document.createElement('a');
        a.href = url;
        a.download = rec.name || `${law.id}.pdf`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      }
    };
  };

  const remove = async (law) => {
    await dbOp('readwrite', (s) => s.delete(law.id));
    refresh();
  };

  return (
    <div className="space-y-5">
      <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0F3D2E] text-[#D4B895] flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Biblioteca Legal del Administrador</h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                Consulta rápida de las normas que rigen la copropiedad, ascensores, personal, turnos, guardias, aseo, Ley Karin y mascotas.
                Es una ayuda interna del administrador: no forma parte de ninguna comunidad. Abre o descarga los PDF oficiales incluidos, o adjunta
                nuevas versiones cuando se actualicen.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" /> {totalWithPdf} de {LEGAL_CATALOG.length} con PDF listo
          </span>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por tema o número: guardias, ley karin, ascensores, mascotas, turnos, 21.442, ruidos…"
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl border border-slate-300 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]/30"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer" aria-label="Limpiar búsqueda">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {[{ id: 'todas', label: 'Todas' }, ...LEGAL_CATEGORIES].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${category === c.id ? 'bg-[#0F3D2E] text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setOnlyWithPdf((v) => !v)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
              onlyWithPdf
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white hover:bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Solo con PDF disponible
          </button>
        </div>
        {error && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">{error}</p>}
      </div>

      <p className="text-[11px] text-slate-500 px-1">
        {results.length} {results.length === 1 ? 'norma encontrada' : 'normas encontradas'}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {results.map((law) => {
          const localFile = attached[law.id];
          const bundled = law.bundledPdf;
          const cat = LEGAL_CATEGORIES.find((c) => c.id === law.cat);
          const bundledHref = bundled ? bundledUrl(bundled.file) : null;

          return (
            <div key={law.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2.5 flex flex-col">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#0F3D2E] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">{law.number}</span>
                  <span className="text-[10px] font-bold text-slate-500">{cat?.label}</span>
                </div>
                {localFile ? (
                  <span className="text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
                    PDF adjunto ({fmtSize(localFile.size)})
                  </span>
                ) : bundled ? (
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    PDF oficial incluido ({fmtSize(bundled.size)})
                  </span>
                ) : null}
              </div>

              <h4 className="text-sm font-black text-slate-900 leading-snug flex items-start gap-1.5">
                <BookOpen className="w-4 h-4 text-[#0F3D2E] shrink-0 mt-0.5" /> {law.title}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed flex-1">{law.summary}</p>
              {law.note && <p className="text-[11px] text-slate-500 italic">{law.note}</p>}

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {localFile ? (
                  <>
                    <button type="button" onClick={() => openAttached(law, false)} className="px-3 py-1.5 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                      <Eye className="w-3.5 h-3.5 text-[#D4B895]" /> Ver PDF
                    </button>
                    <button type="button" onClick={() => openAttached(law, true)} className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                      <Download className="w-3.5 h-3.5" /> Descargar
                    </button>
                    <button type="button" onClick={() => remove(law)} className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1 cursor-pointer" title={bundled ? 'Volver al PDF incluido' : 'Quitar PDF guardado'}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : bundled ? (
                  <>
                    <a href={bundledHref} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white text-xs font-bold flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-[#D4B895]" /> Ver PDF
                    </a>
                    <a href={bundledHref} download={bundled.fileName} className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5">
                      <Download className="w-3.5 h-3.5" /> Descargar
                    </a>
                    <label className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer" title="Reemplazar por una versión más nueva en este navegador">
                      <Upload className="w-3.5 h-3.5 text-[#0F3D2E]" />
                      <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => { attach(law, e.target.files?.[0]); e.target.value = ''; }} />
                    </label>
                  </>
                ) : (
                  <label className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-[#0F3D2E]" /> Adjuntar PDF oficial
                    <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => { attach(law, e.target.files?.[0]); e.target.value = ''; }} />
                  </label>
                )}

                <a href={law.url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-[#0F3D2E]" /> LeyChile
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {results.length === 0 && (
        <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-300 text-center space-y-2">
          <FileText className="w-6 h-6 text-slate-400 mx-auto" />
          <p className="text-sm font-bold text-slate-700">No hay normas que coincidan con tu búsqueda.</p>
          <p className="text-xs text-slate-500">Búscala en <a className="underline text-[#0F3D2E]" href={BCN_HOME} target="_blank" rel="noopener noreferrer">BCN LeyChile</a> y pídeme que la agregue al catálogo.</p>
        </div>
      )}

      <p className="text-[11px] text-slate-500 flex items-start gap-1.5 px-1">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        Verifica siempre la vigencia en la fuente oficial: las leyes se modifican con frecuencia. Los PDF incluidos están disponibles para todos los equipos; los que adjuntes manualmente se guardan solo en este navegador.
      </p>
    </div>
  );
};
