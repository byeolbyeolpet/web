-- RLS 2단 모델: 공개 콘텐츠는 게스트(anon)도 읽기, 개인정보·UGC 쓰기는 본인(authenticated)만.
-- 권한 판단은 DB(RLS)가 한다. auth.uid() 는 (select ...) 로 감싸 플래너가 캐시하게 한다(성능).

-- ── 참조 데이터: 읽기 공개, 쓰기 정책 없음(=service_role/마이그레이션만) ──
alter table public.species enable row level security;
create policy "species_public_read" on public.species
  for select to anon, authenticated using (true);

alter table public.breeds enable row level security;
create policy "breeds_public_read" on public.breeds
  for select to anon, authenticated using (true);

alter table public.places enable row level security;
create policy "places_public_read" on public.places
  for select to anon, authenticated using (true);

alter table public.place_species enable row level security;
create policy "place_species_public_read" on public.place_species
  for select to anon, authenticated using (true);

alter table public.ingredients enable row level security;
create policy "ingredients_public_read" on public.ingredients
  for select to anon, authenticated using (true);

alter table public.products enable row level security;
create policy "products_public_read" on public.products
  for select to anon, authenticated using (true);

alter table public.product_ingredients enable row level security;
create policy "product_ingredients_public_read" on public.product_ingredients
  for select to anon, authenticated using (true);

-- dex_articles: 공개(published)된 것만 게스트에게 노출, 초안은 숨김.
alter table public.dex_articles enable row level security;
create policy "dex_articles_public_read" on public.dex_articles
  for select to anon, authenticated using (published);

-- ── 개인정보: 읽기 공개(프로필/펫 노출), 쓰기는 본인만 ──
alter table public.profiles enable row level security;
create policy "profiles_public_read" on public.profiles
  for select to anon, authenticated using (true);
create policy "profiles_insert_self" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles_update_self" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

alter table public.pets enable row level security;
create policy "pets_public_read" on public.pets
  for select to anon, authenticated using (true);
create policy "pets_insert_own" on public.pets
  for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "pets_update_own" on public.pets
  for update to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "pets_delete_own" on public.pets
  for delete to authenticated using ((select auth.uid()) = owner_id);

-- ── UGC: 읽기 공개, 작성자 본인만 쓰기/수정/삭제 ──
alter table public.reviews enable row level security;
create policy "reviews_public_read" on public.reviews
  for select to anon, authenticated using (true);
create policy "reviews_insert_own" on public.reviews
  for insert to authenticated with check ((select auth.uid()) = author_id);
create policy "reviews_update_own" on public.reviews
  for update to authenticated
  using ((select auth.uid()) = author_id) with check ((select auth.uid()) = author_id);
create policy "reviews_delete_own" on public.reviews
  for delete to authenticated using ((select auth.uid()) = author_id);

alter table public.posts enable row level security;
create policy "posts_public_read" on public.posts
  for select to anon, authenticated using (true);
create policy "posts_insert_own" on public.posts
  for insert to authenticated with check ((select auth.uid()) = author_id);
create policy "posts_update_own" on public.posts
  for update to authenticated
  using ((select auth.uid()) = author_id) with check ((select auth.uid()) = author_id);
create policy "posts_delete_own" on public.posts
  for delete to authenticated using ((select auth.uid()) = author_id);

alter table public.comments enable row level security;
create policy "comments_public_read" on public.comments
  for select to anon, authenticated using (true);
create policy "comments_insert_own" on public.comments
  for insert to authenticated with check ((select auth.uid()) = author_id);
create policy "comments_update_own" on public.comments
  for update to authenticated
  using ((select auth.uid()) = author_id) with check ((select auth.uid()) = author_id);
create policy "comments_delete_own" on public.comments
  for delete to authenticated using ((select auth.uid()) = author_id);
