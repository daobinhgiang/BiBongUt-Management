-- Enums
create type public.task_difficulty as enum ('easy', 'medium', 'hard');
create type public.task_recurrence as enum ('none', 'daily', 'weekly', 'monthly');

-- Tasks
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id),
  title text not null,
  description text,
  difficulty task_difficulty not null default 'medium',
  points int not null default 10,
  coins_reward int not null default 1,
  assignee_id uuid references public.family_members(id),
  created_by uuid not null references public.family_members(id),
  due_date timestamptz,
  recurrence task_recurrence not null default 'none',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.tasks enable row level security;

create policy tasks_select on public.tasks for select using (family_id in (select my_family_ids()));
create policy tasks_insert on public.tasks for insert with check (is_family_parent(family_id));
create policy tasks_update on public.tasks for update using (is_family_parent(family_id));
create policy tasks_delete on public.tasks for delete using (is_family_parent(family_id));

-- Task completions
create table public.task_completions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id),
  completed_by uuid not null references public.family_members(id),
  completed_at timestamptz not null default now(),
  photo_url text,
  notes text,
  points_awarded int not null default 0,
  coins_awarded int not null default 0
);

alter table public.task_completions enable row level security;

create policy task_completions_select on public.task_completions for select
  using (task_id in (select t.id from tasks t where t.family_id in (select my_family_ids())));
create policy task_completions_insert on public.task_completions for insert
  with check (
    completed_by in (select fm.id from family_members fm where fm.user_id = auth.uid())
    and task_id in (select t.id from tasks t where t.family_id in (select my_family_ids()))
  );
create policy task_completions_update on public.task_completions for update
  using (task_id in (select t.id from tasks t where is_family_parent(t.family_id)));
create policy task_completions_delete on public.task_completions for delete
  using (task_id in (select t.id from tasks t where is_family_parent(t.family_id)));
