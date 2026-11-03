import React, { useState } from 'react';
import { useCommunity } from '../../context/CommunityContext';
import { MauranLogo } from '../common/MauranLogo';
import { formatRut } from '../../utils/formatters';
import { Building2, Shield, User, KeyRound, ArrowRight, ArrowLeft, AlertCircle, HelpCircle } from 'lucide-react';

export const ResidentLogin = ({ communitySlug, onBack, onSuccess }) => {
  const { communities, loginResident } = useCommunity();
  const community = communities.find(c => c.slug === communitySlug);

  const [rutInput, setRutInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState('');

  if (!community) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-[#D4B895] text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h3 className="text-lg font-bold text-[#0F3D2E]">Comunidad no encontrada</h3>
          <p className="text-sm text-[#4A4F4F]">
            El enlace que abriste no corresponde a una comunidad registrada en ARANPRO.
          </p>
          <button
            onClick={onBack}
            className="px-5 py-2.5 bg-[#0F3D2E] text-white text-sm font-semibold rounded-xl"
          >
            Ver todas las comunidades
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const res = loginResident(community.slug, rutInput, passwordInput);
    if (res.success) {
      if (onSuccess) onSuccess();
    } else {
      setError(res.message);
    }
  };

  // Ayudante de acceso rápido para pruebas
  const handleQuickDemo = (unitNumber, rut) => {
    setRutInput(rut || unitNumber);
    setPasswordInput(unitNumber);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 bg-[#F5F4EF]">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-[#D4B895] overflow-hidden">
        
        {/* Community Header */}
        <div className="p-6 bg-gradient-to-br from-[#0A291F] via-[#0F3D2E] to-[#0F3D2E] text-white relative">
          <button
            onClick={onBack}
            className="inline-flex items-center text-xs text-[#D4B895] hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Cambiar de comunidad
          </button>

          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#0F3D2E] border border-[#0F3D2E] flex items-center justify-center text-white font-bold shrink-0 p-1">
              <MauranLogo variant="isotipo" size="sm" />
            </div>
            <div>
              <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-[#0F3D2E]/40 text-[#D4B895] border border-[#D4B895]/30 rounded-md">
                Portal Exclusivo ARANPRO
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {community.name}
              </h2>
              <p className="text-xs text-[#F5F4EF]/80">
                {community.address}, {community.city}
              </p>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-[#0F3D2E]">Ingreso de Propietario / Residente</h3>
            <p className="text-xs text-[#4A4F4F]">
              Ingresa tu RUT y tu clave asignada (por defecto es el número de tu casa).
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#0F3D2E] uppercase tracking-wider mb-1">
                RUT o N° de Unidad *
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3.5 text-[#4A4F4F]" />
                <input
                  type="text"
                  required
                  placeholder="Ej: 15.420.312-4 o número de casa"
                  value={rutInput}
                  onChange={(e) => setRutInput(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E9EBE8] text-sm focus:ring-2 focus:ring-[#0F3D2E] focus:outline-hidden"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-[#0F3D2E] uppercase tracking-wider">
                  Contraseña *
                </label>
                <span className="text-[11px] text-[#4A4F4F]">
                  Default: N° de casa
                </span>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-3.5 text-[#4A4F4F]" />
                <input
                  type="password"
                  required
                  placeholder="Tu clave (ej: 1, 2, 3...)"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E9EBE8] text-sm focus:ring-2 focus:ring-[#0F3D2E] focus:outline-hidden"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-semibold text-sm rounded-xl shadow-md transition-all flex items-center justify-center border border-[#0F3D2E]"
            >
              <span>Entrar al Portal</span>
              <ArrowRight className="w-4 h-4 ml-2 text-[#D4B895]" />
            </button>
          </form>

          {/* Quick Demo Access Bar */}
          <div className="pt-4 border-t border-[#F5F4EF]">
            <div className="flex items-center space-x-1 text-xs text-[#4A4F4F] mb-2">
              <HelpCircle className="w-3.5 h-3.5 text-[#0F3D2E]" />
              <span className="font-semibold text-[#0F3D2E]">Acceso rápido para demostración:</span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickDemo('1', '15.420.312-4')}
                className="px-2.5 py-1 bg-[#F5F4EF] hover:bg-[#D4B895]/40 text-[#0F3D2E] rounded-lg border border-[#D4B895]/50 transition-colors"
              >
                Casa 1 (Al Día)
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('3', '16.230.984-2')}
                className="px-2.5 py-1 bg-[#F5F4EF] hover:bg-rose-50 hover:text-rose-700 text-[#0F3D2E] rounded-lg border border-[#D4B895] transition-colors"
              >
                Casa 3 (Con Deuda)
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('6', '18.402.193-K')}
                className="px-2.5 py-1 bg-[#F5F4EF] hover:bg-rose-50 hover:text-rose-700 text-[#0F3D2E] rounded-lg border border-[#D4B895] transition-colors"
              >
                Casa 6 (Morosa)
              </button>
            </div>
          </div>

        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-[#F5F4EF] border-t border-[#F5F4EF] text-center text-[11px] text-[#4A4F4F]">
          ¿No recuerdas tu contraseña? Solicita restablecimiento a ARANPRO.
        </div>

      </div>
    </div>
  );
};
