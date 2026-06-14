-- MassApp - Supabase schema
-- הרץ קובץ זה ב-Supabase Dashboard -> SQL Editor -> New Query

create table if not exists profile (
  id int primary key default 1 check (id = 1),
  name text default 'אלוף',
  current_weight numeric,
  goal_weight numeric,
  calorie_target int not null default 3000,
  protein_target int not null default 160,
  carbs_target int not null default 380,
  fat_target int not null default 90,
  water_target_ml int not null default 3000,
  updated_at timestamptz default now()
);
insert into profile (id) values (1) on conflict do nothing;

create table if not exists foods (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  calories_per_100 numeric not null,
  protein_per_100 numeric not null default 0,
  carbs_per_100 numeric not null default 0,
  fat_per_100 numeric not null default 0,
  default_amount numeric not null default 100,
  unit text not null default 'גרם',
  created_at timestamptz default now()
);

create table if not exists meals (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  meal_type text not null check (meal_type in ('breakfast','lunch','dinner','snack')),
  food_name text not null,
  amount numeric,
  unit text default 'גרם',
  calories numeric not null,
  protein numeric not null default 0,
  carbs numeric not null default 0,
  fat numeric not null default 0,
  created_at timestamptz default now()
);
create index if not exists meals_date_idx on meals(date);

create table if not exists water_logs (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  amount_ml int not null,
  created_at timestamptz default now()
);
create index if not exists water_logs_date_idx on water_logs(date);

create table if not exists weight_logs (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  weight numeric not null,
  created_at timestamptz default now()
);

create table if not exists daily_checkins (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  trained boolean not null default false,
  sleep_hours numeric check (sleep_hours is null or (sleep_hours >= 0 and sleep_hours <= 24)),
  appetite int check (appetite is null or appetite between 1 and 5),
  note text check (note is null or char_length(note) <= 500),
  muscles text[] not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table daily_checkins add column if not exists muscles text[] not null default '{}';
create index if not exists daily_checkins_date_idx on daily_checkins(date);

-- מבטיח ייחודיות שם גם בטבלאות קיימות (כדי ש-on conflict ימנע כפילויות)
create unique index if not exists foods_name_unique on foods(name);

-- קטלוג מאכלים ישראלי בסיסי (ערכים ל-100 גרם)
insert into foods (name, calories_per_100, protein_per_100, carbs_per_100, fat_per_100, default_amount, unit) values
  ('חזה עוף בגריל', 165, 31, 0, 3.6, 150, 'גרם'),
  ('אורז לבן מבושל', 130, 2.7, 28, 0.3, 200, 'גרם'),
  ('פסטה מבושלת', 158, 5.8, 31, 0.9, 200, 'גרם'),
  ('ביצה קשה (יחידה)', 155, 13, 1.1, 11, 50, 'גרם'),
  ('קוטג'' 5%', 98, 11, 3.5, 5, 250, 'גרם'),
  ('טונה בשמן (קופסה)', 198, 25, 0, 10, 100, 'גרם'),
  ('טונה במים (קופסה)', 116, 26, 0, 1, 100, 'גרם'),
  ('לחם מלא (פרוסה)', 250, 9, 41, 4, 35, 'גרם'),
  ('פיתה', 275, 9, 55, 1.2, 60, 'גרם'),
  ('חומוס מוכן', 166, 8, 14, 10, 100, 'גרם'),
  ('טחינה גולמית', 595, 17, 21, 54, 30, 'גרם'),
  ('שניצל עוף', 220, 19, 13, 11, 150, 'גרם'),
  ('בשר בקר טחון 5%', 137, 21, 0, 5, 150, 'גרם'),
  ('סלמון אפוי', 208, 20, 0, 13, 150, 'גרם'),
  ('בטטה אפויה', 90, 2, 21, 0.1, 200, 'גרם'),
  ('תפוח אדמה מבושל', 87, 1.9, 20, 0.1, 200, 'גרם'),
  ('שיבולת שועל (קוואקר)', 389, 17, 66, 7, 60, 'גרם'),
  ('בננה (יחידה)', 89, 1.1, 23, 0.3, 120, 'גרם'),
  ('תפוח (יחידה)', 52, 0.3, 14, 0.2, 180, 'גרם'),
  ('אבוקדו', 160, 2, 9, 15, 100, 'גרם'),
  ('חמאת בוטנים', 588, 25, 20, 50, 32, 'גרם'),
  ('שקדים', 579, 21, 22, 50, 30, 'גרם'),
  ('יוגורט יווני 0%', 59, 10, 3.6, 0.4, 200, 'גרם'),
  ('חלב 3%', 60, 3.3, 4.8, 3, 250, 'מ"ל'),
  ('אבקת חלבון (סקופ)', 380, 75, 8, 6, 32, 'גרם'),
  ('גבינה צהובה (פרוסה)', 350, 25, 1.5, 27, 25, 'גרם'),
  ('עדשים מבושלות', 116, 9, 20, 0.4, 200, 'גרם'),
  ('קינואה מבושלת', 120, 4.4, 21, 1.9, 185, 'גרם'),
  ('שמן זית', 884, 0, 0, 100, 14, 'מ"ל'),
  ('דבש', 304, 0.3, 82, 0, 21, 'גרם')
on conflict (name) do nothing;
