-- MassApp (LiftLog) - Supabase schema
-- הרץ קובץ זה ב-Supabase Dashboard -> SQL Editor -> New Query
--
-- מודל הסנכרון: auth עצמאי (email + סיסמה מגובבת) + blob אחד של JSON לכל משתמש
-- (profile, workouts, routines, bodyWeights נשמרים יחד בעמודת state).

create extension if not exists pgcrypto;

-- משתמשים
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  created_at timestamptz default now()
);

-- ה-state המסונכרן: רשומה אחת לכל משתמש (last-write-wins)
create table if not exists user_state (
  user_id uuid primary key references users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);
