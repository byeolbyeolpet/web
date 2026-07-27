-- 펫 이름 길이 제약. RLS 는 "본인 행인가"만 보고 길이는 통과시킨다.
-- 클라이언트 zod(1~20자)와 같은 범위를 DB 에도 걸어 직접 호출 경로를 막는다.
alter table public.pets
  add constraint pets_name_length_check
  check (char_length(btrim(name)) between 1 and 20);
