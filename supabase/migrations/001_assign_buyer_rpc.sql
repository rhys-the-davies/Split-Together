-- Migration: assign_buyer_and_init_splits RPC
-- Run this in the Supabase SQL editor after applying schema.sql.
-- This function handles buyer assignment and equal split initialisation
-- in a single atomic transaction. Using security definer so that:
--   (a) any member can reassign the buyer (per spec)
--   (b) the delete + re-insert on split passes RLS for any caller
--   (c) the function enforces its own membership check

create or replace function assign_buyer_and_init_splits(
  p_instance_id uuid,
  p_buyer_id    uuid
)
returns void
language plpgsql
security definer
as $$
declare
  v_gift_price numeric;
  v_members    uuid[];
  v_n          int;
  v_amount     numeric;
  v_member_id  uuid;
begin
  -- Verify caller is a member of this occasion
  if not is_occasion_member(
    (select occasion_id from occasion_instance where id = p_instance_id)
  ) then
    raise exception 'Not authorised.';
  end if;

  -- Get price from the decided gift if one is set; else 0.
  -- Buyer can adjust splits manually in the decided view.
  select gs.price into v_gift_price
  from gift_suggestion gs
  join occasion_instance oi on oi.decided_gift_id = gs.id
  where oi.id = p_instance_id;

  if v_gift_price is null then
    v_gift_price := 0;
  end if;

  -- SET buyer_id FIRST — the split INSERT RLS policy checks this column.
  update occasion_instance
  set buyer_id   = p_buyer_id,
      updated_at = now()
  where id = p_instance_id;

  -- Collect all occasion members except the buyer.
  select array_agg(om.member_id) into v_members
  from occasion_member om
  join occasion_instance oi on oi.occasion_id = om.occasion_id
  where oi.id      = p_instance_id
    and om.member_id != p_buyer_id;

  v_n := array_length(v_members, 1);

  -- If the buyer is the only member, no splits are needed.
  if v_n is null or v_n = 0 then
    return;
  end if;

  v_amount := round(v_gift_price / v_n, 2);

  -- Delete existing splits first to handle buyer reassignment cleanly.
  delete from split where instance_id = p_instance_id;

  foreach v_member_id in array v_members loop
    insert into split (instance_id, member_id, amount)
    values (p_instance_id, v_member_id, v_amount);
  end loop;
end;
$$;
