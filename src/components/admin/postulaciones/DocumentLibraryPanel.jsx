import React, { useMemo, useRef, useState } from 'react';
import {
  Plus, Eye, Download, Trash2, PenTool, Paperclip, X, Upload, FileCheck,
  CheckCircle2, AlertTriangle, Clock, FolderOpen
} from 'lucide-react';
import {
  DOC_CATEGORIES, REQUIREMENTS, TIER_META, getDocValidity, hasFile,
  matchRequirementKey, normalizeCategory, summarizeDocuments
} from '../../../utils/postulationReadiness';
import {
  downloadDataUrl, formatFileSize, openDataUrlInNewTab, readFileAsDataUrl
} from '../../../utils/fileVault';
import { formatDate } from '../../../utils/formatters';

const TONE = {
  emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  amber: 'bg-amber-50 text-amber-800 border-amber-200',
  rose: 'bg-rose-50 text-rose-800 border-rose-200',
  slate: 'bg-slate-100 text-slate-600 border-slate-200'
};

const MAX_FILE_BYTES = 10 * 1024 * 1024;

const emptyForm = {
  name: '',
  category: 'otros',
  requirementKey: '',
  issuer: '',
  issueDate: '',
  expiryDate: '',
  notes: '',
  includeInDossier: true,
  fileName: '',
  fileType: '',
  fileData: null,
  fileSize: ''
};

const extensionOf = (doc) => {
  const fromName = (doc.fileName || '').split('.').pop();
  if (fromName && fromName.length <= 5 && fromName !== doc.fileName) return fromName.toLowerCase();
  return /pdf/i.test(doc.fileType || '') ? 'pdf' : 'jpg';
};

