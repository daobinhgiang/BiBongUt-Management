-- Enums for feature tables
create type public.bucket_status as enum ('pending', 'done');
create type public.movie_status as enum ('want_to_watch', 'watched');
create type public.challenge_status as enum ('active', 'completed', 'cancelled');
create type public.attendance_status as enum ('going', 'maybe', 'declined');

-- Bucket list items
create table public.bucket_list_items (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id),
  title text not null,
  description text,
  status bucket_status not null default 'pending',
  created_by uuid not null references public.family_members(id),
  completed_at timestamptz,
  points int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.bucket_list_items enable row level security;

create policy bucket_list_items_select on public.bucket_list_items for select
  using (family_id in (select my_family_ids()));
create policy bucket_list_items_insert on public.bucket_list_items for insert
  with check (is_family_member(family_id));
create policy bucket_list_items_update on public.bucket_list_items for update
  using (is_family_parent(family_id));
create policy bucket_list_items_delete on public.bucket_list_items for delete
  using (is_family_parent(family_id));

-- Movies
create table public.movies (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id),
  title text not null,
  year int,
  poster_url text,
  added_by uuid not null references public.family_members(id),
  status movie_status not null default 'want_to_watch',
  rating int,
  created_at timestamptz not null default now()
);

alter table public.movies enable row level security;

create policy movies_select on public.movies for select
  using (family_id in (select my_family_ids()));
create policy movies_insert on public.movies for insert
  with check (is_family_member(family_id));
create policy movies_update on public.movies for update
  using (is_family_parent(family_id));
create policy movies_delete on public.movies for delete
  using (is_family_parent(family_id));

-- Movie watches
create table public.movie_watches (
  id uuid primary key default gen_random_uuid(),
  movie_id uuid not null references public.movies(id),
  watched_by uuid not null references public.family_members(id),
  watched_at timestamptz not null default now(),
  rating int,
  notes text
);

alter table public.movie_watches enable row level security;

create policy movie_watches_select on public.movie_watches for select
  using (movie_id in (
    select m.id from public.movies m where m.family_id in (select my_family_ids())
  ));
create policy movie_watches_insert on public.movie_watches for insert
  with check (movie_id in (
    select m.id from public.movies m where m.family_id in (select my_family_ids())
  ));
create policy movie_watches_update on public.movie_watches for update
  using (movie_id in (
    select m.id from public.movies m where is_family_parent(m.family_id)
  ));
create policy movie_watches_delete on public.movie_watches for delete
  using (movie_id in (
    select m.id from public.movies m where is_family_parent(m.family_id)
  ));

-- Challenges
create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id),
  title text not null,
  description text,
  start_date timestamptz,
  end_date timestamptz,
  points int not null default 0,
  status challenge_status not null default 'active',
  created_by uuid not null references public.family_members(id),
  created_at timestamptz not null default now()
);

alter table public.challenges enable row level security;

create policy challenges_select on public.challenges for select
  using (family_id in (select my_family_ids()));
create policy challenges_insert on public.challenges for insert
  with check (is_family_parent(family_id));
create policy challenges_update on public.challenges for update
  using (is_family_parent(family_id));
create policy challenges_delete on public.challenges for delete
  using (is_family_parent(family_id));

-- Challenge participants
create table public.challenge_participants (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id),
  family_member_id uuid not null references public.family_members(id),
  joined_at timestamptz not null default now(),
  completed_at timestamptz,
  points_earned int not null default 0
);

alter table public.challenge_participants enable row level security;

create policy challenge_participants_select on public.challenge_participants for select
  using (challenge_id in (
    select c.id from public.challenges c where c.family_id in (select my_family_ids())
  ));
create policy challenge_participants_insert on public.challenge_participants for insert
  with check (challenge_id in (
    select c.id from public.challenges c where c.family_id in (select my_family_ids())
  ));
create policy challenge_participants_update on public.challenge_participants for update
  using (challenge_id in (
    select c.id from public.challenges c where is_family_parent(c.family_id)
  ));
create policy challenge_participants_delete on public.challenge_participants for delete
  using (challenge_id in (
    select c.id from public.challenges c where is_family_parent(c.family_id)
  ));

-- Calendar events
create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id),
  title text not null,
  description text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  all_day boolean not null default false,
  created_by uuid not null references public.family_members(id),
  created_at timestamptz not null default now()
);

alter table public.calendar_events enable row level security;

create policy calendar_events_select on public.calendar_events for select
  using (family_id in (select my_family_ids()));
create policy calendar_events_insert on public.calendar_events for insert
  with check (is_family_parent(family_id));
create policy calendar_events_update on public.calendar_events for update
  using (is_family_parent(family_id));
create policy calendar_events_delete on public.calendar_events for delete
  using (is_family_parent(family_id));

-- Event attendees
create table public.event_attendees (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.calendar_events(id),
  family_member_id uuid not null references public.family_members(id),
  status attendance_status not null default 'going'
);

alter table public.event_attendees enable row level security;

create policy event_attendees_select on public.event_attendees for select
  using (event_id in (
    select ce.id from public.calendar_events ce where ce.family_id in (select my_family_ids())
  ));
create policy event_attendees_insert on public.event_attendees for insert
  with check (event_id in (
    select ce.id from public.calendar_events ce where ce.family_id in (select my_family_ids())
  ));
create policy event_attendees_update on public.event_attendees for update
  using (event_id in (
    select ce.id from public.calendar_events ce where ce.family_id in (select my_family_ids())
  ));
create policy event_attendees_delete on public.event_attendees for delete
  using (event_id in (
    select ce.id from public.calendar_events ce where is_family_parent(ce.family_id)
  ));

-- Rewards
create table public.rewards (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id),
  title text not null,
  description text,
  cost_coins int not null,
  icon_url text,
  is_active boolean not null default true,
  created_by uuid not null references public.family_members(id),
  created_at timestamptz not null default now()
);

alter table public.rewards enable row level security;

create policy rewards_select on public.rewards for select
  using (family_id in (select my_family_ids()));
create policy rewards_insert on public.rewards for insert
  with check (is_family_parent(family_id));
create policy rewards_update on public.rewards for update
  using (is_family_parent(family_id));
create policy rewards_delete on public.rewards for delete
  using (is_family_parent(family_id));

-- Reward redemptions
create table public.reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  reward_id uuid not null references public.rewards(id),
  redeemed_by uuid not null references public.family_members(id),
  redeemed_at timestamptz not null default now(),
  coins_spent int not null,
  approved_by uuid references public.family_members(id),
  approved_at timestamptz
);

alter table public.reward_redemptions enable row level security;

create policy reward_redemptions_select on public.reward_redemptions for select
  using (reward_id in (
    select r.id from public.rewards r where r.family_id in (select my_family_ids())
  ));
create policy reward_redemptions_insert on public.reward_redemptions for insert
  with check (
    redeemed_by in (select fm.id from public.family_members fm where fm.user_id = auth.uid())
    and reward_id in (select r.id from public.rewards r where r.family_id in (select my_family_ids()))
  );
create policy reward_redemptions_update on public.reward_redemptions for update
  using (reward_id in (
    select r.id from public.rewards r where is_family_parent(r.family_id)
  ));
create policy reward_redemptions_delete on public.reward_redemptions for delete
  using (reward_id in (
    select r.id from public.rewards r where is_family_parent(r.family_id)
  ));
