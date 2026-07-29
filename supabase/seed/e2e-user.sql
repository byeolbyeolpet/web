-- E2E 테스트 계정 생성. **Supabase SQL Editor 에서 사람이 직접 실행한다.**
-- 마이그레이션이 아니다 — supabase/migrations 에 두지 않는 이유는 스키마가
-- 아니라 특정 환경의 데이터이고, 운영 DB 에 자동으로 흘러가면 안 되기 때문이다.
--
-- 왜 필요한가
--   앱의 로그인 수단이 Google OAuth 뿐이라 E2E 가 세션을 만들 수 없다. 구글
--   동의 화면은 봇 탐지가 걸려 자동화 대상이 아니다. 그래서 이메일/비밀번호
--   계정을 하나 두고, Playwright 는 토큰 엔드포인트로 세션만 받아 심는다.
--
-- 왜 대시보드 Add user 로는 부족한가
--   Add user 는 raw_user_meta_data 를 비워 둔다. 그러면 on_auth_user_created
--   트리거가 nickname 을 'user_xxxxxxxx' 로 만들고 Display Name 도 빈다.
--   테스트가 읽는 이름이 실행 환경마다 달라지면 단언을 걸 수 없다.
--
-- 왜 회원가입 API 로는 안 되는가
--   GoTrue 는 MX 레코드 없는 도메인을 email_address_invalid 로 거부한다.
--   .test 는 IANA 예약 TLD 라 절대 라우팅되지 않는데, 픽스처에는 그게 맞다.
--   MX 검증은 API 계층에서만 돌고 DB 삽입에는 걸리지 않는다.
--
-- 재실행해도 안전하다. 같은 이메일이 있으면 지우고 다시 만든다.
-- profiles.id 와 pets.owner_id 가 ON DELETE CASCADE 라 프로필과 테스트 펫이
-- 함께 정리된다 — 쌓인 테스트 데이터를 비우는 용도로도 쓸 수 있다.

do $$
declare
  -- 비밀번호는 여기 두지 않는다. 실행 직전에 바꿔 넣고, 같은 값을 .env.local 의
  -- E2E_USER_PASSWORD 에 적는다. 저장소가 퍼블릭이다.
  v_email    text := 'e2e@byeolbyeolpet.test';
  v_password text := '<여기에 비밀번호를 넣고 실행한다>';
  v_name     text := 'E2E 테스터';
  v_user_id  uuid := gen_random_uuid();
begin
  if v_password like '<%' then
    raise exception '비밀번호를 먼저 채우고 실행한다.';
  end if;

  delete from auth.users where email = v_email;

  insert into auth.users (
    instance_id, id, aud, role,
    email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    -- GoTrue 는 이 토큰 컬럼들을 Go 의 string 으로 읽는다. NULL 이면 스캔에서
    -- 터지므로 빈 문자열로 채운다. 대시보드 Add user 도 같은 값을 넣는다.
    confirmation_token, recovery_token,
    email_change, email_change_token_new, email_change_token_current,
    phone_change, phone_change_token, reauthentication_token
  ) values (
    '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
    v_email,
    -- pgcrypto 는 extensions 스키마에 있다. SQL Editor 의 search_path 에 없으므로
    -- 스키마를 붙여 부른다. bf = bcrypt, GoTrue 가 검증하는 형식이다.
    extensions.crypt(v_password, extensions.gen_salt('bf')),
    now(),
    jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
    -- name 은 on_auth_user_created 트리거가 profiles.nickname 으로 쓴다.
    -- full_name·display_name 은 대시보드 Users 목록의 Display Name 용이다
    -- (Studio 가 어느 키를 읽는지 버전마다 달라 셋 다 채운다).
    jsonb_build_object(
      'name', v_name, 'full_name', v_name, 'display_name', v_name,
      'email', v_email, 'email_verified', true, 'phone_verified', false
    ),
    now(), now(),
    '', '', '', '', '', '', '', ''
  );

  -- identities 가 없으면 GoTrue 가 이 계정을 "연결된 로그인 수단이 없는" 상태로
  -- 본다. 대시보드 Add user 도 이 행을 함께 만든다.
  insert into auth.identities (
    id, user_id, provider, provider_id, identity_data,
    last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), v_user_id, 'email', v_user_id::text,
    jsonb_build_object(
      'sub', v_user_id::text, 'email', v_email,
      'email_verified', true, 'phone_verified', false
    ),
    now(), now(), now()
  );
end $$;

-- 확인 — confirmed 가 true 고 profile_nickname 이 'E2E 테스터' 여야 한다.
select u.email,
       u.email_confirmed_at is not null as confirmed,
       u.raw_user_meta_data ->> 'name'  as display_name,
       p.nickname                       as profile_nickname,
       i.provider
from auth.users u
left join public.profiles p  on p.id = u.id
left join auth.identities i  on i.user_id = u.id
where u.email = 'e2e@byeolbyeolpet.test';
