# Potential Ideas

A running backlog of feature ideas for the BiBongUt family management app. Each idea captures the problem, a rough design, the data/schema impact, and open questions — meant as a starting point for scoping, not a final spec.

> Status legend: 💡 Idea · 🔍 Exploring · ✅ Approved · 🚧 In progress · ❌ Dropped

---

## 1. Task progress tracking (status + start/stop) 💡

**Problem**
Today a task is effectively binary: it's either open or it's been completed (via the `complete_task` RPC, which writes a `task_completions` row). There's no notion of a task being *in progress*, no way to see who is actively working on something, and no record of how long a task actually took. For a family splitting chores, "I started the dishes 20 min ago" and "this is done" are different signals worth capturing.

**Idea**
Give every task an explicit lifecycle and let the assignee start/stop work on it.

### Task status
Add a status that moves through a small state machine:

| Status        | Meaning                                  | Who can set it           |
| ------------- | ---------------------------------------- | ------------------------ |
| `not_started` | Default state when a task is created     | system / anyone          |
| `in_progress` | Someone has actively begun the task      | assignee (or any member) |
| `paused`      | (Optional) started, then stopped midway  | assignee                 |
| `completed`   | Finished — triggers existing XP/streak   | assignee → `complete_task` |
| `cancelled`   | (Optional) abandoned, no XP awarded      | parent/admin             |

Allowed transitions:

```
not_started ──start──▶ in_progress ──complete──▶ completed
     ▲                     │  ▲
     │                  stop│  │resume
     │                     ▼  │
     └──────────────────  paused
```

`completed` should continue to route through the existing `complete_task(task_id, member_id)` RPC so that XP, coins, streaks, badges, and recurrence all keep working unchanged. The status work is *additive* — it sits in front of the completion flow rather than replacing it.

### Start / stop ("work sessions")
When the assignee taps **Start**, record a work-session row; when they **Stop** (or **Complete**), close it out. This gives us:
- Who is actively working on what, right now (live "in progress" indicators on the Do tab).
- Elapsed/active time per task and a total across sessions (a task can be started and stopped multiple times).
- A simple activity history ("Mai worked on Laundry 8:10–8:35").

**Schema sketch**

```sql
-- On tasks: explicit lifecycle
alter type task_status as enum ('not_started','in_progress','paused','completed','cancelled');
alter table tasks add column status task_status not null default 'not_started';

-- Work sessions: one row per start→stop interval
create table task_work_sessions (
  id           uuid primary key default gen_random_uuid(),
  task_id      uuid not null references tasks(id) on delete cascade,
  member_id    uuid not null references family_members(id),
  started_at   timestamptz not null default now(),
  ended_at     timestamptz,                       -- null while active
  duration_secs integer generated always as       -- convenience, nullable
    (case when ended_at is not null
          then extract(epoch from (ended_at - started_at))::int end) stored,
  created_at   timestamptz not null default now()
);
```

Status changes could be driven by RPCs to keep the state machine enforced server-side:
- `start_task(task_id, member_id)` → sets `in_progress`, opens a work session (idempotent if one is already open).
- `stop_task(task_id, member_id)` → sets `paused`, closes the open session.
- `complete_task(...)` (existing) → also closes any open session and sets `completed`.

### RLS
- SELECT work sessions: family members via `my_family_ids()`.
- INSERT/UPDATE: the acting member on their own sessions; parents via `is_family_parent()` for overrides.
- Keep children able to start/stop/complete their own assigned tasks (consistent with the existing task exceptions).

### UI notes
- **Do tab task card:** show a status pill (`Not started` / `In progress` / `Done`) and a primary action that changes with state — `Start` → `Stop` / `Complete`.
- **Live timer:** while in progress, show elapsed time ticking on the card; an "active now" badge on the assignee's avatar.
- **Filters:** extend the existing `TaskFilter` union (`all | mine | today | overdue | done | challenges`) with an `in_progress` filter.
- **History:** a small expandable section per task listing past work sessions (who / when / duration).

### Why it's valuable
- Visibility — parents and kids can see what's actively being worked on, reducing "did anyone start dinner prep?" friction.
- Fairness/insight — total active time per member feeds nicely into the existing gamification (e.g., effort-based bonuses, weekly recaps).
- Foundation — work sessions unlock future analytics (time-of-day patterns, average duration per chore type) without another schema change.

### Open questions
- Should only the **assignee** be able to start a task, or any member (e.g., a parent helping out)?
- Do we want `paused` and `cancelled`, or keep the v1 state machine to just `not_started → in_progress → completed`?
- Should starting a task auto-claim an unassigned task to the person who started it?
- Multiple people on one task — out of scope for v1, or model `task_work_sessions` to support it from day one?
- Does active time affect XP, or stay purely informational at first?

### Rough scope
1. Migration: `task_status` enum + column, `task_work_sessions` table, RLS policies.
2. RPCs: `start_task`, `stop_task`; extend `complete_task` to close sessions.
3. Types: regenerate `database.types.ts`; add `TaskStatus`, `TaskWorkSession` to `features/tasks/types.ts`.
4. Queries/mutations: `useStartTask`, `useStopTask`, work-session queries with TanStack Query invalidation.
5. UI: status pill, start/stop button, live timer, `in_progress` filter, session history.

---

<!-- Add new ideas below, following the same structure. -->
