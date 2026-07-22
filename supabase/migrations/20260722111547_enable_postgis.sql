-- 지도 반경 검색용 PostGIS 활성화 (geography 타입·GIST 인덱스·공간 함수)
-- extensions 스키마에 설치해 public 을 깨끗하게 유지한다 (Supabase 권장).
create extension if not exists postgis with schema extensions;
