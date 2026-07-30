-- Morga: tabla de datos personales por usuario + seguridad por fila (RLS).
-- Ejecutar este script una vez en Supabase: Dashboard -> SQL Editor -> New query -> pegar y Run.

create table if not exists public.planning_stores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  schema_version integer not null default 6,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.planning_stores enable row level security;

drop policy if exists "planning_stores_select_own" on public.planning_stores;
create policy "planning_stores_select_own"
  on public.planning_stores for select
  using (auth.uid() = user_id);

drop policy if exists "planning_stores_insert_own" on public.planning_stores;
create policy "planning_stores_insert_own"
  on public.planning_stores for insert
  with check (auth.uid() = user_id);

drop policy if exists "planning_stores_update_own" on public.planning_stores;
create policy "planning_stores_update_own"
  on public.planning_stores for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "planning_stores_delete_own" on public.planning_stores;
create policy "planning_stores_delete_own"
  on public.planning_stores for delete
  using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_planning_stores_updated_at on public.planning_stores;
create trigger set_planning_stores_updated_at
before update on public.planning_stores
for each row execute function public.set_updated_at();
