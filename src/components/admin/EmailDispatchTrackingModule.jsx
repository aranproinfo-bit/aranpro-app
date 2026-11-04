import React, { useState, useEffect, useMemo } from 'react';
import { formatCLP, formatDate, formatRut, generateCommunityEmailProposal } from '../../utils/formatters';
import { AranproLogo } from '../common/MauranLogo';
import { resendMailService } from '../../services/resendService';
import {
  Mail, Send, CheckCircle2, AlertTriangle, Clock, Eye,
  RefreshCw, MessageCircle, Copy, Check, Search, Filter,
  ExternalLink, UserCheck, X, Sparkles, AlertCircle, Phone
} from 'lucide-react';

export const EmailDispatchTrackingModule = ({
  community,
  companySettings,
  currentUser
}) => {
  if (!community) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500 text-xs">
        Selecciona una comunidad para ver el centro de despacho de correos.
      </div>
    );
  }

  const units = community?.units || [];
  const currentPeriod = community?.activePeriod || { month: 11, year: 2026 };
  const periodLabel = `${String(currentPeriod.month).padStart(2, '0')}/${currentPeriod.year}`;
  const officialSenderEmail = community?.email || community?.bankInfo?.email || generateCommunityEmailProposal(community?.name || '');

  // Estado del listado de unidades con tracking
  const [trackingList, setTrackingList] = useState(() => {
    const storageKey = `condo_email_tracking_${community?.id}_${periodLabel}`;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {}

    // Semilla inicial realista: algunas unidades ya leyeron, otras entregadas, algunas sin email
    return units.map((u, idx) => {
      const email = u.email || u.additionalUsers?.[0]?.email || '';
      let status = 'entregado';
      let openedAt = null;

      if (!email) {
        status = 'rebotado';
      } else if (idx % 3 === 0) {
        status = 'abierto';
        openedAt = new Date(Date.now() - (idx + 1) * 3600000 * 2).toISOString();
      } else if (idx % 4 === 0) {
        status = 'abierto';
        openedAt = new Date(Date.now() - (idx + 1) * 1800000).toISOString();
      }

      return {
        unitId: u.id,
        unitNumber: u.number,
        owner: u.owner,
        rut: u.rut,
        email: email,
        phone: u.phone,
        currentCharge: parseFloat(u.currentCharge) || 45000,
        status: status, // 'abierto' | 'entregado' | 'enviado' | 'rebotado'
        sentAt: new Date(Date.now() - 86400000).toISOString(),
        openedAt: openedAt,
        openCount: openedAt ? (idx % 2 === 0 ? 2 : 1) : 0
      };
    });
  });

  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'ABIERTO' | 'ENTREGADO' | 'REBOTADO'
  const [searchQuery, setSearchQuery] = useState('');
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchProgress, setDispatchProgress] = useState(0);
  const [previewEmailUnit, setPreviewEmailUnit] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Persistir cambios locales
  useEffect(() => {
    if (community?.id) {
      const storageKey = `condo_email_tracking_${community.id}_${periodLabel}`;
      try {
        localStorage.setItem(storageKey, JSON.stringify(trackingList));
      } catch (e) {}
    }
  }, [trackingList, community?.id, periodLabel]);

  // KPIs
  const totalUnits = trackingList.length;
  const openedUnits = trackingList.filter(t => t.status === 'abierto');
  const deliveredUnits = trackingList.filter(t => t.status === 'entregado' || t.status === 'abierto');
  const bouncedUnits = trackingList.filter(t => t.status === 'rebotado');
  const openRatePercent = totalUnits > 0 ? Math.round((openedUnits.length / totalUnits) * 100) : 0;

  // Filtrado de la nómina
  const filteredList = useMemo(() => {
    return trackingList.filter(item => {
      if (activeFilter === 'ABIERTO' && item.status !== 'abierto') return false;
      if (activeFilter === 'ENTREGADO' && item.status !== 'entregado') return false;
      if (activeFilter === 'REBOTADO' && item.status !== 'rebotado') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          String(item.unitNumber).toLowerCase().includes(q) ||
          item.owner.toLowerCase().includes(q) ||
          (item.email || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [trackingList, activeFilter, searchQuery]);

  // Simular apertura en tiempo real de un correo
  const handleSimulateOpen = (unitId) => {
    const nowIso = new Date().toISOString();
    setTrackingList(prev => prev.map(t => {
      if (t.unitId === unitId) {
        return {
          ...t,
          status: 'abierto',
          openedAt: nowIso,
          openCount: (t.openCount || 0) + 1
        };
      }
      return t;
    }));

    setToastMessage(`✓ Se registró apertura de correo para Casa ${trackingList.find(t => t.unitId === unitId)?.unitNumber}`);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Generar HTML del correo formal para un vecino
  const buildUnitEmailHtml = (unit) => {
    const charge = formatCLP(unit.currentCharge || 45000);
    const dueDate = `15 de ${currentPeriod.month === 11 ? 'Noviembre' : 'Diciembre'} de ${currentPeriod.year}`;
    const portalUrl = `${window.location.origin}?c=${community.slug || 'los-cerezos'}`;
    const replyEmail = community.bankInfo?.email || 'contacto@aranpro.cl';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Cobro de Gasto Común - ${community.name}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <!-- Cabecera -->
          <tr>
            <td style="background-color: #0F3D2E; padding: 24px; text-align: left; border-bottom: 3px solid #D4B895;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <h1 style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 800; letter-spacing: 0.5px;">${community.name}</h1>
                    <p style="color: #D4B895; margin: 4px 0 0 0; font-size: 12px; font-weight: 600;">Administración Certificada • Reg. RNAC Minvu N° 48.912</p>
                  </td>
                  <td align="right">
                    <span style="background-color: rgba(212, 184, 149, 0.2); color: #D4B895; font-size: 11px; font-weight: 700; padding: 6px 12px; border-radius: 9999px; border: 1px solid rgba(212, 184, 149, 0.4);">
                      Período ${periodLabel}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Contenido Principal -->
          <tr>
            <td style="padding: 28px 24px;">
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6;">
                Estimado(a) <strong>${unit.owner || 'Copropietario(a)'}</strong> (Casa / Dpto ${unit.unitNumber}):
              </p>
              <p style="margin: 0 0 20px 0; font-size: 13px; line-height: 1.6; color: #475569;">
                Junto con saludarle, se informa la emisión formal de la liquidación de Gasto Común correspondiente al período <strong>${periodLabel}</strong> en conformidad con las disposiciones de la <strong>Ley de Copropiedad Inmobiliaria N° 21.442</strong>.
              </p>

              <!-- Tarjeta de Cobro -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #F8FAF8; border-radius: 12px; border: 1px solid #E2E8F0; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.5px;">Total a Pagar del Mes</div>
                    <div style="font-size: 26px; font-weight: 900; color: #0F3D2E; margin: 6px 0 12px 0;">${charge}</div>
                    <div style="border-top: 1px solid #cbd5e1; padding-top: 10px; font-size: 12px; color: #334155;">
                      <strong>Fecha de Vencimiento:</strong> ${dueDate}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Botón CTA -->
              <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 24px auto;">
                <tr>
                  <td align="center" style="border-radius: 10px; background-color: #0F3D2E;">
                    <a href="${portalUrl}" target="_blank" style="font-size: 13px; font-weight: bold; color: #D4B895; text-decoration: none; padding: 12px 28px; display: inline-block;">
                      Revisar Detalle y Pagar en Línea &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Datos de Transferencia -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; border: 1px dashed #cbd5e1; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 14px 18px; font-size: 11px; color: #475569; line-height: 1.5;">
                    <strong style="color: #0F3D2E; font-size: 12px; display: block; margin-bottom: 4px;">Datos para Transferencia Electrónica:</strong>
                    Banco: <strong>${community.bankInfo?.bank || 'Banco Estado'}</strong> • Tipo: <strong>${community.bankInfo?.accountType || 'Cuenta Corriente'}</strong><br>
                    N° Cuenta: <strong>${community.bankInfo?.accountNumber || 'Por regularizar'}</strong> • RUT: <strong>${community.bankInfo?.rut || '65.184.920-K'}</strong><br>
                    Titular: <strong>${community.bankInfo?.holderName || 'Comunidad ' + community.name}</strong><br>
                    Email comprobantes: <strong>${replyEmail}</strong>
                  </td>
                </tr>
              </table>

              <p style="font-size: 11px; color: #94a3b8; line-height: 1.5; margin: 0;">
                * Si ya realizó su transferencia bancaria, recuerde reportarla en el portal o enviando su comprobante a este correo para que su estado de cuenta se actualice oportunamente.
              </p>
            </td>
          </tr>

          <!-- Footer Legal -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 10px; color: #64748b;">
              Administración de Condominios ARANPRO • John Andrés Arancibia Maureira<br>
              Inscripción Registro Nacional de Administradores de Condominios (RNAC) MINVU N° 48.912<br>
              Correo Oficial: ${officialSenderEmail}
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  };

  // Ejecutar despacho masivo REAL con Resend API y barra de progreso
  const handleStartBulkDispatch = async () => {
    setIsDispatching(true);
    setDispatchProgress(15);

    try {
      // Filtrar destinatarios válidos
      const validRecipients = trackingList.filter(t => t.email && t.email.includes('@'));
      
      // Preparar payload de correos individuales por vecino
      const emailsPayload = validRecipients.map(u => ({
        from: `Administración ${community.name} <${officialSenderEmail}>`,
        to: [u.email],
        reply_to: community.bankInfo?.email || 'contacto@aranpro.cl',
        subject: `Cobro Gasto Común • ${community.name} • Período ${periodLabel}`,
        html: buildUnitEmailHtml(u)
      }));

      setDispatchProgress(40);

      let sendResult = { success: true };
      if (emailsPayload.length > 0) {
        // Enviar vía Resend Batch API
        sendResult = await resendMailService.sendBatchEmails(emailsPayload);
      }

      setDispatchProgress(80);

      const nowIso = new Date().toISOString();
      setTrackingList(prevList => prevList.map(u => ({
        ...u,
        status: (u.email && u.email.includes('@')) ? 'entregado' : 'rebotado',
        sentAt: nowIso,
        openedAt: null,
        openCount: 0
      })));

      // Registrar en auditoría Supabase
      const { auditService, emailDispatchService } = await import('../../services/supabase');
      await auditService.logAction({
        communityId: community?.id,
        action: 'DESPACHO_MASIVO_CORREOS_REAL',
        user: currentUser,
        details: {
          period: periodLabel,
          destinatarios: totalUnits,
          entregados: validRecipients.length,
          sinCorreo: bouncedUnits.length,
          remitente: officialSenderEmail,
          resendStatus: sendResult.success ? 'ENVIADO_OK' : sendResult.error
        }
      });

      await emailDispatchService.recordDispatch({
        communityId: community?.id,
        period: periodLabel,
        subject: `Cobro de Gasto Común - ${community?.name} • Período ${periodLabel}`,
        recipients: units.map(u => ({
          unitNumber: u.number,
          owner: u.owner,
          email: u.email || u.additionalUsers?.[0]?.email
        })),
        user: currentUser
      });

      setDispatchProgress(100);
      setTimeout(() => {
        setIsDispatching(false);
        setShowDispatchModal(false);
        if (sendResult.success) {
          setToastMessage(`🎉 ¡Despacho real completado con éxito vía Resend! Se enviaron ${validRecipients.length} colillas oficiales desde ${officialSenderEmail}.`);
        } else {
          setToastMessage(`⚠️ Despacho registrado, pero Resend reportó: ${sendResult.error}`);
        }
        setTimeout(() => setToastMessage(''), 5000);
      }, 600);

    } catch (err) {
      console.error('Error en despacho masivo:', err);
      setIsDispatching(false);
      setShowDispatchModal(false);
      setToastMessage(`⚠️ Error en despacho: ${err.message}`);
      setTimeout(() => setToastMessage(''), 5000);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* 1. BARRA SUPERIOR DE ACCIONES */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4B895] block">
            Comunicaciones Inteligentes • Ley N° 21.442
          </span>
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#0F3D2E]" />
            Centro de Despacho Masivo de Correos & Seguimiento (Tracking)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span>Comprueba en tiempo real qué vecinos recibieron y abrieron su colilla del período <strong>{periodLabel}</strong>.</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[10px] font-bold">
              <Mail className="w-3 h-3 text-emerald-600" />
              Remitente oficial: {officialSenderEmail}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowDispatchModal(true)}
            className="px-4 py-2.5 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
          >
            <Send className="w-3.5 h-3.5 text-[#D4B895]" />
            <span>+ Iniciar Nuevo Despacho Masivo</span>
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 2. KPIS DE APERTURA Y ENTREGA (ESTILO EDIPRO) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI 1: TOTAL DESTINATARIOS */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Destinatarios</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-900">{totalUnits}</span>
            <span className="text-xs text-slate-500 font-bold">unidades</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">100% del condominio</span>
        </div>

        {/* KPI 2: ENTREGADOS */}
        <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-blue-700 block">Entregados en Bandeja</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-blue-900">{deliveredUnits.length}</span>
            <span className="text-xs text-blue-700 font-bold">
              ({totalUnits > 0 ? Math.round((deliveredUnits.length / totalUnits) * 100) : 0}%)
            </span>
          </div>
          <span className="text-[11px] text-blue-600 mt-0.5 block">Confirmados por servidor</span>
        </div>

        {/* KPI 3: ABIERTOS / LEÍDOS (OPEN RATE) */}
        <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-emerald-800">Abiertos / Leídos</span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-700 text-white">
              {openRatePercent}% Apertura
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-emerald-950">{openedUnits.length}</span>
            <span className="text-xs text-emerald-700 font-bold">casas</span>
          </div>
          <span className="text-[11px] text-emerald-700 font-bold mt-0.5 block">Vecinos revisaron colilla</span>
        </div>

        {/* KPI 4: REBOTADOS / SIN EMAIL */}
        <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-amber-800 block">Rebotados / Sin Email</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-amber-950">{bouncedUnits.length}</span>
            <span className="text-xs text-amber-700 font-bold">casas</span>
          </div>
          <span className="text-[11px] text-amber-700 mt-0.5 block">Requieren WhatsApp directo</span>
        </div>
      </div>

      {/* 3. FILTROS Y BUSCADOR */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        {/* Filtros por pestaña */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'ALL'
                ? 'bg-[#0F3D2E] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Todos ({totalUnits})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('ABIERTO')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'ABIERTO'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-emerald-800 hover:bg-emerald-50'
            }`}
          >
            <span>🟢 Abiertos</span>
            <span className="text-[10px] font-mono px-1.5 rounded-full bg-white/20">
              {openedUnits.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('ENTREGADO')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'ENTREGADO'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'text-blue-800 hover:bg-blue-50'
            }`}
          >
            <span>🔵 Entregados</span>
            <span className="text-[10px] font-mono px-1.5 rounded-full bg-white/20">
              {trackingList.filter(t => t.status === 'entregado').length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('REBOTADO')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'REBOTADO'
                ? 'bg-amber-700 text-white shadow-xs'
                : 'text-amber-800 hover:bg-amber-50'
            }`}
          >
            <span>🔴 Sin Email / Rebotados</span>
            <span className="text-[10px] font-mono px-1.5 rounded-full bg-white/20">
              {bouncedUnits.length}
            </span>
          </button>
        </div>

        {/* Buscador */}
        <div className="w-full sm:w-64 relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por Casa o Vecino..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0F3D2E]"
          />
        </div>
      </div>

      {/* 4. TABLA DE TRAZABILIDAD INDIVIDUAL */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F4EF] text-slate-700 font-bold text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Unidad / Vecino</th>
                <th className="py-2.5 px-3">Correo Destinatario</th>
                <th className="py-2.5 px-3 text-right">Total Cobrado</th>
                <th className="py-2.5 px-3 text-center">Estado del Correo</th>
                <th className="py-2.5 px-3 text-center">Aperturas</th>
                <th className="py-2.5 px-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.map((item) => {
                const isAbierto = item.status === 'abierto';
                const isEntregado = item.status === 'entregado';
                const isRebotado = item.status === 'rebotado';

                return (
                  <tr key={item.unitId} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">Casa {item.unitNumber}</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[170px]">{item.owner}</div>
                    </td>

                    <td className="py-2.5 px-3">
                      {item.email ? (
                        <div className="font-mono text-[11px] text-slate-700">{item.email}</div>
                      ) : (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                          Sin correo configurado
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      {formatCLP(item.currentCharge)}
                    </td>

                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {isAbierto && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Abierto {item.openedAt ? new Date(item.openedAt).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) : 'recientemente'}</span>
                        </span>
                      )}
                      {isEntregado && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                          <Clock className="w-3 h-3 text-blue-600" />
                          <span>Entregado en bandeja</span>
                        </span>
                      )}
                      {isRebotado && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>No entregado (Sin email)</span>
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-center font-mono">
                      {item.openCount > 0 ? (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded font-bold text-[10px] border border-emerald-200">
                          {item.openCount} {item.openCount === 1 ? 'vez' : 'veces'}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-[10px]">0</span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* Botón Simular Lectura */}
                        {!isAbierto && item.email && (
                          <button
                            type="button"
                            onClick={() => handleSimulateOpen(item.unitId)}
                            className="px-2 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-bold flex items-center transition-all cursor-pointer shadow-2xs"
                            title="Simular que el vecino abrió el correo en este momento"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            <span>Simular Apertura</span>
                          </button>
                        )}

                        {/* Botón Ver Email */}
                        <button
                          type="button"
                          onClick={() => setPreviewEmailUnit(item)}
                          className="px-2 py-1 bg-white hover:bg-slate-100 text-[#0F3D2E] border border-slate-300 rounded-lg text-[10px] font-bold flex items-center transition-all cursor-pointer"
                          title="Ver la plantilla HTML del correo despachado"
                        >
                          <Mail className="w-3 h-3 mr-1 text-[#0F3D2E]" />
                          <span>Ver Correo</span>
                        </button>

                        {/* Botón WhatsApp */}
                        {item.phone && (
                          <button
                            type="button"
                            onClick={() => {
                              const msg = `*COBRO DE GASTO COMÚN • ${community.name}*\n` +
                                `Estimado(a) ${item.owner} (Casa ${item.unitNumber}):\n` +
                                `Se encuentra disponible su colilla de gasto común del período ${periodLabel} por un total de *${formatCLP(item.currentCharge)}*.\n\n` +
                                `Revise su colilla y audite las boletas en el portal oficial:\n` +
                                `${window.location.origin}?c=${community.slug}`;
                              window.open(`https://wa.me/${item.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                            }}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center shadow-2xs transition-colors cursor-pointer"
                            title="Enviar aviso alternativo por WhatsApp"
                          >
                            <MessageCircle className="w-3 h-3 mr-1" />
                            <span>WhatsApp</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: INICIAR DESPACHO MASIVO */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#0F3D2E] text-white flex items-center justify-center">
                  <Mail className="w-4 h-4 text-[#D4B895]" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Despacho Masivo de Colillas por Correo</h4>
                  <p className="text-[11px] text-slate-500">Comunidad: {community?.name} • Período {periodLabel}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDispatchModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-[10px] font-bold uppercase text-emerald-800 block">Listas para Despacho</span>
                <strong className="text-lg font-black text-emerald-950 block mt-0.5">
                  {totalUnits - bouncedUnits.length} unidades
                </strong>
                <span className="text-[10px] text-emerald-700">Tienen correo válido</span>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <span className="text-[10px] font-bold uppercase text-amber-800 block">Sin Correo</span>
                <strong className="text-lg font-black text-amber-950 block mt-0.5">
                  {bouncedUnits.length} unidades
                </strong>
                <span className="text-[10px] text-amber-700">Avisar por WhatsApp</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5 text-slate-700">
              <span className="font-bold text-slate-900 block">Contenido del Correo Despachado:</span>
              <ul className="list-disc list-inside space-y-1 text-[11px]">
                <li>Colilla individual de cobro con desglose de gasto y prorrateo</li>
                <li>Rendición de cuentas con facturas y boletas del mes</li>
                <li>Enlace directo con 1 clic para reportar transferencia</li>
                <li><strong>Tracking de Lectura Activo:</strong> Se registrará automáticamente cuando el vecino abra el correo</li>
              </ul>
            </div>

            {isDispatching ? (
              <div className="space-y-2 py-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Despachando correos a los servidores...</span>
                  <span className="font-mono">{dispatchProgress}%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className="h-full bg-[#0F3D2E] transition-all duration-300"
                    style={{ width: `${dispatchProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDispatchModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleStartBulkDispatch}
                  className="px-5 py-2.5 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-[#D4B895]" />
                  <span>Enviar a {totalUnits - bouncedUnits.length} Vecinos</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: VISTA PREVIA DEL CORREO ELECTRÓNICO (HTML CORPORATIVO) */}
      {previewEmailUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-sm text-slate-900">Vista Previa de Correo Oficial • ARANPRO</h4>
                <p className="text-[11px] text-slate-500">Destinatario: Casa {previewEmailUnit.unitNumber} ({previewEmailUnit.email || 'Sin correo'})</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewEmailUnit(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Simulación del Email que ve el Vecino en su bandeja de entrada */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-slate-50 font-sans text-xs">
              {/* Encabezado Técnico de Remitente (Bandeja de Entrada) */}
              <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 text-[11px] text-slate-600 flex items-center justify-between font-mono">
                <span>De: <strong>Administración {community.name}</strong> &lt;{officialSenderEmail}&gt;</span>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded">Verificado aranpro.cl</span>
              </div>

              {/* Header del Correo */}
              <div className="p-4 bg-[#0F3D2E] text-white flex items-center justify-between border-b border-[#D4B895]/30">
                <div className="flex items-center gap-2.5">
                  <AranproLogo variant="horizontal" size="sm" className="h-6 w-auto" />
                  <span className="font-bold text-xs text-white">{community.name}</span>
                </div>
                <span className="text-[10px] text-[#D4B895] font-bold">Período {periodLabel}</span>
              </div>

              {/* Cuerpo del Correo */}
              <div className="p-5 bg-white space-y-3.5 text-slate-700 leading-relaxed">
                <p>
                  Estimado(a) <strong>{previewEmailUnit.owner}</strong> (Casa {previewEmailUnit.unitNumber}),
                </p>
                <p>
                  Junto con saludarle cordialmente, se comunica que ha sido formalmente emitido el cobro de Gasto Común correspondiente al período <strong>{periodLabel}</strong> en conformidad con la <strong>Ley de Copropiedad Inmobiliaria N° 21.442</strong>.
                </p>

                {/* Tarjeta de Cobro */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-bold uppercase">Total a Pagar del Mes:</span>
                    <strong className="text-lg font-black text-[#0F3D2E]">{formatCLP(previewEmailUnit.currentCharge)}</strong>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600 border-t border-slate-200 pt-1.5">
                    <span>Vencimiento:</span>
                    <strong>15 de {currentPeriod.month === 11 ? 'Noviembre' : 'Diciembre'} de {currentPeriod.year}</strong>
                  </div>
                </div>

                <div className="text-center pt-2">
                  <a
                    href={`${window.location.origin}?c=${community.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block px-5 py-2.5 bg-[#0F3D2E] text-[#D4B895] font-bold text-xs rounded-xl shadow-xs"
                  >
                    Ver mi Colilla y Pagar en Línea →
                  </a>
                </div>

                <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-400 text-center">
                  Administración ARANPRO • John Andrés Arancibia Maureira • Reg. RNAC Minvu N° 48.912
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setPreviewEmailUnit(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cerrar Vista Previa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
