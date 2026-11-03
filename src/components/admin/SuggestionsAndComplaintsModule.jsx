import React, { useState, useMemo } from 'react';
import { useCommunity } from '../../context/CommunityContext';
import { 
  MessageSquare, AlertCircle, CheckCircle2, Clock, Plus, 
  Send, MessageCircle, FileText, Printer, Filter, Sparkles, 
  ArrowUpRight, ShieldCheck, X, Check, Users, AlertTriangle, User,
  Mail, Download, Copy, Share2, Volume2, ShieldAlert, Dog, Car, Droplets, Trash2, Home
} from 'lucide-react';
import { formatDate } from '../../utils/formatters';
import { printDocumentDirectly, downloadHtmlDocument } from '../../utils/printDocument';
import { AranproLogo } from '../common/MauranLogo';
import { COMPLAINT_RESPONSE_TEMPLATES } from '../../data/complaintResponseTemplates';

export const SuggestionsAndComplaintsModule = ({ currentCommunity }) => {
  const { 
    addCommunityTicket, 
    updateTicketStatus, 
    toggleTicketElevate,
    companySettings
  } = useCommunity();

  const tickets = currentCommunity?.communityTickets || [];

  // Filtros de visualización en pantalla
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL' | 'Reclamo' | 'Sugerencia'
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'PENDIENTE' | 'EN_GESTION' | 'RESUELTO'
  const [searchQuery, setSearchQuery] = useState('');

  // Modales
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [showBookPrintModal, setShowBookPrintModal] = useState(false);
  const [showWarningLetterModal, setShowWarningLetterModal] = useState(false);
  const [bookFilterType, setBookFilterType] = useState('ALL'); // Para filtro dentro del modal de impresión

  // Estado del Formulario de Respuesta & Notificaciones
  const [replyForm, setReplyForm] = useState({
    status: 'RESUELTO',
    response: '',
    implicatedUnitNumber: '',
    complainantNotice: '',
    implicatedNotice: '',
    selectedTemplateId: ''
  });

  // Copia rápida / feedback visual
  const [copiedComplainant, setCopiedComplainant] = useState(false);
  const [copiedImplicated, setCopiedImplicated] = useState(false);

  // Formulario nuevo ticket
  const [newTicketForm, setNewTicketForm] = useState({
    unitNumber: 'Casa 1',
    residentName: '',
    implicatedUnitNumber: '',
    type: 'Reclamo',
    category: 'Ruidos Molestos / Convivencia',
    priority: 'Media',
    title: '',
    description: ''
  });

  // Métricas de auditoría
  const pendingCount = tickets.filter(t => t.status === 'PENDIENTE').length;
  const inProgressCount = tickets.filter(t => t.status === 'EN_GESTION').length;
  const resolvedCount = tickets.filter(t => t.status === 'RESUELTO').length;
  const elevatedCount = tickets.filter(t => t.elevateToAssembly).length;

  // Filtrado de la lista en pantalla
  const filteredTickets = tickets.filter(t => {
    if (typeFilter !== 'ALL' && t.type !== typeFilter) return false;
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchFolio = (t.folio || '').toLowerCase().includes(q);
      const matchUnit = (t.unitNumber || '').toLowerCase().includes(q);
      const matchImplicated = (t.implicatedUnitNumber || '').toLowerCase().includes(q);
      const matchName = (t.residentName || '').toLowerCase().includes(q);
      const matchTitle = (t.title || '').toLowerCase().includes(q);
      const matchDesc = (t.description || '').toLowerCase().includes(q);
      return matchFolio || matchUnit || matchImplicated || matchName || matchTitle || matchDesc;
    }
    return true;
  });

  // Tickets filtrados para el libro oficial imprimible
  const printableTickets = tickets.filter(t => {
    if (bookFilterType === 'ALL') return true;
    if (bookFilterType === 'Reclamo' || bookFilterType === 'Sugerencia') return t.type === bookFilterType;
    if (bookFilterType === 'PENDIENTE' || bookFilterType === 'EN_GESTION' || bookFilterType === 'RESUELTO') return t.status === bookFilterType;
    return true;
  });

  // Apertura del modal de respuesta con prellenado inteligente
  const handleOpenReplyModal = (ticket) => {
    setSelectedTicket(ticket);
    const inferredImplicated = ticket.implicatedUnitNumber || (
      ticket.description.match(/casa\s*\d+/i)?.[0] || ''
    );

    setReplyForm({
      status: ticket.status === 'PENDIENTE' ? 'EN_GESTION' : ticket.status,
      response: ticket.adminResponse || '',
      implicatedUnitNumber: inferredImplicated,
      complainantNotice: '',
      implicatedNotice: '',
      selectedTemplateId: ''
    });
    setShowReplyModal(true);
  };

  // Carga de plantilla predefinida y resolución de variables
  const handleSelectTemplate = (template) => {
    if (!selectedTicket) return;

    const complainantName = selectedTicket.residentName || `Copropietario ${selectedTicket.unitNumber}`;
    const complainantUnit = selectedTicket.unitNumber;
    const implicatedUnit = replyForm.implicatedUnitNumber || selectedTicket.implicatedUnitNumber || 'la unidad denunciada';
    const folio = selectedTicket.folio;
    const communityName = currentCommunity?.name || 'Condominio';

    const replaceVars = (text) => {
      if (!text) return '';
      return text
        .replace(/\{complainantName\}/g, complainantName)
        .replace(/\{complainantUnit\}/g, complainantUnit)
        .replace(/\{implicatedUnit\}/g, implicatedUnit)
        .replace(/\{folio\}/g, folio)
        .replace(/\{communityName\}/g, communityName);
    };

    setReplyForm(prev => ({
      ...prev,
      selectedTemplateId: template.id,
      status: template.suggestedStatus || prev.status,
      response: replaceVars(template.adminResponse),
      complainantNotice: replaceVars(template.complainantNotice),
      implicatedNotice: replaceVars(template.implicatedNotice)
    }));
  };

  // Reemplazo dinámico si el usuario cambia la Casa Implicada
  const handleImplicatedUnitChange = (newImplicated) => {
    setReplyForm(prev => {
      const updated = { ...prev, implicatedUnitNumber: newImplicated };
      if (prev.selectedTemplateId) {
        const tmpl = COMPLAINT_RESPONSE_TEMPLATES.find(t => t.id === prev.selectedTemplateId);
        if (tmpl) {
          const complainantName = selectedTicket?.residentName || `Copropietario ${selectedTicket?.unitNumber}`;
          const complainantUnit = selectedTicket?.unitNumber || '';
          const folio = selectedTicket?.folio || '';
          const communityName = currentCommunity?.name || 'Condominio';
          const replaceVars = (text) => (text || '')
            .replace(/\{complainantName\}/g, complainantName)
            .replace(/\{complainantUnit\}/g, complainantUnit)
            .replace(/\{implicatedUnit\}/g, newImplicated || 'la unidad denunciada')
            .replace(/\{folio\}/g, folio)
            .replace(/\{communityName\}/g, communityName);

          updated.response = replaceVars(tmpl.adminResponse);
          updated.complainantNotice = replaceVars(tmpl.complainantNotice);
          updated.implicatedNotice = replaceVars(tmpl.implicatedNotice);
        }
      }
      return updated;
    });
  };

  const handleSaveReply = (e) => {
    e.preventDefault();
    if (!selectedTicket) return;
    updateTicketStatus(
      currentCommunity.id, 
      selectedTicket.id, 
      replyForm.status, 
      replyForm.response,
      {
        implicatedUnitNumber: replyForm.implicatedUnitNumber || selectedTicket.implicatedUnitNumber || ''
      }
    );
    setShowReplyModal(false);
    setSelectedTicket(null);
  };

  const handleSaveNewTicket = (e) => {
    e.preventDefault();
    addCommunityTicket(currentCommunity.id, {
      unitNumber: newTicketForm.unitNumber,
      residentName: newTicketForm.residentName || `Residente ${newTicketForm.unitNumber}`,
      implicatedUnitNumber: newTicketForm.implicatedUnitNumber || '',
      type: newTicketForm.type,
      category: newTicketForm.category,
      priority: newTicketForm.priority,
      title: newTicketForm.title,
      description: newTicketForm.description
    });
    setShowNewTicketModal(false);
    setNewTicketForm({
      unitNumber: 'Casa 1',
      residentName: '',
      implicatedUnitNumber: '',
      type: 'Reclamo',
      category: 'Ruidos Molestos / Convivencia',
      priority: 'Media',
      title: '',
      description: ''
    });
  };

  const copyToClipboard = (text, type = 'complainant') => {
    navigator.clipboard.writeText(text);
    if (type === 'complainant') {
      setCopiedComplainant(true);
      setTimeout(() => setCopiedComplainant(false), 2000);
    } else {
      setCopiedImplicated(true);
      setTimeout(() => setCopiedImplicated(false), 2000);
    }
  };

  // Función de impresión aislada del Libro Oficial
  const handlePrintOfficialBook = () => {
    const commName = (currentCommunity?.name || 'Condominio').replace(/\s+/g, '_');
    const dateStr = new Date().toISOString().slice(0, 10);
    const docName = `Libro_Oficial_Reclamos_Sugerencias_${commName}_${dateStr}`;
    printDocumentDirectly('complaints-official-book-printable', docName);
  };

  // Impresión aislada de la Carta de Advertencia a la Casa Implicada
  const handlePrintWarningLetter = () => {
    if (!selectedTicket) return;
    const commName = (currentCommunity?.name || 'Condominio').replace(/\s+/g, '_');
    const impUnit = (replyForm.implicatedUnitNumber || 'Unidad').replace(/\s+/g, '_');
    const docName = `Carta_Advertencia_Casa_${impUnit}_${selectedTicket.folio}_${commName}`;
    printDocumentDirectly('single-warning-letter-printable', docName, { fitPage: true });
  };

  const getPriorityBadge = (priority) => {
    if (priority === 'Urgente') {
      return <span className="px-2 py-0.5 text-[10px] font-black bg-rose-100 text-rose-800 rounded-md border border-rose-300">Urgente</span>;
    }
    if (priority === 'Alta') {
      return <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-md border border-amber-300">Prioridad Alta</span>;
    }
    return <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 rounded-md border border-slate-200">Normal</span>;
  };

  const getStatusBadge = (status) => {
    if (status === 'PENDIENTE') {
      return (
        <span className="px-2.5 py-1 text-xs font-black bg-amber-100 text-amber-900 rounded-lg border border-amber-300 flex items-center space-x-1">
          <Clock className="w-3.5 h-3.5 text-amber-700" />
          <span>Pendiente de Respuesta</span>
        </span>
      );
    }
    if (status === 'EN_GESTION') {
      return (
        <span className="px-2.5 py-1 text-xs font-bold bg-sky-100 text-sky-900 rounded-lg border border-sky-300 flex items-center space-x-1">
          <Clock className="w-3.5 h-3.5 text-sky-700" />
          <span>En Gestión / Con Notificación</span>
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 text-xs font-bold bg-emerald-100 text-emerald-900 rounded-lg border border-emerald-300 flex items-center space-x-1">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
        <span>Resuelto con Respuesta Oficial</span>
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* 1. CABECERA & ACCIONES PRINCIPALES */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center space-x-3 shrink-0">
          <div className="p-2.5 bg-gradient-to-br from-[#0F3D2E] to-[#14533d] text-white rounded-2xl shadow-xs shrink-0">
            <MessageSquare className="w-5 h-5 text-[#D4B895]" />
          </div>
          <div>
            <div className="flex items-center space-x-2 flex-wrap">
              <h3 className="text-base font-black text-slate-900 tracking-tight whitespace-nowrap">
                Libro Digital de Sugerencias y Reclamos
              </h3>
              <span className="text-[10px] font-bold bg-[#0F3D2E]/10 text-[#0F3D2E] px-2 py-0.5 rounded-full border border-[#0F3D2E]/20 uppercase">
                Helpdesk Comunitario • Transparencia
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Registro formal y trazable de requerimientos vecinales, respuestas de la administración y propuestas para asamblea (Ley N° 21.442)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowNewTicketModal(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-[#0F3D2E] to-[#14533d] hover:from-[#0A291F] hover:to-[#0F3D2E] text-[#D4B895] border border-[#D4B895] font-black text-xs rounded-xl flex items-center shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1 text-[#D4B895]" />
            + Ingresar Reclamo / Sugerencia
          </button>

          <button
            type="button"
            onClick={() => setShowBookPrintModal(true)}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-[#0F3D2E] border border-slate-300 font-bold text-xs rounded-xl flex items-center shadow-2xs transition-colors cursor-pointer"
            title="Ver e imprimir el Libro Oficial Foliado con formato legal ARANPRO"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5 text-[#0F3D2E]" />
            Imprimir Libro (PDF)
          </button>
        </div>
      </div>

      {/* 2. KPIS DE ATENCIÓN VECINAL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={`p-4 rounded-2xl border transition-all ${
          pendingCount > 0 ? 'bg-amber-50/80 border-amber-300 text-amber-950 shadow-xs' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700">
              Pendientes de Respuesta
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black font-mono mt-1 text-amber-800">
            {pendingCount} {pendingCount === 1 ? 'ticket' : 'tickets'}
          </div>
          <p className="text-[11px] text-amber-800 mt-0.5">
            {pendingCount > 0 ? 'Vecinos esperando respuesta formal' : '¡Bandeja al día!'}
          </p>
        </div>

        <div className="bg-sky-50/80 p-4 rounded-2xl border border-sky-300 text-sky-950 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-sky-700">
              En Gestión / Notificados
            </span>
            <AlertCircle className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-black font-mono mt-1 text-sky-800">
            {inProgressCount}
          </div>
          <p className="text-[11px] text-sky-800 mt-0.5">
            Con acciones o cartas de advertencia en curso
          </p>
        </div>

        <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-300 text-emerald-950 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
              Resueltos & Conformidad
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black font-mono mt-1 text-emerald-800">
            {resolvedCount}
          </div>
          <p className="text-[11px] text-emerald-800 mt-0.5">
            Con respuesta oficial registrada en el libro
          </p>
        </div>

        <div className="bg-[#0F3D2E] text-white p-4 rounded-2xl border border-[#0F3D2E] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#D4B895]">
              Elevados a Asamblea
            </span>
            <Users className="w-4 h-4 text-[#D4B895]" />
          </div>
          <div className="text-2xl font-black font-mono mt-1 text-white">
            {elevatedCount} {elevatedCount === 1 ? 'punto' : 'puntos'}
          </div>
          <p className="text-[11px] text-slate-300 mt-0.5">
            Marcados para tabla de próxima asamblea o consulta
          </p>
        </div>
      </div>

      {/* 3. BARRA DE FILTROS & BÚSQUEDA */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setTypeFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              typeFilter === 'ALL' ? 'bg-[#0F3D2E] text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Todos ({tickets.length})
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('Reclamo')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
              typeFilter === 'Reclamo' ? 'bg-rose-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>🔴 Reclamos ({tickets.filter(t => t.type === 'Reclamo').length})</span>
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('Sugerencia')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
              typeFilter === 'Sugerencia' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>💡 Sugerencias ({tickets.filter(t => t.type === 'Sugerencia').length})</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Buscar por folio, casa, vecino..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs w-full sm:w-64 focus:outline-none focus:border-[#0F3D2E]"
          />
        </div>
      </div>

      {/* 4. LISTA DE TICKETS Y RECLAMOS */}
      <div className="space-y-3">
        {filteredTickets.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
            <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">No hay requerimientos en esta categoría</h4>
            <p className="text-xs text-slate-500">Los reclamos y sugerencias ingresados por vecinos aparecerán aquí.</p>
          </div>
        ) : filteredTickets.map(ticket => (
          <div 
            key={ticket.id}
            className={`bg-white p-4 sm:p-5 rounded-2xl border transition-all space-y-3.5 ${
              ticket.status === 'PENDIENTE' 
                ? 'border-amber-300 shadow-xs ring-1 ring-amber-200' 
                : 'border-slate-200 hover:border-slate-300 shadow-2xs'
            }`}
          >
            {/* Cabecera del Reclamo */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <span className="font-mono font-black text-xs px-2 py-0.5 bg-slate-900 text-white rounded-md">
                  {ticket.folio}
                </span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                  ticket.type === 'Reclamo' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {ticket.type}
                </span>
                <strong className="text-xs text-slate-900 font-bold">
                  {ticket.unitNumber} • {ticket.residentName}
                </strong>
                {ticket.implicatedUnitNumber && (
                  <span className="text-[10px] font-semibold bg-rose-50 text-rose-900 border border-rose-200 px-2 py-0.5 rounded-md">
                    Implicado: <strong>{ticket.implicatedUnitNumber}</strong>
                  </span>
                )}
                <span className="text-[10px] text-slate-400 font-mono">
                  ({formatDate(ticket.date)})
                </span>
              </div>

              <div className="flex items-center space-x-2">
                {getPriorityBadge(ticket.priority)}
                {getStatusBadge(ticket.status)}
              </div>
            </div>

            {/* Contenido / Motivo */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-slate-900">{ticket.title}</h4>
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  {ticket.category}
                </span>
              </div>
              <p className="text-xs text-slate-600 bg-slate-50/80 p-3 rounded-xl border border-slate-100 italic leading-relaxed">
                "{ticket.description}"
              </p>
            </div>

            {/* Respuesta Oficial si ya existe */}
            {ticket.adminResponse && (
              <div className="p-3.5 bg-emerald-50/80 rounded-xl border border-emerald-200 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-black text-[#0F3D2E] flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#0F3D2E]" />
                    <span>Respuesta Oficial de la Administración ARANPRO</span>
                  </span>
                  <span className="text-slate-500 font-mono">
                    {ticket.adminResponseDate ? formatDate(ticket.adminResponseDate) : ''}
                  </span>
                </div>
                <p className="text-emerald-950 font-medium leading-relaxed">
                  {ticket.adminResponse}
                </p>
              </div>
            )}

            {/* Barra de Acciones del Ticket */}
            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => toggleTicketElevate(currentCommunity.id, ticket.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                  ticket.elevateToAssembly
                    ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
                title="Marcar este punto para incorporarlo a la tabla de la próxima asamblea o consulta por escrito"
              >
                <Users className="w-3.5 h-3.5" />
                <span>
                  {ticket.elevateToAssembly ? '★ Elevado a Tema de Asamblea' : 'Elevar a Tema de Asamblea'}
                </span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleOpenReplyModal(ticket)}
                  className="px-3.5 py-1.5 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-xs cursor-pointer transition-colors"
                >
                  <Send className="w-3.5 h-3.5 text-[#D4B895]" />
                  <span>{ticket.adminResponse ? 'Modificar / Gestionar Avisos' : 'Responder & Gestionar Avisos'}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: GESTIÓN DE RESPUESTA, NOTIFICACIONES Y ADVERTENCIAS A IMPLICADOS */}
      {/* ========================================================================= */}
      {showReplyModal && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden space-y-4 p-5 sm:p-6 my-8 max-h-[90vh] flex flex-col">
            {/* Header del modal */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-[#0F3D2E] text-white rounded-2xl shadow-xs">
                  <Send className="w-5 h-5 text-[#D4B895]" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-black text-slate-900">
                      Gestión de Requerimiento {selectedTicket.folio}
                    </h3>
                    <span className="text-[10px] font-bold bg-[#0F3D2E]/10 text-[#0F3D2E] px-2 py-0.5 rounded-full">
                      {selectedTicket.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Reclamante: <strong>{selectedTicket.unitNumber}</strong> ({selectedTicket.residentName}) • Categoría: {selectedTicket.category}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReplyModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Motivo original del vecino */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-1">
                <strong className="text-slate-900 block font-bold">Descripción del Requerimiento:</strong>
                <p className="italic text-slate-600 leading-relaxed">"{selectedTicket.description}"</p>
              </div>

              {/* ASISTENTE DE RESPUESTAS TIPO OFICIALES ARANPRO */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-[#0F3D2E] flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-[#D4B895]" />
                    <span>⚡ Cargar Respuesta Tipo Oficial según el Problema:</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Autocompleta texto, estado y avisos legales
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {COMPLAINT_RESPONSE_TEMPLATES.map(tmpl => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => handleSelectTemplate(tmpl)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer text-xs ${
                        replyForm.selectedTemplateId === tmpl.id
                          ? 'bg-[#0F3D2E] text-white border-[#0F3D2E] shadow-xs'
                          : 'bg-white hover:bg-[#F5F4EF] text-slate-700 border-slate-200'
                      }`}
                    >
                      <strong className="block text-[11px] leading-tight font-bold truncate">
                        {tmpl.label}
                      </strong>
                      <span className={`text-[10px] block truncate ${replyForm.selectedTemplateId === tmpl.id ? 'text-[#D4B895]' : 'text-slate-500'}`}>
                        {tmpl.category}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* CONFIGURACIÓN DE PARTE IMPLICADA Y ESTADO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#F5F4EF] p-3.5 rounded-2xl border border-[#D4B895]">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Unidad / Vecino Implicado (Contraparte denunciada):
                  </label>
                  <div className="flex items-center space-x-2">
                    <select
                      value={replyForm.implicatedUnitNumber}
                      onChange={(e) => handleImplicatedUnitChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-800"
                    >
                      <option value="">-- Sin unidad específica / Área común --</option>
                      {(currentCommunity?.units || []).map(u => (
                        <option key={u.id} value={`Casa ${u.number}`}>
                          Casa {u.number} - {u.owner}
                        </option>
                      ))}
                      <option value="Área Común / Proveedor">Área Común / Proveedor Técnico</option>
                    </select>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Permite cursar notificación formal o advertencia a la contraparte
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Estado de la Gestión en el Libro:
                  </label>
                  <select
                    value={replyForm.status}
                    onChange={(e) => setReplyForm({ ...replyForm, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-800"
                  >
                    <option value="EN_GESTION">En Gestión / Advertencia Cursada</option>
                    <option value="RESUELTO">Resuelto con Solución Informada</option>
                    <option value="PENDIENTE">Pendiente de Revisión</option>
                  </select>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Actualiza el semáforo de auditoría de la comunidad
                  </span>
                </div>
              </div>

              {/* TEXTAREA RESPUESTA OFICIAL */}
              <div className="space-y-1.5 text-xs">
                <label className="block font-bold text-slate-900">
                  Respuesta Oficial de la Administración ARANPRO (Registrada en el Libro):
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Estimado/a copropietario/a, junto con saludar le informamos que..."
                  value={replyForm.response}
                  onChange={(e) => setReplyForm({ ...replyForm, response: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium leading-relaxed focus:outline-none focus:border-[#0F3D2E]"
                />
              </div>

              {/* SECCIÓN DE AVISOS Y NOTIFICACIONES A LAS PARTES */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <Mail className="w-4 h-4 text-[#0F3D2E]" />
                  <span>Gestión de Avisos a Vecinos Implicados:</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* AVISO 1: PARA EL VECINO QUE RECLAMA */}
                  <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <strong className="text-[#0F3D2E] font-bold">
                        1. Para el Reclamante ({selectedTicket.unitNumber}):
                      </strong>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">
                        Acuse de Recibo
                      </span>
                    </div>
                    <textarea
                      rows={4}
                      value={replyForm.complainantNotice}
                      onChange={(e) => setReplyForm({ ...replyForm, complainantNotice: e.target.value })}
                      placeholder="Mensaje de respuesta para el vecino que realizó el reclamo..."
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-[11px] font-medium"
                    />
                    <div className="flex items-center justify-end space-x-2 pt-1">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(replyForm.complainantNotice, 'complainant')}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
                      >
                        {copiedComplainant ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedComplainant ? 'Copiado' : 'WhatsApp'}</span>
                      </button>
                      <a
                        href={`mailto:?subject=${encodeURIComponent(`[ARANPRO] Respuesta a Requerimiento Folio ${selectedTicket.folio}`)}&body=${encodeURIComponent(replyForm.complainantNotice)}`}
                        className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg transition-colors flex items-center space-x-1"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Enviar Email</span>
                      </a>
                    </div>
                  </div>

                  {/* AVISO 2: PARA LA UNIDAD IMPLICADA / INFRACTORA */}
                  <div className="p-3.5 bg-rose-50/70 rounded-2xl border border-rose-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <strong className="text-rose-900 font-bold">
                        2. Para la Unidad Implicada ({replyForm.implicatedUnitNumber || 'Contraparte'}):
                      </strong>
                      <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-mono font-bold">
                        Advertencia Legal
                      </span>
                    </div>
                    <textarea
                      rows={4}
                      value={replyForm.implicatedNotice}
                      onChange={(e) => setReplyForm({ ...replyForm, implicatedNotice: e.target.value })}
                      placeholder="Carta de advertencia preventiva, plazos de descargo y apercibimiento de multa..."
                      className="w-full p-2.5 rounded-xl border border-rose-200 bg-white text-[11px] font-medium"
                    />
                    <div className="flex items-center justify-end space-x-2 pt-1">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(replyForm.implicatedNotice, 'implicated')}
                        className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
                      >
                        {copiedImplicated ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedImplicated ? 'Copiado' : 'WhatsApp'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handlePrintWarningLetter}
                        className="px-2.5 py-1.5 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold rounded-lg transition-colors flex items-center space-x-1 cursor-pointer shadow-xs"
                        title="Imprimir carta formal de advertencia en formato legal para entregar a la vivienda"
                      >
                        <Printer className="w-3.5 h-3.5 text-[#D4B895]" />
                        <span>Carta PDF</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer de guardado */}
            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setShowReplyModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 cursor-pointer text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveReply}
                className="px-4 py-2 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-black rounded-xl shadow-xs cursor-pointer flex items-center space-x-1.5 text-xs"
              >
                <Check className="w-4 h-4 text-[#D4B895]" />
                <span>Guardar y Actualizar Libro Oficial</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: VISTA PREVIA E IMPRESIÓN DEL LIBRO OFICIAL (ESTÁNDAR RENDICIÓN PDF) */}
      {/* ========================================================================= */}
      {showBookPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col my-6 max-h-[92vh]">
            {/* Barra superior de control del documento */}
            <div className="p-4 bg-[#0F3D2E] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div>
                <h3 className="text-base font-black tracking-tight text-white flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-[#D4B895]" />
                  <span>Libro Oficial de Sugerencias y Reclamos</span>
                </h3>
                <p className="text-xs text-[#D4B895]">
                  {currentCommunity.name.startsWith('Condominio') ? currentCommunity.name : `Condominio ${currentCommunity.name}`} • Protocolización Ley N° 21.442
                </p>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <select
                  value={bookFilterType}
                  onChange={(e) => setBookFilterType(e.target.value)}
                  className="px-3 py-1.5 bg-white/10 text-white rounded-xl text-xs font-bold border border-white/20 focus:outline-none"
                >
                  <option value="ALL" className="text-slate-900">Todos los Registros</option>
                  <option value="Reclamo" className="text-slate-900">Solo Reclamos</option>
                  <option value="Sugerencia" className="text-slate-900">Solo Sugerencias</option>
                  <option value="PENDIENTE" className="text-slate-900">Pendientes</option>
                  <option value="EN_GESTION" className="text-slate-900">En Gestión</option>
                  <option value="RESUELTO" className="text-slate-900">Resueltos</option>
                </select>

                <button
                  type="button"
                  onClick={handlePrintOfficialBook}
                  className="px-4 py-2 bg-[#D4B895] hover:bg-[#c4a275] text-[#0F3D2E] font-black text-xs rounded-xl flex items-center space-x-1.5 cursor-pointer shadow-xs transition-all"
                  title="Imprimir documento oficial o guardar como PDF"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir / PDF Oficial</span>
                </button>

                <button
                  type="button"
                  onClick={() => downloadHtmlDocument('complaints-official-book-printable', `Libro_Reclamos_${currentCommunity.name.replace(/\s+/g, '_')}.html`)}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs transition-colors cursor-pointer"
                  title="Descargar copia de respaldo HTML"
                >
                  <Download className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowBookPrintModal(false)}
                  className="p-2 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* CUERPO DEL DOCUMENTO IMPRIMIBLE (ESTILO RENDICIÓN DE GASTOS) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100">
              <div 
                id="complaints-official-book-printable"
                className="bg-white w-full max-w-3xl mx-auto rounded-2xl shadow-md border border-slate-200 text-slate-800 font-sans p-6 sm:p-8 space-y-4 h-auto min-h-fit mb-8 print:p-0 print:m-0 print:mb-0 print:border-none print:shadow-none print:max-w-none"
              >
                {/* 1. MEMBRETE OFICIAL MAESTRO ARANPRO */}
                <div className="flex items-center justify-between border-b-2 border-[#0F3D2E] pb-3">
                  <div className="flex items-center space-x-3.5">
                    <AranproLogo className="h-10 w-auto" />
                    <div className="border-l border-slate-300 pl-3 hidden sm:block space-y-0.5">
                      <div className="text-[10px] font-black text-[#0F3D2E] uppercase tracking-wider">
                        Gestión Inmobiliaria Integral
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono">
                        RUT: 76.999.888-1 • RNAC MINVU N° 48.912 • Fono: +56 9 5811 8504
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <div className="font-black text-slate-900 text-sm leading-tight">{currentCommunity.name}</div>
                    <div className="text-slate-600 text-[10px]">{currentCommunity.address || 'Camino San Ramón 4500, La Serena'}</div>
                    <div className="text-[9.5px] font-mono text-[#0F3D2E] font-bold">
                      Fecha Emisión: {formatDate(new Date().toISOString().split('T')[0])}
                    </div>
                  </div>
                </div>

                {/* 2. TÍTULO Y MARCO LEGAL */}
                <div className="text-center py-1 space-y-1">
                  <h2 className="text-xs sm:text-sm font-black text-[#0F3D2E] uppercase tracking-wide">
                    Libro Oficial de Sugerencias y Reclamos de Copropietarios
                  </h2>
                  <p className="text-[10px] text-slate-600 max-w-2xl mx-auto leading-tight">
                    Conforme al <strong>Artículo 20° y 21° de la Ley N° 21.442</strong> sobre Copropiedad Inmobiliaria y Reglamento de Copropiedad. Detalle consolidado, trazable y foliado de requerimientos vecinales y resoluciones administrativas.
                  </p>
                </div>

                {/* 3. RESUMEN EJECUTIVO (4 KPIS ESTILO RENDICIÓN) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[9px] text-slate-500 uppercase font-bold block">Total Registros</span>
                    <span className="text-sm font-black text-slate-900 block font-mono">{printableTickets.length}</span>
                    <span className="text-[8.5px] text-slate-600 font-semibold">Foliados correlativamente</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200">
                    <span className="text-[9px] text-amber-800 uppercase font-bold block">Pendientes</span>
                    <span className="text-sm font-black text-amber-900 block font-mono">
                      {printableTickets.filter(t => t.status === 'PENDIENTE').length}
                    </span>
                    <span className="text-[8.5px] text-amber-700 font-semibold">Esperando respuesta</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-200">
                    <span className="text-[9px] text-sky-800 uppercase font-bold block">En Gestión</span>
                    <span className="text-sm font-black text-sky-900 block font-mono">
                      {printableTickets.filter(t => t.status === 'EN_GESTION').length}
                    </span>
                    <span className="text-[8.5px] text-sky-700 font-semibold">Con advertencia / acción</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                    <span className="text-[9px] text-emerald-800 uppercase font-bold block">Resueltos</span>
                    <span className="text-sm font-black text-emerald-900 block font-mono">
                      {printableTickets.filter(t => t.status === 'RESUELTO').length}
                    </span>
                    <span className="text-[8.5px] text-emerald-700 font-semibold">Conformidad registrada</span>
                  </div>
                </div>

                {/* 4. NÓMINA DETALLADA ÍTEM POR ÍTEM */}
                <div className="space-y-3 pt-2">
                  <div className="border-b border-[#0F3D2E] pb-1 text-xs font-black text-[#0F3D2E] uppercase tracking-wide flex items-center justify-between">
                    <span>1. Registro Detallado de Requerimientos y Respuestas</span>
                    <span className="font-mono text-[10px] text-slate-500">
                      {printableTickets.length} asientos registrados
                    </span>
                  </div>

                  <div className="space-y-3">
                    {printableTickets.map((t, idx) => (
                      <div 
                        key={t.id} 
                        className="p-3.5 rounded-xl border border-slate-300 text-xs space-y-2 page-break-inside-avoid bg-white"
                      >
                        {/* Cabecera del Item */}
                        <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-black text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                              {t.folio}
                            </span>
                            <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded ${
                              t.type === 'Reclamo' ? 'bg-rose-100 text-rose-900' : 'bg-emerald-100 text-emerald-900'
                            }`}>
                              {t.type.toUpperCase()}
                            </span>
                            <span className="font-bold text-slate-900">
                              {t.unitNumber} • {t.residentName}
                            </span>
                            {t.implicatedUnitNumber && (
                              <span className="text-[10px] text-rose-800 bg-rose-50 border border-rose-200 px-1.5 rounded">
                                Implicado: <strong>{t.implicatedUnitNumber}</strong>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 font-mono text-[10px] text-slate-600">
                            <span>Ingreso: {formatDate(t.date)}</span>
                            <span className={`px-1.5 py-0.5 rounded font-bold ${
                              t.status === 'RESUELTO' ? 'bg-emerald-100 text-emerald-800' :
                              t.status === 'EN_GESTION' ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {t.status === 'RESUELTO' ? 'RESUELTO' : t.status === 'EN_GESTION' ? 'EN GESTIÓN' : 'PENDIENTE'}
                            </span>
                          </div>
                        </div>

                        {/* Descripción del Hecho */}
                        <div>
                          <div className="font-bold text-slate-900 text-[11px] mb-0.5">
                            {t.title} <span className="text-[10px] font-normal text-slate-500">({t.category})</span>
                          </div>
                          <p className="text-slate-700 italic bg-slate-50 p-2 rounded-lg border border-slate-100 text-[10.5px] leading-relaxed">
                            "{t.description}"
                          </p>
                        </div>

                        {/* Respuesta Oficial */}
                        {t.adminResponse && (
                          <div className="bg-emerald-50/70 p-2 rounded-lg border border-emerald-200 text-[10.5px] space-y-1">
                            <div className="flex items-center justify-between text-[#0F3D2E] font-bold">
                              <span>✓ Respuesta Oficial Administración ARANPRO</span>
                              <span className="font-mono text-[9.5px] text-slate-500">
                                {t.adminResponseDate ? formatDate(t.adminResponseDate) : ''}
                              </span>
                            </div>
                            <p className="text-emerald-950 font-medium">
                              {t.adminResponse}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. NOTAS LEGALES AL PIE (ESTILO RENDICIÓN) */}
                <div className="pt-3 border-t border-slate-200 text-[9.5px] text-slate-500 space-y-0.5 leading-tight">
                  <p>
                    • <strong>Art. 20° Ley N° 21.442:</strong> Es función del Administrador cuidar los bienes comunes, hacer cumplir el Reglamento de Copropiedad y dar respuesta formal a las solicitudes escritas de los copropietarios.
                  </p>
                  <p>
                    • <strong>Art. 21° Ley N° 21.442:</strong> Las advertencias y sanciones cursadas forman parte de la bitácora legal del condominio y gozan de validez probatoria ante el Comité de Administración y Juzgados de Policía Local.
                  </p>
                </div>

                {/* 6. FIRMAS DE AUDITORÍA */}
                <div className="pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-xs page-break-inside-avoid">
                  <div className="space-y-1">
                    <div className="h-10 flex items-center justify-center font-mono text-emerald-800 text-[10px] italic">
                      [Firmado Electrónicamente]
                    </div>
                    <div className="border-t border-slate-400 pt-1">
                      <strong className="block text-slate-900">Administración General ARANPRO</strong>
                      <span className="text-[10px] text-slate-500">RUT: 76.999.888-1 • Reg. MINVU N° 44.201</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="h-10 flex items-center justify-center font-mono text-emerald-800 text-[10px] italic">
                      [Firmado Electrónicamente]
                    </div>
                    <div className="border-t border-slate-400 pt-1">
                      <strong className="block text-slate-900">Presidente Comité de Administración</strong>
                      <span className="text-[10px] text-slate-500">{currentCommunity.name}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONTENEDOR OCULTO PARA IMPRESIÓN DIRECTA DE CARTA DE ADVERTENCIA INDIVIDUAL */}
      {/* ========================================================================= */}
      <div id="single-warning-letter-printable" className="hidden">
        {selectedTicket && (
          <div className="p-8 font-serif text-slate-900 space-y-5 max-w-2xl mx-auto">
            {/* Membrete Maestro ARANPRO */}
            <div className="flex items-center justify-between border-b-2 border-[#0F3D2E] pb-3 font-sans">
              <div className="flex items-center space-x-3.5">
                <AranproLogo className="h-10 w-auto" />
                <div className="border-l border-slate-300 pl-3 space-y-0.5">
                  <div className="text-[10px] font-black text-[#0F3D2E] uppercase">Gestión Inmobiliaria Integral</div>
                  <div className="text-[9px] text-slate-500 font-mono">RUT: 76.999.888-1 • RNAC MINVU N° 48.912 • Fono: +56 9 5811 8504</div>
                </div>
              </div>
              <div className="text-right text-xs">
                <div className="font-bold text-slate-900">{currentCommunity.name}</div>
                <div className="text-[10px] text-slate-500 font-mono">Fecha: {formatDate(new Date().toISOString().split('T')[0])}</div>
              </div>
            </div>

            {/* Título de la Notificación */}
            <div className="text-center py-2 font-sans space-y-1">
              <span className="text-[10px] font-mono tracking-widest uppercase text-rose-700 block font-bold">
                CARTA DE NOTIFICACIÓN & ADVERTENCIA FORMAL
              </span>
              <h2 className="text-base font-black text-slate-900 uppercase">
                Apercibimiento por Infracción al Reglamento Interno
              </h2>
              <span className="text-xs font-mono font-bold text-slate-600 block">
                REF. TICKET: {selectedTicket.folio} • DESTINATARIO: {replyForm.implicatedUnitNumber || 'Unidad Implicada'}
              </span>
            </div>

            {/* Contenido Notarial / Legal */}
            <div className="text-justify text-xs sm:text-sm leading-relaxed space-y-3 font-sans">
              <p className="whitespace-pre-line text-slate-800">
                {replyForm.implicatedNotice || 'Se ha cursado advertencia formal por requerimiento vecinal registrado en el libro de reclamos.'}
              </p>
            </div>

            {/* Plazos de descargo y marco legal */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] font-sans space-y-1">
              <strong>Plazo Legal de Descargo (Ley N° 21.442):</strong>
              <p className="text-slate-600">
                El residente o copropietario notificado dispone de 48 horas hábiles contadas desde la recepción de la presente comunicación para formular sus descargos u observaciones por escrito a través del portal vecinal o al correo oficial de la administración. De no mediar descargo o en caso de reincidencia, la multa reglamentaria será aplicada en la colilla del mes en curso.
              </p>
            </div>

            {/* Firmas */}
            <div className="pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-xs font-sans items-end">
              <div className="space-y-1">
                <div className="h-16 flex items-center justify-center">
                  {companySettings?.signatureDataUrl ? (
                    <img 
                      src={companySettings.signatureDataUrl} 
                      alt="Firma Administrador" 
                      className="max-h-16 object-contain mx-auto" 
                    />
                  ) : (
                    <span className="text-xs text-slate-400 italic">Firma de la Administración</span>
                  )}
                </div>
                <div className="border-t border-slate-400 pt-1">
                  <strong>{companySettings?.adminName || companySettings?.administratorName || 'Administración General ARANPRO'}</strong>
                  <span className="block text-[10px] text-slate-500">
                    RUT: {companySettings?.companyRut || '76.999.888-1'} • RNAC N° {companySettings?.rnacNumber || '48.912'}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="h-16 flex items-center justify-center">
                  <span className="text-xs text-slate-400 italic">V°B° Comité de Administración</span>
                </div>
                <div className="border-t border-slate-400 pt-1">
                  <strong>Presidente Comité de Administración</strong>
                  <span className="block text-[10px] text-slate-500">{currentCommunity.name}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 3: INGRESO DE NUEVO REQUERIMIENTO VECINAL */}
      {/* ========================================================================= */}
      {showNewTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden space-y-4 p-5 sm:p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 bg-[#0F3D2E] text-white rounded-2xl shadow-xs">
                  <Plus className="w-5 h-5 text-[#D4B895]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Ingresar Requerimiento Vecinal</h3>
                  <p className="text-xs text-slate-500">Registro en el Libro Oficial de Copropiedad</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewTicketModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewTicket} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo de Ingreso</label>
                  <select
                    value={newTicketForm.type}
                    onChange={(e) => setNewTicketForm({ ...newTicketForm, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  >
                    <option value="Reclamo">🔴 Reclamo</option>
                    <option value="Sugerencia">💡 Sugerencia</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Prioridad</label>
                  <select
                    value={newTicketForm.priority}
                    onChange={(e) => setNewTicketForm({ ...newTicketForm, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Alta">Alta</option>
                    <option value="Urgente">Urgente</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vivienda Reclamante</label>
                  <select
                    value={newTicketForm.unitNumber}
                    onChange={(e) => {
                      const uNum = e.target.value;
                      const u = currentCommunity?.units?.find(unit => unit.number === uNum || `Casa ${unit.number}` === uNum);
                      setNewTicketForm({
                        ...newTicketForm,
                        unitNumber: uNum,
                        residentName: u?.owner || ''
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  >
                    {(currentCommunity?.units || []).map(u => (
                      <option key={u.id} value={`Casa ${u.number}`}>
                        Casa {u.number} - {u.owner}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nombre Residente</label>
                  <input
                    type="text"
                    placeholder="Nombre completo"
                    value={newTicketForm.residentName}
                    onChange={(e) => setNewTicketForm({ ...newTicketForm, residentName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Categoría</label>
                  <select
                    value={newTicketForm.category}
                    onChange={(e) => setNewTicketForm({ ...newTicketForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  >
                    <option value="Ruidos Molestos / Convivencia">Ruidos Molestos / Convivencia</option>
                    <option value="Espacios Comunes & Sustentabilidad">Espacios Comunes & Sustentabilidad</option>
                    <option value="Seguridad / Portón">Seguridad / Portón</option>
                    <option value="Mascotas & Tenencia Responsable">Mascotas & Tenencia Responsable</option>
                    <option value="Estacionamientos / Tránsito">Estacionamientos / Tránsito</option>
                    <option value="Filtraciones & Gasfitería">Filtraciones & Gasfitería</option>
                    <option value="Aseo & Jardines">Aseo & Jardines</option>
                    <option value="Gastos Comunes & Cobros">Gastos Comunes & Cobros</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Casa / Implicado (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ej: Casa 9 (si aplica)"
                    value={newTicketForm.implicatedUnitNumber}
                    onChange={(e) => setNewTicketForm({ ...newTicketForm, implicatedUnitNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Título del Reclamo / Sugerencia</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Música a volumen excesivo en horario de madrugada"
                  value={newTicketForm.title}
                  onChange={(e) => setNewTicketForm({ ...newTicketForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Detalle del Requerimiento</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describa los hechos, fechas, horas u observaciones aportadas por el vecino..."
                  value={newTicketForm.description}
                  onChange={(e) => setNewTicketForm({ ...newTicketForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewTicketModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-black rounded-xl shadow-xs cursor-pointer flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4 text-[#D4B895]" />
                  <span>Guardar en Libro de Reclamos</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
