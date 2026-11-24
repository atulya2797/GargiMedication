-- Optional cloud database schema for Supabase/Postgres.
create table if not exists medicines (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  dosage text default '',
  time text not null,
  notes text default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists medication_logs (
  id uuid primary key default gen_random_uuid(),
  medicine_id uuid not null references medicines(id) on delete cascade,
  taken_at timestamptz not null default now(),
  date date not null default current_date,
  created_at timestamptz not null default now()
);

alter table medicines enable row level security;
alter table medication_logs enable row level security;

-- For a private single-user app, replace these with authenticated-user policies
-- after enabling Supabase Auth. Do not expose a service-role key in the browser.
