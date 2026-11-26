import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, AlertTriangle, CheckCircle2, Copy, Check, Printer, 
  ArrowLeft, FileText, Calendar, Building2, User, Landmark, Scale, Share2
} from 'lucide-react';
import { formatCLP, formatDate, formatRut } from '../../utils/formatters';
import { certificateVerificationService } from '../../services/supabase';
import { AranproLogo, AranproOfficialSeal } from '../common/MauranLogo';

export const PublicCertificateVerificationView = ({ folio: initialFolio, hash: initialHash, onBackToPortal }) => {
  const [folio, setFolio] = useState(initialFolio || '');
  const [hash, setHash] = useState(initialHash || '');
  const [loading, setLoading] = useState(true);
  const [verificationResult, setVerificationResult] = useState(null);
  const [copiedClause, setCopiedClause] = useState(false);
  const [manualFolioInput, setManualFolioInput] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function runVerification() {
      if (!folio) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const res = await certificateVerificationService.verifyCertificate(folio, hash);
      if (isMounted) {
        setVerificationResult(res);
        setLoading(false);
      }
    }
    runVerification();
    return () => { isMounted = false; };
  }, [folio, hash]);

  const handleManualSearch = (e) => {
    e.preventDefault();
    if (!manualFolioInput.trim()) return;
    setFolio(manualFolioInput.trim());
    setHash('');
  };

  const cert = verificationResult?.certificate;

  // Cláusula notarial para copiar
  const generateNotaryClause = () => {
    if (!cert) return '';
    const dateFormatted = cert.issued_at ? formatDate(cert.issued_at) : 'Fecha sin informar';
    const isNoDebt = (cert.cert_type || '').includes('No Deuda') || (cert.cert_type || '').includes('al Día');

    if (isNoDebt) {
      return `CLÁUSULA NOTARIAL (CERTIFICACIÓN DE NO DEUDA GASTOS COMUNES):\n` +
        `En cumplimiento de los Artículos 20° y 36° de la Ley N° 21.442 sobre Copropiedad Inmobiliaria, se inserta en la presente escritura el Certificado Oficial Folio N° ${cert.folio} (Cód. Verificación ${cert.verification_code}), expedido por la Administración de "${cert.community_name}", en el que se acredita que la Unidad correspondiente a la Casa/Departamento N° ${cert.unit_number}, de propiedad de don(a) ${cert.applicant_name} (RUT ${cert.applicant_rut}), se encuentra con sus gastos comunes ordinarios y extraordinarios TOTALMENTE AL DÍA al ${dateFormatted}, sin adeudar suma alguna por dicho concepto ni mantener convenios morosos pendientes.`;
    }

    return `CLÁUSULA NOTARIAL (DEUDA POR GASTOS COMUNES Y RETENCIÓN NOTARIAL):\n` +
      `En cumplimiento del Artículo 36° de la Ley N° 21.442 sobre Copropiedad Inmobiliaria, se inserta en la presente el Certificado Oficial Folio N° ${cert.folio} (Cód. Verificación ${cert.verification_code}), emitido por la Administración de "${cert.community_name}", en el que se acredita que la Unidad Casa/Depto N° ${cert.unit_number} mantiene una deuda líquida y exigible de $${(cert.debt_amount || 0).toLocaleString('es-CL')} pesos chilenos por concepto de gastos comunes. De conformidad a la ley, se deja expresa constancia de la retención notarial respectiva de los fondos del precio de venta para su pago directo a la comunidad.`;
  };

  const handleCopyClause = () => {
    const text = generateNotaryClause();
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedClause(true);
      setTimeout(() => setCopiedClause(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-8 px-4 sm:px-6 lg:px-8 flex flex-col justify-between font-sans">
      <div className="max-w-3xl w-full mx-auto space-y-6">
        
        {/* Cabecera Superior con Botón de Regreso */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AranproLogo variant="principal" className="h-10 w-auto" />
            <div className="border-l border-slate-700 pl-3">
              <span className="text-xs font-black tracking-wider text-[#D4B895] uppercase block">
                PORTAL PÚBLICO DE VERIFICACIÓN
              </span>
              <span className="text-[10px] text-slate-400">
                Ley N° 21.442 de Copropiedad Inmobiliaria
              </span>
            </div>
          </div>

          {onBackToPortal && (
            <button
              onClick={onBackToPortal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Ingresar a la Plataforma
            </button>
          )}
        </div>

        {/* CONTENIDO PRINCIPAL */}
        {loading ? (
          <div className="bg-slate-800/80 rounded-3xl p-12 text-center border border-slate-700 space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-[#D4B895] border-t-transparent animate-spin mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Consultando Registro Notarial...</h3>
              <p className="text-xs text-slate-400">Verificando autenticidad del folio {folio} en la base de datos de ARANPRO</p>
            </div>
          </div>
        ) : verificationResult?.success && cert ? (
          /* RESULTADO: CERTIFICADO AUTÉNTICO */
          <div className="bg-white text-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-emerald-500/30">
            {/* Banner Superior Verde */}
            <div className="bg-gradient-to-r from-emerald-800 to-emerald-900 text-white p-6 md:p-8 flex items-center justify-between relative overflow-hidden">
              <div className="relative z-10 flex items-center space-x-4">
                <div className="p-3.5 bg-emerald-700/80 rounded-2xl border border-emerald-400/40 shadow-inner">
                  <ShieldCheck className="w-8 h-8 text-emerald-200" />
                </div>
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/30 text-emerald-100 border border-emerald-400/40 mb-1">
                    ✔ DOCUMENTO AUTÉNTICO VERIFICADO
                  </span>
                  <h2 className="text-xl md:text-2xl font-black tracking-tight text-white">
                    {cert.cert_type}
                  </h2>
                  <p className="text-xs text-emerald-100/90 font-mono">
                    FOLIO: {cert.folio} • CÓDIGO HASH: {cert.verification_code}
                  </p>
                </div>
              </div>

              <div className="hidden sm:block">
                <AranproOfficialSeal variant="dorado" className="w-20 h-20 opacity-90" />
              </div>
            </div>

            {/* Cuerpo del Certificado Verificado */}
            <div className="p-6 md:p-8 space-y-6">
              {/* Cuadrícula de Datos Clave */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Condominio / Comunidad</span>
                  <span className="text-sm font-black text-slate-900">{cert.community_name}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Unidad Registrada</span>
                  <span className="text-sm font-black text-[#0F3D2E]">Unidad / Casa / Depto {cert.unit_number}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Titular / Solicitante</span>
                  <span className="font-bold text-slate-800">{cert.applicant_name}</span>
                  <span className="text-slate-500 block text-[11px]">RUT: {cert.applicant_rut || 'Sin informar'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Estado de Deuda Certificado</span>
                  {cert.debt_amount > 0 ? (
                    <span className="font-black text-rose-700 font-mono text-sm">
                      {formatCLP(cert.debt_amount)} (Deuda Líquida)
                    </span>
                  ) : (
                    <span className="font-black text-emerald-700 text-sm">
                      $0 • Totalmente al Día (Sin Deuda)
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Fecha de Emisión</span>
                  <span className="font-bold text-slate-800">{formatDate(cert.issued_at)}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Vigencia Legal (30 Días)</span>
                  <span className={`font-bold ${verificationResult.isExpired ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {verificationResult.isExpired ? '⚠ Vencido' : `Válido hasta ${formatDate(cert.expires_at)}`}
                  </span>
                </div>
              </div>

              {/* Administrador Emisor */}
              <div className="p-4 bg-[#F5F4EF] rounded-2xl border border-[#D4B895]/50 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <Landmark className="w-5 h-5 text-[#0F3D2E]" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Emitido y Firmado por:</span>
                    <span className="font-bold text-slate-900">{cert.issued_by}</span>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  RNAC Vigente
                </span>
              </div>

              {/* Cláusula Notarial Sugerida */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-[#0F3D2E] tracking-wider flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-[#0F3D2E]" />
                    Cláusula Sugerida para Escritura Pública / Notaría
                  </span>
                  <button
                    onClick={handleCopyClause}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#0F3D2E] hover:underline cursor-pointer"
                  >
                    {copiedClause ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedClause ? '¡Copiada!' : 'Copiar Cláusula'}
                  </button>
                </div>
                <div className="bg-slate-100 p-4 rounded-xl text-xs text-slate-700 font-mono leading-relaxed border border-slate-200">
                  {generateNotaryClause()}
                </div>
              </div>

              {/* Respaldo Legal */}
              <div className="text-[11px] text-slate-500 space-y-1 border-t border-slate-200 pt-4">
                <strong>Marco Regulatorio Ley N° 21.442:</strong>
                <p>
                  De conformidad a los Artículos 20° N° 9 y 36° de la Ley de Copropiedad Inmobiliaria, la administración es el único órgano facultado para certificar el estado de deudas de las unidades. Este registro digital goza de plena validez para escrituras públicas, compraventas, arriendos y salvoconductos de mudanza.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* RESULTADO: NO ENCONTRADO O INVÁLIDO */
          <div className="bg-slate-800 rounded-3xl p-8 md:p-12 text-center border border-rose-500/30 space-y-5">
            <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <h2 className="text-xl font-black text-white">Certificado No Encontrado o Inválido</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                El folio <strong>{folio || '(vacío)'}</strong> no corresponde a un certificado emitido oficialmente o el código hash no coincide con los antecedentes registrales de la administración.
              </p>
            </div>

            {/* Buscador Manual alternativo */}
            <form onSubmit={handleManualSearch} className="max-w-md mx-auto flex gap-2 pt-2">
              <input
                type="text"
                placeholder="Ingresar otro Folio (ej: CERT-2026-001)"
                value={manualFolioInput}
                onChange={(e) => setManualFolioInput(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-[#D4B895]"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-[#D4B895] hover:bg-[#c2a47e] text-[#0F3D2E] font-black text-xs transition-all cursor-pointer"
              >
                Verificar
              </button>
            </form>
          </div>
        )}

        {/* Pie de Página */}
        <div className="text-center text-xs text-slate-500 space-y-1">
          <div>ARANPRO • Gestión Integral Inmobiliaria • Administrador John Andrés Arancibia (RNAC N° 48.912)</div>
          <div className="text-[10px] text-slate-600">
            Sistema de Verificación Digital y Prevención de Fraudes Notariales • Conexión en tiempo real con Supabase
          </div>
        </div>

      </div>
    </div>
  );
};
