-- species 는 14행이고 수천 행이 될 일이 없다. analyze 후 실제 실행계획을 보면
-- ORDER BY sort_order 도 Seq Scan + Sort 로 풀린다(버퍼 1, 0.1ms). 인덱스는
-- 영영 안 쓰이면서 어드바이저에 unused_index 로만 남는다.
drop index if exists public.species_sort_order_idx;
