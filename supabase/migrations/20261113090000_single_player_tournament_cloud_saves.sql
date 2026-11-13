-- Account-owned cloud backup for the single-player tournament store.
-- Kept separate from all multiplayer auction tables.
create table if not exists public.single_player_tournament_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.single_player_tournament_saves enable row level security;

drop policy if exists "Users can read own single-player save" on public.single_player_tournament_saves;
create policy "Users can read own single-player save"
  on public.single_player_tournament_saves for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create own single-player save" on public.single_player_tournament_saves;
create policy "Users can create own single-player save"
  on public.single_player_tournament_saves for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own single-player save" on public.single_player_tournament_saves;
create policy "Users can update own single-player save"
  on public.single_player_tournament_saves for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete own single-player save" on public.single_player_tournament_saves;
create policy "Users can delete own single-player save"
  on public.single_player_tournament_saves for delete to authenticated
  using (auth.uid() = user_id);
