-- Reference Postgres schema for a production MessageStore (the bundled MemoryStore is for dev/tests).
create table scheduled_messages (
  id          text primary key,
  user_id     text not null,
  channels    text[] not null,
  recipient   text not null,
  targets     jsonb not null default '{}',
  subject     text,
  body        text not null default '',
  media       jsonb,
  send_at     timestamptz not null,
  timezone    text not null default 'Asia/Kolkata',
  repeat      text not null default 'once' check (repeat in ('once','daily','weekly','monthly','yearly')),
  status      text not null check (status in ('scheduled','sending','sent','partial','failed','needs-tap','cancelled')),
  results     jsonb not null default '{}',
  repeat_of   text references scheduled_messages(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index scheduled_messages_user on scheduled_messages (user_id, send_at desc);
create index scheduled_messages_due on scheduled_messages (send_at) where status = 'scheduled';

-- OAuth tokens per user + channel. Encrypt token columns at rest (e.g. KMS envelope encryption);
-- never store them in plaintext and never commit them.
create table channel_credentials (
  user_id     text not null,
  channel     text not null,
  data_enc    bytea not null,
  expires_at  timestamptz,
  primary key (user_id, channel)
);
