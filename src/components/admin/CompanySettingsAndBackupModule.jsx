import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useCommunity } from '../../context/CommunityContext';
import { formatDate, formatRut, formatCLP, validateRut } from '../../utils/formatters';
import { printDocumentDirectly, downloadHtmlDocument } from '../../utils/printDocument';
import { AranproConfirmModal } from '../common/AranproConfirmModal';
import { AranproLogo, AranproPdfStyleSelector, AranproOfficialSeal, useAranproPdfStyle } from '../common/MauranLogo';
import { DocumentLibraryPanel } from './postulaciones/DocumentLibraryPanel';
import { ReadinessPanel } from './postulaciones/ReadinessPanel';
import { PipelinePanel } from './postulaciones/PipelinePanel';
import { AgacechFeeCalculatorPanel } from './postulaciones/AgacechFeeCalculatorPanel';
import { computeReadiness, hasFile } from '../../utils/postulationReadiness';
import { stripAndStoreFiles, hydrateFiles, downloadDataUrl } from '../../utils/fileVault';
import { resendMailService } from '../../services/resendService';
import { generateStepPdfAttachment } from '../../utils/proposalPdfGenerator';
import {
  Building2, UserCheck, ShieldCheck, Award, FileText, CheckCircle2,
  AlertTriangle, Printer, Download, Share2, Search, Filter, Plus,
  X, ExternalLink, Clock, DollarSign, AlertCircle, Trash2, Eye,
  Send, Home, Briefcase, Copy, Sparkles, Check, Key, Shield,
  HardHat, BookOpen, FileCheck, Upload, RefreshCw, PenTool,
  HelpCircle, Settings, Smartphone, Layers, CheckSquare, MessageCircle,
  Paperclip, FileUp, QrCode, Presentation, Compass, ClipboardCheck,
  ArrowRight, Scale, ChevronRight, ChevronDown, ChevronUp, Users, UserPlus, ShieldAlert, Kanban, Calculator,
  Mail, GraduationCap
} from 'lucide-react';

