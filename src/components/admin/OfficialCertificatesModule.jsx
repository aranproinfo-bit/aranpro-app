import React, { useState, useMemo } from 'react';
import { useCommunity } from '../../context/CommunityContext';
import { formatDate, formatRut, formatCLP } from '../../utils/formatters';
import { printDocumentDirectly, downloadHtmlDocument } from '../../utils/printDocument';
import { AranproConfirmModal } from '../common/AranproConfirmModal';
import { AranproLogo } from '../common/MauranLogo';
import {
  ShieldCheck, FileText, CheckCircle2, AlertTriangle, Printer,
  Download, Share2, Search, Filter, Plus, X, ExternalLink,
  Clock, UserCheck, Building2, Calendar, DollarSign, AlertCircle,
  Trash2, Eye, Send, Home, Briefcase, Award, Check, FileSpreadsheet,
  QrCode, Scale, HelpCircle, Layers, Copy, Truck, Percent, CheckSquare
} from 'lucide-react';

export const OfficialCertificatesModule = ({ currentCommunity }) => {
  const {
    certificates = [],
    requestCertificate,
    updateCertificateStatus,
    deleteCertificate,
    companySettings,
    getUnitFinancials
  } = useCommunity();

  // Estados de filtrado y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Estados de modales
  const [showNewModal, setShowNewModal] = useState(false);
  const [previewCert, setPreviewCert] = useState(null);
  const [verifyingCert, setVerifyingCert] = useState(null); // Propuesta 3: Verificación Notarial Express
  const [copiedClauseFolio, setCopiedClauseFolio] = useState(null); // Propuesta 4: Copiar Cláusula
  const [copiedLinkFolio, setCopiedLinkFolio] = useState(null);

  // Estado del modal de confirmación personalizado (reemplazo de window.confirm / alert)
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

  // Catálogo Completo de 7 Tipos Oficiales de Certificados según Ley N° 21.442
  const CERTIFICATE_TYPES = [
    {
      id: 'Certificado de Gastos Comunes al Día (No Deuda)',
      label: 'Certificado de Gastos Comunes al Día (No Deuda)',
      shortName: 'Al Día (No Deuda)',
      legalRef: 'Ley N° 21.442 • Arts. 17°, 20° y 36°',
      useCase: 'Compraventas notariales, CBR, bancos, estudios de títulos sin mora',
      requiresNoDebt: true,
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200'
    },
    {
      id: 'Certificado de Estado de Deuda y Liquidación Morosa',
      label: 'Certificado Oficial de Estado de Deuda y Liquidación Morosa',
      shortName: 'Estado de Deuda (Art. 36°)',
      legalRef: 'Ley N° 21.442 • Arts. 20° y 36° (Responsabilidad real del nuevo adquirente / Retención Notarial)',
      useCase: 'Compraventas con deuda, asunción por nuevo adquirente, retención bancaria en vale vista, remates y juicios',
      isDebtCertificate: true,
      badgeColor: 'bg-rose-50 text-rose-800 border-rose-200'
    },
    {
      id: 'Certificado de Salvoconducto y Desalojo / Mudanza',
      label: 'Certificado de Salvoconducto y Autorización de Mudanza',
      shortName: 'Mudanza / Salvoconducto',
      legalRef: 'Ley N° 21.442 • Ley de Arrendamiento y Reglamento Interno',
      useCase: 'Autorización formal de mudanza e ingreso/retiro de bienes muebles, acreditando no deuda y resguardo de áreas comunes',
      badgeColor: 'bg-teal-50 text-teal-800 border-teal-200'
    },
    {
      id: 'Certificado Oficial de Copropiedad y Alícuota de Prorrateo',
      label: 'Certificado Oficial de Copropiedad y Alícuota de Prorrateo',
      shortName: 'Alícuota y Copropiedad',
      legalRef: 'Ley N° 21.442 • Art. 3° y Art. 13° (Derechos sobre Bienes Comunes)',
      useCase: 'Tasaciones bancarias, estudios de título hipotecarios, créditos de autoconstrucción y avalúos',
      badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200'
    },
    {
      id: 'Certificado de Residencia y Domicilio',
      label: 'Certificado de Residencia y Domicilio',
      shortName: 'Residencia',
      legalRef: 'Ley N° 21.442 • Art. 17° inc. 2 (Registro de Copropietarios y Ocupantes)',
      useCase: 'Bancos, Dirección de Tránsito (licencia de conducir), trámites escolares y subsidios',
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-200'
    },
    {
      id: 'Certificado de Vigencia de Miembro del Comité',
      label: 'Certificado de Vigencia de Miembro del Comité de Administración',
      shortName: 'Vigencia Comité',
      legalRef: 'Ley N° 21.442 • Art. 17°',
      useCase: 'Apertura y firma en cuentas corrientes bancarias, trámites ante el SII y juzgados',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200'
    },
    {
      id: 'Certificado de Buena Convivencia y No Infracciones',
      label: 'Certificado de Buena Convivencia y No Infracciones Reglamentarias',
      shortName: 'Buena Convivencia',
      legalRef: 'Ley N° 21.442 • Título IV y Reglamento de Copropiedad',
      useCase: 'Arrendamientos habitacionales, mediación vecinal y antecedentes comunitarios',
      badgeColor: 'bg-purple-50 text-purple-800 border-purple-200'
    }
  ];

  // Estado del formulario de emisión directa
  const [formData, setFormData] = useState({
    type: 'Certificado de Gastos Comunes al Día (No Deuda)',
    unitNumber: '',
    applicantName: '',
    rut: '',
    email: '',
    phone: '',
    purpose: '',
    notes: '',
    status: 'EMITIDO',
    debtAmount: 0,
    retentionAmount: 0,
    aliquotPercent: '',
    debtBreakdown: {
      currentCharge: 0,
      previousDebt: 0,
      extraCharge: 0,
      repactedInstallment: 0
    }
  });

  // Filtrar los certificados correspondientes a la comunidad actual o generales
  const communityCertificates = useMemo(() => {
    return certificates.filter(c => {
      if (!currentCommunity) return true;
      if (!c.communityName) return true;
      return c.communityName.toLowerCase().trim() === currentCommunity.name.toLowerCase().trim();
    });
  }, [certificates, currentCommunity]);

  // Auditoría financiera de unidades de la comunidad actual
  const financialAuditMap = useMemo(() => {
    if (!currentCommunity?.units) return {};
    const totalUnitsCount = currentCommunity.units.length || 1;
    const defaultAliquot = (100 / totalUnitsCount).toFixed(3);
    const map = {};
    currentCommunity.units.forEach(u => {
      const fin = getUnitFinancials ? getUnitFinancials(u) : { pendingDebt: 0, isFullyPaid: true };
      map[u.number.toString()] = {
        unit: u,
        pendingDebt: fin.pendingDebt || 0,
        isFullyPaid: fin.pendingDebt === 0,
        owner: u.owner,
        rut: u.rut,
        email: u.email,
        phone: u.phone,
        aliquot: u.aliquot || defaultAliquot,
        currentCharge: fin.currentCharge || 0,
        previousDebt: fin.previousDebt || 0,
        extraCharge: fin.extraCharge || 0,
        repactedInstallment: fin.repactedInstallment || 0
      };
    });
    return map;
  }, [currentCommunity, getUnitFinancials]);

  // Cálculos de KPIs
  const stats = useMemo(() => {
    const total = communityCertificates.length;
    const pending = communityCertificates.filter(c => c.status === 'SOLICITADO').length;
    const issued = communityCertificates.filter(c => c.status === 'EMITIDO').length;

    // Unidades al día en la comunidad
    const totalUnits = currentCommunity?.units?.length || 0;
    const upToDateUnits = Object.values(financialAuditMap).filter(u => u.isFullyPaid).length;
    const unitsWithDebt = Object.values(financialAuditMap).filter(u => !u.isFullyPaid).length;
    const upToDatePercent = totalUnits > 0 ? Math.round((upToDateUnits / totalUnits) * 100) : 100;

    // Certificados de deuda emitidos
    const debtCertsCount = communityCertificates.filter(c => 
      c.type.includes('Estado de Deuda') || (c.debtAmount > 0 && c.type.includes('Deuda'))
    ).length;

    // Trámites notariales y bancarios
    const notarialCount = communityCertificates.filter(c => 
      (c.purpose || '').toLowerCase().includes('notar') ||
      (c.purpose || '').toLowerCase().includes('cbr') ||
      (c.purpose || '').toLowerCase().includes('banco') ||
      (c.purpose || '').toLowerCase().includes('crédito') ||
      (c.purpose || '').toLowerCase().includes('compraventa') ||
      c.type.includes('No Deuda') ||
      c.type.includes('Estado de Deuda') ||
      c.type.includes('Alícuota')
    ).length;

    return { total, pending, issued, upToDateUnits, unitsWithDebt, totalUnits, upToDatePercent, debtCertsCount, notarialCount };
  }, [communityCertificates, currentCommunity, financialAuditMap]);

  // Filtrado reactivo de la tabla
  const filteredCertificates = useMemo(() => {
    return communityCertificates.filter(cert => {
      const matchesSearch =
        (cert.applicantName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cert.rut || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cert.unitNumber || '').toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cert.folio || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cert.purpose || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = filterType === 'all' || cert.type === filterType;
      const matchesStatus = filterStatus === 'all' || cert.status === filterStatus;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [communityCertificates, searchTerm, filterType, filterStatus]);

  // Sincronizar datos al seleccionar unidad en el modal
  const handleSelectUnit = (unitNum) => {
    const audit = financialAuditMap[unitNum];
    if (audit) {
      const defaultType = audit.pendingDebt > 0 
        ? 'Certificado de Estado de Deuda y Liquidación Morosa'
        : 'Certificado de Gastos Comunes al Día (No Deuda)';

      setFormData(prev => ({
        ...prev,
        unitNumber: unitNum,
        applicantName: audit.owner || prev.applicantName,
        rut: audit.rut || prev.rut,
        email: audit.email || prev.email,
        phone: audit.phone || prev.phone,
        aliquotPercent: audit.aliquot || '6.250',
        type: prev.type === 'Certificado de Gastos Comunes al Día (No Deuda)' && audit.pendingDebt > 0 ? defaultType : prev.type,
        debtAmount: audit.pendingDebt || 0,
        retentionAmount: audit.pendingDebt || 0,
        debtBreakdown: {
          currentCharge: audit.currentCharge,
          previousDebt: audit.previousDebt,
          extraCharge: audit.extraCharge,
          repactedInstallment: audit.repactedInstallment
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, unitNumber: unitNum, debtAmount: 0, retentionAmount: 0 }));
    }
  };

  // Crear o emitir nuevo certificado
  const handleCreateCertificate = (e) => {
    e.preventDefault();
    if (!formData.applicantName || !formData.unitNumber) {
      showAlert(
        'Datos Incompletos',
        'Por favor ingrese el nombre del solicitante y el número de casa/unidad para emitir el certificado.',
        'warning'
      );
      return;
    }

    const audit = financialAuditMap[formData.unitNumber];
    const debtAmount = audit ? audit.pendingDebt : formData.debtAmount || 0;

    // Validación preventiva si intenta emitir "No Deuda" para una unidad con deuda
    if (formData.type.includes('No Deuda') && debtAmount > 0) {
      showConfirm({
        title: 'Advertencia Legal • Art. 20° Ley 21.442',
        message: `La Casa ${formData.unitNumber} registra una deuda activa de $${debtAmount.toLocaleString('es-CL')} en gastos comunes.\n\nEmitir una constancia de "No Deuda" incurre en falta reglamentaria salvo que se emita como "Certificado de Estado de Deuda y Liquidación Morosa".\n\n¿Desea cambiarlo automáticamente a Certificado de Estado de Deuda?`,
        type: 'danger',
        confirmText: 'Sí, cambiar a Certificado de Deuda',
        cancelText: 'Continuar de todos modos',
        onConfirm: () => {
          proceedIssuing({
            ...formData,
            type: 'Certificado de Estado de Deuda y Liquidación Morosa',
            debtAmount
          });
        }
      });
      return;
    }

    // Validación preventiva si intenta emitir salvoconducto de mudanza con deuda
    if (formData.type.includes('Mudanza') && debtAmount > 0) {
      showConfirm({
        title: 'Restricción de Salvoconducto de Mudanza',
        message: `La Casa ${formData.unitNumber} registra una deuda pendiente de $${debtAmount.toLocaleString('es-CL')}.\n\nEl Reglamento de Copropiedad y la práctica notarial exigen estar al día en gastos comunes antes de autorizar la salida de bienes.\n\n¿Desea emitir la autorización consignando expresamente la retención o compromiso de pago?`,
        type: 'warning',
        confirmText: 'Sí, Emitir con Constancia de Deuda',
        cancelText: 'Cancelar y Cobrar Antes',
        onConfirm: () => {
          proceedIssuing({ ...formData, debtAmount });
        }
      });
      return;
    }

    proceedIssuing({ ...formData, debtAmount });
  };

  const proceedIssuing = (certDataToSave) => {
    const year = new Date().getFullYear();
    const nextFolioNumber = communityCertificates.length + 1;
    const folio = `CERT-${year}-${String(nextFolioNumber).padStart(3, '0')}`;
    const verificationCode = `VRF-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const newCert = requestCertificate({
      communityName: currentCommunity?.name || 'Condominio',
      applicantName: certDataToSave.applicantName.trim(),
      rut: certDataToSave.rut.trim(),
      unitNumber: certDataToSave.unitNumber.toString(),
      email: certDataToSave.email.trim(),
      phone: certDataToSave.phone.trim(),
      type: certDataToSave.type,
      purpose: certDataToSave.purpose.trim() || 'Trámite Notarial / Bancario',
      date: new Date().toISOString().split('T')[0],
      status: certDataToSave.status,
      folio,
      verificationCode,
      debtAmount: certDataToSave.debtAmount || 0,
      retentionAmount: certDataToSave.retentionAmount || certDataToSave.debtAmount || 0,
      aliquotPercent: certDataToSave.aliquotPercent || '6.250',
      debtBreakdown: certDataToSave.debtBreakdown,
      notes: certDataToSave.notes.trim(),
      issuedBy: `${companySettings?.adminName || 'Administración ARANPRO'} (RNAC N° ${companySettings?.rnacNumber || '48.912'})`
    });

    setShowNewModal(false);
    setFormData({
      type: 'Certificado de Gastos Comunes al Día (No Deuda)',
      unitNumber: '',
      applicantName: '',
      rut: '',
      email: '',
      phone: '',
      purpose: '',
      notes: '',
      status: 'EMITIDO',
      debtAmount: 0,
      retentionAmount: 0,
      aliquotPercent: '',
      debtBreakdown: { currentCharge: 0, previousDebt: 0, extraCharge: 0, repactedInstallment: 0 }
    });

    if (newCert) {
      setPreviewCert(newCert);
    }
  };

  // Propuesta 4: Generador y Copiado de Cláusula Notarial 1-Click
  const generateNotaryClause = (cert) => {
    const communityName = cert.communityName || currentCommunity?.name || 'Condominio';
    const rnacNum = companySettings?.rnacNumber || '48.912';
    const applicantName = cert.applicantName || 'el copropietario';
    const rut = formatRut(cert.rut);
    const unit = cert.unitNumber;
    const folio = cert.folio || cert.id;
    const dateFormatted = formatDate(cert.date);
    const hash = cert.verificationCode || 'VRF-OK';

    if (cert.type.includes('Estado de Deuda')) {
      const debtFormatted = Number(cert.debtAmount || 0).toLocaleString('es-CL');
      return `CLÁUSULA DÉCIMO PRIMERA (DEUDA POR GASTOS COMUNES Y RETENCIÓN NOTARIAL):\n` +
        `Las partes comparecientes declaran expresamente conocer el Certificado Oficial de Estado de Deuda y Liquidación Morosa Folio N° ${folio} (Cód. Hash ${hash}), emitido con fecha ${dateFormatted} por la Administración del "${communityName}" (RUT ${companySettings?.companyRut || '76.999.888-1'}, RNAC Minvu N° ${rnacNum}), conforme a los Artículos 20° y 36° de la Ley N° 21.442 de Copropiedad Inmobiliaria. En dicho instrumento se certifica que la Unidad correspondiente a la Casa/Departamento N° ${unit}, perteneciente a don(a) ${applicantName} (RUT ${rut}), mantiene una deuda líquida y exigible por concepto de gastos comunes que asciende a la suma total de $${debtFormatted} pesos chilenos.\n\n` +
        `En cumplimiento del Artículo 36° de la Ley N° 21.442 —conforme al cual la obligación por los gastos comunes sigue siempre al dominio del inmueble, aun respecto de los devengados con anterioridad a su adquisición—, las partes acuerdan e instruyen expresamente al Notario Público autorizante retener del precio de venta la suma de $${debtFormatted} mediante Vale Vista Bancario emitido nominativamente a nombre de "${communityName}". Dicho documento será entregado a la Administración del condominio contra entrega del respectivo comprobante oficial de cancelación definitiva, liberando al nuevo adquirente de toda responsabilidad pecuniaria precedente.`;
    }

    if (cert.type.includes('No Deuda')) {
      return `CLÁUSULA DÉCIMO PRIMERA (GASTOS COMUNES ÍNTEGRAMENTE AL DÍA):\n` +
        `En cumplimiento de los Artículos 20° y 36° de la Ley N° 21.442 sobre Copropiedad Inmobiliaria, se inserta en este instrumento el Certificado Oficial Folio N° ${folio} (Cód. Hash ${hash}), emitido con fecha ${dateFormatted} por la Administración del "${communityName}" (RNAC Minvu N° ${rnacNum}), en el cual se certifica fehacientemente que la Unidad correspondiente a la Casa/Departamento N° ${unit}, de dominio de don(a) ${applicantName} (RUT ${rut}), se encuentra con sus obligaciones económicas y gastos comunes ordinarios, extraordinarios y fondo de reserva ÍNTEGRAMENTE AL DÍA a la fecha de la presente escritura, no registrando multas, intereses ni saldos pendientes de cobro a favor de la comunidad.`;
    }

    if (cert.type.includes('Mudanza') || cert.type.includes('Salvoconducto')) {
      return `CONSTANCIA DE MUDANZA Y SALVOCONDUCTO REGLAMENTARIO:\n` +
        `Se deja constancia formal de la agregación del Certificado de Salvoconducto y Autorización de Mudanza Folio N° ${folio} (Hash ${hash}) expedido por la Administración ARANPRO, el cual acredita que la Casa/Departamento N° ${unit} de "${communityName}" no adeuda gastos comunes, no registra daños a bienes comunes y cuenta con la respectiva autorización para efectuar el retiro y traslado de mobiliario conforme a los horarios del Reglamento de Copropiedad.`;
    }

    if (cert.type.includes('Alícuota') || cert.type.includes('Copropiedad')) {
      const aliquot = cert.aliquotPercent || (100 / (currentCommunity?.units?.length || 16)).toFixed(3);
      return `CONSTANCIA DE COPROPIEDAD Y ALÍCUOTA REGISTRAL (ART. 3° LEY 21.442):\n` +
        `Se inserta en la presente minuta el Certificado Oficial de Copropiedad y Alícuota Folio N° ${folio}, expedido por la Administración de "${communityName}", en que se acredita que la Casa/Departamento N° ${unit} goza de un porcentaje de prorrateo sobre los bienes comunes equivalente al ${aliquot}% y derecho de voto proporcional en asambleas ordinarias y extraordinarias conforme a la Ley N° 21.442.`;
    }

    return `CONSTANCIA NOTARIAL DE CERTIFICADO OFICIAL:\n` +
      `Se deja constancia de la agregación a la presente escritura del documento oficial "${cert.type}", Folio N° ${folio} (Cód. Hash ${hash}), expedido con fecha ${dateFormatted} por la Administración del "${communityName}".`;
  };

  const handleCopyNotaryClause = (cert) => {
    const clauseText = generateNotaryClause(cert);
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(clauseText);
    }
    setCopiedClauseFolio(cert.folio || cert.id);
    showAlert(
      '✓ Cláusula Notarial Copiada',
      `Se copió al portapapeles la cláusula legal en formato formal lista para ser insertada por el Notario o abogado redactor en la Escritura Pública de Compraventa conforme a la Ley N° 21.442.\n\n(Folio ${cert.folio || cert.id})`,
      'success'
    );
    setTimeout(() => setCopiedClauseFolio(null), 3500);
  };

  // Envío por WhatsApp con mensaje formal timbrado
  const handleSendWhatsApp = (cert) => {
    const phoneClean = (cert.phone || '').replace(/[^0-9]/g, '');
    const communityName = cert.communityName || currentCommunity?.name || 'Comunidad';
    const isDebtCert = cert.type.includes('Deuda') && !cert.type.includes('No Deuda');
    
    let msg = `*ADMINISTRACIÓN ARANPRO • CERTIFICADO OFICIAL*\n` +
      `Estimado(a) *${cert.applicantName}*,\n\n` +
      `Cumplimos con informar la emisión de su documento oficial:\n\n` +
      `📄 *Tipo:* ${cert.type}\n` +
      `🏠 *Unidad:* Casa / Depto ${cert.unitNumber} — ${communityName}\n` +
      `🔖 *Folio Oficial:* ${cert.folio || cert.id}\n` +
      `🔑 *Cód. Verificación:* ${cert.verificationCode || 'VRF-OK'}\n` +
      `📅 *Fecha de Emisión:* ${formatDate(cert.date)}\n` +
      `🏛️ *Finalidad:* ${cert.purpose || 'Trámite Notarial / Bancario'}\n` +
      `⚖️ *Base Legal:* Ley N° 21.442 • Arts. 17°, 20° y 36°\n`;

    if (isDebtCert && cert.debtAmount > 0) {
      msg += `💰 *Deuda Liquidada:* $${Number(cert.debtAmount).toLocaleString('es-CL')} (Instrucción de retención en Notaría según Art. 36°)\n`;
    }

    msg += `🌐 *Verificación Notarial:* https://portalnet.cl/verificar?folio=${cert.folio || cert.id}\n` +
      `🏢 *Emitido por:* ${companySettings?.companyName || 'ARANPRO SpA'} (RNAC N° ${companySettings?.rnacNumber || '48.912'})\n\n` +
      `El documento cuenta con timbre digital y se encuentra debidamente validado para su presentación.`;

    const url = phoneClean ? `https://wa.me/${phoneClean}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // Impresión directa Carta vía printDocumentDirectly
  const handlePrintCertificate = (cert) => {
    const typeClean = (cert.type || 'Certificado').replace(/[^a-zA-Z0-9]/g, '_');
    const folioClean = (cert.folio || cert.id || 'FOLIO').replace(/[^a-zA-Z0-9]/g, '_');
    const unitClean = (cert.unitNumber || 'Unidad').replace(/[^a-zA-Z0-9]/g, '_');
    const commClean = (cert.communityName || currentCommunity?.name || 'Condominio').replace(/[^a-zA-Z0-9]/g, '_');
    const dateClean = (cert.date || new Date().toISOString().slice(0, 10)).replace(/[^0-9]/g, '');
    const filename = `ARANPRO_${typeClean}_Folio_${folioClean}_Casa_${unitClean}_${commClean}_${dateClean}`;
    printDocumentDirectly('printable-official-certificate', filename, {
      pageSize: 'letter portrait',
      fitPage: true,
      margin: '8mm 10mm 8mm 10mm'
    });
  };

  // Exportar el registro a CSV para cuenta documentada
  const handleExportCSV = () => {
    if (communityCertificates.length === 0) {
      showAlert('Sin Registros', 'No existen certificados registrados para exportar.', 'info');
      return;
    }

    const headers = ['Folio', 'Fecha', 'Tipo de Certificado', 'Casa/Unidad', 'Solicitante', 'RUT', 'Monto Deuda', 'Finalidad', 'Estado', 'Cod_Verificacion'];
    const rows = communityCertificates.map(c => [
      `"${c.folio || c.id}"`,
      `"${c.date || ''}"`,
      `"${c.type || ''}"`,
      `"Casa ${c.unitNumber || ''}"`,
      `"${c.applicantName || ''}"`,
      `"${c.rut || ''}"`,
      `"${c.debtAmount || 0}"`,
      `"${(c.purpose || '').replace(/"/g, '""')}"`,
      `"${c.status || ''}"`,
      `"${c.verificationCode || ''}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Registro_Certificados_${currentCommunity?.name || 'Condominio'}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full space-y-6">
      {/* 1. CABECERA CORPORATIVA ARANPRO */}
      <div className="bg-gradient-to-r from-[#0F3D2E] via-[#144D3A] to-[#0A291F] text-white p-6 md:p-8 rounded-3xl shadow-lg border border-emerald-900/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4B895]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#D4B895]/20 text-[#D4B895] border border-[#D4B895]/30">
                <ShieldCheck className="w-3.5 h-3.5 text-[#D4B895]" />
                LEY N° 21.442 • ARTS. 17°, 20° Y 36°
              </span>
              <span className="text-xs text-emerald-200/80 font-medium">
                {currentCommunity?.name || 'Condominio'}
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              Certificados & Acreditaciones Comunitarias
            </h2>
            <p className="text-xs md:text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
              Emisión formal de certificados de <strong>No Deuda</strong>, <strong>Estado de Deuda Morosa (Art. 36°)</strong>,
              <strong> Salvoconductos de Mudanza</strong> y <strong>Alícuota de Copropiedad</strong> para notarías y bancos,
              con verificación en línea y cláusula notarial de 1-clic.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 active:scale-95 transition-all"
              title="Descargar libro foliado de certificados en formato CSV / Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#D4B895]" />
              Exportar Registro
            </button>
            <button
              onClick={() => setShowNewModal(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#D4B895] to-[#C2A37D] text-[#0F3D2E] font-bold text-sm shadow-md hover:brightness-105 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 text-[#0F3D2E]" />
              + Emitir Certificado Inmediato
            </button>
          </div>
        </div>
      </div>

      {/* 2. KPIS Y AUDITORÍA EN TIEMPO REAL */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* KPI 1: Solicitudes pendientes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-[#D4B895]/50 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Solicitudes Pendientes
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.pending}</div>
          <p className="text-[11px] text-amber-700 font-medium mt-1">
            {stats.pending > 0 ? 'Esperando firma y validación' : 'Todo al día'}
          </p>
        </div>

        {/* KPI 2: Certificados emitidos */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Certificados Emitidos
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#0F3D2E]">{stats.issued}</div>
          <p className="text-[11px] text-emerald-700 font-medium mt-1">
            Con folio y timbre digital
          </p>
        </div>

        {/* KPI 3: Unidades al día auditadas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Unidades al Día (Auditoría)
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {stats.upToDatePercent}% <span className="text-xs font-semibold text-slate-400">({stats.upToDateUnits}/{stats.totalUnits})</span>
          </div>
          <p className="text-[11px] text-blue-700 font-medium mt-1">
            {stats.unitsWithDebt > 0 ? `${stats.unitsWithDebt} con deuda para liquidar` : '100% al día'}
          </p>
        </div>

        {/* KPI 4: Trámites Notariales y Bancarios */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-[#0F3D2E]/30 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Trámites Notariales / CBR
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.notarialCount}</div>
          <p className="text-[11px] text-purple-700 font-medium mt-1">
            Compraventas, créditos y mudanzas
          </p>
        </div>
      </div>

      {/* 3. FILTROS RÁPIDOS (PILLS) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
            filterType === 'all'
              ? 'bg-[#0F3D2E] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Todos ({communityCertificates.length})
        </button>

        {CERTIFICATE_TYPES.map(t => {
          const count = communityCertificates.filter(c => c.type === t.id).length;
          const isActive = filterType === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setFilterType(t.id)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-[#0F3D2E] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{t.shortName}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. BARRA DE BÚSQUEDA Y FILTROS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por solicitante, RUT, casa, folio o finalidad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E] focus:border-transparent transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Filtro por Estado */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
          >
            <option value="all">Todos los Estados</option>
            <option value="SOLICITADO">Pendientes de Firma ({stats.pending})</option>
            <option value="EMITIDO">Emitidos y Válidos ({stats.issued})</option>
          </select>
        </div>
      </div>

      {/* 5. TABLA CORPORATIVA DE CERTIFICADOS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0F3D2E]/5 border-b border-slate-200 text-[#0F3D2E] font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Folio & Estado</th>
                <th className="px-5 py-3.5">Unidad & Solicitante</th>
                <th className="px-5 py-3.5">Tipo de Certificado</th>
                <th className="px-5 py-3.5">Finalidad / Trámite</th>
                <th className="px-5 py-3.5">Fecha</th>
                <th className="px-5 py-3.5 text-center">Estado Financiero (Art. 20°/36°)</th>
                <th className="px-5 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCertificates.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-12 text-center text-slate-400">
                    <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2 stroke-[1.5]" />
                    <p className="text-sm font-semibold text-slate-600">No se encontraron certificados</p>
                    <p className="text-xs text-slate-400 mt-1">Utilice el botón superior para emitir un certificado oficial.</p>
                  </td>
                </tr>
              ) : (
                filteredCertificates.map((cert) => {
                  const audit = financialAuditMap[cert.unitNumber];
                  const hasDebt = audit && audit.pendingDebt > 0;
                  const isDebtCert = cert.type.includes('Deuda') && !cert.type.includes('No Deuda');
                  const isMudanzaCert = cert.type.includes('Mudanza');
                  const isAliquotCert = cert.type.includes('Alícuota');

                  return (
                    <tr key={cert.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Folio & Estado */}
                      <td className="px-5 py-4">
                        <div className="font-mono font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <span>{cert.folio || cert.id}</span>
                          <button
                            onClick={() => setVerifyingCert(cert)}
                            className="text-slate-400 hover:text-[#0F3D2E] transition-colors"
                            title="Verificar en línea en el portal público"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            cert.status === 'EMITIDO'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                            {cert.status === 'EMITIDO' ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Clock className="w-3 h-3 text-amber-600" />
                            )}
                            {cert.status}
                          </span>
                          {cert.verificationCode && (
                            <button
                              onClick={() => setVerifyingCert(cert)}
                              className="text-[10px] font-mono text-slate-400 hover:text-[#0F3D2E] font-medium underline"
                              title="Verificar integridad de este código hash"
                            >
                              {cert.verificationCode}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Unidad & Solicitante */}
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-mono">
                            Casa {cert.unitNumber}
                          </span>
                          <span className="truncate max-w-[170px]">{cert.applicantName}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {formatRut(cert.rut)}
                        </div>
                        {cert.email && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[190px]">
                            {cert.email}
                          </div>
                        )}
                      </td>

                      {/* Tipo de Certificado */}
                      <td className="px-5 py-4 max-w-xs">
                        <div className="font-bold text-[#0F3D2E] flex items-center gap-1.5">
                          {isDebtCert ? (
                            <Scale className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          ) : isMudanzaCert ? (
                            <Truck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          ) : isAliquotCert ? (
                            <Percent className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          ) : (
                            <ShieldCheck className="w-3.5 h-3.5 text-[#D4B895] shrink-0" />
                          )}
                          <span>{cert.type}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {isDebtCert
                            ? 'Ley 21.442 • Arts. 20° y 36° (Responsabilidad Nuevo Dueño)'
                            : isMudanzaCert
                            ? 'Reglamento Interno & Ley de Arrendamiento'
                            : isAliquotCert
                            ? 'Ley 21.442 • Art. 3° (Derechos sobre Bienes Comunes)'
                            : 'Ley 21.442 • Copropiedad Inmobiliaria'}
                        </div>
                      </td>

                      {/* Finalidad */}
                      <td className="px-5 py-4 max-w-xs">
                        <div className="text-slate-700 font-medium line-clamp-2">
                          {cert.purpose || 'Trámite Notarial / Bancario'}
                        </div>
                      </td>

                      {/* Fecha */}
                      <td className="px-5 py-4 text-slate-500 whitespace-nowrap">
                        {formatDate(cert.date)}
                      </td>

                      {/* Estado Financiero */}
                      <td className="px-5 py-4 text-center">
                        {isDebtCert || (cert.debtAmount && cert.debtAmount > 0) ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              Deuda: ${Number(cert.debtAmount || 0).toLocaleString('es-CL')}
                            </span>
                            <span className="block text-[9px] text-slate-400">
                              A retener en Notaría
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Check className="w-3 h-3 text-emerald-600" />
                            Al Día (Sin deuda)
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Propuesta 4: Copiar Cláusula Notarial */}
                          <button
                            onClick={() => handleCopyNotaryClause(cert)}
                            className="p-1.5 bg-amber-50 hover:bg-amber-600 hover:text-white text-amber-800 rounded-xl transition-all"
                            title="Copiar Cláusula Notarial para la Escritura Pública"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          {/* Validar y emitir si está solicitado */}
                          {cert.status !== 'EMITIDO' && (
                            <button
                              onClick={() => {
                                updateCertificateStatus(cert.id, 'EMITIDO', {
                                  issuedBy: `${companySettings?.adminName || 'Administración ARANPRO'} (RNAC N° 48.912)`
                                });
                              }}
                              className="px-2.5 py-1.5 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1"
                              title="Aprobar y Emitir Certificado"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Validar
                            </button>
                          )}

                          {/* Ver / Imprimir PDF */}
                          <button
                            onClick={() => setPreviewCert(cert)}
                            className="p-1.5 bg-slate-100 hover:bg-[#0F3D2E] hover:text-white text-slate-700 rounded-xl transition-all"
                            title="Vista Previa e Impresión Notarial PDF (Carta)"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Enviar WhatsApp */}
                          <button
                            onClick={() => handleSendWhatsApp(cert)}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 rounded-xl transition-all"
                            title="Enviar por WhatsApp al Solicitante"
                          >
                            <Send className="w-4 h-4" />
                          </button>

                          {/* Eliminar (con modal corporativo ARANPRO) */}
                          <button
                            onClick={() => {
                              showConfirm({
                                title: '¿Eliminar Certificado Oficial?',
                                message: `¿Está seguro de eliminar del registro el certificado folio ${cert.folio || cert.id} emitido a don(a) ${cert.applicantName}?\n\nEsta acción es irreversible y quedará registrada en la bitácora de administración.`,
                                type: 'danger',
                                confirmText: 'Sí, Eliminar Certificado',
                                cancelText: 'Conservar',
                                onConfirm: () => {
                                  deleteCertificate(cert.id);
                                }
                              });
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                            title="Eliminar del Registro"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. MODAL DE EMISIÓN ASISTIDA / DIRECTA */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowNewModal(false)}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#0F3D2E]/10 text-[#0F3D2E] flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-[#0F3D2E]" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-[#D4B895] uppercase tracking-wider">
                  Ley N° 21.442 • Fe Pública Inmobiliaria
                </span>
                <h3 className="text-xl font-black text-slate-900">
                  Emitir Certificado Inmediato
                </h3>
              </div>
            </div>

            <form onSubmit={handleCreateCertificate} className="space-y-4">
              {/* Tipo de Certificado */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tipo de Certificado Oficial
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                >
                  {CERTIFICATE_TYPES.map(t => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  {CERTIFICATE_TYPES.find(t => t.id === formData.type)?.useCase}
                </p>
              </div>

              {/* Selector de Unidad y Auditoría en vivo */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Unidad / Casa del Condominio
                  </label>
                  {formData.unitNumber && financialAuditMap[formData.unitNumber] && (
                    financialAuditMap[formData.unitNumber].isFullyPaid ? (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        ✅ Unidad al Día (Sin Deuda)
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                        ⚠️ Registra Deuda de ${financialAuditMap[formData.unitNumber].pendingDebt.toLocaleString('es-CL')}
                      </span>
                    )
                  )}
                </div>

                <select
                  value={formData.unitNumber}
                  onChange={(e) => handleSelectUnit(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                  required
                >
                  <option value="">-- Seleccione Casa o Departamento --</option>
                  {(currentCommunity?.units || []).map(u => {
                    const fin = financialAuditMap[u.number];
                    return (
                      <option key={u.id} value={u.number}>
                        Casa {u.number} — {u.owner} {fin?.pendingDebt > 0 ? `(Deuda: $${fin.pendingDebt.toLocaleString('es-CL')})` : '(Al Día)'}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Banner Asistido si la unidad tiene deuda y seleccionó certificado de deuda */}
              {formData.type.includes('Estado de Deuda') && (
                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                    <Scale className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Liquidación de Deuda para Notaría y Nuevo Dueño (Art. 36°)</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Este certificado individualiza el saldo moroso exacto para que el Notario o Banco realice la
                    <strong> retención mediante Vale Vista</strong> en la compraventa, o para que el nuevo propietario
                    asuma formalmente la deuda según la ley.
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-amber-700 block">Deuda Morosa Total</span>
                      <input
                        type="number"
                        value={formData.debtAmount}
                        onChange={(e) => setFormData(prev => ({ ...prev, debtAmount: Number(e.target.value), retentionAmount: Number(e.target.value) }))}
                        className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-slate-900 font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-amber-700 block">Monto a Retener (Vale Vista)</span>
                      <input
                        type="number"
                        value={formData.retentionAmount}
                        onChange={(e) => setFormData(prev => ({ ...prev, retentionAmount: Number(e.target.value) }))}
                        className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-slate-900 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Banner Asistido si es Alícuota de Copropiedad */}
              {formData.type.includes('Alícuota') && (
                <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                    <Percent className="w-4 h-4 text-indigo-700 shrink-0" />
                    <span>Acreditación de Prorrateo de Copropiedad (Art. 3° Ley 21.442)</span>
                  </div>
                  <p className="text-[11px] text-indigo-800 leading-relaxed">
                    Certifica el porcentaje exacto de derechos de la unidad sobre los bienes de dominio común (terreno, muros, techumbre, accesos y equipamiento) para fines de tasación bancaria y créditos hipotecarios.
                  </p>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-indigo-700 block mb-1">Porcentaje de Alícuota / Prorrateo</span>
                    <input
                      type="text"
                      value={formData.aliquotPercent}
                      onChange={(e) => setFormData(prev => ({ ...prev, aliquotPercent: e.target.value }))}
                      placeholder="Ej: 6.250%"
                      className="w-full px-3 py-1.5 bg-white border border-indigo-300 rounded-lg text-xs font-bold text-slate-900 font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Advertencia preventiva si tiene deuda y es cert no deuda */}
              {formData.type.includes('No Deuda') && formData.unitNumber && financialAuditMap[formData.unitNumber]?.pendingDebt > 0 && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-2">
                  <div className="font-bold flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      Advertencia Ley N° 21.442 • Art. 20°
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        type: 'Certificado de Estado de Deuda y Liquidación Morosa',
                        debtAmount: financialAuditMap[formData.unitNumber].pendingDebt,
                        retentionAmount: financialAuditMap[formData.unitNumber].pendingDebt
                      }))}
                      className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] shadow-xs transition-all"
                    >
                      Cambiar a Certificado de Deuda
                    </button>
                  </div>
                  <p className="leading-relaxed">
                    La Casa {formData.unitNumber} mantiene una deuda activa de <strong>${financialAuditMap[formData.unitNumber].pendingDebt.toLocaleString('es-CL')}</strong>.
                    Para compraventas y estudios de títulos con deuda, la ley exige emitir el Certificado de Estado de Deuda.
                  </p>
                </div>
              )}

              {/* Datos del Solicitante */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nombre del Solicitante / Titular
                  </label>
                  <input
                    type="text"
                    value={formData.applicantName}
                    onChange={(e) => setFormData(prev => ({ ...prev, applicantName: e.target.value }))}
                    placeholder="Ej: Carlos Morales Rojas"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    RUT del Solicitante
                  </label>
                  <input
                    type="text"
                    value={formData.rut}
                    onChange={(e) => setFormData(prev => ({ ...prev, rut: e.target.value }))}
                    placeholder="12.345.678-9"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                    required
                  />
                </div>
              </div>

              {/* Contacto */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="nombre@correo.cl"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+56 9 8765 4321"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                  />
                </div>
              </div>

              {/* Finalidad / Trámite Requerido */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Finalidad / Entidad Receptora
                </label>
                <input
                  type="text"
                  value={formData.purpose}
                  onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                  placeholder="Ej: Notaría de La Serena / Estudio de Título Compraventa / Banco Santander / Mudanza"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                />
              </div>

              {/* Observaciones Legales Adicionales */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Notas / Cláusula Adicional (Opcional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  placeholder="Instrucción de retención bancaria, fecha y hora autorizada de mudanza o alícuota..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
                >
                  <Award className="w-4 h-4 text-[#D4B895]" />
                  Emitir y Generar Documento Oficial
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL DE VISTA PREVIA E IMPRESIÓN OFICIAL NOTARIAL (TAMAÑO CARTA) */}
      {previewCert && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col relative">
            {/* Barra de Acciones del Documento */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 mb-6">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-[#0F3D2E] text-white flex items-center justify-center font-bold text-sm">
                  ⚖️
                </span>
                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    Vista Notarial de Certificado Oficial
                  </h4>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {previewCert.folio || previewCert.id} • {previewCert.type}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Propuesta 4: Copiar Cláusula para Escritura Notarial */}
                <button
                  onClick={() => handleCopyNotaryClause(previewCert)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs shadow-xs transition-all active:scale-95"
                  title="Copiar texto formal para insertar en la escritura pública notarial"
                >
                  <Copy className="w-3.5 h-3.5 text-amber-700" />
                  Copiar Cláusula Notarial
                </button>

                {/* Propuesta 3: Verificación Pública Express */}
                <button
                  onClick={() => setVerifyingCert(previewCert)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all"
                  title="Abrir vista pública de verificación para Notaría o Banco"
                >
                  <QrCode className="w-3.5 h-3.5 text-[#0F3D2E]" />
                  Verificar QR
                </button>

                <button
                  onClick={() => handlePrintCertificate(previewCert)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs shadow-xs transition-all active:scale-95"
                >
                  <Printer className="w-4 h-4 text-[#D4B895]" />
                  Imprimir / PDF Oficial (Carta)
                </button>

                <button
                  onClick={() => handleSendWhatsApp(previewCert)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  WhatsApp
                </button>

                <button
                  onClick={() => {
                    const typeClean = (previewCert.type || 'Certificado').replace(/[^a-zA-Z0-9]/g, '_');
                    const folioClean = (previewCert.folio || previewCert.id || 'FOLIO').replace(/[^a-zA-Z0-9]/g, '_');
                    const unitClean = (previewCert.unitNumber || 'Unidad').replace(/[^a-zA-Z0-9]/g, '_');
                    const commClean = (previewCert.communityName || currentCommunity?.name || 'Condominio').replace(/[^a-zA-Z0-9]/g, '_');
                    const dateClean = (previewCert.date || new Date().toISOString().slice(0, 10)).replace(/[^0-9]/g, '');
                    downloadHtmlDocument('printable-official-certificate', `ARANPRO_${typeClean}_Folio_${folioClean}_Casa_${unitClean}_${commClean}_${dateClean}.html`);
                  }}
                  className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs transition-all"
                  title="Descargar copia HTML"
                >
                  <Download className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setPreviewCert(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* CONTENEDOR DEL DOCUMENTO CARTA IMPRIMIBLE */}
            <div className="overflow-y-auto flex-1 pr-1">
              <div
                id="printable-official-certificate"
                className="bg-white p-8 md:p-12 border border-slate-300 rounded-2xl shadow-xs max-w-3xl mx-auto space-y-6 text-slate-900"
                style={{ minHeight: '840px', fontFamily: 'system-ui, -apple-system, sans-serif' }}
              >
                {/* Membrete Corporativo Maestro ARANPRO */}
                <div className="flex items-start justify-between border-b-2 border-[#0F3D2E] pb-5">
                  <div className="flex items-center space-x-3.5">
                    <AranproLogo className="h-11 w-auto" />
                    <div className="space-y-0.5">
                      <div className="text-sm font-black tracking-tight text-[#0F3D2E] uppercase">
                        {companySettings?.companyName || 'ARANPRO • GESTIÓN INTEGRAL INMOBILIARIA'}
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono">
                        RUT: {companySettings?.companyRut || '76.999.888-1'} • RNAC MINVU N° {companySettings?.rnacNumber || '48.912'}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {companySettings?.email || 'contacto@aranpro.cl'} • {companySettings?.phone || '+56 9 5811 8504'} • {companySettings?.website || 'www.aranpro.cl'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <span className="inline-block px-3 py-1 bg-[#0F3D2E]/10 text-[#0F3D2E] text-[10px] font-mono font-bold rounded-md border border-[#0F3D2E]/20">
                      FOLIO: {previewCert.folio || previewCert.id}
                    </span>
                    <p className="text-[11px] font-bold text-slate-800">
                      {previewCert.communityName || currentCommunity?.name || 'Condominio'}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      RUT Comunidad: {currentCommunity?.rut || '65.123.456-7'}
                    </p>
                    <p className="text-[10px] text-slate-500 max-w-xs">
                      {currentCommunity?.address || 'La Serena, Región de Coquimbo'}
                    </p>
                  </div>
                </div>

                {/* Título Principal Notarial */}
                <div className="text-center py-3">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#D4B895]">
                    REPÚBLICA DE CHILE • LEY N° 21.442 DE COPROPIEDAD INMOBILIARIA
                  </span>
                  <h1 className="text-xl md:text-2xl font-black text-[#0F3D2E] uppercase mt-1 tracking-tight">
                    {previewCert.type}
                  </h1>
                  <div className="w-24 h-1 bg-[#D4B895] mx-auto mt-2 rounded-full"></div>
                </div>

                {/* Individualización de la Unidad y Solicitante */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Inmueble / Unidad</span>
                    <span className="font-bold text-slate-900 text-sm">Casa / Depto {previewCert.unitNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Titular / Solicitante</span>
                    <span className="font-bold text-slate-900">{previewCert.applicantName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">RUT Titular</span>
                    <span className="font-mono font-semibold text-slate-800">{formatRut(previewCert.rut)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Fecha de Expedición</span>
                    <span className="font-semibold text-slate-800">{formatDate(previewCert.date)}</span>
                  </div>
                </div>

                {/* Cuerpo Legal Formal Certificatorio */}
                <div className="text-justify text-xs md:text-sm text-slate-800 leading-relaxed space-y-4">
                  <p>
                    La Administración de la Comunidad <strong>"{previewCert.communityName || currentCommunity?.name}"</strong>,
                    en uso de las atribuciones legales que le confieren los <strong>Artículos 17°, 20° y 36° de la Ley N° 21.442</strong> sobre
                    Copropiedad Inmobiliaria y el respectivo Reglamento de Copropiedad:
                  </p>

                  <div className="p-4 bg-[#0F3D2E]/5 rounded-xl border-l-4 border-[#0F3D2E] space-y-2">
                    <p className="font-black text-[#0F3D2E] uppercase tracking-wide text-xs">
                      DECLARA Y CERTIFICA SOLEMNEMENTE:
                    </p>

                    {/* Caso 1: Certificado de No Deuda (Al Día) */}
                    {previewCert.type.includes('No Deuda') && (
                      <p>
                        Que revisados los registros contables, la cuenta bancaria de la comunidad y la última liquidación de gastos comunes
                        aprobada, el inmueble correspondiente a la <strong>Casa / Departamento N° {previewCert.unitNumber}</strong>, de propiedad o
                        ocupación de don(a) <strong>{previewCert.applicantName}</strong> (RUT {formatRut(previewCert.rut)}),
                        <span className="text-[#0F3D2E] font-bold">
                          {' '}se encuentra ÍNTEGRAMENTE AL DÍA en el pago de los gastos comunes ordinarios, gastos comunes extraordinarios y fondo de reserva devengados a la fecha, no registrando multas, intereses ni saldos deudores pendientes de cobro conforme a la Ley N° 21.442.
                        </span>
                      </p>
                    )}

                    {/* Caso 2: Certificado de Deuda y Liquidación Morosa (Art. 36°) */}
                    {previewCert.type.includes('Estado de Deuda') && (
                      <div className="space-y-3">
                        <p>
                          Que revisados los estados contables oficiales de la copropiedad, el inmueble individualizado como
                          <strong> Casa / Departamento N° {previewCert.unitNumber}</strong>, a nombre de don(a)
                          <strong> {previewCert.applicantName}</strong> (RUT {formatRut(previewCert.rut)}),
                          <span className="text-rose-700 font-bold">
                            {' '}REGISTRA A LA FECHA UNA DEUDA ACTIVA Y EXIGIBLE POR CONCEPTO DE GASTOS COMUNES que asciende a la suma total de ${Number(previewCert.debtAmount || 0).toLocaleString('es-CL')} pesos chilenos.
                          </span>
                        </p>

                        {/* Cuadro de Desglose de Deuda Notarial */}
                        <div className="bg-white p-3 rounded-lg border border-slate-200">
                          <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1.5">
                            Liquidación Oficial de Saldos Deudores Exigibles (Art. 20° Ley 21.442)
                          </span>
                          <table className="w-full text-xs">
                            <tbody>
                              <tr className="border-b border-slate-100">
                                <td className="py-1 text-slate-600">Gastos Comunes Ordinarios y Fondo de Reserva:</td>
                                <td className="py-1 text-right font-mono font-bold text-slate-900">
                                  ${Number(previewCert.debtAmount || 0).toLocaleString('es-CL')}
                                </td>
                              </tr>
                              <tr className="border-b border-slate-100">
                                <td className="py-1 text-slate-600">Intereses y Recargos Legales (Art. 27°):</td>
                                <td className="py-1 text-right font-mono text-slate-600">$0</td>
                              </tr>
                              <tr className="font-bold text-slate-900 bg-slate-50">
                                <td className="py-1.5 px-2">TOTAL MOROSO EXIGIBLE A LA FECHA:</td>
                                <td className="py-1.5 px-2 text-right font-mono text-rose-700 text-sm">
                                  ${Number(previewCert.debtAmount || 0).toLocaleString('es-CL')}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* Advertencia Legal Expresa al Nuevo Dueño Art. 36° */}
                        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-xs space-y-1">
                          <p className="font-bold">
                            ⚠️ ADVERTENCIA LEGAL AL ADQUIRENTE, BANCO Y NOTARÍA (ART. 36° LEY N° 21.442):
                          </p>
                          <p className="leading-relaxed text-[11px]">
                            "La obligación del propietario por los gastos comunes sigue siempre al dominio de su unidad, aun respecto de los devengados antes de su adquisición."
                            En caso de compraventa o cesión, si el saldo deudor no es retenido ni cancelado oportunamente,
                            <strong> el nuevo adquirente responderá íntegra y solidariamente de la deuda precedente ante la comunidad.</strong>
                          </p>
                        </div>

                        {/* Instrucción de Retención Notarial */}
                        <p className="text-xs font-semibold text-slate-900">
                          📌 INSTRUCCIÓN DE RETENCIÓN NOTARIAL: Se instruye formalmente a la Notaría y entidad otorgante del crédito hipotecario retener la suma de 
                          <span className="font-mono font-bold text-rose-700"> ${Number(previewCert.debtAmount || 0).toLocaleString('es-CL')} </span> 
                          mediante Vale Vista Bancario a nombre de "{previewCert.communityName || currentCommunity?.name}" al momento de suscribir la escritura pública.
                        </p>
                      </div>
                    )}

                    {/* Caso 3: Salvoconducto y Desalojo / Mudanza (Propuesta 1) */}
                    {previewCert.type.includes('Mudanza') && (
                      <div className="space-y-2">
                        <p>
                          Que conforme a las disposiciones del Reglamento de Copropiedad Interno y la Ley N° 21.442, se
                          <strong> AUTORIZA EL TRASLADO DE BIENES MUEBLES Y MUDANZA</strong> correspondiente a la
                          <strong> Casa / Departamento N° {previewCert.unitNumber}</strong>, a nombre de don(a)
                          <strong> {previewCert.applicantName}</strong> (RUT {formatRut(previewCert.rut)}), certificando fehacientemente:
                        </p>
                        <ul className="list-disc pl-5 space-y-1 text-xs">
                          <li>Que la unidad se encuentra con sus obligaciones económicas y gastos comunes al día a la fecha.</li>
                          <li>Que no registra multas pendientes ni daños ocasionados a bienes de dominio común (portones, ascensores, áreas comunes).</li>
                          <li>Que se ha coordinado el protocolo de resguardo y protección de accesos vehiculares y peatonales.</li>
                        </ul>
                        <p className="text-[11px] text-slate-600 font-semibold bg-white p-2 rounded border border-slate-200">
                          Horario de Mudanza Autorizado: Lunes a Viernes de 09:00 a 18:00 hrs. Sábados de 09:00 a 14:00 hrs. Domingos y festivos prohibido.
                        </p>
                      </div>
                    )}

                    {/* Caso 4: Alícuota y Copropiedad (Propuesta 2) */}
                    {previewCert.type.includes('Alícuota') && (
                      <div className="space-y-2">
                        <p>
                          Que de acuerdo con los títulos de dominio y el plano de copropiedad inscrito en el Conservador de Bienes Raíces respectivo,
                          la <strong>Casa / Departamento N° {previewCert.unitNumber}</strong>, perteneciente a don(a)
                          <strong> {previewCert.applicantName}</strong> (RUT {formatRut(previewCert.rut)}), forma parte de esta copropiedad legalmente constituida.
                        </p>
                        <div className="bg-white p-3 rounded-lg border border-slate-200 grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-[10px] uppercase text-slate-400 block font-bold">Porcentaje de Alícuota / Prorrateo</span>
                            <span className="text-sm font-black text-[#0F3D2E] font-mono">{previewCert.aliquotPercent || '6.250'}%</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase text-slate-400 block font-bold">Destino del Inmueble</span>
                            <span className="font-bold text-slate-800">Habitacional Residencial</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase text-slate-400 block font-bold">Fondo de Reserva Legal (Art. 6°)</span>
                            <span className="font-bold text-slate-800">5.0% sobre gasto común</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase text-slate-400 block font-bold">Ponderación en Asambleas (Art. 15°)</span>
                            <span className="font-bold text-slate-800">{previewCert.aliquotPercent || '6.250'}% de derecho a voto</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Caso 5: Residencia */}
                    {previewCert.type.includes('Residencia') && (
                      <p>
                        Que conforme al <strong>Registro Oficial de Copropietarios y Residentes</strong> establecido en el Artículo 17° inciso 2
                        de la Ley N° 21.442, don(a) <strong>{previewCert.applicantName}</strong> (RUT {formatRut(previewCert.rut)}) mantiene
                        domicilio real y residencia habitual y continua en la <strong>Casa / Departamento N° {previewCert.unitNumber}</strong> de este condominio,
                        habitando en dicho predio en calidad de copropietario(a) u ocupante legítimo(a).
                      </p>
                    )}

                    {/* Caso 6: Comité */}
                    {previewCert.type.includes('Comité') && (
                      <p>
                        Que de conformidad con el Artículo 17° de la Ley N° 21.442 y el acta de Asamblea General de Copropietarios debidamente protocolizada,
                        don(a) <strong>{previewCert.applicantName}</strong> (RUT {formatRut(previewCert.rut)}) es <strong>MIEMBRO TITULAR Y ACTIVO DEL COMITÉ DE ADMINISTRACIÓN</strong> de
                        la presente copropiedad, encontrándose plenamente habilitado(a) para suscribir documentos oficiales, gestionar cuentas bancarias
                        y representar a la comunidad ante instituciones públicas y privadas.
                      </p>
                    )}

                    {/* Caso 7: Buena Convivencia */}
                    {previewCert.type.includes('Buena Convivencia') && (
                      <p>
                        Que revisado el Libro Oficial de Sugerencias y Reclamos y el registro de sanciones de la copropiedad,
                        los residentes de la <strong>Casa / Departamento N° {previewCert.unitNumber}</strong> han mantenido una conducta intachable,
                        observando fielmente las normas de convivencia vecinal y el Reglamento Interno, no registrando a la fecha
                        sanciones ni multas ejecutoriadas por ruidos molestos u otras faltas reglamentarias.
                      </p>
                    )}
                  </div>

                  <p>
                    El presente certificado se expide a solicitud de la parte interesada para ser presentado ante:
                    <strong> {previewCert.purpose || 'Notaría, Conservador de Bienes Raíces o Instituciones Financieras'}</strong>.
                  </p>

                  {previewCert.notes && (
                    <p className="text-slate-600 italic bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                      Nota adicional: {previewCert.notes}
                    </p>
                  )}

                  <p className="text-[11px] text-slate-500">
                    <strong>Vigencia Legal:</strong> Este certificado tiene una validez de treinta (30) días corridos a contar de su fecha de emisión,
                    conforme a las prácticas registrales, bancarias y notariales de la República de Chile.
                  </p>
                </div>

                {/* Sección de Firmas, Timbre y Validación Notarial */}
                <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 items-end">
                  {/* Firma de la Administración */}
                  <div className="text-center space-y-2">
                    <div className="h-20 flex items-center justify-center gap-3">
                      {companySettings?.signatureDataUrl ? (
                        <img 
                          src={companySettings.signatureDataUrl} 
                          alt="Firma Representante Legal" 
                          className="max-h-20 max-w-[180px] object-contain drop-shadow-xs" 
                        />
                      ) : (
                        <div className="text-[11px] font-serif italic text-slate-400">
                          {companySettings?.adminName || 'Firma de la Administración'}
                        </div>
                      )}
                      {/* Timbre Digital Simulado */}
                      <div className="border-2 border-dashed border-[#0F3D2E] rounded-full w-24 h-14 flex flex-col items-center justify-center p-1 bg-[#0F3D2E]/5 shrink-0">
                        <span className="text-[7px] font-black text-[#0F3D2E] uppercase">TIMBRE DIGITAL</span>
                        <span className="text-[8.5px] font-bold text-[#0F3D2E]">ARANPRO SpA</span>
                        <span className="text-[7px] text-[#0F3D2E]">RNAC N° {companySettings?.rnacNumber || '48.912'}</span>
                      </div>
                    </div>
                    <div className="border-t border-slate-400 pt-1.5">
                      <p className="font-bold text-xs text-slate-900">
                        {companySettings?.adminName || companySettings?.administratorName || 'ADMINISTRACIÓN ARANPRO'}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        RUT Administrador: {companySettings?.adminRut || '14.882.140-K'}
                      </p>
                      <p className="text-[9px] text-[#0F3D2E] font-semibold">
                        Administrador Legal de la Copropiedad (RNAC Minvu N° {companySettings?.rnacNumber || '48.912'})
                      </p>
                    </div>
                  </div>

                  {/* Ratificación Comité */}
                  <div className="text-center space-y-2">
                    <div className="h-16 flex items-center justify-center">
                      <span className="text-[11px] text-slate-400 italic">Ratificación Comité de Administración</span>
                    </div>
                    <div className="border-t border-slate-400 pt-1.5">
                      <p className="font-bold text-xs text-slate-900">
                        COMITÉ DE ADMINISTRACIÓN
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {previewCert.communityName || currentCommunity?.name || 'Condominio'}
                      </p>
                      <p className="text-[9px] text-slate-400 font-semibold">
                        Presidente(a) / Representante Legal (Art. 17° Ley 21.442)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pie de Página de Validación con Cód. de Verificación y Código QR Notarial */}
                <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <div className="flex items-center gap-2.5">
                    {/* QR SVG Notarial Interactivo */}
                    <button
                      onClick={() => setVerifyingCert(previewCert)}
                      className="group p-1 rounded-lg border border-slate-200 hover:border-[#0F3D2E] transition-all bg-white"
                      title="Haga clic para abrir la vista pública de verificación express"
                    >
                      <svg className="w-8 h-8 text-slate-700 group-hover:text-[#0F3D2E] transition-colors shrink-0" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm14 0h-4v2h2v4h2v-2h2v-2h-2v-2zm-4 4h2v2h-2v-2zm6-4h2v2h-2v-2zm0 4h2v2h-2v-2zM6 6h2v2H6V6zm12 0h2v2h-2V6zM6 18h2v2H6v-2z"/>
                      </svg>
                    </button>
                    <div>
                      <div>Verificación Notarial: portalnet.cl/verificar</div>
                      <div className="text-[#0F3D2E] font-bold">Cód. Hash: {previewCert.verificationCode || 'VRF-OK'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div>Pág 1 de 1 • Documento Oficial Foliado</div>
                    <div className="text-slate-500">Protocolizado Ley N° 21.442</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL DE VERIFICACIÓN PÚBLICA NOTARIAL EXPRESS (Propuesta 3) */}
      {verifyingCert && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150 text-center space-y-4">
            <button
              onClick={() => setVerifyingCert(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Sello de Autenticidad */}
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 border-2 border-emerald-500 text-emerald-600 flex items-center justify-center shadow-lg">
              <ShieldCheck className="w-9 h-9 text-emerald-600 animate-pulse" />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 uppercase tracking-wider inline-block">
                ✓ Documento Auténtico y Vigente
              </span>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Verificación de Fe Pública ARANPRO
              </h3>
              <p className="text-xs text-slate-500">
                Conforme al Registro Nacional de Administradores de Condominios Minvu (RNAC N° {companySettings?.rnacNumber || '48.912'})
              </p>
            </div>

            {/* Ficha Resumen de Integridad */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500">Folio Oficial:</span>
                <span className="font-mono font-bold text-slate-900">{verifyingCert.folio || verifyingCert.id}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500">Código Hash Criptográfico:</span>
                <span className="font-mono font-bold text-[#0F3D2E]">{verifyingCert.verificationCode || 'VRF-OK'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500">Tipo de Certificado:</span>
                <span className="font-bold text-slate-900 text-right max-w-[200px] truncate">{verifyingCert.type}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500">Comunidad / Inmueble:</span>
                <span className="font-bold text-slate-900">{verifyingCert.communityName} • Casa {verifyingCert.unitNumber}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500">Titular Solicitante:</span>
                <span className="font-semibold text-slate-800">{verifyingCert.applicantName} ({formatRut(verifyingCert.rut)})</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500">Fecha de Expedición:</span>
                <span className="font-semibold text-slate-800">{formatDate(verifyingCert.date)}</span>
              </div>
              <div className="flex justify-between pt-0.5">
                <span className="text-slate-500">Estado de Validez:</span>
                <span className="font-bold text-emerald-700">30 Días Corridos (Vigente ante Notarías y Bancos)</span>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
              <button
                onClick={() => {
                  const url = `https://portalnet.cl/verificar?folio=${verifyingCert.folio || verifyingCert.id}&hash=${verifyingCert.verificationCode || 'VRF-OK'}`;
                  if (navigator?.clipboard) navigator.clipboard.writeText(url);
                  setCopiedLinkFolio(verifyingCert.folio || verifyingCert.id);
                  setTimeout(() => setCopiedLinkFolio(null), 2500);
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
              >
                <Share2 className="w-3.5 h-3.5 text-[#0F3D2E]" />
                {copiedLinkFolio ? '¡Enlace Copiado!' : 'Copiar Enlace de Verificación'}
              </button>

              <button
                onClick={() => {
                  setVerifyingCert(null);
                  setPreviewCert(verifyingCert);
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5 text-[#D4B895]" />
                Ver Documento Timbrado
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. MODAL DE CONFIRMACIÓN CORPORATIVO ARANPRO (Elimina popups nativos del navegador) */}
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
