# Backup — Supabase security hardening — 2026-08-20

Created BEFORE changing database privileges.

Project: scmorocdbdyvnxodpwyi

## Current function state

`public.trigger_property_generation()`
- SECURITY DEFINER: yes
- search_path: public
- EXECUTE currently granted to `anon` and `authenticated`
- Function posts to the Supabase Edge Function `trigger-property-generation` via `net.http_post`.

`public.atualizar_updated_at()`
- SECURITY DEFINER: no
- search_path currently unset.

## Planned change

Revoke direct EXECUTE on `public.trigger_property_generation()` from `anon` and `authenticated`, while preserving trigger execution by the table owner/function owner.

## Rollback SQL

If rollback is required, restore the direct grants:

`GRANT EXECUTE ON FUNCTION public.trigger_property_generation() TO anon;`

`GRANT EXECUTE ON FUNCTION public.trigger_property_generation() TO authenticated;`

No data will be modified by the planned privilege change.
