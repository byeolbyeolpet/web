-- place_category 확장(#44) — 약국(pharmacy)·장묘(funeral).
-- enum 값 추가는 같은 트랜잭션에서 그 값을 쓸 수 없어 단독 마이그레이션으로 분리한다(supabase-convention §2).
alter type public.place_category add value if not exists 'pharmacy';
alter type public.place_category add value if not exists 'funeral';
