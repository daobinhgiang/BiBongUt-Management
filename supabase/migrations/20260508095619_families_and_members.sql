-- Enums
create type public.family_role as enum ('parent', 'child');

-- Helper functions
create or replace function public.my_family_ids()
returns setof uuid
language sql
security definer
stable
set search_path = ''
as $$
  select family_id from public.family_members
  where user_id = auth.uid();
$$;

create or replace function public.is_family_member(p_family_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.family_members
    where family_id = p_family_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.is_family_parent(p_family_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.family_members
    where family_id = p_family_id
      and user_id = auth.uid()
      and role = 'parent'
  );
$$;

-- Families
create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.families enable row level security;

create policy families_select on public.families for select using (id in (select my_family_ids()));
create policy families_insert on public.families for insert with check (auth.uid() = created_by);
create policy families_update on public.families for update using (is_family_parent(id));
create policy families_delete on public.families for delete using (is_family_parent(id));

-- Family members
create table public.family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id),
  user_id uuid references auth.users(id),
  role family_role not null default 'child',
  nickname text not null,
  avatar_url text,
  level int not null default 1,
  total_xp int not null default 0,
  coins int not null default 0,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_active_date date,
  pin_hash text,
  birthdate date,
  created_at timestamptz not null default now()
);

alter table public.family_members enable row level security;

create policy family_members_select on public.family_members for select using (family_id in (select my_family_ids()));
create policy family_members_insert on public.family_members for insert with check (is_family_parent(family_id));
create policy family_members_update_parent on public.family_members for update using (is_family_parent(family_id));
create policy family_members_update_self on public.family_members for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy family_members_delete on public.family_members for delete using (is_family_parent(family_id));

-- Family invites
create table public.family_invites (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id),
  email text not null,
  invited_by uuid not null references auth.users(id),
  token uuid not null default gen_random_uuid(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.family_invites enable row level security;

create policy family_invites_select on public.family_invites for select using (is_family_member(family_id));
create policy family_invites_insert on public.family_invites for insert with check (is_family_parent(family_id));
create policy family_invites_update on public.family_invites for update using (is_family_parent(family_id));
create policy family_invites_delete on public.family_invites for delete using (is_family_parent(family_id));
