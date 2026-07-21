/**
 * 임시 랜딩 — 스캐폴드 검증용.
 * 컬러 토큰(테라코타·딥틸·크림)과 폰트가 제대로 물리는지 눈으로 확인한다.
 * 실제 홈 대시보드는 views/home 으로 대체된다.
 */
export default function Page() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-5 py-12">
      <header className="flex flex-col gap-2">
        <p className="font-heading text-sm font-semibold tracking-wide text-anchor">
          BYEOLBYEOLPET
        </p>
        <h1 className="font-heading text-4xl font-extrabold text-foreground">
          별별펫
        </h1>
        <p className="text-base text-muted-foreground">
          별의별 반려동물이 다 여기에.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <button
          type="button"
          className="min-h-11 rounded-lg bg-primary px-5 text-base font-semibold text-primary-foreground"
        >
          Primary · 테라코타
        </button>
        <button
          type="button"
          className="min-h-11 rounded-lg bg-anchor px-5 text-base font-semibold text-anchor-foreground"
        >
          Anchor · 딥틸
        </button>
        <button
          type="button"
          className="min-h-11 rounded-lg bg-secondary px-5 text-base font-semibold text-secondary-foreground"
        >
          Secondary · 웜 샌드
        </button>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-heading text-lg font-bold text-card-foreground">
          카드 표면
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          크림 배경 위의 흰 카드. 종일 봐도 눈이 편한 대비를 목표로 한다.
        </p>
      </section>
    </main>
  );
}
