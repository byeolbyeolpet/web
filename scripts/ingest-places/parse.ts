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
  const isUtf8Bom = buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf;
  const text = isUtf8Bom ? buffer.subarray(3).toString("utf-8") : decode(buffer, "cp949");
  return parse(text, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
  }) as Record<string, string>[];
}
