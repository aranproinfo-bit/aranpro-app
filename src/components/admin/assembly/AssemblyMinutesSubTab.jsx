import React, { useState } from 'react';
import { useCommunity } from '../../../context/CommunityContext';
import { 
  BookOpen, FileText, CheckCircle2, Printer, Plus, Eye, 
  Trash2, ShieldCheck, Download, Calendar, Users, Award, 
  Scale, X, Check, Search, Filter, Shield, Sparkles
} from 'lucide-react';
import { formatDate } from '../../../utils/formatters';
import { printDocumentDirectly, downloadHtmlDocument } from '../../../utils/printDocument';
import { AranproLogo, AranproOfficialSeal } from '../../common/MauranLogo';

export const AssemblyMinutesSubTab = ({ currentCommunity }) => {
  const { addAssemblyMinute, deleteAssemblyMinute, companySettings } = useCommunity();

  const minutes = currentCommunity?.assemblyMinutes || [];

  // Modales y estados
  const [selectedMinute, setSelectedMinute] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Formulario nueva acta
  const [newMinuteForm, setNewMinuteForm] = useState({
    folio: '',
    date: new Date().toISOString().split('T')[0],
    time: '19:30 hrs',
    type: 'Asamblea Ordinaria Anual',
    legalArticle: 'Art. 15° Ley N° 21.442',
    place: 'Sede Comunitaria y Videoconferencia',
    presidentName: 'Carlos Morales Rojas',
    presidentRut: '15.428.312-4',
    secretaryName: 'Marcela Castillo Gómez',
    secretaryRut: '13.784.512-8',
    adminName: 'Administración General ARANPRO',
    adminRut: '76.892.431-K',
    quorumAchieved: 81.25,
    totalUnitsPresent: 13,
    totalUnitsCount: currentCommunity?.units?.length || 16,
    agendaItemsText: '1. Rendición de Cuentas\n2. Presupuesto Anual\n3. Renovación de Comité',
    resolutionsText: '1. Se aprueba la rendición de cuentas.\n2. Se aprueba el presupuesto para el ejercicio.\n3. Se ratifica al Comité de Administración.',
    notes: 'Acta aprobada y protocolizada en el libro digital oficial.'
  });

  const filteredMinutes = minutes.filter(m => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (m.folio || '').toLowerCase().includes(q) ||
      (m.type || '').toLowerCase().includes(q) ||
      (m.date || '').toLowerCase().includes(q)
    );
  });

  const handleOpenViewModal = (minute) => {
    setSelectedMinute(minute);
    setShowViewModal(true);
  };

  const handleSaveNewMinute = (e) => {
    e.preventDefault();
    const agendaArray = newMinuteForm.agendaItemsText.split('\n').filter(Boolean);
    const resArray = newMinuteForm.resolutionsText.split('\n').filter(Boolean);

    addAssemblyMinute(currentCommunity.id, {
      folio: newMinuteForm.folio,
      date: newMinuteForm.date,
      time: newMinuteForm.time,
      type: newMinuteForm.type,
      legalArticle: newMinuteForm.legalArticle,
      place: newMinuteForm.place,
      presidentName: newMinuteForm.presidentName,
      presidentRut: newMinuteForm.presidentRut,
      secretaryName: newMinuteForm.secretaryName,
      secretaryRut: newMinuteForm.secretaryRut,
      adminName: newMinuteForm.adminName,
      adminRut: newMinuteForm.adminRut,
      quorumAchieved: parseFloat(newMinuteForm.quorumAchieved) || 0,
      totalUnitsPresent: parseInt(newMinuteForm.totalUnitsPresent) || 0,
      totalUnitsCount: parseInt(newMinuteForm.totalUnitsCount) || 16,
      agendaItems: agendaArray,
      resolutions: resArray,
      notes: newMinuteForm.notes
    });

    setShowNewModal(false);
  };

  return (
    <div className="space-y-4">
      {/* 1. CABECERA & ACCIONES DEL LIBRO DE ACTAS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center space-x-3 shrink-0">
          <div className="p-2.5 bg-gradient-to-br from-[#0F3D2E] to-[#14533d] text-white rounded-2xl shadow-xs shrink-0">
            <BookOpen className="w-5 h-5 text-[#D4B895]" />
          </div>
          <div>
            <div className="flex items-center space-x-2 flex-wrap">
              <h3 className="text-base font-black text-slate-900 tracking-tight whitespace-nowrap">
                Libro Oficial de Actas Foliadas
              </h3>
              <span className="text-[10px] font-bold bg-[#0F3D2E]/10 text-[#0F3D2E] px-2 py-0.5 rounded-full border border-[#0F3D2E]/20 uppercase">
                Ley N° 21.442 • Art. 20
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Registro cronológico, inalterable y legalmente válido de acuerdos, quórums y firmas de la asamblea
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <div className="w-48 hidden md:block">
            <input
              type="text"
              placeholder="Buscar por folio, tipo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              if (minutes.length > 0) {
                setSelectedMinute(minutes[0]);
                setShowViewModal(true);
              }
            }}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-[#0F3D2E] border border-slate-300 font-bold text-xs rounded-xl flex items-center shadow-2xs transition-colors cursor-pointer"
            title="Ver e imprimir acta oficial protocolizada en PDF"
          >
            <Printer className="w-3.5 h-3.5 mr-1 text-[#0F3D2E]" />
            Imprimir Acta (PDF)
          </button>

          <button
            type="button"
            onClick={() => {
              const nextNum = (minutes.length || 0) + 1;
              setNewMinuteForm(prev => ({
                ...prev,
                folio: `ACTA-${new Date().getFullYear()}-${String(nextNum).padStart(3, '0')}`
              }));
              setShowNewModal(true);
            }}
            className="px-3.5 py-2 bg-gradient-to-r from-[#0F3D2E] to-[#14533d] text-[#D4B895] border border-[#D4B895] font-black text-xs rounded-xl flex items-center shadow-xs cursor-pointer hover:from-[#0A291F]"
          >
            <Plus className="w-3.5 h-3.5 mr-1 text-[#D4B895]" />
            + Redactar Nueva Acta
          </button>
        </div>
      </div>

      {/* 2. LISTADO DE ACTAS FOLIADAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredMinutes.map(minute => (
          <div 
            key={minute.id}
            className="p-4.5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3 hover:border-slate-300 transition-all"
          >
            <div>
              {/* Cabecera del Acta */}
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-slate-900 text-[#D4B895]">
                    {minute.folio}
                  </span>
                  <span className="text-xs font-black text-slate-800">
                    {minute.type}
                  </span>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-900 rounded-md border border-emerald-300 flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                  <span>Foliada & Certificada</span>
                </span>
              </div>

              {/* Metadatos */}
              <div className="grid grid-cols-2 gap-2 mt-2.5 text-xs">
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-500 block">Fecha y Hora:</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {formatDate(minute.date)} • {minute.time}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] text-emerald-700 block">Quórum Acreditado:</span>
                  <span className="font-black text-emerald-950 font-mono">
                    {minute.quorumAchieved}% ({minute.totalUnitsPresent}/{minute.totalUnitsCount} casas)
                  </span>
                </div>
              </div>

              {/* Extracto de Acuerdos */}
              <div className="mt-3 space-y-1.5">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                  Resumen de Acuerdos Tomados:
                </span>
                <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-100 text-xs text-slate-700 space-y-1">
                  {(minute.resolutions || []).slice(0, 2).map((res, idx) => (
                    <div key={idx} className="flex items-start space-x-1.5">
                      <span className="text-emerald-700 font-black">•</span>
                      <p className="line-clamp-2 text-[11px]">{res}</p>
                    </div>
                  ))}
                  {(minute.resolutions || []).length > 2 && (
                    <span className="text-[10px] text-slate-500 font-bold italic block pt-1">
                      + {(minute.resolutions.length - 2)} acuerdo(s) adicional(es) en acta completa...
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Firmantes y Botón Ver Acta */}
            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="text-[11px] text-slate-500 truncate pr-2">
                ✍️ Firmantes: <strong className="text-slate-800">{minute.presidentName}</strong> & <strong className="text-slate-800">{minute.adminName}</strong>
              </div>

              <button
                type="button"
                onClick={() => handleOpenViewModal(minute)}
                className="px-3.5 py-1.5 bg-[#0F3D2E] hover:bg-[#0A291F] text-[#D4B895] font-black text-xs rounded-xl flex items-center space-x-1 cursor-pointer transition-all shadow-xs shrink-0"
              >
                <Eye className="w-3.5 h-3.5 mr-1 text-[#D4B895]" />
                <span>Ver Acta Completa</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: VISUALIZADOR OFICIAL DE ACTA FOLIADA CON TIMBRES Y FIRMAS */}
      {showViewModal && selectedMinute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
            {/* Barra superior de herramientas del visualizador */}
            <div className="bg-[#0F3D2E] text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-[#D4B895]" />
                <div>
                  <h3 className="text-sm font-black text-white">
                    Libro Oficial de Actas • Folio {selectedMinute.folio}
                  </h3>
                  <span className="text-[10px] text-[#D4B895] font-mono">
                    Condominio {currentCommunity.name} • Protocolización Ley 21.442
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    const commName = (currentCommunity?.name || 'Condominio').replace(/\s+/g, '_');
                    const docName = `Acta_Asamblea_${selectedMinute.folio}_${commName}_${selectedMinute.date}`;
                    printDocumentDirectly('assembly-minute-printable-doc', docName);
                  }}
                  className="px-3.5 py-1.5 bg-[#D4B895] hover:bg-[#c4a275] text-[#0F3D2E] font-black text-xs rounded-xl flex items-center space-x-1.5 cursor-pointer shadow-xs transition-all"
                  title="Imprimir acta oficial o guardar en PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir / PDF Foliado</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const commName = (currentCommunity?.name || 'Condominio').replace(/\s+/g, '_');
                    downloadHtmlDocument('assembly-minute-printable-doc', `Acta_${selectedMinute.folio}_${commName}.html`);
                  }}
                  className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs transition-colors cursor-pointer"
                  title="Descargar respaldo HTML"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowViewModal(false)}
                  className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* CUERPO DEL ACTA CON FORMATO NOTARIAL / LEGAL CHILENO (AISLADO EN IFRAME) */}
            <div 
              id="assembly-minute-printable-doc"
              className="p-6 sm:p-9 space-y-6 text-slate-900 font-serif leading-relaxed text-xs sm:text-sm max-h-[75vh] overflow-y-auto bg-[#FDFBF7]"
            >
              {/* Membrete Oficial Maestro ARANPRO (Alternativa 4) */}
              <div className="flex items-center justify-between border-b-2 border-[#0F3D2E] pb-3.5 font-sans">
                <div className="flex items-center space-x-3.5">
                  <AranproLogo variant="principal" className="h-12 w-auto shrink-0" />
                  <div className="border-l border-slate-300 pl-3.5 space-y-0.5">
                    <div className="text-[10.5px] font-black text-[#0F3D2E] uppercase tracking-wider">
                      ARANPRO • Gestión Integral Inmobiliaria
                    </div>
                    <div className="text-[9px] text-slate-600 font-mono font-bold">
                      Ley N° 21.442 de Copropiedad Inmobiliaria • Fono: +56 9 5811 8504
                    </div>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <div className="font-black text-slate-900 text-sm leading-tight">{currentCommunity.name}</div>
                  <div className="text-slate-600 text-[10px]">{currentCommunity.address || 'Camino San Ramón 4500, La Serena'}</div>
                  <div className="text-[9.5px] font-mono text-[#0F3D2E] font-bold">
                    Protocolización Ley N° 21.442 • Art. 20°
                  </div>
                </div>
              </div>

              {/* Encabezado formal */}
              <div className="text-center border-b-2 border-slate-300 pb-4 space-y-1 font-sans">
                <span className="text-[10px] tracking-widest uppercase font-mono text-slate-500 block">
                  REPÚBLICA DE CHILE • CONDOMINIO {currentCommunity.name.toUpperCase()}
                </span>
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight uppercase">
                  {selectedMinute.type}
                </h2>
                <span className="text-xs font-mono font-bold text-[#0F3D2E] block">
                  FOLIO OFICIAL N°: {selectedMinute.folio}
                </span>
              </div>

              {/* Párrafo de Apertura */}
              <p className="text-justify">
                En La Serena, a <strong>{formatDate(selectedMinute.date)}</strong>, siendo las <strong>{selectedMinute.time}</strong>, se celebró en {selectedMinute.place} la correspondiente {selectedMinute.type} del Condominio <strong>{currentCommunity.name}</strong>, conforme a lo preceptuado en los artículos 15°, 16°, 17° y 20° de la <strong>Ley N° 21.442 sobre Copropiedad Inmobiliaria</strong>.
              </p>

              {/* Certificación de Asistencia y Quórum */}
              <div className="p-3 bg-white rounded-xl border border-slate-300 space-y-1">
                <strong className="block text-slate-900 font-sans text-xs">
                  CERTIFICACIÓN DE QUÓRUM DE ASISTENCIA (Art. 15°):
                </strong>
                <p className="text-justify text-[11px] sm:text-xs">
                  Se certifica por el Comité de Administración y la Administración General la concurrencia de <strong>{selectedMinute.totalUnitsPresent} copropietarios hábiles</strong>, equivalentes a un <strong>{selectedMinute.quorumAchieved}%</strong> de los derechos totales sobre los bienes de dominio común del condominio, cumpliéndose válidamente con el quórum legal requerido para constituir la asamblea y adoptar acuerdos obligatorios.
                </p>
              </div>

              {/* Tabla de Materias Tratadas */}
              <div>
                <strong className="block text-slate-900 font-sans text-xs mb-1.5 uppercase">
                  TABLA DE MATERIAS TRATADAS:
                </strong>
                <ul className="list-decimal pl-5 space-y-1 text-slate-800 text-[11px] sm:text-xs">
                  {(selectedMinute.agendaItems || []).map((item, idx) => (
                    <li key={idx}><strong>{item}</strong></li>
                  ))}
                </ul>
              </div>

              {/* Acuerdos Adoptados */}
              <div>
                <strong className="block text-slate-900 font-sans text-xs mb-1.5 uppercase">
                  ACUERDOS Y RESOLUCIONES ADOPTADAS:
                </strong>
                <div className="space-y-2 text-justify text-[11px] sm:text-xs text-slate-800">
                  {(selectedMinute.resolutions || []).map((res, idx) => (
                    <div key={idx} className="p-2.5 bg-white rounded-xl border border-slate-200">
                      <strong>ACUERDO N° {idx + 1}:</strong> {res}
                    </div>
                  ))}
                </div>
              </div>

              {/* Cierre y Notas */}
              {selectedMinute.notes && (
                <p className="text-justify text-[11px] italic text-slate-600">
                  {selectedMinute.notes}
                </p>
              )}

              {/* Bloque de Firmas Certificadas */}
              <div className="pt-8 border-t border-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-8 text-center font-sans">
                <div className="space-y-1">
                  <div className="h-10 flex items-center justify-center">
                    <span className="font-mono text-emerald-800 text-xs italic font-bold">
                      [Firmado Electrónicamente]
                    </span>
                  </div>
                  <div className="border-t border-slate-400 pt-1.5">
                    <strong className="text-xs text-slate-900 block">{selectedMinute.presidentName}</strong>
                    <span className="text-[10px] text-slate-600 block">Presidente Comité de Administración</span>
                    <span className="text-[10px] text-slate-500 font-mono">RUT: {selectedMinute.presidentRut}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="h-16 flex items-center justify-center gap-3">
                    <AranproOfficialSeal size="sm" showText={false} />
                    {companySettings?.signatureDataUrl ? (
                      <img 
                        src={companySettings.signatureDataUrl} 
                        alt="Firma Administrador" 
                        className="max-h-14 object-contain"
                        style={{ transform: `scale(${companySettings?.signatureScale || 1.25})` }}
                      />
                    ) : (
                      <span className="font-mono text-emerald-800 text-xs italic font-bold">
                        [Firmado Electrónicamente]
                      </span>
                    )}
                  </div>
                  <div className="border-t border-slate-400 pt-1.5">
                    <strong className="text-xs text-slate-900 block">
                      {companySettings?.adminName || companySettings?.administratorName || selectedMinute.adminName}
                    </strong>
                    <span className="text-[10px] text-slate-600 block">Administrador General ARANPRO</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      RUT: {companySettings?.adminRut || selectedMinute.adminRut} • RNAC N° {companySettings?.rnacNumber || '48.912'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REDACTAR NUEVA ACTA FOLIADA */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden space-y-4 p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-[#0F3D2E] text-white rounded-xl">
                  <BookOpen className="w-5 h-5 text-[#D4B895]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Redactar Nueva Acta Foliada</h3>
                  <p className="text-xs text-slate-500">Incorporación al Libro Oficial</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewMinute} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Folio del Acta</label>
                  <input
                    type="text"
                    required
                    value={newMinuteForm.folio}
                    onChange={(e) => setNewMinuteForm({ ...newMinuteForm, folio: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo de Sesión</label>
                  <select
                    value={newMinuteForm.type}
                    onChange={(e) => setNewMinuteForm({ ...newMinuteForm, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  >
                    <option value="Asamblea Ordinaria Anual">Asamblea Ordinaria Anual</option>
                    <option value="Asamblea Extraordinaria Mayoría Absoluta">Asamblea Extraordinaria Mayoría Absoluta</option>
                    <option value="Asamblea Extraordinaria Mayoría Reforzada (66%)">Asamblea Extraordinaria Mayoría Reforzada (66%)</option>
                    <option value="Consulta por Escrito (Art. 15 inc. final)">Consulta por Escrito (Art. 15 inc. final)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fecha de Celebración</label>
                  <input
                    type="date"
                    required
                    value={newMinuteForm.date}
                    onChange={(e) => setNewMinuteForm({ ...newMinuteForm, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hora de Inicio</label>
                  <input
                    type="text"
                    value={newMinuteForm.time}
                    onChange={(e) => setNewMinuteForm({ ...newMinuteForm, time: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Quórum Acreditado (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newMinuteForm.quorumAchieved}
                    onChange={(e) => setNewMinuteForm({ ...newMinuteForm, quorumAchieved: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Casas Presentes / Totales</label>
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      required
                      value={newMinuteForm.totalUnitsPresent}
                      onChange={(e) => setNewMinuteForm({ ...newMinuteForm, totalUnitsPresent: e.target.value })}
                      className="w-1/2 px-2.5 py-2 rounded-xl border border-slate-300 font-mono font-bold"
                    />
                    <span className="font-bold text-slate-400">/</span>
                    <input
                      type="number"
                      value={newMinuteForm.totalUnitsCount}
                      onChange={(e) => setNewMinuteForm({ ...newMinuteForm, totalUnitsCount: e.target.value })}
                      className="w-1/2 px-2.5 py-2 rounded-xl border border-slate-300 font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tabla de Materias (Una por línea)</label>
                <textarea
                  rows={2}
                  required
                  value={newMinuteForm.agendaItemsText}
                  onChange={(e) => setNewMinuteForm({ ...newMinuteForm, agendaItemsText: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Acuerdos Tomados (Uno por línea)</label>
                <textarea
                  rows={3}
                  required
                  value={newMinuteForm.resolutionsText}
                  onChange={(e) => setNewMinuteForm({ ...newMinuteForm, resolutionsText: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-black rounded-xl shadow-xs cursor-pointer flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4 text-[#D4B895]" />
                  <span>Protocolizar y Guardar Folio</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
