-- ==============================================================================
-- MIGRACIÓN 0002: OPERACIÓN EN LÍNEA MULTIUSUARIO, AUTO-SYNC Y NOTIFICACIONES
-- Proyecto: ARANPRO Gestión Integral de Condominios (Ley N° 21.442)
-- Seguridad: Todo el almacenamiento permanece en aranpro_private (RLS activo,
-- sin tablas públicas expuestas). Acceso controlado vía RPC SECURITY DEFINER.
-- ==============================================================================
begin;

create schema if not exists aranpro_private;
revoke all on schema aranpro_private from public, anon, authenticated;

-- 1. Estado vivo unificado de la plataforma (Comunidades, Configuración y Certificados)
create table if not exists aranpro_private.live_workspace (
  id text primary key default 'main',
  revision bigint not null default 0,
  snapshot jsonb not null default '{"communities":[],"companySettings":{},"certificates":[]}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by text
);

-- 2. Cuentas de Administración y Equipo (con contraseña cifrada SHA-256)
create table if not exists aranpro_private.staff_accounts (
  id uuid primary key default gen_random_uuid(),
  rut_clean text unique not null,
  rut_display text not null,
  nombre text not null,
  email text,
  telefono text,
  password_digest bytea not null,
  role text not null default 'asistente' check (role in ('superadmin', 'admin', 'asistente')),
  permisos jsonb not null default '{"editar_gastos":true,"aprobar_pagos":false,"responder_tickets":true,"emitir_colillas":false}'::jsonb,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Semilla segura del Administrador Titular (no sobrescribe si ya cambió su clave)
insert into aranpro_private.staff_accounts (
  rut_clean, rut_display, nombre, email, telefono, password_digest, role, permisos, activo
) values (
  '160128712',
  '16.012.871-2',
  'John Andrés Arancibia Maureira',
  'aranpro.info@gmail.com',
  '+56958118504',
  sha256(convert_to('admin123', 'UTF8')),
  'superadmin',
  '{"all":true,"crear_comunidad":true,"editar_gastos":true,"aprobar_pagos":true,"responder_tickets":true,"emitir_colillas":true}'::jsonb,
  true
) on conflict (rut_clean) do nothing;

-- 3. Bandeja Central de Notificaciones Bidireccionales (Admin <-> Residentes)
create table if not exists aranpro_private.notifications (
  id uuid primary key default gen_random_uuid(),
  target_role text not null check (target_role in ('admin', 'resident')),
  community_id text,
  unit_id text,
  unit_number text,
  category text not null default 'general',
  title text not null,
  message text not null,
  meta jsonb not null default '{}'::jsonb,
  read_by jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_aranpro_notifications_target
  on aranpro_private.notifications (target_role, community_id, created_at desc);

revoke all on all tables in schema aranpro_private from public, anon, authenticated;
alter table aranpro_private.live_workspace enable row level security;
alter table aranpro_private.staff_accounts enable row level security;
alter table aranpro_private.notifications enable row level security;

-- Si ya existía un respaldo previo en aranpro_private.backups, hidratar live_workspace inicialmente
insert into aranpro_private.live_workspace (id, revision, snapshot, updated_at, updated_by)
select 'main', b.revision, b.snapshot, b.saved_at, 'migracion_inicial'
from aranpro_private.backups b
order by b.saved_at desc
limit 1
on conflict (id) do nothing;

-- ==============================================================================
-- FUNCIONES INTERNAS DE APOYO (ESQUEMA PRIVADO)
-- ==============================================================================

create or replace function aranpro_private.clean_rut(p_val text) returns text
language sql immutable set search_path = '' as $$
  select lower(regexp_replace(coalesce(p_val, ''), '[^0-9kK]', '', 'g'));
$$;

create or replace function aranpro_private.is_authorized_staff(p_rut text default null, p_password text default null)
returns boolean language plpgsql stable security definer set search_path = '' as $$
declare
  v_clean text := aranpro_private.clean_rut(p_rut);
begin
  if public.aranpro_is_issuer() then
    return true;
  end if;
  if v_clean = '' or p_password is null or trim(p_password) = '' then
    return false;
  end if;
  return exists(
    select 1 from aranpro_private.staff_accounts s
    where s.activo = true
      and (s.rut_clean = v_clean or (lower(trim(p_rut)) = 'admin' and s.role = 'superadmin'))
      and s.password_digest = sha256(convert_to(trim(p_password), 'UTF8'))
  );
end; $$;

revoke all on function aranpro_private.clean_rut(text), aranpro_private.is_authorized_staff(text, text)
  from public, anon, authenticated;

-- ==============================================================================
-- COMPATIBILIDAD CON RESPALDO MANUAL (CloudSyncButton) + LIVE WORKSPACE
-- ==============================================================================

create or replace function public.aranpro_save_backup(p_revision bigint, p_snapshot jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_ws aranpro_private.live_workspace;
  v_next_rev bigint;
begin
  if not public.aranpro_is_issuer() then raise exception 'Cuenta sin autorización'; end if;
  if jsonb_typeof(p_snapshot->'communities') is distinct from 'array'
    or jsonb_typeof(p_snapshot->'certificates') is distinct from 'array'
    or jsonb_typeof(p_snapshot->'companySettings') is distinct from 'object'
    then raise exception 'Respaldo incompleto'; end if;

  select * into v_ws from aranpro_private.live_workspace where id = 'main' for update;
  if not found then
    insert into aranpro_private.live_workspace (id, revision, snapshot, updated_at, updated_by)
    values ('main', 1, p_snapshot, clock_timestamp(), coalesce(auth.uid()::text, 'issuer'))
    returning * into v_ws;
  else
    if p_revision > 0 and v_ws.revision > p_revision then
      raise exception 'La nube tiene otra versión (%). Descargue el respaldo antes de subir cambios.', v_ws.revision;
    end if;
    v_next_rev := v_ws.revision + 1;
    update aranpro_private.live_workspace
       set revision = v_next_rev,
           snapshot = p_snapshot,
           updated_at = clock_timestamp(),
           updated_by = coalesce(auth.uid()::text, 'issuer')
     where id = 'main'
     returning * into v_ws;
  end if;

  if auth.uid() is not null then
    insert into aranpro_private.backups (owner_id, revision, snapshot, saved_at)
    values (auth.uid(), v_ws.revision, p_snapshot, v_ws.updated_at)
    on conflict (owner_id) do update
      set revision = excluded.revision,
          snapshot = excluded.snapshot,
          saved_at = excluded.saved_at;
  end if;

  return jsonb_build_object('revision', v_ws.revision, 'timestamp', v_ws.updated_at);
end; $$;

create or replace function public.aranpro_load_backup()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_ws aranpro_private.live_workspace;
begin
  if not public.aranpro_is_issuer() then raise exception 'Cuenta sin autorización'; end if;
  select * into v_ws from aranpro_private.live_workspace where id = 'main';
  if found and v_ws.revision > 0 then
    return jsonb_build_object('revision', v_ws.revision, 'timestamp', v_ws.updated_at, 'snapshot', v_ws.snapshot);
  end if;
  return (
    select jsonb_build_object('revision', revision, 'timestamp', saved_at, 'snapshot', snapshot)
    from aranpro_private.backups where owner_id = auth.uid()
  );
end; $$;

-- ==============================================================================
-- AUTENTICACIÓN Y GESTIÓN DE EQUIPO ADMINISTRADOR + AUTO-SYNC
-- ==============================================================================

create or replace function public.aranpro_staff_login(p_rut text, p_password text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_clean text := aranpro_private.clean_rut(p_rut);
  v_staff aranpro_private.staff_accounts;
  v_ws aranpro_private.live_workspace;
begin
  if (v_clean = '' and lower(trim(coalesce(p_rut, ''))) <> 'admin') or p_password is null or trim(p_password) = '' then
    return jsonb_build_object('ok', false, 'error', 'Ingrese RUT y contraseña');
  end if;

  select * into v_staff
  from aranpro_private.staff_accounts s
  where s.activo = true
    and (s.rut_clean = v_clean or (lower(trim(p_rut)) = 'admin' and s.role = 'superadmin'))
    and s.password_digest = sha256(convert_to(trim(p_password), 'UTF8'))
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Credenciales inválidas o cuenta inactiva');
  end if;

  select * into v_ws from aranpro_private.live_workspace where id = 'main';

  return jsonb_build_object(
    'ok', true,
    'user', jsonb_build_object(
      'id', v_staff.id,
      'rut', v_staff.rut_display,
      'nombre', v_staff.nombre,
      'email', v_staff.email,
      'telefono', v_staff.telefono,
      'role', v_staff.role,
      'permisos', v_staff.permisos
    ),
    'revision', coalesce(v_ws.revision, 0),
    'updatedAt', v_ws.updated_at,
    'snapshot', case when v_ws.revision > 0 then v_ws.snapshot else null end
  );
end; $$;

create or replace function public.aranpro_staff_manage(
  p_admin_rut text,
  p_admin_password text,
  p_op text,
  p_payload jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_clean_admin text := aranpro_private.clean_rut(p_admin_rut);
  v_is_super boolean := false;
  v_new_clean text;
  v_staff aranpro_private.staff_accounts;
begin
  if public.aranpro_is_issuer() then
    v_is_super := true;
  else
    select exists(
      select 1 from aranpro_private.staff_accounts s
      where s.activo = true
        and (s.rut_clean = v_clean_admin or lower(trim(coalesce(p_admin_rut, ''))) = 'admin')
        and s.role in ('superadmin', 'admin')
        and s.password_digest = sha256(convert_to(trim(coalesce(p_admin_password, '')), 'UTF8'))
    ) into v_is_super;
  end if;

  if not v_is_super then
    raise exception 'Sin permisos para administrar cuentas de equipo';
  end if;

  if p_op = 'list' then
    return jsonb_build_object(
      'ok', true,
      'data', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', s.id,
          'rut', s.rut_display,
          'nombre', s.nombre,
          'email', s.email,
          'telefono', s.telefono,
          'role', s.role,
          'permisos', s.permisos,
          'activo', s.activo,
          'created_at', s.created_at
        ) order by s.created_at asc)
        from aranpro_private.staff_accounts s
      ), '[]'::jsonb)
    );
  elsif p_op = 'create' then
    v_new_clean := aranpro_private.clean_rut(p_payload->>'rut');
    if v_new_clean = '' or nullif(trim(coalesce(p_payload->>'password', '')), '') is null then
      raise exception 'RUT y contraseña requeridos';
    end if;
    insert into aranpro_private.staff_accounts (
      rut_clean, rut_display, nombre, email, telefono, password_digest, role, permisos, activo
    ) values (
      v_new_clean,
      trim(p_payload->>'rut'),
      coalesce(nullif(trim(p_payload->>'nombre'), ''), 'Integrante ARANPRO'),
      nullif(trim(coalesce(p_payload->>'email', '')), ''),
      nullif(trim(coalesce(p_payload->>'telefono', '')), ''),
      sha256(convert_to(trim(p_payload->>'password'), 'UTF8')),
      coalesce(nullif(p_payload->>'role', ''), 'asistente'),
      coalesce(p_payload->'permisos', '{}'::jsonb),
      true
    )
    on conflict (rut_clean) do update
      set nombre = excluded.nombre,
          email = excluded.email,
          telefono = excluded.telefono,
          password_digest = excluded.password_digest,
          role = excluded.role,
          permisos = excluded.permisos,
          activo = true,
          updated_at = now()
    returning * into v_staff;

    return jsonb_build_object('ok', true, 'data', jsonb_build_object(
      'id', v_staff.id, 'rut', v_staff.rut_display, 'nombre', v_staff.nombre,
      'email', v_staff.email, 'telefono', v_staff.telefono, 'role', v_staff.role, 'permisos', v_staff.permisos
    ));
  elsif p_op = 'delete' then
    delete from aranpro_private.staff_accounts
    where id = (p_payload->>'id')::uuid and role <> 'superadmin';
    return jsonb_build_object('ok', true);
  elsif p_op = 'update_password' then
    v_new_clean := aranpro_private.clean_rut(coalesce(p_payload->>'rut', p_admin_rut));
    update aranpro_private.staff_accounts
       set password_digest = sha256(convert_to(trim(p_payload->>'newPassword'), 'UTF8')),
           updated_at = now()
     where rut_clean = v_new_clean;
    return jsonb_build_object('ok', true);
  end if;

  raise exception 'Operación no soportada';
end; $$;

-- Pull liviano para Auto-Sync de Administración
create or replace function public.aranpro_workspace_pull(
  p_admin_rut text default null,
  p_admin_password text default null,
  p_known_revision bigint default 0
) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_ws aranpro_private.live_workspace;
begin
  if not aranpro_private.is_authorized_staff(p_admin_rut, p_admin_password) then
    return jsonb_build_object('ok', false, 'unauthorized', true);
  end if;

  select * into v_ws from aranpro_private.live_workspace where id = 'main';
  if not found or v_ws.revision = 0 then
    return jsonb_build_object('ok', true, 'empty', true, 'revision', 0);
  end if;

  if v_ws.revision <= coalesce(p_known_revision, 0) then
    return jsonb_build_object('ok', true, 'upToDate', true, 'revision', v_ws.revision, 'updatedAt', v_ws.updated_at);
  end if;

  return jsonb_build_object(
    'ok', true,
    'upToDate', false,
    'revision', v_ws.revision,
    'updatedAt', v_ws.updated_at,
    'snapshot', v_ws.snapshot
  );
end; $$;

-- Push atómico con control de concurrencia para Auto-Sync de Administración
create or replace function public.aranpro_workspace_push(
  p_revision bigint,
  p_snapshot jsonb,
  p_admin_rut text default null,
  p_admin_password text default null,
  p_force boolean default false
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_ws aranpro_private.live_workspace;
begin
  if not aranpro_private.is_authorized_staff(p_admin_rut, p_admin_password) then
    return jsonb_build_object('ok', false, 'unauthorized', true);
  end if;

  if jsonb_typeof(p_snapshot->'communities') is distinct from 'array'
    or jsonb_typeof(p_snapshot->'certificates') is distinct from 'array'
    or jsonb_typeof(p_snapshot->'companySettings') is distinct from 'object' then
    raise exception 'Estructura de sincronización inválida';
  end if;

  select * into v_ws from aranpro_private.live_workspace where id = 'main' for update;
  if not found or v_ws.revision = 0 then
    insert into aranpro_private.live_workspace (id, revision, snapshot, updated_at, updated_by)
    values ('main', 1, p_snapshot, clock_timestamp(), coalesce(p_admin_rut, auth.uid()::text, 'admin'))
    on conflict (id) do update
      set revision = 1,
          snapshot = excluded.snapshot,
          updated_at = excluded.updated_at,
          updated_by = excluded.updated_by
    returning * into v_ws;
  else
    if not coalesce(p_force, false) and v_ws.revision > coalesce(p_revision, 0) then
      return jsonb_build_object(
        'ok', false,
        'conflict', true,
        'revision', v_ws.revision,
        'updatedAt', v_ws.updated_at,
        'snapshot', v_ws.snapshot
      );
    end if;

    update aranpro_private.live_workspace
       set revision = v_ws.revision + 1,
           snapshot = p_snapshot,
           updated_at = clock_timestamp(),
           updated_by = coalesce(p_admin_rut, auth.uid()::text, 'admin')
     where id = 'main'
     returning * into v_ws;
  end if;

  if auth.uid() is not null then
    insert into aranpro_private.backups (owner_id, revision, snapshot, saved_at)
    values (auth.uid(), v_ws.revision, p_snapshot, v_ws.updated_at)
    on conflict (owner_id) do update
      set revision = excluded.revision,
          snapshot = excluded.snapshot,
          saved_at = excluded.saved_at;
  end if;

  return jsonb_build_object('ok', true, 'revision', v_ws.revision, 'updatedAt', v_ws.updated_at);
end; $$;

-- ==============================================================================
-- PORTAL EN LÍNEA PARA RESIDENTES Y COMITÉ (ACCESO SEGURO DESDE CUALQUIER LUGAR)
-- ==============================================================================

-- Directorio básico público solo con nombre/slug/dirección para cabeceras de login (?c=slug)
create or replace function public.aranpro_public_communities()
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', c->>'id',
      'slug', c->>'slug',
      'name', c->>'name',
      'address', c->>'address',
      'city', c->>'city',
      'commune', c->>'commune',
      'documentLogo', c->'documentLogo'
    ))
    from aranpro_private.live_workspace w,
         jsonb_array_elements(w.snapshot->'communities') as c
    where w.id = 'main' and w.revision > 0
  ), '[]'::jsonb);
