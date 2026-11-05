import React, { useState, useEffect } from 'react';
import { useCommunity } from '../../context/CommunityContext';
import { CompanySettingsAndBackupModule } from './CompanySettingsAndBackupModule';
import { PwaInstallButton } from '../layout/PwaPrompt';
import { AranproLogo, AranproOfficialSeal, AranproPdfStyleSelector, useAranproPdfStyle } from '../common/MauranLogo';
import { formatCLP } from '../../utils/formatters';
import { printDocumentDirectly } from '../../utils/printDocument';
import {
  Building2, Briefcase, Users, Award, ShieldCheck, ArrowRight, Plus,
  TrendingUp, Target, GraduationCap, Handshake, Wrench, FileText,
  CheckCircle2, Phone, Mail, ExternalLink, LogOut, Sparkles, Printer,
  Trash2, Check, Key, PenTool, HardHat, Scale, Landmark, DollarSign,
  Menu, X, ChevronLeft, ChevronRight, Globe, Shield, Database, Calculator
} from 'lucide-react';

const DEFAULT_OFFICE_WORKERS = [
  {
    id: 'ow-1',
    name: 'Camila Andrea Soto Valenzuela',
    rut: '18.452.910-3',
    role: 'Asistente de Administración & Atención Vecinos',
    contractType: 'Contrato Indefinido',
    startDate: '2025-03-01',
    grossSalary: 680000,
    afpName: 'AFP Habitat (11.27%)',
    afpRate: 11.27,
    healthSystem: 'Fonasa (7.0%)',
    healthRate: 7.0,
    afcEmployerRate: 2.4,
    mutualRate: 0.93,
    previredStatus: 'AL DÍA',
    assignedCommunities: 'Todas las comunidades'
  },
  {
    id: 'ow-2',
    name: 'Roberto Ignacio Morales Tapia',
    rut: '15.890.231-K',
    role: 'Inspector Técnico de Terreno (Bombas & Mantención)',
    contractType: 'Boleta de Honorarios',
    startDate: '2025-06-15',
    grossSalary: 350000,
    afpName: 'Retención SII (13.75%)',
    afpRate: 13.75,
    healthSystem: 'Independiente',
    healthRate: 0,
    afcEmployerRate: 0,
    mutualRate: 0,
    previredStatus: 'AL DÍA',
    assignedCommunities: 'Visitas técnicas semanales'
  }
];

const DEFAULT_TRAINING_GOALS = [
  {
    id: 'tr-1',
    title: 'Curso Oficial de Administración de Copropiedades (Ley N° 21.442)',
    institution: 'OTEC Acreditada SENCE / Registro Nacional MINVU',
    category: 'Normativa Legal',
    hours: 60,
    status: 'Completado',
    progress: 100,
    impact: 'Habilitación obligatoria vigente para el Registro Nacional de Administradores (RNAC N° 48.912).'
  },
  {
    id: 'tr-2',
    title: 'Ingeniería / Construcción Civil (Estudios Superiores en Curso)',
    institution: 'Educación Superior • Continuidad de Técnico en Construcción',
    category: 'Especialidad Constructiva',
    hours: 1200,
    status: 'En Curso',
    progress: 65,
    impact: 'Diferenciador clave frente a otros administradores: auditoría experta de salas de bombas, cubiertas y contratistas.'
  },
  {
    id: 'tr-3',
    title: 'Actualización en Reglamentos de Copropiedad y Asambleas Telemáticas (DS N° 7)',
    institution: 'AGACECH / Colegio de Administradores CGAI',
    category: 'Actualización Gremial',
    hours: 24,
    status: 'En Curso',
    progress: 80,
    impact: 'Adecuación de reglamentos internos antes del plazo legal y dirección de asambleas híbridas.'
  },
  {
    id: 'tr-4',
    title: 'Legislación Laboral, Turnos 4x4 y Directiva OS-10 para Conserjerías',
    institution: 'Instituto de Seguridad Laboral / OTEC Gremial',
    category: 'RR.HH. & Seguridad',
    hours: 16,
    status: 'Próxima Meta',
    progress: 25,
    impact: 'Blindaje ante fiscalizaciones de la Dirección del Trabajo y Carabineros (OS-10) en condominios.'
  }
];

const DEFAULT_PARTNER_ALLIANCES = [
  {
    id: 'al-1',
    category: 'Gremio & Estándar Tarifario',
    name: 'AGACECH • Asociación Gremial de Administradores de Condominios de Chile',
    contact: 'Mesa Técnica & Matriz Oficial de Honorarios',
    phone: '+56 2 2345 6789',
    website: 'https://agacech.cl',
    benefit: 'Acceso a matriz de honorarios en UF, defensa gremial, seminarios de actualización Ley N° 21.442 y red nacional.',
    status: 'Acreditado'
  },
  {
    id: 'al-2',
    category: 'Colegio Profesional',
    name: 'CGAI Chile • Colegio de Gestión y Administración Inmobiliaria (Socio N° 13-563)',
    contact: 'Comisión Legal & Capacitación Continua',
    phone: '+56 2 2633 4400',
    website: 'https://cgai.cl',
    benefit: 'Respaldo institucional colegiado, biblioteca de contratos tipo, circulares normativas y comité de ética.',
    status: 'Socio Activo'
  },
  {
    id: 'al-3',
    category: 'Asesoría Jurídica & Cobranza',
    name: 'Estudio Jurídico Copropiedad & Cobranza Judicial Ley N° 21.442',
    contact: 'Abogados Especialistas en Juicios Ejecutivos de Gastos Comunes',
    phone: '+56 9 5811 8504',
    website: 'https://aranpro.cl',
    benefit: 'Convenio para cobro judicial de morosidad crítica (Art. 36°) y actualización de Reglamentos de Copropiedad en el CBR.',
    status: 'Alianza Activa'
  },
  {
    id: 'al-4',
    category: 'Capacitación & Certificación OTEC',
    name: 'Centro de Capacitación Técnica & Certificación OS-10 / Calderas',
    contact: 'Coordinación de Cursos con Franquicia SENCE',
    phone: '+56 9 5811 8504',
    website: 'https://sence.gob.cl',
    benefit: 'Capacitación para conserjes (OS-10, primeros auxilios, uso de extintores) y formación continua del administrador.',
    status: 'Convenio Disponible'
  }
];

const DEFAULT_TRUSTED_PROVIDERS = [
  {
    id: 'tp-1',
    specialty: 'Seguridad Privada & Conserjería OS-10',
    companyName: 'Seguridad Integral Norte SpA',
    rut: '76.412.890-1',
    contactPerson: 'Marcelo Vega (Jefe de Operaciones)',
    phone: '+56984123456',
    email: 'operaciones@seguridadnorte.cl',
    rating: '5.0 ★',
    notes: 'Guardias y conserjes con curso OS-10 al día, reemplazos inmediatos en menos de 2 horas.'
  },
  {
    id: 'tp-2',
    specialty: 'Salas de Bombas & Hidroneumáticos',
    companyName: 'Hidráulica & Bombas Coquimbo Ltda.',
    rut: '77.109.432-8',
    contactPerson: 'Patricio Rojas (Ingeniero Hidráulico)',
    phone: '+56976543210',
    email: 'contacto@hidraulicacoquimbo.cl',
    rating: '5.0 ★',
    notes: 'Atención de emergencias 24/7, mantención preventiva mensual de tableros de alternancia y sellos mecánicos.'
  },
  {
    id: 'tp-3',
    specialty: 'Ascensores & Certificación MINVU',
    companyName: 'Vertical Lift Certificaciones SpA',
    rut: '76.889.120-K',
    contactPerson: 'Andrés Fuentes (Certificador Inscrito MINVU)',
    phone: '+56965439876',
    email: 'servicio@verticallift.cl',
    rating: '4.9 ★',
    notes: 'Precios preferentes para comunidades administradas por ARANPRO sin contratos abusivos de amarre.'
  }
];

