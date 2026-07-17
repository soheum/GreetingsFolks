create extension if not exists pgcrypto;

create table if not exists public.sent_cards (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  recipient_email text not null,
  message text not null,
  card_title text not null,
  card_image text not null,
  ref_number text not null,
  created_at timestamptz not null default now()
);

alter table public.sent_cards add column if not exists ref_number text;

update public.sent_cards
set ref_number = '#' || upper(substr(replace(id::text, '-', ''), 1, 10))
where ref_number is null;

alter table public.sent_cards alter column ref_number set not null;
alter table public.sent_cards enable row level security;

create index if not exists sent_cards_token_idx on public.sent_cards (token);
create unique index if not exists sent_cards_ref_number_idx on public.sent_cards (ref_number);
