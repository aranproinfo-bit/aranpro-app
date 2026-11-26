-- Unifica la autorización de emisión y anulación de Certificados Oficiales QR
-- con la sesión activa del Administrador (aranpro_private.staff_accounts),
-- eliminando la dependencia de códigos OTP por correo electrónico.

begin;

alter table aranpro_private.certificates
  alter column issuer drop not null;

alter table aranpro_private.certificates
  add column if not exists issuer_rut text;

drop function if exists public.aranpro_issue(text, text, jsonb);
drop function if exists public.aranpro_revoke(text, text);

create or replace function public.aranpro_issue(
  p_folio text,
  p_token text,
  p_details jsonb,
  p_admin_rut text default null,
  p_admin_password text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  item aranpro_private.certificates;
  today date := (now() at time zone 'America/Santiago')::date;
  token_hash bytea := sha256(convert_to(p_token, 'UTF8'));
  clean_staff_rut text := nullif(aranpro_private.clean_rut(p_admin_rut), '');
begin
  if not aranpro_private.is_authorized_staff(p_admin_rut, p_admin_password) then
    raise exception 'Emisor sin autorización';
  end if;

  if p_folio is null or p_folio !~ '^CERT-[0-9]{4}-[a-f0-9]{32}$'
    or p_token is null or p_token !~ '^[0-9a-f]{32}$'
    or jsonb_typeof(p_details) is distinct from 'object'
    or length(p_details::text) > 20000
    or exists(
      select 1
      from unnest(array['community','unit','name','type','issuer']) k
      where nullif(trim(p_details->>k), '') is null
    )
  then
    raise exception 'Datos de emisión incompletos';
  end if;

  insert into aranpro_private.certificates (folio, issuer, issuer_rut, token_digest, details, issued_on)
  values (p_folio, auth.uid(), coalesce(clean_staff_rut, 'admin'), token_hash, p_details, today)
  on conflict (folio) do nothing;

  select * into strict item from aranpro_private.certificates where folio = p_folio;

  if item.token_digest <> token_hash or item.details <> p_details or item.revoked then
    raise exception 'No se puede modificar un certificado emitido';
  end if;

  return jsonb_build_object('date', item.issued_on, 'expiresAt', item.issued_on + 30);
end;
$$;

create or replace function public.aranpro_revoke(
  p_folio text,
  p_token text,
  p_admin_rut text default null,
  p_admin_password text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not aranpro_private.is_authorized_staff(p_admin_rut, p_admin_password) then
    raise exception 'Emisor sin autorización';
  end if;

  update aranpro_private.certificates
     set revoked = true
   where folio = p_folio
     and p_token ~ '^[0-9a-f]{32}$'
     and token_digest = sha256(convert_to(p_token, 'UTF8'));

  if not found then
    raise exception 'No se pudo anular el certificado';
  end if;
end;
$$;

revoke all on function
  public.aranpro_issue(text, text, jsonb, text, text),
  public.aranpro_revoke(text, text, text, text)
from public, anon, authenticated;

grant execute on function
  public.aranpro_issue(text, text, jsonb, text, text),
  public.aranpro_revoke(text, text, text, text)
to anon, authenticated;

notify pgrst, 'reload schema';

commit;
