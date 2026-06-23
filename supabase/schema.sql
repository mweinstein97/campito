-- ============================================================
-- Familia Política — Schema Supabase
-- Ejecutar en: Dashboard → SQL Editor → New Query → Run
-- ============================================================

-- Habilitar extensión uuid (viene activada por defecto en Supabase)
-- create extension if not exists "pgcrypto";

-- ─── USERS ───────────────────────────────────────────────────
create table if not exists public.users (
  name      text primary key,
  emoji     text not null default '🙂',
  created_at timestamptz default now()
);

-- ─── AGENDA ──────────────────────────────────────────────────
create table if not exists public.agenda (
  id          text primary key,
  nombre      text not null,
  dia         text not null,
  hora        text not null,
  descripcion text,
  creador     text not null,
  created_at  timestamptz default now()
);

create table if not exists public.agenda_participantes (
  agenda_id text references public.agenda(id) on delete cascade,
  user_name text not null,
  primary key (agenda_id, user_name)
);

create table if not exists public.agenda_reacciones (
  agenda_id text references public.agenda(id) on delete cascade,
  user_name text not null,
  emoji     text not null,
  primary key (agenda_id, user_name)
);

-- ─── PREFERENCIAS ────────────────────────────────────────────
create table if not exists public.preferencias (
  user_name  text primary key,
  no_come    text,
  desayuno   text,
  desea      text,
  bebida     text
);

-- ─── CHECKLIST ───────────────────────────────────────────────
create table if not exists public.checklist (
  id         text primary key,
  item       text not null,
  tomado_por text
);

-- Datos iniciales checklist
insert into public.checklist (id, item, tomado_por) values
  ('c1', 'Hielo', null),
  ('c2', 'Parlante', null),
  ('c3', 'Botiquín', null),
  ('c4', 'Pelota', null),
  ('c5', 'Juegos de mesa', null),
  ('c6', 'Bajante', null)
on conflict do nothing;

-- ─── GASTOS ──────────────────────────────────────────────────
create table if not exists public.gastos (
  id          text primary key,
  descripcion text not null,
  monto       numeric(10,2) not null,
  pagador     text not null,
  created_at  timestamptz default now()
);

create table if not exists public.gastos_participantes (
  gasto_id  text references public.gastos(id) on delete cascade,
  user_name text not null,
  primary key (gasto_id, user_name)
);

-- ─── DESAFÍOS ────────────────────────────────────────────────
create table if not exists public.desafios (
  fecha    text primary key,          -- 'YYYY-M-D'
  pregunta text not null,
  opciones jsonb not null,            -- array de strings
  correcta text
);

create table if not exists public.desafio_respuestas (
  fecha     text references public.desafios(fecha) on delete cascade,
  user_name text not null,
  respuesta text not null,
  primary key (fecha, user_name)
);

-- ─── PRODE ───────────────────────────────────────────────────
create table if not exists public.prode_preguntas (
  id       text primary key,
  pregunta text not null,
  opciones jsonb not null,
  correcta text,
  cerrado  boolean default false,
  orden    integer default 0
);

create table if not exists public.prode_respuestas (
  pregunta_id text references public.prode_preguntas(id) on delete cascade,
  user_name   text not null,
  respuesta   text not null,
  primary key (pregunta_id, user_name)
);

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────
-- Modo simple: anon key puede leer y escribir todo (app interna)
-- Para producción real, restringir según necesidades.

alter table public.users             enable row level security;
alter table public.agenda            enable row level security;
alter table public.agenda_participantes enable row level security;
alter table public.agenda_reacciones enable row level security;
alter table public.preferencias      enable row level security;
alter table public.checklist         enable row level security;
alter table public.gastos            enable row level security;
alter table public.gastos_participantes enable row level security;
alter table public.desafios          enable row level security;
alter table public.desafio_respuestas enable row level security;
alter table public.prode_preguntas   enable row level security;
alter table public.prode_respuestas  enable row level security;

-- Política: acceso total para anon (ajustar si querés más restricciones)
do $$
declare
  t text;
  tables text[] := array[
    'users','agenda','agenda_participantes','agenda_reacciones',
    'preferencias','checklist','gastos','gastos_participantes',
    'desafios','desafio_respuestas','prode_preguntas','prode_respuestas'
  ];
begin
  foreach t in array tables loop
    execute format(
      'create policy if not exists "allow_all_anon" on public.%I for all to anon using (true) with check (true)',
      t
    );
  end loop;
end $$;

-- ─── REALTIME ────────────────────────────────────────────────
-- Habilitar realtime para todas las tablas relevantes
-- Dashboard → Database → Replication → enable para cada tabla
-- O ejecutar:
alter publication supabase_realtime add table public.users;
alter publication supabase_realtime add table public.agenda;
alter publication supabase_realtime add table public.agenda_participantes;
alter publication supabase_realtime add table public.agenda_reacciones;
alter publication supabase_realtime add table public.preferencias;
alter publication supabase_realtime add table public.checklist;
alter publication supabase_realtime add table public.gastos;
alter publication supabase_realtime add table public.gastos_participantes;
alter publication supabase_realtime add table public.desafios;
alter publication supabase_realtime add table public.desafio_respuestas;
alter publication supabase_realtime add table public.prode_preguntas;
alter publication supabase_realtime add table public.prode_respuestas;
