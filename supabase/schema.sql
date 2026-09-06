-- ============================================================
-- Personal OS SaaS — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. PROFILES (replaces the old 'meta' / Settings singleton)
-- ============================================================
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  name          text not null default 'Ahsan Danish',
  pfp           text not null default '',
  platforms     jsonb not null default '["YouTube","YT Shorts","Instagram Reels","TikTok","Facebook"]'::jsonb,
  stages        jsonb not null default '["Idea","Script","Record","Edit","Thumbnail","Scheduled","Published"]'::jsonb,
  markets       jsonb not null default '["Stock","Mutual Fund","Crypto"]'::jsonb,
  templates     jsonb not null default '[]'::jsonb,
  usd_rate      numeric not null default 278,
  base_currency text not null default 'PKR',
  last_backup   bigint
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    )
  );
  -- Every new user gets a 14-day Pro trial automatically.
  insert into public.subscriptions (user_id, plan, trial_ends_at)
  values (new.id, 'trial', now() + interval '14 days');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 2. SUBSCRIPTIONS
-- ============================================================
create table public.subscriptions (
  user_id                 uuid primary key references auth.users(id) on delete cascade,
  plan                    text not null default 'trial' check (plan in ('trial','free','pro')),
  trial_ends_at           timestamptz,
  stripe_customer_id      text,
  stripe_subscription_id  text,
  created                 timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "Users can view own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "Users can insert own subscription"
  on public.subscriptions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own subscription"
  on public.subscriptions for update
  using (auth.uid() = user_id);

-- ============================================================
-- 3. TASKS
-- ============================================================
create table public.tasks (
  id           uuid primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  created      bigint not null default extract(epoch from now()) * 1000,
  title        text not null default '',
  repeat       text not null default 'once',
  days         jsonb,
  due          text,
  done         boolean not null default false,
  done_at      bigint,
  project_id   uuid,
  notes        text,
  needs_detail boolean not null default false,
  log          jsonb not null default '{}'::jsonb
);

alter table public.tasks enable row level security;

create policy "Users can CRUD own tasks"
  on public.tasks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_tasks_user on public.tasks(user_id);

-- ============================================================
-- 4. HABITS
-- ============================================================
create table public.habits (
  id      uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created bigint not null default extract(epoch from now()) * 1000,
  name    text not null default '',
  icon    text,
  days    jsonb,
  log     jsonb not null default '{}'::jsonb
);

alter table public.habits enable row level security;

create policy "Users can CRUD own habits"
  on public.habits for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_habits_user on public.habits(user_id);

-- ============================================================
-- 5. CONTENT
-- ============================================================
create table public.content (
  id             uuid primary key,
  user_id        uuid not null references auth.users(id) on delete cascade,
  created        bigint not null default extract(epoch from now()) * 1000,
  title          text not null default '',
  hook           text,
  platforms      jsonb not null default '[]'::jsonb,
  stage          text not null default 'Idea',
  publish_date   text,
  published_at   bigint,
  script         text,
  notes          text,
  tn_big_text    text,
  tn_sub_text    text,
  tn_emotion     text,
  tn_colors      text,
  tn_objects     text,
  tn_layout      text,
  thumb_script   text
);

alter table public.content enable row level security;

create policy "Users can CRUD own content"
  on public.content for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_content_user on public.content(user_id);

-- ============================================================
-- 6. PROJECTS
-- ============================================================
create table public.projects (
  id               uuid primary key,
  user_id          uuid not null references auth.users(id) on delete cascade,
  created          bigint not null default extract(epoch from now()) * 1000,
  name             text not null default '',
  ptype            text,
  status           text not null default 'Idea',
  client           text,
  assignee         text,
  outsource        text,
  price            numeric,
  outsource_cost   numeric,
  currency         text not null default 'PKR',
  next             text,
  revenue          text,
  notes            text,
  needs_detail     boolean not null default false,
  archived         boolean not null default false,
  shipped_at       bigint
);

alter table public.projects enable row level security;

create policy "Users can CRUD own projects"
  on public.projects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_projects_user on public.projects(user_id);

-- ============================================================
-- 7. MONEY (ledger entries)
-- ============================================================
create table public.money (
  id        uuid primary key,
  user_id   uuid not null references auth.users(id) on delete cascade,
  created   bigint not null default extract(epoch from now()) * 1000,
  type      text not null default 'expense',
  amount    numeric not null default 0,
  currency  text not null default 'PKR',
  category  text,
  date      text not null,
  note      text
);

alter table public.money enable row level security;

create policy "Users can CRUD own money"
  on public.money for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_money_user on public.money(user_id);

-- ============================================================
-- 8. HOLDINGS (investments)
-- ============================================================
create table public.holdings (
  id          uuid primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  created     bigint not null default extract(epoch from now()) * 1000,
  asset_type  text not null default '',
  symbol      text not null default '',
  name        text,
  units       numeric not null default 0,
  buy_rate    numeric not null default 0,
  currency    text not null default 'PKR',
  cur_rate    numeric,
  buy_unknown boolean not null default false,
  dividends   numeric not null default 0,
  sip         jsonb,
  sales       jsonb not null default '[]'::jsonb
);

alter table public.holdings enable row level security;

create policy "Users can CRUD own holdings"
  on public.holdings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_holdings_user on public.holdings(user_id);

-- ============================================================
-- 9. LOANS
-- ============================================================
create table public.loans (
  id        uuid primary key,
  user_id   uuid not null references auth.users(id) on delete cascade,
  created   bigint not null default extract(epoch from now()) * 1000,
  direction text not null default 'given',
  person    text not null default '',
  amount    numeric not null default 0,
  currency  text not null default 'PKR',
  due       text,
  note      text,
  repaid    numeric not null default 0,
  status    text not null default 'outstanding'
);

alter table public.loans enable row level security;

create policy "Users can CRUD own loans"
  on public.loans for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_loans_user on public.loans(user_id);

-- ============================================================
-- 10. NOTES
-- ============================================================
create table public.notes (
  id      uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created bigint not null default extract(epoch from now()) * 1000,
  title   text,
  body    text,
  color   text not null default 'y',
  pinned  boolean not null default false,
  updated bigint
);

alter table public.notes enable row level security;

create policy "Users can CRUD own notes"
  on public.notes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_notes_user on public.notes(user_id);

-- ============================================================
-- 11. REMINDERS
-- ============================================================
create table public.reminders (
  id         uuid primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created    bigint not null default extract(epoch from now()) * 1000,
  title      text not null default '',
  remind_at  bigint,
  repeat     text not null default 'none',
  note       text,
  done       boolean not null default false,
  updated    bigint
);

alter table public.reminders enable row level security;

create policy "Users can CRUD own reminders"
  on public.reminders for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_reminders_user on public.reminders(user_id);

-- ============================================================
-- 12. TEAM
-- ============================================================
create table public.team (
  id      uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created bigint not null default extract(epoch from now()) * 1000,
  name    text not null default '',
  role    text,
  color   text not null default '#E8432D'
);

alter table public.team enable row level security;

create policy "Users can CRUD own team"
  on public.team for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_team_user on public.team(user_id);

-- ============================================================
-- 13. INBOX
-- ============================================================
create table public.inbox (
  id      uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  text    text not null default '',
  created bigint not null default extract(epoch from now()) * 1000
);

alter table public.inbox enable row level security;

create policy "Users can CRUD own inbox"
  on public.inbox for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_inbox_user on public.inbox(user_id);

-- ============================================================
-- DONE
-- ============================================================
