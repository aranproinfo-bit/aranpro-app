import React, { useState } from 'react';
import { useCommunity } from '../../context/CommunityContext';
import { formatRut } from '../../utils/formatters';
import { FileText, CheckCircle2, X, Send, Building } from 'lucide-react';

export const CertificateModal = ({ isOpen, onClose }) => {
  const { communities, requestCertificate } = useCommunity();
  const [formData, setFormData] = useState({
    communityName: communities[0]?.name || '',
    applicantName: '',
    rut: '',
    unitNumber: '',
    email: '',
    phone: '',
    type: 'Certificado de Residencia',
    purpose: 'Trámite Bancario / Escolar'
  });
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    requestCertificate(formData);
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F3D2E]/75 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#D4B895] overflow-hidden relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-[#4A4F4F] hover:text-[#0F3D2E] rounded-full hover:bg-[#F5F4EF]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 bg-[#F5F4EF] border-b border-[#D4B895]">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-[#0F3D2E] text-[#D4B895] rounded-2xl shadow-xs">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0F3D2E]">
                Solicitud de Certificado Oficial
              </h3>
              <p className="text-xs text-[#4A4F4F]">
                Certificados de residencia o copropietario al día validados por ARANPRO
              </p>
            </div>
          </div>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-[#F5F4EF] text-[#0F3D2E] border border-[#0F3D2E] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-lg font-bold text-[#0F3D2E]">¡Solicitud Enviada con Éxito!</h4>
            <p className="text-sm text-[#4A4F4F] max-w-sm mx-auto">
              La administración ha recibido tu solicitud. Verificaremos los registros de la unidad <strong>Casa {formData.unitNumber}</strong> y recibirás el documento timbrado en tu correo electrónico ({formData.email}) en un plazo máximo de 24 horas hábiles.
            </p>
            <button
              onClick={handleReset}
              className="mt-4 px-6 py-2.5 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-semibold text-sm rounded-xl transition-colors"
            >
              Entendido
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#0F3D2E] uppercase tracking-wider mb-1">
                Comunidad / Condominio *
              </label>
              <select
                required
                value={formData.communityName}
                onChange={(e) => setFormData({ ...formData, communityName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9EBE8] text-sm focus:ring-2 focus:ring-[#0F3D2E] focus:outline-hidden"
              >
                {communities.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name} ({c.city})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#0F3D2E] uppercase tracking-wider mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Juan Pérez Morales"
                  value={formData.applicantName}
                  onChange={(e) => setFormData({ ...formData, applicantName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9EBE8] text-sm focus:ring-2 focus:ring-[#0F3D2E] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F3D2E] uppercase tracking-wider mb-1">
                  RUT del Solicitante *
                </label>
                <input
                  type="text"
                  required
                  placeholder="12.345.678-9"
                  value={formData.rut}
                  onChange={(e) => setFormData({ ...formData, rut: formatRut(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9EBE8] text-sm focus:ring-2 focus:ring-[#0F3D2E] focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#0F3D2E] uppercase tracking-wider mb-1">
                  N° de Casa / Depto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 14"
                  value={formData.unitNumber}
                  onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9EBE8] text-sm focus:ring-2 focus:ring-[#0F3D2E] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F3D2E] uppercase tracking-wider mb-1">
                  Tipo de Documento *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9EBE8] text-sm focus:ring-2 focus:ring-[#0F3D2E] focus:outline-hidden"
                >
                  <option value="Certificado de Residencia">Certificado de Residencia</option>
                  <option value="Certificado de Copropietario al Día">Certificado de Gasto Común al Día</option>
                  <option value="Constancia de Arrendatario">Constancia de Residente Arrendatario</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#0F3D2E] uppercase tracking-wider mb-1">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  required
                  placeholder="tucorreo@ejemplo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9EBE8] text-sm focus:ring-2 focus:ring-[#0F3D2E] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F3D2E] uppercase tracking-wider mb-1">
                  Teléfono / WhatsApp
                </label>
                <input
                  type="tel"
                  placeholder="+56 9 1234 5678"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9EBE8] text-sm focus:ring-2 focus:ring-[#0F3D2E] focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F3D2E] uppercase tracking-wider mb-1">
                Finalidad / Motivo
              </label>
              <input
                type="text"
                placeholder="Ej: Licencia de conducir, colegio, banco, etc."
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9EBE8] text-sm focus:ring-2 focus:ring-[#0F3D2E] focus:outline-hidden"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center shadow-md border border-[#0F3D2E]"
              >
                <Send className="w-4 h-4 mr-2 text-[#D4B895]" />
                Enviar Solicitud
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
