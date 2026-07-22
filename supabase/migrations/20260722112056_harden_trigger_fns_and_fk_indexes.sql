-- 보안/성능 어드바이저 후속 조치.
-- 1) 트리거 전용 함수는 REST RPC 로 노출될 필요가 없다. 실행 권한 회수.
--    (handle_new_user 는 SECURITY DEFINER 라 외부 호출 시 권한 상승 위험 → 어드바이저 WARN)
--    Supabase 는 anon/authenticated 에 직접 grant 하므로 PUBLIC 회수만으론 부족 → 역할별로 회수.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- 2) 조인에 쓰이는 FK 커버링 인덱스 (unindexed_foreign_keys INFO).
create index pets_breed_id_idx on public.pets (breed_id);
create index posts_species_code_idx on public.posts (species_code);
create index reviews_visited_species_code_idx on public.reviews (visited_species_code);
