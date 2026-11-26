-- Ejecutar como propietario del proyecto. Autorizar por UUID a los emisores en
-- aranpro_private.issuers después de comprobar su identidad en Authentication.
begin;
create schema if not exists aranpro_private;
revoke all on schema aranpro_private from public, anon, authenticated;
create table if not exists aranpro_private.issuers (
  user_id uuid primary key references auth.users(id)
);
create table if not exists aranpro_private.issuer_emails (email text primary key);
insert into aranpro_private.issuer_emails(email) values ('aranpro.info@gmail.com') on conflict do nothing;
create table if not exists aranpro_private.certificates (
  folio text primary key,
  issuer uuid not null references auth.users(id),
  token_digest bytea not null,
  details jsonb not null,
  issued_on date not null,
  revoked boolean not null default false
);
create table if not exists aranpro_private.backups (
  owner_id uuid primary key references auth.users(id),
  revision bigint not null,
  snapshot jsonb not null,
  saved_at timestamptz not null default now()
);
revoke all on all tables in schema aranpro_private from public, anon, authenticated;
alter table aranpro_private.issuers enable row level security;
alter table aranpro_private.issuer_emails enable row level security;
alter table aranpro_private.certificates enable row level security;
alter table aranpro_private.backups enable row level security;

create or replace function public.aranpro_is_issuer() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from aranpro_private.issuers where user_id = auth.uid())
    or exists(select 1 from auth.users u join aranpro_private.issuer_emails e on e.email=lower(u.email)
      where u.id=auth.uid() and u.email_confirmed_at is not null);
$$;

create or replace function public.aranpro_issue(p_folio text, p_token text, p_details jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  item aranpro_private.certificates;
  today date := (now() at time zone 'America/Santiago')::date;
  token_hash bytea := sha256(convert_to(p_token, 'UTF8'));
begin
  if not public.aranpro_is_issuer() then raise exception 'Emisor sin autorización'; end if;
  if p_folio is null or p_folio !~ '^CERT-[0-9]{4}-[a-f0-9]{32}$'
    or p_token is null or p_token !~ '^[0-9a-f]{32}$'
    or jsonb_typeof(p_details) is distinct from 'object'
    or length(p_details::text) > 20000
    or exists(select 1 from unnest(array['community','unit','name','type','issuer']) k where nullif(trim(p_details->>k),'') is null)
    then raise exception 'Datos de emisión incompletos'; end if;
  insert into aranpro_private.certificates(folio, issuer, token_digest, details, issued_on)
    values(p_folio, auth.uid(), token_hash, p_details, today) on conflict do nothing;
  select * into strict item from aranpro_private.certificates where folio = p_folio;
  if item.issuer <> auth.uid() or item.token_digest <> token_hash or item.details <> p_details or item.revoked then
    raise exception 'No se puede modificar un certificado emitido';
  end if;
  return jsonb_build_object('date',item.issued_on,'expiresAt',item.issued_on + 30);
end; $$;

create or replace function public.aranpro_verify(p_folio text, p_token text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('state',case when revoked then 'revoked'
    when (now() at time zone 'America/Santiago')::date > issued_on + 30 then 'expired'
    else 'valid' end,'folio',folio,'date',issued_on,'expiresAt',issued_on + 30,
    'details',case when revoked then null else details end)
  from aranpro_private.certificates where folio = p_folio
    and p_token ~ '^[0-9a-f]{32}$' and token_digest = sha256(convert_to(p_token,'UTF8'));
$$;

create or replace function public.aranpro_revoke(p_folio text, p_token text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.aranpro_is_issuer() then raise exception 'Emisor sin autorización'; end if;
  update aranpro_private.certificates set revoked = true where folio = p_folio
    and issuer = auth.uid() and token_digest = sha256(convert_to(p_token,'UTF8'));
  if not found then raise exception 'No se pudo anular el certificado'; end if;
end; $$;

create or replace function public.aranpro_save_backup(p_revision bigint, p_snapshot jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare saved aranpro_private.backups;
begin
  if not public.aranpro_is_issuer() then raise exception 'Cuenta sin autorización'; end if;
  if jsonb_typeof(p_snapshot->'communities') is distinct from 'array'
    or jsonb_typeof(p_snapshot->'certificates') is distinct from 'array'
    or jsonb_typeof(p_snapshot->'companySettings') is distinct from 'object'
    then raise exception 'Respaldo incompleto'; end if;
  if p_revision = 0 then
    insert into aranpro_private.backups(owner_id,revision,snapshot) values(auth.uid(),1,p_snapshot)
    on conflict do nothing returning * into saved;
  else
    update aranpro_private.backups set revision=revision+1, snapshot=p_snapshot, saved_at=clock_timestamp()
    where owner_id=auth.uid() and revision=p_revision returning * into saved;
  end if;
  if saved.revision is null then raise exception 'La nube tiene otra versión. Descargue el respaldo antes de subir cambios.'; end if;
  return jsonb_build_object('revision',saved.revision,'timestamp',saved.saved_at);
end; $$;

create or replace function public.aranpro_load_backup()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.aranpro_is_issuer() then raise exception 'Cuenta sin autorización'; end if;
  return (select jsonb_build_object('revision',revision,'timestamp',saved_at,'snapshot',snapshot)
    from aranpro_private.backups where owner_id=auth.uid());
end; $$;
revoke all on function public.aranpro_is_issuer(), public.aranpro_issue(text,text,jsonb),
 public.aranpro_revoke(text,text), public.aranpro_load_backup(), public.aranpro_save_backup(bigint,jsonb),
 public.aranpro_verify(text,text) from public, anon, authenticated;
grant execute on function public.aranpro_is_issuer(), public.aranpro_issue(text,text,jsonb),
 public.aranpro_revoke(text,text), public.aranpro_load_backup(), public.aranpro_save_backup(bigint,jsonb) to authenticated;
grant execute on function public.aranpro_verify(text,text) to anon, authenticated;
notify pgrst, 'reload schema';
commit;