$$;

-- Login y descarga en vivo de la comunidad para un Residente o Comité verificado
create or replace function public.aranpro_resident_portal_sync(
  p_rut_or_unit text,
  p_password text,
  p_community_slug text default null
) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_ws aranpro_private.live_workspace;
  v_input_clean text := aranpro_private.clean_rut(p_rut_or_unit);
  v_input_trim text := trim(coalesce(p_rut_or_unit, ''));
  v_pass_trim text := trim(coalesce(p_password, ''));
  v_comm jsonb;
  v_unit jsonb;
  v_sub jsonb;
  v_matched boolean := false;
  v_expected_pass text;
  v_sanitized_units jsonb;
  v_sanitized_comm jsonb;
  v_unit_certs jsonb;
  v_notifs jsonb;
  v_is_committee boolean := false;
begin
  if v_input_trim = '' or v_pass_trim = '' then
    return jsonb_build_object('ok', false, 'message', 'Ingrese su RUT o unidad y contraseña.');
  end if;

  select * into v_ws from aranpro_private.live_workspace where id = 'main';
  if not found or v_ws.revision = 0 then
    return jsonb_build_object('ok', false, 'emptyCloud', true, 'message', 'Sincronizando base de comunidades.');
  end if;

  for v_comm in
    select elem from jsonb_array_elements(v_ws.snapshot->'communities') as elem
    where p_community_slug is null
       or trim(p_community_slug) = ''
       or elem->>'slug' = p_community_slug
       or elem->>'id' = p_community_slug
  loop
    for v_unit in select u from jsonb_array_elements(coalesce(v_comm->'units', '[]'::jsonb)) as u
    loop
      v_sub := null;
      if (v_input_clean <> '' and aranpro_private.clean_rut(v_unit->>'rut') = v_input_clean)
         or (v_unit->>'number') = v_input_trim
         or (v_unit->>'id') = v_input_trim then
        v_matched := true;
      else
        select s into v_sub
        from jsonb_array_elements(coalesce(v_unit->'additionalUsers', '[]'::jsonb)) as s
        where v_input_clean <> '' and aranpro_private.clean_rut(s->>'rut') = v_input_clean
        limit 1;
        if v_sub is not null then
          v_matched := true;
        end if;
      end if;

      if v_matched then
        v_expected_pass := coalesce(
          nullif(v_sub->>'password', ''),
          nullif(v_unit->>'password', ''),
          v_unit->>'number'
        );
        if v_pass_trim = v_expected_pass
           or v_pass_trim = coalesce(nullif(v_unit->>'password', ''), v_unit->>'number')
           or (nullif(v_unit->>'password', '') is null and v_pass_trim = (v_unit->>'number')) then
          exit;
        else
          return jsonb_build_object('ok', false, 'message', 'Contraseña incorrecta.');
        end if;
      end if;
    end loop;

    if v_matched then
      exit;
    end if;
  end loop;

  if not v_matched then
    return jsonb_build_object('ok', false, 'message', 'RUT o vivienda no encontrada en el registro en línea.');
  end if;

  v_is_committee := coalesce((v_unit->>'isCommittee')::boolean, false);

  -- Sanitizar unidades vecinas (nunca exponer contraseñas de terceros)
  select coalesce(jsonb_agg(
    case
      when (u->>'id') = (v_unit->>'id') then u - 'password'
      when v_is_committee then u - 'password'
      else jsonb_build_object(
        'id', u->'id',
        'number', u->'number',
        'tower', u->'tower',
        'owner', u->'owner',
        'sharePercentage', u->'sharePercentage',
        'currentCharge', u->'currentCharge',
        'previousDebt', u->'previousDebt',
        'extraCharge', u->'extraCharge',
        'creditBalance', u->'creditBalance',
        'paidAmount', u->'paidAmount',
        'paid', u->'paid',
        'isCommittee', u->'isCommittee',
        'committeeRole', u->'committeeRole',
        'repactacion', u->'repactacion'
      )
    end
  ), '[]'::jsonb)
  into v_sanitized_units
  from jsonb_array_elements(coalesce(v_comm->'units', '[]'::jsonb)) as u;

  v_sanitized_comm := jsonb_set(v_comm, '{units}', v_sanitized_units, true);

  -- Filtrar certificados correspondientes a esta unidad
  select coalesce(jsonb_agg(c), '[]'::jsonb)
  into v_unit_certs
  from jsonb_array_elements(coalesce(v_ws.snapshot->'certificates', '[]'::jsonb)) as c
  where ((c->>'communityId') = (v_comm->>'id') or (c->>'communityName') = (v_comm->>'name'))
    and (
      (c->>'unitNumber') = (v_unit->>'number')
      or (aranpro_private.clean_rut(c->>'rut') <> '' and aranpro_private.clean_rut(c->>'rut') = aranpro_private.clean_rut(v_unit->>'rut'))
    );

  -- Últimas notificaciones dirigidas a la comunidad o a esta unidad
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', n.id,
    'category', n.category,
    'title', n.title,
    'message', n.message,
    'meta', n.meta,
    'readBy', n.read_by,
    'createdAt', n.created_at
  ) order by n.created_at desc), '[]'::jsonb)
  into v_notifs
  from (
    select * from aranpro_private.notifications n
    where n.target_role = 'resident'
      and (n.community_id is null or n.community_id = (v_comm->>'id') or n.community_id = (v_comm->>'slug'))
      and (n.unit_id is null or n.unit_id = (v_unit->>'id') or n.unit_number = (v_unit->>'number'))
    order by n.created_at desc
    limit 40
  ) n;

  return jsonb_build_object(
    'ok', true,
    'revision', v_ws.revision,
    'community', v_sanitized_comm,
    'companySettings', coalesce(v_ws.snapshot->'companySettings', '{}'::jsonb) - 'adminPin',
    'certificates', v_unit_certs,
    'notifications', v_notifs,
    'user', jsonb_build_object(
      'role', 'resident',
      'communityId', v_comm->>'id',
      'communitySlug', v_comm->>'slug',
      'communityName', v_comm->>'name',
      'unitId', v_unit->>'id',
      'unitNumber', v_unit->>'number',
      'owner', v_unit->>'owner',
      'isCommittee', v_is_committee,
      'committeeRole', coalesce(v_unit->>'committeeRole', ''),
      'rut', coalesce(v_sub->>'rut', v_unit->>'rut'),
      'loggedUserName', coalesce(v_sub->>'name', v_unit->>'owner'),
      'loggedUserRole', coalesce(v_sub->>'role', case when v_is_committee then coalesce(nullif(v_unit->>'committeeRole',''), 'Comité de Administración') else 'Propietario(a)' end)
    )
  );
