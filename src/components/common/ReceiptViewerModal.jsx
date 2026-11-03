import React from 'react';
import { useCommunity } from '../../context/CommunityContext';
import { formatCLP, formatDate } from '../../utils/formatters';
import { printDocumentDirectly } from '../../utils/printDocument';
import { X, ExternalLink, FileText, CheckCircle, ShieldCheck, Printer, AlertCircle } from 'lucide-react';

export const ReceiptViewerModal = () => {
  const { activeReceipt, setActiveReceipt } = useCommunity();

  if (!activeReceipt) return null;

  const isPaid = activeReceipt.status === 'pagado';
  const isReserveFund = activeReceipt.fundSource === 'fondo_reserva';

  const handlePrintReceipt = () => {
    const docNum = (activeReceipt.documentNumber || 'SN').replace(/[^a-zA-Z0-9_-]/g, '_');
    const prov = (activeReceipt.provider || 'Proveedor').replace(/\s+/g, '_');
    printDocumentDirectly('receipt-modal-printable-content', `Respaldo_Gasto_${docNum}_${prov}`, { fitPage: true });
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-xs transition-opacity animate-fade-in"
      onClick={() => setActiveReceipt(null)}
    >
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#D4B895] flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0F3D2E] text-white border-b border-[#D4B895]/30 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/10 text-[#D4B895] rounded-2xl border border-[#D4B895]/40 shadow-2xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">
                  Ficha Oficial de Respaldo Contable
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isPaid ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}>
                  {isPaid ? '● PAGADO' : '○ PENDIENTE DE PAGO'}
                </span>
              </div>
              <p className="text-xs text-[#D4B895]">
                {activeReceipt.documentType || 'Documento Tributario'} • Folio: {activeReceipt.documentNumber || 'S/N'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveReceipt(null)}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            title="Cerrar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#F5F4EF] border-b border-[#D4B895]/50 text-xs shrink-0">
          <div>
            <span className="text-[#4A4F4F] block text-[10px] uppercase font-bold">Proveedor / RUT</span>
            <span className="font-bold text-[#0F3D2E] truncate block" title={activeReceipt.provider}>
              {activeReceipt.provider || 'No especificado'}
            </span>
            {activeReceipt.providerRut && (
              <span className="text-[11px] font-mono text-slate-500 block">
                {activeReceipt.providerRut}
              </span>
            )}
          </div>
          <div>
            <span className="text-[#4A4F4F] block text-[10px] uppercase font-bold">Fecha Emisión</span>
            <span className="font-semibold text-slate-800">
              {formatDate(activeReceipt.date)}
            </span>
            {activeReceipt.paymentDate && (
              <span className="text-[10px] text-emerald-700 block">
                Pagado: {formatDate(activeReceipt.paymentDate)}
              </span>
            )}
          </div>
          <div>
            <span className="text-[#4A4F4F] block text-[10px] uppercase font-bold">Monto Total</span>
            <span className="font-black text-[#0F3D2E] text-base">
              {formatCLP(activeReceipt.amount)}
            </span>
            <span className={`text-[10px] font-bold block ${isReserveFund ? 'text-amber-700' : 'text-slate-600'}`}>
              {isReserveFund ? 'Fondo de Reserva' : 'Gasto Ordinario'}
            </span>
          </div>
          <div>
            <span className="text-[#4A4F4F] block text-[10px] uppercase font-bold">Visación Comité</span>
            {activeReceipt.approvedByCommittee ? (
              <span className="inline-flex items-center text-emerald-700 font-bold text-xs">
                <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                Aprobado {activeReceipt.approvedAt ? `(${formatDate(activeReceipt.approvedAt)})` : ''}
              </span>
            ) : (
              <span className="inline-flex items-center text-amber-700 font-medium text-xs">
                <AlertCircle className="w-3.5 h-3.5 mr-1 text-amber-600" />
                En revisión
              </span>
            )}
            {activeReceipt.paymentReference && (
              <span className="text-[10px] text-slate-500 block truncate" title={activeReceipt.paymentReference}>
                Ref: {activeReceipt.paymentReference}
              </span>
            )}
          </div>
        </div>

        {/* Content / Preview */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50 text-center">
          {activeReceipt.description && (
            <div className="text-xs sm:text-sm text-slate-800 mb-4 bg-white p-3.5 rounded-2xl border border-slate-200 text-left shadow-2xs">
              <span className="font-bold text-[#0F3D2E] block uppercase text-[10px] tracking-wider mb-0.5">Glosa / Detalle del Gasto:</span>
              <p className="font-medium text-slate-700">{activeReceipt.description}</p>
            </div>
          )}

          {activeReceipt.receiptUrl ? (
            activeReceipt.receiptUrl.startsWith('data:application/pdf') || activeReceipt.receiptUrl.toLowerCase().endsWith('.pdf') ? (
              <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white w-full">
                <iframe
                  src={activeReceipt.receiptUrl}
                  title={`Respaldo PDF ${activeReceipt.documentNumber}`}
                  className="w-full h-96 border-0"
                />
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white inline-block max-w-full p-2">
                <img
                  src={activeReceipt.receiptUrl}
                  alt={`Respaldo ${activeReceipt.documentNumber}`}
                  className="max-h-96 w-auto object-contain mx-auto rounded-xl"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://placehold.co/600x400/f8fafc/475569?text=Comprobante+Digital+Almacenado';
                  }}
                />
              </div>
            )
          ) : (
            <div className="py-10 px-4 bg-white rounded-2xl border-2 border-dashed border-slate-300 text-slate-500">
              <FileText className="w-12 h-12 mx-auto mb-2 text-slate-400" />
              <p className="text-sm font-bold text-slate-800">Comprobante físico archivado en carpeta de la comunidad</p>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                El documento tributario original se encuentra resguardado por la administración para auditorías y fiscalizaciones conforme a la Ley N° 21.442.
              </p>
            </div>
          )}

          {activeReceipt.receiptNotes && (
            <div className="mt-4 text-xs text-[#0F3D2E] text-left bg-[#F5F4EF] border border-[#D4B895]/50 rounded-2xl p-3.5">
              <span className="font-bold text-[#0F3D2E] uppercase text-[10px] tracking-wider block mb-0.5">Nota de Administración ARANPRO:</span>
              <p className="text-slate-700">{activeReceipt.receiptNotes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-white border-t border-slate-200 shrink-0">
          <div className="flex items-center text-xs text-[#0F3D2E] font-bold">
            <ShieldCheck className="w-4 h-4 mr-1.5 text-emerald-600" />
            <span className="hidden sm:inline">Transparencia Total ARANPRO • </span>Respaldo Ley N° 21.442
          </div>
          <div className="flex items-center space-x-2">
            {activeReceipt.receiptUrl && (
              <a
                href={activeReceipt.receiptUrl}
                target="_blank"
                rel="noreferrer"
                download={activeReceipt.fileName || `Respaldo_${activeReceipt.documentNumber || 'Gasto'}`}
                className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-[#0F3D2E] bg-[#F5F4EF] hover:bg-[#D4B895]/40 rounded-xl transition-colors border border-[#D4B895]"
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1.5 text-[#0F3D2E]" />
                Abrir / Descargar
              </a>
            )}
            <button
              onClick={() => setActiveReceipt(null)}
              className="px-4 py-1.5 text-xs font-bold text-white bg-[#0F3D2E] hover:bg-[#0A291F] rounded-xl transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
