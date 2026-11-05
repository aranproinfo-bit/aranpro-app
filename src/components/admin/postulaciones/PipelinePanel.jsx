import React, { useMemo, useState } from 'react';
import {
  Plus, X, PenTool, Trash2, FileText, MessageCircle, CalendarClock,
  Target, Trophy, AlertTriangle, TrendingUp
} from 'lucide-react';
import { formatDate } from '../../../utils/formatters';

const STAGES = [
  { id: 'prospecto', label: 'Prospecto', help: 'Comunidad identificada', head: 'bg-slate-100 text-slate-700', dot: 'bg-slate-400' },
  { id: 'contactado', label: 'Contactada', help: 'Hubo primer contacto', head: 'bg-sky-50 text-sky-800', dot: 'bg-sky-500' },
  { id: 'dossier', label: 'Dossier enviado', help: 'Esperando respuesta', head: 'bg-indigo-50 text-indigo-800', dot: 'bg-indigo-500' },
  { id: 'presentacion', label: 'Presentación', help: 'Reunión o asamblea', head: 'bg-amber-50 text-amber-800', dot: 'bg-amber-500' },
  { id: 'ganada', label: 'Adjudicada', help: 'Contrato ganado', head: 'bg-emerald-50 text-emerald-800', dot: 'bg-emerald-500' },
  { id: 'perdida', label: 'No adjudicada', help: 'Cerrada sin contrato', head: 'bg-rose-50 text-rose-800', dot: 'bg-rose-500' }
];

const SOURCES = ['Contacto directo', 'Referido por un comité', 'Licitación / concurso', 'Asamblea abierta', 'Redes / sitio web', 'Otro'];

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const emptyForm = {
  condo: '', city: '', units: '', source: SOURCES[0],
  contactName: '', contactRole: '', contactPhone: '', contactEmail: '',
  stage: 'prospecto', nextAction: '', nextActionDate: '', meetingDate: '',
  feeOffered: '', notes: '', lostReason: ''
};

