-- 별별펫 코어 스키마: enum 6개 + 도메인 테이블 13개 + updated_at/프로필 자동생성 트리거
-- 종을 폴더가 아닌 데이터 값으로, 커뮤니티 글 종류도 category 값으로 가른다 (CLAUDE.md).

-- ── enum ─────────────────────────────────────────────────────────────
-- DB enum → generate_typescript_types 로 TS 유니온 자동 생성 → 프론트 상수(Record)로 라벨 매핑.
create type public.species_group as enum ('dog', 'cat', 'exotic');
create type public.pet_sex as enum ('male', 'female', 'unknown');
create type public.place_category as enum ('animal_hospital', 'grooming', 'boarding');
create type public.place_status as enum ('operating', 'closed');
create type public.post_category as enum ('walk_crew', 'missing', 'adoption', 'free');
create type public.ingredient_safety as enum ('safe', 'caution', 'danger', 'unknown');

-- ── 공용 트리거 함수 ──────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── 종 · 펫 ─────────────────────────────────────────────────────────
-- 종(fine)은 테이블(계속 확장), 종 그룹(coarse)은 enum. group='exotic' 이 특수동물(해자).
create table public.species (
  code text primary key,
  "group" public.species_group not null,
  name_ko text not null,
  name_en text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.breeds (
  id uuid primary key default gen_random_uuid(),
  species_code text not null references public.species (code) on delete cascade,
  name_ko text not null,
  name_en text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index breeds_species_code_idx on public.breeds (species_code);

-- auth.users 와 1:1. 가입 시 트리거로 자동 생성된다.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  species_code text not null references public.species (code),
  breed_id uuid references public.breeds (id) on delete set null,
  name text not null,
  sex public.pet_sex not null default 'unknown',
  birth_date date,
  neutered boolean,
  weight_kg numeric(5, 2),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index pets_owner_id_idx on public.pets (owner_id);
create index pets_species_code_idx on public.pets (species_code);

-- ── 장소 · 리뷰 (해자) ───────────────────────────────────────────────
-- 좌표는 lat/lng 로 입력받고 geog 는 생성 컬럼(공간 인덱스·거리 계산용).
create table public.places (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  category public.place_category not null,
  status public.place_status not null default 'operating',
  name text not null,
  road_address text,
  jibun_address text,
  phone text,
  lat double precision not null,
  lng double precision not null,
  geog extensions.geography (point, 4326) generated always as (
    (extensions.st_setsrid(extensions.st_makepoint(lng, lat), 4326))::extensions.geography
  ) stored,
  source text not null default 'localdata',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index places_geog_idx on public.places using gist (geog);
create index places_category_idx on public.places (category);

-- ★ 핵심 해자: 장소 × 종 태깅 ("이 병원 페럿 진료 가능").
create table public.place_species (
  place_id uuid not null references public.places (id) on delete cascade,
  species_code text not null references public.species (code) on delete cascade,
  source text not null default 'community',
  created_at timestamptz not null default now(),
  primary key (place_id, species_code)
);
create index place_species_species_code_idx on public.place_species (species_code);

-- 자체 UGC 리뷰(영수증 인증). 방문 종 기록이 해자 데이터를 보강한다.
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  body text not null,
  receipt_image_path text,
  visited_species_code text references public.species (code) on delete set null,
  is_verified boolean not null default false,
  search_tsv tsvector generated always as (
    to_tsvector('simple'::regconfig, coalesce(body, ''))
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index reviews_place_id_idx on public.reviews (place_id);
create index reviews_author_id_idx on public.reviews (author_id);
create index reviews_search_tsv_idx on public.reviews using gin (search_tsv);

-- ── 커뮤니티 ────────────────────────────────────────────────────────
-- 글 종류는 category 로 가른다. 실종·산책크루 지도 핀용 좌표는 선택(nullable).
-- 종류별 추가 필드는 meta(jsonb) 에 담아 테이블을 쪼개지 않는다.
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  category public.post_category not null,
  title text not null,
  body text not null,
  species_code text references public.species (code) on delete set null,
  lat double precision,
  lng double precision,
  geog extensions.geography (point, 4326) generated always as (
    case
      when lat is not null and lng is not null
        then (extensions.st_setsrid(extensions.st_makepoint(lng, lat), 4326))::extensions.geography
    end
  ) stored,
  meta jsonb not null default '{}'::jsonb,
  search_tsv tsvector generated always as (
    to_tsvector('simple'::regconfig, coalesce(title, '') || ' ' || coalesce(body, ''))
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index posts_author_id_idx on public.posts (author_id);
create index posts_category_idx on public.posts (category);
create index posts_geog_idx on public.posts using gist (geog) where geog is not null;
create index posts_search_tsv_idx on public.posts using gin (search_tsv);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  parent_id uuid references public.comments (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index comments_post_id_idx on public.comments (post_id);
create index comments_author_id_idx on public.comments (author_id);
create index comments_parent_id_idx on public.comments (parent_id);

-- ── 사전 · 성분 ─────────────────────────────────────────────────────
-- dex_articles 는 SSG 대상(/dex/[slug]).
create table public.dex_articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  species_code text references public.species (code) on delete set null,
  title text not null,
  summary text,
  body text not null,
  published boolean not null default false,
  published_at timestamptz,
  search_tsv tsvector generated always as (
    to_tsvector(
      'simple'::regconfig,
      coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(body, '')
    )
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index dex_articles_search_tsv_idx on public.dex_articles using gin (search_tsv);
create index dex_articles_species_code_idx on public.dex_articles (species_code);

create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_ko text not null,
  name_en text,
  safety public.ingredient_safety not null default 'unknown',
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand text,
  barcode text unique,
  category text,
  image_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_ingredients (
  product_id uuid not null references public.products (id) on delete cascade,
  ingredient_id uuid not null references public.ingredients (id) on delete cascade,
  position smallint,
  created_at timestamptz not null default now(),
  primary key (product_id, ingredient_id)
);
create index product_ingredients_ingredient_id_idx on public.product_ingredients (ingredient_id);

-- ── updated_at 트리거 (메인 엔티티 11개) ─────────────────────────────
create trigger set_updated_at before update on public.species
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.breeds
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.pets
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.places
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.reviews
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.posts
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.comments
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.dex_articles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.ingredients
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.products
  for each row execute function public.set_updated_at();

-- ── 가입 시 프로필 자동 생성 ─────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, nickname)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      'user_' || substr(new.id::text, 1, 8)
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
