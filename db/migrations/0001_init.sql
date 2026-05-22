-- Auth.js adapter tables (do not rename columns)

create table users (
  id            uuid primary key default gen_random_uuid(),
  name          text,
  email         text not null unique,
  "emailVerified" timestamptz,
  image         text
);

create table accounts (
  id                  uuid primary key default gen_random_uuid(),
  "userId"            uuid not null references users(id) on delete cascade,
  type                text not null,
  provider            text not null,
  "providerAccountId" text not null,
  refresh_token       text,
  access_token        text,
  expires_at          bigint,
  token_type          text,
  scope               text,
  id_token            text,
  session_state       text,
  unique (provider, "providerAccountId")
);

create table sessions (
  id             uuid primary key default gen_random_uuid(),
  "userId"       uuid not null references users(id) on delete cascade,
  expires        timestamptz not null,
  "sessionToken" text not null unique
);

create table verification_tokens (
  identifier  text not null,
  token       text not null unique,
  expires     timestamptz not null,
  primary key (identifier, token)
);

-- Surveys

create table surveys (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null unique references users(id) on delete cascade,
  display_name        text not null check (length(display_name) between 1 and 80),
  photo_object_key    text not null,
  instagram_handle    text check (length(instagram_handle) <= 60),
  tiktok_handle       text check (length(tiktok_handle) <= 60),
  other_social_url    text check (length(other_social_url) <= 500),
  post_secondary      text not null check (length(post_secondary) between 1 and 200),
  hide_socials        boolean not null default false,
  hide_post_secondary boolean not null default false,
  answers             jsonb not null default '{}'::jsonb,
  submitted_at        timestamptz not null default now()
);

create index surveys_submitted_at_idx on surveys (submitted_at desc);
create index surveys_display_name_idx on surveys (lower(display_name));