export const DocumentLibraryPanel = ({ documents, setDocuments, showAlert, showConfirm }) => {
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const fileInputRef = useRef(null);

  const now = new Date();
  const summary = useMemo(() => summarizeDocuments(documents || []), [documents]);

  const grouped = useMemo(() => {
    const map = new Map(DOC_CATEGORIES.map((c) => [c.id, []]));
    (documents || []).forEach((d) => {
      const cat = normalizeCategory(d.category);
      if (!map.has(cat)) {
        map.set(cat, []);
      }
      map.get(cat).push(d);
    });
    return DOC_CATEGORIES.map((c) => ({ ...c, docs: map.get(c.id) || [] })).filter((g) => g.docs.length > 0);
  }, [documents]);

  const openNew = (requirementKey = '') => {
    const req = REQUIREMENTS.find((r) => r.key === requirementKey);
    setEditingId(null);
    setForm({
      ...emptyForm,
      requirementKey,
      name: req ? req.label : '',
      category: req ? req.category : 'otros'
    });
    setShowForm(true);
  };

  const openEdit = (doc) => {
    setEditingId(doc.id);
    setForm({
      name: doc.name || '',
      category: normalizeCategory(doc.category),
      requirementKey: doc.requirementKey || matchRequirementKey(doc) || '',
      issuer: doc.issuer || '',
      issueDate: doc.issueDate || doc.date || '',
      expiryDate: doc.expiryDate || '',
      notes: doc.notes || '',
      includeInDossier: doc.includeInDossier !== false,
      fileName: doc.fileName || '',
      fileType: doc.fileType || '',
      fileData: doc.fileData || null,
      fileSize: doc.fileSize || ''
    });
    setShowForm(true);
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      showAlert('Archivo demasiado grande', 'El archivo no debe superar los 10 MB. Comprime el PDF o reduce la resolución de la imagen.', 'warning');
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setForm((prev) => ({
        ...prev,
        fileName: file.name,
        fileType: file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
        fileData: dataUrl,
        fileSize: formatFileSize(file.size)
      }));
    } catch {
      showAlert('No se pudo leer el archivo', 'Intenta nuevamente con otro archivo.', 'warning');
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showAlert('Falta el nombre', 'Indica el nombre del documento.', 'warning');
      return;
    }
    const payload = {
      name: form.name.trim(),
      category: form.category,
      requirementKey: form.requirementKey || undefined,
      issuer: form.issuer.trim(),
      issueDate: form.issueDate,
      expiryDate: form.expiryDate,
      notes: form.notes.trim(),
      includeInDossier: form.includeInDossier,
      fileName: form.fileName,
      fileType: form.fileType,
      fileData: form.fileData,
      fileSize: form.fileSize
    };

    if (editingId) {
      setDocuments((prev) => prev.map((d) => (d.id === editingId ? { ...d, ...payload } : d)));
    } else {
      setDocuments((prev) => [
        { id: `doc-${Date.now()}`, uploadedAt: new Date().toISOString().slice(0, 10), ...payload },
        ...prev
      ]);
    }
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleDelete = (doc) => {
    showConfirm({
      title: '¿Eliminar documento?',
      message: `Se eliminará "${doc.name}" de la biblioteca y también su archivo adjunto. Esta acción no se puede deshacer.`,
      type: 'danger',
      confirmText: 'Sí, eliminar',
      cancelText: 'Conservar',
      onConfirm: () => setDocuments((prev) => prev.filter((d) => d.id !== doc.id))
    });
  };

  const toggleDossier = (id) =>
    setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, includeInDossier: d.includeInDossier === false } : d)));

  const missingRequirements = REQUIREMENTS.filter(
    (r) => !documents.some((d) => matchRequirementKey(d) === r.key)
  );

  return (
    <div className="space-y-5">
      {/* Cabecera con resumen */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1">
          {[
            { label: 'Vigentes', value: summary.vigentes, icon: CheckCircle2, cls: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
            { label: 'Por vencer / desactualizados', value: summary.porVencer, icon: Clock, cls: 'text-amber-700 bg-amber-50 border-amber-200' },
            { label: 'Vencidos', value: summary.vencidos, icon: AlertTriangle, cls: 'text-rose-700 bg-rose-50 border-rose-200' },
            { label: 'Sin archivo adjunto', value: summary.sinRespaldo, icon: Paperclip, cls: 'text-slate-700 bg-slate-50 border-slate-200' }
          ].map((s) => (
            <div key={s.label} className={`px-3 py-2 rounded-2xl border ${s.cls} flex items-center gap-2`}>
              <s.icon className="w-4 h-4 shrink-0" />
              <div className="leading-tight">
                <div className="text-lg font-black">{s.value}</div>
                <div className="text-[10px] font-bold uppercase tracking-wide opacity-80">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => openNew('')}
          className="px-4 py-2.5 rounded-2xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs shadow-md flex items-center gap-2 shrink-0 self-start lg:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#D4B895]" />
          Agregar documento
        </button>
      </div>

      {/* Requisitos aún no cubiertos */}
      {missingRequirements.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
          <div className="text-xs font-black text-amber-900 flex items-center gap-1.5">
            <FolderOpen className="w-4 h-4" />
            Documentos que los comités suelen pedir y aún no registras ({missingRequirements.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {missingRequirements.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => openNew(r.key)}
                title={r.hint}
                className="px-2.5 py-1 rounded-xl bg-white border border-amber-300 text-[11px] font-bold text-amber-900 hover:bg-amber-100 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                {r.label}
                <span className="text-[9px] font-black uppercase px-1 rounded bg-amber-100 text-amber-800">{TIER_META[r.tier]?.label || 'Requisito'}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Documentos agrupados por categoría */}
      {grouped.length === 0 && (
        <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-300 rounded-2xl">
          La biblioteca está vacía. Agrega tu primer documento.
        </div>
      )}

      {grouped.map((group) => (
        <div key={group.id} className="space-y-2">
          <h5 className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <FileCheck className="w-3.5 h-3.5 text-[#0F3D2E]" />
            {group.label} <span className="text-slate-400">({group.docs.length})</span>
          </h5>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {group.docs.map((doc) => {
              const v = getDocValidity(doc, now);
              const file = hasFile(doc);
              const reqKey = matchRequirementKey(doc);
              const req = REQUIREMENTS.find((r) => r.key === reqKey);
              return (
                <div key={doc.id} className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-[#D4B895] transition-colors space-y-2.5 shadow-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-slate-900 leading-snug">{doc.name}</div>
                      <div className="text-[10.5px] text-slate-500 mt-0.5">
                        {doc.issuer ? `${doc.issuer} • ` : ''}
                        Emitido: {doc.issueDate || doc.date ? formatDate(doc.issueDate || doc.date) : 'sin fecha'}
                        {doc.expiryDate ? ` • Vence: ${formatDate(doc.expiryDate)}` : ''}
                      </div>
                    </div>
                    <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${TONE[v?.tone] || TONE.slate}`}>{v?.label || 'Registrado'}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {req && (
                      <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        Requisito: {TIER_META[req.tier]?.label || 'Requisito'}
                      </span>
                    )}
                    {file ? (
                      <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <Paperclip className="w-3 h-3" />
                        {doc.fileName || 'archivo'} {doc.fileSize ? `(${doc.fileSize})` : ''}
                      </span>
                    ) : (
                      <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                        {doc.fileError ? 'No se pudo guardar el archivo: vuelve a adjuntarlo' : 'Sin archivo adjunto'}
                      </span>
                    )}
                  </div>

                  {doc.notes && <p className="text-[11px] text-slate-600 bg-slate-50 rounded-lg p-2 border border-slate-100">{doc.notes}</p>}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={doc.includeInDossier !== false}
                        onChange={() => toggleDossier(doc.id)}
                        className="w-3.5 h-3.5 rounded text-[#0F3D2E]"
                      />
                      <span className={`text-[11px] font-bold ${doc.includeInDossier !== false ? 'text-[#0F3D2E]' : 'text-slate-400'}`}>
                        Incluir en el dossier
                      </span>
                    </label>
                    <div className="flex items-center gap-1">
                      {file && doc.fileData && (
                        <>
                          <button type="button" onClick={() => openDataUrlInNewTab(doc.fileData)} title="Ver documento" className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => downloadDataUrl(doc.fileData, doc.fileName || `${doc.name}.${extensionOf(doc)}`)}
                            title="Descargar"
                            className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      <button type="button" onClick={() => openEdit(doc)} title="Editar / adjuntar archivo" className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer">
                        <PenTool className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => handleDelete(doc)} title="Eliminar" className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <p className="text-[10.5px] text-slate-400 leading-relaxed">
        Los archivos se guardan en este navegador (no se envían a ningún servidor). Descarga una copia de respaldo periódicamente desde
        "Respaldos &amp; Seguridad" y evita usar equipos compartidos para los documentos de identidad.
      </p>

      {/* Formulario */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <form onSubmit={handleSave} className="bg-white rounded-3xl w-full max-w-xl p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-black text-slate-900">{editingId ? 'Editar documento' : 'Agregar documento'}</h4>
              <button type="button" onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-slate-500">Tipo de requisito</label>
              <select
                value={form.requirementKey}
                onChange={(e) => {
                  const key = e.target.value;
                  const req = REQUIREMENTS.find((r) => r.key === key);
                  setForm((p) => ({ ...p, requirementKey: key, category: req ? req.category : p.category, name: p.name || (req ? req.label : '') }));
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              >
                <option value="">Otro documento (no corresponde a un requisito)</option>
                {REQUIREMENTS.map((r) => (
                  <option key={r.key} value={r.key}>{r.label} — {TIER_META[r.tier].label}</option>
                ))}
              </select>
              {form.requirementKey && (
                <p className="text-[10.5px] text-slate-500">{REQUIREMENTS.find((r) => r.key === form.requirementKey)?.hint}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-bold uppercase text-slate-500">Nombre del documento *</label>
                <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold" placeholder="Ej: Certificado de antecedentes para fines especiales" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-slate-500">Categoría</label>
                <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  {DOC_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-slate-500">Institución emisora</label>
                <input value={form.issuer} onChange={(e) => setForm((p) => ({ ...p, issuer: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" placeholder="Ej: Registro Civil, MINVU, SII" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-slate-500">Fecha de emisión</label>
                <input type="date" value={form.issueDate} onChange={(e) => setForm((p) => ({ ...p, issueDate: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-slate-500">Fecha de vencimiento (si aplica)</label>
                <input type="date" value={form.expiryDate} onChange={(e) => setForm((p) => ({ ...p, expiryDate: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-slate-500">Archivo (PDF o imagen, máx. 10 MB)</label>
              <input ref={fileInputRef} type="file" accept="application/pdf,image/*" onChange={handleFile} className="hidden" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-3 py-3 border-2 border-dashed border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:border-[#0F3D2E] hover:text-[#0F3D2E] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                {form.fileName ? `${form.fileName} ${form.fileSize ? `(${form.fileSize})` : ''} — reemplazar` : 'Seleccionar archivo'}
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-slate-500">Notas internas</label>
              <textarea rows={2} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={form.includeInDossier} onChange={(e) => setForm((p) => ({ ...p, includeInDossier: e.target.checked }))} className="w-4 h-4 rounded text-[#0F3D2E]" />
              <span className="text-xs font-bold text-slate-700">Incluir en el Anexo documental del dossier</span>
            </label>

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer">Cancelar</button>
              <button type="submit" className="px-5 py-2 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white text-xs font-bold cursor-pointer">Guardar documento</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
