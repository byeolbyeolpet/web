// [임시] #28 세션 저장소 실기 검증 — 쿠키/localStorage/Preferences 영속성 프로브. 검증 후 삭제한다.
"use client";

import { useCallback, useEffect, useState } from "react";
import { Preferences } from "@capacitor/preferences";
import { Button } from "@/shared/ui/button";

const KEY = {
  cookie: "probe_cookie",
  local: "probe_ls",
  pref: "probe_pref",
} as const;

type Slot = { value: string | null; justWritten: boolean };
type Report = Record<keyof typeof KEY, Slot> & {
  origin: string;
  now: string;
  ua: string;
};

function readCookie(name: string): string | null {
  const hit = document.cookie.split("; ").find((c) => c.startsWith(`${name}=`));
  return hit ? decodeURIComponent(hit.split("=")[1]) : null;
}

// 각 저장소를 읽고, 마커가 없으면 "지금 시각"을 심는다.
// 값 자체가 기록 시각이라, 나중에 읽었을 때 언제 심은 마커가 살아남았는지 바로 보인다.
async function probe(reset: boolean): Promise<Report> {
  const now = new Date().toISOString().replace("T", " ").slice(0, 19);

  if (reset) {
    document.cookie = `${KEY.cookie}=; max-age=0; path=/`;
    localStorage.removeItem(KEY.local);
    await Preferences.remove({ key: KEY.pref });
  }

  const slots = {} as Record<keyof typeof KEY, Slot>;

  const cookieVal = readCookie(KEY.cookie);
  if (cookieVal === null) {
    document.cookie = `${KEY.cookie}=${encodeURIComponent(now)}; max-age=31536000; path=/`;
  }
  slots.cookie = { value: cookieVal ?? now, justWritten: cookieVal === null };

  const localVal = localStorage.getItem(KEY.local);
  if (localVal === null) localStorage.setItem(KEY.local, now);
  slots.local = { value: localVal ?? now, justWritten: localVal === null };

  const { value: prefVal } = await Preferences.get({ key: KEY.pref });
  if (prefVal === null) await Preferences.set({ key: KEY.pref, value: now });
  slots.pref = { value: prefVal ?? now, justWritten: prefVal === null };

  return {
    ...slots,
    origin: location.origin,
    now,
    ua: navigator.userAgent.slice(0, 80),
  };
}

function Row({ label, slot }: { label: string; slot: Slot }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border p-3">
      <span className="text-sm font-bold">{label}</span>
      {slot.justWritten ? (
        <span className="text-sm text-warning">
          마커 없음 → 방금 기록: {slot.value}
        </span>
      ) : (
        <span className="text-sm text-success">생존: {slot.value} 에 기록</span>
      )}
    </div>
  );
}

export default function StorageProbePage() {
  const [report, setReport] = useState<Report | null>(null);

  const run = useCallback((reset: boolean) => {
    // 원본 에러를 화면에 그대로 두는 것은 진단 페이지라 허용한다(임시 코드).
    probe(reset).then(setReport).catch(console.error);
  }, []);

  useEffect(() => run(false), [run]);

  if (!report) return <p className="p-4 text-sm">측정 중…</p>;

  return (
    <main className="flex flex-col gap-3 p-4">
      <h1 className="font-heading text-lg font-bold">
        저장소 영속성 프로브 (#28)
      </h1>
      <p className="text-xs text-muted-foreground">
        origin: {report.origin}
        <br />
        지금: {report.now}
        <br />
        UA: {report.ua}
      </p>
      <Row label="쿠키 (document.cookie)" slot={report.cookie} />
      <Row label="localStorage" slot={report.local} />
      <Row label="Preferences (네이티브)" slot={report.pref} />
      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={() => run(false)}>
          다시 읽기
        </Button>
        <Button variant="destructive" onClick={() => run(true)}>
          마커 초기화
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        &quot;생존&quot;이 뜨면 그 저장소는 해당 시나리오에서 살아남은 것.
        초기화 후 앱 종료 → 재시작 → 재배포 → 재부팅 순으로 확인한다.
      </p>
    </main>
  );
}
