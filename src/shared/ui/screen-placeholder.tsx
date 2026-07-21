// 화면 뼈대용 임시 플레이스홀더 — 실제 화면이 붙기 전까지 자리를 표시한다.
export function ScreenPlaceholder({ title }: { title: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
      <h1 className="font-heading text-2xl font-bold text-foreground">
        {title}
      </h1>
      <p className="text-sm text-muted-foreground">준비 중</p>
    </div>
  );
}
