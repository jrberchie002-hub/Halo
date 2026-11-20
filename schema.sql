-- Run once in the Supabase SQL editor.
create table if not exists halo_records (
  c    text   not null,
  id   text   not null,
  data jsonb  not null,
  u    bigint not null,
  primary key (c, id)
);
create index if not exists halo_records_u on halo_records (u);
create index if not exists halo_records_c on halo_records (c);
alter table halo_records enable row level security; -- the server uses the service key; nothing is public
