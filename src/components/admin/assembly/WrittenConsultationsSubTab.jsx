import React, { useState } from 'react';
import { useCommunity } from '../../../context/CommunityContext';
import { 
  CheckSquare, Clock, AlertCircle, CheckCircle2, Users, 
  Send, MessageCircle, FileText, Plus, ShieldCheck, Printer, 
  Award, ArrowRight, Share2, AlertTriangle, Check, X, BookOpen,
  Calendar, Info, HelpCircle, UserCheck, UserX
} from 'lucide-react';
import { formatDate } from '../../../utils/formatters';

export const WrittenConsultationsSubTab = ({ currentCommunity, getUnitFinancials }) => {
  const { 
    castConsultationVote, 
    closeWrittenConsultation, 
    addWrittenConsultation,
    addAssemblyMinute 
  } = useCommunity();

  const consultations = currentCommunity?.writtenConsultations || [];
  const units = currentCommunity?.units || [];

  // Consulta actualmente seleccionada
  const [selectedConsId, setSelectedConsId] = useState(() => consultations[0]?.id || null);
  const activeConsultation = consultations.find(c => c.id === selectedConsId) || consultations[0];

  // Modales
  const [showNewModal, setShowNewModal] = useState(false);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [selectedUnitForVote, setSelectedUnitForVote] = useState(null);
  const [voteValue, setVoteValue] = useState('A Favor');
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const [showClosingSuccess, setShowClosingSuccess] = useState(false);

  // Formulario nueva consulta
  const [newConsForm, setNewConsForm] = useState({
    title: '',
    description: '',
    daysDuration: 20,
    requiredQuorumPct: 50.0001,
    legalBasis: 'Art. 15 inc. final y Art. 16 Ley N° 21.442'
  });

  // Cálculo de Quórum en tiempo real para la consulta activa
  const votes = activeConsultation?.votes || {};
  let totalInFavorAlicuota = 0;
  let totalAgainstAlicuota = 0;
  let totalAbstainAlicuota = 0;
  let inFavorCount = 0;
  let againstCount = 0;
  let abstainCount = 0;
  let pendingCount = 0;

  units.forEach(u => {
    const alicuota = parseFloat(u.sharePercentage) || (100 / (units.length || 1));
    const voteData = votes[u.number];
    if (voteData) {
      if (voteData.value.includes('A Favor')) {
        totalInFavorAlicuota += alicuota;
        inFavorCount++;
      } else if (voteData.value.includes('En Contra')) {
        totalAgainstAlicuota += alicuota;
        againstCount++;
      } else {
        totalAbstainAlicuota += alicuota;
        abstainCount++;
      }
    } else {
      pendingCount++;
    }
  });

  const totalRights = 100;
  const quorumRequired = activeConsultation?.requiredQuorumPct || 50.0001;
  const quorumAchieved = totalInFavorAlicuota >= quorumRequired;

  // Días restantes de la consulta activa
  const calculateDaysRemaining = (endDateStr) => {
    if (!endDateStr) return 0;
    const end = new Date(endDateStr);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const daysRemaining = calculateDaysRemaining(activeConsultation?.endDate);

  const handleOpenVoteModal = (unit) => {
    // Verificar si está inhabilitado por mora (Art. 5 Ley 21.442)
    const fin = getUnitFinancials ? getUnitFinancials(unit) : { isDelinquent: false };
    if (fin.isDelinquent && !unit.repactacion?.active) {
      alert(`La Vivienda ${unit.number} se encuentra inhabilitada conforme al Art. 5° de la Ley N° 21.442 por presentar deuda impaga de gastos comunes sin convenio.`);
      return;
    }
    setSelectedUnitForVote(unit);
    const currentVote = votes[unit.number]?.value || 'A Favor';
    setVoteValue(currentVote);
    setShowVoteModal(true);
  };

  const handleSaveVote = (e) => {
    e.preventDefault();
    if (!selectedUnitForVote || !activeConsultation) return;

    castConsultationVote(
      currentCommunity.id,
      activeConsultation.id,
      selectedUnitForVote.number,
      voteValue,
      selectedUnitForVote.owner
    );

    setShowVoteModal(false);
    setSelectedUnitForVote(null);
  };

  const handleCreateConsultation = (e) => {
    e.preventDefault();
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + parseInt(newConsForm.daysDuration || 20));

    addWrittenConsultation(currentCommunity.id, {
      title: newConsForm.title,
      description: newConsForm.description,
      legalBasis: newConsForm.legalBasis,
      requiredQuorumPct: parseFloat(newConsForm.requiredQuorumPct) || 50.0001,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    });

    setShowNewModal(false);
    setNewConsForm({
      title: '',
      description: '',
      daysDuration: 20,
      requiredQuorumPct: 50.0001,
      legalBasis: 'Art. 15 inc. final y Art. 16 Ley N° 21.442'
    });
  };

  const handleCloseAndFoliateMinute = () => {
    if (!activeConsultation) return;
    const approved = quorumAchieved;
    const finalStatus = approved ? 'CERRADA_APROBADA' : 'CERRADA_RECHAZADA';

    // 1. Cerrar la consulta
    closeWrittenConsultation(currentCommunity.id, activeConsultation.id, finalStatus);

    // 2. Generar el Acta Foliada correlativa en el Libro Oficial de Actas
    const nextFolioNum = (currentCommunity?.assemblyMinutes?.length || 0) + 1;
    const folioStr = `ACTA-${new Date().getFullYear()}-${String(nextFolioNum).padStart(3, '0')}`;

    addAssemblyMinute(currentCommunity.id, {
      folio: folioStr,
      date: new Date().toISOString().split('T')[0],
      time: '12:00 hrs (Cierre de Escrutinio Digital)',
      type: 'Consulta por Escrito (Art. 15 inc. final)',
      legalArticle: 'Art. 15 inc. final y Art. 20 Ley N° 21.442',
      place: 'Urna Digital y Plataforma ARANPRO',
      quorumAchieved: parseFloat(totalInFavorAlicuota.toFixed(2)),
      totalUnitsPresent: inFavorCount + againstCount + abstainCount,
      totalUnitsCount: units.length,
      status: 'FIRMADA_Y_FOLIADA',
      agendaItems: [
        `1. Escrutinio de Consulta por Escrito: ${activeConsultation.title}`,
        `2. Verificación de Quórum Legal de Mayoría Absoluta (${quorumRequired}% de derechos)`
      ],
      resolutions: [
        `Certificado el escrutinio de la consulta por escrito iniciada el ${formatDate(activeConsultation.startDate)} y concluida el ${formatDate(activeConsultation.endDate)}, con una participación de ${(inFavorCount + againstCount + abstainCount)} viviendas.`,
        approved
          ? `SE APRUEBA la materia consultada al haberse alcanzado un ${totalInFavorAlicuota.toFixed(2)}% de derechos en favor de la propuesta, superando el 50%+1 exigido por el Art. 15 inc. final de la Ley N° 21.442. El presente acuerdo es plenamente vinculante y ejecutable para todas las unidades del condominio.`
          : `SE RECHAZA la materia consultada por no haber alcanzado el 50%+1 de los derechos totales del condominio (se obtuvo un ${totalInFavorAlicuota.toFixed(2)}% de respaldo).`,
        `Se procede a protocolizar el resultado en el Libro Oficial de Actas Foliadas del Condominio ${currentCommunity.name}.`
      ],
      notes: `Generada automáticamente desde la Urna Digital Folio ${activeConsultation.folio}.`
    });

    setShowClosingSuccess(true);
  };

  const getWhatsAppInvitation = () => {
    if (!activeConsultation) return '';
    return `🗳️ *CONSULTA POR ESCRITO DIGITAL - ${currentCommunity.name.toUpperCase()}*\n_Conforme al Art. 15 inc. final de la Ley N° 21.442_\n\nEstimado/a Copropietario/a,\n\nSe ha habilitado la Urna Digital para la votación de la siguiente materia oficial:\n\n📋 *Materia:* ${activeConsultation.title}\n\n📖 *Fundamento:* ${activeConsultation.legalBasis}\n\n⏱️ *Plazo de Votación:* Hasta el ${formatDate(activeConsultation.endDate)} (${daysRemaining} días restantes).\n\n⚖️ *Quórum Requerido:* Mayoría absoluta de todos los derechos de la comunidad (50% + 1).\n\n📲 *¿Cómo emitir su voto?:*\nIngrese a su portal de copropietario o responda directamente este mensaje señalando: (1) A Favor, (2) En Contra, o (3) Abstención, indicando su N° de casa y RUT.\n\n_Administración ARANPRO Gestión Integral_`;
  };

  const copyWhatsApp = () => {
    navigator.clipboard.writeText(getWhatsAppInvitation());
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 2500);
  };

  return (
    <div className="space-y-4">
      {/* 1. SELECCIÓN DE CONSULTAS ESCRITAS DISPONIBLES */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center space-x-2 overflow-x-auto">
          {consultations.map(cons => (
            <button
              key={cons.id}
              type="button"
              onClick={() => setSelectedConsId(cons.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
                activeConsultation?.id === cons.id
                  ? 'bg-[#0F3D2E] text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/20">
                {cons.folio}
              </span>
              <span className="truncate max-w-[200px]">{cons.title}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-black ${
                cons.status === 'ACTIVA' ? 'bg-emerald-500 text-white' : 'bg-slate-400 text-white'
              }`}>
                {cons.status}
              </span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowNewModal(true)}
          className="px-3.5 py-2 bg-gradient-to-r from-[#0F3D2E] to-[#14533d] text-[#D4B895] border border-[#D4B895] font-black text-xs rounded-xl flex items-center shrink-0 shadow-xs cursor-pointer hover:from-[#0A291F]"
        >
          <Plus className="w-3.5 h-3.5 mr-1 text-[#D4B895]" />
          + Nueva Consulta por Escrito
        </button>
      </div>

      {activeConsultation ? (
        <>
          {/* 2. PANEL DE ESCRUTINIO & QUÓRUM EN VIVO */}
          <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            {/* Encabezado de la Consulta */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center space-x-2 flex-wrap">
                  <span className="px-2 py-0.5 text-xs font-mono font-black bg-slate-900 text-white rounded-md">
                    {activeConsultation.folio}
                  </span>
                  <span className="px-2 py-0.5 text-xs font-black bg-emerald-100 text-emerald-900 rounded-md border border-emerald-300">
                    {activeConsultation.legalBasis}
                  </span>
                  <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-900 rounded-md border border-amber-300 flex items-center space-x-1">
                    <Clock className="w-3 h-3 mr-1 text-amber-700" />
                    <span>Plazo Legal: {daysRemaining} días restantes (Cierre: {formatDate(activeConsultation.endDate)})</span>
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900 tracking-tight mt-1.5">
                  {activeConsultation.title}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  {activeConsultation.description}
                </p>
              </div>

              {/* Botones de acción superior */}
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={copyWhatsApp}
                  className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs rounded-xl flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{copiedWhatsApp ? '¡Copiado!' : 'Compartir WhatsApp'}</span>
                </button>

                {activeConsultation.status === 'ACTIVA' && (
                  <button
                    type="button"
                    onClick={handleCloseAndFoliateMinute}
                    className="px-3.5 py-2 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-black text-xs rounded-xl flex items-center space-x-1.5 shadow-xs cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-[#D4B895]" />
                    <span>Cerrar & Foliar Acta</span>
                  </button>
                )}
              </div>
            </div>

            {/* TERMÓMETRO LEGAL DE APROBACIÓN */}
            <div className={`p-4 rounded-2xl border space-y-3 transition-all ${
              quorumAchieved 
                ? 'bg-gradient-to-r from-emerald-50 via-white to-emerald-50/50 border-emerald-300' 
                : 'bg-gradient-to-r from-amber-50 via-white to-amber-50/50 border-amber-300'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <div className={`p-2 rounded-xl text-white ${quorumAchieved ? 'bg-emerald-600' : 'bg-amber-600'}`}>
                    {quorumAchieved ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">
                      {quorumAchieved ? '¡QUÓRUM LEGAL ALCANZADO Y APROBADO!' : 'En Proceso de Consulta Digital'}
                    </h4>
                    <p className="text-xs text-slate-600">
                      Exigencia Art. 15 inc. final: <strong>Mayoría Absoluta ({quorumRequired.toFixed(1)}% de derechos totales)</strong>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-black font-mono text-[#0F3D2E]">
                    {totalInFavorAlicuota.toFixed(2)}%
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold block">
                    Alícuota a Favor ({inFavorCount} de {units.length} casas)
                  </span>
                </div>
              </div>

              {/* Barra de progreso visual con marca de quórum */}
              <div className="space-y-1">
                <div className="relative w-full h-4 bg-slate-200 rounded-full overflow-hidden flex">
                  {/* Votos a Favor */}
                  <div 
                    style={{ width: `${totalInFavorAlicuota}%` }}
                    className="bg-emerald-600 transition-all duration-500"
                    title={`A Favor: ${totalInFavorAlicuota.toFixed(2)}%`}
                  />
                  {/* Votos En Contra */}
                  <div 
                    style={{ width: `${totalAgainstAlicuota}%` }}
                    className="bg-rose-600 transition-all duration-500"
                    title={`En Contra: ${totalAgainstAlicuota.toFixed(2)}%`}
                  />
                  {/* Abstenciones */}
                  <div 
                    style={{ width: `${totalAbstainAlicuota}%` }}
                    className="bg-slate-400 transition-all duration-500"
                    title={`Abstención: ${totalAbstainAlicuota.toFixed(2)}%`}
                  />
                  {/* Marcador vertical del 50.01% */}
                  <div 
                    style={{ left: '50.01%' }}
                    className="absolute top-0 bottom-0 w-0.5 bg-slate-900 z-10"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-emerald-700">✓ A Favor: {totalInFavorAlicuota.toFixed(2)}% ({inFavorCount} votos)</span>
                  <span className="text-slate-900">Meta Ley: 50.01%</span>
                  <span className="text-rose-700">✗ En Contra: {totalAgainstAlicuota.toFixed(2)}% ({againstCount} votos)</span>
                  <span className="text-slate-500">Abstenciones: {totalAbstainAlicuota.toFixed(2)}% ({abstainCount})</span>
                  <span className="text-amber-700">⏳ Pendientes: {pendingCount}</span>
                </div>
              </div>
            </div>

            {/* 3. GRILLA DE VOTACIÓN UNIDAD POR UNIDAD (16 CASAS) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Urna Digital: Escrutinio por Vivienda & Certificación Art. 5°
                </h4>
                <span className="text-[11px] text-slate-500">
                  Haga clic en una vivienda para registrar o modificar el voto por escrito
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                {units.map(unit => {
                  const fin = getUnitFinancials ? getUnitFinancials(unit) : { isDelinquent: false };
                  const isDelinquent = fin.isDelinquent && !unit.repactacion?.active;
                  const vote = votes[unit.number];
                  const alicuota = parseFloat(unit.sharePercentage) || (100 / (units.length || 1));

                  return (
                    <div
                      key={unit.id}
                      onClick={() => !isDelinquent && handleOpenVoteModal(unit)}
                      className={`p-3 rounded-xl border transition-all text-xs flex flex-col justify-between space-y-2 cursor-pointer ${
                        isDelinquent 
                          ? 'bg-rose-50/70 border-rose-200 opacity-70 cursor-not-allowed'
                          : vote?.value?.includes('A Favor')
                            ? 'bg-emerald-50/80 border-emerald-300 hover:border-emerald-500 shadow-2xs'
                            : vote?.value?.includes('En Contra')
                              ? 'bg-rose-50/80 border-rose-300 hover:border-rose-500 shadow-2xs'
                              : vote?.value?.includes('Abstención')
                                ? 'bg-slate-100 border-slate-300'
                                : 'bg-white border-slate-200 hover:border-slate-400 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-slate-900">
                          Casa {unit.number}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500">
                          {alicuota.toFixed(2)}%
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="text-[11px] font-bold text-slate-800 truncate">
                          {unit.owner}
                        </div>
                        {isDelinquent ? (
                          <span className="text-[9.5px] font-bold text-rose-700 flex items-center space-x-1 mt-0.5">
                            <UserX className="w-3 h-3 mr-0.5" />
                            <span>Inhabilitado Art. 5° (Mora)</span>
                          </span>
                        ) : (
                          <span className="text-[9.5px] text-emerald-700 font-bold flex items-center space-x-1 mt-0.5">
                            <UserCheck className="w-3 h-3 mr-0.5" />
                            <span>Habilitado para Votar</span>
                          </span>
                        )}
                      </div>

                      <div className="pt-1.5 border-t border-slate-200/60 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500">Voto:</span>
                        {isDelinquent ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-200 text-rose-950">
                            Bloqueado
                          </span>
                        ) : vote ? (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            vote.value.includes('A Favor')
                              ? 'bg-emerald-600 text-white'
                              : vote.value.includes('En Contra')
                                ? 'bg-rose-600 text-white'
                                : 'bg-slate-500 text-white'
                          }`}>
                            {vote.value}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            ⏳ Pendiente
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
          No hay consultas por escrito registradas.
        </div>
      )}

      {/* MODAL: REGISTRAR / CAMBIAR VOTO DE LA VIVIENDA */}
      {showVoteModal && selectedUnitForVote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden space-y-4 p-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-[#0F3D2E] text-white rounded-xl">
                  <CheckSquare className="w-5 h-5 text-[#D4B895]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Emitir Voto: Casa {selectedUnitForVote.number}
                  </h3>
                  <p className="text-xs text-slate-500">{selectedUnitForVote.owner}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVoteModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
              <strong>Consulta:</strong>
              <p className="font-bold text-[#0F3D2E]">{activeConsultation?.title}</p>
            </div>

            <form onSubmit={handleSaveVote} className="space-y-3 text-xs">
              <label className="block font-bold text-slate-700">Seleccione el sentido del voto:</label>
              <div className="space-y-2">
                <label className="flex items-center space-x-3 p-3 rounded-xl border border-emerald-300 bg-emerald-50 cursor-pointer">
                  <input
                    type="radio"
                    name="voteOption"
                    value="A Favor"
                    checked={voteValue === 'A Favor'}
                    onChange={(e) => setVoteValue(e.target.value)}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-black text-emerald-950 block">✓ A Favor (Aprueba la propuesta)</span>
                    <span className="text-[11px] text-emerald-800">Suma {((parseFloat(selectedUnitForVote.sharePercentage) || 6.25)).toFixed(2)}% de derechos al quórum de aprobación</span>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-3 rounded-xl border border-rose-300 bg-rose-50 cursor-pointer">
                  <input
                    type="radio"
                    name="voteOption"
                    value="En Contra"
                    checked={voteValue === 'En Contra'}
                    onChange={(e) => setVoteValue(e.target.value)}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <span className="font-black text-rose-950 block">✗ En Contra (Rechaza la propuesta)</span>
                    <span className="text-[11px] text-rose-800">Registra disconformidad con el acuerdo consultado</span>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-3 rounded-xl border border-slate-300 bg-slate-50 cursor-pointer">
                  <input
                    type="radio"
                    name="voteOption"
                    value="Abstención"
                    checked={voteValue === 'Abstención'}
                    onChange={(e) => setVoteValue(e.target.value)}
                    className="text-slate-600 focus:ring-slate-500"
                  />
                  <div>
                    <span className="font-bold text-slate-800 block">Abstención</span>
                    <span className="text-[11px] text-slate-600">Participa del proceso sin manifestar preferencia</span>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowVoteModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-black rounded-xl shadow-xs cursor-pointer flex items-center space-x-1"
                >
                  <Check className="w-4 h-4 text-[#D4B895]" />
                  <span>Guardar Voto en Urna</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NUEVA CONSULTA POR ESCRITO */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden space-y-4 p-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-[#0F3D2E] text-white rounded-xl">
                  <Plus className="w-5 h-5 text-[#D4B895]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Convocar Consulta por Escrito Digital
                  </h3>
                  <p className="text-xs text-slate-500">Ley N° 21.442 Art. 15 inc. final</p>
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

            <form onSubmit={handleCreateConsultation} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Título de la Materia a Consultar</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Aprobación de Cuota Extraordinaria para Pintura Perimetral"
                  value={newConsForm.title}
                  onChange={(e) => setNewConsForm({ ...newConsForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Fundamento & Detalle de la Propuesta</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explique el alcance técnico, costos presupuestados y forma de pago..."
                  value={newConsForm.description}
                  onChange={(e) => setNewConsForm({ ...newConsForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Plazo de Votación (Días corridos)</label>
                  <input
                    type="number"
                    min="15"
                    max="30"
                    required
                    value={newConsForm.daysDuration}
                    onChange={(e) => setNewConsForm({ ...newConsForm, daysDuration: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-500">Ley exige entre 15 y 30 días</span>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Quórum Aprobación (%)</label>
                  <input
                    type="number"
                    readOnly
                    value={50.01}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-slate-700"
                  />
                  <span className="text-[10px] text-slate-500">Mayoría Absoluta total (50%+1)</span>
                </div>
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
                  <span>Publicar en Urna Digital</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AVISO DE CIERRE Y FOLIACIÓN EXITOSA */}
      {showClosingSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden space-y-4 p-5 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">¡Acta Oficial Foliada con Éxito!</h3>
              <p className="text-xs text-slate-600 mt-1">
                La consulta ha sido cerrada y convertida automáticamente en un acta oficial protocolizada en la pestaña <strong>3. Libro Oficial de Actas Foliadas</strong>.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowClosingSuccess(false)}
              className="w-full py-2 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-black text-xs rounded-xl shadow-xs cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
