-- species 시드: 강아지·고양이 + 특수동물 12종.
-- 입도 기준은 "이 종을 진료할 수 있는 병원이 실제로 갈리는 단위"다.
-- 그보다 세밀한 품종(레오파드게코·시리안햄스터)은 breeds 가 받는다.

-- 표시 순서를 데이터로 갖는다. name_ko 가나다순이면 가장 흔한 특수동물(토끼·햄스터)이
-- 맨 아래로 밀린다. 종은 코드의 차이가 아니라 데이터의 값이므로 순서도 DB 에 둔다.
-- 10 단위로 띄워 중간 삽입 여지를 남긴다.
alter table public.species
  add column sort_order smallint not null default 0;

create index species_sort_order_idx on public.species (sort_order);

insert into public.species (code, "group", name_ko, name_en, sort_order) values
  ('dog',          'dog',    '강아지',       'Dog',          10),
  ('cat',          'cat',    '고양이',       'Cat',          20),
  ('rabbit',       'exotic', '토끼',         'Rabbit',       30),
  ('hamster',      'exotic', '햄스터',       'Hamster',      40),
  ('guinea_pig',   'exotic', '기니피그',     'Guinea Pig',   50),
  ('chinchilla',   'exotic', '친칠라',       'Chinchilla',   60),
  ('ferret',       'exotic', '페럿',         'Ferret',       70),
  ('hedgehog',     'exotic', '고슴도치',     'Hedgehog',     80),
  ('sugar_glider', 'exotic', '슈가글라이더', 'Sugar Glider', 90),
  ('bird',         'exotic', '조류',         'Bird',        100),
  ('turtle',       'exotic', '거북',         'Turtle',      110),
  ('lizard',       'exotic', '도마뱀',       'Lizard',      120),
  ('snake',        'exotic', '뱀',           'Snake',       130),
  ('amphibian',    'exotic', '양서류',       'Amphibian',   140)
on conflict (code) do nothing;
