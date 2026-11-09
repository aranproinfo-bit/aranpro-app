import React, { useState } from 'react';
import { useCommunity } from '../../context/CommunityContext';
import { MauranLogo } from '../common/MauranLogo';
import { formatRut } from '../../utils/formatters';
import { Building2, Shield, User, KeyRound, ArrowRight, ArrowLeft, AlertCircle, HelpCircle, CheckCircle2, Sparkles } from 'lucide-react';

export const ResidentLogin = ({ communitySlug, onBack, onSuccess, isDemo = false }) => {
  const { communities, loginResident } = useCommunity();
  const community = communities.find(c => c.slug === communitySlug) || communities[0];

  // Detectar automáticamente si la URL contiene parámetro de demo
  const isDemoActive = Boolean(
    isDemo || 
    (typeof window !== 'undefined' && window.location.search.includes('demo'))
  );

  const [showManualForm, setShowManualForm] = useState(!isDemoActive);
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

  // Inicio de sesión directo en 1 clic (SIN FORMULARIOS NI ERRORES DE VALIDACIÓN)
  const handleInstantDemoLogin = (unitNumber, rut) => {
    setError('');
    const res = loginResident(community.slug, rut || unitNumber, unitNumber);
    if (res.success) {
      if (onSuccess) onSuccess();
    } else {
      setError(res.message);
    }
  };

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

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 bg-[#F5F4EF]">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-[#D4B895] overflow-hidden transition-all">
        
        {/* Cabecera Principal */}
        <div className="p-6 sm:p-7 bg-gradient-to-br from-[#0A291F] via-[#0F3D2E] to-[#0F3D2E] text-white relative">
          <button
            onClick={onBack}
            className="inline-flex items-center text-xs text-[#D4B895] hover:text-white mb-4 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            {isDemoActive ? 'Volver al Inicio' : 'Cambiar de comunidad'}
          </button>

          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-[#D4B895]/40 flex items-center justify-center text-white font-bold shrink-0 p-1 shadow-xs">
              <MauranLogo variant="isotipo" size="sm" />
            </div>
            <div>
              <span className="px-2 py-0.5 text-[9.5px] font-black tracking-wider uppercase bg-[#D4B895] text-[#0F3D2E] rounded-md inline-block">
                {isDemoActive ? '★ ENTORNO DE DEMOSTRACIÓN OFICIAL ARANPRO' : 'Portal Exclusivo ARANPRO'}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1 leading-tight">
                {isDemoActive ? 'Comunidad Demostración ARANPRO' : community.name}
              </h2>
              <p className="text-xs text-[#F5F4EF]/80">
                {isDemoActive ? 'Condominio Piloto Interactivo • Ley N° 21.442' : `${community.address}, ${community.city}`}
              </p>
            </div>
          </div>
        </div>

        {/* CONTENIDO 1: MODO DEMOSTRACIÓN EXCLUSIVO (1-CLIC DIRECTO SIN FORMULARIOS) */}
        {isDemoActive && !showManualForm ? (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="space-y-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 text-xs font-black text-[#0F3D2E] uppercase tracking-wide">
                <Sparkles className="w-4 h-4 text-[#D4B895]" />
                <span>Prueba Interactiva en Vivo</span>
              </div>
              <h3 className="text-lg font-black text-[#0F3D2E]">
                Selecciona el perfil que deseas evaluar
              </h3>
              <p className="text-xs text-[#4A4F4F] leading-relaxed">
                Sin necesidad de ingresar RUTs ni recordar contraseñas. Haz clic en cualquiera de los dos perfiles para ingresar al portal de inmediato:
              </p>
            </div>

            {error && (
              <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {/* BOTONES PRINCIPALES DE ACCESO EN 1 CLIC */}
            <div className="space-y-3.5">
              
              {/* Opción 1: Comité de Administración */}
              <button
                type="button"
                onClick={() => handleInstantDemoLogin('1', '15.420.312-4')}
                className="w-full p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#0F3D2E] via-[#0A291F] to-[#0F3D2E] text-white text-left transition-all shadow-md hover:shadow-xl hover:border-[#D4B895] border-2 border-transparent group cursor-pointer active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xl">🛡️</span>
                      <span className="font-black text-sm uppercase tracking-wide text-white">
                        Entrar como Integrante del Comité
                      </span>
                      <span className="px-2 py-0.5 rounded text-[9.5px] font-black bg-[#D4B895] text-[#0F3D2E]">
                        Casa 1 • Presidente
                      </span>
                    </div>
                    <p className="text-[11.5px] text-white/85 leading-snug">
                      Auditoría bancaria permanente, cartolas en vivo, respaldos digitales de cada factura o boleta a un clic, libro de reclamos y aprobaciones.
                    </p>
                    <div className="text-[10.5px] text-[#D4B895] font-bold flex items-center gap-1 pt-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#D4B895]" />
                      <span>1 Clic: Acceso inmediato sin clave</span>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-1 group-hover:bg-[#D4B895] group-hover:text-[#0F3D2E] transition-colors">
                    <ArrowRight className="w-4 h-4 text-[#D4B895] group-hover:text-[#0F3D2E] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </button>

              {/* Opción 2: Copropietario / Residente al Día */}
              <button
                type="button"
                onClick={() => handleInstantDemoLogin('6', '18.402.193-K')}
                className="w-full p-4 sm:p-5 rounded-2xl bg-white hover:bg-slate-50 border-2 border-[#0F3D2E] text-left transition-all shadow-md hover:shadow-xl group cursor-pointer active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xl">🏠</span>
                      <span className="font-black text-sm uppercase tracking-wide text-[#0F3D2E]">
                        Entrar como Copropietario / Residente
                      </span>
                      <span className="px-2 py-0.5 rounded text-[9.5px] font-black bg-emerald-100 text-emerald-800">
                        Casa 6 • Al Día
                      </span>
                    </div>
                    <p className="text-[11.5px] text-slate-600 leading-snug">
                      Colilla oficial descargable en PDF con desglose de fondo de reserva (Art. 39°), botón de pago online simulado y mural de avisos comunitarios.
                    </p>
                    <div className="text-[10.5px] text-emerald-700 font-bold flex items-center gap-1 pt-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>1 Clic: Acceso inmediato sin clave</span>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-1 group-hover:bg-[#0F3D2E] group-hover:text-white transition-colors">
                    <ArrowRight className="w-4 h-4 text-[#0F3D2E] group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </button>

              {/* Opción 3 (Secundaria): Vecino con Deuda Histórica */}
              <button
                type="button"
                onClick={() => handleInstantDemoLogin('3', '16.230.984-2')}
                className="w-full p-3 sm:p-3.5 rounded-xl bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-left transition-all flex items-center justify-between gap-2 group cursor-pointer"
              >
                <div className="space-y-0.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">⚠️</span>
                    <span className="font-bold text-xs text-slate-800">
                      Probar como Vecino con Saldo Pendiente (Casa 3)
                    </span>
                    <span className="text-[9px] text-rose-700 font-bold bg-rose-100 px-1.5 py-0.5 rounded">
                      Cobranza & Convenios
                    </span>
                  </div>
                  <p className="text-[10.5px] text-slate-500 leading-tight">
                    Evalúa cómo la app gestiona convenios de pago, cobros de intereses y trazabilidad según Ley N° 21.442.
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-1 transition-transform shrink-0" />
              </button>

            </div>

            {/* Enlace alternativo para login manual si se desea */}
            <div className="pt-2 text-center border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowManualForm(true)}
                className="text-[11px] text-slate-500 hover:text-[#0F3D2E] underline font-medium cursor-pointer"
              >
                ¿Deseas ingresar con credenciales manuales a una comunidad específica?
              </button>
            </div>
          </div>
        ) : (
          /* CONTENIDO 2: FORMULARIO TRADICIONAL (CON ACCESOS RÁPIDOS 1-CLIC CORREGIDOS) */
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
                className="w-full py-3 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-semibold text-sm rounded-xl shadow-md transition-all flex items-center justify-center border border-[#0F3D2E] cursor-pointer"
              >
                <span>Entrar al Portal</span>
                <ArrowRight className="w-4 h-4 ml-2 text-[#D4B895]" />
              </button>
            </form>

            {/* Accesos rápidos corregidos: 1 solo toque inicia sesión directo */}
            <div className="pt-4 border-t border-[#F5F4EF] space-y-2">
              <div className="flex items-center space-x-1 text-xs text-[#4A4F4F]">
                <HelpCircle className="w-3.5 h-3.5 text-[#0F3D2E]" />
                <span className="font-semibold text-[#0F3D2E]">Acceso rápido para evaluación (1-clic directo):</span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleInstantDemoLogin('1', '15.420.312-4')}
                  className="px-3 py-1.5 bg-[#0F3D2E] text-[#D4B895] hover:bg-[#0A291F] font-bold rounded-lg border border-[#D4B895]/50 transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                >
                  <span>🛡️ Casa 1 (Comité)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleInstantDemoLogin('6', '18.402.193-K')}
                  className="px-3 py-1.5 bg-[#F5F4EF] hover:bg-emerald-50 text-[#0F3D2E] font-bold rounded-lg border border-[#D4B895] transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                >
                  <span>🏠 Casa 6 (Al Día)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleInstantDemoLogin('3', '16.230.984-2')}
                  className="px-3 py-1.5 bg-[#F5F4EF] hover:bg-rose-50 hover:text-rose-700 text-[#0F3D2E] font-bold rounded-lg border border-[#D4B895] transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                >
                  <span>⚠️ Casa 3 (Con Deuda)</span>
                </button>
              </div>
            </div>

            {isDemoActive && (
              <div className="text-center pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowManualForm(false)}
                  className="text-xs text-[#0F3D2E] hover:underline font-bold cursor-pointer"
                >
                  ← Volver a los botones directos de Demostración
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer info */}
        <div className="px-6 py-3 bg-[#F5F4EF] border-t border-[#F5F4EF] text-center text-[11px] text-[#4A4F4F]">
          {isDemoActive ? 'ARANPRO • Suite de Gestión y Copropiedad Inmobiliaria Ley N° 21.442' : '¿No recuerdas tu contraseña? Solicita restablecimiento a ARANPRO.'}
        </div>

      </div>
    </div>
  );
};
