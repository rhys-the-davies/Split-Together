-- ============================================================
-- Migration 002: allow unarchiving a done instance
-- ============================================================
-- The prevent_done_instance_edit trigger currently blocks all
-- writes to archived (done) instances. We carve out one exception:
-- a buyer reverting status from 'done' back to 'purchased' while
-- simultaneously clearing archived_at.
--
-- The validate_instance_transition trigger also needs updating to
-- permit the done → purchased backward transition.
-- ============================================================

-- 1. Allow done → purchased transition in the status guard.
create or replace function validate_instance_transition()
returns trigger
language plpgsql
as $$
begin
  if new.status = old.status then
    return new;
  end if;

  -- Forward transitions
  if old.status = 'planning'  and new.status = 'decided'   then return new; end if;
  if old.status = 'decided'   and new.status = 'purchased'  then return new; end if;
  if old.status = 'purchased' and new.status = 'done'       then return new; end if;

  -- Buyer changes mind before purchase
  if old.status = 'decided'   and new.status = 'planning'   then return new; end if;

  -- Unarchive: buyer reverts a closed round back to purchased
  if old.status = 'done'      and new.status = 'purchased'  then return new; end if;

  raise exception 'Invalid instance status transition: % → %', old.status, new.status;
end;
$$;


-- 2. Allow the specific unarchive write to pass the lock trigger.
create or replace function prevent_done_instance_edit()
returns trigger
language plpgsql
as $$
begin
  -- Permit unarchiving: status done → purchased + clearing archived_at
  if old.archived_at is not null
     and new.archived_at is null
     and old.status = 'done'
     and new.status = 'purchased' then
    return new;
  end if;

  if old.archived_at is not null then
    raise exception 'This instance is archived and cannot be edited.';
  end if;

  return new;
end;
$$;