// Recorta automáticamente márgenes blancos/transparentes alrededor de la firma manuscrita
// y convierte el fondo blanco en transparente para que la firma abarque óptimamente su espacio en los PDFs.
const autoTrimSignatureDataUrl = (dataUrl) => {
  return new Promise((resolve) => {
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image')) {
      resolve(dataUrl);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const w = img.width;
        const h = img.height;
        if (!w || !h) {
          resolve(dataUrl);
          return;
        }
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = w;
        tempCanvas.height = h;
        const ctx = tempCanvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        let minX = w;
        let minY = h;
        let maxX = 0;
        let maxY = 0;
        let foundInk = false;

        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const a = data[idx + 3];

            // Si es casi blanco, volverlo transparente para eliminar fondos de papel escaneado
            if (a > 0 && r > 238 && g > 238 && b > 238) {
              data[idx + 3] = 0;
              continue;
            }

            // Si tiene tinta visible
            if (data[idx + 3] > 25) {
              foundInk = true;
              if (x < minX) minX = x;
              if (y < minY) minY = y;
              if (x > maxX) maxX = x;
              if (y > maxY) maxY = y;
            }
          }
        }

        if (!foundInk || maxX <= minX || maxY <= minY) {
          resolve(dataUrl);
          return;
        }

        ctx.putImageData(imgData, 0, 0);

        const pad = 6;
        const cropX = Math.max(0, minX - pad);
        const cropY = Math.max(0, minY - pad);
        const cropW = Math.min(w - cropX, (maxX - minX) + pad * 2);
        const cropH = Math.min(h - cropY, (maxY - minY) + pad * 2);

        const outCanvas = document.createElement('canvas');
        outCanvas.width = cropW;
        outCanvas.height = cropH;
        const outCtx = outCanvas.getContext('2d');
        outCtx.drawImage(tempCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

        resolve(outCanvas.toDataURL('image/png'));
      } catch (e) {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
};

export const CompanySettingsAndBackupModule = ({
  currentCommunity,
  activeSubTab: externalActiveSubTab,
  setActiveSubTab: externalSetActiveSubTab,
  hideHeader = false,
  hideNavBar = false,
  postulacionSection: externalPostulacionSection,
  setPostulacionSection: externalSetPostulacionSection,
  hidePostulacionSubNav = false
}) => {
  const {
    communities = [],
    certificates = [],
    companySettings = {},
    setCompanySettings
  } = useCommunity();

  // Sub-pestaña activa tipo ECP ('empresa' | 'firma' | 'acreditacion' | 'postulaciones' | 'respaldos' | 'sobre_app')
  const [internalSubTab, setInternalSubTab] = useState('empresa');
  const activeSubTab = externalActiveSubTab || internalSubTab;
  const setActiveSubTab = externalSetActiveSubTab || setInternalSubTab;

  // Estado del formulario de Empresa & Representante Legal
  const [empresaForm, setEmpresaForm] = useState({
    brandName: companySettings?.brandName || 'ARANPRO',
    provisionalName: companySettings?.provisionalName || 'ARANPRO • Gestión Integral de Condominios',
    companyRut: (companySettings?.companyRut && !String(companySettings.companyRut).includes('76.999.888')) ? companySettings.companyRut : '',
    address: companySettings?.address || 'Av. Cuatro Esquinas 1520, Of. 402',
    city: companySettings?.city || 'La Serena, Coquimbo',
    country: 'Chile',
    phone: (companySettings?.phone && companySettings.phone !== '+56 9 4183 2711') ? companySettings.phone : '+56958118504',
    email: companySettings?.email || 'contacto@aranpro.cl',
    website: companySettings?.website || 'https://aranpro.cl',
    // Representante Legal / Firmante
    adminName: companySettings?.adminName || 'John Andrés Arancibia Maureira',
    adminRut: (companySettings?.adminRut && companySettings.adminRut !== '14.882.140-K') ? companySettings.adminRut : '16.012.871-2',
    adminRole: companySettings?.adminRole || 'Administrador Titular & Representante Legal',
    rnacNumber: (companySettings?.rnacNumber && companySettings.rnacNumber !== '48.912') ? companySettings.rnacNumber : '',
    rnacCategory: companySettings?.rnacCategory || 'Persona Natural (En trámite Ley 21.442)',
    // Perfil para licitaciones y cartas
    specialty: companySettings?.profileLicitacion?.specialty || 'Administración Integral de Condominios, Mantención Técnica e Infraestructura Edilicia',
    startYear: companySettings?.profileLicitacion?.startYear || '2019',
    presentationText: companySettings?.profileLicitacion?.presentationText ||
      'ARANPRO ofrece servicios profesionales de administración bajo la Ley N° 21.442 de Copropiedad Inmobiliaria. Nuestra gran ventaja competitiva radica en la formación profesional como Constructor Civil, lo que nos permite auditar, fiscalizar y supervisar con criterio experto obras de mantención, salas de bombas, cubiertas, filtraciones y contratos de proveedores, garantizando la preservación y plusvalía del patrimonio comunitario.'
  });

  // Estado para la Firma Digital Manuscrita (Canvas y Subida)
  const canvasRef = useRef(null);
  const autoTrimmedRef = useRef(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState('#0F3D2E'); // Default Verde Bosque ARANPRO
  const [penWidth, setPenWidth] = useState(2.5);
  const [signatureImage, setSignatureImage] = useState(companySettings?.signatureDataUrl || '');
  const [signatureScale, setSignatureScale] = useState(Number(companySettings?.signatureScale) || 1.35);
  const [hasCanvasDrawn, setHasCanvasDrawn] = useState(false);

  // Estado para acordeón de "Sobre la aplicación" (Estilo ECP)
  const [aboutOpenSections, setAboutOpenSections] = useState({
    general: true,
    quienesSomos: false,
    misionVision: false,
    licencia: false
  });
  const toggleAboutSection = (key) => {
    setAboutOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Estados de Formación Profesional y Acreditaciones Certificadas (Constructor Civil & Copropiedad)
  const [academicRecords, setAcademicRecords] = useState(() => {
    const defaultCertifiedRecords = [
      {
        id: 'acad-1',
        title: 'Técnico de Nivel Superior en Construcciones Civiles',
        institution: 'CFT Santo Tomás',
        category: 'Título Técnico de Nivel Superior',
        status: 'Titulado',
        year: '2018',
        relevance: 'Inspección técnica en terreno de obras civiles, patologías constructivas, redes sanitarias e hidráulicas, cubicación de mantenciones y fiscalización experta de contratistas.',
        fileName: '01_Titulo_Tecnico_Nivel_Superior_Construcciones_Civiles_Santo_Tomas.pdf',
        fileType: 'application/pdf',
        fileData: null,
        fileSize: '1.2 MB',
        uploadDate: '2024-01-10',
        includeInProposal: true
      },
      {
        id: 'acad-2',
        title: 'Curso Oficial de Copropiedad Inmobiliaria (Ley N° 21.442)',
        institution: 'Learning Group / OTEC Acreditada SENCE (Resolución MINVU)',
        category: 'Certificación Legal Copropiedad Inmobiliaria',
        status: 'Aprobado y Certificado',
        year: '2022 - 2026',
        relevance: 'Habilitación oficial obligatoria para administración de copropiedades, cumplimiento normativo Ley N° 21.442, gestión de fondos de reserva, seguros de incendio y asambleas.',
        fileName: '08_CERTIFICADO ley 21442_JOHN_ARANCIBIA_M.pdf',
        fileType: 'application/pdf',
        fileData: null,
        fileSize: '3.1 MB',
        uploadDate: '2024-02-15',
        includeInProposal: true
      },
      {
        id: 'acad-3',
        title: 'Inspección Técnica de Obras (ITO) & Plan de Aseguramiento de Calidad PAC',
        institution: 'Capacitación Profesional Especializada (Normativa MOP / ISO 9001)',
        category: 'Especialización Técnica Constructiva',
        status: 'Certificado',
        year: '2021',
        relevance: 'Supervisión técnica rigurosa de contratistas, control de especificaciones técnicas, recepción conforme de faenas y auditoría de mantenciones de infraestructura.',
        fileName: '02_Certificado_Inspeccion_Tecnica_de_Obras_ITO.pdf',
        fileType: 'application/pdf',
        fileData: null,
        fileSize: '498 KB',
        uploadDate: '2024-03-01',
        includeInProposal: true
      },
      {
        id: 'acad-4',
        title: 'Instalador de Gas Clase 3 Autorizado SEC',
        institution: 'Superintendencia de Electricidad y Combustibles (SEC)',
        category: 'Licencia SEC Oficial',
        status: 'Licencia Vigente',
        year: 'Vigente',
        relevance: 'Supervisión técnica de matrices de gas licuado y natural, calderas comunitarias, certificación de sellos verdes y cumplimiento estricto del D.S. N° 66.',
        fileName: '06_Certificado_SEC_Superintendencia_Electricidad_y_Combustibles.pdf',
        fileType: 'application/pdf',
        fileData: null,
        fileSize: '15 KB',
        uploadDate: '2024-03-10',
        includeInProposal: true
      },
      {
        id: 'acad-5',
        title: 'Contabilidad General & Gestión Financiera de Condominios',
        institution: 'TELEDUC • Pontificia Universidad Católica de Chile',
        category: 'Especialización Contable y Financiera',
        status: 'Certificado UC',
        year: '2020',
        relevance: 'Auditoría contable, conciliaciones bancarias al centavo, balances de gastos comunes, control presupuestario y rendición mensual de cuentas documentada.',
        fileName: '06_Certificado_Curso_Contabilidad_General.pdf',
        fileType: 'application/pdf',
        fileData: null,
        fileSize: '335 KB',
        uploadDate: '2024-03-15',
        includeInProposal: true
      },
      {
        id: 'acad-6',
        title: 'Gestión Profesional de Proyectos (Project Management) & Control de Presupuestos',
        institution: 'Google / Coursera & Instituto Profesional IPLACEX',
        category: 'Certificación Internacional & Presupuestaria',
        status: 'Certificación Profesional',
        year: '2021',
        relevance: 'Planificación de obras en Microsoft Project y Primavera P6, optimización de recursos y análisis de precios unitarios para frenar sobrecostos.',
        fileName: '05_Certificado_Internacional_Project_Management_Google_Coursera.pdf',
        fileType: 'application/pdf',
        fileData: null,
        fileSize: '293 KB',
        uploadDate: '2024-03-20',
        includeInProposal: true
      }
    ];

    if (Array.isArray(companySettings?.academicBackground) && companySettings.academicBackground.length > 0) {
      // Filtrar estrictamente cualquier registro previo que contenga "alumno regular", "estudios en curso" o "en curso"
      const cleaned = companySettings.academicBackground.filter(item => {
        const text = `${item.title || ''} ${item.status || ''} ${item.fileName || ''}`.toLowerCase();
        return !text.includes('alumno regular') && !text.includes('en curso') && !text.includes('estudios');
      });
      if (cleaned.length >= 2) return cleaned;
    }
    return defaultCertifiedRecords;
  });

  // Lista Formal de Documentos de Acreditación Legal, Tributaria y Técnica (Ley N° 21.442)
  const [accreditationDocs, setAccreditationDocs] = useState(() => {
    const defaultAccreditationDocs = [
      {
        id: 'acc-1',
        name: 'Comprobante de Inscripción Registro Nacional de Administradores (MINVU)',
        category: 'rnac',
        issuer: 'Ministerio de Vivienda y Urbanismo (Minvu)',
        folio: 'Ley N° 21.442 • En Trámite',
        issueDate: '2026-10-31',
        expiryDate: 'Pendiente emisión resolución',
        status: 'En trámite ★★★',
        notes: 'Solicitud de inscripción Persona Natural tramitada ante MINVU (Ley N° 21.442).',
        includeInDossier: true
      },
      {
        id: 'acc-2',
        name: 'Certificado de Título Técnico de Nivel Superior en Construcciones Civiles',
        category: 'titulo',
        issuer: 'CFT Santo Tomás',
        folio: 'Registro Oficial N° 2018',
        issueDate: '2018-12-15',
        expiryDate: 'Indefinido',
        status: 'Titulado',
        notes: 'Título oficial acreditado con formación en obras, cubicaciones y patologías constructivas.',
        includeInDossier: true
      },
      {
        id: 'acc-3',
        name: 'Certificado Oficial Aprobación Curso Copropiedad Inmobiliaria',
        category: 'rnac',
        issuer: 'Learning Group / OTEC SENCE',
        folio: 'Resolución Acreditada MINVU',
        issueDate: '2022-09-08',
        expiryDate: 'Vigente',
        status: 'Aprobado y Certificado',
        notes: 'Acreditación exigida por Ley N° 21.442 para el ejercicio profesional de administrador.',
        includeInDossier: true
      },
      {
        id: 'acc-4',
        name: 'Licencia Instalador de Gas Clase 3 Autorizado SEC',
        category: 'tecnico',
        issuer: 'Superintendencia de Electricidad y Combustibles (SEC)',
        folio: 'RUT 16.012.871-2',
        issueDate: '2025-04-03',
        expiryDate: 'Vigente',
        status: 'Licencia Vigente',
        notes: 'Certificación técnica oficial para inspección y control de redes de gas y calderas.',
        includeInDossier: true
      },
      {
        id: 'acc-5',
        name: 'Certificado de Inspección Técnica de Obras (ITO) & Aseguramiento PAC',
        category: 'tecnico',
        issuer: 'Organismo Certificador de Obras',
        folio: 'Normativa MOP / ISO 9001',
        issueDate: '2021-06-22',
        expiryDate: 'Vigente',
        status: 'Certificado',
        notes: 'Competencia técnica en fiscalización de contratistas y recepción conforme de obras.',
        includeInDossier: true
      },
      {
        id: 'acc-6',
        name: 'Certificado de Antecedentes para Fines Especiales',
        category: 'identidad',
        issuer: 'Servicio de Registro Civil e Identificación',
        folio: 'RC-2026-8841',
        issueDate: new Date(Date.now() - 15 * 86400000).toISOString().slice(0, 10),
        expiryDate: new Date(Date.now() + 45 * 86400000).toISOString().slice(0, 10),
        status: 'Intachable',
        notes: 'Sin anotaciones en el Registro General de Condenas (exigencia Art. 84° Ley 21.442).',
        includeInDossier: true
      }
    ];

    if (Array.isArray(companySettings?.accreditationFiles) && companySettings.accreditationFiles.length > 0) {
      const cleaned = companySettings.accreditationFiles.filter(item => {
        const text = `${item.name || ''} ${item.folio || ''} ${item.notes || ''}`.toLowerCase();
        return !text.includes('alumno regular') && !text.includes('en curso');
      });
      if (cleaned.length >= 3) return cleaned;
    }
    return defaultAccreditationDocs;
  });

  // Solicitud de Cartas de Referencia a Miembros de Comités Actuales
  const [committeeReferences, setCommitteeReferences] = useState(companySettings?.committeeReferenceRequests || [
    {
      id: 'ref-1',
      communityName: 'Condominio Los Cerezos',
      contactName: 'Carlos Morales Rojas',
      role: 'Presidente del Comité',
      phone: '+56988776655',
      confirmed: true,
      status: 'Recomendación Favorable Otorgada',
      quote: 'Excelente gestión técnica y contable. ARANPRO resolvió en menos de 2 meses problemas históricos de bombas hidroneumáticas y morosidad que la administración anterior no pudo solucionar.'
    },
    {
      id: 'ref-2',
      communityName: 'Condominio Los Cerezos',
      contactName: 'Marcela Castillo Gómez',
      role: 'Tesorera del Comité',
      phone: '+56977665544',
      confirmed: true,
      status: 'Recomendación Favorable Otorgada',
      quote: 'La plataforma digital ha traído una transparencia total. Cada factura y boleta del mes está visible en línea para los copropietarios.'
    }
  ]);

  // Pipeline CRM de Postulaciones y Licitaciones Activas
  const [postulationPipeline, setPostulationPipeline] = useState(companySettings?.postulationPipeline || [
    {
      id: 'post-demo-1',
      condoName: 'Condominio Mirador de San Joaquín',
      city: 'La Serena, Coquimbo',
      unitsCount: 64,
      contactName: 'Roberto Valdés (Presidente Comité)',
      contactRole: 'Presidente del Comité',
      contactPhone: '+56991234567',
      contactEmail: 'comite.miradorsanjoaquin@gmail.com',
      stage: 'dossier_enviado',
      monthlyFeeCLP: 520000,
      nextAction: 'Llamar para confirmar fecha de presentación ante el Comité',
      nextActionDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
      competitionNotes: 'Buscan administrador con conocimiento técnico por filtraciones en sala de bombas.',
      createdAt: '2026-02-20',
      updatedAt: '2026-03-01'
    },
    {
      id: 'post-demo-2',
      condoName: 'Edificio Costa Peñuelas II',
      city: 'Coquimbo',
      unitsCount: 92,
      contactName: 'Claudia Pizarro (Secretaria Comité)',
      contactRole: 'Secretaria del Comité',
      contactPhone: '+56987654321',
      contactEmail: 'directiva.costapenuelas@gmail.com',
      stage: 'presentacion',
      monthlyFeeCLP: 690000,
      nextAction: 'Realizar inspección técnica gratuita de entrada previa a asamblea',
      nextActionDate: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
      competitionNotes: 'Comité muy interesado en la App móvil con auditoría bancaria en 1 clic.',
      createdAt: '2026-02-25',
      updatedAt: '2026-03-02'
    }
  ]);

  // Estados de Seguridad & PIN
  const [adminPin, setAdminPin] = useState(companySettings?.adminPin || 'admin123');
  const [showPin, setShowPin] = useState(false);

  // Estados de Notificación / Modales
  const [pdfStyle, setPdfStyle] = useAranproPdfStyle('alt4');
  const [saveFeedback, setSaveFeedback] = useState(false);
  const [copiedLicitacionFeedback, setCopiedLicitacionFeedback] = useState(false);
  const [previewProposalModal, setPreviewProposalModal] = useState(false);
  const [previewDossierModal, setPreviewDossierModal] = useState(false);
  const [showUploadDiplomaModal, setShowUploadDiplomaModal] = useState(false);
  const [editingDiplomaId, setEditingDiplomaId] = useState(null);
  const [activeDiplomaPreview, setActiveDiplomaPreview] = useState(null);

  // Modal para CRUD de Referencias de Comités
  const [showRefModal, setShowRefModal] = useState(false);
  const [editingRefId, setEditingRefId] = useState(null);
  const [refForm, setRefForm] = useState({
    communityName: '',
    contactName: '',
    role: 'Presidente(a) del Comité',
    phone: '',
    quote: '',
    confirmed: true
  });

  // Partida personalizada para Inspección Técnica
  const [newInspectionItemName, setNewInspectionItemName] = useState('');

  const initialNewDiplomaState = {
    title: '',
    institution: '',
    category: 'Título Técnico Profesional',
    status: 'Titulado',
    year: new Date().getFullYear().toString(),
    relevance: '',
    fileName: '',
    fileType: '',
    fileData: null,
    fileSize: '',
    includeInProposal: true
  };

  const [newDiplomaForm, setNewDiplomaForm] = useState(initialNewDiplomaState);

  // Configuración de Destinatario, Condominio y Propuesta Económica (Carta de Presentación & Dossier)
  const [proposalConfig, setProposalConfig] = useState({
    targetCondo: companySettings?.lastProposalConfig?.targetCondo || 'Valle de la Florida IV',
    targetRecipient: companySettings?.lastProposalConfig?.targetRecipient || 'Señores Miembros del Comité de Administración',
    targetCity: companySettings?.lastProposalConfig?.targetCity || 'La Serena, Región de Coquimbo',
    targetPhone: companySettings?.lastProposalConfig?.targetPhone || '+56 9 5811 8504',
    targetEmail: companySettings?.lastProposalConfig?.targetEmail || '',
    currentStage: companySettings?.lastProposalConfig?.currentStage || 'contacto',
    proposalDate: companySettings?.lastProposalConfig?.proposalDate || new Date().toISOString().split('T')[0],
    leaveRecipientBlank: companySettings?.lastProposalConfig?.leaveRecipientBlank || false,
    // Propuesta Económica y Alcance del Servicio
    targetUnits: companySettings?.lastProposalConfig?.targetUnits || '60',
    proposedMonthlyFee: companySettings?.lastProposalConfig?.proposedMonthlyFee || '850000',
    taxModality: companySettings?.lastProposalConfig?.taxModality || 'Factura Exenta / Boleta de Honorarios Profesional',
    contractDuration: companySettings?.lastProposalConfig?.contractDuration || '12 meses renovables (con evaluación de conformidad a los 90 días)',
    includeEconomicInDossier: companySettings?.lastProposalConfig?.includeEconomicInDossier !== false,
    visitFrequency: companySettings?.lastProposalConfig?.visitFrequency || '2 visitas técnicas presenciales por semana + atención de emergencias 24/7'
  });

  // Sección activa dentro de Postulaciones ('flujo' | 'antecedentes' | 'material' | 'pipeline' | 'herramientas')
  const [internalPostulacionSection, setInternalPostulacionSection] = useState('flujo');
  const postulacionSection = externalPostulacionSection || internalPostulacionSection;
  const setPostulacionSection = externalSetPostulacionSection || setInternalPostulacionSection;
  const [expandedStepMsg, setExpandedStepMsg] = useState(null);
  const [activeHerramientaTab, setActiveHerramientaTab] = useState('calculadora');

  // Genera los mensajes propuestos para WhatsApp y Correo por cada paso del embudo
  const getStepMessages = (stepNumber) => {
    const condo = proposalConfig.targetCondo?.trim() || 'su Comunidad';
    const recipient = proposalConfig.targetRecipient?.trim() || 'Señores Miembros del Comité de Administración';
    const admin = empresaForm.adminName || 'John Andrés Arancibia Maureira';
    const phone = empresaForm.phone || '+56 9 5811 8504';
    const feeStr = formatCLP(Number(proposalConfig.proposedMonthlyFee) || 850000);
    const unitsStr = proposalConfig.targetUnits || '60';

    switch (stepNumber) {
      case 1:
        return {
          title: 'Paso 1: Primer Contacto / Carta de Valor (Puerta en Frío)',
          subject: `Presentación Oficial de Administración • ARANPRO Gestión Integral para ${condo}`,
          whatsapp: `Estimados integrantes del Comité de Administración de *${condo}*:\n\nJunto con saludarles muy cordialmente, les escribe *${admin}*, Constructor Civil y Administrador de Condominios bajo la Ley N° 21.442.\n\nNos dirigimos a ustedes para presentarles los servicios de *ARANPRO Gestión Integral*. Reconociendo la enorme dedicación y tiempo que entregan a sus vecinos, ponemos a su disposición un modelo de gestión basado en supervisión técnica en terreno, cuentas 100% transparentes y *plataforma digital + app móvil 100% gratuita para toda la comunidad* (sin cobro de software ni licencias).\n\nNos encantaría coordinar una breve reunión de presentación y una *visita inicial de diagnóstico técnico sin costo ni compromiso* para conocer sus instalaciones críticas y prioridades.\n\nLes comparto adjunta nuestra Carta Oficial de Presentación. Quedo muy atento a su grata respuesta.\n\nAtentamente,\n*${admin}*\nConstructor Civil • Administrador de Condominios\nFono / WhatsApp: ${phone}\nSitio Web: https://aranpro.cl`,
          email: `Estimadas y estimados integrantes del Comité de Administración de ${condo}:\n\nJunto con saludarles cordialmente y reconociendo el importante compromiso y tiempo que dedican a su comunidad, me dirijo a ustedes para presentar los servicios de ARANPRO Gestión Integral y poner a su consideración nuestra administración para ${condo}.\n\nNuestra propuesta se fundamenta en tres pilares operativos:\n1. Gestión Financiera & Plataforma Digital 100% Gratuita para el Comité y residentes (sin costos de licencias ni cobros de software para el condominio).\n2. Mantención Técnica en Terreno con Criterio de Constructor Civil (supervisión directa de salas de bombas, tableros y contratos de contratistas para frenar sobrecostos).\n3. Gestión Documental de Personal bajo Ley Karin, RIOHS y normativa de la Dirección del Trabajo.\n\nLes propongo coordinar una visita inicial en terreno y reunión de presentación sin costo ni compromiso para conocer sus prioridades.\n\nAdjunto nuestra Carta Oficial de Presentación.\n\nSaludos cordiales,\n\n${admin}\nConstructor Civil • Administrador de Condominios\nRepresentante Legal ARANPRO Gestión Integral\nFono: ${phone} | Sitio Web: https://aranpro.cl`
        };
      case 2:
        return {
          title: 'Paso 2: Cita Presencial & Visita de Diagnóstico Técnico (Dossier Integral)',
          subject: `Confirmación de Visita Técnica en Terreno & Dossier Integral • ${condo}`,
          whatsapp: `Estimados integrantes del Comité de *${condo}*:\n\nMuchas gracias por la excelente disposición a reunirnos. Confirmamos nuestra *visita técnica inicial de diagnóstico* a las instalaciones de su condominio para este [Indicar Fecha y Hora].\n\nLlevaremos en mano nuestro *Dossier Integral de Presentación* con nuestras credenciales de Constructor Civil, pauta de inspección preventiva de bombas, tableros y techumbres, certificados legales y cartas de recomendación de otros comités de administración.\n\n¡Nos vemos pronto en terreno!\n\n*${admin}* • ARANPRO (${phone})`,
          email: `Estimado Comité de Administración de ${condo}:\n\nJunto con agradecer su disposición a reunirnos, confirmamos nuestra visita técnica y reunión de diagnóstico para el día [Fecha / Hora].\n\nDurante la visita realizaremos una inspección visual de las instalaciones críticas (sala de bombas, tableros eléctricos, cubiertas y accesos) y llevaremos una copia impresa de nuestro Dossier Integral de Postulación (Ficha Técnica Constructiva, Título Profesional, Acreditaciones Legales y Referencias Comprobables).\n\nQuedamos a su disposición ante cualquier coordinación previa.\n\nAtentamente,\n${admin} • ARANPRO Gestión Integral\n${phone} | https://aranpro.cl`
        };
      case 3:
        return {
          title: 'Paso 3: Propuesta Formal a Medida & Honorarios Mensuales',
          subject: `Propuesta Formal de Administración & Honorarios Mensuales • ${condo}`,
          whatsapp: `Estimado Comité de Administración de *${condo}*:\n\nAgradeciendo la provechosa visita técnica realizada a sus dependencias, hacemos entrega formal de nuestra *Propuesta de Administración y Honorarios a la medida* de su comunidad.\n\nNuestra propuesta contempla un honorario mensual de *${feeStr}* para su dotación de *${unitsStr} unidades*, incluyendo visitas técnicas semanales en terreno, plataforma digital 24/7 sin costo de licencias para residentes, auditoría contable de traspaso y atención de emergencias 24/7.\n\nAdjuntamos la Carta Formal de Postulación para su revisión en sesión de comité. Quedamos a su entera disposición para resolver cualquier duda.\n\nSaludos cordiales,\n*${admin}* • ARANPRO (${phone})`,
          email: `Estimadas y estimados integrantes del Comité de Administración de ${condo}:\n\nEn seguimiento a la visita técnica realizada a sus instalaciones, tenemos el agrado de presentar formalmente nuestra Propuesta Operativa y Económica para asumir la administración de su comunidad.\n\nResumen de Condiciones Propuestas:\n• Honorario Mensual Propuesto: ${feeStr} (${proposalConfig.taxModality || 'Factura Exenta / Boleta Honorarios'})\n• Dotación Considerada: ${unitsStr} unidades (casas / departamentos)\n• Modalidad de Atención: ${proposalConfig.visitFrequency || 'Visitas técnicas semanales en terreno'}\n• Beneficios Incluidos: Suite Web y App Móvil 100% gratuita para residentes y comité, auditoría de traspaso y supervisión técnica directa de obras y contratos.\n\nAdjunto encontrarán la Carta Formal de Postulación con el desglose del servicio.\n\nAtentamente,\n${admin}\nConstructor Civil • Representante Legal ARANPRO\n${phone} | https://aranpro.cl`
        };
      case 4:
        return {
          title: 'Paso 4: Cierre Tecnológico & Demostración de App en Vivo',
          subject: `Acceso a Demo en Vivo de Plataforma & Brochure App ARANPRO • ${condo}`,
          whatsapp: `Estimados integrantes del Comité de *${condo}*:\n\nPara que ustedes y los copropietarios puedan experimentar en primera persona la transparencia y modernidad de nuestra gestión, les compartimos el acceso a la *Demo en Vivo de la Suite Digital y App Móvil ARANPRO* (100% gratuita para su condominio).\n\nPueden probarla directamente desde su teléfono celular escaneando el código QR del brochure adjunto o ingresando a: https://aranpro.cl\n\nPodrán ver cómo se consultan los gastos comunes con un clic, la auditoría en vivo de comprobantes de pago y facturas, y el libro de reclamos digital.\n\n¡Quedamos muy atentos a sus comentarios!\n*${admin}* • ARANPRO (${phone})`,
          email: `Estimado Comité de Administración de ${condo}:\n\nCon el objetivo de respaldar nuestra propuesta de gestión con tecnología real, ponemos a su disposición el Brochure Oficial y el acceso a la Demo Interactiva de la Suite ARANPRO.\n\nPrincipales ventajas para ${condo}:\n• 100% Gratuita para la comunidad: Cero cobros de licencias o costos de software para el condominio.\n• Transparencia total 24/7: Comprobantes bancarios y facturas visibles con 1 clic para copropietarios y directiva.\n• Gestión móvil: Votaciones, libro de reclamos foliado y comunicación oficial en la palma de la mano.\n\nPueden explorar la demo interactiva en https://aranpro.cl o mediante el código QR incluido en el archivo adjunto.\n\nSaludos cordiales,\n${admin} • ARANPRO Gestión Integral\n${phone} | https://aranpro.cl`
        };
      default:
        return { title: '', subject: '', whatsapp: '', email: '' };
    }
  };

  const handleShareWhatsApp = (stepNumber) => {
    const msg = getStepMessages(stepNumber);
    const rawPhone = (proposalConfig.targetPhone || '').replace(/[^0-9]/g, '');
    let phoneParam = '';
    if (rawPhone) {
      phoneParam = rawPhone.startsWith('56') ? rawPhone : (rawPhone.length === 9 ? `56${rawPhone}` : rawPhone);
    }
    const url = phoneParam
      ? `https://wa.me/${phoneParam}?text=${encodeURIComponent(msg.whatsapp)}`
      : `https://wa.me/?text=${encodeURIComponent(msg.whatsapp)}`;
    window.open(url, '_blank');
  };

  const [sendingEmailStep, setSendingEmailStep] = useState(null);

  // Genera la plantilla de correo ejecutiva ARANPRO (mensaje de presentación en el cuerpo + PDF oficial adjunto)
  const buildProposalEmailHtml = (stepNumber, msg, pConfig, empForm, attachedFilename = '') => {
    const condo = pConfig.targetCondo?.trim() || 'su Comunidad';
    const recipient = pConfig.targetRecipient?.trim() || 'Señores Miembros del Comité de Administración';
    const admin = empForm.adminName || 'John Andrés Arancibia Maureira';
    const adminRut = (empForm.adminRut && empForm.adminRut !== '14.882.140-K') ? empForm.adminRut : '16.012.871-2';
    const phone = empForm.phone || '+56 9 5811 8504';
    const logoHeaderUrl = 'https://aranpro-app.pages.dev/brand/email_logo_oscuro.png';
    const sealFooterUrl = 'https://aranpro-app.pages.dev/brand/email_sello_circular.png';
    const signatureUrl = 'https://aranpro-app.pages.dev/brand/email_firma_admin.png';

    const paragraphs = (msg.email || '')
      .split('\n\n')
      .filter(Boolean)
      .filter(p => {
        const trimmed = p.trim();
        if (trimmed.includes(admin) && (trimmed.includes('Constructor Civil') || trimmed.includes('ARANPRO') || trimmed.startsWith('Atentamente') || trimmed.startsWith('Saludos'))) {
          return false;
        }
        if (trimmed === 'Saludos cordiales,' || trimmed === 'Atentamente,') {
          return false;
        }
        return true;
      })
      .map(p => `<p style="margin: 0 0 14px 0; color: #334155; line-height: 1.65; font-size: 14px;">${p.replace(/\n/g, '<br/>')}</p>`)
      .join('');

    const attachmentBanner = attachedFilename
      ? `
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 18px 0 8px 0; background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px 16px;">
          <tr>
            <td style="font-size: 12px; color: #0F3D2E; line-height: 1.5;">
              <strong>📎 Documento Oficial PDF Adjunto:</strong> <span style="font-family: monospace; color: #334155;">${attachedFilename}</span><br/>
              <span style="font-size: 11px; color: #64748b;">Se adjunta en este correo el documento oficial en formato PDF A4 con firma y timbre institucional listo para visualizar, descargar o presentar al Comité.</span>
            </td>
          </tr>
        </table>
      `
      : '';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${msg.subject || 'Presentación Oficial'}</title>
</head>
<body style="margin: 0; padding: 24px 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 640px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.06); border: 2px solid #0F3D2E; margin: auto;">
    <tr>
      <td style="background-color: #0F3D2E; padding: 22px 28px; text-align: left; border-bottom: 3px solid #D4B895;">
        <table width="100%" border="0" cellpadding="0" cellspacing="0">
          <tr>
            <td valign="middle" width="90" style="padding-right: 16px;">
              <img src="${logoHeaderUrl}" alt="Logo Oficial ARANPRO" height="64" style="height: 64px; width: auto; max-width: 110px; display: block; border: 0;" />
            </td>
            <td valign="middle">
              <span style="display: inline-block; font-size: 20px; font-weight: 900; letter-spacing: 2px; color: #ffffff;">
                ARAN<span style="color: #D4B895;">PRO</span>
              </span>
              <span style="display: block; font-size: 11px; font-weight: 700; color: #D4B895; text-transform: uppercase; letter-spacing: 1px; margin-top: 3px;">
                Gestión Integral de Condominios • Ley N° 21.442
              </span>
              <span style="display: block; font-size: 10px; color: #cbd5e1; margin-top: 2px;">
                Registro Nacional MINVU: En trámite (Sol. PN-27583)
              </span>
            </td>
            <td align="right" valign="middle">
              <span style="display: inline-block; background-color: rgba(212, 184, 149, 0.15); border: 1px solid #D4B895; color: #D4B895; padding: 5px 11px; border-radius: 8px; font-size: 11px; font-weight: bold; white-space: nowrap;">
                Constructor Civil
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="background-color: #f8fafc; padding: 12px 32px; border-bottom: 1px solid #e2e8f0;">
        <table width="100%" border="0" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
              Comunidad Objetivo: <strong style="color: #0F3D2E;">${condo}</strong>
            </td>
            <td align="right" style="font-size: 11px; color: #0F3D2E; font-weight: bold;">
              Paso ${stepNumber} de 4 • Documento Oficial Adjunto
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px 32px 20px 32px;">
        <div style="margin-bottom: 20px;">
          <span style="font-size: 11px; font-weight: bold; color: #0F3D2E; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">
            Dirigido a:
          </span>
          <strong style="font-size: 15px; color: #0f172a; display: block;">
            ${recipient}
          </strong>
        </div>

        ${paragraphs}

        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 24px 0 18px 0; background-color: #f0fdf4; border-left: 4px solid #16a34a; border-radius: 8px; padding: 14px 18px;">
          <tr>
            <td>
              <strong style="color: #14532d; font-size: 13px; display: block; margin-bottom: 6px;">
                Pilares Operativos ARANPRO para ${condo}:
              </strong>
              <span style="color: #166534; font-size: 12px; line-height: 1.6; display: block;">
                ✓ <strong>Suite Web &amp; App Móvil 100% Gratuita</strong> para copropietarios y comité (cero cobro de licencias).<br/>
                ✓ <strong>Supervisión Técnica en Terreno</strong> con criterio de Constructor Civil (bombas, tableros, techumbres).<br/>
                ✓ <strong>Transparencia Financiera Total</strong> y gestión de personal bajo Ley N° 21.442 y Ley Karin.
              </span>
            </td>
          </tr>
        </table>

        ${attachmentBanner}

        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 24px 0 12px 0;">
          <tr>
            <td align="center">
              <a href="https://wa.me/56958118504?text=${encodeURIComponent('Hola John, recibimos su presentación para ' + condo)}"
                 style="display: inline-block; background-color: #0F3D2E; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: bold; padding: 13px 26px; border-radius: 12px; border: 1px solid #D4B895; box-shadow: 0 2px 6px rgba(15,61,46,0.2);">
                Coordinar Visita Técnica Gratuita por WhatsApp
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 2px solid #e2e8f0;">
        <table width="100%" border="0" cellpadding="0" cellspacing="0">
          <tr>
            <td valign="middle" width="76" style="padding-right: 14px;">
              <img src="${sealFooterUrl}" alt="Timbre Oficial ARANPRO" width="68" height="68" style="width: 68px; height: 68px; display: block; border: 0;" />
            </td>
            <td valign="middle" style="padding-right: 12px;">
              <strong style="font-size: 11px; color: #0F3D2E; text-transform: uppercase; letter-spacing: 0.5px; display: block;">
                Sello Oficial de Administración
              </strong>
              <span style="font-size: 11px; color: #334155; font-weight: 600; display: block; margin-top: 2px;">
                ARANPRO Gestión Integral • RUT: ${adminRut}
              </span>
              <span style="font-size: 10.5px; color: #64748b; display: block; margin-top: 1px;">
                Registro MINVU: En trámite (Sol. PN-27583) • Ley N° 21.442
              </span>
            </td>
            <td valign="middle" align="right" style="border-left: 1px solid #cbd5e1; padding-left: 16px;">
              <div style="text-align: right; margin-bottom: 2px;">
                <img src="${signatureUrl}" alt="Firma Representante Legal" height="42" style="height: 42px; width: auto; max-width: 160px; display: inline-block; border: 0;" />
              </div>
              <div style="border-top: 1px solid #0F3D2E; padding-top: 4px;">
                <span style="font-size: 11.5px; color: #0F3D2E; font-weight: 700; display: block;">Constructor Civil • Administrador de Condominios</span>
                <span style="font-size: 10.5px; color: #475569; display: block; margin-top: 2px;">RUT: ${adminRut} • Ley N° 21.442</span>
                <span style="font-size: 10.5px; color: #64748b; display: block; margin-top: 3px;">
                  Fono: <strong>${phone}</strong> | <a href="https://aranpro.cl" style="color: #0F3D2E; text-decoration: underline;">aranpro.cl</a>
                </span>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 14px 32px; background-color: #0F3D2E; text-align: center; color: #94a3b8; font-size: 10px; border-top: 2px solid #D4B895;">
        Despachado formalmente desde <strong>contacto@aranpro.cl</strong> mediante la Suite ARANPRO • Copropiedad Inmobiliaria Ley N° 21.442
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  };

  // Envío directo automatizado de correos desde contacto@aranpro.cl vía Resend con PDF adjunto
  const handleShareEmail = async (stepNumber) => {
    const targetEmail = (proposalConfig.targetEmail || '').trim();
    if (!targetEmail) {
      showAlert(
        'Falta Correo del Comité',
        'Por favor completa el campo "Correo Electrónico Comité" en la barra verde superior de configuración antes de enviar.',
        'warning'
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(targetEmail)) {
      showAlert(
        'Correo Inválido',
        `El correo ingresado "${targetEmail}" no parece válido. Por favor verifícalo en la barra de configuración.`,
        'warning'
      );
      return;
    }

    const msg = getStepMessages(stepNumber);
    const condo = proposalConfig.targetCondo?.trim() || 'su Comunidad';
    const senderName = empresaForm.tradeName || 'ARANPRO Gestión Integral';
    const senderEmail = 'contacto@aranpro.cl';

    setSendingEmailStep(stepNumber);
    let sentDirectly = false;
    let pdfAttachment = null;

    try {
      try {
        pdfAttachment = await generateStepPdfAttachment({
          stepNumber,
          proposalConfig,
          empresaForm,
          signatureImage: signatureImage || companySettings?.signatureDataUrl || ''
        });
      } catch (pdfErr) {
        console.warn('No se pudo generar el adjunto PDF automático:', pdfErr);
      }

      const html = buildProposalEmailHtml(
        stepNumber,
        msg,
        proposalConfig,
        empresaForm,
        pdfAttachment?.filename || ''
      );

      const res = await resendMailService.sendSingleEmail({
        from: `${senderName} <${senderEmail}>`,
        to: targetEmail,
        replyTo: empresaForm.email || 'contacto@aranpro.cl',
        subject: msg.subject,
        html: html,
        text: msg.email,
        attachments: pdfAttachment
          ? [{ filename: pdfAttachment.filename, content: pdfAttachment.contentBase64 }]
          : undefined
      });

      if (res && res.success) {
        sentDirectly = true;
      } else {
        console.warn('Resend no despachó directamente en segundo plano:', res?.error);
      }
    } catch (err) {
      console.warn('Excepción en despacho directo, activando cliente oficial:', err);
    } finally {
      setSendingEmailStep(null);
    }

    // Actualizar siempre el pipeline CRM
    try {
      const condoName = proposalConfig.targetCondo?.trim() || 'Nuevo Condominio';
      setPostulationPipeline(prev => prev.map(p => {
        if (p.condoName?.toLowerCase() === condoName.toLowerCase()) {
          return {
            ...p,
            nextAction: `Paso ${stepNumber} + PDF enviado a ${targetEmail}`,
            updatedAt: new Date().toISOString().slice(0, 10)
          };
        }
        return p;
      }));
    } catch (e) {}

    if (sentDirectly) {
      showAlert(
        '✓ Correo y PDF Oficial Despachados',
        `La presentación para ${condo} fue enviada con éxito desde contacto@aranpro.cl a "${targetEmail}" con el logo institucional, timbre oficial y el documento PDF adjunto (${pdfAttachment?.filename || 'Propuesta_ARANPRO.pdf'}).`,
        'success'
      );
    } else {
      // Fallback 100% operativo sin errores bloqueantes: abrir cliente de correo corporativo y copiar contenido
      try {
        navigator.clipboard.writeText(msg.email);
      } catch (e) {}
      const subject = encodeURIComponent(msg.subject);
      const body = encodeURIComponent(msg.email);
      window.location.href = `mailto:${targetEmail}?subject=${subject}&body=${body}`;
      showAlert(
        '✓ Carta Lista en tu Correo Oficial',
        `Se ha abierto tu cliente de correo (Gmail/Outlook) con el destinatario "${targetEmail}", el asunto corporativo y la carta oficial lista para despachar desde contacto@aranpro.cl.\n\n(El texto completo también quedó copiado automáticamente en tu portapapeles).`,
        'success'
      );
    }
  };

  const handleCopyStepMessage = (stepNumber) => {
    const msg = getStepMessages(stepNumber);
    navigator.clipboard.writeText(msg.whatsapp);
    showAlert('✓ Mensaje Copiado', `El texto propuesto del Paso ${stepNumber} para ${proposalConfig.targetCondo || 'el condominio'} fue copiado al portapapeles listo para enviar por WhatsApp o chat.`, 'success');
  };

  const handleSaveTargetCondoToCrm = () => {
    const condoName = proposalConfig.targetCondo?.trim() || 'Nuevo Condominio';
    const existingIdx = postulationPipeline.findIndex(p => p.condoName?.toLowerCase() === condoName.toLowerCase());
    const newEntry = {
      id: existingIdx >= 0 ? postulationPipeline[existingIdx].id : `post-${Date.now()}`,
      condoName: condoName,
      city: proposalConfig.targetCity || 'La Serena',
      unitsCount: Number(proposalConfig.targetUnits) || 60,
      contactName: proposalConfig.targetRecipient || 'Comité de Administración',
      contactPhone: proposalConfig.targetPhone || '',
      contactEmail: proposalConfig.targetEmail || '',
      stage: proposalConfig.currentStage || 'contacto',
      monthlyFeeCLP: Number(proposalConfig.proposedMonthlyFee) || 850000,
      nextAction: proposalConfig.nextAction || 'Enviar Carta de Valor (Paso 1)',
      nextActionDate: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
      competitionNotes: `Postulación iniciada con embudo de 4 pasos.`,
      createdAt: existingIdx >= 0 ? postulationPipeline[existingIdx].createdAt : new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10)
    };

    let updatedPipeline;
    if (existingIdx >= 0) {
      updatedPipeline = postulationPipeline.map((p, idx) => idx === existingIdx ? newEntry : p);
    } else {
      updatedPipeline = [newEntry, ...postulationPipeline];
    }
    setPostulationPipeline(updatedPipeline);
    setCompanySettings(prev => ({
      ...prev,
      postulationPipeline: updatedPipeline,
      lastProposalConfig: proposalConfig
    }));
    showAlert('✓ Condominio Registrado', `"${condoName}" fue guardado exitosamente en tu CRM de Postulaciones.`, 'success');
  };

  // Modales de Material de Apoyo, Ventas y Licitación
  const [previewColdLetterModal, setPreviewColdLetterModal] = useState(false);
  const [previewBrochureModal, setPreviewBrochureModal] = useState(false);
  const [previewInspectionModal, setPreviewInspectionModal] = useState(false);
  const [previewComparisonModal, setPreviewComparisonModal] = useState(false);
  const [showPitchGuideModal, setShowPitchGuideModal] = useState(false);
  const [showLiveDemoModal, setShowLiveDemoModal] = useState(false);

  // Pestaña en simulador de teléfono interactivo
  const [demoScreenTab, setDemoScreenTab] = useState('gastoComun'); // 'gastoComun' | 'comprobantes' | 'reclamos' | 'mural'

  // Formulario de Inspección Técnica Inicial de Entrada (Diagnóstico Gratuito)
  const [inspectionForm, setInspectionForm] = useState({
    targetCondo: proposalConfig.targetCondo || 'Condominio en Evaluación',
    inspector: empresaForm.adminName,
    date: new Date().toISOString().split('T')[0],
    items: [
      { id: 'bombas', name: 'Sala de Bombas & Sistema Hidroneumático', status: 'Requiere Mantención', notes: 'Bombas operativas con fuga leve en sello mecánico de Bomba 2. Manómetro principal descalibrado; requiere regulación de presostato.' },
      { id: 'cubiertas', name: 'Cubiertas, Techumbres & Bajadas de Agua', status: 'Crítico', notes: 'Membrana asfáltica con fisuras en sector poniente; canaletas con acumulación de sedimentos. Riesgo de filtración en temporada de lluvias.' },
      { id: 'electricidad', name: 'Tableros Eléctricos & Grupo Electrógeno', status: 'Bueno', notes: 'Tablero general rotulado según norma SEC. Generador de emergencia operativo con transferencia automática probada.' },
      { id: 'incendios', name: 'Red Húmeda, Red Seca & Seguro Colectivo (Art. 43°)', status: 'Requiere Mantención', notes: 'Extintores con certificación vencida en pisos 3 y 4. Mangueras de red húmeda operativas con presión adecuada.' },
      { id: 'contable', name: 'Fondo de Reserva Legal & Estado Contable (Art. 39° Ley 21.442)', status: 'Crítico', notes: 'La comunidad requiere regularizar la tasa mínima del 5% de recargo para el Fondo de Reserva exigida por el Art. 39° de la Ley N° 21.442.' }
    ]
  });

  // Estados de Asistentes & Auditoría Supabase (Ley 21.442)
  const [assistantsList, setAssistantsList] = useState([]);
  const [auditLogsList, setAuditLogsList] = useState([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [showAddAssistantModal, setShowAddAssistantModal] = useState(false);
  const [assistantForm, setAssistantForm] = useState({
    nombre: '',
    rut: '',
    email: '',
    telefono: '',
    password: '',
    permisos: {
      editar_gastos: true,
      aprobar_pagos: false,
      responder_tickets: true,
      emitir_colillas: false
    }
  });
  const [assistantFeedback, setAssistantFeedback] = useState('');

  // Cargar lista de asistentes y logs de auditoría desde Supabase
  const loadStaffAndLogs = async () => {
    setIsLoadingStaff(true);
    try {
      const { staffAuthService, auditService } = await import('../../services/supabase');
      const res = await staffAuthService.getStaffUsers();
      if (res.success && res.data) {
        setAssistantsList(res.data);
      }
      const logs = await auditService.getRecentLogs(30);
      setAuditLogsList(logs);
    } catch (e) {
      console.warn('Error cargando equipo/auditoría:', e);
    } finally {
      setIsLoadingStaff(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'equipo') {
      loadStaffAndLogs();
    }
  }, [activeSubTab]);

  const handleCreateAssistant = async (e) => {
    e.preventDefault();
    if (!assistantForm.nombre.trim() || !assistantForm.rut.trim() || !assistantForm.password.trim()) {
      setAssistantFeedback('Por favor completa el nombre, RUT y contraseña del asistente.');
      return;
    }
    setAssistantFeedback('Registrando asistente en Supabase...');
    try {
      const { staffAuthService, auditService } = await import('../../services/supabase');
      const res = await staffAuthService.createStaffUser({
        nombre: assistantForm.nombre,
        rut: assistantForm.rut,
        email: assistantForm.email,
        telefono: assistantForm.telefono,
        password: assistantForm.password,
        role: 'asistente',
        permisos: assistantForm.permisos
      });
      if (res.success) {
        await auditService.logAction({
          communityId: currentCommunity?.id,
          action: 'REGISTRAR_ASISTENTE',
          user: { name: empresaForm.adminName, rut: empresaForm.adminRut, role: 'superadmin' },
          details: { asistente_nombre: assistantForm.nombre, asistente_rut: assistantForm.rut }
        });
        setAssistantFeedback('✅ Asistente registrado exitosamente en Supabase.');
        setAssistantForm({
          nombre: '',
          rut: '',
          email: '',
          telefono: '',
          password: '',
          permisos: {
            editar_gastos: true,
            aprobar_pagos: false,
            responder_tickets: true,
            emitir_colillas: false
          }
        });
        await loadStaffAndLogs();
        setTimeout(() => {
          setShowAddAssistantModal(false);
          setAssistantFeedback('');
        }, 1500);
      } else {
        setAssistantFeedback(`❌ Error: ${res.error || 'No se pudo registrar'}`);
      }
    } catch (err) {
      setAssistantFeedback(`❌ Error: ${err.message}`);
    }
  };

  const handleDeleteAssistant = async (id, nombre) => {
    if (!window.confirm(`¿Estás seguro de revocar el acceso a ${nombre}? Ya no podrá ingresar a la plataforma.`)) return;
    try {
      const { staffAuthService, auditService } = await import('../../services/supabase');
      const res = await staffAuthService.deleteStaffUser(id);
      if (res.success) {
        await auditService.logAction({
          communityId: currentCommunity?.id,
          action: 'ELIMINAR_ASISTENTE',
          user: { name: empresaForm.adminName, rut: empresaForm.adminRut, role: 'superadmin' },
          details: { asistente_eliminado: nombre }
        });
        await loadStaffAndLogs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Estado del modal corporativo de confirmación (reemplazo de window.confirm)
  const [modalDialog, setModalDialog] = useState({
    isOpen: false,
    type: 'warning',
    title: '',
    message: '',
    confirmText: 'Aceptar',
    cancelText: 'Cancelar',
    isAlert: false,
    onConfirm: () => {},
    onCancel: () => {}
  });

  const closeConfirmModal = () => {
    setModalDialog(prev => ({ ...prev, isOpen: false }));
  };

  const showAlert = (title, message, type = 'warning') => {
    setModalDialog({
      isOpen: true,
      type,
      title,
      message,
      confirmText: 'Entendido',
      isAlert: true,
      onConfirm: closeConfirmModal,
      onCancel: closeConfirmModal
    });
  };

  const showConfirm = ({ title, message, type = 'warning', confirmText = 'Aceptar', cancelText = 'Cancelar', onConfirm }) => {
    setModalDialog({
      isOpen: true,
      type,
      title,
      message,
      confirmText,
      cancelText,
      isAlert: false,
      onConfirm: () => {
        closeConfirmModal();
        if (onConfirm) onConfirm();
      },
      onCancel: closeConfirmModal
    });
  };

  // Cálculo de estadísticas consolidadas rescatadas del sistema para postulación
  const portfolioStats = useMemo(() => {
    const totalComms = communities.length || 1;
    const totalUnits = communities.reduce((acc, c) => acc + (c.units?.length || 0), 0) || 16;
    const totalIssuedCerts = certificates.filter(c => c.status === 'EMITIDO').length || 6;
    const yearsExp = Math.max(1, new Date().getFullYear() - (parseInt(empresaForm.startYear) || 2019));
    return { totalComms, totalUnits, totalIssuedCerts, yearsExp };
  }, [communities, certificates, empresaForm.startYear]);

  // Hidratar archivos pesados desde IndexedDB (fileVault) al montar el módulo
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [hydratedAcad, hydratedDocs] = await Promise.all([
          hydrateFiles(academicRecords),
          hydrateFiles(accreditationDocs)
        ]);
        if (mounted) {
          setAcademicRecords(hydratedAcad);
          setAccreditationDocs(hydratedDocs);
        }
      } catch (err) {
        console.warn('[fileVault] Error hidratando respaldos digitales:', err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Auditoría en tiempo real del nivel de preparación para licitaciones (Score 0-100)
  const readinessReport = useMemo(() => {
    return computeReadiness({
      documents: accreditationDocs,
      academicRecords,
      references: committeeReferences,
      hasSignature: Boolean(signatureImage),
      empresaForm,
      adminPin,
      portfolio: portfolioStats
    });
  }, [
    accreditationDocs,
    academicRecords,
    committeeReferences,
    signatureImage,
    empresaForm,
    adminPin,
    portfolioStats
  ]);

  const packageFilesCount = useMemo(() => {
    return (
      accreditationDocs.filter(d => d.includeInDossier !== false && hasFile(d)).length +
      academicRecords.filter(r => r.includeInProposal !== false && hasFile(r)).length
    );
  }, [accreditationDocs, academicRecords]);

  // Navegación desde el botón "Resolver" del Semáforo de Preparación
  const handleReadinessAction = (actionKey) => {
    if (actionKey === 'documents') {
      setActiveSubTab('acreditacion');
    } else if (actionKey === 'signature') {
      setActiveSubTab('firma');
    } else if (actionKey === 'company') {
      setActiveSubTab('empresa');
    } else if (actionKey === 'references') {
      setActiveSubTab('postulaciones');
      setPostulacionSection('material');
    }
  };

  // Descargar todos los respaldos digitales adjuntos numerados para carpeta de licitación
  const handleDownloadPackage = () => {
    const docsWithFiles = [
      ...accreditationDocs.filter(d => d.includeInDossier !== false && d.fileData).map(d => ({
        title: d.name,
        fileName: d.fileName,
        fileData: d.fileData
      })),
      ...academicRecords.filter(r => r.includeInProposal !== false && r.fileData).map(r => ({
        title: r.title,
        fileName: r.fileName,
        fileData: r.fileData
      }))
    ];

    if (docsWithFiles.length === 0) {
      showAlert(
        'Sin archivos binarios adjuntos aún',
        'Aún no has subido archivos PDF o imagen en "3. Acreditaciones & Diplomas". Puedes abrir el Dossier Integral para imprimir los certificados digitales generados por el sistema, o subir tus PDFs originales.',
        'info'
      );
      setPreviewDossierModal(true);
      return;
    }

    docsWithFiles.forEach((doc, idx) => {
      const prefix = String(idx + 1).padStart(2, '0');
      const cleanTitle = (doc.title || 'Respaldo').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 45);
      const extMatch = (doc.fileName || '').match(/\.[a-zA-Z0-9]+$/);
      const ext = extMatch ? extMatch[0] : '.pdf';
      setTimeout(() => {
        downloadDataUrl(doc.fileData, `${prefix}_ARANPRO_${cleanTitle}${ext}`);
      }, idx * 250);
    });

    showAlert(
      '✓ Descargando Anexos Numerados',
      `Se están descargando ${docsWithFiles.length} archivo(s) de respaldo numerados correlativamente para tu carpeta de licitación.`,
      'success'
    );
  };

  // Cargar datos desde una tarjeta del CRM Pipeline hacia el generador de Dossier y Carta
  const handlePrepareDossierFromPipeline = (item) => {
    const targetName = item.condo || item.condoName || '';
    const targetUnitsVal = item.units || item.unitsCount || '60';
    const rawFee = String(item.monthlyFeeCLP || item.feeOffered || '480000').replace(/[^0-9]/g, '') || '480000';
    setProposalConfig(prev => ({
      ...prev,
      targetCondo: targetName || prev.targetCondo,
      targetCity: item.city || prev.targetCity,
      targetRecipient: item.contactName
        ? `${item.contactName}${item.contactRole ? ` — ${item.contactRole}` : ''}`
        : 'Señores Miembros del Comité de Administración',
      leaveRecipientBlank: false,
      targetUnits: String(targetUnitsVal),
      proposedMonthlyFee: rawFee
    }));
    setInspectionForm(prev => ({
      ...prev,
      targetCondo: targetName || prev.targetCondo
    }));
    setPostulacionSection('material');
    showAlert(
      '✓ Dossier Configurado para Comunidad',
      `Se cargaron los datos de "${targetName}" en la Carta de Presentación, Propuesta Económica y Dossier Integral.`,
      'success'
    );
  };

  // CRUD de Referencias Comprobables de Comités
  const handleOpenAddRef = () => {
    setEditingRefId(null);
    setRefForm({
      communityName: currentCommunity?.name || 'Condominio Los Cerezos',
      contactName: '',
      role: 'Presidente(a) del Comité',
      phone: '+569',
      quote: '',
      confirmed: true
    });
    setShowRefModal(true);
  };

  const handleOpenEditRef = (ref) => {
    setEditingRefId(ref.id);
    setRefForm({
      communityName: ref.communityName || '',
      contactName: ref.contactName || '',
      role: ref.role || 'Presidente(a) del Comité',
      phone: ref.phone || '',
      quote: ref.quote || '',
      confirmed: ref.confirmed !== false
    });
    setShowRefModal(true);
  };

  const handleSaveRef = (e) => {
    if (e) e.preventDefault();
    if (!refForm.contactName.trim() || !refForm.communityName.trim()) {
      showAlert('Datos Incompletos', 'Ingresa el nombre del dirigente del Comité y el nombre de la comunidad.', 'warning');
      return;
    }
    const payload = {
      id: editingRefId || `ref-${Date.now()}`,
      communityName: refForm.communityName.trim(),
      contactName: refForm.contactName.trim(),
      role: refForm.role.trim() || 'Miembro del Comité',
      phone: refForm.phone.trim(),
      confirmed: Boolean(refForm.confirmed),
      status: refForm.confirmed ? 'Recomendación Favorable Otorgada' : 'En gestión de autorización',
      quote: refForm.quote.trim() || 'Gestión transparente, responsable y con sólido dominio técnico en terreno.'
    };

    if (editingRefId) {
      setCommitteeReferences(prev => prev.map(r => r.id === editingRefId ? payload : r));
    } else {
      setCommitteeReferences(prev => [payload, ...prev]);
    }
    setShowRefModal(false);
    setEditingRefId(null);
  };

  const handleDeleteRef = (ref) => {
    showConfirm({
      title: '¿Eliminar referencia del Comité?',
      message: `Se quitará la referencia de ${ref.contactName} (${ref.communityName}) del Dossier.`,
      type: 'danger',
      confirmText: 'Eliminar',
      onConfirm: () => {
        setCommitteeReferences(prev => prev.filter(r => r.id !== ref.id));
      }
    });
  };

  const handleToggleConfirmRef = (id) => {
    setCommitteeReferences(prev => prev.map(r => {
      if (r.id !== id) return r;
      const nextConf = r.confirmed === false;
      return {
        ...r,
        confirmed: nextConf,
        status: nextConf ? 'Recomendación Favorable Otorgada' : 'Pendiente de confirmación'
      };
    }));
  };

  // Agregar o quitar partida de inspección técnica
  const handleAddInspectionItem = () => {
    if (!newInspectionItemName.trim()) return;
    const newItem = {
      id: `insp-${Date.now()}`,
      name: newInspectionItemName.trim(),
      status: 'Requiere Mantención',
      notes: 'Observación técnica levantada en terreno durante inspección preventiva.'
    };
    setInspectionForm(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
    setNewInspectionItemName('');
  };

  const handleRemoveInspectionItem = (id) => {
    setInspectionForm(prev => ({
      ...prev,
      items: prev.items.filter(it => it.id !== id)
    }));
  };

  // --- LÓGICA DEL CANVAS DE DIBUJO DE FIRMA DIGITAL ---
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);

    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
    setHasCanvasDrawn(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  // Auto-recortar márgenes blancos/transparentes de la firma existente al cargar
  useEffect(() => {
    if (signatureImage && !autoTrimmedRef.current) {
      autoTrimmedRef.current = true;
      autoTrimSignatureDataUrl(signatureImage).then((trimmed) => {
        if (trimmed && trimmed !== signatureImage) {
          setSignatureImage(trimmed);
          setCompanySettings(prev => ({
            ...prev,
            signatureDataUrl: trimmed,
            signature: trimmed,
            digitalSignature: trimmed
          }));
        }
      });
    }
  }, [signatureImage, setCompanySettings]);

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const rawDataUrl = canvas.toDataURL('image/png');
      autoTrimmedRef.current = true;
      autoTrimSignatureDataUrl(rawDataUrl).then((dataUrl) => {
        setSignatureImage(dataUrl);
        setHasCanvasDrawn(true);
        setCompanySettings(prev => ({
          ...prev,
          signatureDataUrl: dataUrl,
          signature: dataUrl,
          digitalSignature: dataUrl
        }));
      });
    }
  };

  const clearSignatureCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureImage('');
    setHasCanvasDrawn(false);
    setCompanySettings(prev => ({
      ...prev,
      signatureDataUrl: '',
      signature: '',
      digitalSignature: ''
    }));
  };

  const handleUploadSignatureFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        autoTrimmedRef.current = true;
        autoTrimSignatureDataUrl(result).then((trimmed) => {
          setSignatureImage(trimmed);
          setHasCanvasDrawn(true);
          setCompanySettings(prev => ({
            ...prev,
            signatureDataUrl: trimmed,
            signature: trimmed,
            digitalSignature: trimmed
          }));
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Guardar configuración completa en context / localStorage + IndexedDB Vault para archivos pesados
  const handleSaveAllSettings = async (e) => {
    if (e) e.preventDefault();

    let lightAcademic = academicRecords;
    let lightAccreditation = accreditationDocs;
    try {
      [lightAcademic, lightAccreditation] = await Promise.all([
        stripAndStoreFiles(academicRecords, 'acad'),
        stripAndStoreFiles(accreditationDocs, 'doc')
      ]);
    } catch (err) {
      console.warn('[fileVault] Fallback guardando en memoria local:', err);
    }

    const updatedSettings = {
      ...companySettings,
      brandName: empresaForm.brandName,
      provisionalName: empresaForm.provisionalName,
      companyRut: empresaForm.companyRut,
      address: empresaForm.address,
      city: empresaForm.city,
      phone: empresaForm.phone,
      email: empresaForm.email,
      website: empresaForm.website,
      adminName: empresaForm.adminName,
      administratorName: empresaForm.adminName,
      adminRut: empresaForm.adminRut,
      adminRole: empresaForm.adminRole,
      rnacNumber: empresaForm.rnacNumber,
      rnacCategory: empresaForm.rnacCategory,
      adminPin: adminPin,
      signatureDataUrl: signatureImage,
      signature: signatureImage,
      digitalSignature: signatureImage,
      signatureScale: signatureScale,
      profileLicitacion: {
        specialty: empresaForm.specialty,
        startYear: empresaForm.startYear,
        presentationText: empresaForm.presentationText
      },
      academicBackground: lightAcademic,
      accreditationFiles: lightAccreditation,
      committeeReferenceRequests: committeeReferences,
      postulationPipeline: postulationPipeline,
      lastProposalConfig: proposalConfig
    };

    setCompanySettings(updatedSettings);
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 3000);
  };

  // Sugerir presentación maestra con IA desde historial
  const handleSuggestPresentationFromHistory = () => {
    const suggested = `ARANPRO es una empresa de gestión y administración profesional de condominios con ${portfolioStats.yearsExp} años de trayectoria en la Región de Coquimbo. A la fecha administramos ${portfolioStats.totalComms} comunidad(es) con más de ${portfolioStats.totalUnits} unidades habitacionales. Nuestro valor diferenciador único radica en el perfil de Constructor Civil de nuestro administrador titular, combinando sólida fiscalización de contratos de mantención, auditoría preventiva de bombas y ascensores, junto a un portal web exclusivo que otorga transparencia 100% en las cuentas y cobros mensuales.`;
    setEmpresaForm(prev => ({ ...prev, presentationText: suggested }));
  };

  // Solicitar carta de recomendación al Presidente del Comité vía WhatsApp
  const handleRequestReferenceWhatsApp = (ref) => {
    const phoneClean = (ref.phone || '').replace(/[^0-9]/g, '');
    const msg = `*SOLICITUD DE CARTA DE REFERENCIA • ADMINISTRACIÓN ARANPRO*\n` +
      `Estimado(a) *${ref.contactName}* (${ref.role} de *${ref.communityName}*),\n\n` +
      `Junto con saludarle cordialmente, nos encontramos participando en un proceso de licitación para la administración de una nueva comunidad habitacional en la región.\n\n` +
      `Con el propósito de acreditar nuestra trayectoria y satisfacción de los copropietarios, le agradeceríamos enormemente si pudiéramos contar con una breve carta de recomendación o constancia de conformidad de su gestión como Comité.\n\n` +
      `Agradecemos desde ya su constante apoyo y confianza en nuestro trabajo profesional.\n\n` +
      `Atentamente,\n*${empresaForm.adminName}*\nConstructor Civil • Administrador Titular ARANPRO`;

    const url = phoneClean ? `https://wa.me/${phoneClean}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // Imprimir Carta de Postulación en PDF Carta
  const handlePrintProposal = () => {
    if (!previewProposalModal) setPreviewProposalModal(true);
    const targetClean = (proposalConfig.targetCondo || 'Comunidad').replace(/[^a-zA-Z0-9]/g, '_');
    const dateClean = (proposalConfig.proposalDate || new Date().toISOString().slice(0, 10)).replace(/[^0-9]/g, '');
    const filename = `ARANPRO_Carta_Presentacion_${targetClean}_${dateClean}`;
    printDocumentDirectly('printable-commercial-proposal', filename, {
      pageSize: 'letter portrait',
      fitPage: true,
      margin: '4mm 6mm 4mm 6mm'
    });
  };

  // Imprimir Carta de Valor & Prospección Rápida (Puerta en Frío / Conserjería)
  const handlePrintColdLetter = () => {
    if (!previewColdLetterModal) setPreviewColdLetterModal(true);
    const targetClean = (proposalConfig.targetCondo || 'Comite_Administracion').replace(/[^a-zA-Z0-9]/g, '_');
    const dateClean = (proposalConfig.proposalDate || new Date().toISOString().slice(0, 10)).replace(/[^0-9]/g, '');
    const filename = `ARANPRO_Carta_Valor_Comite_${targetClean}_${dateClean}`;
    printDocumentDirectly('printable-cold-value-letter', filename, {
      pageSize: 'letter portrait',
      fitPage: true,
      margin: '4mm 6mm 4mm 6mm'
    });
  };

  // Imprimir Dossier Integral de Licitación (Carta + Ficha Técnica Constructiva + Diplomas + Cartas Recomendación)
  const handlePrintDossier = () => {
    if (!previewDossierModal) setPreviewDossierModal(true);
    const targetClean = (proposalConfig.targetCondo || 'Comunidad').replace(/[^a-zA-Z0-9]/g, '_');
    const dateClean = (proposalConfig.proposalDate || new Date().toISOString().slice(0, 10)).replace(/[^0-9]/g, '');
    const filename = `ARANPRO_Dossier_Integral_Licitacion_${targetClean}_${dateClean}`;
    printDocumentDirectly('printable-full-dossier', filename, {
      pageSize: 'letter portrait',
      fitPage: false,
      margin: '4mm 6mm 4mm 6mm'
    });
  };

  // Imprimir Brochure Ejecutivo de la App & Portal Web (PDF Carta)
  const handlePrintBrochure = () => {
    if (!previewBrochureModal) setPreviewBrochureModal(true);
    const targetClean = (proposalConfig.targetCondo || currentCommunity?.name || 'Condominios').replace(/[^a-zA-Z0-9]/g, '_');
    const dateClean = new Date().toISOString().slice(0, 10).replace(/[^0-9]/g, '');
    const filename = `ARANPRO_Brochure_App_Copropietarios_${targetClean}_${dateClean}`;
    printDocumentDirectly('printable-app-brochure', filename, {
      pageSize: 'letter portrait',
      fitPage: true,
      margin: '4mm 6mm 4mm 6mm'
    });
  };

  // Imprimir Informe de Diagnóstico Técnico Inicial Gratuito
  const handlePrintInspectionReport = () => {
    if (!previewInspectionModal) setPreviewInspectionModal(true);
    const targetClean = (inspectionForm.targetCondo || proposalConfig.targetCondo || 'Condominio').replace(/[^a-zA-Z0-9]/g, '_');
    const dateClean = (inspectionForm.date || new Date().toISOString().slice(0, 10)).replace(/[^0-9]/g, '');
    const filename = `ARANPRO_Informe_Diagnostico_Tecnico_${targetClean}_${dateClean}`;
    printDocumentDirectly('printable-technical-inspection', filename, {
      pageSize: 'letter portrait',
      fitPage: true,
      margin: '4mm 6mm 4mm 6mm'
    });
  };

  // Imprimir Cuadro Comparativo (Tradicional vs. ARANPRO)
  const handlePrintComparisonMatrix = () => {
    if (!previewComparisonModal) setPreviewComparisonModal(true);
    const targetClean = (proposalConfig.targetCondo || currentCommunity?.name || 'Comunidad').replace(/[^a-zA-Z0-9]/g, '_');
    const dateClean = new Date().toISOString().slice(0, 10).replace(/[^0-9]/g, '');
    const filename = `ARANPRO_Matriz_Comparativa_Gestion_${targetClean}_${dateClean}`;
    printDocumentDirectly('printable-comparison-matrix', filename, {
      pageSize: 'letter portrait',
      fitPage: true,
      margin: '4mm 6mm 4mm 6mm'
    });
  };

  // Compartir Enlace de Demo Interactiva por WhatsApp
  const handleShareDemoWhatsApp = (targetPhone = '') => {
    const phoneClean = (targetPhone || '').replace(/[^0-9]/g, '');
    const currentUrl = window.location.origin;
    const msg = `*INVITACIÓN DEMO INTERACTIVA • ADMINISTRACIÓN ARANPRO*\n` +
      `Estimados miembros del Comité de Administración de *${proposalConfig.targetCondo || 'su Condominio'}*:\n\n` +
      `Junto con saludarles, los invitamos a probar en vivo y en directo la plataforma digital y aplicación móvil que implementamos para su comunidad.\n\n` +
      `🔗 *Enlace de Demostración para Copropietarios:* ${currentUrl}\n\n` +
      `Podrán experimentar la transparencia 100% en vivo: colillas con desglose legal, auditoría de facturas y boletas con un solo clic, y el libro oficial de reclamos.\n\n` +
      `Quedamos a su disposición para coordinar una reunión presencial o telemática.\n` +
      `*${empresaForm.adminName}* • Fono: ${empresaForm.phone}`;

    const url = phoneClean ? `https://wa.me/${phoneClean}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // Copiar Guion de Pitch de 10 Minutos al Portapapeles
  const handleCopyPitchToClipboard = () => {
    const pitchText = `GUION MAESTRO ARANPRO (PRESENTACIÓN EN 10 MINUTOS)\n` +
      `1. MINUTO 1-2 (El Dolor Común): La mayoría de las comunidades cambian de administración por desconfianza en los gastos y demora en resolver problemas. En ARANPRO eliminamos ambos con tecnología y presencia técnica.\n` +
      `2. MINUTO 3-5 (Ventaja Técnica Constructiva): Administrador con formación de Constructor Civil. Auditamos en terreno bombas, techumbres, filtraciones y tableros eléctricos, frenando sobreprecios de contratistas.\n` +
      `3. MINUTO 6-8 (Demostración de la App): Cada vecino tiene en su celular los gastos comunes y puede auditar con un clic las facturas reales y cartolas bancarias.\n` +
      `4. MINUTO 9-10 (Cierre y Traspaso): Auditoría inicial de traspaso sin costo y diagnóstico constructivo preventivo.\n` +
      `Contacto: ${empresaForm.adminName} • ${empresaForm.phone}`;

    navigator.clipboard.writeText(pitchText);
    showAlert('✓ Guion Copiado', 'El libreto maestro de 10 minutos se ha copiado al portapapeles.', 'success');
  };

  // Barra de herramientas contextual unificada para la Caja de Herramientas
  const renderToolboxNavbar = () => (
    <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-100 rounded-2xl border border-slate-200 mb-2 animate-in fade-in">
      <div className="flex items-center gap-2 px-1">
        <span className="w-7 h-7 rounded-xl bg-[#0F3D2E] text-[#D4B895] flex items-center justify-center font-bold text-xs shadow-xs">
          🧰
        </span>
        <div>
          <span className="text-[10.5px] font-black uppercase text-[#0F3D2E] tracking-wider block leading-tight">
            Caja de Herramientas de Licitación
          </span>
          <span className="text-[9.5px] text-slate-500 font-medium leading-none">
            Instrumentos técnicos de apoyo para ganar la administración
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {[
          { id: 'calculadora', label: 'Calculadora AGACECH', icon: Calculator },
          { id: 'inspeccion', label: 'Pauta Inspección', icon: HardHat },
          { id: 'comparativa', label: 'Cuadro Comparativo', icon: Scale },
          { id: 'demo', label: 'Demo en Vivo & QR', icon: QrCode },
          { id: 'pitch', label: 'Libreto Pitch (10 Min)', icon: Presentation },
          { id: 'preparacion', label: 'Checklist & Semáforo', icon: ClipboardCheck },
        ].map((tool) => {
          const ToolIcon = tool.icon;
          const isSelected =
            postulacionSection === tool.id ||
            (tool.id === 'calculadora' && postulacionSection === 'herramientas');
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => setPostulacionSection(tool.id)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all ${
                isSelected
                  ? 'bg-[#0F3D2E] text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-[#0F3D2E]'
              }`}
            >
              <ToolIcon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#D4B895]' : 'text-slate-500'}`} />
              <span>{tool.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  // Manejo de Archivo de Diploma (PDF o Imagen en Data URL)
  const handleDiplomaFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      showAlert('Archivo demasiado grande', 'El archivo no debe exceder los 8 MB para garantizar el respaldo ágil en el sistema.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (typeof dataUrl === 'string') {
        const sizeStr = file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(file.size / 1024)} KB`;

        setNewDiplomaForm(prev => ({
          ...prev,
          fileName: file.name,
          fileType: file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
          fileData: dataUrl,
          fileSize: sizeStr
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Guardar / Actualizar Diploma o Certificado de Curso
  const handleSaveDiploma = (e) => {
    if (e) e.preventDefault();
    if (!newDiplomaForm.title.trim() || !newDiplomaForm.institution.trim()) {
      showAlert('Campos Obligatorios', 'Por favor ingresa al menos el Nombre del Título/Curso y la Institución emisora.', 'warning');
      return;
    }

    if (editingDiplomaId) {
      setAcademicRecords(prev => prev.map(item => {
        if (item.id === editingDiplomaId) {
          return {
            ...item,
            title: newDiplomaForm.title.trim(),
            institution: newDiplomaForm.institution.trim(),
            category: newDiplomaForm.category,
            status: newDiplomaForm.status,
            year: newDiplomaForm.year.trim() || new Date().getFullYear().toString(),
            relevance: newDiplomaForm.relevance.trim() || 'Aporte técnico para la supervisión y mantenimiento de instalaciones.',
            fileName: newDiplomaForm.fileName || item.fileName || 'Diploma_Acreditado.pdf',
            fileType: newDiplomaForm.fileType || item.fileType || 'application/pdf',
            fileData: newDiplomaForm.fileData !== undefined ? newDiplomaForm.fileData : item.fileData,
            fileSize: newDiplomaForm.fileSize || item.fileSize || '1.1 MB',
            includeInProposal: newDiplomaForm.includeInProposal !== false
          };
        }
        return item;
      }));
      showAlert('✓ Certificado Actualizado', 'El registro y respaldo del diploma se actualizaron correctamente.', 'success');
    } else {
      const newRecord = {
        id: `acad-${Date.now()}`,
        title: newDiplomaForm.title.trim(),
        institution: newDiplomaForm.institution.trim(),
        category: newDiplomaForm.category,
        status: newDiplomaForm.status,
        year: newDiplomaForm.year.trim() || new Date().getFullYear().toString(),
        relevance: newDiplomaForm.relevance.trim() || 'Aporte técnico fundamental para la inspección y mantenimiento de las instalaciones comunes.',
        fileName: newDiplomaForm.fileName || 'Diploma_Acreditado.pdf',
        fileType: newDiplomaForm.fileType || 'application/pdf',
        fileData: newDiplomaForm.fileData || null,
        fileSize: newDiplomaForm.fileSize || '980 KB',
        uploadDate: new Date().toISOString().split('T')[0],
        includeInProposal: newDiplomaForm.includeInProposal !== false
      };
      setAcademicRecords(prev => [newRecord, ...prev]);
      showAlert('✓ Diploma / Curso Guardado', 'El respaldo digital ha sido incorporado y custodiado en el sistema con éxito.', 'success');
    }

    setShowUploadDiplomaModal(false);
    setEditingDiplomaId(null);
    setNewDiplomaForm(initialNewDiplomaState);
  };

  // Abrir Modal para Editar Diploma Existente
  const handleEditDiploma = (item) => {
    setEditingDiplomaId(item.id);
    setNewDiplomaForm({
      title: item.title,
      institution: item.institution,
      category: item.category || 'Título Técnico Profesional',
      status: item.status || 'Titulado',
      year: item.year || '',
      relevance: item.relevance || '',
      fileName: item.fileName || '',
      fileType: item.fileType || '',
      fileData: item.fileData || null,
      fileSize: item.fileSize || '',
      includeInProposal: item.includeInProposal !== false
    });
    setShowUploadDiplomaModal(true);
  };

  // Eliminar Diploma con Diálogo Corporativo Seguro
  const handleDeleteDiploma = (item) => {
    showConfirm({
      title: '¿Eliminar Diploma o Acreditación?',
      message: `¿Estás seguro de eliminar "${item.title}"?\n\nSe desvinculará el archivo de respaldo y ya no se adjuntará al dossier de licitación.`,
      type: 'danger',
      confirmText: 'Sí, Eliminar Registro',
      cancelText: 'Conservar',
      onConfirm: () => {
        setAcademicRecords(prev => prev.filter(r => r.id !== item.id));
        showAlert('Registro Eliminado', 'El diploma ha sido quitado de los registros de la empresa.', 'info');
      }
    });
  };

  // Alternar Inclusión en el Dossier de Postulación
  const handleToggleIncludeInProposal = (id) => {
    setAcademicRecords(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, includeInProposal: !item.includeInProposal };
      }
      return item;
    }));
  };

  // Descargar Archivo de Respaldo Original del Diploma con Nomenclatura Única
  const handleDownloadDiplomaFile = (item) => {
    const titleClean = (item.title || 'Acreditacion').replace(/[^a-zA-Z0-9]/g, '_');
    const dateClean = (item.year || new Date().getFullYear());
    const filename = `ARANPRO_Acreditacion_${titleClean}_${dateClean}`;
    if (item.fileData) {
      const link = document.createElement('a');
      link.href = item.fileData;
      link.download = item.fileName || `${filename}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } else {
      printDocumentDirectly('diploma-certificate-preview-card', filename, {
        pageSize: 'letter portrait',
        fitPage: false,
        margin: '10mm'
      });
    }
  };

  // Menú de Navegación Lateral (Estilo ECP)
  const navSubItems = [
    { id: 'empresa', label: 'Empresa', icon: Building2, desc: 'Datos de la empresa, RUT y representante legal' },
    { id: 'firma', label: 'Firma Digital', icon: PenTool, desc: 'Firma manuscrita en canvas y vista previa PDF' },
    { id: 'acreditacion', label: 'Acreditaciones & Diplomas', icon: HardHat, desc: 'Constructor Civil, Ley 21.442 y títulos' },
    { id: 'postulaciones', label: 'Postulaciones & Dossier', icon: Briefcase, desc: 'Carta de presentación, referencias y licitaciones' },
    { id: 'equipo', label: 'Equipo & Asistentes', icon: Users, desc: 'Asistentes autorizados, permisos y auditoría Ley 21.442' },
    { id: 'respaldos', label: 'Respaldos & Seguridad', icon: Key, desc: 'Backup integral JSON, PIN maestro y restauración' },
    { id: 'sobre_app', label: 'Sobre la aplicación', icon: BookOpen, desc: 'Versión, quiénes somos, misión, visión y licencia' }
  ];

  return (
    <div className="w-full space-y-6">
      {/* 1. CABECERA CORPORATIVA ARANPRO (OCULTABLE SI SE RENDERIZA DESDE UN MÓDULO PADRE) */}
      {!hideHeader && (
        <div className="bg-gradient-to-r from-[#0F3D2E] via-[#144D3A] to-[#0A291F] text-white p-6 md:p-8 rounded-3xl shadow-lg border border-emerald-900/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4B895]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#D4B895]/20 text-[#D4B895] border border-[#D4B895]/30">
                  <Settings className="w-3.5 h-3.5 text-[#D4B895]" />
                  CENTRO DE CONFIGURACIÓN & EMPRESA • LEY 21.442
                </span>
                <span className="text-xs text-emerald-200/80 font-medium">
                  {empresaForm.provisionalName}
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
                Configuración Corporativa & Licitaciones
              </h2>
              <p className="text-xs md:text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
                Gestión centralizada de datos de la empresa, firma digital manuscrita, acreditaciones técnicas en construcción,
                generación de cartas de postulación a nuevos condominios y respaldos de seguridad.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleSaveAllSettings}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#D4B895] to-[#C2A37D] text-[#0F3D2E] font-bold text-sm shadow-md hover:brightness-105 active:scale-95 transition-all"
              >
                <Check className="w-4 h-4 text-[#0F3D2E]" />
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {saveFeedback && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>✓ Configuración, firma digital y acreditaciones guardadas exitosamente en toda la plataforma.</span>
        </div>
      )}

      {/* 2. SUB-MENÚ HORIZONTAL DE ACCESO RÁPIDO Y NAVEGACIÓN EN EL MÓDULO (OCULTABLE PARA NO DUPLICAR LA BARRA LATERAL) */}
      {!hideNavBar && (
        <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {navSubItems.map((item) => {
              const IconComp = item.icon;
              const isActive = activeSubTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSubTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#0F3D2E] text-white shadow-xs'
                      : 'text-slate-600 hover:text-[#0F3D2E] hover:bg-slate-50'
                  }`}
                >
                  <IconComp className={`w-4 h-4 ${isActive ? 'text-[#D4B895]' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. PANEL DE CONTENIDO EN ANCHO COMPLETO (100% FULL WIDTH) */}
      <div className="w-full bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-xs space-y-6">

        {/* ==================== SUB-PESTAÑA 1: EMPRESA & REPRESENTANTE LEGAL ==================== */}
          {activeSubTab === 'empresa' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <span className="text-[10px] font-bold text-[#D4B895] uppercase tracking-wider block">
                  Identidad Comercial & Jurídica
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  Datos de la Empresa y Representante Legal
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Esta información aparece en las colillas de cobro, contratos, presupuestos y certificados oficiales.
                </p>
              </div>

              {/* 1. DATOS DE LA EMPRESA (TIPO ECP SCREENSHOT 2) */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-[#0F3D2E]" />
                  <span>🏢 DATOS DE LA EMPRESA</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      RAZÓN SOCIAL *
                    </label>
                    <input
                      type="text"
                      value={empresaForm.provisionalName}
                      onChange={(e) => setEmpresaForm({ ...empresaForm, provisionalName: e.target.value })}
                      placeholder="Ej: ARANPRO SpA"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      RUT EMPRESA (OPCIONAL — SE OCULTA EN DOCUMENTOS SI ESTÁ VACÍO)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={empresaForm.companyRut}
                        onChange={(e) => setEmpresaForm({ ...empresaForm, companyRut: e.target.value })}
                        placeholder="Dejar vacío hasta constituir la sociedad (Ej: 76.123.456-7)"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                      />
                      <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold px-2 py-0.5 rounded border ${
                        !empresaForm.companyRut?.trim()
                          ? 'text-slate-500 bg-slate-100 border-slate-200'
                          : validateRut(empresaForm.companyRut)
                          ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                          : 'text-amber-700 bg-amber-50 border-amber-200'
                      }`}>
                        {!empresaForm.companyRut?.trim()
                          ? 'Oculto en documentos'
                          : validateRut(empresaForm.companyRut)
                          ? '✓ RUT válido'
                          : '⚠️ RUT a verificar'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      DIRECCIÓN
                    </label>
                    <input
                      type="text"
                      value={empresaForm.address}
                      onChange={(e) => setEmpresaForm({ ...empresaForm, address: e.target.value })}
                      placeholder="Ej: Av. Cuatro Esquinas 1520, Of. 402"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      CIUDAD
                    </label>
                    <input
                      type="text"
                      value={empresaForm.city}
                      onChange={(e) => setEmpresaForm({ ...empresaForm, city: e.target.value })}
                      placeholder="Ej: La Serena, Coquimbo, Chile"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      PAÍS DE OPERACIÓN
                    </label>
                    <select
                      value={empresaForm.country || 'Chile'}
                      onChange={(e) => setEmpresaForm({ ...empresaForm, country: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                    >
                      <option value="Chile">Chile</option>
                    </select>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Define el país usado en documentos y en el prompt. También actualiza moneda e impuesto en Presupuesto.
                    </p>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      TELÉFONO
                    </label>
                    <input
                      type="tel"
                      value={empresaForm.phone}
                      onChange={(e) => setEmpresaForm({ ...empresaForm, phone: e.target.value })}
                      placeholder="+56958118504"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      EMAIL
                    </label>
                    <input
                      type="email"
                      value={empresaForm.email}
                      onChange={(e) => setEmpresaForm({ ...empresaForm, email: e.target.value })}
                      placeholder="contacto@aranpro.cl"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    SITIO WEB
                  </label>
                  <input
                    type="url"
                    value={empresaForm.website}
                    onChange={(e) => setEmpresaForm({ ...empresaForm, website: e.target.value })}
                    placeholder="https://aranpro.cl"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                  />
                </div>
              </div>

              {/* 2. PERFIL PARA LICITACIONES Y CARTAS (TIPO ECP SCREENSHOT 2) */}
              <div className="pt-6 border-t border-slate-100 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      Perfil para licitaciones y cartas
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Este texto es la presentación maestra de tu empresa. Se reutiliza en cartas para clientes particulares y en cartas de licitación, sin prometer experiencia que no puedas acreditar.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSuggestPresentationFromHistory}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-[11px] font-bold transition-all shrink-0 self-start sm:self-center"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    ✨ Sugerir desde mi historial
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      RUBRO O ESPECIALIDAD PRINCIPAL
                    </label>
                    <input
                      type="text"
                      value={empresaForm.specialty}
                      onChange={(e) => setEmpresaForm({ ...empresaForm, specialty: e.target.value })}
                      placeholder="Ej: obras civiles, mantención de áreas verdes, administración de condominios"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      AÑO DE INICIO DE ACTIVIDADES
                    </label>
                    <input
                      type="number"
                      value={empresaForm.startYear}
                      onChange={(e) => setEmpresaForm({ ...empresaForm, startYear: e.target.value })}
                      placeholder="Ej: 2018"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    PRESENTACIÓN ESTÁNDAR DE LA EMPRESA
                  </label>
                  <textarea
                    rows={4}
                    value={empresaForm.presentationText}
                    onChange={(e) => setEmpresaForm({ ...empresaForm, presentationText: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                    placeholder="Describe experiencia, especialidades, forma de trabajo y fortalezas comprobables..."
                  />
                </div>
              </div>

              {/* 3. REPRESENTANTE LEGAL / FIRMANTE (TIPO ECP SCREENSHOT 1) */}
              <div className="pt-6 border-t border-slate-100 space-y-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-[#0F3D2E]" />
                    Representante Legal / Firmante
                  </h4>
                  <p className="text-[11px] text-amber-700 font-medium flex items-center gap-1.5 mt-0.5">
                    <span>💡</span>
                    <span>Aparecen en Contratos, documentos legales y al pie de los PDFs.</span>
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      NOMBRE COMPLETO *
                    </label>
                    <input
                      type="text"
                      value={empresaForm.adminName}
                      onChange={(e) => setEmpresaForm({ ...empresaForm, adminName: e.target.value })}
                      placeholder="Ej: Juan Pérez González"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      RUT DEL REPRESENTANTE *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={empresaForm.adminRut}
                        onChange={(e) => setEmpresaForm({ ...empresaForm, adminRut: e.target.value })}
                        placeholder="Ej: 12.345.678-9"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                        required
                      />
                      <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold px-2 py-0.5 rounded border ${
                        validateRut(empresaForm.adminRut)
                          ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                          : 'text-amber-700 bg-amber-50 border-amber-200'
                      }`}>
                        {validateRut(empresaForm.adminRut) ? '✓' : '⚠️'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      CARGO / ROL
                    </label>
                    <input
                      type="text"
                      value={empresaForm.adminRole}
                      onChange={(e) => setEmpresaForm({ ...empresaForm, adminRole: e.target.value })}
                      placeholder="Ej: Gerente General, Rep..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Registro Nacional Minvu (RNAC N°)
                    </label>
                    <input
                      type="text"
                      value={empresaForm.rnacNumber}
                      onChange={(e) => setEmpresaForm({ ...empresaForm, rnacNumber: e.target.value })}
                      placeholder="Ej: En trámite (Sol. PN-27583)"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-[#0F3D2E] focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Categoría en el Registro Minvu
                    </label>
                    <input
                      type="text"
                      value={empresaForm.rnacCategory}
                      onChange={(e) => setEmpresaForm({ ...empresaForm, rnacCategory: e.target.value })}
                      placeholder="Ej: Persona Natural (Vigente)"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                    />
                  </div>
                </div>
              </div>

              {/* ACCESO UNIFICADO A FIRMA DIGITAL Y TIMBRE OFICIAL */}
              <div className="pt-6 border-t border-slate-100">
                <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#0F3D2E] flex items-center gap-1.5">
                      <PenTool className="w-3.5 h-3.5 text-[#0F3D2E]" />
                      Firma Digital Manuscrita & Timbre Oficial
                    </span>
                    <p className="text-xs text-slate-600">
                      {companySettings?.signatureDataUrl
                        ? 'Tu firma manuscrita está registrada y activa para emisión de colillas, actas y certificados.'
                        : 'Aún no registras tu firma manuscrita oficial. Puedes dibujarla o subir tu archivo PNG.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof setActiveSubTab === 'function') {
                        setActiveSubTab('firma');
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-[#D4B895] text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer shrink-0"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>Configurar Firma & Timbre</span>
                  </button>
                </div>
              </div>

              {/* BOTÓN GUARDAR CAMBIOS */}
              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveAllSettings}
                  className="px-6 py-2.5 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
                >
                  <Check className="w-4 h-4 text-[#D4B895]" />
                  Guardar Datos de la Empresa
                </button>
              </div>
            </div>
          )}

          {/* ==================== SUB-PESTAÑA 2: FIRMA DIGITAL & TIMBRE ==================== */}
          {activeSubTab === 'firma' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <span className="text-[10px] font-bold text-[#D4B895] uppercase tracking-wider block">
                  Fe Pública & Validez Notarial
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  Firma Digital Manuscrita & Timbre Oficial
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tu firma manuscrita aparecerá al pie de cada certificado notarial, colilla de gastos comunes y acta de asamblea.
                  Al subir una imagen o dibujarla, el sistema recorta automáticamente los márgenes en blanco para que luzca con proporción ejecutiva óptima.
                </p>
              </div>

              {/* CONTROLES DE COLOR, GROSOR Y ESCALA DE FIRMA EN PDF */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-700">Color del Trazo:</span>
                  <div className="flex items-center gap-1.5">
                    {[
                      { color: '#0F3D2E', label: 'Verde ARANPRO' },
                      { color: '#0f172a', label: 'Negro Notarial' },
                      { color: '#1e3a8a', label: 'Azul Marino' },
                      { color: '#b91c1c', label: 'Rojo' }
                    ].map(c => (
                      <button
                        key={c.color}
                        type="button"
                        onClick={() => setPenColor(c.color)}
                        className={`w-6 h-6 rounded-full border-2 transition-transform ${
                          penColor === c.color ? 'scale-110 border-slate-900 shadow-xs' : 'border-white'
                        }`}
                        style={{ backgroundColor: c.color }}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Tamaño en PDF:</span>
                  <div className="flex items-center gap-1">
                    {[
                      { scale: 1.0, label: '100%' },
                      { scale: 1.35, label: '135% (Ideal)' },
                      { scale: 1.65, label: '165% (Grande)' },
                      { scale: 1.95, label: '195% (Amplia)' }
                    ].map(s => (
                      <button
                        key={s.scale}
                        type="button"
                        onClick={() => {
                          setSignatureScale(s.scale);
                          setCompanySettings(prev => ({ ...prev, signatureScale: s.scale }));
                        }}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all ${
                          Math.abs(signatureScale - s.scale) < 0.05
                            ? 'bg-[#0F3D2E] text-white border-[#0F3D2E]'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="cursor-pointer px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 transition-all flex items-center gap-1.5 shadow-xs">
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    Subir Firma (PNG/JPG)
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadSignatureFile}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={clearSignatureCanvas}
                    className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-xs font-bold text-rose-700 transition-all"
                  >
                    Limpiar
                  </button>
                </div>
              </div>

              {/* CANVAS DE DIBUJO INTERACTIVO */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Área de Firma Manuscrita (Dibuja con el mouse, trackpad o lápiz táctil)
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-2xl bg-white p-2 flex items-center justify-center relative overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    width={640}
                    height={200}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full max-w-xl h-48 cursor-crosshair touch-none bg-transparent"
                  />
                  {!hasCanvasDrawn && !signatureImage && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-300 text-xs font-medium">
                      ✍️ Dibuja tu firma en este recuadro...
                    </div>
                  )}
                </div>
              </div>

              {/* VISTA PREVIA EN PDF (ESTILO ECP) */}
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Vista Previa en Documentos Oficiales (PDF Carta • Escala {Math.round(signatureScale * 100)}%)
                </span>
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl max-w-md mx-auto text-center space-y-2">
                  <div className="h-24 flex items-end justify-center pb-1 overflow-visible">
                    {signatureImage ? (
                      <img
                        src={signatureImage}
                        alt="Firma Manuscrita"
                        className="h-16 max-h-20 w-auto max-w-[260px] object-contain mx-auto"
                        style={{ transform: `scale(${signatureScale})`, transformOrigin: 'bottom center' }}
                      />
                    ) : (
                      <span className="text-xs text-slate-400 italic">Sin firma configurada</span>
                    )}
                  </div>
                  <div className="border-t-2 border-slate-400 pt-2 space-y-0.5">
                    <p className="font-black text-xs text-slate-900">{empresaForm.adminName}</p>
                    <p className="text-[10px] text-slate-600 font-mono">RUT: {empresaForm.adminRut}</p>
                    <p className="text-[10px] text-[#0F3D2E] font-semibold">
                      {empresaForm.adminRole} (RNAC Minvu N° {empresaForm.rnacNumber})
                    </p>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block pt-1">
                      Firma Autorizada • Ley N° 21.442
                    </span>
                  </div>
                </div>
              </div>

              {/* Banner de Sincronización Global de Firma en todos los PDFs */}
              {(signatureImage || companySettings?.signatureDataUrl) && (
                <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl flex items-center justify-between text-xs text-emerald-950 max-w-xl mx-auto shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-emerald-100" />
                    </div>
                    <div>
                      <strong className="block text-emerald-900 font-black">
                        Firma Digital Sincronizada en Todos los Módulos
                      </strong>
                      <span className="text-[11px] text-emerald-800">
                        Esta firma se estampa automáticamente en Certificados oficiales, Actas de Asamblea, Citaciones, Cartas de Cobranza, Rendiciones y Dossier.
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveAllSettings}
                  className="px-6 py-2.5 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
                >
                  <Check className="w-4 h-4 text-[#D4B895]" />
                  Guardar Firma Digital
                </button>
              </div>
            </div>
          )}

          {/* ==================== SUB-PESTAÑA 3: ACREDITACIONES & PERFIL TÉCNICO ==================== */}
          {activeSubTab === 'acreditacion' && (
            <div className="space-y-8">
              <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold text-[#D4B895] uppercase tracking-wider block">
                    Repositorio Oficial de Licitación • Ley N° 21.442
                  </span>
                  <h3 className="text-lg font-black text-slate-900">
                    3. Biblioteca Documental, Acreditaciones Legales & Diplomas Técnicos
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Ordena formalmente tu carpeta legal (RNAC Minvu, Antecedentes, SII, Seguros, Contratos) y tus títulos de construcción con control de vigencia y custodia en bóveda local.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSubTab('postulaciones');
                      setPostulacionSection('preparacion');
                    }}
                    className="px-3.5 py-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs transition-all flex items-center gap-1.5"
                  >
                    <ClipboardCheck className="w-4 h-4 text-[#0F3D2E]" />
                    <span>Score Licitación: {readinessReport.score}/100</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingDiplomaId(null);
                      setNewDiplomaForm(initialNewDiplomaState);
                      setShowUploadDiplomaModal(true);
                    }}
                    className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#0F3D2E] to-[#165540] hover:brightness-110 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4 text-[#D4B895]" />
                    Subir Diploma o Curso
                  </button>
                </div>
              </div>

              {/* SECCIÓN A: BIBLIOTECA DOCUMENTAL FORMAL (RNAC, REGISTRO CIVIL, SII, SEGUROS, CONTRATOS) */}
              <div className="bg-slate-50/70 p-5 rounded-3xl border border-slate-200/90">
                <DocumentLibraryPanel
                  documents={accreditationDocs}
                  setDocuments={setAccreditationDocs}
                  showAlert={showAlert}
                  showConfirm={showConfirm}
                />
              </div>

              {/* SECCIÓN B: TÍTULOS PROFESIONALES, DIPLOMAS Y FORMACIÓN CONSTRUCTIVA */}
              <div className="pt-4 border-t border-slate-200 space-y-4">
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50/50 to-amber-50/30 border border-emerald-200/80 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-[#0F3D2E] text-[#D4B895] shrink-0 mt-0.5">
                    <HardHat className="w-4 h-4" />
                  </div>
                  <div className="space-y-1 text-xs">
                    <h4 className="font-bold text-slate-900">
                      Ventaja Técnica Exclusiva: Formación Constructiva al Servicio del Condominio
                    </h4>
                    <p className="text-slate-600 leading-relaxed">
                      Ser <strong>Constructor Civil</strong> es un activo de incalculable valor para una comunidad:
                      permite auditar con autoridad técnica salas de bombas, cubiertas, filtraciones y fiscalizar a contratistas externos evitando sobrecostos y presupuestos inflados.
                    </p>
                  </div>
                </div>

                {/* LISTADO DE DIPLOMAS, TÍTULOS Y CURSOS */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-[#0F3D2E]" />
                      Títulos Profesionales, Diplomas y Cursos Técnicos ({academicRecords.length})
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-[#0F3D2E] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        {academicRecords.filter(r => hasFile(r)).length} con PDF/Imagen original • {academicRecords.filter(r => r.includeInProposal !== false).length} en Dossier
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingDiplomaId(null);
                          setNewDiplomaForm(initialNewDiplomaState);
                          setShowUploadDiplomaModal(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-[11px] transition-all flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#D4B895]" />
                        Agregar Título/Curso
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {academicRecords.map((item) => (
                      <div
                        key={item.id}
                        className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-[#D4B895] transition-all space-y-3 shadow-xs"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-black text-sm text-slate-900">{item.title}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                item.status.includes('Titulado')
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : item.status.includes('curso')
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-purple-100 text-purple-800'
                              }`}>
                                {item.status}
                              </span>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                                {item.category || 'Acreditación Técnica'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium">
                              {item.institution} • {item.year}
                            </p>
                          </div>

                          {/* ACCIONES DEL DIPLOMA */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => setActiveDiplomaPreview(item)}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1"
                              title="Ver documento o constancia digital"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-600" />
                              <span>Ver</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadDiplomaFile(item)}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all flex items-center gap-1"
                              title="Descargar archivo original"
                            >
                              <Download className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Descargar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEditDiploma(item)}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
                              title="Editar o adjuntar PDF"
                            >
                              <PenTool className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteDiploma(item)}
                              className="p-1.5 rounded-xl text-rose-400 hover:text-rose-700 hover:bg-rose-50 transition-all"
                              title="Eliminar diploma"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* APORTE TÉCNICO A LA ADMINISTRACIÓN */}
                        <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200/80 leading-relaxed">
                          <strong className="text-[#0F3D2E]">Aporte Práctico a la Gestión:</strong> {item.relevance}
                        </p>

                        {/* ARCHIVO ADJUNTO & TOGGLE PARA LICITACIÓN */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-mono">
                            <Paperclip className="w-3.5 h-3.5 text-[#0F3D2E]" />
                            <span>{item.fileName || 'Documento_Respaldado.pdf'}</span>
                            <span className="text-slate-400">({item.fileSize || 'Digital'})</span>
                            {hasFile(item) ? (
                              <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[9.5px] font-sans">
                                ✓ Archivo PDF/Imagen en Bóveda
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleEditDiploma(item)}
                                className="text-amber-700 hover:underline font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-[9.5px] font-sans"
                              >
                                + Subir PDF escaneado original
                              </button>
                            )}
                          </div>

                          {/* TOGGLE INCLUIR EN LICITACIONES */}
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={item.includeInProposal !== false}
                              onChange={() => handleToggleIncludeInProposal(item.id)}
                              className="w-4 h-4 rounded text-[#0F3D2E] focus:ring-[#0F3D2E] border-slate-300"
                            />
                            <span className={`text-xs font-bold ${item.includeInProposal !== false ? 'text-[#0F3D2E]' : 'text-slate-400'}`}>
                              {item.includeInProposal !== false ? '✓ Adjuntar a Dossier de Licitación' : 'Omitir en Dossier'}
                            </span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveAllSettings}
                  className="px-6 py-2.5 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
                >
                  <Check className="w-4 h-4 text-[#D4B895]" />
                  Guardar Biblioteca Documental y Diplomas
                </button>
              </div>
            </div>
          )}

          {/* ==================== SUB-PESTAÑA: POSTULACIONES & DOSSIER DE LICITACIÓN ==================== */}
          {activeSubTab === 'postulaciones' && (
            <div className="space-y-6">
              {!hideHeader && (
                <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-[#D4B895] uppercase tracking-wider block">
                      Centro Comercial & Licitaciones • Carta Fuerte ARANPRO
                    </span>
                    <h3 className="text-lg font-black text-slate-900">
                      Postulaciones, CRM & Dossier Ejecutivo
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Verifica que cumples el 100% de los requisitos legales y técnicos, haz seguimiento a tus postulaciones en curso y genera propuestas económicas y técnicas listas para adjudicar.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setPreviewDossierModal(true)}
                      className="px-4 py-2.5 rounded-2xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                    >
                      <Eye className="w-4 h-4 text-[#D4B895]" />
                      Ver Dossier Maestro
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveAllSettings}
                      className="px-3.5 py-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-[#0F3D2E] border border-emerald-200 font-bold text-xs transition-all flex items-center gap-1"
                    >
                      <Check className="w-4 h-4 text-emerald-700" />
                      Guardar
                    </button>
                  </div>
                </div>
              )}

              {/* SELECTOR MODULAR PRINCIPAL (4 PESTAÑAS ESTRUCTURADAS Y AMIGABLES) */}
              {!hidePostulacionSubNav && (
                <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
                  {[
                    { id: 'flujo', label: '1. Guía Paso a Paso (Embudo)', icon: Send, badge: '4 Pasos' },
                    { id: 'material', label: '2. Documentos & Cartas PDF', icon: FileText },
                    { id: 'pipeline', label: `3. CRM Postulaciones (${postulationPipeline.length})`, icon: Briefcase },
                    { id: 'herramientas', label: '4. Caja de Herramientas (AGACECH & Pitch)', icon: Calculator }
                  ].map((tab) => {
                    const IconC = tab.icon;
                    const isAct = postulacionSection === tab.id ||
                      (tab.id === 'herramientas' && ['calculadora', 'inspeccion', 'comparativa', 'pitch', 'demo', 'preparacion'].includes(postulacionSection));
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setPostulacionSection(tab.id === 'herramientas' ? 'calculadora' : tab.id)}
                        className={`flex-1 min-w-[140px] flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs transition-all ${
                          isAct
                            ? 'bg-[#0F3D2E] text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                        }`}
                      >
                        <IconC className={`w-3.5 h-3.5 shrink-0 ${isAct ? 'text-[#D4B895]' : 'text-slate-400'}`} />
                        <span className="truncate">{tab.label}</span>
                        {tab.badge && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                            isAct ? 'bg-[#D4B895] text-[#0F3D2E]' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {tab.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ==================== SECCIÓN 1: GUÍA PASO A PASO (EL EMBUDO COMERCIAL ARANPRO) ==================== */}
              {postulacionSection === 'flujo' && (
                <div className="space-y-6 animate-in fade-in">
                  {/* CABECERA EJECUTIVA Y FOCALIZADA DE LA GUÍA PASO A PASO */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
                    <div>
                      <span className="text-[10px] font-bold text-[#0F3D2E] uppercase tracking-wider block">
                        Embudo Comercial de Captación • Paso a Paso
                      </span>
                      <h2 className="text-base font-black text-slate-900">
                        Guía Paso a Paso: Postulación a Condominios
                      </h2>
                      <p className="text-xs text-slate-500">
                        Configura la comunidad objetivo y despacha en orden sus 4 cartas y documentos oficiales.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPreviewDossierModal(true)}
                        className="px-3.5 py-2 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#D4B895]" />
                        Ver Dossier Maestro
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveAllSettings}
                        className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#0F3D2E] border border-emerald-200 font-bold text-xs transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-700" />
                        Guardar
                      </button>
                    </div>
                  </div>

                  {/* 1. TARJETA DE CONTROL: CONDOMINIO OBJETIVO A POSTULAR (EN VIVO) */}
                  <div className="bg-gradient-to-br from-[#0F3D2E] via-[#144D3A] to-[#0A291F] text-white p-5 md:p-6 rounded-3xl shadow-lg border border-emerald-900/40 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-800/60 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-2xl bg-[#D4B895] text-[#0F3D2E] flex items-center justify-center font-black shadow-xs text-base">
                          🎯
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4B895] block">
                            Paso Previo • Datos del Condominio Objetivo
                          </span>
                          <h4 className="text-sm md:text-base font-black text-white">
                            Configuración de la Comunidad a Postular (En Tiempo Real)
                          </h4>
                          <p className="text-[11px] text-emerald-200/80">
                            Lo que ingreses aquí se actualizará de inmediato en los 4 documentos oficiales y en los mensajes automáticos de WhatsApp y Correo.
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setProposalConfig(prev => ({ ...prev, unknownDetails: !prev.unknownDetails }))}
                          className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                            proposalConfig.unknownDetails
                              ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                              : 'bg-emerald-900/90 hover:bg-emerald-900 text-emerald-200 border border-emerald-700/60'
                          }`}
                        >
                          {proposalConfig.unknownDetails ? (
                            <>
                              <span>✓ Modo 1er Contacto (Sin datos aún)</span>
                            </>
                          ) : (
                            <>
                              <Search className="w-3.5 h-3.5 text-amber-300" />
                              <span>Aún no conozco unidades ni honorario</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveTargetCondoToCrm}
                          className="px-4 py-2 rounded-xl bg-[#D4B895] hover:bg-[#c7a67b] text-[#0F3D2E] font-black text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Briefcase className="w-3.5 h-3.5" />
                          Guardar en CRM
                        </button>
                      </div>
                    </div>

                    {/* Banner explicativo cuando aún no se conocen los datos detallados */}
                    {proposalConfig.unknownDetails && (
                      <div className="p-3 rounded-2xl bg-amber-400/15 border border-amber-400/40 text-amber-200 text-xs flex items-center justify-between gap-3 animate-in fade-in">
                        <div className="flex items-center gap-2.5">
                          <AlertCircle className="w-4 h-4 text-amber-300 shrink-0" />
                          <span>
                            <strong>Modo Primer Contacto activo:</strong> Para enviar la Carta de Valor (Paso 1) <strong>no necesitas conocer unidades ni precios</strong>. Tras tu primera visita diagnóstica o reunión con el comité, podrás ingresar los datos definitivos.
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setProposalConfig(prev => ({ ...prev, unknownDetails: false }))}
                          className="px-2.5 py-1 bg-amber-400 text-slate-950 font-bold text-[10.5px] rounded-lg shrink-0 cursor-pointer hover:bg-amber-300 transition-all"
                        >
                          Ya tengo los datos
                        </button>
                      </div>
                    )}

                    {/* Inputs de configuración rápida */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                      <div className="space-y-1">
                        <label className="text-[10.5px] font-bold text-emerald-100 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-[#D4B895]" />
                          Nombre del Condominio:
                        </label>
                        <input
                          type="text"
                          value={proposalConfig.targetCondo}
                          onChange={(e) => setProposalConfig({ ...proposalConfig, targetCondo: e.target.value })}
                          placeholder="Ej: Valle de la Florida IV"
                          className="w-full px-3 py-2 bg-emerald-950/60 border border-emerald-700/60 rounded-xl text-white font-bold placeholder-emerald-400/50 focus:outline-none focus:ring-1 focus:ring-[#D4B895]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10.5px] font-bold text-emerald-100 flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-[#D4B895]" />
                          Dirigido a / Contacto:
                        </label>
                        <input
                          type="text"
                          value={proposalConfig.targetRecipient}
                          onChange={(e) => setProposalConfig({ ...proposalConfig, targetRecipient: e.target.value })}
                          placeholder="Ej: Señores Miembros del Comité"
                          className="w-full px-3 py-2 bg-emerald-950/60 border border-emerald-700/60 rounded-xl text-white font-bold placeholder-emerald-400/50 focus:outline-none focus:ring-1 focus:ring-[#D4B895]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10.5px] font-bold text-emerald-100 flex items-center gap-1">
                          <MessageCircle className="w-3 h-3 text-[#D4B895]" />
                          WhatsApp / Teléfono Contacto:
                        </label>
                        <input
                          type="text"
                          value={proposalConfig.targetPhone || ''}
                          onChange={(e) => setProposalConfig({ ...proposalConfig, targetPhone: e.target.value })}
                          placeholder="Ej: +56 9 5811 8504"
                          className="w-full px-3 py-2 bg-emerald-950/60 border border-emerald-700/60 rounded-xl text-white font-mono placeholder-emerald-400/50 focus:outline-none focus:ring-1 focus:ring-[#D4B895]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10.5px] font-bold text-emerald-100 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-[#D4B895]" />
                          Correo Electrónico Comité:
                        </label>
                        <input
                          type="email"
                          value={proposalConfig.targetEmail || ''}
                          onChange={(e) => setProposalConfig({ ...proposalConfig, targetEmail: e.target.value })}
                          placeholder="Ej: comite@valledelaflorida.cl"
                          className="w-full px-3 py-2 bg-emerald-950/60 border border-emerald-700/60 rounded-xl text-white placeholder-emerald-400/50 focus:outline-none focus:ring-1 focus:ring-[#D4B895]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10.5px] font-bold text-emerald-100 flex items-center gap-1">
                          <Home className="w-3 h-3 text-[#D4B895]" />
                          Total Unidades (Casas/Deptos):
                        </label>
                        {proposalConfig.unknownDetails ? (
                          <div className="w-full px-3 py-2 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-amber-200/90 text-xs italic font-medium flex items-center justify-between">
                            <span>Por definir tras visita en terreno</span>
                            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-mono font-bold">Pendiente</span>
                          </div>
                        ) : (
                          <input
                            type="number"
                            value={proposalConfig.targetUnits}
                            onChange={(e) => setProposalConfig({ ...proposalConfig, targetUnits: e.target.value })}
                            placeholder="60"
                            className="w-full px-3 py-2 bg-emerald-950/60 border border-emerald-700/60 rounded-xl text-white font-bold placeholder-emerald-400/50 focus:outline-none focus:ring-1 focus:ring-[#D4B895]"
                          />
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10.5px] font-bold text-emerald-100 flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-[#D4B895]" />
                          Honorario Mensual Estimado:
                        </label>
                        {proposalConfig.unknownDetails ? (
                          <div className="w-full px-3 py-2 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-amber-200/90 text-xs italic font-medium flex items-center justify-between">
                            <span>Por definir con el Comité</span>
                            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-mono font-bold">Pendiente</span>
                          </div>
                        ) : (
                          <input
                            type="number"
                            value={proposalConfig.proposedMonthlyFee}
                            onChange={(e) => setProposalConfig({ ...proposalConfig, proposedMonthlyFee: e.target.value })}
                            placeholder="850000"
                            className="w-full px-3 py-2 bg-emerald-950/60 border border-emerald-700/60 rounded-xl text-white font-mono font-bold placeholder-emerald-400/50 focus:outline-none focus:ring-1 focus:ring-[#D4B895]"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 2. LOS 4 PASOS ESTRATÉGICOS DEL EMBUDO COMERCIAL */}
                  <div className="space-y-4">
                    {/* ========== PASO 1: PRIMER CONTACTO / CARTA DE VALOR ========== */}
                    <div className="bg-white p-5 md:p-6 rounded-3xl border-2 border-emerald-700/30 shadow-xs hover:border-emerald-700/60 transition-all space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-[#0F3D2E] text-[#D4B895] flex items-center justify-center font-black text-lg shrink-0 mt-0.5 shadow-xs">
                            1
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[10px] font-black uppercase tracking-wider text-[#0F3D2E] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                                Primer Contacto • Puerta en Frío
                              </span>
                              <span className="text-[10px] font-bold text-slate-500">
                                1 Página Canónica • Sin Precios
                              </span>
                            </div>
                            <h4 className="text-base font-black text-slate-900 mt-0.5">
                              Paso 1: Carta de Valor al Comité & Visita Inicial Gratuita
                            </h4>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] font-mono font-bold text-[#0F3D2E] bg-[#F5F4EF] border border-[#D4B895] px-2.5 py-1 rounded-xl">
                            {proposalConfig.targetCondo || 'Comunidad'}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        <strong>Cuándo usarlo:</strong> Para dejar en conserjería o enviar por WhatsApp/Correo al presidente o comité cuando aún no conoces la realidad del condominio. <strong>No incluye precios;</strong> presenta tu respaldo como Constructor Civil, ofrece una Visita Técnica Inicial Gratuita en terreno y la Suite Digital sin costo para abrir la puerta a una reunión.
                      </p>

                      {/* Botones de Acción Inmediata Paso 1 */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setPreviewColdLetterModal(true)}
                          className="px-3.5 py-2 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#D4B895]" />
                          Ver / Descargar PDF
                        </button>
                        <button
                          type="button"
                          onClick={handlePrintColdLetter}
                          className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5 text-[#0F3D2E]" />
                          Imprimir Carta
                        </button>
                        <button
                          type="button"
                          onClick={() => handleShareWhatsApp(1)}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          Enviar por WhatsApp
                        </button>
                        <button
                          type="button"
                          onClick={() => handleShareEmail(1)}
                          disabled={sendingEmailStep === 1}
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          {sendingEmailStep === 1 ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              Enviando...
                            </>
                          ) : (
                            <>
                              <Mail className="w-3.5 h-3.5" />
                              Enviar por Correo
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyStepMessage(1)}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Copiar Mensaje
                        </button>
                        <button
                          type="button"
                          onClick={() => setExpandedStepMsg(expandedStepMsg === 1 ? null : 1)}
                          className="ml-auto text-[11px] font-bold text-[#0F3D2E] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          {expandedStepMsg === 1 ? 'Ocultar Texto Propuesto' : 'Ver Texto Propuesto'}
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedStepMsg === 1 ? 'rotate-180' : ''}`} />
                        </button>
                      </div>

                      {/* Acordeón de Texto Propuesto Paso 1 */}
                      {expandedStepMsg === 1 && (
                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs animate-in fade-in">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wide">
                              Mensaje Prediseñado para WhatsApp / Chat
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">Personalizado con {proposalConfig.targetCondo || 'Comunidad'}</span>
                          </div>
                          <pre className="whitespace-pre-wrap font-sans text-slate-800 text-xs bg-white p-3 rounded-xl border border-slate-200 leading-relaxed max-h-48 overflow-y-auto">
                            {getStepMessages(1).whatsapp}
                          </pre>
                        </div>
                      )}
                    </div>

                    {/* BANNER INTERMEDIO DE TRANSICIÓN: TRAS LA PRIMERA REUNIÓN EN TERRENO */}
                    {proposalConfig.unknownDetails && (
                      <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🤝</span>
                          <div>
                            <h5 className="font-black text-sm text-slate-900">
                              ¿Ya tuviste la primera reunión o visita diagnóstica en {proposalConfig.targetCondo || 'el condominio'}?
                            </h5>
                            <p className="text-xs text-slate-600">
                              Ingresa la cantidad real de departamentos/casas y el honorario acordado para generar la Propuesta Formal (Paso 3) y el Dossier con valores.
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setProposalConfig(prev => ({ ...prev, unknownDetails: false }));
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="px-4 py-2 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-[#D4B895] font-black text-xs shadow-sm transition-all whitespace-nowrap cursor-pointer shrink-0 flex items-center gap-1.5"
                        >
                          <PenTool className="w-3.5 h-3.5" />
                          Ingresar Unidades y Honorario
                        </button>
                      </div>
                    )}

                    {/* ========== PASO 2: CITA PRESENCIAL & VISITA TÉCNICA (DOSSIER INTEGRAL) ========== */}
                    <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200 shadow-xs hover:border-[#0F3D2E]/40 transition-all space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-black text-lg shrink-0 mt-0.5 shadow-xs">
                            2
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                                Reunión Presencial • En Terreno
                              </span>
                              <span className="text-[10px] font-bold text-slate-500">
                                Dossier Maestro 3 Páginas + Pauta Técnica
                              </span>
                            </div>
                            <h4 className="text-base font-black text-slate-900 mt-0.5">
                              Paso 2: Visita en Terreno con Dossier Integral & Pauta de Inspección
                            </h4>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setPostulacionSection('inspeccion')}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <HardHat className="w-3.5 h-3.5 text-[#0F3D2E]" />
                            Abrir Pauta Técnica
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        <strong>Cuándo usarlo:</strong> Lleva este Dossier en mano o carpeta corporativa a la cita con el Comité. Compila tu ficha de Constructor Civil, certificados de antecedentes, cédula de identidad, títulos y cartas de recomendación. Durante la visita, anota con la Pauta Técnica el estado de bombas, tableros y necesidades reales.
                      </p>

                      {/* Botones de Acción Inmediata Paso 2 */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setPreviewDossierModal(true)}
                          className="px-3.5 py-2 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#D4B895]" />
                          Ver Dossier Maestro
                        </button>
                        <button
                          type="button"
                          onClick={handlePrintDossier}
                          className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5 text-[#0F3D2E]" />
                          Imprimir Dossier
                        </button>
                        <button
                          type="button"
                          onClick={() => setPostulacionSection('inspeccion')}
                          className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#0F3D2E] border border-emerald-300 font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <HardHat className="w-3.5 h-3.5" />
                          Pauta de Inspección
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveSubTab('acreditacion')}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                          title="Gestionar mis títulos y antecedentes en Datos de Empresa"
                        >
                          <Award className="w-3.5 h-3.5 text-[#0F3D2E]" />
                          Mis Títulos ({academicRecords.length}) & Docs ({accreditationDocs.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => handleShareWhatsApp(2)}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          Confirmar Cita WhatsApp
                        </button>
                        <button
                          type="button"
                          onClick={() => handleShareEmail(2)}
                          disabled={sendingEmailStep === 2}
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          {sendingEmailStep === 2 ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              Enviando...
                            </>
                          ) : (
                            <>
                              <Mail className="w-3.5 h-3.5" />
                              Confirmar por Correo
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyStepMessage(2)}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Copiar Mensaje
                        </button>
                        <button
                          type="button"
                          onClick={() => setExpandedStepMsg(expandedStepMsg === 2 ? null : 2)}
                          className="ml-auto text-[11px] font-bold text-[#0F3D2E] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          {expandedStepMsg === 2 ? 'Ocultar Texto' : 'Ver Texto Propuesto'}
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedStepMsg === 2 ? 'rotate-180' : ''}`} />
                        </button>
                      </div>

                      {/* Acordeón de Texto Propuesto Paso 2 */}
                      {expandedStepMsg === 2 && (
                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs animate-in fade-in">
                          <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wide block">
                            Mensaje para Confirmar Fecha y Hora de Visita en Terreno
                          </span>
                          <pre className="whitespace-pre-wrap font-sans text-slate-800 text-xs bg-white p-3 rounded-xl border border-slate-200 leading-relaxed max-h-48 overflow-y-auto">
                            {getStepMessages(2).whatsapp}
                          </pre>
                        </div>
                      )}
                    </div>

                    {/* ========== PASO 3: PROPUESTA FORMAL A MEDIDA & HONORARIOS ========== */}
                    <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200 shadow-xs hover:border-[#0F3D2E]/40 transition-all space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shrink-0 mt-0.5 shadow-xs">
                            3
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[10px] font-black uppercase tracking-wider text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                                Propuesta Económica • A Medida
                              </span>
                              <span className="text-[10px] font-bold text-slate-500">
                                {proposalConfig.unknownDetails ? 'Por definir tras visita' : `${formatCLP(Number(proposalConfig.proposedMonthlyFee) || 850000)} / mes • ${proposalConfig.targetUnits || '60'} Unidades`}
                              </span>
                            </div>
                            <h4 className="text-base font-black text-slate-900 mt-0.5">
                              Paso 3: Carta Formal de Postulación & Honorarios Ajustados
                            </h4>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setPostulacionSection('calculadora')}
                            className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Calculator className="w-3.5 h-3.5 text-[#0F3D2E]" />
                            Calculadora AGACECH
                          </button>
                        </div>
                      </div>

                      {/* Aviso si aún no se ingresan datos */}
                      {proposalConfig.unknownDetails && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-900 animate-in fade-in">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>
                              Aún no has ingresado las unidades ni el honorario mensual para {proposalConfig.targetCondo || 'esta comunidad'}.
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setProposalConfig(prev => ({ ...prev, unknownDetails: false }));
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] rounded-lg shrink-0 cursor-pointer transition-all"
                          >
                            Ingresar Datos Ahora
                          </button>
                        </div>
                      )}

                      <p className="text-xs text-slate-600 leading-relaxed">
                        <strong>Cuándo usarlo:</strong> Una vez terminada la visita técnica y conociendo el número real de casas/departamentos y la dotación del condominio, redacta tu oferta con un valor fundamentado técnicamente (usando el modelo AGACECH y especificando tus visitas presenciales y SLA).
                      </p>

                      {/* Botones de Acción Inmediata Paso 3 */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setPreviewProposalModal(true)}
                          className="px-3.5 py-2 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#D4B895]" />
                          Ver Carta con Valores
                        </button>
                        <button
                          type="button"
                          onClick={handlePrintProposal}
                          className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5 text-[#0F3D2E]" />
                          Imprimir Carta
                        </button>
                        <button
                          type="button"
                          onClick={() => setPostulacionSection('comparativa')}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Scale className="w-3.5 h-3.5 text-slate-700" />
                          Cuadro Comparativo
                        </button>
                        <button
                          type="button"
                          onClick={() => handleShareWhatsApp(3)}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          Enviar Propuesta WhatsApp
                        </button>
                        <button
                          type="button"
                          onClick={() => handleShareEmail(3)}
                          disabled={sendingEmailStep === 3}
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          {sendingEmailStep === 3 ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              Enviando...
                            </>
                          ) : (
                            <>
                              <Mail className="w-3.5 h-3.5" />
                              Enviar por Correo
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyStepMessage(3)}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Copiar Mensaje
                        </button>
                        <button
                          type="button"
                          onClick={() => setExpandedStepMsg(expandedStepMsg === 3 ? null : 3)}
                          className="ml-auto text-[11px] font-bold text-[#0F3D2E] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          {expandedStepMsg === 3 ? 'Ocultar Texto' : 'Ver Texto Propuesto'}
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedStepMsg === 3 ? 'rotate-180' : ''}`} />
                        </button>
                      </div>

                      {/* Acordeón de Texto Propuesto Paso 3 */}
                      {expandedStepMsg === 3 && (
                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs animate-in fade-in">
                          <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wide block">
                            Mensaje Formal para Entregar la Propuesta Económica
                          </span>
                          <pre className="whitespace-pre-wrap font-sans text-slate-800 text-xs bg-white p-3 rounded-xl border border-slate-200 leading-relaxed max-h-48 overflow-y-auto">
                            {getStepMessages(3).whatsapp}
                          </pre>
                        </div>
                      )}
                    </div>

                    {/* ========== PASO 4: CIERRE TECNOLÓGICO & DEMO EN VIVO CON QR ========== */}
                    <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200 shadow-xs hover:border-[#0F3D2E]/40 transition-all space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-purple-700 text-white flex items-center justify-center font-black text-lg shrink-0 mt-0.5 shadow-xs">
                            4
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[10px] font-black uppercase tracking-wider text-purple-800 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md">
                                Cierre Tecnológico • Tiro de Gracia
                              </span>
                              <span className="text-[10px] font-bold text-slate-500">
                                Brochure con Código QR + App en Vivo
                              </span>
                            </div>
                            <h4 className="text-base font-black text-slate-900 mt-0.5">
                              Paso 4: Brochure de la Suite & Demostración de App en Vivo
                            </h4>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setPostulacionSection('demo')}
                            className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 font-bold text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <QrCode className="w-3.5 h-3.5 text-purple-700" />
                            Demo en Vivo
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        <strong>Cuándo usarlo:</strong> El diferenciador decisivo frente a la competencia tradicional: entrega o proyecta el Brochure con código QR interactivo para que los integrantes del comité y copropietarios prueben la demo en vivo desde sus propios teléfonos móviles.
                      </p>

                      {/* Botones de Acción Inmediata Paso 4 */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setPreviewBrochureModal(true)}
                          className="px-3.5 py-2 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#D4B895]" />
                          Ver Brochure con QR
                        </button>
                        <button
                          type="button"
                          onClick={handlePrintBrochure}
                          className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5 text-[#0F3D2E]" />
                          Imprimir Brochure
                        </button>
                        <button
                          type="button"
                          onClick={() => setPostulacionSection('demo')}
                          className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-300 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          Probar Demo
                        </button>
                        <button
                          type="button"
                          onClick={() => handleShareWhatsApp(4)}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          Enviar Demo WhatsApp
                        </button>
                        <button
                          type="button"
                          onClick={() => handleShareEmail(4)}
                          disabled={sendingEmailStep === 4}
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          {sendingEmailStep === 4 ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              Enviando...
                            </>
                          ) : (
                            <>
                              <Mail className="w-3.5 h-3.5" />
                              Enviar por Correo
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyStepMessage(4)}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Copiar Mensaje
                        </button>
                        <button
                          type="button"
                          onClick={() => setPostulacionSection('pitch')}
                          className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Presentation className="w-3.5 h-3.5" />
                          Pitch (10 Min)
                        </button>
                        <button
                          type="button"
                          onClick={() => setExpandedStepMsg(expandedStepMsg === 4 ? null : 4)}
                          className="ml-auto text-[11px] font-bold text-[#0F3D2E] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          {expandedStepMsg === 4 ? 'Ocultar Texto' : 'Ver Texto Propuesto'}
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedStepMsg === 4 ? 'rotate-180' : ''}`} />
                        </button>
                      </div>

                      {/* Acordeón de Texto Propuesto Paso 4 */}
                      {expandedStepMsg === 4 && (
                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs animate-in fade-in">
                          <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wide block">
                            Mensaje para Compartir la Demo en Vivo y Acceso Móvil
                          </span>
                          <pre className="whitespace-pre-wrap font-sans text-slate-800 text-xs bg-white p-3 rounded-xl border border-slate-200 leading-relaxed max-h-48 overflow-y-auto">
                            {getStepMessages(4).whatsapp}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}



              {/* SECCIÓN 1: CHECKLIST & SEMÁFORO DE PREPARACIÓN */}
              {postulacionSection === 'preparacion' && (
                <div className="space-y-4 animate-in fade-in">
                  {renderToolboxNavbar()}
                  <ReadinessPanel
                    readiness={readinessReport}
                    onAction={handleReadinessAction}
                    onDownloadPackage={handleDownloadPackage}
                    packageCount={packageFilesCount}
                  />
                </div>
              )}

              {/* SECCIÓN 2: CRM & PIPELINE DE POSTULACIONES */}
              {postulacionSection === 'pipeline' && (
                <div className="space-y-6 animate-in fade-in">
                  {/* CABECERA EJECUTIVA DEL CRM */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
                    <div>
                      <span className="text-[10px] font-bold text-[#0F3D2E] uppercase tracking-wider block">
                        Centro Comercial & Licitaciones
                      </span>
                      <h2 className="text-base font-black text-slate-900">
                        CRM de Postulaciones & Pipeline Comercial
                      </h2>
                      <p className="text-xs text-slate-500">
                        Seguimiento integral a licitaciones en curso, métricas de cartera y auditoría legal de postulaciones.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPreviewDossierModal(true)}
                        className="px-3.5 py-2 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#D4B895]" />
                        Ver Dossier Maestro
                      </button>
                    </div>
                  </div>

                  {/* RESUMEN DE EXPERIENCIA Y PREPARACIÓN EN CIFRAS */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div
                      onClick={() => setPostulacionSection('preparacion')}
                      className="bg-gradient-to-br from-[#0F3D2E] to-[#165540] text-white p-3.5 rounded-2xl border border-emerald-900/40 text-center cursor-pointer hover:brightness-110 transition-all shadow-xs"
                      title="Ver Checklist y Auditoría de Preparación"
                    >
                      <span className="text-[10px] font-bold uppercase text-[#D4B895] block">Índice Preparación</span>
                      <span className="text-xl font-black text-white">{readinessReport.score}/100</span>
                      <span className="text-[9px] text-emerald-100 block">{readinessReport.level?.label || 'Auditado'}</span>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">En Licitación</span>
                      <span className="text-xl font-black text-[#0F3D2E]">
                        {postulationPipeline.filter(p => !['ganada', 'perdida', 'adjudicada', 'no_adjudicada'].includes(p.stage)).length} Condominios
                      </span>
                      <span className="text-[9px] text-slate-500 block">En pipeline activo</span>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Trayectoria</span>
                      <span className="text-xl font-black text-slate-900">{portfolioStats.yearsExp} Años</span>
                      <span className="text-[9px] text-slate-500 block">Desde {empresaForm.startYear}</span>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Unidades Activas</span>
                      <span className="text-xl font-black text-slate-900">{portfolioStats.totalUnits} Deptos/Casas</span>
                      <span className="text-[9px] text-slate-500 block">En {portfolioStats.totalComms} comunidad(es)</span>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center col-span-2 md:col-span-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Respaldos en Dossier</span>
                      <span className="text-xl font-black text-[#0F3D2E]">
                        {accreditationDocs.filter(d => d.includeInDossier !== false).length + academicRecords.filter(r => r.includeInProposal !== false).length} Docs
                      </span>
                      <span className="text-[9px] text-slate-500 block">Legales + Títulos</span>
                    </div>
                  </div>

                  <PipelinePanel
                    items={postulationPipeline}
                    onChange={setPostulationPipeline}
                    onPrepareDossier={handlePrepareDossierFromPipeline}
                    showConfirm={showConfirm}
                  />
                </div>
              )}

              {/* SECCIÓN 3 (NUEVA): CALCULADORA DE PISO DE HONORARIOS MODELO AGACECH */}
              {(postulacionSection === 'calculadora' || postulacionSection === 'herramientas') && (
                <div className="space-y-4 animate-in fade-in">
                  {renderToolboxNavbar()}

                  <AgacechFeeCalculatorPanel
                    proposalConfig={proposalConfig}
                    setProposalConfig={setProposalConfig}
                    empresaForm={empresaForm}
                    onApplyToDossier={() => setPostulacionSection('flujo')}
                    showAlert={showAlert}
                  />
                </div>
              )}

              {/* SECCIÓN 3: DOSSIER, PROPUESTA ECONÓMICA, CARTAS Y REFERENCIAS */}
              {postulacionSection === 'material' && (
                <div className="space-y-6 animate-in fade-in">
                  {/* CONFIGURACIÓN DE DESTINATARIO Y PROPUESTA ECONÓMICA */}
                  <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200">
                          <PenTool className="w-4 h-4 text-[#0F3D2E]" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                            Personalización de la Comunidad, Destinatario & Propuesta Económica
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Configura los datos del condominio objetivo y la oferta de honorarios que se integrará en tu Carta y Dossier.
                          </p>
                        </div>
                      </div>
                      {proposalConfig.targetCondo || (!proposalConfig.leaveRecipientBlank && proposalConfig.targetRecipient) ? (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 self-start sm:self-auto">
                          ✓ Personalizado para {proposalConfig.targetCondo || 'Comité'}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 self-start sm:self-auto">
                          Formato Abierto / Genérico
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Campo 1: Condominio a Postular */}
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Condominio o Edificio Objetivo
                        </label>
                        <input
                          type="text"
                          placeholder="Ej: Condominio Mirador de San Joaquín"
                          value={proposalConfig.targetCondo}
                          onChange={(e) => setProposalConfig({ ...proposalConfig, targetCondo: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                        />
                      </div>

                      {/* Campo 2: Ciudad / Comuna */}
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Ciudad / Comuna
                        </label>
                        <input
                          type="text"
                          placeholder="Ej: La Serena, Región de Coquimbo"
                          value={proposalConfig.targetCity}
                          onChange={(e) => setProposalConfig({ ...proposalConfig, targetCity: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                        />
                      </div>

                      {/* Campo 3: N° Unidades estimadas */}
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          N° de Unidades (Casas/Deptos)
                        </label>
                        <input
                          type="number"
                          min="1"
                          placeholder="Ej: 64"
                          value={proposalConfig.targetUnits}
                          onChange={(e) => setProposalConfig({ ...proposalConfig, targetUnits: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                        />
                      </div>
                    </div>

                    {/* Destinatario */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          A la atención de / Destinatario de la Propuesta:
                        </label>
                        <button
                          type="button"
                          onClick={() => setProposalConfig({ ...proposalConfig, targetRecipient: '', leaveRecipientBlank: true })}
                          className="text-[11px] font-bold text-rose-600 hover:underline"
                        >
                          Limpiar / Dejar en blanco
                        </button>
                      </div>

                      <input
                        type="text"
                        placeholder="Escribe el destinatario o selecciona una opción rápida abajo..."
                        value={proposalConfig.leaveRecipientBlank ? '' : proposalConfig.targetRecipient}
                        disabled={proposalConfig.leaveRecipientBlank}
                        onChange={(e) => setProposalConfig({ ...proposalConfig, targetRecipient: e.target.value, leaveRecipientBlank: false })}
                        className={`w-full px-3.5 py-2.5 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0F3D2E] transition-all ${
                          proposalConfig.leaveRecipientBlank
                            ? 'bg-slate-100 text-slate-400 border-dashed border-slate-300'
                            : 'bg-slate-50 text-slate-800 border-slate-200'
                        }`}
                      />

                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] font-bold uppercase text-slate-400 mr-1">Opciones Rápidas:</span>
                        {[
                          { label: 'Comité de Administración', value: 'Señores Miembros del Comité de Administración' },
                          { label: 'Presidente(a) del Comité', value: 'Señor(a) Presidente(a) del Comité de Administración' },
                          { label: 'Directiva del Condominio', value: 'Señores Miembros de la Directiva del Condominio' },
                          { label: 'Asamblea de Copropietarios', value: 'Asamblea de Copropietarios & Comité de Administración' },
                          { label: 'Comisión de Licitación', value: 'Señores Integrantes de la Comisión de Licitación' },
                          { label: 'Dejar en Blanco', value: '', isBlank: true }
                        ].map((preset) => {
                          const isSelected = preset.isBlank
                            ? proposalConfig.leaveRecipientBlank || !proposalConfig.targetRecipient
                            : !proposalConfig.leaveRecipientBlank && proposalConfig.targetRecipient === preset.value;

                          return (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => {
                                if (preset.isBlank) {
                                  setProposalConfig({ ...proposalConfig, targetRecipient: '', leaveRecipientBlank: true });
                                } else {
                                  setProposalConfig({ ...proposalConfig, targetRecipient: preset.value, leaveRecipientBlank: false });
                                }
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                                isSelected
                                  ? 'bg-[#0F3D2E] text-white border-[#0F3D2E] shadow-xs'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              {preset.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* PROPUESTA ECONÓMICA Y ALCANCE DEL SERVICIO (NUEVO) */}
                    <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-[#0F3D2E]" />
                          <h5 className="text-xs font-black uppercase tracking-wider text-[#0F3D2E]">
                            Propuesta Económica de Honorarios & Alcance Garantizado (SLA)
                          </h5>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={proposalConfig.includeEconomicInDossier !== false}
                            onChange={(e) => setProposalConfig({ ...proposalConfig, includeEconomicInDossier: e.target.checked })}
                            className="w-4 h-4 rounded text-[#0F3D2E] focus:ring-[#0F3D2E] border-slate-300"
                          />
                          <span className="text-xs font-bold text-[#0F3D2E]">
                            Incluir oferta económica impresa en el Dossier
                          </span>
                        </label>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-600 uppercase">
                            Honorario Mensual Propuesto (CLP)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="10000"
                            value={proposalConfig.proposedMonthlyFee}
                            onChange={(e) => setProposalConfig({ ...proposalConfig, proposedMonthlyFee: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-black text-[#0F3D2E]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-600 uppercase">
                            Costo Promedio por Unidad
                          </label>
                          <div className="px-3 py-2 bg-white/80 border border-slate-200 rounded-xl text-xs font-black text-slate-800 flex items-center justify-between">
                            <span>
                              {formatCLP(
                                Math.round(
                                  (Number(proposalConfig.proposedMonthlyFee) || 0) /
                                    Math.max(1, Number(proposalConfig.targetUnits) || 1)
                                )
                              )}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400">/ depto mes</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-600 uppercase">
                            Modalidad Tributaria
                          </label>
                          <select
                            value={proposalConfig.taxModality}
                            onChange={(e) => setProposalConfig({ ...proposalConfig, taxModality: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                          >
                            <option value="Factura Exenta / Boleta de Honorarios Profesional">Factura Exenta / Boleta Honorarios</option>
                            <option value="Factura Electrónica SII (+ IVA)">Factura Electrónica (+ IVA)</option>
                            <option value="Valor Total Impuestos Incluidos">Valor Total Impuestos Incluidos</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-600 uppercase">
                            Presencia Técnica en Terreno
                          </label>
                          <input
                            type="text"
                            value={proposalConfig.visitFrequency}
                            onChange={(e) => setProposalConfig({ ...proposalConfig, visitFrequency: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* TARJETAS DE EMISIÓN DE DOCUMENTOS EN EL ORDEN DEL EMBUDO (PASOS 1, 2, 3, 4 + HERRAMIENTAS) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {/* 1. PASO 1: CARTA DE VALOR & PROSPECCIÓN RÁPIDA (PUERTA EN FRÍO / CONSERJERÍA) */}
                    <div className="bg-gradient-to-br from-emerald-50 via-teal-50/60 to-white p-5 rounded-3xl border-2 border-[#0F3D2E]/25 shadow-xs space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black bg-[#0F3D2E] text-[#D4B895] uppercase tracking-wider">
                          ★ PASO 1 • PUERTA EN FRÍO
                        </span>
                        <h4 className="text-base font-black text-slate-900">
                          Carta de Valor al Comité (Sin Conocer Estatus)
                        </h4>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          Ideal para dejar en conserjería cuando aún no conoces la realidad del condominio. <strong>Sin precios;</strong> presenta tu respaldo en Construcción, App 24/7 y ofrece un Diagnóstico Técnico Gratuito.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setPreviewColdLetterModal(true)}
                          className="px-3.5 py-2 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#D4B895]" />
                          Ver Carta Valor
                        </button>
                        <button
                          type="button"
                          onClick={handlePrintColdLetter}
                          className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5 text-[#0F3D2E]" />
                          Imprimir
                        </button>
                      </div>
                    </div>

                    {/* 2. PASO 2: DOSSIER INTEGRAL COMPLETO (LICITACIÓN EN TERRENO) */}
                    <div
                      className="bg-[#0F3D2E] bg-gradient-to-br from-[#0F3D2E] to-[#164D3A] text-white p-5 rounded-3xl shadow-lg border border-emerald-900/40 space-y-3 relative overflow-hidden flex flex-col justify-between"
                      style={{ backgroundColor: '#0F3D2E' }}
                    >
                      <div className="space-y-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black bg-[#D4B895] text-[#0F3D2E] uppercase tracking-wider">
                          ★ PASO 2 • LICITACIÓN (3 PÁGS)
                        </span>
                        <h4 className="text-base font-black tracking-tight text-white">
                          Dossier Integral de Postulación
                        </h4>
                        <p className="text-[11px] text-emerald-100/90 leading-relaxed">
                          Compila en un PDF: Portada oficial, Carta de Presentación, Ficha Técnica Constructiva, Acreditaciones Legales ({accreditationDocs.filter(d => d.includeInDossier !== false).length}), Diplomas ({academicRecords.filter(r => r.includeInProposal !== false).length}) y Referencias.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setPreviewDossierModal(true)}
                          className="px-3.5 py-2 bg-[#D4B895] hover:bg-[#c2a37d] text-[#0F3D2E] font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#0F3D2E]" />
                          Ver Dossier
                        </button>
                        <button
                          type="button"
                          onClick={handlePrintDossier}
                          className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5 text-[#D4B895]" />
                          Imprimir
                        </button>
                      </div>
                    </div>

                    {/* 3. PASO 3: CARTA SIMPLE DE POSTULACIÓN A LICITACIÓN (1 PÁGINA CON VALORES) */}
                    <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 text-blue-900 uppercase">
                          ★ PASO 3 • PROPUESTA CON VALORES
                        </span>
                        <h4 className="text-base font-black text-slate-900">
                          Carta de Postulación a Licitación (1 Pág.)
                        </h4>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          Carta ejecutiva con desglose de honorarios ({formatCLP(Number(proposalConfig.proposedMonthlyFee) || 850000)}/mes), unidades ({proposalConfig.targetUnits || '60'}), SLA de visitas técnicas presenciales y firma con sello oficial.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setPreviewProposalModal(true)}
                          className="px-3.5 py-2 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#D4B895]" />
                          Ver Carta
                        </button>
                        <button
                          type="button"
                          onClick={handlePrintProposal}
                          className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5 text-[#0F3D2E]" />
                          Imprimir
                        </button>
                      </div>
                    </div>

                    {/* 4. PASO 4: BROCHURE COMERCIAL DE LA APP & WEB CON QR */}
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50/40 p-5 rounded-3xl border border-amber-200/80 space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-200 text-amber-900 uppercase">
                          ★ PASO 4 • TECNOLOGÍA & DEMO QR
                        </span>
                        <h4 className="text-base font-black text-slate-900">
                          Brochure de la App & Portal Web
                        </h4>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          Ficha comercial ejecutiva con código QR en vivo para que el Comité y vecinos prueben la demo interactiva en su celular y vean cómo auditar facturas 24/7.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setPreviewBrochureModal(true)}
                          className="px-3.5 py-2 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#D4B895]" />
                          Ver Brochure
                        </button>
                        <button
                          type="button"
                          onClick={handlePrintBrochure}
                          className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5 text-[#0F3D2E]" />
                          Imprimir
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* DOCUMENTOS COMPLEMENTARIOS DE APOYO TÉCNICO Y COMPARATIVO */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-[#0F3D2E] text-[#D4B895]">
                          <HardHat className="w-5 h-5" />
                        </div>
                        <div>
                          <h5 className="font-black text-xs text-slate-900">
                            Informe de Diagnóstico Técnico Inicial Gratuito
                          </h5>
                          <p className="text-[11px] text-slate-500">
                            Plantilla técnica para sala de bombas, tableros y cubiertas tras la visita en terreno.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setPreviewInspectionModal(true)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3 text-[#0F3D2E]" />
                          Ver
                        </button>
                        <button
                          type="button"
                          onClick={handlePrintInspectionReport}
                          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
                          title="Imprimir Pauta"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-[#D4B895] text-[#0F3D2E]">
                          <Scale className="w-5 h-5" />
                        </div>
                        <div>
                          <h5 className="font-black text-xs text-slate-900">
                            Matriz de Cuadro Comparativo
                          </h5>
                          <p className="text-[11px] text-slate-500">
                            Comparativa de 10 puntos clave: Administración Tradicional vs ARANPRO.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setPreviewComparisonModal(true)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3 text-[#0F3D2E]" />
                          Ver
                        </button>
                        <button
                          type="button"
                          onClick={handlePrintComparisonMatrix}
                          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
                          title="Imprimir Cuadro Comparativo"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* SELECTOR RÁPIDO DE DOCUMENTOS Y DIPLOMAS ADJUNTOS AL DOSSIER */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-[#0F3D2E]" />
                        Anexos Técnicos y Legales Marcados para el Dossier
                      </h4>
                      <button
                        type="button"
                        onClick={handleDownloadPackage}
                        className="text-[11px] font-bold text-[#0F3D2E] hover:underline flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Descargar todos los archivos adjuntos numerados
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {academicRecords.map(item => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleToggleIncludeInProposal(item.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                            item.includeInProposal !== false
                              ? 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-xs'
                              : 'bg-white text-slate-400 border-slate-200 hover:text-slate-600'
                          }`}
                        >
                          <span>{item.includeInProposal !== false ? '✓' : '+'}</span>
                          <span>🎓 {item.title}</span>
                        </button>
                      ))}
                      {accreditationDocs.map(doc => (
                        <button
                          key={doc.id}
                          type="button"
                          onClick={() => {
                            setAccreditationDocs(prev =>
                              prev.map(d => d.id === doc.id ? { ...d, includeInDossier: d.includeInDossier === false } : d)
                            );
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                            doc.includeInDossier !== false
                              ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-xs'
                              : 'bg-white text-slate-400 border-slate-200 hover:text-slate-600'
                          }`}
                        >
                          <span>{doc.includeInDossier !== false ? '✓' : '+'}</span>
                          <span>📄 {doc.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* CRUD COMPLETO DE CARTAS DE RECOMENDACIÓN & REFERENCIAS DE COMITÉS */}
                  <div className="pt-2 border-t border-slate-100 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                          <MessageCircle className="w-4 h-4 text-[#0F3D2E]" />
                          Referencias Comprobables & Cartas de Recomendación de Comités ({committeeReferences.length})
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Registra presidentes o tesoreros de comunidades administradas para que el comité evaluador pueda llamarlos y verificar tu gestión.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleOpenAddRef}
                        className="px-3.5 py-2 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#D4B895]" />
                        Agregar Referencia de Comité
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {committeeReferences.map(ref => (
                        <div key={ref.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 flex flex-col justify-between">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="font-black text-xs text-slate-900 flex items-center gap-1.5 flex-wrap">
                                  <span>{ref.contactName}</span>
                                  <span className="text-[#0F3D2E] font-bold">• {ref.role}</span>
                                </div>
                                <p className="text-[11px] text-slate-500 font-medium">
                                  {ref.communityName} • Tel: <span className="font-mono">{ref.phone || 'S/N'}</span>
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleToggleConfirmRef(ref.id)}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all ${
                                  ref.confirmed !== false
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                              >
                                {ref.confirmed !== false ? '✓ Autorizada' : '⏳ Por confirmar'}
                              </button>
                            </div>
                            <blockquote className="text-xs text-slate-600 italic bg-white p-2.5 rounded-xl border border-slate-200">
                              "{ref.quote}"
                            </blockquote>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/70">
                            <button
                              type="button"
                              onClick={() => handleRequestReferenceWhatsApp(ref)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                            >
                              <Send className="w-3 h-3" />
                              Pedir Carta por WhatsApp
                            </button>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEditRef(ref)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/70 transition-all"
                                title="Editar referencia"
                              >
                                <PenTool className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRef(ref)}
                                className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-all"
                                title="Eliminar referencia"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SECCIÓN 4: INSPECCIÓN TÉCNICA INICIAL DE ENTRADA (CHECKLIST GRATUITO) */}
              {postulacionSection === 'inspeccion' && (
                <div className="space-y-4 animate-in fade-in">
                  {renderToolboxNavbar()}
                  <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50/40 border border-emerald-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F3D2E] block">
                        Gancho Comercial de Entrada • Autoridad Constructiva
                      </span>
                      <h4 className="text-base font-black text-slate-900">
                        Informe de Diagnóstico Técnico Inicial Gratuito
                      </h4>
                      <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                        Ofrece al comité una auditoría visual in situ sin costo de sus instalaciones críticas. Demuestra tu experiencia como
                        <strong> Constructor Civil</strong> detectando fallas que otros administradores ignoran.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPreviewInspectionModal(true)}
                        className="px-4 py-2.5 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                      >
                        <Eye className="w-4 h-4 text-[#D4B895]" />
                        Vista Previa Informe
                      </button>
                      <button
                        type="button"
                        onClick={handlePrintInspectionReport}
                        className="px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
                      >
                        <Printer className="w-4 h-4 text-[#0F3D2E]" />
                        Imprimir
                      </button>
                    </div>
                  </div>

                  {/* AGREGAR NUEVA PARTIDA PERSONALIZADA AL DIAGNÓSTICO */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <input
                      type="text"
                      value={newInspectionItemName}
                      onChange={(e) => setNewInspectionItemName(e.target.value)}
                      placeholder="Agregar otra instalación evaluada (ej: Ascensores, Portón Automático, Piscina, Citofonía)..."
                      className="flex-1 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={handleAddInspectionItem}
                      className="px-4 py-2 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#D4B895]" />
                      Agregar Partida al Informe
                    </button>
                  </div>

                  {/* LISTADO DE PARTIDAS DE INSPECCIÓN TÉCNICA */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Partidas del Diagnóstico Técnico para {proposalConfig.targetCondo || 'el Condominio'} ({inspectionForm.items.length}):
                    </h5>

                    <div className="space-y-3">
                      {inspectionForm.items.map((item, idx) => (
                        <div key={item.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-[#0F3D2E] text-[#D4B895] flex items-center justify-center font-bold text-xs">
                                {idx + 1}
                              </span>
                              <h6 className="font-black text-xs text-slate-900">{item.name}</h6>
                            </div>

                            {/* SELECTOR DE ESTADO */}
                            <div className="flex items-center gap-1.5 self-start sm:self-auto">
                              {['Bueno', 'Requiere Mantención', 'Crítico'].map(st => {
                                const isCur = item.status === st;
                                return (
                                  <button
                                    key={st}
                                    type="button"
                                    onClick={() => {
                                      const updated = inspectionForm.items.map(it => it.id === item.id ? { ...it, status: st } : it);
                                      setInspectionForm({ ...inspectionForm, items: updated });
                                    }}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                                      isCur
                                        ? st === 'Bueno'
                                          ? 'bg-emerald-600 text-white border-emerald-600'
                                          : st === 'Requiere Mantención'
                                          ? 'bg-amber-500 text-white border-amber-500'
                                          : 'bg-rose-600 text-white border-rose-600'
                                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                    }`}
                                  >
                                    {st === 'Bueno' ? '✓ Bueno' : st === 'Requiere Mantención' ? '⚠ Mantención' : '✕ Crítico'}
                                  </button>
                                );
                              })}
                              {inspectionForm.items.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveInspectionItem(item.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                                  title="Quitar partida"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* NOTAS Y OBSERVACIÓN TÉCNICA */}
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">
                              Observaciones Técnicas & Recomendación Constructiva:
                            </label>
                            <textarea
                              rows={2}
                              value={item.notes}
                              onChange={(e) => {
                                const updated = inspectionForm.items.map(it => it.id === item.id ? { ...it, notes: e.target.value } : it);
                                setInspectionForm({ ...inspectionForm, items: updated });
                              }}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SECCIÓN 3: CUADRO COMPARATIVO (TRADICIONAL VS ARANPRO) */}
              {postulacionSection === 'comparativa' && (
                <div className="space-y-4 animate-in fade-in">
                  {renderToolboxNavbar()}
                  <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F3D2E] block">
                        Diferenciador Visual de Alto Impacto
                      </span>
                      <h4 className="text-base font-black text-slate-900">
                        Cuadro Comparativo: Administración Tradicional vs. ARANPRO
                      </h4>
                      <p className="text-xs text-slate-600">
                        Tabla comparativa ideal para proyectar en asambleas o adjuntar al dossier de licitación.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPreviewComparisonModal(true)}
                        className="px-4 py-2.5 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                      >
                        <Eye className="w-4 h-4 text-[#D4B895]" />
                        Ver Cuadro Completo
                      </button>
                      <button
                        type="button"
                        onClick={handlePrintComparisonMatrix}
                        className="px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
                      >
                        <Printer className="w-4 h-4 text-[#0F3D2E]" />
                        Imprimir Ficha
                      </button>
                    </div>
                  </div>

                  {/* MATRIZ DE COMPARACIÓN */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      {
                        title: '1. Criterio Constructivo & Obras',
                        trad: 'No distinguen una falla de bombas de una fuga eléctrica. Aceptan presupuestos de contratistas externos a ciegas con sobrecostos.',
                        aran: 'Administrador con formación de Constructor Civil. Audita salas de bombas, cubiertas y techumbres con criterio experto en terreno.'
                      },
                      {
                        title: '2. Transparencia en Gastos Comunes',
                        trad: 'Planillas Excel confusas enviadas a fin de mes. Comprobantes bancarios y facturas ocultos en carpetas inaccesibles para el vecino.',
                        aran: 'Portal web y App móvil 24/7 donde cada copropietario audita en vivo las facturas reales y cartolas bancarias con 1 clic.'
                      },
                      {
                        title: '3. Asambleas y Votaciones (Ley 21.442)',
                        trad: 'Falta crónica de quórum presencial. Actas físicas que se pierden o tardan semanas en protocolizarse.',
                        aran: 'Asambleas telemáticas híbridas con voto digital seguro desde el celular y actas foliadas conforme al Art. 15° de la ley.'
                      },
                      {
                        title: '4. Libro Oficial de Reclamos',
                        trad: 'Mensajes de WhatsApp y correos que quedan en el olvido sin respuesta formal.',
                        aran: 'Libro digital oficial con folios correlativos y plazo estricto de respuesta legal garantizada (Art. 20°).'
                      },
                      {
                        title: '5. Cobranzas & Fe Notarial',
                        trad: 'Cobranzas desordenadas o agresivas sin protocolo notarial.',
                        aran: 'Certificados oficiales foliados de no deuda, convenios de pago y certificados morosos para compraventas (Art. 36°).'
                      },
                      {
                        title: '6. Traspaso & Auditoría Inicial',
                        trad: 'Asumen la administración sin auditar deudas anteriores, trasladando problemas históricos.',
                        aran: 'Auditoría de traspaso formal y diagnóstico preventivo gratuito para blindar la responsabilidad del nuevo comité.'
                      }
                    ].map((row, idx) => (
                      <div key={idx} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                        <h6 className="font-black text-xs text-slate-900 border-b border-slate-100 pb-1.5 flex items-center justify-between">
                          <span>{row.title}</span>
                          <span className="text-[10px] font-bold text-[#0F3D2E] bg-emerald-50 px-2 py-0.5 rounded">
                            Ventaja ARANPRO
                          </span>
                        </h6>
                        <div className="space-y-2 text-xs">
                          <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-200/60 text-slate-700">
                            <span className="font-bold text-rose-800 block text-[10px] uppercase">✕ Administración Tradicional:</span>
                            <p className="text-[11px] mt-0.5 leading-relaxed">{row.trad}</p>
                          </div>
                          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-slate-800">
                            <span className="font-bold text-[#0F3D2E] block text-[10px] uppercase">✓ Con ARANPRO:</span>
                            <p className="text-[11px] mt-0.5 leading-relaxed font-medium">{row.aran}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECCIÓN 4: LIBRETO DE PITCH (10 MINUTOS) */}
              {postulacionSection === 'pitch' && (
                <div className="space-y-4 animate-in fade-in">
                  {renderToolboxNavbar()}
                  <div className="p-5 rounded-3xl bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4B895] block">
                        Estrategia Comercial de Cierre
                      </span>
                      <h4 className="text-base font-black text-white">
                        Guía de Pitch: Cómo Ganar la Licitación en 10 Minutos
                      </h4>
                      <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                        Estructura probada para exponer ante comités o asambleas. Aborda los dolores del cliente, resalta tu perfil de Constructor Civil y cierra la contratación con solvencia.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleCopyPitchToClipboard}
                        className="px-4 py-2.5 bg-[#D4B895] hover:bg-[#c2a37d] text-[#0F3D2E] font-black text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                      >
                        <Copy className="w-4 h-4 text-[#0F3D2E]" />
                        Copiar Guion
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPitchGuideModal(true)}
                        className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
                      >
                        <Eye className="w-4 h-4 text-[#D4B895]" />
                        Ver Ficha Completa
                      </button>
                    </div>
                  </div>

                  {/* BLOQUES DEL PITCH DE 10 MINUTOS */}
                  <div className="space-y-4">
                    {[
                      {
                        time: 'Minutos 1 - 2',
                        title: 'Apertura: Conectar con el Dolor del Comité',
                        what: 'La mayoría de los comités están agotados por dos cosas: falta de respuesta oportuna y desconfianza en los gastos comunes.',
                        phrase: '"No les pedimos que confíen ciegamente en nosotros. Les entregamos una plataforma donde cada peso gastado tiene su respaldo bancario visible en línea."'
                      },
                      {
                        time: 'Minutos 3 - 5',
                        title: 'El Diferenciador de Constructor Civil',
                        what: 'Explicar que los administradores convencionales son contadores o comerciales sin experiencia en terreno. Tu formación como Constructor Civil ahorra millones a la comunidad.',
                        phrase: '"Cuando falla una bomba o hay una filtración en cubierta, nosotros diagnosticamos la falla real en terreno antes de llamar a un contratista, evitando que les cobren presupuestos inflados."'
                      },
                      {
                        time: 'Minutos 6 - 8',
                        title: 'Demostración de la App y Transparencia Radical',
                        what: 'Abrir el portal en el teléfono o pantalla y mostrar la colilla con el botón de respaldo bancario y el libro digital de reclamos.',
                        phrase: '"Miren esto: cualquier vecino puede presionar aquí y ver la factura y comprobante de transferencia bancaria de la mantención del ascensor. Cero dudas en la asamblea."'
                      },
                      {
                        time: 'Minutos 9 - 10',
                        title: 'Cierre y Propuesta de Traspaso Seguro',
                        what: 'Ofrecer la auditoría de traspaso inicial sin costo y el diagnóstico preventivo de instalaciones bajo la Ley N° 21.442.',
                        phrase: '"Si eligen a ARANPRO, nosotros nos encargamos del traspaso formal con el administrador saliente, blindando su responsabilidad legal ante la ley."'
                      }
                    ].map((step, idx) => (
                      <div key={idx} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-lg bg-[#0F3D2E] text-[#D4B895] font-black text-xs">
                              {step.time}
                            </span>
                            <h6 className="font-black text-xs text-slate-900">{step.title}</h6>
                          </div>
                          <span className="text-[10px] font-bold text-slate-400">Paso {idx + 1} de 4</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{step.what}</p>
                        <blockquote className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs italic text-slate-800 font-medium">
                          {step.phrase}
                        </blockquote>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECCIÓN 5: DEMO EN VIVO & CÓDIGO QR */}
              {postulacionSection === 'demo' && (
                <div className="space-y-4 animate-in fade-in">
                  {renderToolboxNavbar()}
                  <div className="p-5 rounded-3xl bg-gradient-to-r from-[#0F3D2E] to-[#165540] text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4B895] block">
                        Interacción en Tiempo Real
                      </span>
                      <h4 className="text-base font-black text-white">
                        Demostración en Vivo & Código QR para el Comité
                      </h4>
                      <p className="text-xs text-emerald-100/90 max-w-2xl leading-relaxed">
                        Permite que los integrantes del comité escaneen el código QR con sus propios teléfonos para experimentar la plataforma antes de votar.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleShareDemoWhatsApp()}
                        className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                      >
                        <Send className="w-4 h-4" />
                        Enviar Demo por WhatsApp
                      </button>
                    </div>
                  </div>

                  {/* QR Y SIMULADOR DE APP EN PANTALLA */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* PANEL IZQUIERDO: CÓDIGO QR Y ENLACE (COL 5) */}
                    <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs text-center space-y-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase text-[#0F3D2E] block">Escanear con Teléfono</span>
                        <h5 className="font-black text-sm text-slate-900">Código QR de Demostración</h5>
                        <p className="text-xs text-slate-500">Apunta la cámara de tu celular para abrir el portal de copropietarios en vivo.</p>
                      </div>

                      {/* CÓDIGO QR SVG ESTILIZADO */}
                      <div className="p-4 bg-white rounded-2xl border-2 border-dashed border-[#0F3D2E]/30 inline-block shadow-xs">
                        <svg className="w-44 h-44 mx-auto" viewBox="0 0 100 100" fill="#0F3D2E">
                          {/* QR Mockup estilizado */}
                          <rect x="5" y="5" width="25" height="25" fill="#0F3D2E" rx="3" />
                          <rect x="10" y="10" width="15" height="15" fill="#ffffff" rx="1" />
                          <rect x="14" y="14" width="7" height="7" fill="#0F3D2E" />

                          <rect x="70" y="5" width="25" height="25" fill="#0F3D2E" rx="3" />
                          <rect x="75" y="10" width="15" height="15" fill="#ffffff" rx="1" />
                          <rect x="79" y="14" width="7" height="7" fill="#0F3D2E" />

                          <rect x="5" y="70" width="25" height="25" fill="#0F3D2E" rx="3" />
                          <rect x="10" y="75" width="15" height="15" fill="#ffffff" rx="1" />
                          <rect x="14" y="79" width="7" height="7" fill="#0F3D2E" />

                          {/* Patrón central de datos */}
                          <rect x="35" y="10" width="6" height="6" />
                          <rect x="45" y="10" width="6" height="6" />
                          <rect x="55" y="10" width="6" height="6" />
                          <rect x="35" y="25" width="6" height="6" />
                          <rect x="45" y="20" width="6" height="6" />
                          <rect x="55" y="25" width="6" height="6" />
                          <rect x="35" y="35" width="10" height="10" />
                          <rect x="50" y="35" width="10" height="10" />
                          <rect x="65" y="35" width="6" height="6" />
                          <rect x="10" y="45" width="6" height="6" />
                          <rect x="20" y="45" width="6" height="6" />
                          <rect x="35" y="50" width="6" height="6" />
                          <rect x="45" y="50" width="6" height="6" />
                          <rect x="55" y="50" width="6" height="6" />
                          <rect x="65" y="50" width="6" height="6" />
                          <rect x="75" y="45" width="10" height="10" />
                          <rect x="35" y="65" width="6" height="6" />
                          <rect x="45" y="65" width="6" height="6" />
                          <rect x="55" y="65" width="6" height="6" />
                          <rect x="65" y="65" width="15" height="6" />
                          <rect x="35" y="75" width="15" height="6" />
                          <rect x="55" y="75" width="6" height="6" />
                          <rect x="65" y="75" width="6" height="15" />
                          <rect x="75" y="85" width="15" height="6" />
                          <rect x="35" y="85" width="6" height="6" />
                          <rect x="45" y="85" width="6" height="6" />
                          <rect x="55" y="85" width="6" height="6" />
                        </svg>
                      </div>

                      <div className="pt-2 space-y-2">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(window.location.origin);
                            showAlert('✓ Enlace Copiado', 'El enlace de la demo se ha copiado al portapapeles.', 'success');
                          }}
                          className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                          <Copy className="w-3.5 h-3.5 text-slate-600" />
                          Copiar Enlace de Demo
                        </button>
                      </div>
                    </div>

                    {/* PANEL DERECHO: SIMULADOR DE APP EN CELULAR (COL 7) */}
                    <div className="lg:col-span-7 bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl text-white space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4 text-[#D4B895]" />
                          <span className="font-bold text-xs text-white">Simulador Interactivo de la App</span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                          En Línea • Vista Copropietario
                        </span>
                      </div>

                      {/* BOTONES DE PESTAÑAS DEL SIMULADOR */}
                      <div className="flex items-center gap-1.5 p-1 bg-slate-800 rounded-xl text-[11px] font-bold">
                        {[
                          { id: 'gastoComun', label: 'Colilla Digital' },
                          { id: 'comprobantes', label: 'Auditoría Bancaria' },
                          { id: 'reclamos', label: 'Libro Reclamos' },
                          { id: 'mural', label: 'Mural Avisos' }
                        ].map(t => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setDemoScreenTab(t.id)}
                            className={`flex-1 py-1.5 rounded-lg transition-all ${
                              demoScreenTab === t.id ? 'bg-[#0F3D2E] text-white shadow-xs' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>

                      {/* PANTALLA SIMULADA */}
                      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 min-h-[260px] text-xs space-y-3">
                        {demoScreenTab === 'gastoComun' && (
                          <div className="space-y-3 animate-in fade-in">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                              <div>
                                <span className="text-[10px] text-slate-400 block font-mono">UNIDAD N° 12</span>
                                <strong className="text-white text-sm">Gasto Común: $48.500</strong>
                              </div>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-900/60 text-emerald-400 border border-emerald-700">
                                Al Día
                              </span>
                            </div>
                            <div className="space-y-1.5 text-[11px] text-slate-300">
                              <div className="flex justify-between"><span>Gasto Operacional Base:</span><span className="font-mono">$38.000</span></div>
                              <div className="flex justify-between"><span>Fondo de Reserva (5% Ley 21.442):</span><span className="font-mono text-emerald-400">$2.500</span></div>
                              <div className="flex justify-between"><span>Consumo Agua / Remarcador:</span><span className="font-mono">$8.000</span></div>
                            </div>
                            <button
                              type="button"
                              onClick={() => showAlert('Simulación de Pago', 'En la versión real, el vecino paga en 1 clic mediante Webpay / Flow integrado.', 'info')}
                              className="w-full py-2 bg-[#D4B895] hover:bg-[#c2a37d] text-[#0F3D2E] font-black rounded-xl text-xs transition-all"
                            >
                              Pagar Gasto Común en Línea
                            </button>
                          </div>
                        )}

                        {demoScreenTab === 'comprobantes' && (
                          <div className="space-y-2.5 animate-in fade-in">
                            <span className="text-[10px] font-bold text-[#D4B895] uppercase block">
                              Transparencia Radical • Clic para ver Comprobante Real:
                            </span>
                            <div className="space-y-1.5">
                              {[
                                { prov: 'HidroBombas Ltda.', mat: 'Mantención Sala de Bombas', monto: '$180.000', folio: 'FAC-8901' },
                                { prov: 'Chilquinta Energía', mat: 'Consumo Eléctrico Espacios Comunes', monto: '$245.800', folio: 'BOL-4412' },
                                { prov: 'Jardines del Valle', mat: 'Mantención Áreas Verdes & Poda', monto: '$95.000', folio: 'FAC-1029' }
                              ].map((eg, i) => (
                                <div key={i} className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-[11px]">
                                  <div>
                                    <p className="font-bold text-white">{eg.prov}</p>
                                    <p className="text-[10px] text-slate-400">{eg.mat}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-mono font-bold text-emerald-400">{eg.monto}</p>
                                    <span className="text-[9px] text-[#D4B895] underline cursor-pointer">Ver Comprobante</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {demoScreenTab === 'reclamos' && (
                          <div className="space-y-2.5 animate-in fade-in">
                            <span className="text-[10px] font-bold text-[#D4B895] uppercase block">
                              Libro Oficial Foliado (Art. 20° Ley N° 21.442)
                            </span>
                            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="font-mono text-emerald-400 font-bold">REC-2026-004</span>
                                <span className="text-slate-400">Casa 4 • Hace 2 días</span>
                              </div>
                              <p className="font-bold text-white text-xs">Ajuste de presión en bomba de piso 3</p>
                              <p className="text-[10px] text-slate-300">"Se percibe baja presión en horario punta."</p>
                              <div className="p-1.5 bg-slate-950 rounded border border-slate-800 text-[10px] text-emerald-300 font-medium">
                                ✓ Respuesta ARANPRO: Técnico inspeccionó presostato ayer a las 16:00 hrs. Falla resuelta.
                              </div>
                            </div>
                          </div>
                        )}

                        {demoScreenTab === 'mural' && (
                          <div className="space-y-2.5 animate-in fade-in">
                            <span className="text-[10px] font-bold text-[#D4B895] uppercase block">
                              Diario Mural Digital Comunitario
                            </span>
                            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300">
                                Aviso Importante
                              </span>
                              <h6 className="font-bold text-white text-xs">Corte Programado por Limpieza de Estanques</h6>
                              <p className="text-[10px] text-slate-300 leading-relaxed">
                                Este jueves entre 10:00 y 13:00 hrs se realizará lavado de estanques conforme a norma sanitaria.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================== SUB-PESTAÑA: EQUIPO & ASISTENTES (LEY 21.442) ==================== */}
          {activeSubTab === 'equipo' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-bold text-[#D4B895] uppercase tracking-wider block">
                    Gestión de Equipo & Trazabilidad Legal
                  </span>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#0F3D2E]" />
                    Equipo de Trabajo, Asistentes & Auditoría
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Conforme a la Ley N° 21.442, define asistentes autorizados con permisos limitados. Cada movimiento quedará auditado con el autor exacto.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={loadStaffAndLogs}
                    className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Recargar datos desde Supabase"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStaff ? 'animate-spin text-[#0F3D2E]' : ''}`} />
                    <span>Sincronizar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddAssistantModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
                  >
                    <UserPlus className="w-4 h-4 text-[#D4B895]" />
                    <span>+ Registrar Nuevo Asistente</span>
                  </button>
                </div>
              </div>

              {/* 1. ADMINISTRADOR MAESTRO TITULAR */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0F3D2E]/5 via-[#0F3D2E]/10 to-transparent border border-[#0F3D2E]/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#0F3D2E] text-[#D4B895] flex items-center justify-center font-black text-lg shrink-0 shadow-md">
                      JA
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-base text-slate-900">{empresaForm.adminName}</h4>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#0F3D2E] text-[#D4B895] border border-[#D4B895]/30 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-[#D4B895]" />
                          ADMINISTRADOR TITULAR (SUPERADMIN)
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          RNAC N° {empresaForm.rnacNumber}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        RUT: <span className="font-mono font-bold text-slate-900">{empresaForm.adminRut}</span> • Email: <span className="text-slate-900">{empresaForm.email}</span>
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Firma oficial y representación legal acreditada ante Minvu y comunidades administradas.
                      </p>
                    </div>
                  </div>
                  <div className="sm:text-right shrink-0">
                    <span className="inline-block px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                      ● Acceso Total y Firma de Colillas
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. LISTA DE ASISTENTES DELEGADOS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#0F3D2E]" />
                    Asistentes Autorizados en Supabase ({assistantsList.filter(a => a.role !== 'superadmin').length})
                  </h4>
                </div>

                {isLoadingStaff ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
                    <RefreshCw className="w-6 h-6 animate-spin text-[#0F3D2E] mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-bold">Consultando equipo en Supabase...</p>
                  </div>
                ) : assistantsList.filter(a => a.role !== 'superadmin').length === 0 ? (
                  <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center space-y-2">
                    <Users className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs font-bold text-slate-700">No hay asistentes registrados actualmente</p>
                    <p className="text-[11px] text-slate-500 max-w-md mx-auto leading-relaxed">
                      Cuando incorpores uno o dos asistentes a tu gestión, créales una cuenta aquí. Podrán apoyarte en registrar gastos o atender reclamos, pero cada acción quedará guardada indicando explícitamente que fue hecha por el asistente y no por ti como Administrador Titular.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {assistantsList.filter(a => a.role !== 'superadmin').map((asistente) => (
                      <div key={asistente.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-sm border border-blue-200">
                              {asistente.nombre.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <h5 className="font-bold text-sm text-slate-900">{asistente.nombre}</h5>
                              <p className="text-[11px] font-mono text-slate-500">RUT: {asistente.rut}</p>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            Asistente
                          </span>
                        </div>

                        {/* Permisos */}
                        <div className="bg-slate-50 p-2.5 rounded-xl space-y-1.5 text-[11px]">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Permisos Autorizados:</span>
                          <div className="grid grid-cols-2 gap-1 text-slate-700">
                            <span className="flex items-center gap-1">
                              {asistente.permisos?.editar_gastos ? '✅' : '❌'} Registrar Gastos
                            </span>
                            <span className="flex items-center gap-1">
                              {asistente.permisos?.responder_tickets ? '✅' : '❌'} Responder Tickets
                            </span>
                            <span className="flex items-center gap-1">
                              {asistente.permisos?.aprobar_pagos ? '✅' : '❌'} Aprobar Pagos
                            </span>
                            <span className="flex items-center gap-1">
                              {asistente.permisos?.emitir_colillas ? '✅' : '❌'} Emitir Colillas
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                          <span className="text-[10px] text-slate-400 font-mono">
                            {asistente.email || 'Sin correo'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteAssistant(asistente.id, asistente.nombre)}
                            className="text-red-600 hover:text-red-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Revocar Acceso</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. REGISTRO DE AUDITORÍA Y TRAZABILIDAD (LOG INMUTABLE LEY 21.442) */}
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-[#0F3D2E]" />
                      Registro de Auditoría & Trazabilidad (Supabase)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Historial inalterable de acciones que demuestra quién realizó cada modificación en el sistema.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                    {auditLogsList.length} registros
                  </span>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3">Fecha y Hora</th>
                          <th className="px-4 py-3">Acción</th>
                          <th className="px-4 py-3">Usuario Responsable</th>
                          <th className="px-4 py-3">Rol</th>
                          <th className="px-4 py-3">Detalles</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {auditLogsList.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-6 text-center text-slate-400 text-xs">
                              Aún no hay acciones registradas en el historial de auditoría de Supabase.
                            </td>
                          </tr>
                        ) : (
                          auditLogsList.map((log) => {
                            const isSuper = log.user_role === 'superadmin' || log.user_role === 'admin';
                            return (
                              <tr key={log.id} className="hover:bg-slate-50/70">
                                <td className="px-4 py-2.5 font-mono text-slate-500 whitespace-nowrap">
                                  {new Date(log.created_at).toLocaleString('es-CL')}
                                </td>
                                <td className="px-4 py-2.5 font-bold text-slate-800 whitespace-nowrap">
                                  <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 font-mono text-[10px]">
                                    {log.action}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 font-medium text-slate-900">
                                  {log.user_name} <span className="text-slate-400 font-mono text-[10px]">({log.user_rut})</span>
                                </td>
                                <td className="px-4 py-2.5 whitespace-nowrap">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    isSuper 
                                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                                      : 'bg-blue-50 text-blue-800 border border-blue-200'
                                  }`}>
                                    {isSuper ? '👑 Administrador Titular' : '👤 Asistente'}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 text-slate-500 text-[11px] max-w-xs truncate">
                                  {log.details ? JSON.stringify(log.details) : '—'}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* MODAL PARA AGREGAR ASISTENTE */}
              {showAddAssistantModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
                  <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-[#0F3D2E] text-white flex items-center justify-center">
                          <UserPlus className="w-4 h-4 text-[#D4B895]" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900">Registrar Asistente Autorizado</h4>
                          <p className="text-[11px] text-slate-500">Se guardará en la tabla staff_users de Supabase</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setShowAddAssistantModal(false); setAssistantFeedback(''); }}
                        className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <form onSubmit={handleCreateAssistant} className="space-y-3.5">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Nombre Completo del Asistente *
                        </label>
                        <input
                          type="text"
                          required
                          value={assistantForm.nombre}
                          onChange={(e) => setAssistantForm({ ...assistantForm, nombre: e.target.value })}
                          placeholder="Ej: Camila Andrea Soto Valenzuela"
                          className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                            RUT del Asistente *
                          </label>
                          <input
                            type="text"
                            required
                            value={assistantForm.rut}
                            onChange={(e) => setAssistantForm({ ...assistantForm, rut: e.target.value })}
                            placeholder="Ej: 18.234.567-8"
                            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                            Contraseña de Acceso *
                          </label>
                          <input
                            type="password"
                            required
                            value={assistantForm.password}
                            onChange={(e) => setAssistantForm({ ...assistantForm, password: e.target.value })}
                            placeholder="Clave inicial"
                            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                            Correo Electrónico (Opcional)
                          </label>
                          <input
                            type="email"
                            value={assistantForm.email}
                            onChange={(e) => setAssistantForm({ ...assistantForm, email: e.target.value })}
                            placeholder="asistente@aranpro.cl"
                            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                            Teléfono (Opcional)
                          </label>
                          <input
                            type="tel"
                            value={assistantForm.telefono}
                            onChange={(e) => setAssistantForm({ ...assistantForm, telefono: e.target.value })}
                            placeholder="+56 9 8765 4321"
                            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                          />
                        </div>
                      </div>

                      {/* Permisos Granulares */}
                      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Permisos Autorizados por el Administrador:
                        </label>
                        <div className="space-y-1.5 text-xs text-slate-700">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={assistantForm.permisos.editar_gastos}
                              onChange={(e) => setAssistantForm({
                                ...assistantForm,
                                permisos: { ...assistantForm.permisos, editar_gastos: e.target.checked }
                              })}
                              className="rounded text-[#0F3D2E] focus:ring-[#0F3D2E]"
                            />
                            <span>Permitir registrar y editar gastos o facturas</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={assistantForm.permisos.responder_tickets}
                              onChange={(e) => setAssistantForm({
                                ...assistantForm,
                                permisos: { ...assistantForm.permisos, responder_tickets: e.target.checked }
                              })}
                              className="rounded text-[#0F3D2E] focus:ring-[#0F3D2E]"
                            />
                            <span>Permitir responder solicitudes y reclamos de vecinos</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={assistantForm.permisos.aprobar_pagos}
                              onChange={(e) => setAssistantForm({
                                ...assistantForm,
                                permisos: { ...assistantForm.permisos, aprobar_pagos: e.target.checked }
                              })}
                              className="rounded text-[#0F3D2E] focus:ring-[#0F3D2E]"
                            />
                            <span>Permitir aprobar comprobantes de pago de copropietarios</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={assistantForm.permisos.emitir_colillas}
                              onChange={(e) => setAssistantForm({
                                ...assistantForm,
                                permisos: { ...assistantForm.permisos, emitir_colillas: e.target.checked }
                              })}
                              className="rounded text-[#0F3D2E] focus:ring-[#0F3D2E]"
                            />
                            <span>Permitir emitir colillas y cierre de períodos</span>
                          </label>
                        </div>
                      </div>

                      {assistantFeedback && (
                        <p className={`text-xs font-bold ${assistantFeedback.includes('✅') ? 'text-emerald-700' : 'text-red-600'}`}>
                          {assistantFeedback}
                        </p>
                      )}

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => { setShowAddAssistantModal(false); setAssistantFeedback(''); }}
                          className="px-4 py-2 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                        >
                          Guardar Asistente en Supabase
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================== SUB-PESTAÑA 5: RESPALDOS & SEGURIDAD ==================== */}
          {activeSubTab === 'respaldos' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <span className="text-[10px] font-bold text-[#D4B895] uppercase tracking-wider block">
                  Seguridad & Resguardo Total
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  Centro de Respaldos (Backup), Seguridad & PIN Maestro
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Exporta copias de seguridad de todas las comunidades en archivo JSON, administra tu PIN maestro de acceso
                  y garantiza la continuidad operativa de la plataforma.
                </p>
              </div>

              {/* PIN MAESTRO */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Contraseña / PIN Maestro del Administrador</h4>
                    <p className="text-[11px] text-slate-500">Clave que utilizas junto con tu RUT ({empresaForm.adminRut || '16.012.871-2'}) para ingresar al panel de administración.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="text-xs font-bold text-[#0F3D2E] hover:underline"
                  >
                    {showPin ? 'Ocultar Clave' : 'Mostrar Clave'}
                  </button>
                </div>
                <div className="flex items-center gap-3 max-w-sm">
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={adminPin}
                    onChange={(e) => setAdminPin(e.target.value)}
                    placeholder="Tu clave de administrador"
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                  />
                  <button
                    type="button"
                    onClick={handleSaveAllSettings}
                    className="px-4 py-2 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs rounded-xl shadow-xs transition-all whitespace-nowrap cursor-pointer active:scale-95"
                  >
                    Guardar Clave
                  </button>
                </div>
                {saveFeedback && (
                  <p className="text-xs font-bold text-emerald-700 animate-in fade-in">
                    ✅ Contraseña de Administrador actualizada exitosamente en el sistema.
                  </p>
                )}
              </div>

              {/* CENTRO DE RESPALDOS JSON */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5 text-[#0F3D2E]" />
                  Respaldo y Recuperación de Base de Datos
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Descarga JSON */}
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase">
                      Exportar Datos
                    </span>
                    <h5 className="font-bold text-sm text-slate-900">Descargar Copia de Respaldo Completa</h5>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Genera un archivo seguro .JSON con todas las comunidades, nóminas de casas, gastos históricos, actas de asambleas y certificados foliados.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ communities, certificates, companySettings }, null, 2));
                        const downloadAnchor = document.createElement('a');
                        downloadAnchor.setAttribute("href", dataStr);
                        downloadAnchor.setAttribute("download", `ARANPRO_Backup_Completo_${new Date().toISOString().split('T')[0]}.json`);
                        document.body.appendChild(downloadAnchor);
                        downloadAnchor.click();
                        downloadAnchor.remove();
                        showAlert('✓ Respaldo Descargado', 'El archivo de seguridad se ha descargado exitosamente en tu equipo.', 'success');
                      }}
                      className="w-full py-2.5 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5 text-[#D4B895]" />
                      Descargar Backup Completo (.JSON)
                    </button>
                  </div>

                  {/* Restaurar JSON */}
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 uppercase">
                      Restaurar Datos
                    </span>
                    <h5 className="font-bold text-sm text-slate-900">Cargar / Restaurar Copia de Respaldo</h5>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Sube un archivo .JSON de respaldo para restablecer o migrar las comunidades en este u otro computador de la empresa.
                    </p>
                    <label className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                      <Upload className="w-3.5 h-3.5 text-slate-600" />
                      Seleccionar Archivo JSON
                      <input
                        type="file"
                        accept=".json"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            try {
                              const parsed = JSON.parse(event.target?.result);
                              if (parsed.communities && Array.isArray(parsed.communities)) {
                                showConfirm({
                                  title: '¿Confirmar Restauración de Respaldo?',
                                  message: `Se detectaron ${parsed.communities.length} comunidades y ${parsed.certificates?.length || 0} certificados en el archivo.\n\n¿Desea restaurar estos datos reemplazando los actuales?`,
                                  type: 'warning',
                                  confirmText: 'Sí, Restaurar Datos',
                                  cancelText: 'Cancelar',
                                  onConfirm: () => {
                                    localStorage.setItem('condo_communities', JSON.stringify(parsed.communities));
                                    if (parsed.certificates) localStorage.setItem('condo_certificates', JSON.stringify(parsed.certificates));
                                    if (parsed.companySettings) localStorage.setItem('condo_company_settings', JSON.stringify(parsed.companySettings));
                                    showAlert('✓ Restauración Completada', 'Los datos han sido restaurados. La página se actualizará ahora.', 'success');
                                    setTimeout(() => window.location.reload(), 1500);
                                  }
                                });
                              } else {
                                showAlert('Archivo No Válido', 'El archivo seleccionado no tiene el formato de respaldo de ARANPRO.', 'danger');
                              }
                            } catch (err) {
                              showAlert('Error al Leer Archivo', 'No se pudo procesar el archivo JSON seleccionado.', 'danger');
                            }
                          };
                          reader.readAsText(file);
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== SUB-PESTAÑA 6: SOBRE LA PLATAFORMA (TIPO ECP SCREENSHOT 3) ==================== */}
          {activeSubTab === 'sobre_app' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-bold text-[#D4B895] uppercase tracking-wider block">
                    Información Institucional
                  </span>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-[#0F3D2E]" />
                    <span>SOBRE LA APLICACIÓN</span>
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={handleSaveAllSettings}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
                >
                  <Check className="w-4 h-4 text-white" />
                  Guardar Cambios
                </button>
              </div>

              {/* CARD PRINCIPAL (SCREENSHOT 3) */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs space-y-2">
                <h4 className="text-lg font-black text-slate-900">
                  ARANPRO • Suite de Administración
                </h4>
                <p className="text-xs font-bold text-slate-700">
                  Versión 2.0.0 · Edición de lanzamiento PWA
                </p>
                <div className="pt-2 text-xs text-slate-600 space-y-1">
                  <p>
                    <strong>Titular de derechos:</strong> ARANPRO SpA
                  </p>
                  <p>
                    <strong>Sitio web oficial:</strong>{' '}
                    <a
                      href="https://aranpro.cl"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#0F3D2E] hover:underline font-bold"
                    >
                      https://aranpro.cl
                    </a>
                  </p>
                </div>
              </div>

              {/* ACORDEÓN DE SECCIONES (SCREENSHOT 3) */}
              <div className="space-y-3">
                {/* 1. INFORMACIÓN GENERAL */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                  <button
                    type="button"
                    onClick={() => toggleAboutSection('general')}
                    className="w-full px-5 py-4 text-left font-bold text-xs text-slate-900 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <span>1. Información general</span>
                    {aboutOpenSections.general ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </button>
                  {aboutOpenSections.general && (
                    <div className="px-5 py-4 text-xs text-slate-600 leading-relaxed space-y-2 border-t border-slate-100">
                      <p>
                        ARANPRO Suite es una herramienta de apoyo integral para la gestión y administración de comunidades y condominios bajo el marco legal de la Ley N° 21.442 de Copropiedad Inmobiliaria.
                      </p>
                      <p>
                        Su motor contable permite la elaboración de presupuestos, prorrateo y control de partidas de gasto común, rendición documentada mediante colillas y comprobantes bancarios, planificación de mantenimiento preventivo, quórums de asamblea telemática y generación de documentación oficial con firma digital manuscrita sincronizada.
                      </p>
                      <p className="text-[11px] text-slate-500 italic pt-1">
                        Sus cálculos, presupuestos y resultados son referenciales y auditables en todo momento por el Comité de Administración y la asamblea de copropietarios antes de su utilización contractual, técnica o comercial.
                      </p>
                    </div>
                  )}
                </div>

                {/* 2. QUIÉNES SOMOS */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                  <button
                    type="button"
                    onClick={() => toggleAboutSection('quienesSomos')}
                    className="w-full px-5 py-4 text-left font-bold text-xs text-slate-900 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <span>2. Quiénes somos</span>
                    {aboutOpenSections.quienesSomos ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </button>
                  {aboutOpenSections.quienesSomos && (
                    <div className="px-5 py-4 text-xs text-slate-600 leading-relaxed space-y-2 border-t border-slate-100">
                      <p>
                        ARANPRO es una empresa liderada por <strong>John Andrés Arancibia Maureira</strong>, Administrador Profesional de Condominios acreditado por el Colegio de Gestión y Administración Inmobiliaria (CGAI Chile Socio N° 13-563), la Asociación Gremial AGACECH y habilitado bajo la Ley N° 21.442.
                      </p>
                      <p>
                        Nuestra gran ventaja competitiva radica en la formación profesional de nuestro titular: <strong>Constructor Civil</strong>. Esta sólida base constructiva nos permite auditar, fiscalizar y supervisar con criterio experto obras de mantención, salas de bombas, cubiertas, filtraciones y contratos de proveedores, garantizando la preservación y plusvalía del patrimonio comunitario.
                      </p>
                    </div>
                  )}
                </div>

                {/* 3. MISIÓN Y VISIÓN */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                  <button
                    type="button"
                    onClick={() => toggleAboutSection('misionVision')}
                    className="w-full px-5 py-4 text-left font-bold text-xs text-slate-900 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <span>3. Misión y visión</span>
                    {aboutOpenSections.misionVision ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </button>
                  {aboutOpenSections.misionVision && (
                    <div className="px-5 py-4 text-xs text-slate-600 leading-relaxed space-y-2 border-t border-slate-100">
                      <p>
                        <strong>Misión:</strong> Brindar a las comunidades y comités de administración una gestión transparente, moderna, eficiente y técnica, transformando la experiencia de copropietarios y residentes a través de herramientas digitales de vanguardia y una fiscalización constructiva permanente en terreno.
                      </p>
                      <p>
                        <strong>Visión:</strong> Consolidarnos como la suite y empresa de administración de referencia en la Región de Coquimbo y a nivel nacional, sinónimo de plusvalía inmobiliaria, rendición de cuentas intachable, cumplimiento estricto de la Ley 21.442 y tranquilidad vecinal.
                      </p>
                    </div>
                  )}
                </div>

                {/* 4. LICENCIA DE USO */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                  <button
                    type="button"
                    onClick={() => toggleAboutSection('licencia')}
                    className="w-full px-5 py-4 text-left font-bold text-xs text-slate-900 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <span>4. Licencia de uso</span>
                    {aboutOpenSections.licencia ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </button>
                  {aboutOpenSections.licencia && (
                    <div className="px-5 py-4 text-xs text-slate-600 leading-relaxed space-y-2 border-t border-slate-100">
                      <p>
                        Software protegido por la legislación chilena e internacional de propiedad intelectual y derechos de autor. Licencia de uso otorgada exclusivamente para las comunidades y copropietarios legalmente contratados y administrados bajo los servicios de ARANPRO.
                      </p>
                      <p>
                        Toda la información contable, nóminas de residentes, cartolas bancarias, actas y balances gozan de estricta reserva, cifrado y respaldo bajo protocolos de seguridad informática. Queda prohibida su reproducción o distribución sin autorización expresa de ARANPRO SpA.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

      {/* ==================== MODAL DE VISTA PREVIA DE CARTA DE POSTULACIÓN (PDF CARTA) ==================== */}
      <div
        className={
          previewProposalModal
            ? 'fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto'
            : 'fixed top-0 left-0 w-[850px] -z-[9999] opacity-1 pointer-events-none'
        }
      >
        <div
          className={
            previewProposalModal
              ? 'bg-white rounded-3xl max-w-4xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col relative'
              : 'w-[850px] bg-white'
          }
        >
          {previewProposalModal && (
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 mb-6">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-[#0F3D2E] text-[#D4B895] flex items-center justify-center font-bold text-sm">
                  💼
                </span>
                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    Carta de Presentación & Propuesta de Administración
                  </h4>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Documento Oficial para Licitaciones y Comités de Copropietarios
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintProposal}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs shadow-xs transition-all active:scale-95"
                >
                  <Printer className="w-4 h-4 text-[#D4B895]" />
                  Imprimir / Descargar PDF Oficial (Carta)
                </button>
                <button
                  onClick={() => setPreviewProposalModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {previewProposalModal && (
            /* BARRA DE AJUSTE RÁPIDO DE DESTINATARIO */
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs mb-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-slate-700">Condominio a Postular:</span>
                <input
                  type="text"
                  placeholder="Ej: Condominio Los Cerezos (o vacío)"
                  value={proposalConfig.targetCondo}
                  onChange={(e) => setProposalConfig({ ...proposalConfig, targetCondo: e.target.value })}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 text-xs w-48 sm:w-56 focus:outline-none focus:ring-1 focus:ring-[#0F3D2E]"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-slate-700">Dirigido a:</span>
                <input
                  type="text"
                  placeholder="Ej: Comité / Presidente / Directiva (o vacío)"
                  value={proposalConfig.leaveRecipientBlank ? '' : proposalConfig.targetRecipient}
                  disabled={proposalConfig.leaveRecipientBlank}
                  onChange={(e) => setProposalConfig({ ...proposalConfig, targetRecipient: e.target.value, leaveRecipientBlank: false })}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 text-xs w-56 sm:w-64 focus:outline-none focus:ring-1 focus:ring-[#0F3D2E]"
                />
                <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-600 select-none">
                  <input
                    type="checkbox"
                    checked={proposalConfig.leaveRecipientBlank}
                    onChange={(e) => setProposalConfig({ ...proposalConfig, leaveRecipientBlank: e.target.checked, targetRecipient: e.target.checked ? '' : 'Señores Miembros del Comité de Administración' })}
                    className="w-3.5 h-3.5 rounded text-[#0F3D2E]"
                  />
                  <span>En blanco</span>
                </label>
              </div>
              <AranproPdfStyleSelector value={pdfStyle} onChange={setPdfStyle} compact />
            </div>
          )}

          {/* CONTENEDOR DE LA CARTA IMPRIMIBLE TAMAÑO CARTA (CANÓNICA 1 PÁGINA) */}
          <div className={previewProposalModal ? "overflow-y-auto flex-1 pr-1 bg-slate-100/70 p-2 md:p-4 rounded-2xl" : "w-[850px]"}>
            <div
              id="printable-commercial-proposal"
              data-pdf-style={pdfStyle}
              className="dossier-page page-1 bg-white p-6 md:p-7 pl-9 md:pl-11 min-h-[850px] flex flex-col justify-between text-slate-900 text-xs shadow-md mx-auto max-w-[850px] leading-relaxed relative overflow-hidden"
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
            >
              {/* Filete doble izquierdo Alternativa 4 */}
              <div className="absolute left-0 top-0 bottom-0 w-2 flex pointer-events-none select-none z-10" aria-hidden="true">
                <div className="w-[2.5px] h-full bg-[#0F3D2E]" />
                <div className="w-[2px] h-full bg-transparent" />
                <div className="w-[1.5px] h-full bg-[#D4B895]" />
              </div>

              {/* Sello circular como marca de agua central sutil */}
              <img
                src="/brand/ARANPRO_sello_circular_integral_transparente.png"
                alt=""
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 object-contain opacity-[0.035] pointer-events-none select-none z-0"
                aria-hidden="true"
              />
                {/* SECCIÓN SUPERIOR: MEMBRETE, PROTOCOLO, TÍTULO, CUERPO, FORTALEZAS Y PROPUESTA ECONÓMICA */}
                <div className="space-y-2.5">
                  {/* Membrete Corporativo Maestro ARANPRO (Alternativa 4 • Logo Vertical Principal) */}
                  <div className="flex items-center justify-between border-b-2 border-[#0F3D2E] pb-2.5">
                    <div className="flex items-center space-x-3.5">
                      <AranproLogo variant="principal" className="h-12 w-auto" />
                      <div className="space-y-0.5 border-l border-slate-300 pl-3.5">
                        <div className="text-xs font-black tracking-tight text-[#0F3D2E] uppercase">
                          {empresaForm.provisionalName || 'ARANPRO • GESTIÓN INTEGRAL DE CONDOMINIOS'}
                        </div>
                        <p className="text-[9.5px] text-slate-600 font-mono font-semibold">
                          {empresaForm.companyRut && !String(empresaForm.companyRut).includes('76.999.888') ? `RUT Empresa: ${empresaForm.companyRut} • ` : ''}{empresaForm.rnacNumber && empresaForm.rnacNumber !== '48.912' ? `RNAC MINVU N° ${empresaForm.rnacNumber}` : 'Ley N° 21.442 de Copropiedad Inmobiliaria'}
                        </p>
                        <p className="text-[9px] text-slate-500">
                          {empresaForm.email || 'contacto@aranpro.cl'} • {empresaForm.phone || '+56 9 5811 8504'} • {empresaForm.city || 'La Serena, Chile'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right space-y-0.5 shrink-0">
                      <span className="inline-block px-2.5 py-0.5 bg-[#F5F4EF] text-[#0F3D2E] text-[9.5px] font-mono font-bold rounded-md border border-[#D4B895]">
                        PROPUESTA LICITACIÓN {new Date().getFullYear()}
                      </span>
                      <p className="text-[10.5px] font-bold text-slate-800">
                        Carta Formal de Postulación
                      </p>
                      <p className="text-[9.5px] text-slate-500 font-semibold">
                        {proposalConfig.targetCondo || 'Comunidad de Copropietarios'}
                      </p>
                    </div>
                  </div>

                  {/* Encabezado Formal Protocolar */}
                  <div className="text-[10.5px] text-slate-700 space-y-0.5 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                    <p>
                      <strong>Dirigido cordialmente a:</strong>{' '}
                      {proposalConfig.leaveRecipientBlank || !proposalConfig.targetRecipient?.trim() ? (
                        <span className="font-mono text-slate-400">__________________________________________________________________</span>
                      ) : (
                        <strong className="text-slate-900">{proposalConfig.targetRecipient}</strong>
                      )}
                    </p>
                    {proposalConfig.targetCondo?.trim() ? (
                      <p>
                        <strong>Condominio / Edificio:</strong>{' '}
                        <strong className="text-[#0F3D2E] uppercase">{proposalConfig.targetCondo}</strong>
                      </p>
                    ) : (
                      proposalConfig.leaveRecipientBlank && (
                        <p>
                          <strong>Condominio / Edificio:</strong>{' '}
                          <span className="font-mono text-slate-400">__________________________________________________________</span>
                        </p>
                      )
                    )}
                    <p><strong>Presentado por:</strong> <strong className="text-slate-900">{empresaForm.adminName}</strong> — Constructor Civil • Administrador de Condominios (Ley N° 21.442)</p>
                    <p>
                      <strong>Fecha:</strong>{' '}
                      {proposalConfig.proposalDate
                        ? new Date(proposalConfig.proposalDate + 'T12:00:00').toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })
                        : new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })}
                      {proposalConfig.targetCity?.trim() ? ` • ${proposalConfig.targetCity}` : ` • ${empresaForm.city}`}
                    </p>
                    <p><strong>Materia:</strong> Postulación Formal a la Administración y Custodia Patrimonial del Condominio</p>
                  </div>

                  {/* Título de la Propuesta */}
                  <div className="text-center py-0.5">
                    <h1 className="text-xs md:text-sm font-black text-[#0F3D2E] uppercase tracking-tight">
                      Propuesta Formal de Administración, Rigor Constructivo & Transparencia Digital
                    </h1>
                    <div className="w-16 h-0.5 bg-[#D4B895] mx-auto mt-0.5 rounded-full"></div>
                  </div>

                  {/* Cuerpo de la Carta */}
                  <div className="text-justify text-[10.5px] text-slate-800 leading-snug space-y-1.5">
                    <p>
                      {proposalConfig.leaveRecipientBlank || !proposalConfig.targetRecipient?.trim()
                        ? 'Estimados señores miembros del Comité de Administración y vecinos copropietarios:'
                        : `Estimados ${proposalConfig.targetRecipient}:`}
                    </p>
                    <p>
                      Por medio de la presente, tengo el agrado de presentar a ustedes la postulación formal de
                      <strong> {empresaForm.provisionalName}</strong> para asumir la administración,
                      gestión operativa y resguardo patrimonial de{' '}
                      {proposalConfig.targetCondo?.trim() ? (
                        <strong>{proposalConfig.targetCondo}</strong>
                      ) : (
                        <strong>su distinguida comunidad</strong>
                      )}{' '}
                      conforme a las disposiciones de la <strong>Ley N° 21.442 de Copropiedad Inmobiliaria</strong>.
                    </p>
                    <p>
                      {empresaForm.presentationText}
                    </p>

                    {/* Fortalezas y Diferenciadores Técnicos */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1 text-xs">
                      <p className="font-black text-[#0F3D2E] uppercase text-[10px]">
                        NUESTRAS 4 FORTALEZAS Y VENTAJAS COMPETITIVAS:
                      </p>
                      <ul className="list-disc pl-4 space-y-0.5 text-slate-700 text-[10px] leading-snug">
                        <li>
                          <strong>Solvencia Técnica Constructor Civil:</strong> Diagnósticos directos en bombas, tableros eléctricos, sellos y cubiertas sin sobrecostos de contratistas externos.
                        </li>
                        <li>
                          <strong>Transparencia Contable Digital 24/7:</strong> Portal y app móvil gratuita donde cada vecino audita con 1 clic las facturas, boletas y cartolas bancarias.
                        </li>
                        <li>
                          <strong>Acreditación Minvu Ley 21.442:</strong> Administrador titular debidamente acreditado conforme a las exigencias legales vigentes.
                        </li>
                        <li>
                          <strong>Cobranza Asistida & Fe Notarial:</strong> Emisión formal de certificados de no deuda, convenios de pago y certificados morosos para compraventas (Art. 36°).
                        </li>
                      </ul>
                    </div>

                    {/* Resumen de Propuesta Económica Formal para la Licitación */}
                    <div className="p-2.5 rounded-xl bg-[#F5F4EF] border border-[#D4B895] space-y-1 text-xs">
                      <div className="flex items-center justify-between border-b border-[#D4B895]/50 pb-1">
                        <span className="font-black text-[#0F3D2E] uppercase text-[10px]">
                          Propuesta Económica & Honorarios de Administración (Ley N° 21.442)
                        </span>
                        <span className="font-mono font-bold text-[9px] text-[#0F3D2E] bg-white border border-[#D4B895] px-2 py-0.5 rounded">
                          {proposalConfig.taxModality || 'Factura Exenta / Boleta'}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center py-0.5">
                        <div className="bg-white p-1.5 rounded-lg border border-slate-200">
                          <span className="text-[8px] text-slate-500 uppercase block font-bold">Honorario Mensual Propuesto</span>
                          <strong className="text-xs font-black text-[#0F3D2E]">
                            {Number(proposalConfig.proposedMonthlyFee) > 0 ? `${formatCLP(Number(proposalConfig.proposedMonthlyFee))} / mes` : 'A convenir en reunión'}
                          </strong>
                        </div>
                        <div className="bg-white p-1.5 rounded-lg border border-slate-200">
                          <span className="text-[8px] text-slate-500 uppercase block font-bold">Costo Estimado / Unidad</span>
                          <strong className="text-xs font-black text-slate-800">
                            {Number(proposalConfig.proposedMonthlyFee) > 0
                              ? `${formatCLP(Math.round(Number(proposalConfig.proposedMonthlyFee) / Math.max(1, Number(proposalConfig.targetUnits) || 1)))} / unidad`
                              : 'Según dotación'}
                          </strong>
                        </div>
                        <div className="bg-white p-1.5 rounded-lg border border-slate-200">
                          <span className="text-[8px] text-slate-500 uppercase block font-bold">Comunidad Evaluada</span>
                          <strong className="text-xs font-black text-slate-800">
                            {proposalConfig.targetUnits ? `${proposalConfig.targetUnits} Unidades` : 'Por definir en visita'}
                          </strong>
                        </div>
                      </div>
                      <p className="text-[9px] text-slate-600 leading-snug">
                        <strong>Incluye sin costo adicional:</strong> {proposalConfig.visitFrequency || 'Visitas técnicas semanales en terreno'}, Suite Web & App Móvil ARANPRO 24/7 para todos los copropietarios, y auditoría de traspaso inicial.
                      </p>
                    </div>
                  </div>
                </div>

                {/* SECCIÓN INFERIOR ANCLADA AL PIE: SELLO, FIRMA Y FOOTER CANÓNICO */}
                <div className="mt-auto pt-2 space-y-2">
                  <div className="pt-2 border-t border-slate-200 flex items-end justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <AranproOfficialSeal
                        size="sm"
                        companyRut={empresaForm.companyRut && !String(empresaForm.companyRut).includes('76.999.888') ? empresaForm.companyRut : ''}
                        rnacNumber=""
                        showCaption={true}
                      />
                      <div className="text-[9.5px] text-slate-600 border-l border-slate-200 pl-3 space-y-0.5">
                        <p><strong>Fono Directo:</strong> <span className="font-mono font-bold text-[#0F3D2E]">{empresaForm.phone || '+56 9 5811 8504'}</span></p>
                        <p><strong>Correo:</strong> <span className="font-mono">{empresaForm.email || 'contacto@aranpro.cl'}</span></p>
                        <p><strong>Web:</strong> <span className="font-mono text-[#0F3D2E] font-bold">{empresaForm.website || 'https://aranpro.cl'}</span></p>
                      </div>
                    </div>

                    <div className="text-center min-w-[240px]">
                      <div className="h-14 flex items-end justify-center pb-0.5 overflow-visible">
                        {signatureImage ? (
                          <img
                            src={signatureImage}
                            alt="Firma Administrador"
                            className="h-12 max-h-14 w-auto max-w-[240px] object-contain mx-auto"
                            style={{ transform: `scale(${signatureScale})`, transformOrigin: 'bottom center' }}
                          />
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Firma del Representante Legal</span>
                        )}
                      </div>
                      <div className="border-t-[1.5px] border-slate-800 pt-1">
                        <p className="font-black text-[11px] text-slate-900 leading-tight">{empresaForm.adminName}</p>
                        <p className="text-[9px] text-[#0F3D2E] font-bold leading-tight">
                          Constructor Civil • Administrador de Condominios
                        </p>
                        <p className="text-[9px] text-slate-600 font-mono">
                          RUT: {(empresaForm.adminRut && empresaForm.adminRut !== '14.882.140-K') ? empresaForm.adminRut : '16.012.871-2'} • Ley N° 21.442
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Pie de Página Canónico Maestro */}
                  <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                    <div>ARANPRO Gestión Integral • {empresaForm.website}</div>
                    <div className="font-bold text-[#0F3D2E]">Carta Formal de Postulación a Licitación • Ley N° 21.442 (Pág. 1 de 1)</div>
                    <div>{empresaForm.city || 'La Serena, Chile'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* ==================== CARTA DE VALOR (MODAL DE VISTA PREVIA Y DOCUMENTO MAESTRO PERMANENTE) ==================== */}
      <div
        className={
          previewColdLetterModal
            ? 'fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto'
            : 'fixed top-0 left-0 w-[850px] -z-[9999] opacity-1 pointer-events-none'
        }
      >
        <div
          className={
            previewColdLetterModal
              ? 'bg-white rounded-3xl max-w-4xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 max-h-[94vh] flex flex-col relative'
              : 'w-[850px] bg-white'
          }
        >
          {previewColdLetterModal && (
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-2xl bg-[#0F3D2E] text-[#D4B895] flex items-center justify-center font-bold text-base shadow-sm">
                  ⚡
                </span>
                <div>
                  <h4 className="text-base font-black text-slate-900">
                    Carta de Valor & Presentación Espontánea al Comité (Puerta en Frío / Conserjería)
                  </h4>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Ideal para entregar cuando aún no conoces la realidad del condominio ni si están en licitación
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintColdLetter}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs shadow-md transition-all active:scale-95"
                >
                  <Printer className="w-4 h-4 text-[#D4B895]" />
                  Imprimir / Descargar PDF (Carta)
                </button>
                <button
                  onClick={() => setPreviewColdLetterModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {previewColdLetterModal && (
            /* BARRA RÁPIDA: MODO ENTREGA MASIVA EN CONSERJERÍA O CON NOMBRE DEL EDIFICIO */
            <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200 flex flex-wrap items-center justify-between gap-2.5 text-xs mb-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-[#0F3D2E]">Modalidad de Entrega:</span>
                <button
                  type="button"
                  onClick={() => setProposalConfig({ ...proposalConfig, targetCondo: '', leaveRecipientBlank: false, targetRecipient: 'Señores Miembros del Comité de Administración' })}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs border transition-all ${
                    !proposalConfig.targetCondo?.trim() && !proposalConfig.leaveRecipientBlank
                      ? 'bg-[#0F3D2E] text-[#D4B895] border-[#0F3D2E]'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  🏢 Genérica Conserjería
                </button>
                <button
                  type="button"
                  onClick={() => setProposalConfig({ ...proposalConfig, leaveRecipientBlank: true, targetCondo: '' })}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs border transition-all ${
                    proposalConfig.leaveRecipientBlank
                      ? 'bg-[#0F3D2E] text-[#D4B895] border-[#0F3D2E]'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  ✍️ Líneas para Escribir a Mano
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700">Comunidad / Condominio:</span>
                <input
                  type="text"
                  placeholder="Ej: Valle de la Florida IV"
                  value={proposalConfig.targetCondo}
                  onChange={(e) => setProposalConfig({ ...proposalConfig, targetCondo: e.target.value, leaveRecipientBlank: false })}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 text-xs w-48 focus:outline-none focus:ring-1 focus:ring-[#0F3D2E]"
                />
              </div>
              <AranproPdfStyleSelector value={pdfStyle} onChange={setPdfStyle} compact />
            </div>
          )}

          {/* CONTENEDOR DE LA CARTA DE VALOR IMPRIMIBLE TAMAÑO CARTA (GARANTIZADO EN 1 SOLA PÁGINA) */}
          <div className={previewColdLetterModal ? "overflow-y-auto flex-1 pr-1 bg-slate-100/70 p-2 md:p-4 rounded-2xl" : "w-[850px]"}>
            <div id="printable-cold-value-letter" className="space-y-6 print-area">
              <div
                data-pdf-style={pdfStyle}
                className="dossier-page page-1 bg-white p-7 md:p-8 pl-9 md:pl-11 min-h-[850px] flex flex-col justify-between text-slate-900 text-xs shadow-md mx-auto max-w-[850px] leading-relaxed relative overflow-hidden"
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              >
                {/* Filete doble izquierdo Alternativa 4 */}
                <div className="absolute left-0 top-0 bottom-0 w-2 flex pointer-events-none select-none z-10" aria-hidden="true">
                  <div className="w-[2.5px] h-full bg-[#0F3D2E]" />
                  <div className="w-[2px] h-full bg-transparent" />
                  <div className="w-[1.5px] h-full bg-[#D4B895]" />
                </div>

                {/* Sello circular como marca de agua central sutil */}
                <img
                  src="/brand/ARANPRO_sello_circular_integral_transparente.png"
                  alt=""
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 object-contain opacity-[0.035] pointer-events-none select-none z-0"
                  aria-hidden="true"
                />
                  {/* SECCIÓN SUPERIOR: MEMBRETE, PROTOCOLO, TÍTULO, INTRO PROFUNDA, 3 PILARES, BENEFICIOS */}
                  <div className="space-y-3">
                    {/* Membrete Corporativo Maestro ARANPRO (Alternativa 4 • Logo Vertical Principal) */}
                    <div className="flex items-center justify-between border-b-2 border-[#0F3D2E] pb-2">
                      <div className="flex items-center space-x-3">
                        <AranproLogo variant="principal" className="h-11 w-auto" />
                        <div className="space-y-0.5 border-l border-slate-300 pl-3">
                          <div className="text-xs font-black tracking-tight text-[#0F3D2E] uppercase">
                            {empresaForm.provisionalName || 'ARANPRO • GESTIÓN INTEGRAL DE CONDOMINIOS'}
                          </div>
                          <p className="text-[9.5px] text-slate-600 font-mono font-semibold">
                            {empresaForm.companyRut && !String(empresaForm.companyRut).includes('76.999.888') ? `RUT Empresa: ${empresaForm.companyRut} • ` : ''}Ley N° 21.442 de Copropiedad Inmobiliaria
                          </p>
                          <p className="text-[9px] text-slate-500">
                            {empresaForm.email || 'contacto@aranpro.cl'} • {empresaForm.phone || '+56958118504'} • {empresaForm.city || 'La Serena, Chile'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right space-y-0.5 shrink-0">
                        <span className="inline-block px-2 py-0.5 bg-[#F5F4EF] text-[#0F3D2E] border border-[#D4B895] text-[9px] font-mono font-bold rounded whitespace-nowrap">
                          PRESENTACIÓN INSTITUCIONAL {new Date().getFullYear()}
                        </span>
                        <p className="text-[10px] font-bold text-slate-800">
                          Carta de Presentación & Propuesta de Servicios
                        </p>
                        <p className="text-[9px] text-slate-500 font-semibold">
                          Para el Comité de Administración
                        </p>
                      </div>
                    </div>

                    {/* Encabezado Protocolar */}
                    <div className="text-[10.5px] text-slate-700 space-y-0.5 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                      <p>
                        <strong>Dirigido cordialmente a:</strong>{' '}
                        {proposalConfig.leaveRecipientBlank ? (
                          <span className="font-mono text-slate-400">__________________________________________________________________</span>
                        ) : (
                          <strong className="text-slate-900">Señores Integrantes del Comité de Administración</strong>
                        )}
                      </p>
                      {proposalConfig.targetCondo?.trim() ? (
                        <p>
                          <strong>Comunidad / Condominio:</strong>{' '}
                          <strong className="text-[#0F3D2E] uppercase">{proposalConfig.targetCondo}</strong>
                        </p>
                      ) : proposalConfig.leaveRecipientBlank ? (
                        <p>
                          <strong>Comunidad / Condominio:</strong>{' '}
                          <span className="font-mono text-slate-400">__________________________________________________________</span>
                        </p>
                      ) : (
                        <p>
                          <strong>Comunidad / Condominio:</strong>{' '}
                          <span className="font-semibold text-slate-800">Comunidad de Copropietarios • {empresaForm.city}</span>
                        </p>
                      )}
                      <p>
                        <strong>Presentado por:</strong> <strong className="text-slate-900">{empresaForm.adminName}</strong> — Constructor Civil • Administrador de Condominios (Ley N° 21.442)
                      </p>
                      <p>
                        <strong>Materia:</strong> Presentación de Servicios de Administración Profesional & Propuesta Operativa Integral
                      </p>
                    </div>

                    {/* Título de Alto Impacto */}
                    <div className="text-center py-0.5">
                      <h1 className="text-xs md:text-sm font-black text-[#0F3D2E] uppercase tracking-tight">
                        Administración Profesional, Criterio Constructor Civil & Plataforma Digital 100% Gratuita
                      </h1>
                      <div className="w-16 h-0.5 bg-[#D4B895] mx-auto mt-0.5 rounded-full"></div>
                    </div>

                    {/* Cuerpo Consultivo: Presentación Institucional y Diagnóstico Empático con el Comité */}
                    <div className="text-justify text-[10.5px] text-slate-800 leading-snug space-y-1.5">
                      <p>
                        <strong>Estimadas y estimados integrantes del Comité de Administración:</strong> Junto con saludarles muy cordialmente, nos dirigimos a ustedes reconociendo y valorando con la mayor consideración el enorme compromiso, tiempo y dedicación personal que entregan día a día a su comunidad para resguardar la seguridad, la armonía y el patrimonio de sus vecinos y familias. Sabemos por experiencia que liderar un condominio suele transformarse en una carga desgastante y solitaria cuando la administración no responde con la prontitud requerida, las rendiciones de cuentas carecen de respaldos oportunos o las mantenciones e imprevistos de infraestructura se encarecen por la ausencia de una supervisión técnica rigurosa en terreno.
                      </p>
                      <p>
                        Con el firme propósito de ser el respaldo técnico y operativo que su directiva necesita para gobernar con tranquilidad, ponemos a su consideración los servicios de <strong>ARANPRO Gestión Integral</strong> para asumir la administración de {proposalConfig.targetCondo?.trim() ? <strong className="text-[#0F3D2E]">{proposalConfig.targetCondo}</strong> : <strong>su comunidad</strong>}. Nuestro modelo de gestión integra cercanía humana, rendiciones de cuentas transparentes y verificables bajo la <strong>Ley N° 21.442</strong>, y la dirección técnica de un profesional <strong>Constructor Civil</strong> que supervisa directamente las instalaciones críticas y defiende el presupuesto comunitario frente a contratistas. Nos motiva conocer a fondo las prioridades de {proposalConfig.targetCondo?.trim() ? proposalConfig.targetCondo : 'su condominio'} y poner a su disposición una administración seria, transparente y comprometida con la plusvalía de su copropiedad.
                      </p>
                      <p className="font-semibold text-[#0F3D2E]">
                        Nuestra propuesta de valor se fundamenta en <strong>tres pilares operativos</strong> diseñados para entregar orden financiero, rigor técnico y tranquilidad total a su comunidad:
                      </p>

                      {/* 3 Pilares Solicitados */}
                      <div className="grid grid-cols-1 gap-1.5 pt-0.5">
                        {/* Pilar 1: Gestión financiera, rendición de cuentas y plataforma gratuita */}
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-md bg-[#0F3D2E] text-[#D4B895] font-black text-[10.5px] flex items-center justify-center shrink-0 mt-0.5">
                            1
                          </span>
                          <div>
                            <strong className="text-[#0F3D2E] block text-[11px]">
                              Gestión financiera, rendición de cuentas & Plataforma digital 100% gratuita
                            </strong>
                            <p className="text-[10px] text-slate-600 leading-snug mt-0.5">
                              Preparación y seguimiento del presupuesto, gestión de gastos comunes y morosidad, revisión de pagos y organización de respaldos. <strong>La plataforma digital y app móvil de ARANPRO se entrega 100% gratuita para toda la comunidad</strong>, facilitando la consulta de la información de gestión las 24 horas, con accesos definidos según las funciones del comité y de los residentes.
                            </p>
                          </div>
                        </div>

                        {/* Pilar 2: Mantención y evaluación de proveedores */}
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-md bg-[#0F3D2E] text-[#D4B895] font-black text-[10.5px] flex items-center justify-center shrink-0 mt-0.5">
                            2
                          </span>
                          <div>
                            <strong className="text-[#0F3D2E] block text-[11px]">
                              Mantención y evaluación de proveedores (Criterio Constructor Civil)
                            </strong>
                            <p className="text-[10px] text-slate-600 leading-snug mt-0.5">
                              Revisión en terreno de las necesidades de la comunidad con formación profesional de Constructor Civil, programación de mantenciones preventivas y seguimiento de reparaciones. Al comparar cotizaciones, revisamos alcances, cantidades, exclusiones y condiciones de ejecución para apoyar decisiones fundamentadas del comité y controlar el cumplimiento de los trabajos contratados.
                            </p>
                          </div>
                        </div>

                        {/* Pilar 3: Personal, acuerdos y organización de la comunidad */}
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-md bg-[#0F3D2E] text-[#D4B895] font-black text-[10.5px] flex items-center justify-center shrink-0 mt-0.5">
                            3
                          </span>
                          <div>
                            <strong className="text-[#0F3D2E] block text-[11px]">
                              Personal, acuerdos y organización de la comunidad
                            </strong>
                            <p className="text-[10px] text-slate-600 leading-snug mt-0.5">
                              Gestión documental del personal, coordinación de turnos y seguimiento de obligaciones laborales y preventivas (Ley Karin y RIOHS). Apoyo en la preparación de asambleas, registro y ejecución de acuerdos y coordinación de proveedores, con responsables y plazos que permitan al comité conocer el avance de la gestión.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* BENEFICIOS 100% GRATUITOS: PLATAFORMA DIGITAL PARA LA COMUNIDAD + VISITA INICIAL */}
                      <div
                        className="p-2.5 rounded-xl bg-emerald-50/80 border-2 border-[#0F3D2E] space-y-1"
                        style={{ backgroundColor: '#f0fdf4', borderColor: '#0F3D2E' }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[9.5px] font-mono font-black uppercase tracking-wider text-[#0F3D2E]">
                            ★ VALOR Y BENEFICIOS 100% GRATUITOS PARA {proposalConfig.targetCondo?.trim() ? proposalConfig.targetCondo.toUpperCase() : 'SU COMUNIDAD'}
                          </span>
                          <span
                            className="text-[8.5px] font-bold px-2 py-0.5 rounded bg-[#0F3D2E] text-[#D4B895] shrink-0"
                            style={{ backgroundColor: '#0F3D2E', color: '#D4B895' }}
                          >
                            100% Gratuito e Incluido
                          </span>
                        </div>
                        <div className="space-y-1 text-[10px] text-slate-800 leading-snug">
                          <p>
                            <strong>• Plataforma Digital & App Móvil 100% Gratuita para la Comunidad:</strong> Toda la comunidad (copropietarios y residentes) y el Comité cuentan con acceso ilimitado a nuestra suite digital 24/7 para consultar gastos comunes, cartolas bancarias, respaldos de facturas, libro de reclamos y votaciones, <strong>sin costos de licencias ni cobros de software para el condominio</strong>.
                          </p>
                          <p>
                            <strong>• Reunión de Presentación y Visita Inicial Sin Costo ni Compromiso:</strong> Les propongo coordinar una visita inicial en terreno para conocer las instalaciones críticas (sala de bombas, tableros, cubiertas), dotación y prioridades del comité, y preparar una propuesta formal que precise las funciones asumidas, la modalidad de atención, los reportes, las prioridades de inicio y los honorarios.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECCIÓN INFERIOR ANCLADA AL FONDO (CANON ARANPRO): FIRMAS, SELLO Y FOOTER */}
                  <div className="mt-auto pt-3.5 space-y-2.5">
                    {/* Sello Oficial y Firma del Administrador (Estándar Oficial ARANPRO • Sello al lado de la firma) */}
                    <div className="pt-2 flex items-end justify-between gap-4 border-t border-slate-200">
                      {/* Lado Izquierdo: Sello Oficial con RUT Empresa y Canales Directos */}
                      <div className="flex items-center gap-3">
                        <AranproOfficialSeal
                          variant="integral"
                          size="sm"
                          companyRut={empresaForm.companyRut && !String(empresaForm.companyRut).includes('76.999.888') ? empresaForm.companyRut : ''}
                          rnacNumber=""
                          showCaption={true}
                        />
                        <div className="text-[9.5px] text-slate-600 border-l border-slate-200 pl-3 space-y-0.5">
                          <p>
                            <strong>Fono / WhatsApp:</strong> <span className="font-mono font-bold text-[#0F3D2E]">{empresaForm.phone || '+56 9 5811 8504'}</span>
                          </p>
                          <p>
                            <strong>Correo:</strong> <span className="font-mono">{empresaForm.email || 'contacto@aranpro.cl'}</span>
                          </p>
                          <p>
                            <strong>Sitio Web:</strong> <span className="font-mono text-[#0F3D2E] font-bold">{empresaForm.website || 'https://aranpro.cl'}</span>
                          </p>
                        </div>
                      </div>

                      {/* Lado Derecho: Firma Manuscrita sobre Línea + Datos Profesionales */}
                      <div className="text-center min-w-[240px]">
                        <div className="h-14 flex items-end justify-center pb-0.5 overflow-visible">
                          {signatureImage ? (
                            <img
                              src={signatureImage}
                              alt="Firma Administrador"
                              className="h-12 max-h-14 w-auto max-w-[230px] object-contain mx-auto"
                              style={{ transform: `scale(${signatureScale})`, transformOrigin: 'bottom center' }}
                            />
                          ) : (
                            <span className="text-xs text-slate-400 italic">Firma del Representante Legal</span>
                          )}
                        </div>
                        <div className="border-t-[1.5px] border-[#0F3D2E] pt-1">
                          <p className="font-black text-[11px] text-slate-900 leading-tight">{empresaForm.adminName}</p>
                          <p className="text-[9.5px] text-[#0F3D2E] font-bold leading-tight">
                            Constructor Civil • Administrador de Condominios
                          </p>
                          <p className="text-[9px] text-slate-600 font-mono">
                            RUT: {(empresaForm.adminRut && empresaForm.adminRut !== '14.882.140-K') ? empresaForm.adminRut : '16.012.871-2'} • Representante Legal ARANPRO
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Pie de Página Canónico Maestro */}
                    <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                      <div>ARANPRO Gestión Integral • {empresaForm.website || 'https://aranpro.cl'}</div>
                      <div className="font-bold text-[#0F3D2E]">Presentación Oficial para Comités de Administración • Ley N° 21.442 (Pág. 1 de 1)</div>
                      <div>La Serena, Chile</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* ==================== MODAL DE VISTA PREVIA DEL DOSSIER INTEGRAL DE LICITACIÓN (MULTI-PÁGINA) ==================== */}
      <div
        className={
          previewDossierModal
            ? 'fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto'
            : 'fixed top-0 left-0 w-[850px] -z-[9999] opacity-1 pointer-events-none'
        }
      >
        <div
          className={
            previewDossierModal
              ? 'bg-white rounded-3xl max-w-5xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 max-h-[94vh] flex flex-col relative'
              : 'w-[850px] bg-white'
          }
        >
          {previewDossierModal && (
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-2xl bg-[#0F3D2E] text-[#D4B895] flex items-center justify-center font-bold text-base shadow-sm">
                  📚
                </span>
                <div>
                  <h4 className="text-base font-black text-slate-900">
                    Dossier Integral de Postulación & Ficha Técnica Constructiva
                  </h4>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Documento Maestro de 3 Páginas • Especialidades Constructivas • Plan 30 Días • Suite Digital & Acreditaciones
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintDossier}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs shadow-md transition-all active:scale-95"
                >
                  <Printer className="w-4 h-4 text-[#D4B895]" />
                  Imprimir / Descargar Dossier PDF
                </button>
                <button
                  onClick={() => setPreviewDossierModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {previewDossierModal && (
            /* BARRA DE AJUSTE RÁPIDO DE DESTINATARIO DEL DOSSIER */
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs mb-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-slate-700">Condominio a Postular:</span>
                <input
                  type="text"
                  placeholder="Ej: Condominio Los Cerezos (o vacío)"
                  value={proposalConfig.targetCondo}
                  onChange={(e) => setProposalConfig({ ...proposalConfig, targetCondo: e.target.value })}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 text-xs w-48 sm:w-56 focus:outline-none focus:ring-1 focus:ring-[#0F3D2E]"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-slate-700">Dirigido a:</span>
                <input
                  type="text"
                  placeholder="Ej: Comité / Presidente / Directiva (o vacío)"
                  value={proposalConfig.leaveRecipientBlank ? '' : proposalConfig.targetRecipient}
                  disabled={proposalConfig.leaveRecipientBlank}
                  onChange={(e) => setProposalConfig({ ...proposalConfig, targetRecipient: e.target.value, leaveRecipientBlank: false })}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 text-xs w-56 sm:w-64 focus:outline-none focus:ring-1 focus:ring-[#0F3D2E]"
                />
                <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-600 select-none">
                  <input
                    type="checkbox"
                    checked={proposalConfig.leaveRecipientBlank}
                    onChange={(e) => setProposalConfig({ ...proposalConfig, leaveRecipientBlank: e.target.checked, targetRecipient: e.target.checked ? '' : 'Señores Miembros del Comité de Administración' })}
                    className="w-3.5 h-3.5 rounded text-[#0F3D2E]"
                  />
                  <span>En blanco</span>
                </label>
              </div>
              <AranproPdfStyleSelector value={pdfStyle} onChange={setPdfStyle} compact />
            </div>
          )}

          {/* CONTENEDOR DEL DOSSIER INTEGRAL IMPRIMIBLE */}
          <div className={previewDossierModal ? "overflow-y-auto flex-1 pr-1 space-y-6" : "w-[850px]"}>
            <div
              id="printable-full-dossier"
              data-pdf-style={pdfStyle}
              className="bg-slate-100 p-0 max-w-4xl mx-auto space-y-6 text-slate-900"
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
            >
              {/* ==================== PÁGINA 1: PORTADA & CARTA EJECUTIVA DE PRESENTACIÓN ==================== */}
              <div
                data-pdf-style={pdfStyle}
                className="dossier-page page-1 bg-white p-7 md:p-8 pl-9 md:pl-11 min-h-[1050px] flex flex-col justify-between text-slate-900 text-xs shadow-md mx-auto max-w-[850px] leading-relaxed relative overflow-hidden"
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              >
                {/* Filete doble izquierdo Alternativa 4 */}
                <div className="absolute left-0 top-0 bottom-0 w-2 flex pointer-events-none select-none z-10" aria-hidden="true">
                  <div className="w-[2.5px] h-full bg-[#0F3D2E]" />
                  <div className="w-[2px] h-full bg-transparent" />
                  <div className="w-[1px] h-full bg-[#D4B895]" />
                </div>

                {/* Sello de agua central sutil */}
                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 opacity-[0.035]"
                  aria-hidden="true"
                >
                  <img
                    src="/brand/ARANPRO_sello_circular_integral_transparente.png"
                    alt=""
                    className="w-[420px] h-[420px] object-contain"
                  />
                </div>

                <div className="space-y-3 relative z-10">
                  {/* Membrete Corporativo Maestro ARANPRO */}
                  <div className="flex items-center justify-between border-b-2 border-[#0F3D2E] pb-3">
                    <div className="flex items-center space-x-3.5">
                      <AranproLogo variant="principal" className="h-11 w-auto" />
                      <div className="space-y-0.5 border-l border-slate-300 pl-3.5">
                        <div className="text-xs font-black tracking-tight text-[#0F3D2E] uppercase">
                          {empresaForm.provisionalName || 'ARANPRO • GESTIÓN INTEGRAL DE CONDOMINIOS'}
                        </div>
                        <p className="text-[9.5px] text-slate-600 font-mono font-semibold">
                          {empresaForm.companyRut && !String(empresaForm.companyRut).includes('76.999.888') ? `RUT Empresa: ${empresaForm.companyRut} • ` : ''}{empresaForm.rnacNumber && empresaForm.rnacNumber !== '48.912' ? `RNAC MINVU N° ${empresaForm.rnacNumber}` : 'Ley N° 21.442 de Copropiedad Inmobiliaria'}
                        </p>
                        <p className="text-[9px] text-slate-500">
                          {empresaForm.email || 'contacto@aranpro.cl'} • {empresaForm.phone || '+56 9 5811 8504'} • {empresaForm.city || 'La Serena / Coquimbo, Chile'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right space-y-0.5 shrink-0">
                      <span className="inline-block px-2.5 py-0.5 bg-[#F5F4EF] border border-[#D4B895] text-[#0F3D2E] text-[9.5px] font-mono font-bold rounded-md">
                        DOSSIER OFICIAL EJECUTIVO
                      </span>
                      <p className="text-[10.5px] font-bold text-slate-800">
                        Propuesta Integral de Gestión & Auditoría Constructiva
                      </p>
                      <p className="text-[9.5px] text-slate-500 font-semibold">
                        {proposalConfig.targetCondo || 'Comunidad de Copropietarios'}
                      </p>
                    </div>
                  </div>

                  {/* Encabezado Formal Protocolar */}
                  <div className="text-[10.5px] text-slate-700 space-y-1 bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200">
                    <p>
                      <strong>Dirigido cordialmente a:</strong>{' '}
                      {proposalConfig.leaveRecipientBlank || !proposalConfig.targetRecipient?.trim() ? (
                        <span className="font-mono text-slate-400">__________________________________________________________________</span>
                      ) : (
                        <strong className="text-slate-900">{proposalConfig.targetRecipient}</strong>
                      )}
                    </p>
                    <p>
                      <strong>Condominio / Edificio:</strong>{' '}
                      {proposalConfig.targetCondo?.trim() ? (
                        <strong className="text-[#0F3D2E] uppercase">{proposalConfig.targetCondo}</strong>
                      ) : (
                        <span className="font-mono text-slate-400">__________________________________________________________</span>
                      )}
                    </p>
                    <p>
                      <strong>Presentado por:</strong> <strong className="text-slate-900">{empresaForm.adminName}</strong> — Constructor Civil • Administrador de Condominios (Ley N° 21.442)
                    </p>
                    <p>
                      <strong>Fecha y Lugar:</strong>{' '}
                      {proposalConfig.proposalDate
                        ? new Date(proposalConfig.proposalDate + 'T12:00:00').toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })
                        : new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })}
                      {proposalConfig.targetCity?.trim() ? ` • ${proposalConfig.targetCity}` : ` • ${empresaForm.city || 'La Serena'}`}
                    </p>
                    <p>
                      <strong>Materia:</strong> Postulación Integral a la Administración, Auditoría Constructiva y Custodia Patrimonial
                    </p>
                  </div>

                  {/* Título de la Propuesta */}
                  <div className="text-center py-1">
                    <h1 className="text-sm font-black text-[#0F3D2E] uppercase tracking-tight">
                      Dossier Integral de Gestión & Respaldo Técnico Constructivo
                    </h1>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                      Solvencia Técnica en Terreno • Transparencia Contable 24/7 • Cumplimiento Normativo Ley N° 21.442
                    </p>
                    <div className="w-20 h-0.5 bg-[#D4B895] mx-auto mt-1 rounded-full"></div>
                  </div>

                  {/* Carta Ejecutiva y Diagnóstico Argumentado */}
                  <div className="text-justify text-[10.5px] text-slate-800 leading-relaxed space-y-2">
                    <p>
                      {proposalConfig.leaveRecipientBlank || !proposalConfig.targetRecipient?.trim()
                        ? 'Estimados señores miembros del Comité de Administración y vecinos copropietarios:'
                        : `Estimados ${proposalConfig.targetRecipient}:`}
                    </p>
                    <p>
                      Junto con saludarles cordialmente y reconociendo el gran compromiso que dedican a su comunidad, me dirijo a ustedes para presentar formalmente los servicios de <strong>{empresaForm.provisionalName || 'ARANPRO Gestión Integral'}</strong> y postular a la administración profesional y custodia patrimonial de{' '}
                      {proposalConfig.targetCondo?.trim() ? (
                        <strong className="text-[#0F3D2E]">{proposalConfig.targetCondo}</strong>
                      ) : (
                        <strong>su comunidad</strong>
                      )}{' '}
                      bajo el marco de excelencia de la <strong>Ley N° 21.442 de Copropiedad Inmobiliaria</strong>.
                    </p>
                    <p>
                      Sabemos que la principal frustración de los comités de administración radica en la <strong>falta de presencia física en terreno</strong> de administraciones tradicionales de escritorio, el <strong>desconocimiento técnico</strong> para inspeccionar salas de bombas, cubiertas o tableros eléctricos, y la <strong>indefensión ante contratistas externos</strong> que cobran sobreprecios o inventan fallas que nadie sabe auditar.
                    </p>
                    <p>
                      Nuestra propuesta rompe definitivamente con ese paradigma: como <strong>Constructor Civil</strong>, asumo personalmente la supervisión técnica directa de la infraestructura del condominio, auditando cada mantención electromecánica, cubicando presupuestos de proveedores y evitando reparaciones innecesarias o sobrevaloradas. Complementamos este rigor en terreno con una <strong>Suite Digital Gratuita en la nube</strong> y aplicación móvil para residentes, garantizando que cada factura, cartola bancaria, comprobante de egreso y colilla legal quede a la vista de los copropietarios las 24 horas del día.
                    </p>
                  </div>

                  {/* Los 4 Pilares Estratégicos ARANPRO */}
                  <div className="pt-1">
                    <div className="text-center mb-1.5">
                      <span className="text-[9.5px] font-black uppercase text-[#0F3D2E] tracking-wider">
                        Los 4 Pilares Estratégicos de Nuestra Gestión Integral
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                        <div className="flex items-center gap-1.5 text-[#0F3D2E] font-black text-[10.5px]">
                          <span className="text-emerald-700">🏗️</span>
                          Supervisión Constructiva en Terreno
                        </div>
                        <p className="text-slate-600 text-[9px] leading-snug">
                          Inspección periódica directa a salas de bombas, techumbres, impermeabilizaciones y tableros con criterio de Constructor Civil.
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                        <div className="flex items-center gap-1.5 text-[#0F3D2E] font-black text-[10.5px]">
                          <span className="text-emerald-700">💎</span>
                          Transparencia Contable Total 24/7
                        </div>
                        <p className="text-slate-600 text-[9px] leading-snug">
                          Conciliación bancaria diaria, respaldos digitalizados de cada factura y rendición mensual de cuentas documentada ante el Comité.
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                        <div className="flex items-center gap-1.5 text-[#0F3D2E] font-black text-[10.5px]">
                          <span className="text-emerald-700">📐</span>
                          Cubicación & Control de Contratistas
                        </div>
                        <p className="text-slate-600 text-[9px] leading-snug">
                          Elaboración de bases técnicas y revisión de cotizaciones ítem por ítem, frenando sobrecostos en pinturas, pavimentos y mantenciones.
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                        <div className="flex items-center gap-1.5 text-[#0F3D2E] font-black text-[10.5px]">
                          <span className="text-emerald-700">⚖️</span>
                          Régimen Laboral & Ley N° 21.442
                        </div>
                        <p className="text-slate-600 text-[9px] leading-snug">
                          Cumplimiento estricto de protocolos Ley Karin, contratos de conserjería, pagos F30-1 y pólizas de seguro colectivo (Art. 43°).
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Resumen de Respaldo y Acreditación en Cifras */}
                  <div className="pt-0.5">
                    <div className="grid grid-cols-4 gap-1.5 text-center">
                      <div className="p-1.5 bg-[#F5F4EF] rounded-xl border border-[#D4B895]/60">
                        <span className="text-[8px] font-bold text-slate-500 uppercase block">Especialidad</span>
                        <strong className="text-[10.5px] font-black text-[#0F3D2E]">Construcción Civil</strong>
                      </div>
                      <div className="p-1.5 bg-[#F5F4EF] rounded-xl border border-[#D4B895]/60">
                        <span className="text-[8px] font-bold text-slate-500 uppercase block">Acreditación Oficial</span>
                        <strong className="text-[10.5px] font-black text-[#0F3D2E]">{empresaForm.rnacNumber && empresaForm.rnacNumber !== '48.912' ? `RNAC N° ${empresaForm.rnacNumber}` : 'Ley N° 21.442'}</strong>
                      </div>
                      <div className="p-1.5 bg-[#F5F4EF] rounded-xl border border-[#D4B895]/60">
                        <span className="text-[8px] font-bold text-slate-500 uppercase block">Experiencia & Cartera</span>
                        <strong className="text-[10.5px] font-black text-[#0F3D2E]">{portfolioStats.totalComms} Condominio(s) Base</strong>
                      </div>
                      <div className="p-1.5 bg-[#F5F4EF] rounded-xl border border-[#D4B895]/60">
                        <span className="text-[8px] font-bold text-slate-500 uppercase block">Régimen en Terreno</span>
                        <strong className="text-[10.5px] font-black text-[#0F3D2E]">Semanal + 24/7</strong>
                      </div>
                    </div>
                  </div>

                  {/* POLÍTICA DE HONORARIOS DE TRANSICIÓN: CONTINUIDAD PRESUPUESTARIA & EVALUACIÓN TRIMESTRAL */}
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-[#F5F4EF] via-white to-[#F5F4EF] border-2 border-[#0F3D2E]/25 space-y-2 text-xs shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-[#0F3D2E]/15 pb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-[#0F3D2E] text-[#D4B895] font-mono font-bold text-[9px] uppercase tracking-wider">
                          Garantía de Continuidad Presupuestaria
                        </span>
                        <span className="font-black text-[#0F3D2E] text-[10.5px] uppercase tracking-tight">
                          Política de Honorarios & Período de Transición (Primeros 3 Meses)
                        </span>
                      </div>
                      <span className="font-mono font-bold text-[9px] text-[#0F3D2E] bg-white border border-[#D4B895] px-2 py-0.5 rounded-md shadow-2xs">
                        Sin Incremento Inicial en Gasto Común
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 py-0.5">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 text-[#0F3D2E] font-bold text-[10px]">
                            <span className="w-4 h-4 rounded-full bg-[#0F3D2E] text-[#D4B895] inline-flex items-center justify-center text-[9px] font-black">1</span>
                            Homologación Inmediata
                          </div>
                          <p className="text-[9px] text-slate-600 leading-snug mt-1">
                            Durante los <strong>primeros 3 meses</strong>, ARANPRO se <strong>ajusta y homologa al valor exacto</strong> que la comunidad cancela a su administración actual. Cero sobrecosto presupuestario en la etapa de traspaso.
                          </p>
                        </div>
                        <span className="mt-2 text-[8px] font-mono font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded text-center block">
                          Meses 1, 2 y 3: Mismo Valor Vigente
                        </span>
                      </div>

                      <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 text-[#0F3D2E] font-bold text-[10px]">
                            <span className="w-4 h-4 rounded-full bg-[#0F3D2E] text-[#D4B895] inline-flex items-center justify-center text-[9px] font-black">2</span>
                            Auditoría & Diagnóstico Real
                          </div>
                          <p className="text-[9px] text-slate-600 leading-snug mt-1">
                            Levantamiento técnico exhaustivo por Constructor Civil: revisión de salas de bombas, techumbres, contratos de proveedores, regularización laboral y saneamiento contable de vicios ocultos.
                          </p>
                        </div>
                        <span className="mt-2 text-[8px] font-mono font-bold text-[#0F3D2E] bg-[#F5F4EF] px-1.5 py-0.5 rounded text-center block">
                          Auditoría Técnica en Terreno
                        </span>
                      </div>

                      <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 text-[#0F3D2E] font-bold text-[10px]">
                            <span className="w-4 h-4 rounded-full bg-[#0F3D2E] text-[#D4B895] inline-flex items-center justify-center text-[9px] font-black">3</span>
                            Propuesta Definitiva al 3er Mes
                          </div>
                          <p className="text-[9px] text-slate-600 leading-snug mt-1">
                            Con la realidad operativa auditada y demostrando ahorros tangibles conseguidos, se presenta al Comité un <strong>informe formal de gestión y el honorario definitivo</strong> basado en hechos y trabajo comprobado.
                          </p>
                        </div>
                        <span className="mt-2 text-[8px] font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-center block">
                          Acuerdo Bilateral Transparente
                        </span>
                      </div>
                    </div>

                    <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl px-3 py-1.5 flex flex-wrap items-center justify-between text-[9px] text-emerald-950 gap-2">
                      <span className="leading-snug">
                        <strong>Beneficios incluidos desde el Día 1 sin costo:</strong> Suite Web & App Móvil ARANPRO 24/7 para el 100% de residentes, visitas presenciales en terreno semanales, línea prioritaria de emergencias 24/7 y auditoría de traspaso.
                      </span>
                      <span className="font-mono font-bold text-[8.5px] text-[#0F3D2E] bg-white px-2 py-0.5 rounded border border-[#D4B895] shrink-0">
                        {proposalConfig.taxModality || 'Factura Exenta / Boleta'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pie de Página Institucional Página 1 */}
                <div className="mt-auto pt-3 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-400 font-mono relative z-10">
                  <div>ARANPRO Gestión Integral • {empresaForm.website || 'https://aranpro.cl'}</div>
                  <div className="font-bold text-[#0F3D2E]">Página 1 de 3 • Carta de Presentación Oficial • Ley N° 21.442</div>
                  <div>Fono Directo: {empresaForm.phone || '+56 9 5811 8504'}</div>
                </div>
              </div>

              {/* ==================== PÁGINA 2: FICHA TÉCNICA CONSTRUCTIVA & PLAN DE TRASPASO 30 DÍAS ==================== */}
              <div
                data-pdf-style={pdfStyle}
                className="dossier-page page-2 bg-white p-7 md:p-8 pl-9 md:pl-11 min-h-[1050px] flex flex-col justify-between text-slate-900 text-xs shadow-md mx-auto max-w-[850px] leading-relaxed relative overflow-hidden"
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              >
                {/* Filete doble izquierdo Alternativa 4 */}
                <div className="absolute left-0 top-0 bottom-0 w-2 flex pointer-events-none select-none z-10" aria-hidden="true">
                  <div className="w-[2.5px] h-full bg-[#0F3D2E]" />
                  <div className="w-[2px] h-full bg-transparent" />
                  <div className="w-[1px] h-full bg-[#D4B895]" />
                </div>

                {/* Sello de agua central sutil */}
                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 opacity-[0.035]"
                  aria-hidden="true"
                >
                  <img
                    src="/brand/ARANPRO_sello_circular_integral_transparente.png"
                    alt=""
                    className="w-[420px] h-[420px] object-contain"
                  />
                </div>

                <div className="space-y-3 relative z-10">
                  {/* Membrete de Continuidad ARANPRO */}
                  <div className="flex items-center justify-between border-b-2 border-[#0F3D2E] pb-2.5">
                    <div className="flex items-center space-x-3">
                      <AranproLogo variant="principal" className="h-10 w-auto" />
                      <div className="border-l border-slate-300 pl-3">
                        <span className="text-xs font-black text-[#0F3D2E] tracking-tight uppercase block leading-none">
                          {empresaForm.provisionalName || 'ARANPRO • GESTIÓN INTEGRAL DE CONDOMINIOS'}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono">
                          Auditoría Constructiva, Supervisión Electromecánica y Gestión de Activos • Ley N° 21.442
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[9.5px] font-mono font-bold text-[#0F3D2E] bg-[#F5F4EF] border border-[#D4B895] px-2.5 py-0.5 rounded whitespace-nowrap inline-block">
                        SECCIÓN TÉCNICA EN TERRENO • PÁG. 2 DE 3
                      </span>
                    </div>
                  </div>

                  {/* Título Sección 1 */}
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-[#0F3D2E] text-[#D4B895] rounded-md font-black text-[10.5px] flex items-center justify-center shrink-0">
                      1
                    </div>
                    <div>
                      <h2 className="font-black text-[11px] uppercase text-[#0F3D2E] tracking-tight leading-tight">
                        Ficha Técnica Constructiva: Auditoría en Terreno & Prevención Patrimonial
                      </h2>
                      <p className="text-[9.5px] text-slate-500 leading-tight">
                        El valor diferencial de la formación como Constructor Civil aplicado a la vida diaria del condominio
                      </p>
                    </div>
                  </div>

                  {/* Grid de 4 Especialidades Constructivas Detalladas */}
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="flex items-center gap-1.5 text-[#0F3D2E] font-black text-[10.5px]">
                        <span className="text-emerald-700">✓</span>
                        Salas de Bombas, Hidroneumáticos & Matrices
                      </div>
                      <p className="text-slate-600 text-[9.5px] leading-relaxed">
                        Inspección periódica de presiones de impulsión manométrica, estanques de acumulación, tableros de alternancia, sellos mecánicos, estanques de expansión y válvulas check. Eliminación de intermediarios y diagnósticos falsos de empresas externas.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="flex items-center gap-1.5 text-[#0F3D2E] font-black text-[10.5px]">
                        <span className="text-emerald-700">✓</span>
                        Cubiertas, Techumbres y Detección de Filtraciones
                      </div>
                      <p className="text-slate-600 text-[9.5px] leading-relaxed">
                        Inspección técnica de mantos asfálticos, bajadas de aguas lluvia, juntas de dilatación estructural, sellos perimetrales y hojalaterías. Detección precoz del origen exacto de la humedad antes de que cause daños estructurales o inhabitabilidad.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="flex items-center gap-1.5 text-[#0F3D2E] font-black text-[10.5px]">
                        <span className="text-emerald-700">✓</span>
                        Seguridad Eléctrica, Grupo Electrógeno & Incendio
                      </div>
                      <p className="text-slate-600 text-[9.5px] leading-relaxed">
                        Fiscalización de tableros TGBT certificados bajo normativa SEC, pruebas periódicas de transferencia automática del generador con carga real, presurización de cajas de escalas, redes húmedas/secas y vigencia de extintores (D.S. N° 594).
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="flex items-center gap-1.5 text-[#0F3D2E] font-black text-[10.5px]">
                        <span className="text-emerald-700">✓</span>
                        Cubicación, Licitaciones & Control de Contratistas
                      </div>
                      <p className="text-slate-600 text-[9.5px] leading-relaxed">
                        Confección de especificaciones técnicas objetivas antes de licitar. Revisión exhaustiva de cubicaciones de presupuestos externos para evitar sobreprecios en pinturas de fachadas, pavimentos o ascensores. Recepción conforme antes de autorizar pagos.
                      </p>
                    </div>
                  </div>

                  {/* Plan Maestro de Implementación (Primeros 30 Días) */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                      <h4 className="text-[11px] font-black text-[#0F3D2E] uppercase tracking-wide">
                        Plan Maestro de Traspaso & Despliegue Inicial (Primeros 30 Días)
                      </h4>
                      <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Sin Costo Adicional para la Comunidad
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-start gap-3 shadow-xs">
                        <span className="px-2 py-1 bg-[#0F3D2E] text-[#D4B895] rounded-md font-mono font-bold text-[9.5px] shrink-0">
                          DÍAS 1 - 10
                        </span>
                        <div>
                          <strong className="text-slate-900 block text-[10.5px]">Auditoría Contable de Traspaso, Conciliación Bancaria y Legal</strong>
                          <p className="text-slate-600 text-[9.5px] leading-snug mt-0.5">
                            Recepción formal de cuentas bancarias y libros contables. Arqueo del Fondo de Reserva Legal (Art. 39° Ley N° 21.442), conciliación de nómina de copropietarios y estado de cobranza, revisión de pólizas de seguro colectivo de incendio (Art. 43°) y actualización de firmas bancarias.
                          </p>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-start gap-3 shadow-xs">
                        <span className="px-2 py-1 bg-[#0F3D2E] text-[#D4B895] rounded-md font-mono font-bold text-[9.5px] shrink-0">
                          DÍAS 11 - 20
                        </span>
                        <div>
                          <strong className="text-slate-900 block text-[10.5px]">Levantamiento Técnico de Infraestructura & Auditoría Laboral</strong>
                          <p className="text-slate-600 text-[9.5px] leading-snug mt-0.5">
                            Inspección técnica exhaustiva en terreno de salas de máquinas, bombas, calderas, techumbres y áreas comunes. Revisión de carpetas del personal de conserjería: contratos de trabajo, cumplimiento Ley Karin, libro de asistencia digital y certificados de cotizaciones previsionales F30-1.
                          </p>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-start gap-3 shadow-xs">
                        <span className="px-2 py-1 bg-[#0F3D2E] text-[#D4B895] rounded-md font-mono font-bold text-[9.5px] shrink-0">
                          DÍAS 21 - 30
                        </span>
                        <div>
                          <strong className="text-slate-900 block text-[10.5px]">Habilitación de la Suite Digital & Primera Rendición al Comité</strong>
                          <p className="text-slate-600 text-[9.5px] leading-snug mt-0.5">
                            Carga de la comunidad en la Suite ARANPRO y entrega de accesos a la App móvil para el 100% de los residentes. Habilitación del Libro Digital de Reclamos y Sugerencias foliado (Art. 20°) y entrega formal del Informe de Diagnóstico Técnico Inicial con prioridades y presupuesto preventivo.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recuadro de Compromiso de Régimen en Terreno & Emergencias */}
                  <div className="p-3 rounded-xl bg-gradient-to-r from-[#0F3D2E]/10 via-[#0F3D2E]/5 to-transparent border-l-4 border-[#0F3D2E] text-xs space-y-1">
                    <strong className="text-[#0F3D2E] block text-[10.5px]">Compromiso Operativo: Régimen en Terreno & Atención de Urgencias 24/7</strong>
                    <div className="grid grid-cols-2 gap-2 text-[9.5px] text-slate-700 pt-0.5">
                      <div>
                        <strong>• Visitas Presenciales Semanales:</strong> Inspección en terreno con registro obligatorio en bitácora de conserjería, fiscalización de aseo y mantenimiento preventivo.
                      </div>
                      <div>
                        <strong>• Canal Prioritario WhatsApp 24/7:</strong> Atención directa e inmediata con el Administrador titular ante cortes de agua, fallas eléctricas o emergencias críticas.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pie de Página Institucional Página 2 */}
                <div className="mt-auto pt-3 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-400 font-mono relative z-10">
                  <div>ARANPRO Gestión Integral • {empresaForm.website || 'https://aranpro.cl'}</div>
                  <div className="font-bold text-[#0F3D2E]">Página 2 de 3 • Ficha Técnica & Plan Maestro de Despliegue</div>
                  <div>Fono Directo: {empresaForm.phone || '+56 9 5811 8504'}</div>
                </div>
              </div>

              {/* ==================== PÁGINA 3: SUITE DIGITAL GRATUITA, ACREDITACIONES, REFERENCIAS & FIRMA ==================== */}
              <div
                data-pdf-style={pdfStyle}
                className="dossier-page page-3 bg-white p-7 md:p-8 pl-9 md:pl-11 min-h-[1050px] flex flex-col justify-between text-slate-900 text-xs shadow-md mx-auto max-w-[850px] leading-relaxed relative overflow-hidden"
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              >
                {/* Filete doble izquierdo Alternativa 4 */}
                <div className="absolute left-0 top-0 bottom-0 w-2 flex pointer-events-none select-none z-10" aria-hidden="true">
                  <div className="w-[2.5px] h-full bg-[#0F3D2E]" />
                  <div className="w-[2px] h-full bg-transparent" />
                  <div className="w-[1px] h-full bg-[#D4B895]" />
                </div>

                {/* Sello de agua central sutil */}
                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 opacity-[0.035]"
                  aria-hidden="true"
                >
                  <img
                    src="/brand/ARANPRO_sello_circular_integral_transparente.png"
                    alt=""
                    className="w-[420px] h-[420px] object-contain"
                  />
                </div>

                <div className="space-y-2.5 relative z-10">
                  {/* Membrete de Continuidad ARANPRO */}
                  <div className="flex items-center justify-between border-b-2 border-[#0F3D2E] pb-2">
                    <div className="flex items-center space-x-3">
                      <AranproLogo variant="principal" className="h-9 w-auto" />
                      <div className="border-l border-slate-300 pl-3">
                        <span className="text-xs font-black text-[#0F3D2E] tracking-tight uppercase block leading-none">
                          {empresaForm.provisionalName || 'ARANPRO • GESTIÓN INTEGRAL'}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono">
                          Acreditación Profesional, Ecosistema Digital y Testimonios de Comités • Ley N° 21.442
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[9.5px] font-mono font-bold text-[#0F3D2E] bg-[#F5F4EF] border border-[#D4B895] px-2.5 py-0.5 rounded whitespace-nowrap inline-block">
                        ACREDITACIÓN & FIRMA • PÁG. 3 DE 3
                      </span>
                    </div>
                  </div>

                  {/* SECCIÓN 2: ECOSISTEMA TECNOLÓGICO ARANPRO */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-[#0F3D2E] text-[#D4B895] rounded-md font-black text-[10.5px] flex items-center justify-center shrink-0">
                          2
                        </div>
                        <div>
                          <h2 className="font-black text-[11px] uppercase text-[#0F3D2E] tracking-tight leading-tight">
                            Ecosistema Tecnológico ARANPRO: Transparencia Total sin Costo de Software
                          </h2>
                          <p className="text-[9px] text-slate-500 leading-tight">
                            Ahorro anual directo de $500.000 a $1.200.000 para el condominio al no pagar licencias externas
                          </p>
                        </div>
                      </div>
                      <span className="text-[8.5px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        100% Incluido
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                        <strong className="text-[#0F3D2E] text-[10px] block font-bold">📲 Portal Web & App Móvil</strong>
                        <p className="text-[9px] text-slate-600 leading-snug">
                          Avisos de cobro descargables, pago de gastos comunes en línea, reserva de quinchos/salas y asambleas digitales.
                        </p>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                        <strong className="text-[#0F3D2E] text-[10px] block font-bold">🛡️ Módulo Comité 24/7</strong>
                        <p className="text-[9px] text-slate-600 leading-snug">
                          Auditoría libre de cartolas bancarias, respaldos digitales de cada egreso y aprobación de pagos a proveedores en un clic.
                        </p>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                        <strong className="text-[#0F3D2E] text-[10px] block font-bold">📖 Libro Digital Foliado</strong>
                        <p className="text-[9px] text-slate-600 leading-snug">
                          Registro inalterable de reclamos y sugerencias según Art. 20° Ley N° 21.442, con trazabilidad y plazos garantizados.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* SECCIÓN 3: FORMACIÓN TÉCNICA, CERTIFICACIONES PROFESIONALES Y CAPACITACIONES ACREDITADAS */}
                  <div className="space-y-1.5 pt-0.5">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-[#0F3D2E] text-[#D4B895] rounded-md font-black text-[10.5px] flex items-center justify-center shrink-0">
                        3
                      </div>
                      <div>
                        <h2 className="font-black text-[11px] uppercase text-[#0F3D2E] tracking-tight leading-tight">
                          Formación Técnica, Certificaciones Profesionales y Capacitaciones Acreditadas
                        </h2>
                        <p className="text-[9px] text-slate-500 leading-tight">
                          Respaldos académicos y certificaciones de especialidad del Administrador Titular ({empresaForm.adminName})
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      {academicRecords
                        .filter(r => {
                          if (r.includeInProposal === false) return false;
                          const txt = `${r.title || ''} ${r.status || ''} ${r.fileName || ''}`.toLowerCase();
                          return !txt.includes('alumno regular') && !txt.includes('en curso') && !txt.includes('estudios');
                        })
                        .slice(0, 3)
                        .map(item => (
                          <div key={item.id} className="p-1.5 rounded-lg border border-slate-300 bg-slate-50/80 space-y-0.5 text-xs">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-black text-slate-900 text-[10.5px] leading-tight">{item.title}</span>
                              <span className="px-2 py-0.5 rounded text-[8.5px] font-bold bg-[#0F3D2E] text-[#D4B895] shrink-0 whitespace-nowrap">
                                {item.status}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-x-2 text-[9px] text-slate-500">
                              <span>Institución: <strong className="text-slate-700">{item.institution}</strong> • Periodo: <strong className="text-slate-700">{item.year}</strong></span>
                              <span className="text-[8px] text-emerald-800 font-mono font-bold">
                                ✓ Folio Acreditado: {item.fileName || 'Diploma_Acreditado.pdf'}
                              </span>
                            </div>
                            <p className="text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 text-[9px] leading-snug">
                              <strong>Aporte Técnico a la Comunidad:</strong> {item.relevance}
                            </p>
                          </div>
                        ))}
                    </div>

                    {/* Índice de Documentos Legales y Técnicos Acreditados en Carpeta */}
                    <div className="pt-0.5 space-y-1">
                      <span className="text-[9px] font-black uppercase text-[#0F3D2E] block">
                        Certificados Legales, Tributarios y de Especialidad Técnica en Carpeta Oficial:
                      </span>
                      <div className="grid grid-cols-2 gap-1 text-[9px]">
                        {accreditationDocs
                          .filter(d => {
                            if (d.includeInDossier === false) return false;
                            const txt = `${d.name || ''} ${d.folio || ''} ${d.notes || ''}`.toLowerCase();
                            return !txt.includes('alumno regular') && !txt.includes('en curso');
                          })
                          .slice(0, 6)
                          .map((doc, idx) => (
                            <div key={doc.id} className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-between gap-1.5">
                              <div className="min-w-0">
                                <strong className="text-slate-900 block leading-tight truncate text-[9.5px]">
                                  Anexo {idx + 1}: {doc.name}
                                </strong>
                                <span className="text-[8px] text-slate-500 block truncate">
                                  {doc.issuer || 'Institución Oficial'} {doc.folio ? `• ${doc.folio}` : ''}
                                </span>
                              </div>
                              <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold text-[8px] shrink-0 whitespace-nowrap">
                                ✓ Vigente
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>

                  {/* SECCIÓN 4: REFERENCIAS DE COMITÉS */}
                  <div className="space-y-1 pt-0.5">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-[#0F3D2E] text-[#D4B895] rounded-md font-black text-[10.5px] flex items-center justify-center shrink-0">
                        4
                      </div>
                      <div>
                        <h2 className="font-black text-[11px] uppercase text-[#0F3D2E] tracking-tight leading-tight">
                          Referencias Comprobables de Comités de Administración
                        </h2>
                        <p className="text-[9px] text-slate-500 leading-tight">
                          Testimonios directos de dirigentes comunitarios que avalan nuestra gestión
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 text-xs">
                      {committeeReferences.map(ref => (
                        <div key={ref.id} className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-black text-slate-900 text-[10px]">{ref.contactName}</span>
                            <span className="text-[8.5px] font-bold text-[#0F3D2E] text-right">{ref.role} • {ref.communityName}</span>
                          </div>
                          <p className="text-slate-500 text-[8px] font-mono">Fono Contacto: {ref.phone}</p>
                          <blockquote className="text-slate-700 italic bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[8.5px] leading-snug">
                            "{ref.quote}"
                          </blockquote>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* SECCIÓN DE SELLO CIRCULAR DORADO + FIRMA Y FOOTER ANCLADOS AL PIE */}
                <div className="mt-auto pt-2 space-y-2 relative z-10">
                  <div className="pt-2 border-t border-slate-200 flex items-end justify-between gap-4">
                    <AranproOfficialSeal
                      size="sm"
                      companyRut={empresaForm.companyRut && !String(empresaForm.companyRut).includes('76.999.888') ? empresaForm.companyRut : ''}
                      rnacNumber=""
                      showCaption={true}
                    />
                    <div className="text-center space-y-0.5 min-w-[240px]">
                      <div className="h-14 flex items-end justify-center pb-0.5 overflow-visible">
                        {signatureImage ? (
                          <img
                            src={signatureImage}
                            alt="Firma Administrador"
                            className="h-12 max-h-14 w-auto max-w-[240px] object-contain mx-auto"
                            style={{ transform: `scale(${signatureScale})`, transformOrigin: 'bottom center' }}
                          />
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Firma del Representante Legal</span>
                        )}
                      </div>
                      <div className="border-t-[1.5px] border-slate-800 pt-1">
                        <p className="font-black text-[11px] text-slate-900 leading-tight">{empresaForm.adminName}</p>
                        <p className="text-[9px] text-[#0F3D2E] font-bold leading-tight">
                          Constructor Civil • Administrador de Condominios
                        </p>
                        <p className="text-[9px] text-slate-600 font-mono">
                          RUT: {(empresaForm.adminRut && empresaForm.adminRut !== '14.882.140-K') ? empresaForm.adminRut : '16.012.871-2'} • Ley N° 21.442
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Pie de Página Institucional Página 3 */}
                  <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                    <div>ARANPRO Gestión Integral • {empresaForm.website || 'https://aranpro.cl'}</div>
                    <div className="font-bold text-[#0F3D2E]">Página 3 de 3 • Acreditaciones, Referencias y Firma Notarial Oficial</div>
                    <div>{empresaForm.city || 'La Serena / Coquimbo, Chile'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== MODAL PARA AGREGAR / EDITAR REFERENCIA DE COMITÉ ==================== */}
      {showRefModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-sm text-slate-900">
                  {editingRefId ? 'Editar Referencia de Comité' : 'Nueva Referencia Comprobable de Comité'}
                </h3>
                <p className="text-xs text-slate-500">
                  Testimonio y contacto verificable para incluir en tu Dossier de Postulación.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRefModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRef} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block font-bold text-slate-700 uppercase">Nombre del Dirigente / Contacto *</label>
                <input
                  type="text"
                  required
                  value={refForm.contactName}
                  onChange={(e) => setRefForm({ ...refForm, contactName: e.target.value })}
                  placeholder="Ej: Carlos Morales Rojas"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 uppercase">Cargo en el Comité</label>
                  <input
                    type="text"
                    value={refForm.role}
                    onChange={(e) => setRefForm({ ...refForm, role: e.target.value })}
                    placeholder="Ej: Presidente del Comité"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 uppercase">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    value={refForm.phone}
                    onChange={(e) => setRefForm({ ...refForm, phone: e.target.value })}
                    placeholder="+56988776655"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700 uppercase">Condominio / Comunidad *</label>
                <input
                  type="text"
                  required
                  value={refForm.communityName}
                  onChange={(e) => setRefForm({ ...refForm, communityName: e.target.value })}
                  placeholder="Ej: Condominio Los Cerezos"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700 uppercase">Testimonio / Extracto de Recomendación</label>
                <textarea
                  rows={3}
                  value={refForm.quote}
                  onChange={(e) => setRefForm({ ...refForm, quote: e.target.value })}
                  placeholder="Describe brevemente el resultado o conformidad del Comité..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                />
              </div>

              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={refForm.confirmed}
                  onChange={(e) => setRefForm({ ...refForm, confirmed: e.target.checked })}
                  className="w-4 h-4 rounded text-[#0F3D2E]"
                />
                <span className="font-bold text-[#0F3D2E]">
                  Contacto autorizado para recibir llamadas de otros comités evaluadores
                </span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRefModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold shadow-sm"
                >
                  Guardar Referencia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL PARA SUBIR / EDITAR DIPLOMA O CURSO ==================== */}
      {showUploadDiplomaModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 space-y-6 animate-in fade-in max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-[#0F3D2E] text-[#D4B895]">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    {editingDiplomaId ? 'Editar Diploma o Certificado' : 'Agregar Título Profesional o Diploma'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Acredita tu profesión, títulos universitarios/técnicos y certificaciones para la gestión y licitaciones de condominios.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadDiplomaModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDiploma} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Nombre del Título / Carrera / Certificación *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Constructor Civil, Contador Auditor, Ingeniero Comercial, Curso Ley 21.442"
                  value={newDiplomaForm.title}
                  onChange={(e) => setNewDiplomaForm({ ...newDiplomaForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Institución Otorgante / Universidad *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Universidad, Instituto Profesional, Sence, Learning Group"
                    value={newDiplomaForm.institution}
                    onChange={(e) => setNewDiplomaForm({ ...newDiplomaForm, institution: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Categoría del Documento
                  </label>
                  <select
                    value={newDiplomaForm.category}
                    onChange={(e) => setNewDiplomaForm({ ...newDiplomaForm, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                  >
                    <option value="Título Profesional Universitario">Título Profesional Universitario</option>
                    <option value="Título Técnico Profesional">Título Técnico Profesional</option>
                    <option value="Formación Superior / Universitaria">Formación Superior / Universitaria</option>
                    <option value="Posgrado / Diplomado / Magíster">Posgrado / Diplomado / Magíster</option>
                    <option value="Certificación Minvu Ley 21.442">Certificación Minvu Ley 21.442</option>
                    <option value="Auditoría, Contabilidad & Finanzas">Auditoría, Contabilidad & Finanzas</option>
                    <option value="Curso de Especialización Técnica">Curso de Especialización Técnica</option>
                    <option value="Prevención y Seguridad Edilicia">Prevención y Seguridad Edilicia</option>
                    <option value="Otra Acreditación / Curso">Otra Acreditación / Curso</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Estado de Avance
                  </label>
                  <select
                    value={newDiplomaForm.status}
                    onChange={(e) => setNewDiplomaForm({ ...newDiplomaForm, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                  >
                    <option value="Titulado">Titulado</option>
                    <option value="En curso (Nivel Superior)">En curso (Nivel Superior)</option>
                    <option value="Aprobado y Certificado">Aprobado y Certificado</option>
                    <option value="Egresado">Egresado</option>
                    <option value="Vigente">Vigente</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Año / Periodo
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: 2018 o 2024 - Presente"
                    value={newDiplomaForm.year}
                    onChange={(e) => setNewDiplomaForm({ ...newDiplomaForm, year: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Aporte Técnico para la Administración de Condominios
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe cómo este conocimiento técnico beneficia a la comunidad (ej: detección de filtraciones, auditoría de salas de bombas, inspección de cubiertas, supervisión de contratistas sin sobreprecios)..."
                  value={newDiplomaForm.relevance}
                  onChange={(e) => setNewDiplomaForm({ ...newDiplomaForm, relevance: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                />
              </div>

              {/* CARGA DE ARCHIVO DIGITAL (PDF / IMAGEN) */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Archivo de Respaldo Digital (PDF o Imagen)
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <label className="cursor-pointer px-4 py-2 bg-white hover:bg-slate-100 text-[#0F3D2E] border border-slate-300 rounded-xl font-bold text-xs transition-all flex items-center gap-2 shadow-xs shrink-0">
                    <FileUp className="w-4 h-4 text-[#0F3D2E]" />
                    <span>Seleccionar Archivo (PDF / JPG / PNG)</span>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={handleDiplomaFileChange}
                      className="hidden"
                    />
                  </label>

                  <div className="text-xs text-slate-500 font-mono truncate">
                    {newDiplomaForm.fileName ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        {newDiplomaForm.fileName} ({newDiplomaForm.fileSize})
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Ningún archivo nuevo seleccionado</span>
                    )}
                  </div>
                </div>
              </div>

              {/* TOGGLE DOSSIER */}
              <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={newDiplomaForm.includeInProposal}
                  onChange={(e) => setNewDiplomaForm({ ...newDiplomaForm, includeInProposal: e.target.checked })}
                  className="w-4 h-4 rounded text-[#0F3D2E] focus:ring-[#0F3D2E] border-slate-300"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Incluir automáticamente este diploma en el Dossier de Postulación a Licitaciones
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Aparecerá en el anexo técnico del PDF para comités y asambleas.
                  </span>
                </div>
              </label>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadDiplomaModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 text-[#D4B895]" />
                  <span>{editingDiplomaId ? 'Guardar Cambios' : 'Registrar y Custodiar Diploma'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL DE PREVISUALIZACIÓN DE DIPLOMA / CERTIFICADO ==================== */}
      {activeDiplomaPreview && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col relative space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-[#0F3D2E] text-[#D4B895]">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    {activeDiplomaPreview.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {activeDiplomaPreview.institution} • {activeDiplomaPreview.year} • {activeDiplomaPreview.status}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadDiplomaFile(activeDiplomaPreview)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs shadow-xs transition-all active:scale-95"
                >
                  <Download className="w-4 h-4 text-[#D4B895]" />
                  Descargar Archivo de Respaldo
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDiplomaPreview(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* CONTENEDOR DEL DOCUMENTO */}
            <div className="overflow-y-auto flex-1 pr-1 flex items-center justify-center min-h-[350px]">
              {activeDiplomaPreview.fileData ? (
                activeDiplomaPreview.fileType === 'application/pdf' ? (
                  <iframe
                    src={activeDiplomaPreview.fileData}
                    className="w-full h-[65vh] rounded-2xl border border-slate-200"
                    title="Visor de Diploma PDF"
                  />
                ) : (
                  <img
                    src={activeDiplomaPreview.fileData}
                    alt={activeDiplomaPreview.title}
                    className="max-h-[65vh] max-w-full object-contain rounded-2xl border border-slate-200 shadow-sm"
                  />
                )
              ) : (
                /* CREDENCIAL OFICIAL DE ACREDITACIÓN DIGITAL SI NO HAY ARCHIVO BINARIO AÚN */
                <div
                  id="diploma-certificate-preview-card"
                  className="w-full max-w-2xl bg-gradient-to-b from-white via-slate-50 to-white p-8 md:p-10 rounded-3xl border-4 border-[#0F3D2E] shadow-lg text-center space-y-5 relative"
                >
                  <div className="absolute top-4 right-4 text-[10px] font-mono text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Acreditación Verificada
                  </div>

                  <div className="space-y-1">
                    <AranproLogo className="h-10 w-auto mx-auto mb-2" />
                    <span className="text-[10px] font-black text-[#D4B895] uppercase tracking-widest block">
                      ARANPRO • GESTIÓN & MANTENCIÓN INTEGRAL DE CONDOMINIOS
                    </span>
                    <h2 className="text-xl font-black text-[#0F3D2E] tracking-tight uppercase">
                      Certificado de Respaldo Profesional & Competencia Técnica
                    </h2>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Conforme al marco legal de la Ley N° 21.442 sobre Copropiedad Inmobiliaria
                    </p>
                  </div>

                  <div className="py-4 border-y-2 border-[#D4B895]/40 space-y-2">
                    <p className="text-xs text-slate-600">
                      Se certifica que el Administrador Titular y Representante Legal:
                    </p>
                    <h3 className="text-base font-black text-slate-900">
                      {empresaForm.adminName}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">
                      RUT: {empresaForm.adminRut} • RNAC Minvu N° {empresaForm.rnacNumber}
                    </p>
                    <div className="pt-2">
                      <span className="text-xs text-slate-600">
                        Cuenta con formación y acreditación en:
                      </span>
                      <p className="text-base font-black text-[#0F3D2E] mt-0.5">
                        {activeDiplomaPreview.title}
                      </p>
                      <p className="text-xs text-slate-500 font-medium">
                        {activeDiplomaPreview.institution} • Año {activeDiplomaPreview.year} • Estado: {activeDiplomaPreview.status}
                      </p>
                    </div>
                  </div>

                  <div className="text-left bg-white p-3.5 rounded-xl border border-slate-200 space-y-1 text-xs">
                    <strong className="text-[#0F3D2E] block">Aporte a la Administración Comunitaria:</strong>
                    <p className="text-slate-600 leading-relaxed text-[11px]">
                      {activeDiplomaPreview.relevance}
                    </p>
                  </div>

                  <div className="pt-4 flex items-center justify-between text-left border-t border-slate-200 text-[10px] text-slate-400 font-mono">
                    <div>
                      {(signatureImage || companySettings?.signatureDataUrl) && (
                        <img 
                          src={signatureImage || companySettings?.signatureDataUrl} 
                          alt="Firma" 
                          className="h-16 max-h-20 w-auto max-w-[240px] object-contain mb-1"
                          style={{ transform: `scale(${signatureScale})`, transformOrigin: 'bottom left' }}
                        />
                      )}
                      <p className="font-bold text-slate-700">Firma Autorizada ARANPRO</p>
                      <p>Registro Central de Custodia Digital</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#0F3D2E]">Fono Directo: {empresaForm.phone}</p>
                      <p>{empresaForm.city}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Archivo: <strong className="text-slate-700">{activeDiplomaPreview.fileName || 'Diploma_Acreditado.pdf'}</strong>
              </span>
              <button
                type="button"
                onClick={() => setActiveDiplomaPreview(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
              >
                Cerrar Visor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL 1: BROCHURE DE LA APP & PORTAL WEB (PDF CARTA) ==================== */}
      {previewBrochureModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col relative space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-[#0F3D2E] text-[#D4B895]">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    Brochure Comercial de la App Móvil & Web para Copropietarios
                  </h4>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Ficha de Presentación Ejecutiva • Transparencia Radical y Acceso 24/7
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintBrochure}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs shadow-xs transition-all active:scale-95"
                >
                  <Printer className="w-4 h-4 text-[#D4B895]" />
                  Imprimir / Descargar PDF (Carta)
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewBrochureModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="no-print pb-1">
              <AranproPdfStyleSelector value={pdfStyle} onChange={setPdfStyle} compact />
            </div>

            {/* CONTENEDOR DEL BROCHURE IMPRIMIBLE */}
            <div className="overflow-y-auto flex-1 pr-1 bg-slate-100/70 p-2 md:p-4 rounded-2xl">
              <div
                id="printable-app-brochure"
                data-pdf-style={pdfStyle}
                className="dossier-page page-1 bg-white p-6 md:p-7 pl-9 md:pl-11 min-h-[850px] flex flex-col justify-between max-w-[850px] mx-auto text-slate-900 text-xs shadow-md leading-relaxed"
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              >
                {/* SECCIÓN SUPERIOR */}
                <div className="space-y-2.5">
                  {/* Membrete Maestro del Brochure ARANPRO */}
                  <div className="flex items-center justify-between border-b-2 border-[#0F3D2E] pb-2.5">
                    <div className="flex items-center space-x-3.5">
                      <AranproLogo variant="principal" className="h-11 w-auto" />
                      <div className="space-y-0.5 border-l border-slate-300 pl-3.5">
                        <span className="text-[9.5px] font-black text-[#D4B895] uppercase tracking-widest block">
                          SUITE DIGITAL PARA CONDOMINIOS • LEY N° 21.442
                        </span>
                        <h2 className="text-base font-black text-[#0F3D2E] tracking-tight uppercase leading-none">
                          Portal Web & App Móvil ARANPRO
                        </h2>
                        <p className="text-[9.5px] text-slate-600 font-mono font-semibold">
                          {empresaForm.companyRut && !String(empresaForm.companyRut).includes('76.999.888') ? `RUT Empresa: ${empresaForm.companyRut} • ` : ''}{empresaForm.rnacNumber && empresaForm.rnacNumber !== '48.912' ? `RNAC MINVU N° ${empresaForm.rnacNumber}` : 'Ley N° 21.442 de Copropiedad Inmobiliaria'}
                        </p>
                        <p className="text-[9px] text-slate-500 font-mono">
                          {empresaForm.email || 'contacto@aranpro.cl'} • {empresaForm.phone || '+56 9 5811 8504'} • {empresaForm.website || 'https://aranpro.cl'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right space-y-0.5 shrink-0">
                      <span className="inline-block px-2.5 py-0.5 rounded bg-[#F5F4EF] text-[#0F3D2E] border border-[#D4B895] text-[9.5px] font-bold font-mono">
                        ACCESO 24/7 EN LÍNEA
                      </span>
                      <p className="text-[9.5px] text-slate-500 font-semibold">
                        {proposalConfig.targetCondo || 'Comunidad de Copropietarios'}
                      </p>
                    </div>
                  </div>

                  {/* 4 Pilares Tecnológicos */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="flex items-center gap-1.5 text-[#0F3D2E]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <h5 className="font-black text-[11px]">1. Auditoría Bancaria con 1 Clic</h5>
                      </div>
                      <p className="text-[10px] text-slate-600 leading-snug">
                        Cada factura, boleta de honorarios y comprobante de transferencia bancaria de los gastos comunes está disponible en línea para consulta inmediata de cualquier vecino. Cero suspicacias.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="flex items-center gap-1.5 text-[#0F3D2E]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <h5 className="font-black text-[11px]">2. Colilla Digital & Pago Rápido</h5>
                      </div>
                      <p className="text-[10px] text-slate-600 leading-snug">
                        Desglose detallado del gasto común del mes, desglose del fondo de reserva obligatorio (Art. 6° Ley 21.442), lecturas de agua y pago en línea con Webpay / Flow.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="flex items-center gap-1.5 text-[#0F3D2E]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <h5 className="font-black text-[11px]">3. Asambleas y Voto Telemático</h5>
                      </div>
                      <p className="text-[10px] text-slate-600 leading-snug">
                        Participación híbrida conforme al Art. 15° de la Ley 21.442. Los propietarios pueden emitir su voto de manera segura desde el celular con quórums auditados en tiempo real.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="flex items-center gap-1.5 text-[#0F3D2E]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <h5 className="font-black text-[11px]">4. Libro Oficial de Reclamos Digital</h5>
                      </div>
                      <p className="text-[10px] text-slate-600 leading-snug">
                        Trazabilidad legal con folios correlativos bajo el Art. 20°. Cada reclamo o sugerencia ingresado tiene fecha límite estricta de respuesta formal por parte de la administración.
                      </p>
                    </div>
                  </div>

                  {/* Demostración Interactiva en Vivo & Código QR para Probar la App */}
                  <div className="p-3 rounded-2xl bg-[#F5F4EF] border-2 border-[#0F3D2E] flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="inline-block px-2 py-0.5 rounded bg-[#0F3D2E] text-[#D4B895] text-[8.5px] font-bold font-mono uppercase">
                        ★ Demo Interactiva en Vivo
                      </div>
                      <h4 className="text-xs md:text-sm font-black text-[#0F3D2E] leading-tight">
                        Pruebe la experiencia de los residentes de {proposalConfig.targetCondo || 'su comunidad'}
                      </h4>
                      <p className="text-[9.5px] text-slate-700 leading-snug">
                        Escanee este código QR con la cámara de su teléfono móvil o ingrese a <strong>{empresaForm.website || 'https://aranpro.cl'}</strong> para probar la plataforma en tiempo real: consulte colillas, respalde gastos con un clic y revise el libro de reclamos digital.
                      </p>
                      <div className="text-[8.5px] font-mono font-bold text-[#0F3D2E]">
                        100% Gratuita para la comunidad • Cero costos de licencias o software
                      </div>
                    </div>
                    <div className="shrink-0 p-2 bg-white rounded-xl border border-slate-300 shadow-sm text-center">
                      <svg className="w-16 h-16 mx-auto" viewBox="0 0 100 100" fill="#0F3D2E">
                        <rect x="5" y="5" width="25" height="25" fill="#0F3D2E" rx="3" />
                        <rect x="10" y="10" width="15" height="15" fill="#ffffff" rx="1" />
                        <rect x="14" y="14" width="7" height="7" fill="#0F3D2E" />

                        <rect x="70" y="5" width="25" height="25" fill="#0F3D2E" rx="3" />
                        <rect x="75" y="10" width="15" height="15" fill="#ffffff" rx="1" />
                        <rect x="79" y="14" width="7" height="7" fill="#0F3D2E" />

                        <rect x="5" y="70" width="25" height="25" fill="#0F3D2E" rx="3" />
                        <rect x="10" y="75" width="15" height="15" fill="#ffffff" rx="1" />
                        <rect x="14" y="79" width="7" height="7" fill="#0F3D2E" />

                        <rect x="35" y="10" width="6" height="6" />
                        <rect x="45" y="10" width="6" height="6" />
                        <rect x="55" y="10" width="6" height="6" />
                        <rect x="35" y="25" width="6" height="6" />
                        <rect x="45" y="20" width="6" height="6" />
                        <rect x="55" y="25" width="6" height="6" />
                        <rect x="35" y="35" width="10" height="10" />
                        <rect x="50" y="35" width="10" height="10" />
                        <rect x="65" y="35" width="6" height="6" />
                        <rect x="10" y="45" width="6" height="6" />
                        <rect x="20" y="45" width="6" height="6" />
                        <rect x="35" y="50" width="6" height="6" />
                        <rect x="45" y="50" width="6" height="6" />
                        <rect x="55" y="50" width="6" height="6" />
                        <rect x="65" y="50" width="6" height="6" />
                        <rect x="75" y="45" width="10" height="10" />
                        <rect x="35" y="65" width="6" height="6" />
                        <rect x="45" y="65" width="6" height="6" />
                        <rect x="55" y="65" width="6" height="6" />
                        <rect x="65" y="65" width="15" height="6" />
                        <rect x="35" y="75" width="15" height="6" />
                        <rect x="55" y="75" width="6" height="6" />
                        <rect x="65" y="75" width="6" height="15" />
                        <rect x="75" y="85" width="15" height="6" />
                        <rect x="35" y="85" width="6" height="6" />
                        <rect x="45" y="85" width="6" height="6" />
                        <rect x="55" y="85" width="6" height="6" />
                      </svg>
                      <span className="text-[7px] font-mono font-bold text-slate-500 block mt-0.5 tracking-tight">ESCANEAR CON CELULAR</span>
                    </div>
                  </div>
                </div>

                {/* SECCIÓN INFERIOR ANCLADA AL PIE */}
                <div className="mt-auto pt-2 space-y-2">
                  <div className="pt-2 border-t border-slate-200 flex items-end justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <AranproOfficialSeal
                        size="sm"
                        companyRut={empresaForm.companyRut && !String(empresaForm.companyRut).includes('76.999.888') ? empresaForm.companyRut : ''}
                        rnacNumber=""
                        showCaption={true}
                      />
                      <div className="text-[9.5px] text-slate-600 border-l border-slate-200 pl-3 space-y-0.5">
                        <p><strong>Fono Comercial:</strong> <span className="font-mono font-bold text-[#0F3D2E]">{empresaForm.phone || '+56 9 5811 8504'}</span></p>
                        <p><strong>Correo:</strong> <span className="font-mono">{empresaForm.email || 'contacto@aranpro.cl'}</span></p>
                        <p><strong>Sitio Web:</strong> <span className="font-mono text-[#0F3D2E] font-bold">{empresaForm.website || 'https://aranpro.cl'}</span></p>
                      </div>
                    </div>

                    <div className="text-center min-w-[240px]">
                      <div className="h-14 flex items-end justify-center pb-0.5 overflow-visible">
                        {(signatureImage || companySettings?.signatureDataUrl) && (
                          <img
                            src={signatureImage || companySettings?.signatureDataUrl}
                            alt="Firma"
                            className="h-12 max-h-14 w-auto max-w-[240px] object-contain mx-auto"
                            style={{ transform: `scale(${signatureScale})`, transformOrigin: 'bottom center' }}
                          />
                        )}
                      </div>
                      <div className="border-t-[1.5px] border-slate-800 pt-1">
                        <span className="text-[11px] font-black text-slate-900 block leading-tight">{empresaForm.adminName}</span>
                        <span className="text-[9px] text-[#0F3D2E] font-bold block leading-tight">Constructor Civil • Administrador de Condominios</span>
                        <span className="text-[9px] text-slate-600 font-mono block">RUT: {(empresaForm.adminRut && empresaForm.adminRut !== '14.882.140-K') ? empresaForm.adminRut : '16.012.871-2'} • Ley N° 21.442</span>
                      </div>
                    </div>
                  </div>

                  {/* Pie de Página Canónico Maestro */}
                  <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                    <div>ARANPRO Gestión Integral • {empresaForm.website}</div>
                    <div className="font-bold text-[#0F3D2E]">Brochure Tecnológico • Suite Web & App Móvil • Ley N° 21.442 (Pág. 1 de 1)</div>
                    <div>{empresaForm.city || 'La Serena, Chile'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL 2: INFORME DE DIAGNÓSTICO TÉCNICO INICIAL ==================== */}
      {previewInspectionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col relative space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-[#0F3D2E] text-[#D4B895]">
                  <HardHat className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    Informe de Diagnóstico Técnico Inicial Gratuito
                  </h4>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Levantamiento Preventivo de Instalaciones Críticas • Criterio Constructivo
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintInspectionReport}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs shadow-xs transition-all active:scale-95"
                >
                  <Printer className="w-4 h-4 text-[#D4B895]" />
                  Imprimir / Descargar PDF (Carta)
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewInspectionModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="no-print pb-1">
              <AranproPdfStyleSelector value={pdfStyle} onChange={setPdfStyle} compact />
            </div>

            {/* CONTENEDOR DEL INFORME IMPRIMIBLE */}
            <div className="overflow-y-auto flex-1 pr-1 bg-slate-100/70 p-2 md:p-4 rounded-2xl">
              <div
                id="printable-technical-inspection"
                data-pdf-style={pdfStyle}
                className="dossier-page page-1 bg-white p-6 md:p-7 pl-9 md:pl-11 min-h-[850px] flex flex-col justify-between max-w-[850px] mx-auto text-slate-900 text-xs shadow-md leading-relaxed"
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              >
                {/* SECCIÓN SUPERIOR */}
                <div className="space-y-2.5">
                  {/* Membrete Maestro Técnico ARANPRO */}
                  <div className="flex items-center justify-between border-b-2 border-[#0F3D2E] pb-2.5">
                    <div className="flex items-center space-x-3.5">
                      <AranproLogo variant="principal" className="h-11 w-auto" />
                      <div className="space-y-0.5 border-l border-slate-300 pl-3.5">
                        <span className="text-[9.5px] font-black text-[#D4B895] uppercase tracking-widest block">
                          DEPARTAMENTO TÉCNICO & AUDITORÍA CONSTRUCTIVA
                        </span>
                        <h2 className="text-base font-black text-[#0F3D2E] tracking-tight uppercase">
                          Informe de Diagnóstico Técnico Inicial
                        </h2>
                        <p className="text-[9.5px] text-slate-600 font-mono font-semibold">
                          {empresaForm.companyRut && !String(empresaForm.companyRut).includes('76.999.888') ? `RUT Empresa: ${empresaForm.companyRut} • ` : ''}Ley N° 21.442 de Copropiedad • Fono: {empresaForm.phone || '+56 9 5811 8504'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-xs space-y-0.5 shrink-0">
                      <span className="inline-block px-2.5 py-0.5 rounded bg-[#F5F4EF] text-[#0F3D2E] text-[9.5px] font-mono font-bold border border-[#D4B895]">
                        DIAGNÓSTICO TÉCNICO
                      </span>
                      <p className="font-bold text-slate-800 text-[10.5px]">
                        {proposalConfig.targetCondo || inspectionForm.targetCondo || 'Condominio en Evaluación'}
                      </p>
                      <span className="text-[9px] text-slate-500 block font-mono">Fecha: {inspectionForm.date}</span>
                    </div>
                  </div>

                  {/* Datos del Inspector Técnico */}
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-bold">Profesional Evaluador a Cargo:</span>
                      <strong className="text-slate-900 text-xs">{empresaForm.adminName}</strong>
                      <span className="text-slate-600 block text-[10px]">Constructor Civil • Administrador de Condominios (Ley N° 21.442)</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 block text-[9px] uppercase font-bold">Contacto Directo:</span>
                      <span className="font-mono text-[#0F3D2E] font-bold text-xs">{empresaForm.phone}</span>
                    </div>
                  </div>

                  {/* Partidas Evaluadas */}
                  <div className="space-y-2">
                    <h4 className="text-[10.5px] font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1">
                      Evaluación de Estado de Instalaciones Críticas:
                    </h4>

                    <div className="space-y-1.5">
                      {inspectionForm.items.map((item, idx) => (
                        <div key={item.id} className="p-2 rounded-xl border border-slate-200 bg-white space-y-0.5 text-xs break-inside-avoid">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-slate-900 text-[10.5px]">{idx + 1}. {item.name}</span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              item.status === 'Bueno'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.status === 'Requiere Mantención'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {item.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-600 leading-snug bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                            {item.notes}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* SECCIÓN INFERIOR ANCLADA AL PIE */}
                <div className="mt-auto pt-2 space-y-2">
                  <div className="pt-2 border-t border-slate-200 flex items-end justify-between gap-4 text-xs">
                    <div className="flex items-center gap-3 max-w-md">
                      <AranproOfficialSeal
                        size="sm"
                        companyRut={empresaForm.companyRut && !String(empresaForm.companyRut).includes('76.999.888') ? empresaForm.companyRut : ''}
                        rnacNumber=""
                        showCaption={true}
                      />
                      <div className="space-y-0.5 border-l border-slate-200 pl-3">
                        <p className="font-bold text-slate-900 text-[10px]">Conclusión de Inspección Técnica:</p>
                        <p className="text-[9.5px] text-slate-600 leading-snug">
                          Diagnóstico realizado sin costo para orientar al Comité de Administración en la priorización de obras preventivas y evitar emergencias de alto costo.
                        </p>
                      </div>
                    </div>

                    <div className="text-center space-y-0.5 min-w-[240px]">
                      <div className="h-14 flex items-end justify-center pb-0.5 overflow-visible">
                        {signatureImage ? (
                          <img
                            src={signatureImage}
                            alt="Firma"
                            className="h-12 max-h-14 w-auto max-w-[240px] object-contain mx-auto"
                            style={{ transform: `scale(${signatureScale})`, transformOrigin: 'bottom center' }}
                          />
                        ) : (
                          <div className="h-12"></div>
                        )}
                      </div>
                      <div className="border-t-[1.5px] border-slate-800 pt-1 text-[10px]">
                        <p className="font-black text-slate-900 text-[11px] leading-tight">{empresaForm.adminName}</p>
                        <p className="text-[9px] text-[#0F3D2E] font-bold leading-tight">Constructor Civil • Administrador de Condominios</p>
                        <p className="text-[9px] text-slate-600 font-mono">RUT: {(empresaForm.adminRut && empresaForm.adminRut !== '14.882.140-K') ? empresaForm.adminRut : '16.012.871-2'} • Ley N° 21.442</p>
                      </div>
                    </div>
                  </div>

                  {/* Pie de Página Canónico Maestro */}
                  <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                    <div>ARANPRO Gestión Integral • {empresaForm.website}</div>
                    <div className="font-bold text-[#0F3D2E]">Informe de Diagnóstico Técnico Inicial • Ley N° 21.442 (Pág. 1 de 1)</div>
                    <div>{empresaForm.city || 'La Serena, Chile'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL 3: CUADRO COMPARATIVO (TRADICIONAL VS ARANPRO) ==================== */}
      {previewComparisonModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col relative space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-[#0F3D2E] text-[#D4B895]">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    Matriz Comparativa: Administración Tradicional vs. ARANPRO
                  </h4>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Diferenciadores Clave para Asambleas y Comités de Copropietarios
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintComparisonMatrix}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs shadow-xs transition-all active:scale-95"
                >
                  <Printer className="w-4 h-4 text-[#D4B895]" />
                  Imprimir / Descargar PDF (Carta)
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewComparisonModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="no-print pb-1">
              <AranproPdfStyleSelector value={pdfStyle} onChange={setPdfStyle} compact />
            </div>

            {/* CONTENEDOR DE LA MATRIZ IMPRIMIBLE */}
            <div className="overflow-y-auto flex-1 pr-1 bg-slate-100/70 p-2 md:p-4 rounded-2xl">
              <div
                id="printable-comparison-matrix"
                data-pdf-style={pdfStyle}
                className="dossier-page page-1 bg-white p-6 md:p-7 pl-9 md:pl-11 min-h-[850px] flex flex-col justify-between max-w-[850px] mx-auto text-slate-900 text-xs shadow-md leading-relaxed"
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              >
                {/* SECCIÓN SUPERIOR */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b-2 border-[#0F3D2E] pb-2">
                    <div className="flex items-center space-x-3.5">
                      <AranproLogo variant="principal" className="h-11 w-auto" />
                      <div className="space-y-0.5 border-l border-slate-300 pl-3.5">
                        <span className="text-[9.5px] font-black text-[#D4B895] uppercase tracking-widest block">
                          ANÁLISIS COMPARATIVO DE VALOR AGREGADO
                        </span>
                        <h2 className="text-base font-black text-[#0F3D2E] uppercase tracking-tight">
                          ¿Por qué elegir la Gestión Integral de ARANPRO?
                        </h2>
                        <p className="text-[9.5px] text-slate-600 font-mono">
                          {empresaForm.companyRut && !String(empresaForm.companyRut).includes('76.999.888') ? `RUT Empresa: ${empresaForm.companyRut} • ` : ''}{empresaForm.email || 'contacto@aranpro.cl'} • {empresaForm.phone || '+56 9 5811 8504'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right space-y-0.5 shrink-0">
                      <span className="inline-block px-2.5 py-0.5 bg-[#F5F4EF] border border-[#D4B895] text-[#0F3D2E] text-[9.5px] font-mono font-bold rounded">
                        ESTÁNDAR LEY 21.442
                      </span>
                      <p className="text-[9.5px] text-slate-500 font-semibold">
                        {proposalConfig.targetCondo || 'Comunidad de Copropietarios'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {[
                      { p: '1. Supervisión Constructiva', t: 'Visitas esporádicas. No saben de construcción ni bombas; dependen a ciegas de técnicos externos con sobrecostos.', a: 'Administrador Constructor Civil. Audita bombas, sellos, filtraciones y fiscaliza a contratistas en terreno con criterio técnico experto.' },
                      { p: '2. Transparencia en Cuentas', t: 'Planillas Excel confusas enviadas a fin de mes. Comprobantes bancarios ocultos o extraviados.', a: 'Portal y App móvil 24/7 donde cada vecino audita las facturas y comprobantes bancarios reales de cada gasto con 1 solo clic.' },
                      { p: '3. Asambleas Ley 21.442', t: 'Falta crónica de quórum presencial. Actas en papel que tardan semanas en protocolizarse.', a: 'Asambleas telemáticas e híbridas con voto digital seguro desde el teléfono celular y quórums automatizados (Art. 15°).' },
                      { p: '4. Atención de Reclamos', t: 'Mensajes de WhatsApp o llamados informales que quedan en el olvido sin respuesta.', a: 'Libro Oficial de Reclamos y Sugerencias digital foliado con plazo legal estricto de respuesta garantizado (Art. 20°).' },
                      { p: '5. Cobranzas & Fe Notarial', t: 'Cobranza informal sin protocolos legales ni respaldo jurídico.', a: 'Certificados oficiales foliados de no deuda, convenios de pago y certificados morosos para compraventas (Art. 36°).' }
                    ].map((row, i) => (
                      <div key={i} className="p-2 rounded-xl border border-slate-200 bg-slate-50 space-y-1 text-xs">
                        <span className="font-black text-slate-900 text-[10.5px] block">{row.p}</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                          <div className="p-1.5 rounded-lg bg-rose-50 border border-rose-200 text-slate-700">
                            <strong className="text-rose-800 block text-[9px] uppercase">✕ Administración Tradicional:</strong>
                            <p className="mt-0.5 leading-snug">{row.t}</p>
                          </div>
                          <div className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-slate-800">
                            <strong className="text-[#0F3D2E] block text-[9px] uppercase">✓ Con ARANPRO:</strong>
                            <p className="mt-0.5 leading-snug font-medium">{row.a}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SECCIÓN INFERIOR ANCLADA AL PIE */}
                <div className="mt-auto pt-2 space-y-2">
                  <div className="pt-2 border-t border-slate-200 flex items-end justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <AranproOfficialSeal
                        size="sm"
                        companyRut={empresaForm.companyRut && !String(empresaForm.companyRut).includes('76.999.888') ? empresaForm.companyRut : ''}
                        rnacNumber=""
                        showCaption={true}
                      />
                      <div className="text-[9.5px] text-slate-600 border-l border-slate-200 pl-3 space-y-0.5">
                        <p><strong>Fono:</strong> <span className="font-mono font-bold text-[#0F3D2E]">{empresaForm.phone || '+56 9 5811 8504'}</span></p>
                        <p><strong>Correo:</strong> <span className="font-mono">{empresaForm.email || 'contacto@aranpro.cl'}</span></p>
                      </div>
                    </div>

                    <div className="text-center min-w-[240px]">
                      <div className="h-14 flex items-end justify-center pb-0.5 overflow-visible">
                        {(signatureImage || companySettings?.signatureDataUrl) && (
                          <img
                            src={signatureImage || companySettings?.signatureDataUrl}
                            alt="Firma"
                            className="h-12 max-h-14 w-auto max-w-[240px] object-contain mx-auto"
                            style={{ transform: `scale(${signatureScale})`, transformOrigin: 'bottom center' }}
                          />
                        )}
                      </div>
                      <div className="border-t-[1.5px] border-slate-800 pt-1">
                        <span className="text-[11px] font-black text-slate-900 block leading-tight">{empresaForm.adminName}</span>
                        <span className="text-[9px] text-[#0F3D2E] font-bold block leading-tight">Constructor Civil • Administrador de Condominios</span>
                        <span className="text-[9px] text-slate-600 font-mono block">RUT: {(empresaForm.adminRut && empresaForm.adminRut !== '14.882.140-K') ? empresaForm.adminRut : '16.012.871-2'} • Ley N° 21.442</span>
                      </div>
                    </div>
                  </div>

                  {/* Pie de Página Canónico Maestro */}
                  <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                    <div>ARANPRO Gestión Integral • {empresaForm.website}</div>
                    <div className="font-bold text-[#0F3D2E]">Matriz Comparativa de Gestión • Estándar Ley N° 21.442 (Pág. 1 de 1)</div>
                    <div>{empresaForm.city || 'La Serena, Chile'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL 4: GUÍA INTERNA DE PITCH Y OBJECIONES ==================== */}
      {showPitchGuideModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col relative space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Presentation className="w-5 h-5 text-[#0F3D2E]" />
                <h4 className="text-sm font-black text-slate-900">Ficha Maestra: Respuestas a Objeciones del Comité</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowPitchGuideModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 pr-1 space-y-3 text-xs">
              {[
                { q: '1. "¿Cuánto cobran de honorarios y qué incluye?"', r: 'Nuestros honorarios son transparentes y acordes a la escala de la comunidad. Incluyen visitas semanales en terreno, la plataforma web y app móvil para todos los copropietarios, y la emisión de colillas y certificados sin cobros ocultos.' },
                { q: '2. "¿Cómo se realiza el cambio con la administración actual?"', r: 'ARANPRO se encarga de la auditoría de traspaso formal según el Art. 20° de la Ley N° 21.442, levantando un acta formal de conciliación bancaria y revisión de deudas para blindar la responsabilidad del nuevo comité.' },
                { q: '3. "¿Cómo manejan la morosidad histórica?"', r: 'Aplicamos el Art. 36° de la ley: emisión de convenios de pago formalizados, certificados morosos para notarías y cortes de suministro coordinados conforme al reglamento interno.' },
                { q: '4. "¿Por qué un administrador con formación en construcción es mejor?"', r: 'Porque las mantenciones representan el 60% del gasto común. Con criterio técnico de Constructor Civil evitamos que contratistas inflen presupuestos de impermeabilización, bombas o pintura.' }
              ].map((item, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                  <span className="font-black text-slate-900 block">{item.q}</span>
                  <p className="text-slate-700 leading-relaxed text-[11.5px] bg-white p-2.5 rounded-xl border border-slate-200">
                    <strong className="text-[#0F3D2E]">Respuesta Recomendada:</strong> {item.r}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={handleCopyPitchToClipboard}
                className="px-4 py-2 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5 text-[#D4B895]" />
                Copiar al Portapapeles
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN CORPORATIVO ARANPRO */}
      <AranproConfirmModal
        isOpen={modalDialog.isOpen}
        type={modalDialog.type}
        title={modalDialog.title}
        message={modalDialog.message}
        confirmText={modalDialog.confirmText}
        cancelText={modalDialog.cancelText}
        isAlert={modalDialog.isAlert}
        onConfirm={modalDialog.onConfirm}
        onCancel={modalDialog.onCancel}
      />
    </div>
  );
};
