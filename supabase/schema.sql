
-- Tablas mínimas para persistencia (RLS activado en Supabase)

create table if not exists public.findings (
  id bigint generated always as identity primary key,
  platform text not null,
  type text not null check (type in ('pro','con','alert')),
  text text not null,
  created_at timestamp with time zone default now()
);

create table if not exists public.weights (
  id bigint generated always as identity primary key,
  feature text unique not null,
  weight numeric not null default 1
);

create table if not exists public.feature_scores (
  id bigint generated always as identity primary key,
  platform text not null,
  feature text not null,
  score int not null, -- esperado -1..2
  note text,
  inserted_at timestamp with time zone default now(),
  unique(platform, feature)
);

alter table public.findings enable row level security;
alter table public.weights enable row level security;
alter table public.feature_scores enable row level security;

-- Políticas: lectura pública
create policy "findings-select-public" on public.findings
for select using (true);
create policy "weights-select-public" on public.weights
for select using (true);
create policy "feature_scores-select-public" on public.feature_scores
for select using (true);

-- Políticas: escritura solo autenticados
create policy "findings-write-auth" on public.findings
for all to authenticated using (true) with check (true);
create policy "weights-write-auth" on public.weights
for all to authenticated using (true) with check (true);
create policy "feature_scores-write-auth" on public.feature_scores
for all to authenticated using (true) with check (true));

-- Opcional: restringir por email específico del admin
-- Reemplaza 'tu_admin@empresa.com' por tu email real.
-- create policy "only-admin-email-findings" on public.findings
-- for all to authenticated using ( auth.email() = 'tu_admin@empresa.com' ) with check ( auth.email() = 'tu_admin@empresa.com' );
-- Repite para las otras tablas si deseas.