end; $$;

-- Envío de acciones en línea desde el Portal del Residente (Pagos, Certificados, Reclamos, Votos, Clave)
create or replace function public.aranpro_resident_submit(
  p_community_id text,
  p_unit_id text,
  p_rut_or_unit text,
  p_password text,
  p_action text,
  p_payload jsonb
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_ws aranpro_private.live_workspace;
  v_comm jsonb;
  v_unit jsonb;
  v_sub jsonb;
  v_expected_pass text;
  v_pass_trim text := trim(coalesce(p_password, ''));
  v_clean_rut text := aranpro_private.clean_rut(p_rut_or_unit);
  v_new_comms jsonb;
  v_new_certs jsonb;
  v_new_snapshot jsonb;
  v_notif_title text;
  v_notif_msg text;
  v_notif_cat text := 'general';
begin
  select * into v_ws from aranpro_private.live_workspace where id = 'main' for update;
  if not found or v_ws.revision = 0 then
    return jsonb_build_object('ok', false, 'error', 'Plataforma sin sincronización inicial');
  end if;

  select elem into v_comm
  from jsonb_array_elements(v_ws.snapshot->'communities') as elem
  where (elem->>'id') = p_community_id or (elem->>'slug') = p_community_id
  limit 1;

  if v_comm is null then
    raise exception 'Comunidad no encontrada';
  end if;

  select u into v_unit
  from jsonb_array_elements(coalesce(v_comm->'units', '[]'::jsonb)) as u
  where (u->>'id') = p_unit_id or (u->>'number') = p_unit_id
  limit 1;

  if v_unit is null then
    raise exception 'Unidad no encontrada';
  end if;

  select s into v_sub
  from jsonb_array_elements(coalesce(v_unit->'additionalUsers', '[]'::jsonb)) as s
  where v_clean_rut <> '' and aranpro_private.clean_rut(s->>'rut') = v_clean_rut
  limit 1;

  v_expected_pass := coalesce(nullif(v_sub->>'password', ''), nullif(v_unit->>'password', ''), v_unit->>'number');
  if v_pass_trim <> v_expected_pass
     and v_pass_trim <> coalesce(nullif(v_unit->>'password', ''), v_unit->>'number') then
    raise exception 'Credenciales de unidad no válidas';
  end if;

  v_new_certs := coalesce(v_ws.snapshot->'certificates', '[]'::jsonb);

  if p_action = 'report_payment' then
    v_comm := jsonb_set(
      v_comm,
      '{paymentReports}',
      jsonb_build_array(p_payload) || coalesce(v_comm->'paymentReports', '[]'::jsonb),
      true
    );
    v_notif_cat := 'pago';
    v_notif_title := 'Nuevo pago informado · Unidad ' || (v_unit->>'number');
    v_notif_msg := (v_comm->>'name') || ' · ' || coalesce(v_unit->>'owner', 'Residente') ||
                   ' informó pago por $' || coalesce(p_payload->>'amount', '0') ||
                   ' (Operación ' || coalesce(p_payload->>'transferNumber', 'S/N') || ').';

  elsif p_action = 'request_certificate' then
    v_new_certs := jsonb_build_array(p_payload) || v_new_certs;
    v_notif_cat := 'certificado';
    v_notif_title := 'Solicitud de certificado · Unidad ' || (v_unit->>'number');
    v_notif_msg := (v_comm->>'name') || ' · ' || coalesce(p_payload->>'applicantName', v_unit->>'owner') ||
                   ' solicitó: ' || coalesce(p_payload->>'type', 'Certificado Oficial') || '.';

  elsif p_action = 'create_ticket' then
    v_comm := jsonb_set(
      v_comm,
      '{communityTickets}',
      jsonb_build_array(p_payload) || coalesce(v_comm->'communityTickets', '[]'::jsonb),
      true
    );
    v_notif_cat := 'reclamo';
    v_notif_title := 'Nuevo ' || lower(coalesce(p_payload->>'type', 'registro')) || ' · Unidad ' || (v_unit->>'number');
    v_notif_msg := (v_comm->>'name') || ' · "' || coalesce(p_payload->>'title', 'Sin asunto') || '".';

  elsif p_action = 'cast_vote' then
    v_comm := jsonb_set(
      v_comm,
      '{writtenConsultations}',
      coalesce((
        select jsonb_agg(
          case
            when (cons->>'id') = (p_payload->>'consultationId') then
              jsonb_set(
                cons,
                array['votes', v_unit->>'number'],
                coalesce(p_payload->'voteData', '{}'::jsonb),
                true
              )
            else cons
          end
          order by ord
        )
        from jsonb_array_elements(coalesce(v_comm->'writtenConsultations', '[]'::jsonb)) with ordinality as t(cons, ord)
      ), '[]'::jsonb),
      true
    );
    v_notif_cat := 'consulta';
    v_notif_title := 'Voto registrado · Unidad ' || (v_unit->>'number');
    v_notif_msg := (v_comm->>'name') || ' · Unidad ' || (v_unit->>'number') || ' emitió su voto en consulta escrita.';

  elsif p_action = 'change_password' then
    if nullif(trim(coalesce(p_payload->>'newPassword', '')), '') is null then
      raise exception 'Nueva contraseña inválida';
    end if;
    v_comm := jsonb_set(
      v_comm,
      '{units}',
      coalesce((
        select jsonb_agg(
          case
            when (u->>'id') = (v_unit->>'id') then jsonb_set(u, '{password}', to_jsonb(trim(p_payload->>'newPassword')), true)
            else u
          end
          order by ord
        )
        from jsonb_array_elements(coalesce(v_comm->'units', '[]'::jsonb)) with ordinality as t(u, ord)
      ), '[]'::jsonb),
      true
    );

  elsif p_action = 'committee_announcement' then
    if not coalesce((v_unit->>'isCommittee')::boolean, false) then
      raise exception 'Solo el Comité de Administración puede publicar avisos';
    end if;
    v_comm := jsonb_set(
      v_comm,
      '{announcements}',
      jsonb_build_array(p_payload) || coalesce(v_comm->'announcements', '[]'::jsonb),
      true
    );
    v_notif_cat := 'comunicado';
    v_notif_title := 'Comunicado del Comité · ' || (v_comm->>'name');
    v_notif_msg := coalesce(p_payload->>'title', 'Nuevo comunicado publicado en el mural');

    -- Notificar también a los residentes de la comunidad
    insert into aranpro_private.notifications (target_role, community_id, category, title, message, meta)
    values ('resident', v_comm->>'id', 'comunicado', v_notif_title, v_notif_msg, jsonb_build_object('author', p_payload->>'author'));
  else
    raise exception 'Acción no reconocida';
  end if;

  select coalesce(jsonb_agg(
    case when (elem->>'id') = (v_comm->>'id') then v_comm else elem end
    order by ord
  ), '[]'::jsonb)
  into v_new_comms
  from jsonb_array_elements(v_ws.snapshot->'communities') with ordinality as t(elem, ord);

  v_new_snapshot := jsonb_set(v_ws.snapshot, '{communities}', v_new_comms, true);
  v_new_snapshot := jsonb_set(v_new_snapshot, '{certificates}', v_new_certs, true);

  update aranpro_private.live_workspace
     set revision = v_ws.revision + 1,
         snapshot = v_new_snapshot,
         updated_at = clock_timestamp(),
         updated_by = 'resident:' || (v_comm->>'id') || ':' || (v_unit->>'number')
   where id = 'main'
   returning * into v_ws;

  if v_notif_title is not null then
    insert into aranpro_private.notifications (
      target_role, community_id, unit_id, unit_number, category, title, message, meta
    ) values (
      'admin',
      v_comm->>'id',
      v_unit->>'id',
      v_unit->>'number',
      v_notif_cat,
      v_notif_title,
      v_notif_msg,
      jsonb_build_object('communityName', v_comm->>'name', 'action', p_action)
    );
  end if;

  return jsonb_build_object('ok', true, 'revision', v_ws.revision);
end; $$;

-- ==============================================================================
-- GESTIÓN DE NOTIFICACIONES BIDIRECCIONALES (ADMIN <-> RESIDENTES)
-- ==============================================================================

create or replace function public.aranpro_admin_notify(
  p_admin_rut text,
  p_admin_password text,
  p_community_id text,
  p_category text,
  p_title text,
  p_message text,
  p_unit_id text default null,
  p_unit_number text default null,
  p_meta jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
begin
  if not aranpro_private.is_authorized_staff(p_admin_rut, p_admin_password) then
    return jsonb_build_object('ok', false, 'unauthorized', true);
  end if;

  insert into aranpro_private.notifications (
    target_role, community_id, unit_id, unit_number, category, title, message, meta
  ) values (
    'resident', p_community_id, nullif(p_unit_id, ''), nullif(p_unit_number, ''),
    coalesce(nullif(p_category, ''), 'general'), p_title, p_message, coalesce(p_meta, '{}'::jsonb)
  ) returning id into v_id;

  return jsonb_build_object('ok', true, 'id', v_id);
end; $$;

create or replace function public.aranpro_admin_notifications(
  p_admin_rut text default null,
  p_admin_password text default null,
  p_mark_read boolean default false
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_items jsonb;
begin
  if not aranpro_private.is_authorized_staff(p_admin_rut, p_admin_password) then
    return jsonb_build_object('ok', false, 'items', '[]'::jsonb);
  end if;

  if coalesce(p_mark_read, false) then
    update aranpro_private.notifications
       set read_by = case when not (read_by ? 'admin') then read_by || '["admin"]'::jsonb else read_by end
     where target_role = 'admin' and not (read_by ? 'admin');
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', n.id,
    'communityId', n.community_id,
    'unitId', n.unit_id,
    'unitNumber', n.unit_number,
    'category', n.category,
    'title', n.title,
    'message', n.message,
    'meta', n.meta,
    'isRead', (n.read_by ? 'admin'),
    'createdAt', n.created_at
  ) order by n.created_at desc), '[]'::jsonb)
  into v_items
  from (
    select * from aranpro_private.notifications
    where target_role = 'admin'
    order by created_at desc
    limit 50
  ) n;

  return jsonb_build_object('ok', true, 'items', v_items);
