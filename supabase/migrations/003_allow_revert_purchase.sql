-- ============================================================
-- Migration 003: allow reverting a purchased instance to decided
-- ============================================================
-- Adds the purchased → decided backward transition so a buyer
-- can undo a purchase (e.g. wrong timing). The app layer deletes
-- contribution rows before this status change fires, so the
-- validate_before_purchased trigger (which only fires on the
-- decided → purchased forward move) is not affected.
-- ============================================================

create or replace function validate_instance_transition()
returns trigger
language plpgsql
as $$
begin
  if new.status = old.status then
    return new;
  end if;

  -- Forward transitions
  if old.status = 'planning'   and new.status = 'decided'   then return new; end if;
  if old.status = 'decided'    and new.status = 'purchased'  then return new; end if;
  if old.status = 'purchased'  and new.status = 'done'       then return new; end if;

  -- Backward transitions
  if old.status = 'decided'    and new.status = 'planning'   then return new; end if;
  if old.status = 'purchased'  and new.status = 'decided'    then return new; end if;
  if old.status = 'done'       and new.status = 'purchased'  then return new; end if;

  raise exception 'Invalid instance status transition: % → %', old.status, new.status;
end;
$$;
