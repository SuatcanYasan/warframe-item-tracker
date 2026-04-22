-- WIT — Multi-table Supabase schema (normalized, relational)
-- Run once in Supabase Dashboard → SQL Editor.
-- Safe to re-run: drops and recreates tables. User data in the OLD user_state
-- blob is discarded — migration code will re-push from localStorage on next
-- login.

-- ============================================================================
-- Clean slate: drop previous blob table if it exists
-- ============================================================================
drop table if exists public.user_state cascade;

-- ============================================================================
-- Helpers
-- ============================================================================
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ============================================================================
-- 1. user_profiles — account metadata (1 row per user)
-- ============================================================================
create table public.user_profiles (
  user_id             uuid primary key references auth.users(id) on delete cascade,
  language            text,
  theme_name          text,
  custom_theme_tokens jsonb,
  theme_profiles      jsonb,
  completion_view     text,
  onboarding_done     boolean default false,
  stored_version      text,
  updated_at          timestamptz default now()
);
create trigger trg_user_profiles_touch
  before update on public.user_profiles
  for each row execute function public.touch_updated_at();

-- ============================================================================
-- 2. craft_items — craft tracker's selected items
-- ============================================================================
create table public.craft_items (
  user_id     uuid references auth.users(id) on delete cascade,
  unique_name text,
  name        text,
  image_url   text,
  type        text,
  category    text,
  quantity    integer default 1,
  added_at    timestamptz default now(),
  primary key (user_id, unique_name)
);

-- ============================================================================
-- 3. craft_completed — per item × per requirement progress
-- ============================================================================
create table public.craft_completed (
  user_id           uuid references auth.users(id) on delete cascade,
  item_unique_name  text,
  req_unique_name   text,
  quantity          integer default 0,
  primary key (user_id, item_unique_name, req_unique_name)
);

-- ============================================================================
-- 4. relic_found_components — per prime × per component
-- ============================================================================
create table public.relic_found_components (
  user_id               uuid references auth.users(id) on delete cascade,
  prime_unique_name     text,
  component_name        text,
  is_found              boolean default false,
  primary key (user_id, prime_unique_name, component_name)
);

-- ============================================================================
-- 5. inventory_parts — user's prime part inventory
-- ============================================================================
create table public.inventory_parts (
  user_id              uuid references auth.users(id) on delete cascade,
  unique_name          text,
  name                 text,
  parent_unique_name   text,
  parent_name          text,
  parent_image_url     text,
  parent_category      text,
  quantity             integer default 0,
  primary key (user_id, unique_name)
);

-- ============================================================================
-- 6. mastered_items — Mastery Rank progression
-- ============================================================================
create table public.mastered_items (
  user_id     uuid references auth.users(id) on delete cascade,
  unique_name text,
  status      text check (status in ('owned', 'mastered')),
  updated_at  timestamptz default now(),
  primary key (user_id, unique_name)
);
create trigger trg_mastered_items_touch
  before update on public.mastered_items
  for each row execute function public.touch_updated_at();

-- ============================================================================
-- 7. tracked_amp_sets — Amp loadouts the user is building
-- ============================================================================
create table public.tracked_amp_sets (
  user_id     uuid references auth.users(id) on delete cascade,
  set_id      text,
  code        text,
  prism       jsonb,  -- { uniqueName, name, done, ... }
  scaffold    jsonb,
  brace       jsonb,
  created_at  timestamptz default now(),
  primary key (user_id, set_id)
);

-- ============================================================================
-- 8. amp_mastery_parts — per-part MR status (owned | gilded)
-- ============================================================================
create table public.amp_mastery_parts (
  user_id     uuid references auth.users(id) on delete cascade,
  unique_name text,
  status      text check (status in ('owned', 'gilded')),
  primary key (user_id, unique_name)
);

-- ============================================================================
-- 9. amp_completed_materials — toggle set of materials user has collected
-- ============================================================================
create table public.amp_completed_materials (
  user_id     uuid references auth.users(id) on delete cascade,
  unique_name text,
  primary key (user_id, unique_name)
);

-- ============================================================================
-- 10. checklist_items — user's daily/weekly checklist
-- ============================================================================
create table public.checklist_items (
  user_id          uuid references auth.users(id) on delete cascade,
  item_id          text,
  text             text,
  type             text check (type in ('daily', 'weekly')),
  done_for_period  text,
  is_preset        boolean default false,
  primary key (user_id, item_id)
);

-- ============================================================================
-- 11. farm_resources — Farm Planner targets
-- ============================================================================
create table public.farm_resources (
  user_id               uuid references auth.users(id) on delete cascade,
  unique_name           text,
  name                  text,
  image_url             text,
  image_url_fallback    text,
  target                integer default 1,
  primary key (user_id, unique_name)
);

-- ============================================================================
-- Row Level Security — same pattern on all tables:
--   user can SELECT/INSERT/UPDATE/DELETE only rows where user_id = auth.uid()
-- ============================================================================
do $$
declare t text;
begin
  foreach t in array array[
    'user_profiles',
    'craft_items',
    'craft_completed',
    'relic_found_components',
    'inventory_parts',
    'mastered_items',
    'tracked_amp_sets',
    'amp_mastery_parts',
    'amp_completed_materials',
    'checklist_items',
    'farm_resources'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "own select" on public.%I', t);
    execute format('drop policy if exists "own insert" on public.%I', t);
    execute format('drop policy if exists "own update" on public.%I', t);
    execute format('drop policy if exists "own delete" on public.%I', t);
    execute format(
      'create policy "own select" on public.%I for select using (auth.uid() = user_id)', t);
    execute format(
      'create policy "own insert" on public.%I for insert with check (auth.uid() = user_id)', t);
    execute format(
      'create policy "own update" on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
    execute format(
      'create policy "own delete" on public.%I for delete using (auth.uid() = user_id)', t);
  end loop;
end $$;

-- ============================================================================
-- Realtime publication — clients subscribe per-table; RLS still applies
-- ============================================================================
alter publication supabase_realtime add table
  public.user_profiles,
  public.craft_items,
  public.craft_completed,
  public.relic_found_components,
  public.inventory_parts,
  public.mastered_items,
  public.tracked_amp_sets,
  public.amp_mastery_parts,
  public.amp_completed_materials,
  public.checklist_items,
  public.farm_resources;
