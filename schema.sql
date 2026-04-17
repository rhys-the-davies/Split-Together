-- ============================================================
-- Chip In — Supabase schema
-- ============================================================
-- Conventions:
--   - All PKs are gen_random_uuid()
--   - created_at / updated_at on every mutable table
--   - RLS enabled on every table; all data locked to membership
--   - Status transitions enforced by triggers
--   - Equal split initialisation is handled at the app layer
--     in the same transaction as buyer assignment: when a buyer
--     is assigned, the app inserts one split row per contributor
--     (all members except the buyer) with amount = gift price / n.
--     The buyer can then adjust individual amounts before marking
--     as purchased.
-- ============================================================


-- ============================================================
-- Extensions
-- ============================================================

create extension if not exists "pgcrypto";
create extension if not exists "pg_cron";


-- ============================================================
-- Enums
-- ============================================================

do $$ begin
  create type recurrence_type as enum ('one_off', 'annual');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type instance_status as enum (
    'planning',
    'decided',
    'purchased',
    'done'
  );
exception when duplicate_object then null;
end $$;


-- ============================================================
-- member
-- 1:1 with auth.users via magic link
-- ============================================================

create table member (
  id          uuid primary key default gen_random_uuid(),
  auth_id     uuid unique references auth.users (id) on delete cascade,
  name        text not null,
  email       text not null unique,
  phone       text,                    -- optional; reserved for WhatsApp v2
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table member enable row level security;

create policy "member: read own"
  on member for select
  using (auth.uid() = auth_id);

create policy "member: update own"
  on member for update
  using (auth.uid() = auth_id);

-- Note: "member: read co-members" policy is added after occasion_member
-- is defined, to avoid forward reference issues on a clean schema run.


-- ============================================================
-- occasion
-- ============================================================

create table occasion (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  recipient_name    text not null,
  recurrence        recurrence_type not null default 'one_off',
  recurrence_month  smallint check (recurrence_month between 1 and 12),
  recurrence_day    smallint check (recurrence_day between 1 and 31),
  invite_token      uuid not null default gen_random_uuid(),
  created_by        uuid not null references member (id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint annual_requires_date check (
    recurrence = 'one_off'
    or (recurrence_month is not null and recurrence_day is not null)
  )
);

alter table occasion enable row level security;


-- ============================================================
-- occasion_member
-- Hard delete on leave; member row preserved for contribution history
-- Defined before RLS policies that depend on it
-- ============================================================

create table occasion_member (
  occasion_id  uuid not null references occasion (id) on delete cascade,
  member_id    uuid not null references member (id) on delete restrict,
  joined_at    timestamptz not null default now(),

  primary key (occasion_id, member_id)
);

alter table occasion_member enable row level security;


-- ============================================================
-- Core helper: is the current user a member of this occasion?
-- Defined after occasion_member so it compiles cleanly
-- ============================================================

create or replace function is_occasion_member(p_occasion_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from occasion_member om
    join member m on m.id = om.member_id
    where om.occasion_id = p_occasion_id
      and m.auth_id = auth.uid()
  );
$$;


-- ============================================================
-- RLS policies for member (now that occasion_member exists)
-- ============================================================

create policy "member: read co-members"
  on member for select
  using (
    exists (
      select 1
      from occasion_member om1
      join occasion_member om2 on om1.occasion_id = om2.occasion_id
      where om1.member_id = member.id
        and om2.member_id = (select id from member where auth_id = auth.uid())
    )
  );


-- ============================================================
-- RLS policies for occasion
-- ============================================================

create policy "occasion: members can read"
  on occasion for select
  using (is_occasion_member(id));

create policy "occasion: members can update"
  on occasion for update
  using (is_occasion_member(id));

create policy "occasion: authenticated users can create"
  on occasion for insert
  with check (
    exists (select 1 from member where auth_id = auth.uid())
  );


-- ============================================================
-- RLS policies for occasion_member
-- ============================================================

create policy "occasion_member: members can read"
  on occasion_member for select
  using (is_occasion_member(occasion_id));

create policy "occasion_member: member can join"
  on occasion_member for insert
  with check (
    exists (select 1 from member where auth_id = auth.uid())
  );

create policy "occasion_member: member can leave"
  on occasion_member for delete
  using (
    member_id = (select id from member where auth_id = auth.uid())
  );


-- ============================================================
-- occasion_instance
-- One row per year (or per one-off)
-- on delete restrict: an occasion cannot be deleted while
--   instances exist; app layer handles "delete this and future"
-- ============================================================

create table occasion_instance (
  id                  uuid primary key default gen_random_uuid(),
  occasion_id         uuid not null references occasion (id) on delete restrict,
  year                smallint not null,
  status              instance_status not null default 'planning',
  decided_gift_id     uuid,               -- FK added below after gift_suggestion
  buyer_id            uuid references member (id) on delete set null,
  buyer_bank_details  text,               -- entered by buyer; included in notification email
  archived_at         timestamptz,        -- set when status moves to done
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  unique (occasion_id, year)
);

alter table occasion_instance enable row level security;

create policy "occasion_instance: members can read"
  on occasion_instance for select
  using (is_occasion_member(occasion_id));

-- Updates blocked on done instances by trigger below
create policy "occasion_instance: members can update"
  on occasion_instance for update
  using (is_occasion_member(occasion_id));

create policy "occasion_instance: members can insert"
  on occasion_instance for insert
  with check (is_occasion_member(occasion_id));

-- Status transition guard
create or replace function validate_instance_transition()
returns trigger
language plpgsql
as $$
begin
  if new.status = old.status then
    return new;
  end if;

  -- Valid forward transitions
  if old.status = 'planning'  and new.status = 'decided'   then return new; end if;
  if old.status = 'decided'   and new.status = 'purchased'  then return new; end if;
  if old.status = 'purchased' and new.status = 'done'       then return new; end if;

  -- Buyer changes mind before purchase
  if old.status = 'decided'   and new.status = 'planning'   then return new; end if;

  raise exception 'Invalid instance status transition: % → %', old.status, new.status;
end;
$$;

create trigger enforce_instance_transitions
  before update on occasion_instance
  for each row execute function validate_instance_transition();

-- Block all writes to done instances (viewable but immutable)
create or replace function prevent_done_instance_edit()
returns trigger
language plpgsql
as $$
begin
  if old.archived_at is not null then
    raise exception 'This instance is archived and cannot be edited.';
  end if;
  return new;
end;
$$;

create trigger lock_done_instance
  before update on occasion_instance
  for each row execute function prevent_done_instance_edit();

-- Require decided_gift_id, buyer_id, buyer_bank_details, and splits before purchased
create or replace function validate_before_purchased()
returns trigger
language plpgsql
as $$
declare
  v_split_count int;
begin
  if new.status = 'purchased' and old.status != 'purchased' then
    if new.decided_gift_id is null then
      raise exception 'Cannot mark as purchased without a decided gift.';
    end if;
    if new.buyer_id is null then
      raise exception 'Cannot mark as purchased without an assigned buyer.';
    end if;
    if new.buyer_bank_details is null or trim(new.buyer_bank_details) = '' then
      raise exception 'Cannot mark as purchased without bank details for the notification email.';
    end if;
    -- At least one split row must exist (i.e. equal splits have been initialised)
    select count(*) into v_split_count
    from split
    where instance_id = new.id;

    if v_split_count = 0 then
      raise exception 'Cannot mark as purchased without splits being set.';
    end if;
  end if;
  if new.status = 'done' and old.status != 'done' then
    new.archived_at = now();
  end if;
  return new;
end;
$$;

create trigger validate_before_purchased
  before update on occasion_instance
  for each row execute function validate_before_purchased();


-- ============================================================
-- gift_suggestion
-- Any member can add; members edit/delete their own
-- Buyer marks one as decided (is_decided = true)
-- All writes locked once instance is purchased
-- ============================================================

create table gift_suggestion (
  id           uuid primary key default gen_random_uuid(),
  instance_id  uuid not null references occasion_instance (id) on delete cascade,
  proposed_by  uuid not null references member (id) on delete restrict,
  title        text not null,
  url          text,
  price        numeric(10, 2) not null check (price >= 0),
  is_decided   boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Enforce only one decided gift per instance at the database level
create unique index one_decided_per_instance
  on gift_suggestion (instance_id)
  where is_decided = true;

-- Lock all suggestion writes once purchased or done
create or replace function prevent_suggestion_write_when_locked()
returns trigger
language plpgsql
as $$
declare
  v_instance_id uuid;
begin
  -- Use old for DELETE (new is null), new for INSERT/UPDATE
  v_instance_id := coalesce(new.instance_id, old.instance_id);

  if (
    select status from occasion_instance where id = v_instance_id
  ) in ('purchased', 'done') then
    raise exception 'Gift suggestions cannot be modified after the gift has been purchased.';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger lock_suggestion_when_purchased
  before insert or update or delete on gift_suggestion
  for each row execute function prevent_suggestion_write_when_locked();

alter table gift_suggestion enable row level security;

create policy "gift_suggestion: members can read"
  on gift_suggestion for select
  using (
    is_occasion_member(
      (select occasion_id from occasion_instance where id = instance_id)
    )
  );

create policy "gift_suggestion: members can insert"
  on gift_suggestion for insert
  with check (
    is_occasion_member(
      (select occasion_id from occasion_instance where id = instance_id)
    )
  );

-- Members edit their own; buyer can edit any (to mark decided)
create policy "gift_suggestion: members update own or buyer updates any"
  on gift_suggestion for update
  using (
    is_occasion_member(
      (select occasion_id from occasion_instance where id = instance_id)
    )
    and (
      proposed_by = (select id from member where auth_id = auth.uid())
      or (
        select buyer_id from occasion_instance where id = instance_id
      ) = (select id from member where auth_id = auth.uid())
    )
  );

create policy "gift_suggestion: members can delete own"
  on gift_suggestion for delete
  using (
    proposed_by = (select id from member where auth_id = auth.uid())
  );


-- ============================================================
-- Forward FK: occasion_instance.decided_gift_id → gift_suggestion
-- ============================================================

alter table occasion_instance
  add constraint fk_decided_gift
  foreign key (decided_gift_id)
  references gift_suggestion (id)
  on delete set null;


-- ============================================================
-- gift_vote
-- Members can vote on multiple suggestions; one vote per suggestion
-- ============================================================

create table gift_vote (
  suggestion_id  uuid not null references gift_suggestion (id) on delete cascade,
  member_id      uuid not null references member (id) on delete cascade,
  voted_at       timestamptz not null default now(),

  primary key (suggestion_id, member_id)
);

alter table gift_vote enable row level security;

create policy "gift_vote: members can read"
  on gift_vote for select
  using (
    is_occasion_member(
      (select oi.occasion_id
       from occasion_instance oi
       join gift_suggestion gs on gs.instance_id = oi.id
       where gs.id = suggestion_id)
    )
  );

create policy "gift_vote: members can insert own"
  on gift_vote for insert
  with check (
    member_id = (select id from member where auth_id = auth.uid())
  );

create policy "gift_vote: members can delete own"
  on gift_vote for delete
  using (
    member_id = (select id from member where auth_id = auth.uid())
  );


-- ============================================================
-- split
-- Created by app layer when buyer is assigned (equal default)
-- Buyer can adjust amounts before marking purchased
-- Locked once instance is purchased
-- ============================================================

create table split (
  id           uuid primary key default gen_random_uuid(),
  instance_id  uuid not null references occasion_instance (id) on delete cascade,
  member_id    uuid not null references member (id) on delete restrict,
  amount       numeric(10, 2) not null check (amount >= 0),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  unique (instance_id, member_id)
);

create or replace function prevent_split_write_when_locked()
returns trigger
language plpgsql
as $$
begin
  if (
    select status from occasion_instance where id = new.instance_id
  ) in ('purchased', 'done') then
    raise exception 'Splits cannot be modified after the gift has been purchased.';
  end if;
  return new;
end;
$$;

create trigger lock_split_when_purchased
  before insert or update on split
  for each row execute function prevent_split_write_when_locked();

alter table split enable row level security;

create policy "split: members can read"
  on split for select
  using (is_occasion_member(
    (select occasion_id from occasion_instance where id = instance_id)
  ));

create policy "split: buyer can insert"
  on split for insert
  with check (
    (select buyer_id from occasion_instance where id = instance_id)
    = (select id from member where auth_id = auth.uid())
  );

create policy "split: buyer can update"
  on split for update
  using (
    (select buyer_id from occasion_instance where id = instance_id)
    = (select id from member where auth_id = auth.uid())
  );


-- ============================================================
-- contribution
-- Created by snapshot_contributions() when instance → purchased
-- Amount is immutable; records what each contributor owes
-- Contributor marks own as made; buyer can mark any
-- Buyer can close instance regardless of contribution status
-- ============================================================

create table contribution (
  id              uuid primary key default gen_random_uuid(),
  instance_id     uuid not null references occasion_instance (id) on delete cascade,
  contributor_id  uuid not null references member (id) on delete restrict,
  amount          numeric(10, 2) not null check (amount >= 0),  -- snapshotted; immutable
  marked_made_by  uuid references member (id) on delete set null,
  made_at         timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  unique (instance_id, contributor_id)
);

create or replace function prevent_contribution_amount_change()
returns trigger
language plpgsql
as $$
begin
  if new.amount != old.amount then
    raise exception 'Contribution amount cannot be changed after it has been created.';
  end if;
  return new;
end;
$$;

create trigger lock_contribution_amount
  before update on contribution
  for each row execute function prevent_contribution_amount_change();

alter table contribution enable row level security;

create policy "contribution: members can read"
  on contribution for select
  using (is_occasion_member(
    (select occasion_id from occasion_instance where id = instance_id)
  ));

-- Insert is via service role only (snapshot_contributions function)

create policy "contribution: contributor or buyer can update"
  on contribution for update
  using (
    contributor_id = (select id from member where auth_id = auth.uid())
    or (
      select buyer_id from occasion_instance where id = instance_id
    ) = (select id from member where auth_id = auth.uid())
  );


-- ============================================================
-- Indexes
-- ============================================================

create index on occasion_member (member_id);
create index on occasion_instance (occasion_id);
create index on occasion_instance (status);
create index on occasion_instance (archived_at) where archived_at is null;  -- active instances
create index on gift_suggestion (instance_id);
create index on gift_vote (suggestion_id);
create index on split (instance_id);
create index on contribution (instance_id);
create index on contribution (contributor_id);
create index on contribution (made_at) where made_at is null;  -- unpaid contributions


-- ============================================================
-- updated_at trigger
-- ============================================================

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on member
  for each row execute function set_updated_at();
create trigger set_updated_at before update on occasion
  for each row execute function set_updated_at();
create trigger set_updated_at before update on occasion_instance
  for each row execute function set_updated_at();
create trigger set_updated_at before update on gift_suggestion
  for each row execute function set_updated_at();
create trigger set_updated_at before update on split
  for each row execute function set_updated_at();
create trigger set_updated_at before update on contribution
  for each row execute function set_updated_at();


-- ============================================================
-- pg_cron: auto-create annual instances on 1 Jan each year
-- ============================================================

select cron.schedule(
  'create-annual-instances',
  '0 9 1 1 *',    -- 09:00 UTC on 1 January
  $$
    insert into occasion_instance (occasion_id, year, status)
    select
      o.id,
      extract(year from now())::smallint,
      'planning'
    from occasion o
    where o.recurrence = 'annual'
      and not exists (
        select 1 from occasion_instance oi
        where oi.occasion_id = o.id
          and oi.year = extract(year from now())::smallint
      );
  $$
);


-- ============================================================
-- Invite token regeneration
-- Any member of the occasion can regenerate
-- ============================================================

create or replace function regenerate_invite_token(p_occasion_id uuid)
returns uuid
language plpgsql
security definer
as $$
declare
  new_token uuid;
begin
  if not is_occasion_member(p_occasion_id) then
    raise exception 'Not authorised.';
  end if;

  new_token := gen_random_uuid();

  update occasion
  set invite_token = new_token,
      updated_at   = now()
  where id = p_occasion_id;

  return new_token;
end;
$$;


-- ============================================================
-- Snapshot contributions on purchase
-- Called at app layer via service role immediately after the
-- instance status is set to 'purchased'.
-- Reads current split rows and creates one immutable contribution
-- row per contributor. The buyer is excluded (they don't owe themselves).
-- ============================================================

create or replace function snapshot_contributions(p_instance_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_buyer_id uuid;
begin
  select buyer_id into v_buyer_id
  from occasion_instance
  where id = p_instance_id;

  insert into contribution (instance_id, contributor_id, amount)
  select
    p_instance_id,
    member_id,
    amount
  from split
  where instance_id = p_instance_id
    and member_id != v_buyer_id       -- buyer does not owe themselves
  on conflict (instance_id, contributor_id) do nothing;
end;
$$;
