-- LOCALDATA 영업상태는 영업/휴업/폐업을 구분한다. '휴업'을 closed 로 뭉개면
-- 일시 휴업과 폐업이 같은 표시가 되어 정보 허브로서 틀린 정보를 준다.
-- alter type ... add value 는 같은 트랜잭션에서 새 값을 사용할 수 없으므로 별도 마이그레이션으로 둔다.
alter type public.place_status add value if not exists 'suspended' after 'operating';
