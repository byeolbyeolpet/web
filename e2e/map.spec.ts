// 지도 화면·장소 상세 E2E — SDK 실로드(키·도메인 검증), 칩 토글, 접근성, tel 링크.
//
// 위치 권한은 부여하지 않는다 — 서울시청 폴백 경로가 결정적(deterministic)이라
// 테스트 기준점으로 쓴다. 시딩 실측(서울시청 3km 전체 221·병원 27)이 상한선.
import { expect, test } from "@playwright/test";
import { scanContrast, scanWcag } from "./a11y";

/** 시트 헤더의 "근처 N곳" 이 뜰 때까지 — SDK 로드 + RPC 응답의 합성 신호다. */
async function waitForNearbyCount(page: import("@playwright/test").Page) {
  const title = page.getByText(/근처 \d+곳/);
  await expect(title).toBeVisible({ timeout: 20_000 });
  return title;
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
    // 병원만 남아 개수가 줄어든다(서울시청 3km: 전체 221 → 병원 27 실측).
    await expect(page.getByText(/근처 \d+곳/)).not.toHaveText(before!, {
      timeout: 15_000,
    });

    await hospital.click();
    await expect(hospital).toHaveAttribute("aria-checked", "false");
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
    // 원장에서 전화 있는 영업 중 장소 하나를 anon REST 로 집는다(공개 읽기).
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
    const response = await request.get(
      `${url}/rest/v1/places?select=id,name,phone&status=eq.operating&phone=not.is.null&limit=1`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } },
    );
    const [row] = (await response.json()) as Array<{
      id: string;
      name: string;
      phone: string;
    }>;

    await page.goto(`/place?id=${row.id}`);
    await expect(page.getByRole("heading", { name: row.name })).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByRole("link", { name: new RegExp(row.phone) }),
    ).toHaveAttribute("href", `tel:${row.phone}`);
    expect(await scanWcag(page)).toEqual([]);
  });
});
