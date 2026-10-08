-- Pa Oublié : schéma initial
-- Tombes (un QR code = un caveau), mémoriaux (un par défunt), médias, messages,
-- distributeurs (pompes funèbres, marbriers…), commandes et codes QR.

create extension if not exists "pgcrypto";

-- Distributeurs ---------------------------------------------------------------
create table public.distributors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null check (kind in ('pompes_funebres', 'marbrier', 'assureur', 'fleuriste', 'autre')),
  commune text,
  phone text,
  email text,
  commission_rate numeric(4, 3) not null default 0.25,
  created_at timestamptz not null default now()
);

-- Profils (liés aux comptes Supabase Auth) ------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text not null default 'family' check (role in ('family', 'distributor', 'admin')),
  distributor_id uuid references public.distributors (id),
  created_at timestamptz not null default now()
);

-- Tombes ----------------------------------------------------------------------
create table public.tombs (
  id uuid primary key default gen_random_uuid(),
  family_name text not null,
  cemetery text not null,
  location_label text,
  commune text not null,
  visibility text not null default 'public' check (visibility in ('public', 'family')),
  owner_id uuid references public.profiles (id),
  distributor_id uuid references public.distributors (id),
  created_at timestamptz not null default now()
);

-- Codes QR, générés par lots avant d'être rattachés à une tombe -----------------
create table public.qr_codes (
  code text primary key check (code ~ '^[A-Z0-9]{5,8}$'),
  batch text not null,
  distributor_id uuid references public.distributors (id),
  tomb_id uuid unique references public.tombs (id),
  created_at timestamptz not null default now(),
  assigned_at timestamptz
);

-- Mémoriaux -------------------------------------------------------------------
create table public.memorials (
  id uuid primary key default gen_random_uuid(),
  tomb_id uuid not null references public.tombs (id) on delete cascade,
  slug text not null,
  first_name text not null,
  last_name text not null,
  nickname text,
  relation text,
  birth_date date,
  death_date date,
  birth_place text,
  quote text,
  quote_translation text,
  chapters jsonb not null default '[]'::jsonb,
  loves jsonb not null default '[]'::jsonb,
  portrait_url text,
  candles integer not null default 0,
  flowers integer not null default 0,
  visits integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  unique (tomb_id, slug)
);

-- Membres de la famille (gardien·ne et membres invités) -------------------------
create table public.tomb_members (
  tomb_id uuid not null references public.tombs (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('guardian', 'member')),
  primary key (tomb_id, profile_id)
);

-- Médias ----------------------------------------------------------------------
create table public.media (
  id uuid primary key default gen_random_uuid(),
  memorial_id uuid not null references public.memorials (id) on delete cascade,
  kind text not null check (kind in ('photo', 'video', 'audio')),
  url text,
  caption text not null,
  album text,
  duration text,
  sort integer not null default 0,
  created_at timestamptz not null default now()
);

-- Livre d'or et souvenirs : rien n'est publié sans l'accord de la famille ------
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  memorial_id uuid not null references public.memorials (id) on delete cascade,
  author_name text not null check (char_length(author_name) between 1 and 80),
  author_place text check (char_length(author_place) <= 80),
  body text not null check (char_length(body) between 1 and 1500),
  status text not null default 'pending' check (status in ('pending', 'published', 'private')),
  created_at timestamptz not null default now()
);

-- Commandes -------------------------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  tomb_id uuid references public.tombs (id),
  formula text not null check (formula in ('essentiel', 'memoire', 'heritage')),
  options jsonb not null default '[]'::jsonb,
  amount_ttc_cents integer not null,
  distributor_id uuid references public.distributors (id),
  commission_cents integer not null default 0,
  status text not null default 'pending' check (status in ('pending', 'paid', 'cancelled')),
  stripe_session_id text,
  created_at timestamptz not null default now()
);

-- Fonctions -------------------------------------------------------------------
create or replace function public.is_tomb_member(t uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from tomb_members where tomb_id = t and profile_id = auth.uid())
$$;

create or replace function public.light_candle(m uuid)
returns integer language sql security definer set search_path = public as $$
  update memorials set candles = candles + 1 where id = m and published returning candles
$$;

create or replace function public.drop_flower(m uuid)
returns integer language sql security definer set search_path = public as $$
  update memorials set flowers = flowers + 1 where id = m and published returning flowers
$$;

-- Sécurité (RLS) --------------------------------------------------------------
alter table public.distributors enable row level security;
alter table public.profiles enable row level security;
alter table public.tombs enable row level security;
alter table public.qr_codes enable row level security;
alter table public.memorials enable row level security;
alter table public.tomb_members enable row level security;
alter table public.media enable row level security;
alter table public.messages enable row level security;
alter table public.orders enable row level security;

create policy "profil personnel" on public.profiles
  for select using (id = auth.uid());

create policy "lecture tombes publiques ou de la famille" on public.tombs
  for select using (visibility = 'public' or public.is_tomb_member(id));

create policy "lecture des codes QR" on public.qr_codes
  for select using (true);

create policy "lecture mémoriaux publiés" on public.memorials
  for select using (
    (published and exists (select 1 from tombs t where t.id = tomb_id and t.visibility = 'public'))
    or public.is_tomb_member(tomb_id)
  );

create policy "famille modifie ses mémoriaux" on public.memorials
  for update using (public.is_tomb_member(tomb_id));

create policy "lecture médias" on public.media
  for select using (exists (select 1 from memorials m where m.id = memorial_id));

create policy "lecture messages publiés" on public.messages
  for select using (
    status = 'published'
    or exists (select 1 from memorials m where m.id = memorial_id and public.is_tomb_member(m.tomb_id))
  );

create policy "tout visiteur peut proposer un message" on public.messages
  for insert with check (status = 'pending');

create policy "la famille modère" on public.messages
  for update using (exists (select 1 from memorials m where m.id = memorial_id and public.is_tomb_member(m.tomb_id)));

create policy "membres visibles par la famille" on public.tomb_members
  for select using (public.is_tomb_member(tomb_id));

create policy "distributeur voit ses commandes" on public.orders
  for select using (
    distributor_id = (select distributor_id from profiles where id = auth.uid())
    or (tomb_id is not null and public.is_tomb_member(tomb_id))
  );

create policy "distributeur voit sa fiche" on public.distributors
  for select using (id = (select distributor_id from profiles where id = auth.uid()));
