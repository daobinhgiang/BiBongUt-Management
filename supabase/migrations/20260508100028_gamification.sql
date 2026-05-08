-- Transactions (XP/coin ledger)
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  family_member_id uuid not null references public.family_members(id),
  delta_xp int not null default 0,
  delta_coins int not null default 0,
  reason text not null,
  ref_table text,
  ref_id uuid,
  created_at timestamptz not null default now()
);

alter table public.transactions enable row level security;

create policy transactions_select on public.transactions for select
  using (family_member_id in (
    select fm.id from public.family_members fm
    where fm.family_id in (select my_family_ids())
  ));

-- Badges
create table public.badges (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  icon_url text,
  criteria jsonb,
  xp_reward int not null default 0,
  coins_reward int not null default 0
);

alter table public.badges enable row level security;

create policy badges_select on public.badges for select using (true);
create policy badges_insert on public.badges for insert
  with check (exists (
    select 1 from public.family_members
    where user_id = auth.uid() and role = 'parent'
  ));
create policy badges_update on public.badges for update
  using (exists (
    select 1 from public.family_members
    where user_id = auth.uid() and role = 'parent'
  ));
create policy badges_delete on public.badges for delete
  using (exists (
    select 1 from public.family_members
    where user_id = auth.uid() and role = 'parent'
  ));

-- Badge unlocks
create table public.badge_unlocks (
  id uuid primary key default gen_random_uuid(),
  family_member_id uuid not null references public.family_members(id),
  badge_id uuid not null references public.badges(id),
  unlocked_at timestamptz not null default now(),
  unique (family_member_id, badge_id)
);

alter table public.badge_unlocks enable row level security;

create policy badge_unlocks_select on public.badge_unlocks for select
  using (family_member_id in (
    select fm.id from public.family_members fm
    where fm.family_id in (select my_family_ids())
  ));
