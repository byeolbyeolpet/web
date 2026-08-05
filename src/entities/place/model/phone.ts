// 전화번호 표시 포맷 — 원장 값은 하이픈 없는 숫자열이다(34,832행 실측: 하이픈 0건,
// 길이 8~11). DB 값을 그대로 보여주면 0512022429 처럼 읽히지 않으므로 표시용으로만 쓴다.
// tel: 링크에는 숫자열을 그대로 넣는다 — 다이얼러가 구분자를 필요로 하지 않는다.

/** 규칙 밖 입력은 억지로 자르지 않고 숫자열 그대로 돌려준다(틀린 구분자가 더 나쁘다). */
export function formatPhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  // 서울만 지역번호가 2자리다. 국번은 3자리(구번호)와 4자리가 섞여 있다.
  if (digits.startsWith("02")) {
    if (digits.length === 9) return join(digits, 2, 5);
    if (digits.length === 10) return join(digits, 2, 6);
    return digits;
  }

  // 그 외 지역번호·이동전화·인터넷전화는 3자리 (031·051·010·070 …)
  if (digits.startsWith("0")) {
    if (digits.length === 10) return join(digits, 3, 6);
    if (digits.length === 11) return join(digits, 3, 7);
    return digits;
  }

  // 0 으로 시작하지 않는 8자리는 대표번호다 (1588-0000 꼴)
  if (digits.length === 8) return `${digits.slice(0, 4)}-${digits.slice(4)}`;

  return digits;
}

function join(digits: string, first: number, second: number): string {
  return `${digits.slice(0, first)}-${digits.slice(first, second)}-${digits.slice(second)}`;
}
