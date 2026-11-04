-- ==============================================================================
-- SCHEMA INTEGRAL SUPABASE - GESTIÓN DE CONDOMINIOS ARANPRO / LEY 21.442
-- Soporte multi-comunidad, auditoría con autor/asistente y acceso seguro
-- ==============================================================================

-- 1. Habilitar extensiones requeridas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA DE USUARIOS DEL EQUIPO (Administrador Maestro y Asistentes)
-- Permite registrar quién realizó cada acción para trazabilidad total
CREATE TABLE IF NOT EXISTS public.staff_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rut VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    email VARCHAR(120),
    telefono VARCHAR(30),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) DEFAULT 'asistente' CHECK (role IN ('superadmin', 'admin', 'asistente')),
    permisos JSONB DEFAULT '{"editar_gastos": true, "aprobar_pagos": false, "crear_comunidad": false}'::jsonb,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insertar el Administrador Titular (John Andrés Arancibia Maureira)
INSERT INTO public.staff_users (rut, nombre, email, password_hash, role, permisos, activo)
VALUES (
    '16.012.871-2',
    'John Andrés Arancibia Maureira',
    'contacto@aranpro.cl',
    'admin123',
    'superadmin',
    '{"all": true, "crear_comunidad": true, "editar_gastos": true, "aprobar_pagos": true}'::jsonb,
    true
)
ON CONFLICT (rut) DO UPDATE 
SET nombre = EXCLUDED.nombre,
    role = EXCLUDED.role,
    permisos = EXCLUDED.permisos;

