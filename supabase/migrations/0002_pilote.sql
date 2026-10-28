-- Pa Oublié : corrections avant le pilote avec les pompes funèbres
-- 1. Profil créé automatiquement à la première connexion
-- 2. Invitations : la pompe funèbre remet le mémorial à la famille, la famille invite ses proches
-- 3. Médias envoyés par la famille (stockage Supabase)
-- 4. Genre du défunt (« dit » ou « dite », portrait par défaut)
-- 5. Limitation des abus (messages, bougies, fleurs)
-- 6. Règlement des commandes par le distributeur

-- 1. Profils ------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Comptes créés avant ce trigger
insert into public.profiles (id, full_name)
select u.id, split_part(u.email, '@', 1) from auth.users u
on conflict (id) do nothing;

-- 2. Invitations --------------------------------------------------------------
create table public.invitations (
  token text primary key check (char_length(token) >= 24),
  tomb_id uuid not null references public.tombs (id) on delete cascade,
  role text not null default 'member' check (role in ('guardian', 'member')),
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '60 days',
  accepted_by uuid references public.profiles (id),
  accepted_at timestamptz
);
alter table public.invitations enable row level security;
-- Aucune règle : les invitations ne sont lues et écrites que côté serveur.

create or replace function public.is_tomb_guardian(t uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from tomb_members where tomb_id = t and profile_id = auth.uid() and role = 'guardian')
$$;

-- Seul le gardien ou la gardienne modère et modifie
drop policy if exists "la famille modère" on public.messages;
create policy "le gardien modère" on public.messages
  for update using (exists (select 1 from memorials m where m.id = memorial_id and public.is_tomb_guardian(m.tomb_id)));

drop policy if exists "famille modifie ses mémoriaux" on public.memorials;
create policy "le gardien modifie les mémoriaux" on public.memorials
  for update using (public.is_tomb_guardian(tomb_id));

-- 3. Médias ---------------------------------------------------------------------
alter table public.media add column if not exists storage_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media', 'media', true, 104857600,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic',
        'audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/ogg', 'audio/webm', 'audio/wav',
        'video/mp4', 'video/quicktime', 'video/webm']
)
on conflict (id) do nothing;

-- 4. Genre ----------------------------------------------------------------------
alter table public.memorials add column if not exists gender text check (gender in ('f', 'm'));

-- 5. Abus -------------------------------------------------------------------------
create table public.abuse_events (
  id bigint generated always as identity primary key,
  kind text not null,
  key text not null,
  created_at timestamptz not null default now()
);
create index abuse_events_lookup on public.abuse_events (kind, key, created_at desc);
alter table public.abuse_events enable row level security;
-- Aucune règle : réservé au serveur. Le visiteur n'y est connu que par une empreinte de son adresse IP.

-- 6. Règlement --------------------------------------------------------------------
alter table public.orders add column if not exists paid_at timestamptz;
alter table public.orders add column if not exists paid_via text check (paid_via in ('distributeur', 'virement', 'carte'));
