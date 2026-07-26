-- JobAlert-Bot database schema
-- Run in Supabase SQL Editor. Requires the pgvector extension.

create extension if not exists vector;

-- One row per WhatsApp user, identified by a hashed phone number (never stored in plaintext)
create table users (
  id uuid primary key default gen_random_uuid(),
  whatsapp_number_hash text unique not null,
  display_name text,
  created_at timestamptz default now()
);

-- What the user is looking for, plus an embedding used for relevance matching
create table interest_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  raw_interests text,
  embedding vector(384),
  updated_at timestamptz default now()
);

-- Every job post extracted from a forwarded message
create table job_posts (
  id uuid primary key default gen_random_uuid(),
  submitted_by uuid references users(id),
  raw_text text not null,
  company text,
  role text,
  location text,
  salary text,
  application_link text,
  deadline date,
  embedding vector(384),
  created_at timestamptz default now()
);

-- Relevance scores linking a user to a job post they were matched with
create table matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  job_post_id uuid references job_posts(id) on delete cascade,
  similarity_score float,
  sent_at timestamptz default now(),
  unique(user_id, job_post_id)
);

-- Row Level Security
alter table users enable row level security;
alter table interest_profiles enable row level security;
alter table job_posts enable row level security;
alter table matches enable row level security;

-- Deduplication: given a new post's embedding, find the most similar recent
-- post (last 7 days) if it exceeds the similarity threshold.
create or replace function match_similar_job_posts(
  query_embedding vector(384),
  similarity_threshold float default 0.92,
  match_count int default 1
)
returns table (
  id uuid,
  company text,
  role text,
  similarity float
)
language sql stable
as $$
  select
    id,
    company,
    role,
    1 - (embedding <=> query_embedding) as similarity
  from job_posts
  where created_at > now() - interval '7 days'
    and 1 - (embedding <=> query_embedding) > similarity_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;
