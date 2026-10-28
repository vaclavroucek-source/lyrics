-- Run once in the Supabase SQL Editor. Each user can access only their own rows.
create table if not exists public.lyrics (
  id uuid not null,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null default '',
  text text not null default '',
  updated bigint not null,
  primary key (user_id, id)
);
alter table public.lyrics enable row level security;
revoke all on public.lyrics from anon;
grant select, insert, update, delete on public.lyrics to authenticated;
create policy "Read own lyrics" on public.lyrics for select to authenticated using ((select auth.uid()) = user_id);
create policy "Insert own lyrics" on public.lyrics for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own lyrics" on public.lyrics for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Delete own lyrics" on public.lyrics for delete to authenticated using ((select auth.uid()) = user_id);
