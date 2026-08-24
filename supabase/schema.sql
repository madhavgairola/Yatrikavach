create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  nationality text,
  emergency_contact text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  destination text,
  destination_lat double precision,
  destination_lon double precision,
  geofence_radius_m integer default 5000,
  start_at timestamptz,
  end_at timestamptz,
  status text not null default 'planned' check (status in ('planned','active','completed','cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.location_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid references public.trips(id) on delete set null,
  latitude double precision not null,
  longitude double precision not null,
  accuracy double precision,
  place_name text,
  recorded_at timestamptz not null default now()
);

create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid references public.trips(id) on delete set null,
  category text not null,
  description text not null,
  latitude double precision,
  longitude double precision,
  severity integer not null default 2 check (severity between 1 and 5),
  status text not null default 'reported' check (status in ('reported','acknowledged','resolved')),
  created_at timestamptz not null default now()
);

create table if not exists public.sos_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  latitude double precision,
  longitude double precision,
  place_name text,
  status text not null default 'active' check (status in ('active','acknowledged','closed')),
  created_at timestamptz not null default now()
);

create table if not exists public.safety_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  score integer,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  message text not null,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.location_events enable row level security;
alter table public.incidents enable row level security;
alter table public.sos_events enable row level security;
alter table public.safety_events enable row level security;
alter table public.chat_messages enable row level security;

create policy "profiles own" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "trips own" on public.trips for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "locations own" on public.location_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "incidents own" on public.incidents for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "sos own" on public.sos_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "safety own" on public.safety_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "chat own" on public.chat_messages for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$ begin
  insert into public.profiles(id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name','')) on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