export const PipelinePanel = ({
  items: rawItems,
  pipeline,
  onChange,
  setPipeline,
  onPrepareDossier,
  showConfirm
}) => {
  const updateItems = onChange || setPipeline || (() => {});
  const items = useMemo(() => {
    const list = Array.isArray(rawItems) ? rawItems : Array.isArray(pipeline) ? pipeline : [];
    return list.map((it) => {
      const stageMap = {
        dossier_enviado: 'dossier',
        adjudicada: 'ganada',
        no_adjudicada: 'perdida'
      };
      return {
        ...it,
        condo: it.condo || it.condoName || 'Comunidad en Evaluación',
        units: it.units ?? it.unitsCount ?? '',
        stage: stageMap[it.stage] || (STAGES.some((s) => s.id === it.stage) ? it.stage : 'prospecto'),
        feeOffered: it.feeOffered || (it.monthlyFeeCLP ? `$${Number(it.monthlyFeeCLP).toLocaleString('es-CL')} / mes` : ''),
        notes: it.notes || it.competitionNotes || ''
      };
    });
  }, [rawItems, pipeline]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const today = todayStr();

  const stats = useMemo(() => {
    const open = items.filter((i) => !['ganada', 'perdida'].includes(i.stage));
    const won = items.filter((i) => i.stage === 'ganada').length;
    const lost = items.filter((i) => i.stage === 'perdida').length;
    const overdue = open.filter((i) => i.nextActionDate && i.nextActionDate < today).length;
    return {
      open: open.length,
      won,
      lost,
      overdue,
      closeRate: won + lost > 0 ? Math.round((won / (won + lost)) * 100) : null
    };
  }, [items, today]);

  const stamp = (text) => ({ at: new Date().toISOString(), text });

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setForm({ ...emptyForm, ...item });
    setShowForm(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.condo.trim()) return;
    const now = new Date().toISOString();
    if (editingId) {
      updateItems(
        items.map((i) => {
          if (i.id !== editingId) return i;
          const history = [...(i.history || [])];
          if (i.stage !== form.stage) history.push(stamp(`Etapa: ${STAGES.find((s) => s.id === form.stage)?.label}`));
          return { ...i, ...form, condoName: form.condo, unitsCount: form.units, history, updatedAt: now };
        })
      );
    } else {
      updateItems([
        {
          ...form,
          condoName: form.condo,
          unitsCount: form.units,
          id: `post-${Date.now()}`,
          createdAt: now,
          updatedAt: now,
          history: [stamp('Postulación registrada')]
        },
        ...items
      ]);
    }
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const moveTo = (id, stage) => {
    const label = STAGES.find((s) => s.id === stage)?.label;
    updateItems(
      items.map((i) => {
        if (i.id !== id) return i;
        const patch = { stage, updatedAt: new Date().toISOString(), history: [...(i.history || []), stamp(`Etapa: ${label}`)] };
        if (stage === 'dossier' && !i.dossierSentAt) patch.dossierSentAt = today;
        return { ...i, ...patch };
      })
    );
  };

  const remove = (item) => {
    showConfirm({
      title: '¿Eliminar postulación?',
      message: `Se eliminará "${item.condo}" del seguimiento, junto con su historial.`,
      type: 'danger',
      confirmText: 'Sí, eliminar',
      cancelText: 'Conservar',
      onConfirm: () => updateItems(items.filter((i) => i.id !== item.id))
    });
  };

  const whatsappFollowUp = (item) => {
    const phone = (item.contactPhone || '').replace(/[^0-9]/g, '');
    const msg =
      `Estimado(a) ${item.contactName || 'miembro del comité'}, junto con saludarle le escribo para hacer seguimiento a la propuesta de administración ` +
      `enviada para ${item.condo}. Quedo atento para resolver cualquier consulta o coordinar una reunión con el comité.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className="space-y-5 animate-in fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h4 className="text-base font-black text-slate-900">Seguimiento de postulaciones</h4>
          <p className="text-xs text-slate-500 max-w-2xl">
            Registra cada comunidad a la que postulas, en qué etapa va y cuál es el próximo paso. Así ninguna oportunidad se enfría por falta de seguimiento.
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="px-4 py-2.5 rounded-2xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs shadow-md flex items-center gap-2 self-start md:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#D4B895]" />
          Nueva postulación
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { label: 'En proceso', value: stats.open, icon: Target, cls: 'bg-slate-50 border-slate-200 text-slate-800' },
          { label: 'Adjudicadas', value: stats.won, icon: Trophy, cls: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
          { label: 'Tasa de cierre', value: stats.closeRate === null ? '—' : `${stats.closeRate}%`, icon: TrendingUp, cls: 'bg-indigo-50 border-indigo-200 text-indigo-800' },
          { label: 'Seguimientos vencidos', value: stats.overdue, icon: AlertTriangle, cls: stats.overdue ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-slate-50 border-slate-200 text-slate-500' }
        ].map((s) => (
          <div key={s.label} className={`px-3 py-2.5 rounded-2xl border flex items-center gap-2 ${s.cls}`}>
            <s.icon className="w-4 h-4 shrink-0" />
            <div className="leading-tight">
              <div className="text-lg font-black">{s.value}</div>
              <div className="text-[10px] font-bold uppercase tracking-wide opacity-80">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-slate-300 rounded-2xl space-y-2">
          <p className="text-sm font-bold text-slate-700">Aún no registras postulaciones</p>
          <p className="text-xs text-slate-500">
            Parte con la primera comunidad que quieras captar: se creará su ficha y podrás preparar el dossier a su nombre con un clic.
          </p>
          <button type="button" onClick={openNew} className="px-4 py-2 rounded-xl bg-[#0F3D2E] text-white text-xs font-bold cursor-pointer">
            Registrar primera postulación
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-3 min-w-max">
            {STAGES.map((stage) => {
              const col = items.filter((i) => i.stage === stage.id);
              return (
                <div key={stage.id} className="w-[250px] shrink-0 space-y-2">
                  <div className={`px-3 py-2 rounded-xl flex items-center justify-between ${stage.head}`}>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${stage.dot}`} />
                      <span className="text-[11px] font-black uppercase tracking-wide">{stage.label}</span>
                    </div>
                    <span className="text-[11px] font-black">{col.length}</span>
                  </div>

                  {col.length === 0 && (
                    <div className="text-[10.5px] text-slate-400 text-center py-4 border border-dashed border-slate-200 rounded-xl">{stage.help}</div>
                  )}

                  {col.map((item) => {
                    const isOverdue = item.nextActionDate && item.nextActionDate < today && !['ganada', 'perdida'].includes(item.stage);
                    return (
                      <div key={item.id} className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                        <div>
                          <div className="font-black text-xs text-slate-900 leading-snug">{item.condo}</div>
                          <div className="text-[10.5px] text-slate-500">
                            {[item.city, item.units ? `${item.units} unidades` : ''].filter(Boolean).join(' • ') || 'Sin datos de ubicación'}
                          </div>
                        </div>

                        {(item.contactName || item.contactRole) && (
                          <div className="text-[10.5px] text-slate-600">
                            👤 {item.contactName} {item.contactRole ? `(${item.contactRole})` : ''}
                          </div>
                        )}

                        {item.nextAction && (
                          <div className={`text-[10.5px] rounded-lg px-2 py-1.5 flex items-start gap-1.5 border ${isOverdue ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                            <CalendarClock className="w-3 h-3 shrink-0 mt-0.5" />
                            <span>
                              <strong>{item.nextAction}</strong>
                              {item.nextActionDate ? ` — ${formatDate(item.nextActionDate)}${isOverdue ? ' (vencido)' : ''}` : ''}
                            </span>
                          </div>
                        )}

                        {item.dossierSentAt && <div className="text-[10px] text-slate-400">Dossier enviado: {formatDate(item.dossierSentAt)}</div>}
                        {item.stage === 'perdida' && item.lostReason && <div className="text-[10.5px] text-rose-700">Motivo: {item.lostReason}</div>}

                        <select
                          value={item.stage}
                          onChange={(e) => moveTo(item.id, e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700"
                        >
                          {STAGES.map((s) => <option key={s.id} value={s.id}>Mover a: {s.label}</option>)}
                        </select>

                        <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => onPrepareDossier(item)}
                            className="px-2 py-1 rounded-lg bg-[#0F3D2E] hover:bg-[#0A291F] text-white text-[10.5px] font-bold flex items-center gap-1 cursor-pointer"
                            title="Carga esta comunidad como destinataria del dossier y la carta"
                          >
                            <FileText className="w-3 h-3 text-[#D4B895]" /> Preparar dossier
                          </button>
                          <div className="flex items-center">
                            {item.contactPhone && (
                              <button type="button" onClick={() => whatsappFollowUp(item)} title="Seguimiento por WhatsApp" className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 cursor-pointer">
                                <MessageCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button type="button" onClick={() => openEdit(item)} title="Editar" className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer">
                              <PenTool className="w-3.5 h-3.5" />
                            </button>
                            <button type="button" onClick={() => remove(item)} title="Eliminar" className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <form onSubmit={handleSave} className="bg-white rounded-3xl w-full max-w-2xl p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-black text-slate-900">{editingId ? 'Editar postulación' : 'Nueva postulación'}</h4>
              <button type="button" onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-bold uppercase text-slate-500">Comunidad / condominio *</label>
                <input required value={form.condo} onChange={set('condo')} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" placeholder="Ej: Condominio Mirador del Valle" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-slate-500">Ciudad / comuna</label>
                <input value={form.city} onChange={set('city')} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-slate-500">N° de unidades (aprox.)</label>
                <input type="number" min="0" value={form.units} onChange={set('units')} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-slate-500">Origen del contacto</label>
                <select value={form.source} onChange={set('source')} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  {SOURCES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-slate-500">Etapa</label>
                <select value={form.stage} onChange={set('stage')} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold">
                  {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-slate-500">Persona de contacto</label>
                <input value={form.contactName} onChange={set('contactName')} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-slate-500">Cargo</label>
                <input value={form.contactRole} onChange={set('contactRole')} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" placeholder="Presidente(a), tesorero(a)…" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-slate-500">Teléfono / WhatsApp</label>
                <input value={form.contactPhone} onChange={set('contactPhone')} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" placeholder="+56 9 ..." />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-slate-500">Correo</label>
                <input type="email" value={form.contactEmail} onChange={set('contactEmail')} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-bold uppercase text-slate-500">Próxima acción</label>
                <input value={form.nextAction} onChange={set('nextAction')} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" placeholder="Ej: Llamar para confirmar fecha de asamblea" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-slate-500">Fecha de la próxima acción</label>
                <input type="date" value={form.nextActionDate} onChange={set('nextActionDate')} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-slate-500">Fecha de reunión / asamblea</label>
                <input type="date" value={form.meetingDate} onChange={set('meetingDate')} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-bold uppercase text-slate-500">Honorarios ofrecidos</label>
                <input value={form.feeOffered} onChange={set('feeOffered')} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" placeholder="Ej: UF 0,15 por unidad o $450.000 mensuales" />
              </div>
              {form.stage === 'perdida' && (
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-bold uppercase text-slate-500">Motivo (para aprender)</label>
                  <input value={form.lostReason} onChange={set('lostReason')} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" placeholder="Precio, continuidad del actual administrador, falta de referencias…" />
                </div>
              )}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-bold uppercase text-slate-500">Notas</label>
                <textarea rows={2} value={form.notes} onChange={set('notes')} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
              </div>
            </div>

            {editingId && (items.find((i) => i.id === editingId)?.history || []).length > 0 && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="text-[10px] font-black uppercase text-slate-500">Historial</div>
                {(items.find((i) => i.id === editingId)?.history || []).slice().reverse().map((h, idx) => (
                  <div key={idx} className="text-[11px] text-slate-600">
                    {new Date(h.at).toLocaleDateString('es-CL')} — {h.text}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer">Cancelar</button>
              <button type="submit" className="px-5 py-2 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white text-xs font-bold cursor-pointer">Guardar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
