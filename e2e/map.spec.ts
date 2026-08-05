// 지도 화면·장소 상세 E2E — SDK 실로드(키·도메인 검증), 칩 토글, 접근성, tel 링크.
//
// 위치 권한은 부여하지 않는다 — 서울시청 폴백 경로가 결정적(deterministic)이라
// 테스트 기준점으로 쓴다. 시딩 실측: 서울시청 3km 에 전체 221·병원 27건이 있고,
// RPC 상한(200)에 걸려 전체는 "근처 200곳+" 로 표시된다.
import { expect, test } from "@playwright/test";
import { scanContrast, scanWcag } from "./a11y";

/**
 * 시트 헤더에 "근처 N곳"(N ≥ 1)이 뜰 때까지 — SDK 로드 + RPC 응답의 합성 신호다.
 *
 * 0곳을 허용하면 안 된다. 검색이 아예 시작되지 않은 상태의 제목도 "근처 0곳" 이라
 * `/근처 \d+곳/` 만으로는 멈춘 화면이 통과한다(실측으로 걸렸다).
 */
async function waitForNearbyCount(page: import("@playwright/test").Page) {
  const title = page.locator(
    'section[aria-label="주변 장소 목록"] [aria-live="polite"]',
  );
  await expect(title).toHaveText(/근처 [1-9]\d*곳/, { timeout: 20_000 });
  return title;
}

/** 원장에서 전화 있는 영업 중 장소 한 건 — order 고정으로 실행마다 같은 행을 쓴다. */
async function pickSeededPlace(
  request: import("@playwright/test").APIRequestContext,
) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  const response = await request.get(
    `${url}/rest/v1/places?select=id,name,phone&status=eq.operating&phone=not.is.null&order=id.asc&limit=1`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } },
  );
  // 시딩 누락·요청 실패를 앱 버그와 구분한다 — 그냥 두면 호출부에서
  // "Cannot read properties of undefined" 로 죽어 원인을 못 짚는다.
  expect(response.ok(), `원장 조회 실패: ${response.status()}`).toBe(true);
  const rows = (await response.json()) as Array<{
    id: string;
    name: string;
    phone: string;
  }>;
  expect(rows, "전화 있는 영업 중 장소가 원장에 없다").not.toHaveLength(0);
  return rows[0];
}

