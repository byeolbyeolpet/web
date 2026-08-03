-- nearby_places 재작성(#8) — status 필터 + 반경 clamp. 호출부 0줄인 지금 시그니처를 확정한다.
-- 파라미터 추가는 create or replace 로 안 된다(시그니처가 달라 오버로드 생성) — drop 후 재생성.
drop function if exists public.nearby_places (
  double precision, double precision, integer, public.place_category, text
);

-- 반경 내 장소 검색 RPC. species 필터로 특수동물 진료 병원 검색(해자).
-- SECURITY INVOKER 라 places RLS(공개 읽기)가 그대로 적용 → 게스트도 호출 가능.
create function public.nearby_places(
  p_lat double precision,
  p_lng double precision,
  p_radius_m integer default 3000,
  p_category public.place_category default null,
  p_species_code text default null,
  -- 기본은 영업 중만 — 폐업·휴업이 기본 노출되면 클라이언트가 걸러내게 되고,
  -- 그건 "DB 에서 필터 가능한 조건을 클라이언트에서 다시 filter 하지 않는다" 위반이다.
  -- null 은 다른 필터 인자와 같은 의미(필터 없음 = 전체 상태).
  p_statuses public.place_status[] default '{operating}'
)
returns table (
  id uuid,
  external_id text,
  category public.place_category,
  status public.place_status,
  name text,
  road_address text,
  jibun_address text,
  phone text,
  lat double precision,
  lng double precision,
  distance_m double precision
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    p.id,
    p.external_id,
    p.category,
    p.status,
    p.name,
    p.road_address,
    p.jibun_address,
    p.phone,
    p.lat,
    p.lng,
    extensions.st_distance(
      p.geog,
      (extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326))::extensions.geography
    ) as distance_m
  from public.places p
  where
    extensions.st_dwithin(
      p.geog,
      (extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326))::extensions.geography,
      -- 반경 clamp(1m~20km). 상한이 없으면 GIST 인덱스가 무력화되는 전량 스캔이
      -- 정상 경로로 열린다(#8). 하한은 0·음수 입력의 의미 없는 쿼리를 막는다.
      least(greatest(p_radius_m, 1), 20000)
    )
    and (p_statuses is null or p.status = any (p_statuses))
    and (p_category is null or p.category = p_category)
    and (
      p_species_code is null
      or exists (
        select 1
        from public.place_species ps
        where ps.place_id = p.id and ps.species_code = p_species_code
      )
    )
  order by distance_m asc;
$$;

-- 함수 생성 시 public 에 기본 부여되는 execute 를 회수한 뒤 필요한 롤에만 grant.
revoke all on function public.nearby_places (
  double precision, double precision, integer, public.place_category, text, public.place_status[]
) from public;
grant execute on function public.nearby_places (
  double precision, double precision, integer, public.place_category, text, public.place_status[]
) to anon, authenticated;
