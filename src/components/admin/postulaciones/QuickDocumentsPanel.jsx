import React, { useState, useMemo } from 'react';
import {
  Search, FileText, Download, Eye, Printer, MessageCircle, ExternalLink,
  ShieldCheck, Award, CheckCircle2, AlertTriangle, Clock, HardHat, Scale,
  QrCode, Presentation, Calculator, Building2, Sparkles, Filter, Check,
  Settings, ChevronDown, ChevronUp, FolderArchive, X, ArrowUpRight,
  FileCheck, DollarSign, Plus, PenTool, Trash2, Send
} from 'lucide-react';
import { formatCLP } from '../../../utils/formatters';
import { openDataUrlInNewTab, downloadDataUrl } from '../../../utils/fileVault';

export const QuickDocumentsPanel = ({
  proposalConfig = {},
  setProposalConfig = () => {},
  empresaForm = {},
  accreditationDocs = [],
  setAccreditationDocs = () => {},
  academicRecords = [],
  committeeReferences = [],
  handleOpenAddRef = () => {},
  handleOpenEditRef = () => {},
  handleDeleteRef = () => {},
  handleToggleConfirmRef = () => {},
  handleRequestReferenceWhatsApp = () => {},
  packageFilesCount = 0,
  handleDownloadPackage = () => {},
  handlePrintColdLetter = () => {},
  setPreviewColdLetterModal = () => {},
  handlePrintDossier = () => {},
  setPreviewDossierModal = () => {},
  handlePrintProposal = () => {},
  setPreviewProposalModal = () => {},
  handlePrintInspectionReport = () => {},
  setPreviewInspectionModal = () => {},
  handlePrintBrochure = () => {},
  setPreviewBrochureModal = () => {},
  handlePrintComparisonMatrix = () => {},
  setPreviewComparisonModal = () => {},
  onNavigateToSection = () => {},
  handleShareWhatsApp = () => {},
  onNavigateToBoveda = () => {},
  showAlert = () => {}
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('todos'); // 'todos' | 'generados' | 'boveda' | 'fichas' | 'referencias'
  const [showConfigDrawer, setShowConfigDrawer] = useState(false);

  // Helper para verificar si un documento de la bóveda está cargado
  const findVaultDoc = (keyOrRegex) => {
    return (accreditationDocs || []).find(doc => {
      if (!doc) return false;
      if (doc.requirementKey && doc.requirementKey === keyOrRegex) return true;
      if (typeof keyOrRegex === 'string') {
        return (doc.name || '').toLowerCase().includes(keyOrRegex.toLowerCase());
      }
      if (keyOrRegex instanceof RegExp) {
        return keyOrRegex.test(doc.name || '') || keyOrRegex.test(doc.requirementKey || '');
      }
      return false;
    });
  };

  // Helper para descargar o previsualizar archivo de la bóveda
  const handleVaultFileAction = (doc, action = 'download') => {
    if (!doc?.fileData) {
      showAlert?.('Sin archivo digital', 'Este documento está registrado pero no tiene un archivo adjunto subido en la Bóveda.', 'warning');
      return;
    }
    if (action === 'preview') {
      openDataUrlInNewTab(doc.fileData);
    } else {
      downloadDataUrl(doc.fileData, doc.fileName || `${doc.name}.pdf`);
    }
  };

  // 1. DOCUMENTOS GENERADOS OFICIALES POR LA PLATAFORMA
  const generatedDocs = useMemo(() => [
    {
      id: 'carta-valor',
      title: 'Carta de Valor al Comité • Puerta en Frío',
      subtitle: 'Presentación formal sin precios. Destaca experiencia pericial, App 24/7 y ofrece diagnóstico inicial gratuito.',
      badge: 'Paso 1 • Embudo',
      badgeColor: 'emerald',
      format: 'PDF Oficial A4 (1 Pág)',
      type: 'generado',
      category: 'generados',
      ready: true,
      onPreview: () => setPreviewColdLetterModal?.(true),
      onPrint: handlePrintColdLetter,
      onWhatsApp: () => handleShareWhatsApp?.(1),
      stepNumber: 1,
      icon: Send
    },
    {
      id: 'dossier-maestro',
      title: 'Dossier Integral de Postulación ARANPRO',
      subtitle: 'Compendio maestro para licitaciones: Portada corporativa, Carta oficial, Peritaje constructivo, Acreditaciones y Diplomas.',
      badge: 'Paso 2 • Embudo',
      badgeColor: 'gold',
      format: 'PDF Oficial A4 (3+ Págs)',
      type: 'generado',
      category: 'generados',
      ready: true,
      onPreview: () => setPreviewDossierModal?.(true),
      onPrint: handlePrintDossier,
      onWhatsApp: () => handleShareWhatsApp?.(2),
      stepNumber: 2,
      isPrimary: true,
      icon: Award
    },
    {
      id: 'propuesta-formal',
      title: 'Propuesta Comercial Formal & Modelo Operativo',
      subtitle: 'Documento vinculante de adjudicación: Carta formal, desglose de honorarios mensuales y condiciones técnicas.',
      badge: 'Paso 3 • Embudo',
      badgeColor: 'blue',
      format: 'PDF Oficial A4 (3 Págs)',
      type: 'generado',
      category: 'generados',
      ready: true,
      onPreview: () => setPreviewProposalModal?.(true),
      onPrint: handlePrintProposal,
      onWhatsApp: () => handleShareWhatsApp?.(3),
      stepNumber: 3,
      icon: FileCheck
    },
    {
      id: 'informe-diagnostico',
      title: 'Informe de Diagnóstico Técnico Inicial Gratuito',
      subtitle: 'Pauta de inspección pericial de salas de bombas, tableros eléctricos, cubiertas y sellos de gas para la primera visita.',
      badge: 'Paso 3 • Anexo Técnico',
      badgeColor: 'slate',
      format: 'PDF Oficial A4 (1 Pág)',
      type: 'generado',
      category: 'fichas',
      ready: true,
      onPreview: () => setPreviewInspectionModal?.(true),
      onPrint: handlePrintInspectionReport,
      stepNumber: null,
      icon: HardHat
    },
    {
      id: 'brochure-app',
      title: 'Brochure Tecnológico App Móvil & Demo QR',
      subtitle: 'Ficha comercial ejecutiva con código QR en vivo para que el Comité y vecinos escaneen y prueben la demo en su celular.',
      badge: 'Paso 4 • Embudo',
      badgeColor: 'amber',
      format: 'PDF Oficial A4 (1 Pág)',
      type: 'generado',
      category: 'generados',
      ready: true,
      onPreview: () => setPreviewBrochureModal?.(true),
      onPrint: handlePrintBrochure,
      onWhatsApp: () => handleShareWhatsApp?.(4),
      stepNumber: 4,
      icon: QrCode
    },
    {
      id: 'cuadro-comparativo',
      title: 'Matriz Comparativa Tradicional vs Modelo ARANPRO',
      subtitle: 'Cuadro auditor de 10 puntos críticos: Administración Tradicional vs Gestión Pericial & Ley 21.442 con firma y timbre.',
      badge: 'Paso 4 • Diferenciador',
      badgeColor: 'slate',
      format: 'PDF Oficial A4 (1 Pág)',
      type: 'generado',
      category: 'fichas',
      ready: true,
      onPreview: () => setPreviewComparisonModal?.(true),
      onPrint: handlePrintComparisonMatrix,
      stepNumber: null,
      icon: Scale
    },
    {
      id: 'libreto-pitch',
      title: 'Ficha Ejecutiva del Libreto Pitch (10 Minutos)',
      subtitle: 'Guion maestro estructurado con 10 respuestas a preguntas difíciles de comités y fundamentación de honorarios.',
      badge: 'Herramienta Comercial',
      badgeColor: 'purple',
      format: 'Herramienta Interactiva',
      type: 'generado',
      category: 'fichas',
      ready: true,
      onOpen: () => onNavigateToSection?.('pitch'),
      openLabel: 'Abrir Libreto Pitch',
      stepNumber: null,
      icon: Presentation
    },
    {
      id: 'memoria-honorarios',
      title: 'Memoria Pericial de Honorarios ARANPRO (Ley 21.442)',
      subtitle: 'Estudio técnico pericial que fundamenta el piso tarifario según tipología, subsectores contables y equipamiento crítico.',
      badge: 'Herramienta Pericial',
      badgeColor: 'emerald',
      format: 'Calculadora & Memoria',
      type: 'generado',
      category: 'fichas',
      ready: true,
      onOpen: () => onNavigateToSection?.('calculadora'),
      openLabel: 'Abrir Calculadora & Memoria',
      stepNumber: null,
      icon: Calculator
    }
  ], [
    setPreviewColdLetterModal, handlePrintColdLetter, handleShareWhatsApp,
    setPreviewDossierModal, handlePrintDossier,
    setPreviewProposalModal, handlePrintProposal,
    setPreviewInspectionModal, handlePrintInspectionReport,
    setPreviewBrochureModal, handlePrintBrochure,
    setPreviewComparisonModal, handlePrintComparisonMatrix,
    onNavigateToSection
  ]);

  // 2. DOCUMENTOS Y ACREDITACIONES DE LA BÓVEDA DIGITAL
  const vaultDocs = useMemo(() => {
    const standardRequirements = [
      {
        reqKey: 'rnac',
        title: 'Certificado de Inscripción Vigente en el RNAC (MINVU)',
        subtitle: 'Registro Nacional de Administradores de Condominios según Ley N° 21.442. Obligatorio para ejercer.',
        badge: 'Legal • Obligatorio',
        badgeColor: 'emerald'
      },
      {
        reqKey: 'licencia_educacion',
        title: 'Título Profesional de Constructor Civil (Universidad)',
        subtitle: 'Acreditación académica de respaldo pericial en infraestructura, mantenciones e inspección de obras.',
        badge: 'Técnico • Diferenciador',
        badgeColor: 'blue'
      },
      {
        reqKey: 'antecedentes',
        title: 'Certificado de Antecedentes para Fines Especiales',
        subtitle: 'Emitido por el Servicio de Registro Civil e Identificación. Acredita no inhabilidad legal Art. 82.',
        badge: 'Legal • Habilitante',
        badgeColor: 'emerald'
      },
      {
        reqKey: 'capacitacion',
        title: 'Certificado Curso de Administración de Condominios (OTEC)',
        subtitle: 'Aprobación del curso oficial reconocido por el MINVU conforme al reglamento de la Ley 21.442.',
        badge: 'Legal • Acreditación',
        badgeColor: 'emerald'
      },
      {
        reqKey: 'sec',
        title: 'Licencia Instalador Autorizado de Gas SEC / ITO Obras',
        subtitle: 'Acreditación de competencia técnica para sellos verde de gas y fiscalización de instalaciones térmicas.',
        badge: 'Técnico • Especialista',
        badgeColor: 'amber'
      },
      {
        reqKey: 'sii',
        title: 'Iniciación de Actividades & Situación Tributaria (SII)',
        subtitle: 'Constancia de giro comercial formal para emisión de facturas o boletas de honorarios profesionales.',
        badge: 'Tributario • Comercial',
        badgeColor: 'slate'
      },
      {
        reqKey: 'tgr',
        title: 'Certificado de Deuda Tributaria al Día (TGR)',
        subtitle: 'Tesorería General de la República certificando ausencia de convenios morosos o deudas fiscales.',
        badge: 'Tributario • Solvencia',
        badgeColor: 'slate'
      },
      {
        reqKey: 'garantia',
        title: 'Póliza de Responsabilidad Civil Profesional / Fiel Cumplimiento',
        subtitle: 'Caución o seguro de RC profesional de administración que garantiza el fiel manejo de fondos.',
        badge: 'Garantía • Premium',
        badgeColor: 'purple'
      },
      {
        reqKey: 'cedula',
        title: 'Cédula de Identidad Representante Legal',
        subtitle: 'Documento de identidad oficial vigente del Administrador / Representante Legal.',
        badge: 'Identidad • Contrato',
        badgeColor: 'slate'
      }
    ];

    const mapped = standardRequirements.map(item => {
      const doc = findVaultDoc(item.reqKey);
      const isLoaded = Boolean(doc?.fileData);
      return {
        id: `vault-${item.reqKey}`,
        title: item.title,
        subtitle: item.subtitle,
        badge: item.badge,
        badgeColor: item.badgeColor,
        format: doc?.fileName ? doc.fileName.split('.').pop()?.toUpperCase() || 'PDF' : 'Archivo Bóveda',
        type: 'boveda',
        category: 'boveda',
        ready: isLoaded,
        fileDoc: doc,
        fileSize: doc?.fileSize || null,
        includeInDossier: doc ? doc.includeInDossier !== false : false,
        onPreview: isLoaded ? () => handleVaultFileAction(doc, 'preview') : null,
        onDownload: isLoaded ? () => handleVaultFileAction(doc, 'download') : null,
        onUpload: () => onNavigateToBoveda?.(item.reqKey),
        icon: ShieldCheck
      };
    });

    // Diplomas académicos de academicRecords
    (academicRecords || []).filter(Boolean).forEach((record, idx) => {
      mapped.push({
        id: `academic-${record.id || idx}`,
        title: record.title || 'Diploma / Especialización Académica',
        subtitle: `${record.institution || 'Institución de Educación Superior'} • ${record.year || 'Acreditado'}`,
        badge: 'Formación Académica',
        badgeColor: 'blue',
        format: 'Certificado Académico',
        type: 'boveda',
        category: 'boveda',
        ready: true,
        fileDoc: record,
        fileSize: null,
        includeInDossier: record.includeInProposal !== false,
        onPreview: null,
        onDownload: null,
        onUpload: () => onNavigateToBoveda?.('licencia_educacion'),
        icon: Award
      });
    });

    // Documentos adicionales personalizados en bóveda
    (accreditationDocs || []).filter(Boolean).forEach(doc => {
      const alreadyIncluded = standardRequirements.some(r => r.reqKey === doc.requirementKey);
      if (!alreadyIncluded && doc.name) {
        mapped.push({
          id: `custom-doc-${doc.id}`,
          title: doc.name,
          subtitle: doc.issuer ? `Emisor: ${doc.issuer} • ${doc.notes || 'Documento adjunto'}` : (doc.notes || 'Documento adicional en bóveda'),
          badge: 'Bóveda • Adicional',
          badgeColor: 'slate',
          format: doc.fileName ? doc.fileName.split('.').pop()?.toUpperCase() || 'PDF' : 'PDF / Imagen',
          type: 'boveda',
          category: 'boveda',
          ready: Boolean(doc.fileData),
          fileDoc: doc,
          fileSize: doc.fileSize || null,
          includeInDossier: doc.includeInDossier !== false,
          onPreview: doc.fileData ? () => handleVaultFileAction(doc, 'preview') : null,
          onDownload: doc.fileData ? () => handleVaultFileAction(doc, 'download') : null,
          onUpload: () => onNavigateToBoveda?.(doc.requirementKey || 'otros'),
          icon: FileCheck
        });
      }
    });

    return mapped;
  }, [accreditationDocs, academicRecords, onNavigateToBoveda]);

  // 3. REFERENCIAS Y CARTAS DE RECOMENDACIÓN DE COMITÉS
  const refDocs = useMemo(() => {
    return (committeeReferences || []).filter(Boolean).map(ref => ({
      id: `ref-${ref.id || Math.random()}`,
      title: `Carta de Referencia • ${ref.communityName || 'Condominio'}`,
      subtitle: `Contacto: ${ref.contactName || 'Contacto'} (${ref.role || 'Comité'}) • Tel: ${ref.phone || 'S/N'} • "${(ref.quote || '').slice(0, 80)}..."`,
      badge: ref.confirmed !== false ? 'Referencia Verificada' : 'Por Confirmar',
      badgeColor: ref.confirmed !== false ? 'emerald' : 'amber',
      format: 'Recomendación Comité',
      type: 'referencia',
      category: 'referencias',
      ready: ref.confirmed !== false,
      refData: ref,
      onRequestWhatsApp: () => handleRequestReferenceWhatsApp?.(ref),
      onEdit: () => handleOpenEditRef?.(ref),
      onDelete: () => handleDeleteRef?.(ref),
      onToggleConfirm: () => handleToggleConfirmRef?.(ref.id),
      icon: MessageCircle
    }));
  }, [committeeReferences, handleRequestReferenceWhatsApp, handleOpenEditRef, handleDeleteRef, handleToggleConfirmRef]);

  // CONSOLIDADO COMPLETO DE TODOS LOS DOCUMENTOS
  const allDocuments = useMemo(() => {
    return [...generatedDocs, ...vaultDocs, ...refDocs];
  }, [generatedDocs, vaultDocs, refDocs]);

  // FILTRADO EN TIEMPO REAL POR BÚSQUEDA Y CATEGORÍA
  const filteredDocuments = useMemo(() => {
    const q = (searchQuery || '').toLowerCase().trim();
    return allDocuments.filter(doc => {
      if (activeCategory === 'generados' && doc.category !== 'generados') return false;
      if (activeCategory === 'boveda' && doc.category !== 'boveda') return false;
      if (activeCategory === 'fichas' && doc.category !== 'fichas') return false;
      if (activeCategory === 'referencias' && doc.category !== 'referencias') return false;

      if (!q) return true;
      const matchTitle = (doc.title || '').toLowerCase().includes(q);
      const matchSubtitle = (doc.subtitle || '').toLowerCase().includes(q);
      const matchBadge = (doc.badge || '').toLowerCase().includes(q);
      const matchFormat = (doc.format || '').toLowerCase().includes(q);
      return matchTitle || matchSubtitle || matchBadge || matchFormat;
    });
  }, [allDocuments, activeCategory, searchQuery]);

  // Métricas rápidas para la cabecera
  const stats = useMemo(() => {
    const total = allDocuments.length;
    const ready = allDocuments.filter(d => d.ready).length;
    const vaultReady = vaultDocs.filter(d => d.ready).length;
    const vaultTotal = vaultDocs.length;
    return { total, ready, vaultReady, vaultTotal };
  }, [allDocuments, vaultDocs]);

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* CABECERA PRINCIPAL: BANDEJA RÁPIDA DE DOCUMENTOS */}
      <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-[#0F3D2E] text-[#D4B895]">
                <FolderArchive className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-bold text-[#0F3D2E] uppercase tracking-wider">
                Centro de Descargas & Emisión Instantánea
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Bandeja Rápida de Documentos Descargables
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Encuentra, imprime y descarga al instante todos los documentos de postulación generados y acreditaciones de la Bóveda Legal.
            </p>
          </div>

          {/* ACCIONES GLOBALES DIRECTAS */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDownloadPackage}
              className="px-4 py-2.5 rounded-2xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              title="Descarga en un solo paso todos los archivos adjuntos numerados"
            >
              <Download className="w-4 h-4 text-[#D4B895]" />
              <span>Descargar Pack Completo ({packageFilesCount})</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateToBoveda?.()}
              className="px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              title="Ir a administrar y subir certificados a la Bóveda Legal"
            >
              <ShieldCheck className="w-4 h-4 text-[#0F3D2E]" />
              <span>Bóveda Legal</span>
            </button>
          </div>
        </div>

        {/* BARRA COMPACTA DE PERSONALIZACIÓN DEL CONDOMINIO OBJETIVO */}
        <div className="bg-slate-50/80 rounded-2xl border border-slate-200/90 p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Objetivo:</span>
              <span className="font-bold text-[#0F3D2E] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                {proposalConfig?.targetCondo?.trim() || 'Comunidad Abierta / Genérica'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Atención:</span>
              <span className="font-semibold text-slate-700">
                {proposalConfig?.leaveRecipientBlank
                  ? '(En blanco para conserjería)'
                  : (proposalConfig?.targetRecipient?.trim() || 'Comité de Administración')}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Honorario:</span>
              <span className="font-bold text-slate-800">
                {formatCLP(Number(proposalConfig?.proposedMonthlyFee) || 850000)}/mes
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowConfigDrawer(!showConfigDrawer)}
            className="flex items-center gap-1 text-[11px] font-bold text-[#0F3D2E] hover:underline cursor-pointer self-start md:self-auto"
          >
            <Settings className="w-3.5 h-3.5 text-[#D4B895]" />
            <span>{showConfigDrawer ? 'Ocultar Ajustes' : 'Ajustar Destinatario & Honorarios'}</span>
            {showConfigDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* DRAWER COLAPSABLE DE CONFIGURACIÓN RÁPIDA (PARA NO OCUPAR ESPACIO VISUAL INNECESARIO) */}
        {showConfigDrawer && (
          <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-200/70 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-[#0F3D2E] tracking-wider">
                Personalizar Datos para los Documentos Generados
              </span>
              <span className="text-[10px] text-slate-500">Los cambios se aplican inmediatamente en PDFs e impresiones</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Condominio Objetivo</label>
                <input
                  type="text"
                  placeholder="Ej: Condominio Mirador"
                  value={proposalConfig?.targetCondo || ''}
                  onChange={(e) => setProposalConfig({ ...proposalConfig, targetCondo: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Destinatario</label>
                <input
                  type="text"
                  placeholder="Ej: Señores Miembros del Comité"
                  value={proposalConfig?.leaveRecipientBlank ? '' : (proposalConfig?.targetRecipient || '')}
                  disabled={proposalConfig?.leaveRecipientBlank}
                  onChange={(e) => setProposalConfig({ ...proposalConfig, targetRecipient: e.target.value, leaveRecipientBlank: false })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Honorario Mensual (CLP)</label>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  value={proposalConfig?.proposedMonthlyFee ?? 850000}
                  onChange={(e) => setProposalConfig({ ...proposalConfig, proposedMonthlyFee: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#0F3D2E] focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Frecuencia Visitas</label>
                <input
                  type="text"
                  placeholder="Ej: 2 visitas semanales"
                  value={proposalConfig?.visitFrequency || ''}
                  onChange={(e) => setProposalConfig({ ...proposalConfig, visitFrequency: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                />
              </div>
            </div>
          </div>
        )}

        {/* BARRA DE BÚSQUEDA EN TIEMPO REAL & FILTROS POR CATEGORÍA */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
          {/* BUSCADOR INSTANTÁNEO */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar documento por nombre, tipo, norma o palabra clave (ej: RNAC, Propuesta, Gas, SEC, QR, Referencia)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E] focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* PESTAÑAS RÁPIDAS DE FILTRADO */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200 shrink-0 overflow-x-auto">
            {[
              { id: 'todos', label: 'Todos', count: allDocuments.length },
              { id: 'generados', label: 'PDFs Oficiales', count: generatedDocs.length },
              { id: 'boveda', label: 'Bóveda & Certificados', count: vaultDocs.length },
              { id: 'fichas', label: 'Fichas & Herramientas', count: allDocuments.filter(d => d.category === 'fichas').length },
              { id: 'referencias', label: 'Referencias Comités', count: refDocs.length }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeCategory === tab.id
                    ? 'bg-[#0F3D2E] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeCategory === tab.id ? 'bg-[#D4B895] text-[#0F3D2E]' : 'bg-slate-200 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* LISTADO / BANDEJA DE DOCUMENTOS */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredDocuments.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">No se encontraron documentos</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No hay documentos que coincidan con &ldquo;{searchQuery}&rdquo;. Intenta con otro término o limpia el buscador.
            </p>
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setActiveCategory('todos'); }}
              className="text-xs font-bold text-[#0F3D2E] hover:underline"
            >
              Restablecer filtros
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredDocuments.map((doc, idx) => {
              const DocIcon = doc.icon || FileText;
              return (
                <div
                  key={doc.id || idx}
                  className={`p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors hover:bg-slate-50/80 ${
                    doc.isPrimary ? 'bg-emerald-50/30' : ''
                  }`}
                >
                  {/* COLUMNA 1: ICONO, TÍTULO, SUBTÍTULO Y BADGES */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div className={`p-2.5 rounded-2xl shrink-0 mt-0.5 ${
                      doc.isPrimary
                        ? 'bg-[#0F3D2E] text-[#D4B895] shadow-xs'
                        : doc.category === 'generados'
                          ? 'bg-emerald-50 text-[#0F3D2E] border border-emerald-200'
                          : doc.category === 'boveda'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : doc.category === 'referencias'
                              ? 'bg-purple-50 text-purple-800 border border-purple-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      <DocIcon className="w-5 h-5" />
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider ${
                          doc.badgeColor === 'emerald' ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' :
                          doc.badgeColor === 'gold' ? 'bg-[#0F3D2E] text-[#D4B895] font-black' :
                          doc.badgeColor === 'blue' ? 'bg-blue-100 text-blue-900 border border-blue-200' :
                          doc.badgeColor === 'amber' ? 'bg-amber-100 text-amber-900 border border-amber-200' :
                          doc.badgeColor === 'purple' ? 'bg-purple-100 text-purple-900 border border-purple-200' :
                          'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {doc.badge}
                        </span>

                        <span className="text-[10px] font-mono text-slate-400">
                          {doc.format}
                        </span>

                        {/* ESTADO DE DISPONIBILIDAD */}
                        {doc.ready ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {doc.fileSize ? `En Bóveda (${doc.fileSize})` : doc.type === 'referencia' ? 'Verificada' : 'Listo para Emitir'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            {doc.type === 'referencia' ? 'Por Confirmar' : 'Pendiente de Subir'}
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-black text-slate-900 tracking-tight leading-snug">
                        {doc.title}
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                        {doc.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* COLUMNA 2: BOTONES DE ACCIÓN RÁPIDA (1 CLIC) */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 md:self-center">
                    {/* ACCIÓN PARA DOCUMENTOS GENERADOS POR PLATAFORMA */}
                    {doc.type === 'generado' && (
                      <>
                        {doc.onOpen && (
                          <button
                            type="button"
                            onClick={doc.onOpen}
                            className="px-3.5 py-2 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                            title={doc.openLabel || 'Abrir herramienta'}
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-[#D4B895]" />
                            <span>{doc.openLabel || 'Abrir'}</span>
                          </button>
                        )}

                        {doc.onPreview && (
                          <button
                            type="button"
                            onClick={doc.onPreview}
                            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                            title="Previsualizar documento antes de imprimir"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#0F3D2E]" />
                            <span>Ver Previa</span>
                          </button>
                        )}

                        {doc.onPrint && (
                          <button
                            type="button"
                            onClick={doc.onPrint}
                            className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                              doc.isPrimary
                                ? 'bg-[#0F3D2E] hover:bg-[#0A291F] text-white'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-[#0F3D2E] border border-emerald-300'
                            }`}
                            title="Descargar o imprimir PDF oficial con los datos actuales"
                          >
                            <Printer className="w-3.5 h-3.5 text-[#D4B895]" />
                            <span>Imprimir / PDF</span>
                          </button>
                        )}

                        {doc.onWhatsApp && (
                          <button
                            type="button"
                            onClick={doc.onWhatsApp}
                            className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer shadow-xs"
                            title="Compartir mensaje oficial por WhatsApp con enlace directo"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    )}

                    {/* ACCIÓN PARA DOCUMENTOS DE BÓVEDA DIGITAL */}
                    {doc.type === 'boveda' && (
                      <>
                        {doc.ready ? (
                          <>
                            {doc.onPreview && (
                              <button
                                type="button"
                                onClick={doc.onPreview}
                                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                                title="Abrir archivo digital en una nueva pestaña"
                              >
                                <Eye className="w-3.5 h-3.5 text-[#0F3D2E]" />
                                <span>Ver Archivo</span>
                              </button>
                            )}

                            {doc.onDownload && (
                              <button
                                type="button"
                                onClick={doc.onDownload}
                                className="px-3.5 py-2 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                                title="Descargar archivo original de la bóveda"
                              >
                                <Download className="w-3.5 h-3.5 text-[#D4B895]" />
                                <span>Descargar</span>
                              </button>
                            )}
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={doc.onUpload}
                            className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                            title="Ir a la Bóveda Legal para cargar el archivo digital"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-amber-700" />
                            <span>Cargar en Bóveda</span>
                          </button>
                        )}
                      </>
                    )}

                    {/* ACCIÓN PARA REFERENCIAS DE COMITÉS */}
                    {doc.type === 'referencia' && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={doc.onRequestWhatsApp}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1"
                          title="Enviar solicitud de carta por WhatsApp"
                        >
                          <Send className="w-3 h-3" />
                          <span>Pedir por WhatsApp</span>
                        </button>
                        <button
                          type="button"
                          onClick={doc.onToggleConfirm}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                            doc.ready
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-amber-50 text-amber-800 border-amber-300'
                          }`}
                          title="Alternar estado verificado"
                        >
                          {doc.ready ? '✓ Autorizada' : '⏳ Confirmar'}
                        </button>
                        <button
                          type="button"
                          onClick={doc.onEdit}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/70"
                          title="Editar referencia"
                        >
                          <PenTool className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PIE CON CONSEJO EJECUTIVO & RESUMEN DE ENTREGA */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#0F3D2E] shrink-0" />
          <span>
            <strong>Consejo ARANPRO:</strong> Para entregar una postulación impecable, descarga el <strong>Dossier Maestro</strong> (Paso 2) o el <strong>Pack Completo</strong> con todos los certificados numerados y anexos periciales.
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0 font-medium text-slate-500">
          <span>{stats.ready} de {stats.total} disponibles</span>
          <span>•</span>
          <span>Bóveda: {stats.vaultReady}/{stats.vaultTotal} cargados</span>
        </div>
      </div>
    </div>
  );
};
