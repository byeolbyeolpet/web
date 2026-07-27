// 종 캐릭터 아이콘 — 정면 얼굴 클로즈업, 종당 2~3색.
//
// 실사가 아니라 캐릭터형(이모지 계열)이다. 14개가 한 그리드에 모이므로 색을
// 종당 2~3개로 묶는다 — 색이 많으면 모였을 때 산만해진다.
// 라이트·다크 양쪽에서 버티도록 중간 명도를 쓴다(순백·순흑 회피).
//
// 눈은 얼굴 대비 크게, 흰 하이라이트를 함께 찍는다. 36px 로 줄었을 때
// 표정을 만드는 건 디테일이 아니라 눈 크기다.
//
// ⚠️ 아직 시안 3종(dog·ferret·turtle)만 있다. 나머지 11종은 스타일 확정 후.

import type { ComponentProps, ComponentType } from "react";

type IconProps = ComponentProps<"svg">;

/** 검은 눈동자 + 오른쪽 위 하이라이트. 모든 종이 같은 눈을 쓴다. */
function Eye({ cx, cy, r = 2.4 }: { cx: number; cy: number; r?: number }) {
  return (
    <>
      <circle cx={cx} cy={cy} r={r} fill="#2B2118" />
      <circle cx={cx + r * 0.35} cy={cy - r * 0.35} r={r * 0.32} fill="#FFF" />
    </>
  );
}

function DogIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" {...props}>
      {/* 귀를 얼굴 밖으로 빼야 실루엣만으로 개로 읽힌다 */}
      <ellipse
        cx="6"
        cy="16"
        rx="4.6"
        ry="8"
        fill="#7A4E2E"
        transform="rotate(-10 6 16)"
      />
      <ellipse
        cx="26"
        cy="16"
        rx="4.6"
        ry="8"
        fill="#7A4E2E"
        transform="rotate(10 26 16)"
      />
      <circle cx="16" cy="16" r="10" fill="#CD9F6E" />
      <ellipse cx="16" cy="20.4" rx="6.2" ry="4.8" fill="#F0DBBE" />
      <Eye cx={11.8} cy={14} />
      <Eye cx={20.2} cy={14} />
      <ellipse cx="16" cy="18.6" rx="2.4" ry="1.8" fill="#3B2A1F" />
      <path
        d="M16 20.4v2"
        stroke="#3B2A1F"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FerretIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" {...props}>
      <circle cx="8.4" cy="10" r="3.8" fill="#C9AE8E" />
      <circle cx="23.6" cy="10" r="3.8" fill="#C9AE8E" />
      <path
        d="M16 5.6c6.1 0 9.8 4.2 9.8 9.4 0 6.2-4.7 11.3-9.8 11.3S6.2 21.2 6.2 15C6.2 9.8 9.9 5.6 16 5.6z"
        fill="#F2E6D2"
      />
      {/* 페럿의 단서는 눈가 밴드다. 눈을 덮으면 복면이 되므로 눈 아래로 낮게 깐다. */}
      <path
        d="M9.4 15.6c1.9-1.4 4-2.1 6.6-2.1s4.7.7 6.6 2.1c-1.2 2.4-3.7 3.6-6.6 3.6s-5.4-1.2-6.6-3.6z"
        fill="#9C7C5C"
      />
      <Eye cx={12} cy={14.4} r={2.5} />
      <Eye cx={20} cy={14.4} r={2.5} />
      <ellipse cx="16" cy="21.4" rx="2" ry="1.6" fill="#E09A9A" />
    </svg>
  );
}

function TurtleIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" {...props}>
      <ellipse cx="6" cy="23" rx="3.6" ry="2.9" fill="#9ED47A" />
      <ellipse cx="26" cy="23" rx="3.6" ry="2.9" fill="#9ED47A" />
      {/* 머리를 껍질보다 두 단계 밝게 — 같은 초록이면 덩어리로 읽힌다 */}
      <ellipse cx="16" cy="8.6" rx="6" ry="5.2" fill="#9ED47A" />
      <Eye cx={13.4} cy={8} r={2.1} />
      <Eye cx={18.6} cy={8} r={2.1} />
      <ellipse cx="16" cy="19.8" rx="10.6" ry="8.2" fill="#3E7A2E" />
      <path d="M16 13.6l4.8 3.7-1.8 5.7h-6l-1.8-5.7z" fill="#78BE5A" />
      <circle cx="8.2" cy="19.8" r="2.3" fill="#78BE5A" />
      <circle cx="23.8" cy="19.8" r="2.3" fill="#78BE5A" />
      <circle cx="16" cy="25.4" r="2.3" fill="#78BE5A" />
    </svg>
  );
}

const SPECIES_ICON: Record<string, ComponentType<IconProps> | undefined> = {
  dog: DogIcon,
  ferret: FerretIcon,
  turtle: TurtleIcon,
};

export function SpeciesIcon({ code, ...props }: IconProps & { code: string }) {
  const Icon = SPECIES_ICON[code];
  return Icon ? <Icon aria-hidden {...props} /> : null;
}