export const CompanyEnterpriseHub = ({
  onBackToWeb,
  onSelectCommunityToManage,
  onSelectResidentPreview,
  onLogout
}) => {
  const { communities, addCommunity, companySettings, setCompanySettings } = useCommunity();
  const [pdfStyle, setPdfStyle] = useAranproPdfStyle();

  // Navegación principal del Centro de Negocios de la Empresa Administradora
  // 'comunidades' | 'postulaciones' | 'rrhh_oficina' | 'alianzas' | 'config_empresa'
  const [activeHubTab, setActiveHubTab] = useState('comunidades');
  const [companySubSection, setCompanySubSection] = useState('empresa');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Meta mensual de honorarios del administrador (en UF y CLP)
  const [ufValue, setUfValue] = useState(() => Number(companySettings?.ufReferenceValue) || 38650);
  const [monthlyGoalUF, setMonthlyGoalUF] = useState(() => Number(companySettings?.monthlyFeeGoalUF) || 60);
  const [editingGoal, setEditingGoal] = useState(false);

  // Estado de trabajadores propios de la oficina administradora
  const [officeWorkers, setOfficeWorkers] = useState(() => {
    try {
      const saved = localStorage.getItem('aranpro_office_workers');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_OFFICE_WORKERS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('aranpro_office_workers', JSON.stringify(officeWorkers));
    } catch {
      // ignore
    }
  }, [officeWorkers]);

  const [showAddWorkerModal, setShowAddWorkerModal] = useState(false);
  const [workerForm, setWorkerForm] = useState({
    name: '',
    rut: '',
    role: 'Asistente de Administración',
    contractType: 'Contrato Indefinido',
    startDate: new Date().toISOString().split('T')[0],
    grossSalary: 650000,
    afpName: 'AFP Modelo (10.58%)',
    afpRate: 10.58,
    healthSystem: 'Fonasa (7.0%)',
    healthRate: 7.0,
    afcEmployerRate: 2.4,
    mutualRate: 0.93,
    previredStatus: 'AL DÍA',
    assignedCommunities: 'Todas las comunidades'
  });

  // Estado de Capacitación Continua
  const [trainingGoals, setTrainingGoals] = useState(() => {
    try {
      const saved = localStorage.getItem('aranpro_training_goals');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_TRAINING_GOALS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('aranpro_training_goals', JSON.stringify(trainingGoals));
    } catch {
      // ignore
    }
  }, [trainingGoals]);

  // Estado de Proveedores Preferentes del Administrador
  const [trustedProviders, setTrustedProviders] = useState(() => {
    try {
      const saved = localStorage.getItem('aranpro_trusted_providers');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_TRUSTED_PROVIDERS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('aranpro_trusted_providers', JSON.stringify(trustedProviders));
    } catch {
      // ignore
    }
  }, [trustedProviders]);

  const [newProviderForm, setNewProviderForm] = useState({
    specialty: 'Seguridad Privada & Conserjería',
    companyName: '',
    rut: '',
    contactPerson: '',
    phone: '',
    email: '',
    rating: '5.0 ★',
    notes: ''
  });

  // Modal rápido para dar de alta una nueva comunidad desde el Hub Central
  const [showNewCommunityModal, setShowNewCommunityModal] = useState(false);
  const [newCommData, setNewCommData] = useState({
    name: '',
    communityRut: '',
    type: 'Casas',
    address: '',
    city: 'La Serena / Coquimbo',
    totalUnits: 24,
    buildingAgeYears: 4,
    monthlyAdminFeeCLP: 600000,
    reserveFundPercentage: 5
  });

  // Cálculos ejecutivos de cartera y meta de honorarios
  const totalCommunities = communities.length;
  const totalManagedUnits = communities.reduce((acc, c) => acc + (Number(c.totalUnits) || c.units?.length || 0), 0);

  // Honorario actual sumando las comunidades activas (si no tiene honorario explícito, estima base razonable)
  const currentMonthlyFeeCLP = communities.reduce((acc, c) => {
    if (c.monthlyAdminFeeCLP && Number(c.monthlyAdminFeeCLP) > 0) {
      return acc + Number(c.monthlyAdminFeeCLP);
    }
    const units = Number(c.totalUnits) || c.units?.length || 15;
    return acc + Math.max(550000, units * 12500);
  }, 0);

  const currentMonthlyFeeUF = +(currentMonthlyFeeCLP / ufValue).toFixed(1);
  const goalMonthlyCLP = Math.round(monthlyGoalUF * ufValue);
  const goalProgressPct = Math.min(100, Math.round((currentMonthlyFeeUF / Math.max(1, monthlyGoalUF)) * 100));
  const missingUF = Math.max(0, +(monthlyGoalUF - currentMonthlyFeeUF).toFixed(1));
  const missingCLP = Math.max(0, goalMonthlyCLP - currentMonthlyFeeCLP);
  const estimatedCondosNeeded = missingUF > 0 ? Math.ceil(missingUF / 16) : 0;

  const pipelineCount = (companySettings?.postulationPipeline || []).length || 3;

  // Cálculos de RR.HH. e Imposiciones de la Oficina Administradora
  const officePayrollMetrics = officeWorkers.reduce(
    (acc, w) => {
      const gross = Number(w.grossSalary) || 0;
      if (w.contractType === 'Boleta de Honorarios') {
        const retention = Math.round(gross * ((Number(w.afpRate) || 13.75) / 100));
        const net = gross - retention;
        acc.totalGross += gross;
        acc.totalPreviredAndTax += retention;
        acc.totalNet += net;
        acc.totalEmployerCost += gross;
      } else {
        const afp = Math.round(gross * ((Number(w.afpRate) || 11) / 100));
        const health = Math.round(gross * ((Number(w.healthRate) || 7) / 100));
        const afcWorker = Math.round(gross * 0.006);
        const employerCosts = Math.round(gross * (((Number(w.afcEmployerRate) || 2.4) + (Number(w.mutualRate) || 0.93) + 1.49) / 100));
        const totalImposiciones = afp + health + afcWorker + employerCosts;
        const net = gross - afp - health - afcWorker;
        acc.totalGross += gross;
        acc.totalPreviredAndTax += totalImposiciones;
        acc.totalNet += net;
        acc.totalEmployerCost += gross + employerCosts;
      }
      return acc;
    },
    { totalGross: 0, totalPreviredAndTax: 0, totalNet: 0, totalEmployerCost: 0 }
  );

  const handleSaveGoal = () => {
    setCompanySettings({
      ...companySettings,
      ufReferenceValue: ufValue,
      monthlyFeeGoalUF: monthlyGoalUF
    });
    setEditingGoal(false);
  };

  const handleCreateWorker = (e) => {
    e.preventDefault();
    if (!workerForm.name.trim()) return;
    setOfficeWorkers((prev) => [
      ...prev,
      {
        id: `ow-${Date.now()}`,
        ...workerForm,
        grossSalary: Number(workerForm.grossSalary) || 0
      }
    ]);
    setShowAddWorkerModal(false);
    setWorkerForm({
      name: '',
      rut: '',
      role: 'Asistente de Administración',
      contractType: 'Contrato Indefinido',
      startDate: new Date().toISOString().split('T')[0],
      grossSalary: 650000,
      afpName: 'AFP Modelo (10.58%)',
      afpRate: 10.58,
      healthSystem: 'Fonasa (7.0%)',
      healthRate: 7.0,
      afcEmployerRate: 2.4,
      mutualRate: 0.93,
      previredStatus: 'AL DÍA',
      assignedCommunities: 'Todas las comunidades'
    });
  };

  const handleCreateNewCommunity = (e) => {
    e.preventDefault();
    if (!newCommData.name.trim()) return;
    const created = addCommunity({
      name: newCommData.name,
      type: newCommData.type,
      address: newCommData.address,
      city: newCommData.city,
      totalUnits: Number(newCommData.totalUnits) || 16,
      reserveFundPercentage: Number(newCommData.reserveFundPercentage) || 5,
      bankInfo: {
        bank: 'Banco Estado',
        accountType: 'Cuenta Corriente',
        accountNumber: '',
        holderName: newCommData.name,
        rut: newCommData.communityRut,
        email: ''
      }
    });
    setShowNewCommunityModal(false);
    if (created && onSelectCommunityToManage) {
      onSelectCommunityToManage(created.id);
    }
  };

  const handleAddTrustedProvider = (e) => {
    e.preventDefault();
    if (!newProviderForm.companyName.trim()) return;
    setTrustedProviders((prev) => [
      ...prev,
      { id: `tp-${Date.now()}`, ...newProviderForm }
    ]);
    setNewProviderForm({
      specialty: 'Seguridad Privada & Conserjería',
      companyName: '',
      rut: '',
      contactPerson: '',
      phone: '',
      email: '',
      rating: '5.0 ★',
      notes: ''
    });
  };

  const hubNavTabs = [
    {
      id: 'comunidades',
      label: '1. Mis Comunidades & Metas',
      shortLabel: 'Comunidades & Metas',
      icon: Building2,
      badge: `${totalCommunities} Activas`
    },
    {
      id: 'postulaciones',
      label: '2. Postulaciones & CRM AGACECH',
      shortLabel: 'Postulaciones & CRM',
      icon: Target,
      badge: `${pipelineCount} en CRM`
    },
    {
      id: 'rrhh_oficina',
      label: '3. Mi Oficina: RR.HH. & Previred',
      shortLabel: 'Mi Oficina (RR.HH.)',
      icon: Users,
      badge: `${officeWorkers.length} Equipo`
    },
    {
      id: 'alianzas',
      label: '4. Convenios, Gremios & Proveedores',
      shortLabel: 'Convenios & Red',
      icon: Handshake,
      badge: `${trustedProviders.length} Prov.`
    },
    {
      id: 'config_empresa',
      label: '5. Datos Empresa, Firma & RNAC',
      shortLabel: 'Datos Empresa & RNAC',
      icon: ShieldCheck,
      badge: 'RNAC'
    }
  ];

  const activeHubTabObj = hubNavTabs.find((t) => t.id === activeHubTab) || hubNavTabs[0];

  const scrollToSection = (sectionId) => {
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  };

  // BARRA LATERAL IZQUIERDA DEL PANEL DE EMPRESA ADMINISTRADORA (COLORES INVERTIDOS RESPECTO A LA COMUNIDAD)
  // En Comunidad: Cabecera Verde Oscura + Cuerpo Blanco + Botón Activo Verde
  // En Panel Empresa: Cabecera Dorada Ejecutiva (#D4B895) + Cuerpo Verde Corporativo (#0F3D2E) + Botón Activo Dorado (#D4B895)
  const renderEnterpriseSidebar = (isMobile = false) => (
    <div className="flex flex-col h-full bg-[#0F3D2E] text-white border-r border-[#D4B895]/35 shadow-xl">
      {/* 1. Cabecera Superior Invertida en Dorado Ejecutivo (#D4B895) para distinguir que estamos en MODO EMPRESA */}
      <div className="bg-gradient-to-br from-[#D4B895] via-[#dfc7a7] to-[#c7a67b] text-[#0F3D2E] p-3.5 border-b border-[#0F3D2E]/20 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          {(!sidebarCollapsed || isMobile) && (
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#0F3D2E] text-[#D4B895] flex items-center justify-center shrink-0 shadow-xs">
                <Briefcase className="w-4 h-4" />
              </div>
              <div className="truncate">
                <span className="text-[9px] font-black tracking-wider uppercase text-[#0F3D2E]/80 block leading-none">
                  Panel Mi Empresa • Backoffice
                </span>
                <h1 className="text-xs font-black text-[#0F3D2E] truncate mt-0.5">
                  {companySettings?.brandName || 'ARANPRO'} • Administradora
                </h1>
              </div>
            </div>
          )}

          {isMobile ? (
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="p-1.5 text-[#0F3D2E]/80 hover:text-[#0F3D2E] rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 text-[#0F3D2E] hover:bg-[#0F3D2E]/10 rounded-lg transition-colors mx-auto sm:mx-0 cursor-pointer"
              title={sidebarCollapsed ? 'Expandir panel de empresa' : 'Contraer panel de empresa'}
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}
        </div>

        {(!sidebarCollapsed || isMobile) && (
          <div className="space-y-1.5 pt-0.5">
            {/* Selector directo para saltar a trabajar en una comunidad */}
            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase tracking-wider text-[#0F3D2E]/80 block">
                Abrir Comunidad Activa ({communities.length}):
              </span>
              <select
                value=""
                onChange={(e) => {
                  const commId = e.target.value;
                  if (commId) {
                    if (isMobile) setMobileSidebarOpen(false);
                    onSelectCommunityToManage(commId);
                  }
                }}
                className="w-full bg-[#0F3D2E] text-white text-xs font-bold px-2.5 py-2 rounded-xl border border-[#0F3D2E] focus:outline-hidden focus:ring-2 focus:ring-white cursor-pointer"
              >
                <option value="">🏢 Seleccionar Condominio para entrar...</option>
                {communities.map((c) => (
                  <option key={c.id} value={c.id}>
                    Ir a: {c.name} ({c.totalUnits} {c.type})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  if (isMobile) setMobileSidebarOpen(false);
                  setShowNewCommunityModal(true);
                }}
                className="flex-1 py-1.5 px-2.5 bg-[#0F3D2E] hover:bg-[#0A291F] text-[#D4B895] text-[11px] font-black rounded-xl flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Nueva Comunidad
              </button>
              <span
                className="px-2 py-1.5 text-[10px] font-black bg-white/80 text-[#0F3D2E] border border-[#0F3D2E]/20 rounded-xl truncate"
                title="Facturación actual vs Meta UF"
              >
                {currentMonthlyFeeUF}/{monthlyGoalUF} UF
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Navegación Vertical del Panel de Empresa (Fondo Verde Corporativo #0F3D2E + Botón Activo Dorado #D4B895) */}
      <div className="flex-1 overflow-y-auto py-3 px-2.5 space-y-1">
        {(!sidebarCollapsed || isMobile) && (
          <span className="px-2 text-[9px] font-black uppercase tracking-widest text-[#D4B895]/80 block mb-1.5">
            Menú Central de Mi Administradora
          </span>
        )}

        {hubNavTabs.map((tab) => {
          const IconComponent = tab.icon;
          const isActive = activeHubTab === tab.id;
          return (
            <div key={tab.id} className="space-y-0.5">
              <button
                type="button"
                onClick={() => {
                  setActiveHubTab(tab.id);
                  if (tab.id === 'postulaciones') {
                    setCompanySubSection('postulaciones');
                  } else if (tab.id === 'config_empresa' && companySubSection === 'postulaciones') {
                    setCompanySubSection('empresa');
                  }
                  if (isMobile) setMobileSidebarOpen(false);
                }}
                title={sidebarCollapsed && !isMobile ? tab.label : undefined}
                className={`w-full flex items-center ${
                  sidebarCollapsed && !isMobile ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2.5'
                } rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#D4B895] text-[#0F3D2E] font-black shadow-sm'
                    : 'text-white/85 hover:bg-white/10 hover:text-[#D4B895]'
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <IconComponent
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-[#0F3D2E]' : 'text-[#D4B895]'
                    }`}
                  />
                  {(!sidebarCollapsed || isMobile) && (
                    <span className="truncate">{tab.label}</span>
                  )}
                </div>

                {(!sidebarCollapsed || isMobile) && tab.badge && (
                  <span
                    className={`ml-2 px-2 py-0.5 text-[10px] font-black rounded-full shrink-0 ${
                      isActive
                        ? 'bg-[#0F3D2E] text-[#D4B895]'
                        : 'bg-[#0A291F] text-[#D4B895] border border-[#D4B895]/30'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>

              {/* SUB-ÍNDICES 1: MIS COMUNIDADES, METAS & CAPACITACIÓN */}
              {tab.id === 'comunidades' && (!sidebarCollapsed || isMobile) && isActive && (
                <div className="ml-3.5 pl-2 border-l-2 border-[#D4B895]/50 space-y-0.5 my-1">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveHubTab('comunidades');
                      scrollToSection('sec-comunidades-activas');
                      if (isMobile) setMobileSidebarOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[11px] font-bold text-white/90 hover:text-[#D4B895] hover:bg-white/10 transition-all cursor-pointer"
                  >
                    <span className="truncate">• Comunidades Activas</span>
                    <span className="text-[9.5px] px-1.5 py-0.2 rounded-full bg-[#0A291F] text-[#D4B895] font-bold">
                      {totalCommunities}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveHubTab('comunidades');
                      scrollToSection('sec-metas-honorarios');
                      if (isMobile) setMobileSidebarOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[11px] font-bold text-white/90 hover:text-[#D4B895] hover:bg-white/10 transition-all cursor-pointer"
                  >
                    <span className="truncate">• Meta de Honorarios (UF)</span>
                    <span className="text-[9.5px] px-1.5 py-0.2 rounded-full bg-[#0A291F] text-emerald-300 font-bold">
                      {goalProgressPct}%
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveHubTab('comunidades');
                      scrollToSection('sec-capacitacion-continua');
                      if (isMobile) setMobileSidebarOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[11px] font-bold text-white/90 hover:text-[#D4B895] hover:bg-white/10 transition-all cursor-pointer"
                  >
                    <span className="truncate">• Radar Capacitación</span>
                    <span className="text-[9.5px] px-1.5 py-0.2 rounded-full bg-[#0A291F] text-[#D4B895] font-bold">
                      {trainingGoals.length}
                    </span>
                  </button>
                </div>
              )}

              {/* SUB-ÍNDICES 2: POSTULACIONES, CRM & CARTA EN FRÍO */}
              {tab.id === 'postulaciones' && (!sidebarCollapsed || isMobile) && isActive && (
                <div className="ml-3.5 pl-2 border-l-2 border-[#D4B895]/50 space-y-0.5 my-1">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveHubTab('postulaciones');
                      setCompanySubSection('postulaciones');
                      if (isMobile) setMobileSidebarOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[11px] font-bold bg-white/15 text-[#D4B895] cursor-pointer"
                  >
                    <span className="truncate">• CRM, Piso AGACECH & Dossier</span>
                    <span className="text-[9.5px] px-1.5 py-0.2 rounded-full bg-[#D4B895] text-[#0F3D2E] font-black">
                      PDF
                    </span>
                  </button>
                </div>
              )}

              {/* SUB-ÍNDICES 3: MI OFICINA (TRABAJADORES & PREVIRED) */}
              {tab.id === 'rrhh_oficina' && (!sidebarCollapsed || isMobile) && isActive && (
                <div className="ml-3.5 pl-2 border-l-2 border-[#D4B895]/50 space-y-0.5 my-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddWorkerModal(true);
                      if (isMobile) setMobileSidebarOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[11px] font-bold text-white/90 hover:text-[#D4B895] hover:bg-white/10 cursor-pointer"
                  >
                    <span className="truncate">+ Agregar Trabajador Oficina</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      printDocumentDirectly(
                        'printable-office-payroll-sheet',
                        `ARANPRO_Nomina_RRHH_Oficina_${new Date().toISOString().slice(0, 7)}`,
                        { pdfStyle }
                      );
                    }}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[11px] font-bold text-[#D4B895] hover:bg-white/10 cursor-pointer"
                  >
                    <span className="truncate">🖨️ Emitir Planilla Previred PDF</span>
                  </button>
                </div>
              )}

              {/* SUB-ÍNDICES 5: DATOS EMPRESA, FIRMA DIGITAL, RNAC, EQUIPO & RESPALDOS */}
              {tab.id === 'config_empresa' && (!sidebarCollapsed || isMobile) && isActive && (
                <div className="ml-3.5 pl-2 border-l-2 border-[#D4B895]/50 space-y-0.5 my-1">
                  {[
                    { id: 'empresa', label: '1. Datos Empresa & Rep. Legal' },
                    { id: 'firma', label: '2. Firma Digital & Timbre' },
                    { id: 'acreditacion', label: '3. Credenciales RNAC Minvu' },
                    { id: 'equipo', label: '4. Equipo & Colaboradores' },
                    { id: 'respaldos', label: '5. Respaldos & Seguridad' }
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => {
                        setActiveHubTab('config_empresa');
                        setCompanySubSection(sub.id);
                        if (isMobile) setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        companySubSection === sub.id
                          ? 'bg-white/15 text-[#D4B895] font-black border border-[#D4B895]/40'
                          : 'text-white/75 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <span className="truncate">{sub.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 3. Acciones Rápidas de Mi Empresa Administradora (Cuadrícula 2x2 en el pie de la barra lateral) */}
      <div className="p-2.5 bg-[#0A291F] border-t border-[#D4B895]/25 space-y-1.5">
        {(!sidebarCollapsed || isMobile) ? (
          <>
            <div className="flex items-center justify-between px-1">
              <span className="text-[9px] font-black uppercase tracking-wider text-[#D4B895] truncate">
                Atajos Rápidos • Mi Empresa
              </span>
              <span className="text-[9px] font-mono text-white/60">
                RNAC {companySettings?.rnacNumber || '48.912'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setActiveHubTab('postulaciones');
                  setCompanySubSection('postulaciones');
                  if (isMobile) setMobileSidebarOpen(false);
                }}
                className="px-2 py-2 text-[11px] font-black bg-[#D4B895] hover:bg-[#c8a982] text-[#0F3D2E] rounded-xl transition-colors flex items-center justify-center shadow-2xs cursor-pointer"
                title="Ir a Dossier y Carta de Presentación en Frío"
              >
                <Printer className="w-3.5 h-3.5 mr-1.5 text-[#0F3D2E] shrink-0" />
                <span className="truncate">Dossier / Carta</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveHubTab('rrhh_oficina');
                  if (isMobile) setMobileSidebarOpen(false);
                }}
                className="px-2 py-2 text-[11px] font-bold bg-white/10 hover:bg-white/20 text-white border border-[#D4B895]/30 rounded-xl transition-colors flex items-center justify-center cursor-pointer"
                title="Gestionar trabajadores e imposiciones de mi oficina"
              >
                <Users className="w-3.5 h-3.5 mr-1.5 text-[#D4B895] shrink-0" />
                <span className="truncate">RR.HH. Oficina</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveHubTab('config_empresa');
                  setCompanySubSection('firma');
                  if (isMobile) setMobileSidebarOpen(false);
                }}
                className="px-2 py-2 text-[11px] font-bold bg-white/10 hover:bg-white/20 text-white border border-white/15 rounded-xl transition-colors flex items-center justify-center cursor-pointer"
                title="Configurar Firma Digital y Sello ARANPRO"
              >
                <PenTool className="w-3.5 h-3.5 mr-1.5 text-[#D4B895] shrink-0" />
                <span className="truncate">Firma & Sello</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveHubTab('alianzas');
                  if (isMobile) setMobileSidebarOpen(false);
                }}
                className="px-2 py-2 text-[11px] font-bold bg-white/10 hover:bg-white/20 text-white border border-white/15 rounded-xl transition-colors flex items-center justify-center cursor-pointer"
                title="Convenios AGACECH, Abogados y Proveedores"
              >
                <Handshake className="w-3.5 h-3.5 mr-1.5 text-[#D4B895] shrink-0" />
                <span className="truncate">Proveedores</span>
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center space-y-1.5">
            <button
              type="button"
              onClick={() => setActiveHubTab('postulaciones')}
              className="p-2 bg-[#D4B895] text-[#0F3D2E] rounded-xl hover:bg-[#c8a982]"
              title="Postulaciones y Carta en Frío"
            >
              <Target className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setActiveHubTab('rrhh_oficina')}
              className="p-2 bg-white/10 text-[#D4B895] border border-[#D4B895]/30 rounded-xl hover:bg-white/20"
              title="RR.HH. Mi Oficina"
            >
              <Users className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Firma Oficial Red-Enlace Soluciones Digitales */}
      {(!sidebarCollapsed || isMobile) && (
        <div className="p-2 border-t border-white/10 text-center bg-[#082219]">
          <a
            href="https://redenlace.cl/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[10.5px] text-white/60 hover:text-[#D4B895] font-medium transition-colors group cursor-pointer"
            title="Visitar Red-Enlace Soluciones Digitales"
          >
            <img
              src="/red-enlace-logo.png"
              alt="Logo Red-Enlace"
              width={14}
              height={14}
              className="h-3 w-auto opacity-80 group-hover:opacity-100 transition-opacity"
            />
            <span>Desarrollado por Red-Enlace</span>
          </a>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col lg:flex-row pb-20 lg:pb-0">
      {/* BARRA SUPERIOR COMPACTA SOLO PARA CELULAR / TABLET (< lg) */}
      <div className="lg:hidden sticky top-0 z-30 bg-[#0A291F] text-white px-4 py-2.5 border-b border-[#D4B895]/40 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-2.5 min-w-0">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 bg-[#D4B895] text-[#0F3D2E] rounded-xl flex items-center shrink-0 font-black"
            aria-label="Abrir panel de empresa"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="truncate">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#D4B895] block leading-tight truncate">
              Panel Mi Empresa Administradora
            </span>
            <span className="text-xs font-black text-white truncate block">
              {activeHubTabObj.shortLabel}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 shrink-0">
          <PwaInstallButton variant="compact" label="Instalar" />
          <button
            type="button"
            onClick={() => setShowNewCommunityModal(true)}
            className="px-2.5 py-1.5 bg-[#D4B895] text-[#0F3D2E] text-[11px] font-black rounded-lg flex items-center"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Comunidad
          </button>
        </div>
      </div>

      {/* DRAWER LATERAL DESLIZABLE EN CELULAR / TABLET (< lg) */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative w-80 max-w-[85vw] h-full z-10 shadow-2xl">
            {renderEnterpriseSidebar(true)}
          </div>
        </div>
      )}

      {/* PANEL LATERAL IZQUIERDO FIJO DESDE EL TOPE DE LA PÁGINA EN COMPUTADOR (lg+) */}
      <aside
        className={`hidden lg:block shrink-0 transition-all duration-200 ${
          sidebarCollapsed ? 'w-16' : 'w-64 xl:w-72'
        }`}
      >
        <div className="sticky top-0 h-screen">
          {renderEnterpriseSidebar(false)}
        </div>
      </aside>

      {/* COLUMNA DERECHA: BARRA SUPERIOR EJECUTIVA + ÁREA DE TRABAJO DE LA EMPRESA */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* BARRA SUPERIOR EJECUTIVA INVERTIDA (OSCURA CON DETALLES DORADOS PARA DIFERENCIARLA DE LA BARRA BLANCA DE COMUNIDADES) */}
        <header className="hidden lg:flex sticky top-0 z-30 bg-[#0A291F] text-white border-b border-[#D4B895]/35 px-6 h-16 items-center justify-between gap-4 shadow-sm">
          {/* Izquierda: Indicador de Modo Empresa Administradora + Módulo Activo */}
          <div className="flex items-center space-x-3 min-w-0">
            <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider bg-[#D4B895] text-[#0F3D2E] rounded-lg shrink-0 flex items-center gap-1.5 shadow-2xs">
              <Briefcase className="w-3.5 h-3.5" />
              Modo Empresa Administradora
            </span>
            <span className="text-white/30">•</span>
            <span className="text-sm font-black text-white truncate">
              {activeHubTabObj.label}
            </span>
            <span className="hidden xl:inline-block px-2 py-0.5 text-[10px] font-mono bg-white/10 text-[#D4B895] border border-[#D4B895]/30 rounded-md shrink-0">
              RNAC MINVU N° {companySettings?.rnacNumber || '48.912'}
            </span>
          </div>

          {/* Centro: Logo Oficial ARANPRO en versión oscura */}
          <div
            onClick={onBackToWeb}
            className="cursor-pointer shrink-0 hover:opacity-90 transition-opacity"
            title="Ir al sitio web oficial aranpro.cl"
          >
            <AranproLogo variant="horizontal" size="sm" theme="dark" />
          </div>

          {/* Derecha: Acciones Globales del Administrador */}
          <div className="flex items-center space-x-2 shrink-0">
            <PwaInstallButton variant="compact" label="Instalar App" />
            {onBackToWeb && (
              <button
                type="button"
                onClick={onBackToWeb}
                className="px-3 py-1.5 text-xs font-bold text-white/85 hover:text-[#D4B895] hover:bg-white/10 rounded-xl transition-colors flex items-center cursor-pointer"
                title="Volver a la página web corporativa aranpro.cl"
              >
                <Globe className="w-3.5 h-3.5 mr-1.5 text-[#D4B895]" />
                Web aranpro.cl
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowNewCommunityModal(true)}
              className="px-3.5 py-1.5 bg-[#D4B895] hover:bg-[#c8a982] text-[#0F3D2E] text-xs font-black rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Comunidad</span>
            </button>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="p-2 text-white/70 hover:text-rose-300 hover:bg-rose-500/20 rounded-xl transition-colors cursor-pointer"
                title="Cerrar sesión de Administrador"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        {/* CONTENIDO PRINCIPAL DEL HUB DE EMPRESA */}
        <div className="flex-1 px-3 sm:px-5 lg:px-7 py-6 space-y-8 min-w-0 max-w-7xl w-full mx-auto">
        {/* ==================== VISTA 1: MIS COMUNIDADES ACTIVAS, METAS & CAPACITACIÓN ==================== */}
        {activeHubTab === 'comunidades' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* SECCIÓN CENTRAL: ¿EN QUÉ COMUNIDAD DESEAS TRABAJAR HOY? */}
            <div id="sec-comunidades-activas" className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="text-center space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-[#0F3D2E] text-[#D4B895]">
                  <Building2 className="w-3.5 h-3.5" />
                  Suite Multi-Comunidad • ARANPRO SaaS
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-[#0F3D2E] tracking-tight uppercase">
                  ¿En qué comunidad deseas trabajar hoy?
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
                  Tienes <strong>{communities.length} comunidades activas</strong> bajo tu administración ({totalManagedUnits} unidades en total). Selecciona el condominio donde deseas ingresar a trabajar su contabilidad, gastos comunes, asambleas o comité:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {communities.map((c) => {
                  const paidUnits = c.units?.filter((u) => u.paid).length || 0;
                  const totalUnits = c.totalUnits || c.units?.length || 0;
                  return (
                    <div
                      key={c.id}
                      onClick={() => onSelectCommunityToManage(c.id)}
                      className="group bg-[#FDFBF7] hover:bg-white p-6 rounded-3xl border-2 border-slate-200 hover:border-[#0F3D2E] shadow-xs hover:shadow-xl transition-all cursor-pointer space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-[#0F3D2E]/10 group-hover:bg-[#0F3D2E] text-[#0F3D2E] group-hover:text-[#D4B895] flex items-center justify-center transition-all shrink-0">
                            <Building2 className="w-6 h-6" />
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {c.type} • {totalUnits} Unidades
                          </span>
                        </div>

                        <div>
                          <h3 className="text-lg font-black text-slate-900 group-hover:text-[#0F3D2E] transition-colors">
                            {c.name}
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {c.address}, {c.city}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/70 text-[11px]">
                          <span className="text-slate-600">
                            Período activo:{' '}
                            <strong className="text-slate-900">
                              {c.activePeriod?.month || '11'} {c.activePeriod?.year || '2026'}
                            </strong>
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-emerald-700 font-bold">
                            {paidUnits} / {totalUnits} al día
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs font-black text-[#0F3D2E]">
                        <span>Abrir Gestión de {c.name}</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-[#D4B895]" />
                      </div>
                    </div>
                  );
                })}

                {/* Tarjeta para habilitar una nueva comunidad ganada en licitación */}
                <button
                  type="button"
                  onClick={() => setShowNewCommunityModal(true)}
                  className="p-6 rounded-3xl border-2 border-dashed border-[#0F3D2E]/35 hover:border-[#0F3D2E] bg-emerald-50/30 hover:bg-emerald-50/70 transition-all flex flex-col items-center justify-center text-center gap-3 cursor-pointer min-h-[220px]"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#0F3D2E] text-[#D4B895] flex items-center justify-center shadow-sm">
                    <Plus className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-[#0F3D2E] uppercase">
                      + Habilitar Nueva Comunidad
                    </h4>
                    <p className="text-xs text-slate-600 max-w-xs">
                      ¿Ganaste una nueva licitación? Crea el condominio aquí con su RUT, dirección, antigüedad y comité.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* SECCIÓN 2: TERMÓMETRO DE META DE HONORARIOS Y CRECIMIENTO COMERCIAL DEL ADMINISTRADOR */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div id="sec-metas-honorarios" className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-[#0F3D2E] text-[#D4B895] flex items-center justify-center shrink-0">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F3D2E] block">
                        Plan de Negocios & Crecimiento de tu Administradora
                      </span>
                      <h3 className="text-base font-black text-slate-900">
                        ¿Cuánto te falta para llegar a tu Meta de Honorarios?
                      </h3>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setEditingGoal(!editingGoal)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    {editingGoal ? 'Cerrar ajuste' : '⚙️ Ajustar mi Meta (UF)'}
                  </button>
                </div>

                {editingGoal && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                        Mi Meta Mensual (en UF)
                      </label>
                      <input
                        type="number"
                        min={15}
                        max={1000}
                        value={monthlyGoalUF}
                        onChange={(e) => setMonthlyGoalUF(Number(e.target.value) || 60)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-black text-[#0F3D2E]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                        Valor UF Referencial (CLP)
                      </label>
                      <input
                        type="number"
                        value={ufValue}
                        onChange={(e) => setUfValue(Number(e.target.value) || 38650)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveGoal}
                      className="py-2 px-4 rounded-xl bg-[#0F3D2E] text-white font-bold text-xs cursor-pointer"
                    >
                      Guardar Meta
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                    <span className="text-[10px] font-bold uppercase text-emerald-800 block">
                      Facturación Actual Cartera
                    </span>
                    <strong className="text-xl font-black text-[#0F3D2E] block mt-0.5">
                      {currentMonthlyFeeUF} UF / mes
                    </strong>
                    <span className="text-[11px] font-mono text-slate-600">
                      {formatCLP(currentMonthlyFeeCLP)} ({totalCommunities} condominios)
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">
                      Meta Mensual Objetivo
                    </span>
                    <strong className="text-xl font-black text-slate-900 block mt-0.5">
                      {monthlyGoalUF} UF / mes
                    </strong>
                    <span className="text-[11px] font-mono text-slate-500">
                      {formatCLP(goalMonthlyCLP)} / mes
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200">
                    <span className="text-[10px] font-bold uppercase text-amber-900 block">
                      Brecha por Alcanzar
                    </span>
                    <strong className="text-xl font-black text-amber-950 block mt-0.5">
                      {missingUF > 0 ? `Faltan ${missingUF} UF` : '¡Meta Cumplida!'}
                    </strong>
                    <span className="text-[11px] text-amber-800 font-semibold">
                      {missingUF > 0
                        ? `≈ ${estimatedCondosNeeded} condominio(s) más (${formatCLP(missingCLP)})`
                        : '¡Superaste tu objetivo mensual!'}
                    </span>
                  </div>
                </div>

                {/* Barra de progreso hacia la meta */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700">Avance hacia tu Meta de Administración:</span>
                    <span className="text-[#0F3D2E] font-black">{goalProgressPct}% completado</span>
                  </div>
                  <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className="h-full bg-gradient-to-r from-[#0F3D2E] to-emerald-600 rounded-full transition-all duration-500"
                      style={{ width: `${goalProgressPct}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#F5F4EF] border border-[#D4B895] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5 text-xs">
                    <strong className="text-[#0F3D2E] block">
                      💡 Acción recomendada para acelerar tu meta comercial:
                    </strong>
                    <p className="text-slate-600 text-[11px]">
                      Imprime <strong>Cartas de Valor en Frío</strong> para dejar en conserjerías de tu sector o simula el piso de honorarios en la <strong>Calculadora AGACECH</strong>.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveHubTab('postulaciones')}
                    className="px-4 py-2.5 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-[#D4B895] font-black text-xs shrink-0 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Target className="w-4 h-4" />
                    <span>Ir a Postulaciones & CRM →</span>
                  </button>
                </div>
              </div>

              {/* COLUMNA DERECHA: INCENTIVO DE CAPACITACIÓN CONTINUA DEL ADMINISTRADOR */}
              <div id="sec-capacitacion-continua" className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-[#0F3D2E] text-[#D4B895] flex items-center justify-center shrink-0">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F3D2E] block">
                          Excelencia Profesional & RNAC Minvu
                        </span>
                        <h3 className="text-sm font-black text-slate-900">
                          Plan de Capacitación Continua del Administrador
                        </h3>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {trainingGoals.map((tr) => (
                      <div key={tr.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-black text-slate-900 leading-snug">{tr.title}</h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold shrink-0 ${
                              tr.status === 'Completado'
                                ? 'bg-emerald-100 text-emerald-800'
                                : tr.status === 'En Curso'
                                ? 'bg-[#0F3D2E] text-[#D4B895]'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {tr.status} ({tr.progress}%)
                          </span>
                        </div>
                        <p className="text-[10.5px] text-slate-500">{tr.institution} • {tr.hours} hrs</p>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#0F3D2E]"
                            style={{ width: `${tr.progress}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">
                    Tus diplomas se adjuntan automáticamente a tu Dossier
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setCompanySubSection('acreditacion');
                      setActiveHubTab('config_empresa');
                    }}
                    className="text-xs font-black text-[#0F3D2E] hover:underline cursor-pointer"
                  >
                    Subir Nuevo Diploma →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== VISTA 2: POSTULACIONES, CRM & CALCULADORA AGACECH ==================== */}
        {activeHubTab === 'postulaciones' && (
          <div className="animate-in fade-in duration-200">
            <CompanySettingsAndBackupModule
              currentCommunity={communities[0]}
              activeSubTab="postulaciones"
              setActiveSubTab={(sub) => {
                if (sub !== 'postulaciones') {
                  setCompanySubSection(sub);
                  setActiveHubTab('config_empresa');
                }
              }}
            />
          </div>
        )}

        {/* ==================== VISTA 3: MI OFICINA — TRABAJADORES, CONTRATOS E IMPOSICIONES ==================== */}
        {activeHubTab === 'rrhh_oficina' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#0F3D2E]/10 text-[#0F3D2E]">
                    Gestión Interna de la Administradora • Sin Comunidades Ficticias
                  </span>
                  <h2 className="text-lg font-black text-slate-900">
                    RR.HH. de Mi Empresa: Trabajadores Propios, Contratos e Imposiciones (Previred / SII)
                  </h2>
                  <p className="text-xs text-slate-500 max-w-3xl">
                    Centraliza aquí los contratos laborales, liquidaciones de sueldo, boletas de honorarios e imposiciones previsionales de tus propios asistentes y colaboradores de oficina, totalmente separados de la contabilidad de las comunidades.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      printDocumentDirectly('printable-office-payroll-sheet', 'ARANPRO_Nomina_Imposiciones_Oficina', {
                        fitPage: true
                      })
                    }
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-[#0F3D2E]" />
                    <span>Imprimir Planilla RR.HH. Oficina (PDF)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddWorkerModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-black text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-[#D4B895]" />
                    <span>+ Agregar Trabajador / Colaborador</span>
                  </button>
                </div>
              </div>

              {/* KPIs de Nómina de la Oficina */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Dotación de Mi Oficina</span>
                  <strong className="text-xl font-black text-slate-900 mt-0.5 block">{officeWorkers.length} Colaboradores</strong>
                  <span className="text-[11px] text-slate-500">Contrato directo y honorarios</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Total Haberes / Bruto Mes</span>
                  <strong className="text-xl font-black text-slate-900 mt-0.5 block">{formatCLP(officePayrollMetrics.totalGross)}</strong>
                  <span className="text-[11px] text-slate-500">Base imponible mensual</span>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
                  <span className="text-[10px] font-bold uppercase text-amber-900 block">Imposiciones Previred & SII</span>
                  <strong className="text-xl font-black text-amber-950 mt-0.5 block">{formatCLP(officePayrollMetrics.totalPreviredAndTax)}</strong>
                  <span className="text-[11px] text-amber-800">AFP + Fonasa/Isapre + AFC + Retención</span>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                  <span className="text-[10px] font-bold uppercase text-emerald-800 block">Líquido a Pagar Equipo</span>
                  <strong className="text-xl font-black text-[#0F3D2E] mt-0.5 block">{formatCLP(officePayrollMetrics.totalNet)}</strong>
                  <span className="text-[11px] text-emerald-800">Costo empresa: {formatCLP(officePayrollMetrics.totalEmployerCost)}</span>
                </div>
              </div>

              <div className="no-print">
                <AranproPdfStyleSelector value={pdfStyle} onChange={setPdfStyle} compact />
              </div>

              {/* Documento Imprimible de Nómina e Imposiciones de la Empresa Administradora */}
              <div
                id="printable-office-payroll-sheet"
                data-pdf-style={pdfStyle}
                className="p-6 bg-white rounded-2xl border border-slate-200 space-y-5"
              >
                <div className="flex items-center justify-between border-b-2 border-[#0F3D2E] pb-3">
                  <div className="flex items-center space-x-3.5">
                    <AranproLogo variant="principal" className="h-12 w-auto" />
                    <div className="border-l border-slate-300 pl-3.5 space-y-0.5">
                      <div className="text-xs font-black text-[#0F3D2E] uppercase">
                        {companySettings?.provisionalName || 'ARANPRO • GESTIÓN INTEGRAL INMOBILIARIA'}
                      </div>
                      <div className="text-[10px] font-mono text-slate-600 font-bold">
                        RUT Empresa: {companySettings?.companyRut || '76.999.888-8'} • RNAC MINVU N° {companySettings?.rnacNumber || '48.912'}
                      </div>
                      <div className="text-[9.5px] text-slate-500">
                        Departamento de Recursos Humanos Internos & Cumplimiento Previsional de Oficina
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-0.5 rounded bg-[#F5F4EF] border border-[#D4B895] text-[#0F3D2E] text-[10px] font-mono font-bold">
                      NÓMINA INTERNA OFICINA
                    </span>
                    <p className="text-xs font-bold text-slate-800 mt-0.5">
                      Control de Contratos e Imposiciones
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#0F3D2E] text-white">
                        <th className="p-2.5 rounded-tl-lg">Colaborador / RUT</th>
                        <th className="p-2.5">Cargo & Función</th>
                        <th className="p-2.5">Vínculo / Previsión</th>
                        <th className="p-2.5 text-right">Sueldo Bruto</th>
                        <th className="p-2.5 text-right">Imposiciones / Ret.</th>
                        <th className="p-2.5 text-right">Líquido a Pago</th>
                        <th className="p-2.5 text-center">Estado Previred</th>
                        <th className="p-2.5 rounded-tr-lg text-center no-print">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {officeWorkers.map((w) => {
                        const gross = Number(w.grossSalary) || 0;
                        const isHonorarios = w.contractType === 'Boleta de Honorarios';
                        const imp = isHonorarios
                          ? Math.round(gross * ((Number(w.afpRate) || 13.75) / 100))
                          : Math.round(gross * (((Number(w.afpRate) || 11) + (Number(w.healthRate) || 7) + 0.6) / 100));
                        const net = gross - imp;
                        return (
                          <tr key={w.id} className="hover:bg-slate-50">
                            <td className="p-2.5">
                              <strong className="text-slate-900 block">{w.name}</strong>
                              <span className="font-mono text-[10px] text-slate-500">RUT: {w.rut}</span>
                            </td>
                            <td className="p-2.5">
                              <span className="font-semibold text-slate-800 block">{w.role}</span>
                              <span className="text-[10px] text-slate-500">{w.assignedCommunities}</span>
                            </td>
                            <td className="p-2.5">
                              <span className="font-bold text-[#0F3D2E] block text-[11px]">{w.contractType}</span>
                              <span className="text-[10px] text-slate-500">{w.afpName} • {w.healthSystem}</span>
                            </td>
                            <td className="p-2.5 text-right font-mono font-bold text-slate-800">{formatCLP(gross)}</td>
                            <td className="p-2.5 text-right font-mono text-amber-800 font-semibold">{formatCLP(imp)}</td>
                            <td className="p-2.5 text-right font-mono font-black text-[#0F3D2E]">{formatCLP(net)}</td>
                            <td className="p-2.5 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                ✓ {w.previredStatus}
                              </span>
                            </td>
                            <td className="p-2.5 text-center no-print">
                              <button
                                type="button"
                                onClick={() => setOfficeWorkers((prev) => prev.filter((item) => item.id !== w.id))}
                                className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                                title="Eliminar registro"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="pt-4 border-t border-slate-200 flex items-end justify-between">
                  <AranproOfficialSeal size="sm" />
                  <div className="text-center min-w-[230px]">
                    {companySettings?.signatureDataUrl && (
                      <img
                        src={companySettings.signatureDataUrl}
                        alt="Firma Administrador"
                        className="h-14 max-h-16 w-auto object-contain mx-auto mb-1"
                      />
                    )}
                    <div className="border-t border-slate-800 pt-1 text-[10px]">
                      <strong className="text-slate-900 block">{companySettings?.adminName || 'John Andrés Arancibia Maureira'}</strong>
                      <span className="text-slate-500 font-mono">Representante Legal ARANPRO • RNAC N° {companySettings?.rnacNumber || '48.912'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal para agregar colaborador de la oficina */}
            {showAddWorkerModal && (
              <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-black text-slate-900 uppercase">
                      Registrar Trabajador / Colaborador de Mi Empresa
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowAddWorkerModal(false)}
                      className="text-slate-400 hover:text-slate-700 font-bold"
                    >
                      ✕
                    </button>
                  </div>
                  <form onSubmit={handleCreateWorker} className="space-y-3 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block font-bold text-slate-700 mb-1">Nombre Completo *</label>
                        <input
                          type="text"
                          required
                          value={workerForm.name}
                          onChange={(e) => setWorkerForm({ ...workerForm, name: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">RUT *</label>
                        <input
                          type="text"
                          required
                          value={workerForm.rut}
                          onChange={(e) => setWorkerForm({ ...workerForm, rut: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Modalidad Contractual</label>
                        <select
                          value={workerForm.contractType}
                          onChange={(e) => setWorkerForm({ ...workerForm, contractType: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                        >
                          <option value="Contrato Indefinido">Contrato Indefinido</option>
                          <option value="Contrato Plazo Fijo">Contrato Plazo Fijo</option>
                          <option value="Boleta de Honorarios">Boleta de Honorarios (SII)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Cargo en tu Administradora</label>
                        <input
                          type="text"
                          value={workerForm.role}
                          onChange={(e) => setWorkerForm({ ...workerForm, role: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Sueldo Bruto / Honorario (CLP)</label>
                        <input
                          type="number"
                          value={workerForm.grossSalary}
                          onChange={(e) => setWorkerForm({ ...workerForm, grossSalary: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                        />
                      </div>
                    </div>
                    <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddWorkerModal(false)}
                        className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-[#0F3D2E] text-white font-bold"
                      >
                        Guardar en Mi Oficina
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== VISTA 4: CONVENIOS, GREMIOS, ABOGADOS & PROVEEDORES PREFERENTES ==================== */}
        {activeHubTab === 'alianzas' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* BLOQUE A: ALIANZAS CON GREMIOS, COLEGIOS, ABOGADOS Y CAPACITACIÓN */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#0F3D2E] bg-[#D4B895]/30 px-2.5 py-0.5 rounded-full">
                  Ecosistema Gremial & Respaldo Institucional
                </span>
                <h2 className="text-lg font-black text-slate-900 mt-1">
                  Convenios con Asociaciones Gremiales, Abogados & Centros de Capacitación
                </h2>
                <p className="text-xs text-slate-500">
                  Red de apoyo institucional para respaldar tu gestión ante comités de administración, juicios de cobranza y formación continua.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {DEFAULT_PARTNER_ALLIANCES.map((al) => (
                  <div key={al.id} className="p-5 rounded-2xl bg-[#FDFBF7] border border-slate-200 space-y-2.5 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-[#0F3D2E] text-[#D4B895]">
                          {al.category}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          ✓ {al.status}
                        </span>
                      </div>
                      <h3 className="text-sm font-black text-slate-900">{al.name}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">{al.benefit}</p>
                    </div>
                    <div className="pt-2.5 border-t border-slate-200/70 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">{al.contact}</span>
                      <a
                        href={al.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-black text-[#0F3D2E] hover:underline flex items-center gap-1"
                      >
                        <span>Abrir Portal</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* BLOQUE B: CARTERA PERSONAL DE PROVEEDORES DE CONFIANZA DEL ADMINISTRADOR */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#0F3D2E] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Directorio Maestro Multi-Comunidad
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  Mi Cartera Personal de Proveedores y Contratistas de Confianza ({trustedProviders.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Guarda aquí las empresas de seguridad, bombas, ascensores y contratistas de tu entera confianza para recomendarlos rápidamente en cualquiera de tus comunidades.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {trustedProviders.map((tp) => (
                  <div key={tp.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#0F3D2E] bg-[#D4B895]/30 px-2 py-0.5 rounded">
                          {tp.specialty}
                        </span>
                        <span className="text-[10px] font-black text-amber-600">{tp.rating}</span>
                      </div>
                      <h4 className="text-sm font-black text-slate-900 pt-1">{tp.companyName}</h4>
                      <p className="text-[11px] text-slate-600">Contacto: <strong>{tp.contactPerson}</strong></p>
                      <p className="text-[11px] font-mono text-slate-500">RUT: {tp.rut || 'Verificado'} • Fono: {tp.phone}</p>
                      <p className="text-[11px] text-slate-600 italic bg-white p-2 rounded-lg border border-slate-200 mt-1">
                        "{tp.notes}"
                      </p>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                      <a
                        href={`https://wa.me/${(tp.phone || '').replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-emerald-700 hover:underline"
                      >
                        💬 Contactar WhatsApp
                      </a>
                      <button
                        type="button"
                        onClick={() => setTrustedProviders((prev) => prev.filter((item) => item.id !== tp.id))}
                        className="text-rose-500 hover:text-rose-700 text-[11px] font-bold cursor-pointer"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Formulario rápido para agregar proveedor de confianza */}
              <form onSubmit={handleAddTrustedProvider} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-[11px] font-black uppercase text-[#0F3D2E] block">
                  + Incorporar Nuevo Proveedor de Confianza a mi Cartera de Empresa
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 text-xs">
                  <input
                    type="text"
                    required
                    placeholder="Rubro (ej: Seguridad OS-10)"
                    value={newProviderForm.specialty}
                    onChange={(e) => setNewProviderForm({ ...newProviderForm, specialty: e.target.value })}
                    className="px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Nombre Empresa *"
                    value={newProviderForm.companyName}
                    onChange={(e) => setNewProviderForm({ ...newProviderForm, companyName: e.target.value })}
                    className="px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold"
                  />
                  <input
                    type="text"
                    placeholder="Persona de Contacto"
                    value={newProviderForm.contactPerson}
                    onChange={(e) => setNewProviderForm({ ...newProviderForm, contactPerson: e.target.value })}
                    className="px-3 py-2 bg-white border border-slate-300 rounded-xl"
                  />
                  <input
                    type="text"
                    placeholder="WhatsApp / Teléfono"
                    value={newProviderForm.phone}
                    onChange={(e) => setNewProviderForm({ ...newProviderForm, phone: e.target.value })}
                    className="px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-bold cursor-pointer"
                  >
                    Guardar Proveedor
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ==================== VISTA 5: CONFIGURACIÓN DE EMPRESA, FIRMA DIGITAL, RNAC & RESPALDOS ==================== */}
        {activeHubTab === 'config_empresa' && (
          <div className="animate-in fade-in duration-200">
            <CompanySettingsAndBackupModule
              currentCommunity={communities[0]}
              activeSubTab={companySubSection}
              setActiveSubTab={setCompanySubSection}
            />
          </div>
        )}
        </div>
      </div>

      {/* MODAL RÁPIDO PARA HABILITAR UNA NUEVA COMUNIDAD DESDE EL PANEL DE EMPRESA */}
      {showNewCommunityModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-[#0F3D2E] block">
                  Incorporación de Cartera ARANPRO
                </span>
                <h3 className="text-base font-black text-slate-900">
                  Habilitar Nueva Comunidad en el Sistema
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewCommunityModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewCommunity} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Nombre del Condominio / Edificio *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Condominio Mirador del Faro"
                    value={newCommData.name}
                    onChange={(e) => setNewCommData({ ...newCommData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">RUT de la Comunidad</label>
                  <input
                    type="text"
                    placeholder="Ej: 65.210.890-2"
                    value={newCommData.communityRut}
                    onChange={(e) => setNewCommData({ ...newCommData, communityRut: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo de Comunidad</label>
                  <select
                    value={newCommData.type}
                    onChange={(e) => setNewCommData({ ...newCommData, type: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  >
                    <option value="Casas">Condominio de Casas</option>
                    <option value="Edificio">Edificio de Departamentos</option>
                    <option value="Mixto">Mixto</option>
                    <option value="Locales Comerciales">Locales / Oficinas</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Dirección Exacta</label>
                  <input
                    type="text"
                    placeholder="Ej: Av. del Mar 3400"
                    value={newCommData.address}
                    onChange={(e) => setNewCommData({ ...newCommData, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Comuna / Ciudad</label>
                  <input
                    type="text"
                    value={newCommData.city}
                    onChange={(e) => setNewCommData({ ...newCommData, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cantidad de Unidades</label>
                  <input
                    type="number"
                    min={1}
                    value={newCommData.totalUnits}
                    onChange={(e) => setNewCommData({ ...newCommData, totalUnits: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewCommunityModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0F3D2E] hover:bg-[#0A291F] text-white font-black"
                >
                  Crear y Abrir Comunidad →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyEnterpriseHub;
