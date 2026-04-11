-- SaveSmart — Supabase Schema
-- Run this in Supabase SQL Editor

-- ─── Extensions ──────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Users (extends auth.users) ──────────────────────────────────────────────
create table public.profiles (
  id           uuid references auth.users on delete cascade primary key,
  full_name    text not null default '',
  avatar_url   text,
  level        integer not null default 1,
  xp           integer not null default 0,
  currency     text not null default 'EUR',
  monthly_budget numeric(10,2) not null default 0,
  is_pro       boolean not null default false,
  created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Transactions ─────────────────────────────────────────────────────────────
create table public.transactions (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  amount      numeric(10,2) not null,
  category    text not null check (category in ('food','transport','home','health','other')),
  store       text not null default '',
  note        text,
  receipt_url text,
  date        date not null default current_date,
  created_at  timestamptz not null default now()
);

alter table public.transactions enable row level security;
create policy "Users own transactions" on public.transactions
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index transactions_user_date on public.transactions (user_id, date desc);

-- ─── Goals ───────────────────────────────────────────────────────────────────
create table public.goals (
  id                   uuid default uuid_generate_v4() primary key,
  user_id              uuid references public.profiles(id) on delete cascade not null,
  title                text not null,
  emoji                text not null default '🎯',
  target_amount        numeric(10,2) not null,
  current_amount       numeric(10,2) not null default 0,
  monthly_contribution numeric(10,2) not null default 0,
  created_at           timestamptz not null default now()
);

alter table public.goals enable row level security;
create policy "Users own goals" on public.goals
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── Products (OpenFoodFacts cache) ──────────────────────────────────────────
create table public.products (
  id                 uuid default uuid_generate_v4() primary key,
  barcode            text unique,
  name               text not null,
  brand              text,
  calories_per_100g  numeric(8,2),
  protein_per_100g   numeric(8,2),
  fat_per_100g       numeric(8,2),
  carbs_per_100g     numeric(8,2),
  image_url          text,
  updated_at         timestamptz not null default now()
);

create index products_barcode on public.products (barcode);

-- ─── Store Prices ─────────────────────────────────────────────────────────────
create table public.store_prices (
  id           uuid default uuid_generate_v4() primary key,
  product_id   uuid references public.products(id) on delete cascade not null,
  store_name   text not null,
  store_lat    numeric(9,6),
  store_lng    numeric(9,6),
  price        numeric(8,2) not null,
  updated_at   timestamptz not null default now()
);

create index store_prices_product on public.store_prices (product_id);

-- ─── Fridge Items ────────────────────────────────────────────────────────────
create table public.fridge_items (
  id         uuid default uuid_generate_v4() primary key,
  user_id    uuid references public.profiles(id) on delete cascade not null,
  product_id uuid references public.products(id),
  name       text not null,
  quantity   numeric(8,2) not null default 1,
  unit       text not null default 'шт',
  expires_at date not null,
  added_at   timestamptz not null default now()
);

alter table public.fridge_items enable row level security;
create policy "Users own fridge" on public.fridge_items
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index fridge_user_expires on public.fridge_items (user_id, expires_at);

-- ─── Achievements ────────────────────────────────────────────────────────────
create table public.achievement_definitions (
  id          uuid default uuid_generate_v4() primary key,
  key         text unique not null,
  title       text not null,
  description text not null,
  tier        text not null check (tier in ('bronze','silver','gold','platinum','legend')),
  category    text not null check (category in ('budget','savings','food','nutrition','activity','special')),
  xp_reward   integer not null default 100
);

create table public.user_achievements (
  id             uuid default uuid_generate_v4() primary key,
  user_id        uuid references public.profiles(id) on delete cascade not null,
  achievement_id uuid references public.achievement_definitions(id) not null,
  earned_at      timestamptz not null default now(),
  unique (user_id, achievement_id)
);

alter table public.user_achievements enable row level security;
create policy "Users view own achievements" on public.user_achievements
  for select using (auth.uid() = user_id);

-- ─── Seed: Achievement Definitions ───────────────────────────────────────────
insert into public.achievement_definitions (key, title, description, tier, category, xp_reward) values
-- Budget
('first_step',       'Первый шаг',          'Добавил первую транзакцию',        'bronze',   'budget',    100),
('in_rhythm',        'В ритме',             '7 дней подряд добавляешь расходы', 'silver',   'budget',    300),
('numbers_master',   'Мастер цифр',         'Точный бюджет весь месяц',         'gold',     'budget',    500),
('no_loss',          'Не потерял',          'Не превысил бюджет за месяц',      'silver',   'budget',    300),
('goal_reached',     'Цель достигнута',     'Достиг первой цели накоплений',    'gold',     'budget',    500),
('super_goal',       'Супер-цель',          'Достиг цели от €5000',             'platinum', 'budget',   1000),
-- Savings
('first_savings',    'Первая экономия',     'Сэкономил первый €1',              'bronze',   'savings',   100),
('economist',        'Экономист',           'Сэкономил €100 за месяц',          'gold',     'savings',   500),
('no_coffee',        'Без кофе',            'Не покупал кофе навынос 2 недели', 'silver',   'savings',   250),
('deal_hunter',      'Охотник за скидками', 'Купил в более дешёвом магазине 10 раз', 'silver', 'savings', 250),
('optimizer',        'Оптимизатор',         'Сэкономил €500 за год',            'platinum', 'savings',  1000),
('anti_impulse',     'Антиимпульс',         'Отказался от 5 импульсных покупок','gold',     'savings',   500),
-- Food
('freshness',        'Свежесть',            'Добавил первый продукт в холодильник', 'bronze', 'food',    100),
('zero_waste',       'Ноль потерь',         'Не выбросил ни одного продукта за месяц', 'gold', 'food',  500),
('receipt_master',   'Чек-мастер',          'Отсканировал 10 чеков',            'silver',   'food',     250),
('fridge_pro',       'Холодильник PRO',     'В холодильнике 20+ продуктов',     'gold',     'food',     500),
('stocker',          'Запасливый',          'Добавил 50+ продуктов за всё время','bronze',  'food',     100),
('minimalist',       'Минималист',          'Холодильник пустой 0 потерь за месяц','silver','food',     250),
-- Nutrition
('first_nutrient',   'Первый нутриент',     'Просмотрел нутри-данные продукта', 'bronze',   'nutrition', 100),
('no_deficit',       'Без дефицита',        'Нет дефицитов витаминов 2 недели', 'gold',     'nutrition', 500),
('vitamin',          'Витаминный',          'Закрыл все дефициты за месяц',     'platinum', 'nutrition',1000),
('protein_fighter',  'Белковый боец',       'Выполнял норму белка 14 дней',     'silver',   'nutrition', 250),
('nutri_guru',       'Нутри-гуру',          'Идеальный баланс КБЖУ 30 дней',    'legend',   'nutrition',2000),
('greens',           'Зелёный',             'Съедал зелень каждый день 2 нед.', 'silver',   'nutrition', 250),
-- Activity
('first_day',        'Первый день',         'Первый вход в приложение',         'bronze',   'activity',  100),
('seven_days',       '7 дней',              '7 дней активности подряд',         'silver',   'activity',  300),
('thirty_days',      '30 дней',             '30 дней активности подряд',        'gold',     'activity',  500),
('early_bird',       'Ранняя птица',        'Добавил расход до 9 утра',         'bronze',   'activity',  100),
('night_watch',      'Ночной дозор',        'Добавил расход после 23:00',       'bronze',   'activity',  100),
('activity_legend',  'Легенда активности',  '365 дней активности подряд',       'legend',   'activity', 2000);
