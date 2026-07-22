-- weight_kg 는 numeric(5,2) 라 제약이 없으면 -999.99 까지 들어간다.
-- rating 은 1~5 체크가 있는데 체중은 하한이 없어 도메인상 불가능한 값이 허용되던 구멍.
alter table public.pets
  add constraint pets_weight_kg_positive_check
  check (weight_kg is null or weight_kg > 0);