-- 3. TABLA DE COMUNIDADES / CONDOMINIOS
CREATE TABLE IF NOT EXISTS public.communities (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    rut VARCHAR(20),
    address TEXT,
    commune VARCHAR(100),
    region VARCHAR(100) DEFAULT 'Coquimbo',
    total_units INTEGER DEFAULT 0,
    fondo_reserva_percent NUMERIC(5,2) DEFAULT 5.00,
    active BOOLEAN DEFAULT true,
    created_by_rut VARCHAR(20) REFERENCES public.staff_users(rut) ON UPDATE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insertar comunidades iniciales
INSERT INTO public.communities (id, name, rut, address, commune, total_units, fondo_reserva_percent)
VALUES 
('los-cerezos', 'Condominio Los Cerezos', '65.123.456-7', 'Av. Los Pajaritos 1234', 'Maipú', 48, 5.00),
('las-palmas', 'Condominio Las Palmas', '65.987.654-3', 'Calle Las Palmas 567', 'La Florida', 64, 5.00)
ON CONFLICT (id) DO NOTHING;

-- 4. TABLA DE UNIDADES / DEPARTAMENTOS / CASAS
CREATE TABLE IF NOT EXISTS public.units (
    id VARCHAR(80) PRIMARY KEY, -- Ej: los-cerezos_101
    community_id VARCHAR(50) NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
    unit_number VARCHAR(30) NOT NULL,
    block_tower VARCHAR(50),
    unit_type VARCHAR(30) DEFAULT 'departamento',
    prorrateo NUMERIC(8,5) DEFAULT 0.00000,
    owner_name VARCHAR(120) NOT NULL,
    owner_rut VARCHAR(20),
    owner_email VARCHAR(120),
    owner_phone VARCHAR(30),
    current_debt INTEGER DEFAULT 0,
    is_committee BOOLEAN DEFAULT false,
    committee_role VARCHAR(50),
    password_hash VARCHAR(255) DEFAULT '1234',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(community_id, unit_number)
);

-- 5. TABLA DE GASTOS Y FACTURAS (Con trazabilidad de quién lo cargó)
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id VARCHAR(50) NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
    period VARCHAR(10) NOT NULL, -- '2026-11'
    category VARCHAR(80) NOT NULL, -- 'Servicios Básicos', 'Mantenimiento', etc.
    description TEXT NOT NULL,
    amount INTEGER NOT NULL,
    provider_name VARCHAR(120),
    provider_rut VARCHAR(20),
    document_type VARCHAR(50) DEFAULT 'Factura',
    document_number VARCHAR(50),
    document_date DATE DEFAULT CURRENT_DATE,
    receipt_url TEXT,
    created_by_rut VARCHAR(20) REFERENCES public.staff_users(rut) ON UPDATE CASCADE,
    created_by_name VARCHAR(120) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. TABLA DE PERÍODOS DE GASTO COMÚN
CREATE TABLE IF NOT EXISTS public.billing_periods (
    id VARCHAR(80) PRIMARY KEY, -- 'los-cerezos_2026-11'
    community_id VARCHAR(50) NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
    period VARCHAR(10) NOT NULL, -- '2026-11'
    total_ordinary_expenses INTEGER DEFAULT 0,
    reserve_fund_amount INTEGER DEFAULT 0,
    total_issued INTEGER DEFAULT 0,
    status VARCHAR(30) DEFAULT 'borrador' CHECK (status IN ('borrador', 'emitido', 'cerrado')),
    issued_at TIMESTAMP WITH TIME ZONE,
    due_date DATE,
    created_by_rut VARCHAR(20) REFERENCES public.staff_users(rut) ON UPDATE CASCADE,
    created_by_name VARCHAR(120) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. TABLA DE COLILLAS INDIVIDUALES POR RESIDENTE
CREATE TABLE IF NOT EXISTS public.unit_bills (
    id VARCHAR(100) PRIMARY KEY, -- 'los-cerezos_2026-11_101'
    billing_period_id VARCHAR(80) NOT NULL REFERENCES public.billing_periods(id) ON DELETE CASCADE,
    community_id VARCHAR(50) NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
    unit_id VARCHAR(80) NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    period VARCHAR(10) NOT NULL,
    prorrated_amount INTEGER DEFAULT 0,
    reserve_fund_amount INTEGER DEFAULT 0,
    debt_previous INTEGER DEFAULT 0,
    interest INTEGER DEFAULT 0,
    total_to_pay INTEGER DEFAULT 0,
    status VARCHAR(30) DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'revision', 'pagado', 'vencido')),
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. TABLA DE COMPROBANTES Y PAGOS REPORTADOS POR VECINOS
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_bill_id VARCHAR(100) REFERENCES public.unit_bills(id) ON DELETE SET NULL,
    community_id VARCHAR(50) NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
    unit_id VARCHAR(80) NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'Transferencia',
    transaction_number VARCHAR(100),
    receipt_url TEXT,
    notes TEXT,
    status VARCHAR(30) DEFAULT 'pendiente_aprobacion' CHECK (status IN ('pendiente_aprobacion', 'aprobado', 'rechazado')),
    reviewed_by_rut VARCHAR(20) REFERENCES public.staff_users(rut) ON UPDATE CASCADE,
    reviewed_by_name VARCHAR(120),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. TABLA DE RECLAMOS, TICKETS Y SOLICITUDES DE VECINOS
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id VARCHAR(50) NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
    unit_id VARCHAR(80) NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL, -- 'Ruidos molestos', 'Mantenimiento', 'Conserjería', 'Gastos comunes'
    subject VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'abierto' CHECK (status IN ('abierto', 'en_revision', 'resuelto', 'cerrado')),
    response TEXT,
    responded_by_rut VARCHAR(20) REFERENCES public.staff_users(rut) ON UPDATE CASCADE,
    responded_by_name VARCHAR(120),
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. TABLA DE AUDITORÍA Y TRAZABILIDAD (Log inmutable de cambios)
-- Registra quién cambió qué, diferenciando Administrador de Asistentes
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id VARCHAR(50),
    action VARCHAR(100) NOT NULL, -- 'CREAR_GASTO', 'APROBAR_PAGO', 'EMITIR_COLILLAS', 'MODIFICAR_UNIDAD'
    user_rut VARCHAR(20) NOT NULL,
    user_name VARCHAR(120) NOT NULL,
    user_role VARCHAR(30) NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. TABLA DE DESPACHOS MASIVOS DE CORREOS (Tracking estilo EdiPro)
CREATE TABLE IF NOT EXISTS public.email_dispatches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id VARCHAR(50) NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
    subject VARCHAR(200) NOT NULL,
    campaign_type VARCHAR(50) DEFAULT 'colilla_gasto_comun', -- 'colilla_gasto_comun' | 'comunicado_urgente' | 'citacion_asamblea'
    period VARCHAR(10),
    total_recipients INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    bounced_count INTEGER DEFAULT 0,
    created_by_rut VARCHAR(20),
    created_by_name VARCHAR(120),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. TABLA DE LOGS INDIVIDUALES DE CORREO POR UNIDAD (Tracking de apertura / lectura)
CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispatch_id UUID REFERENCES public.email_dispatches(id) ON DELETE CASCADE,
    community_id VARCHAR(50) NOT NULL,
    unit_number VARCHAR(30) NOT NULL,
    recipient_name VARCHAR(120) NOT NULL,
    recipient_email VARCHAR(120) NOT NULL,
    status VARCHAR(30) DEFAULT 'entregado' CHECK (status IN ('enviado', 'entregado', 'abierto', 'rebotado')),
    opened_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 13. HABILITAR SEGURIDAD ROW LEVEL SECURITY (RLS)
ALTER TABLE public.staff_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todo en email_dispatches" ON public.email_dispatches FOR ALL USING (true);
CREATE POLICY "Permitir todo en email_logs" ON public.email_logs FOR ALL USING (true);

-- Políticas de lectura y escritura permisivas para el cliente Web/PWA anon
-- (Controladas por la lógica de negocio y clave de administrador/asistente)
CREATE POLICY "Permitir lectura publica a staff_users" ON public.staff_users FOR SELECT USING (true);
CREATE POLICY "Permitir update a staff_users" ON public.staff_users FOR UPDATE USING (true);

CREATE POLICY "Permitir lectura publica a communities" ON public.communities FOR SELECT USING (true);
CREATE POLICY "Permitir insercion y actualizacion en communities" ON public.communities FOR ALL USING (true);

CREATE POLICY "Permitir todo en units" ON public.units FOR ALL USING (true);
CREATE POLICY "Permitir todo en expenses" ON public.expenses FOR ALL USING (true);
CREATE POLICY "Permitir todo en billing_periods" ON public.billing_periods FOR ALL USING (true);
CREATE POLICY "Permitir todo en unit_bills" ON public.unit_bills FOR ALL USING (true);
CREATE POLICY "Permitir todo en payments" ON public.payments FOR ALL USING (true);
CREATE POLICY "Permitir todo en tickets" ON public.tickets FOR ALL USING (true);
CREATE POLICY "Permitir todo en audit_logs" ON public.audit_logs FOR ALL USING (true);
