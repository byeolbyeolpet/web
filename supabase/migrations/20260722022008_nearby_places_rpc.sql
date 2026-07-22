-- 반경 내 장소 검색 RPC. species 필터로 특수동물 진료 병원 검색(해자).
-- SECURITY INVOKER 라 places RLS(공개 읽기)가 그대로 적용 → 게스트도 호출 가능.
create or replace function public.nearby_places(
  p_lat double precision,
  p_lng double precision,
  p_radius_m integer default 3000,
  p_category public.place_category default null,
  p_species_code text default null
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
      p_radius_m
    )
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

revoke all on function public.nearby_places (
  double precision, double precision, integer, public.place_category, text
) from public;
grant execute on function public.nearby_places (
  double precision, double precision, integer, public.place_category, text
) to anon, authenticated;