end; $$;

create or replace function public.aranpro_resident_mark_read(
  p_community_id text,
  p_unit_id text,
  p_password text
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_reader_key text := coalesce(p_community_id, '') || ':' || coalesce(p_unit_id, '');
begin
  if trim(coalesce(p_community_id, '')) = '' or trim(coalesce(p_unit_id, '')) = '' then
    return jsonb_build_object('ok', false);
  end if;

  update aranpro_private.notifications
     set read_by = case when not (read_by ? v_reader_key) then read_by || to_jsonb(v_reader_key) else read_by end
   where target_role = 'resident'
     and (community_id is null or community_id = p_community_id)
     and (unit_id is null or unit_id = p_unit_id)
     and not (read_by ? v_reader_key);

  return jsonb_build_object('ok', true);
end; $$;

-- ==============================================================================
-- PERMISOS ESTRICTOS DE EJECUCIÓN RPC
-- ==============================================================================

revoke all on function
  public.aranpro_save_backup(bigint, jsonb),
  public.aranpro_load_backup(),
  public.aranpro_staff_login(text, text),
  public.aranpro_staff_manage(text, text, text, jsonb),
  public.aranpro_workspace_pull(text, text, bigint),
  public.aranpro_workspace_push(bigint, jsonb, text, text, boolean),
  public.aranpro_public_communities(),
  public.aranpro_resident_portal_sync(text, text, text),
  public.aranpro_resident_submit(text, text, text, text, text, jsonb),
  public.aranpro_admin_notify(text, text, text, text, text, text, text, text, jsonb),
  public.aranpro_admin_notifications(text, text, boolean),
  public.aranpro_resident_mark_read(text, text, text)
from public, anon, authenticated;

grant execute on function
  public.aranpro_save_backup(bigint, jsonb),
  public.aranpro_load_backup()
to authenticated;

grant execute on function
  public.aranpro_staff_login(text, text),
  public.aranpro_staff_manage(text, text, text, jsonb),
  public.aranpro_workspace_pull(text, text, bigint),
  public.aranpro_workspace_push(bigint, jsonb, text, text, boolean),
  public.aranpro_public_communities(),
  public.aranpro_resident_portal_sync(text, text, text),
  public.aranpro_resident_submit(text, text, text, text, text, jsonb),
  public.aranpro_admin_notify(text, text, text, text, text, text, text, text, jsonb),
  public.aranpro_admin_notifications(text, text, boolean),
  public.aranpro_resident_mark_read(text, text, text)
to anon, authenticated;

notify pgrst, 'reload schema';
commit;
