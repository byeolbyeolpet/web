-- #4 스키마 검증(멀티에이전트 감사) 확정 결함 보정.

-- ── 1) 신규 그릇: 이미지 첨부 + 동네(행정동 코드) ──
-- design.md 는 profiles 의 동네와 posts 의 location 을 스펙했으나 초기 마이그레이션에서 누락됐다.
alter table public.posts add column image_paths text[] not null default '{}';
alter table public.reviews add column image_paths text[] not null default '{}';
alter table public.profiles add column region_code text;
alter table public.posts add column region_code text;
create index posts_region_code_idx on public.posts (region_code);
create index profiles_region_code_idx on public.profiles (region_code);

-- ── 2) 좌표 무결성 ──
-- geography 캐스트는 범위 초과를 에러 없이 wrap 한다(lat 91 -> 89, lng 200 -> -160).
-- DB 가 막지 않으면 lat/lng 컬럼과 생성컬럼 geog 가 조용히 어긋나
-- 지도 표시(lat/lng)와 거리 계산(geog)이 다른 좌표를 쓰게 된다.
alter table public.places
  add constraint places_lat_lng_range_check
  check (lat between -90 and 90 and lng between -180 and 180);
-- posts 는 좌표가 선택이므로 짝 일치까지 함께 강제한다(한쪽만 있으면 geog 가 조용히 NULL).
alter table public.posts
  add constraint posts_lat_lng_check
  check (
    (lat is null and lng is null)
    or (lat between -90 and 90 and lng between -180 and 180)
  );

-- ── 3) 장소 자연키: 공공데이터 2개 소스(LOCALDATA·검역본부) 병합 대비 ──
alter table public.places drop constraint places_external_id_key;
alter table public.places
  add constraint places_source_external_id_key unique (source, external_id);

-- ── 4) 댓글 스레드 무결성: 부모는 반드시 같은 글 소속 + 자기참조 금지 ──
alter table public.comments add constraint comments_post_id_id_key unique (post_id, id);
alter table public.comments drop constraint comments_parent_id_fkey;
alter table public.comments
  add constraint comments_parent_fkey
  foreign key (post_id, parent_id) references public.comments (post_id, id) on delete cascade;
alter table public.comments
  add constraint comments_parent_not_self_check
  check (parent_id is null or parent_id <> id);

-- ── 5) 사용자 입력 길이 상한 (서버가 없어 DB 가 유일한 방어선) ──
-- body 1MB 초과 시 생성컬럼 search_tsv 의 to_tsvector 가 54000 에러를 낸다.
alter table public.posts
  add constraint posts_title_len_check check (char_length(title) between 1 and 200),
  add constraint posts_body_len_check check (char_length(body) between 1 and 10000),
  add constraint posts_meta_size_check check (char_length(meta::text) <= 8192),
  add constraint posts_region_code_len_check
    check (region_code is null or char_length(region_code) <= 20),
  add constraint posts_image_paths_len_check
    check (coalesce(array_length(image_paths, 1), 0) <= 10);
alter table public.reviews
  add constraint reviews_body_len_check check (char_length(body) between 1 and 10000),
  add constraint reviews_image_paths_len_check
    check (coalesce(array_length(image_paths, 1), 0) <= 10);
alter table public.comments
  add constraint comments_body_len_check check (char_length(body) between 1 and 2000);
alter table public.profiles
  add constraint profiles_nickname_len_check check (char_length(nickname) between 1 and 30),
  add constraint profiles_bio_len_check check (bio is null or char_length(bio) <= 500),
  add constraint profiles_region_code_len_check
    check (region_code is null or char_length(region_code) <= 20);
alter table public.pets
  add constraint pets_name_len_check check (char_length(name) between 1 and 50);

-- ── 6) 탈퇴 시 콘텐츠 보존 ──
-- 개인정보(profiles·pets)는 cascade 유지, UGC 는 '탈퇴한 사용자'로 남긴다.
-- RLS 의 (select auth.uid()) = author_id 는 NULL 비교가 참이 아니므로 그대로 안전하다.
alter table public.posts alter column author_id drop not null;
alter table public.posts drop constraint posts_author_id_fkey;
alter table public.posts add constraint posts_author_id_fkey
  foreign key (author_id) references public.profiles (id) on delete set null;

alter table public.reviews alter column author_id drop not null;
alter table public.reviews drop constraint reviews_author_id_fkey;
alter table public.reviews add constraint reviews_author_id_fkey
  foreign key (author_id) references public.profiles (id) on delete set null;

alter table public.comments alter column author_id drop not null;
alter table public.comments drop constraint comments_author_id_fkey;
alter table public.comments add constraint comments_author_id_fkey
  foreign key (author_id) references public.profiles (id) on delete set null;

-- ── 7) nickname 길이 제약과 가입 트리거의 충돌 방지 ──
-- OAuth name 이 30자를 넘으면 profiles insert 실패 -> auth 가입 트랜잭션 전체가 롤백된다.
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
    left(
      coalesce(
        nullif(new.raw_user_meta_data ->> 'name', ''),
        nullif(new.raw_user_meta_data ->> 'full_name', ''),
        'user_' || substr(new.id::text, 1, 8)
      ),
      30
    )
  );
  return new;
end;
$$;

-- ── 8) reviews 컬럼 단위 권한 ──
-- RLS 는 행 단위라 컬럼을 구분하지 못한다. 테이블 레벨 grant 를 회수하고
-- 화이트리스트로 재부여해 is_verified(영수증 인증 뱃지)·created_at 위조와
-- place_id 이동(평점 이식)을 차단한다. 인증 승격은 service_role(Edge Function)만.
revoke insert, update on public.reviews from anon, authenticated;
grant insert (place_id, author_id, rating, body, receipt_image_path, visited_species_code, image_paths)
  on public.reviews to authenticated;
grant update (rating, body, receipt_image_path, visited_species_code, image_paths)
  on public.reviews to authenticated;
