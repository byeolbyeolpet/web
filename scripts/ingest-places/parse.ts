// cp949 CSV 파일 → 헤더 키 객체 배열. 전체 버퍼 기준으로 디코드한다 —
// 앞부분만 잘라 읽으면 멀티바이트 문자가 끊겨 판별이 오탐한다(스펙 §2 실측).
import { readFileSync } from "node:fs";
import { parse } from "csv-parse/sync";
import { decode } from "iconv-lite";

export function parseCsvFile(path: string): Record<string, string>[] {
  return parseCsvBuffer(readFileSync(path));
}

export function parseCsvBuffer(buffer: Buffer): Record<string, string>[] {
  // UTF-8 BOM 이면 utf-8, 아니면 cp949(5개 파일 전부 실측 cp949) — 갱신본 대비 안전망.
  const isUtf8Bom =
    buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf;
  const text = isUtf8Bom
    ? buffer.subarray(3).toString("utf-8")
    : decode(buffer, "cp949");
  // relax_column_count 를 켜지 않는다 — 행 폭 불일치의 조용한 관용(짧은 행 키 생략,
  // 긴 행 초과 값 폐기)은 소리 없는 데이터 유실이다. 구조 이상은 전부 파일 단위
  // 중단(스펙 §7). 실측상 5개 파일 34,832행 전부 폭이 일정해 관용이 필요 없다.
  return parse(text, {
    columns: true,
    skip_empty_lines: true,
  }) as Record<string, string>[];
}
