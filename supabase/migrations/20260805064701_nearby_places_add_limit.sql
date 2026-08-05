-- nearby_places 에 결과 상한을 둔다.
--
-- 상한이 없어서 반경만 넓히면 결과가 그대로 다 내려왔다 — 서울시청 기준 실측으로
-- 3km 221행, 10km 3,546행, 20km 8,529행. 지도에 줌아웃 버튼을 붙이는 순간 닿는
-- 경로이고, 모바일 WebView 에서 페이로드·마커 생성·DOM 이 한꺼번에 무너진다.
-- 거리순 정렬은 이미 있으므로 "가까운 것부터 N개" 로 자르는 것이 자연스럽다.
--
-- 반환 타입과 파라미터가 바뀌지 않아도 시그니처에 인자를 더하면 기존 함수와
-- 오버로드가 되어 호출이 모호해진다. 그래서 drop 후 재생성한다.
drop function if exists public.nearby_places(
  double precision, double precision, integer, place_category, text, place_status[]
);

create function public.nearby_places(
  p_lat double precision,
  p_lng double precision,
  p_radius_m integer default 3000,
  p_category place_category default null,
  p_species_code text default null,
  p_statuses place_status[] default '{operating}'::place_status[],
  p_limit integer default 200
)
returns table (
  id uuid,
  external_id text,
  category place_category,
  status place_status,
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
set search_path to ''
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
  order by distance_m asc
  -- 반경과 같은 이유로 여기도 clamp 한다. 상한 500 은 목록·마커가 감당하는 선.
  limit least(greatest(p_limit, 1), 500);
$$;

comment on function public.nearby_places is
  '반경 내 장소를 거리순으로 돌려준다. 반경 1m~20km, 결과 1~500건으로 clamp 된다.';