test.describe("지도 화면", () => {
  test("게스트도 지도·칩·바텀시트를 본다 — SDK 실로드 검증", async ({
    page,
  }) => {
    await page.goto("/map");
    await expect(
      page.getByRole("radiogroup", { name: "장소 종류 필터" }),
    ).toBeVisible();
    // 카카오 SDK 가 로드되면 지도 타일 img 가 생긴다 — JS 키·도메인 등록의 실검증.
    await expect
      .poll(() => page.locator("img[src*='daumcdn']").count(), {
        timeout: 20_000,
      })
      .toBeGreaterThan(0);
    await waitForNearbyCount(page);
    // 물방울 핀(SVG data URI 마커)도 그려졌다.
    await expect
      .poll(() => page.locator("img[src^='data:image/svg']").count())
      .toBeGreaterThan(0);
  });

  test("칩 단일 선택 토글 — 필터가 RPC 로 간다", async ({ page }) => {
    await page.goto("/map");
    await waitForNearbyCount(page);
    const before = await page.getByText(/근처 \d+곳/).textContent();

    const hospital = page.getByRole("radio", { name: "병원" });
    await hospital.click();
    await expect(hospital).toHaveAttribute("aria-checked", "true");
    // 병원만 남아 개수가 줄어든다(서울시청 3km: 전체 200+ → 병원 27 실측).
    await expect(page.getByText(/근처 \d+곳/)).not.toHaveText(before!, {
      timeout: 15_000,
    });

    await hospital.click();
    await expect(hospital).toHaveAttribute("aria-checked", "false");
  });

  // 지도는 SDK·RPC·측위가 얽혀 "화면은 나오는데 뭔가 실패한" 상태가 생기기 쉽다.
  // networkidle 은 타일이 계속 붙는 지도에서 불안정해 쓰지 않고, 위 테스트들이
  // 검증한 대기 신호(타일 + 근처 N곳)를 그대로 재사용한다.
  test("콘솔 에러가 없다 — 위치 거부 폴백 경로 포함", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));

    await page.goto("/map");
    await waitForNearbyCount(page);
    await expect
      .poll(() => page.locator("img[src*='daumcdn']").count(), {
        timeout: 20_000,
      })
      .toBeGreaterThan(0);

    expect(errors).toEqual([]);
  });

  // 유닛 테스트로는 못 잡는다 — jsdom 에 Pointer Capture API 가 없어 setup 의 빈
  // 구현으로 대체되고, 실제 브라우저에서만 캡처가 click 을 삼킨다. 실측으로 걸렸다.
  test("시트 핸들을 탭하면 펼쳐지고 다시 탭하면 접힌다", async ({ page }) => {
    await page.goto("/map");
    await waitForNearbyCount(page);

    const sheet = page.locator('section[aria-label="주변 장소 목록"]');
    const height = async () => (await sheet.boundingBox())!.height;
    const collapsed = await height();

    await page.getByRole("button", { name: "목록 펼치기" }).click();
    await expect
      .poll(height, { timeout: 5_000 })
      .toBeGreaterThan(collapsed * 1.5);

    await page.getByRole("button", { name: "목록 접기" }).click();
    await expect.poll(height, { timeout: 5_000 }).toBeCloseTo(collapsed, 0);
  });

  // 목록은 가상 스크롤이라 결과 200건이 그대로 DOM 에 쌓이면 안 된다.
  test("목록이 가상 스크롤로 그려진다 — DOM 행이 결과 수보다 훨씬 적다", async ({
    page,
  }) => {
    await page.goto("/map");
    const title = await waitForNearbyCount(page);
    // 서울시청 3km 는 상한(200)에 걸려 "근처 200곳+" 이 된다.
    await expect(title).toHaveText(/근처 200곳\+/);

    await page.getByRole("button", { name: "목록 펼치기" }).click();
    const rows = page.locator('section[aria-label="주변 장소 목록"] li');
    await expect
      .poll(() => rows.count(), { timeout: 5_000 })
      .toBeGreaterThan(0);
    expect(await rows.count()).toBeLessThan(40);

    // 주소 길이와 무관하게 행 높이가 하나여야 터치 영역이 일정하다.
    const heights = await rows
      .locator("a")
      .evaluateAll((els) => [
        ...new Set(
          els.map((el) => Math.round(el.getBoundingClientRect().height)),
        ),
      ]);
    expect(heights).toEqual([64]);
  });

  // 상세 → "지도에서 보기" 가 /map?place=<id> 로 들어온다. 이 경로의 회귀 2건.
  test("포커스 진입은 현위치가 도착해도 그 장소를 지킨다", async ({
    page,
    request,
  }) => {
    const row = await pickSeededPlace(request);
    await page.goto(`/map?place=${row.id}`);

    // 포커스 장소가 검색 기준이라 그 장소가 목록에 있고, 시트 제목이 그 이름이다.
    // 시트 안으로 범위를 좁힌다 — 목록 행에도 같은 이름이 있고, sonner Toaster 도
    // aria-live="polite" 라 전역 셀렉터는 strict mode 위반이 된다(실측).
    const title = page.locator(
      'section[aria-label="주변 장소 목록"] [aria-live="polite"]',
    );
    await expect(title).toHaveText(row.name, { timeout: 20_000 });

    // 측위(여기선 거부→폴백)가 끝난 뒤에도 서울로 끌려가면 안 된다. 끌려가면
    // 그 장소가 목록에서 빠져 제목이 "근처 N곳" 으로 바뀐다.
    await page.waitForTimeout(3_000);
    await expect(title).toHaveText(row.name);
    // 그 장소를 보여주면서 "서울 시청 기준" 이라고 하면 거짓말이다.
    await expect(page.getByText("서울 시청 기준")).toBeHidden();
  });

  test("없는 id 로 포커스해도 지도가 열린다 — 영구 스켈레톤 금지", async ({
    page,
  }) => {
    await page.goto("/map?place=00000000-0000-0000-0000-000000000000");
    // 조회가 null 로 끝나면 현위치로 내려와야 한다. 안 그러면 start 가 영영
    // null 이라 지도는 스켈레톤, 검색은 enabled:false 로 멈춘다.
    //
    // 0곳이 아니라 "1곳 이상" 을 본다 — 검색이 멈춘 상태에서도 제목은 "근처 0곳"
    // 이라 /근처 \d+곳/ 만으로는 깨진 화면도 통과한다(역검증에서 실제로 통과했다).
    await expect(
      page.locator('section[aria-label="주변 장소 목록"] [aria-live="polite"]'),
    ).toHaveText(/근처 [1-9]\d*곳/, { timeout: 20_000 });
  });

  test("접근성 — 지도 화면 WCAG (라이트)", async ({ page }) => {
    await page.goto("/map");
    await waitForNearbyCount(page);
    expect(await scanWcag(page)).toEqual([]);
  });

  test("접근성 — 지도 화면 대비 (다크)", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/map");
    await waitForNearbyCount(page);
    expect(await scanContrast(page)).toEqual([]);
  });
});

test.describe("장소 상세", () => {
  test("잘못된 id 는 notFound 문구 — 존재 여부를 유출하지 않는다", async ({
    page,
  }) => {
    await page.goto("/place?id=00000000-0000-0000-0000-000000000000");
    await expect(page.getByText("장소를 찾을 수 없어요")).toBeVisible({
      timeout: 15_000,
    });
  });

  test("실데이터 상세 — 정보·tel 링크·접근성", async ({ page, request }) => {
    const row = await pickSeededPlace(request);

    await page.goto(`/place?id=${row.id}`);
    await expect(page.getByRole("heading", { name: row.name })).toBeVisible({
      timeout: 15_000,
    });
    // 화면에는 사람이 읽는 형태로, href 에는 원본 숫자열로 나가야 한다.
    const telLink = page.locator(`a[href="tel:${row.phone}"]`);
    await expect(telLink).toBeVisible();
    await expect(telLink).toHaveText(/^\d{2,4}-\d{3,4}-\d{4}$/);
    expect(await scanWcag(page)).toEqual([]);
  });
});
