// 종 캐릭터 아이콘 14종 — 정면 얼굴 클로즈업, 종당 2~3색.
//
// 실사가 아니라 캐릭터형(이모지 계열)이다. 규칙:
//  - viewBox 32x32 통일, 정면 얼굴이 화면을 꽉 채운다
//  - 종당 2~3색. 14개가 한 그리드에 모이므로 색이 많으면 산만해진다
//  - 라이트·다크 양쪽에서 버티도록 중간 명도(순백·순흑 회피)
//  - 눈은 얼굴 대비 크게 + 흰 하이라이트. 36px 로 줄었을 때 표정을 만드는 건
//    디테일이 아니라 눈 크기다. 공용 Eye 로 14종이 같은 눈을 쓴다
//
// 36px 에서 서로 안 뭉개지게 하는 것이 이 파일의 전부다. 특히 둥근 얼굴이
// 겹치는 설치류 계열(햄스터·기니피그·친칠라·토끼·슈가글라이더)은 **귀 형태**로
// 가르고, 초록이 겹치는 거북·도마뱀·뱀·양서류는 **색**으로 가른다.

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

function CatIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" {...props}>
      {/* 뾰족한 삼각 귀 — 개(늘어진 귀)와 가르는 단서 */}
      <path d="M6.5 5l2 9.5L14 8.5z" fill="#D9913F" />
      <path d="M25.5 5l-2 9.5L18 8.5z" fill="#D9913F" />
      <circle cx="16" cy="17" r="9.6" fill="#E8A855" />
      <ellipse cx="16" cy="20.8" rx="5.6" ry="4" fill="#F6E2C4" />
      <Eye cx={12.2} cy={15.4} />
      <Eye cx={19.8} cy={15.4} />
      <path d="M16 18.8l-1.5 1.4h3z" fill="#8A5A32" />
      <path
        d="M5.5 18.5h4M5.5 21.5h4M26.5 18.5h-4M26.5 21.5h-4"
        stroke="#8A5A32"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

function RabbitIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" {...props}>
      {/* 위로 길게 선 귀 */}
      <ellipse
        cx="11"
        cy="7.5"
        rx="2.8"
        ry="7"
        fill="#E2D6C6"
        transform="rotate(-8 11 7.5)"
      />
      <ellipse
        cx="21"
        cy="7.5"
        rx="2.8"
        ry="7"
        fill="#E2D6C6"
        transform="rotate(8 21 7.5)"
      />
      <ellipse
        cx="11"
        cy="8"
        rx="1.3"
        ry="4.6"
        fill="#E8A8A8"
        transform="rotate(-8 11 8)"
      />
      <ellipse
        cx="21"
        cy="8"
        rx="1.3"
        ry="4.6"
        fill="#E8A8A8"
        transform="rotate(8 21 8)"
      />
      <circle cx="16" cy="19.5" r="8.8" fill="#F0E7DA" />
      <Eye cx={12.6} cy={18} />
      <Eye cx={19.4} cy={18} />
      <ellipse cx="16" cy="21.4" rx="1.7" ry="1.3" fill="#E08A8A" />
      <rect x="14.7" y="22.8" width="1.1" height="2.6" rx="0.5" fill="#FFF" />
      <rect x="16.2" y="22.8" width="1.1" height="2.6" rx="0.5" fill="#FFF" />
    </svg>
  );
}

function HamsterIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" {...props}>
      {/* 작고 동그란 귀 + 볼 홍조 = 햄스터. 친칠라(큰 귀)와 여기서 갈린다 */}
      <circle cx="8.6" cy="10.8" r="3.4" fill="#C99050" />
      <circle cx="23.4" cy="10.8" r="3.4" fill="#C99050" />
      <circle cx="16" cy="17.2" r="10" fill="#E8B978" />
      <ellipse cx="16" cy="20.8" rx="6.6" ry="4.6" fill="#F7E7CC" />
      <circle cx="7.8" cy="19.6" r="2.4" fill="#E89898" opacity="0.55" />
      <circle cx="24.2" cy="19.6" r="2.4" fill="#E89898" opacity="0.55" />
      <Eye cx={11.8} cy={15.2} />
      <Eye cx={20.2} cy={15.2} />
      <ellipse cx="16" cy="19.2" rx="1.9" ry="1.4" fill="#B4744A" />
    </svg>
  );
}

function GuineaPigIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" {...props}>
      {/* 옆으로 늘어진 작은 귀 + 세로로 긴 얼굴 = 기니피그.
          실제로는 두 색 무늬가 흔하지만 아이콘에선 "색이 안 맞춰진 것"으로
          보인다. 단색으로 두고 구분은 귀 모양과 얼굴 비율에 맡긴다. */}
      <ellipse
        cx="6.8"
        cy="12.5"
        rx="3.4"
        ry="2.6"
        fill="#8E5C3E"
        transform="rotate(-22 6.8 12.5)"
      />
      <ellipse
        cx="25.2"
        cy="12.5"
        rx="3.4"
        ry="2.6"
        fill="#8E5C3E"
        transform="rotate(22 25.2 12.5)"
      />
      <ellipse cx="16" cy="17.6" rx="9.4" ry="10" fill="#A8704C" />
      <ellipse cx="16" cy="21.4" rx="5.8" ry="4.2" fill="#E4CBB0" />
      <Eye cx={11.9} cy={15} />
      <Eye cx={20.1} cy={15} />
      <ellipse cx="16" cy="19.8" rx="1.9" ry="1.5" fill="#7A4E32" />
    </svg>
  );
}

function ChinchillaIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" {...props}>
      {/* 얼굴만큼 큰 둥근 귀 + 회보라 = 친칠라. 햄스터와 가르는 단서 */}
      <ellipse cx="6.4" cy="11" rx="4.8" ry="5.6" fill="#8F8A9C" />
      <ellipse cx="25.6" cy="11" rx="4.8" ry="5.6" fill="#8F8A9C" />
      <ellipse cx="6.4" cy="11.5" rx="2.6" ry="3.4" fill="#C4A8B0" />
      <ellipse cx="25.6" cy="11.5" rx="2.6" ry="3.4" fill="#C4A8B0" />
      <circle cx="16" cy="18" r="9.2" fill="#A9A3B5" />
      <ellipse cx="16" cy="21.6" rx="5.6" ry="3.8" fill="#E4DEE8" />
      <Eye cx={12.3} cy={16.4} r={2.6} />
      <Eye cx={19.7} cy={16.4} r={2.6} />
      <ellipse cx="16" cy="20" rx="1.7" ry="1.3" fill="#6E6478" />
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

function HedgehogIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" {...props}>
      {/* 가시가 실루엣 밖으로 삐져나와야 고슴도치로 읽힌다.
          안쪽 톱니로만 표현하면 배경에 묻혀 버섯머리가 된다. */}
      <path
        d="M16 3.2l3.2 7.2h-6.4zM7.4 6.4l3.6 6.8-6.8 1.6zM24.6 6.4l-3.6 6.8 6.8 1.6zM2.6 15.4l6.4 3.4-4.8 4.6zM29.4 15.4l-6.4 3.4 4.8 4.6z"
        fill="#6B5240"
      />
      <path
        d="M16 7.4c6.6 0 11.4 5 11.4 11.4H4.6C4.6 12.4 9.4 7.4 16 7.4z"
        fill="#8A6E58"
      />
      <ellipse cx="16" cy="20.4" rx="7.6" ry="6.4" fill="#F0DCC0" />
      <Eye cx={12.9} cy={19.4} r={2.1} />
      <Eye cx={19.1} cy={19.4} r={2.1} />
      <ellipse cx="16" cy="23.4" rx="1.9" ry="1.5" fill="#4A3A2E" />
    </svg>
  );
}

function SugarGliderIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" {...props}>
      {/* 이마의 검은 세로줄 + 얼굴 대비 과장된 눈 = 슈가글라이더 */}
      <ellipse cx="7.4" cy="9.4" rx="3.8" ry="4.8" fill="#9BA0AE" />
      <ellipse cx="24.6" cy="9.4" rx="3.8" ry="4.8" fill="#9BA0AE" />
      <circle cx="16" cy="17.6" r="9.8" fill="#C3C8D4" />
      <path
        d="M16 8.2v6.2"
        stroke="#4A4E5A"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <Eye cx={11.7} cy={17.2} r={3.1} />
      <Eye cx={20.3} cy={17.2} r={3.1} />
      <ellipse cx="16" cy="22.8" rx="1.7" ry="1.3" fill="#5A5E68" />
    </svg>
  );
}

function BirdIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" {...props}>
      {/* 볏 + 부리. 유일하게 부리를 가진 종이라 실루엣만으로 갈린다 */}
      <path
        d="M16 7.4c-2-3.4.4-5.8 2.4-5-1 2.2-.2 3.8 1.2 4.6z"
        fill="#F0B03C"
      />
      <circle cx="16" cy="17.4" r="9.8" fill="#5BB0C4" />
      <Eye cx={12.3} cy={15.4} />
      <Eye cx={19.7} cy={15.4} />
      <path d="M16 18.4l-3.2 2.2 3.2 3.4 3.2-3.4z" fill="#F0B03C" />
    </svg>
  );
}

function TurtleIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" {...props}>
      {/* 다리까지 그리면 혼자만 전신이라 나머지 13종(얼굴 클로즈업)과 톤이
          어긋난다. 껍질을 뒤로 돌리고 머리를 앞으로 크게 빼 얼굴이 주인공이 되게 한다.
          머리는 껍질보다 두 단계 밝게 — 같은 초록이면 덩어리로 읽힌다. */}
      <ellipse cx="16" cy="21.4" rx="11" ry="8.4" fill="#3E7A2E" />
      <path d="M16 15.4l5 3.8-1.9 5.9h-6.2l-1.9-5.9z" fill="#78BE5A" />
      <circle cx="7.6" cy="21.6" r="2.4" fill="#78BE5A" />
      <circle cx="24.4" cy="21.6" r="2.4" fill="#78BE5A" />
      <circle cx="16" cy="11.4" r="7.2" fill="#9ED47A" />
      <Eye cx={12.9} cy={10.4} r={2.4} />
      <Eye cx={19.1} cy={10.4} r={2.4} />
      <path
        d="M13.3 14.8c1.1 1.1 1.9 1.6 2.7 1.6s1.6-.5 2.7-1.6"
        stroke="#4E7A2E"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LizardIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" {...props}>
      {/* 크레스티드 게코. 초록을 쓰면 거북·양서류와 겹쳐 주황 계열로 뺀다.
          눈두덩을 밝게 얹어 툭 튀어나온 게코 눈을 만든다 — 원에 눈만 찍으면
          아무 동물도 아니게 된다. */}
      <path
        d="M16 6c6.2 0 10.8 4.2 10.8 9.4 0 6-4.8 10.8-10.8 10.8S5.2 21.4 5.2 15.4C5.2 10.2 9.8 6 16 6z"
        fill="#D08850"
      />
      <circle cx="10.4" cy="14.4" r="4.3" fill="#F7CE9E" />
      <circle cx="21.6" cy="14.4" r="4.3" fill="#F7CE9E" />
      <Eye cx={10.4} cy={14.4} r={2.7} />
      <Eye cx={21.6} cy={14.4} r={2.7} />
      {/* 눈 위 돌기 — 크레스티드 게코의 '속눈썹'. 이게 있어야 도마뱀으로 읽힌다 */}
      <path
        d="M5.6 11.4c1.4-2 3.2-3.2 5.2-3.6M26.4 11.4c-1.4-2-3.2-3.2-5.2-3.6"
        stroke="#A85F2C"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <path
        d="M9.6 20.4c2.4 2.8 4.4 3.8 6.4 3.8s4-1 6.4-3.8"
        stroke="#9A5C2E"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SnakeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" {...props}>
      {/* 똬리 위에 머리를 얹으면 세로로 길어져 형체가 안 잡힌다.
          다른 종처럼 정면 얼굴로 두고, 갈라진 혀로 뱀을 확정한다. */}
      <path
        d="M16 5.8c6.2 0 10.6 3.6 10.6 8.8 0 6.4-4.8 11.6-10.6 11.6S5.4 21 5.4 14.6C5.4 9.4 9.8 5.8 16 5.8z"
        fill="#4EA88C"
      />
      <path d="M16 9l3.6 3.4-3.6 3.2-3.6-3.2z" fill="#3A8A70" />
      <Eye cx={11.3} cy={14.6} r={2.6} />
      <Eye cx={20.7} cy={14.6} r={2.6} />
      <path
        d="M16 20.8v3.6m0 0l-1.8 1.8M16 24.4l1.8 1.8"
        stroke="#E06A6A"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AmphibianIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" {...props}>
      {/* 머리 위로 솟은 눈 = 개구리. 거북과 가르는 단서 */}
      <ellipse cx="16" cy="19.6" rx="10.2" ry="7.8" fill="#7CC24E" />
      <circle cx="10.4" cy="10.6" r="5" fill="#8FD05E" />
      <circle cx="21.6" cy="10.6" r="5" fill="#8FD05E" />
      <Eye cx={10.4} cy={10.6} r={2.8} />
      <Eye cx={21.6} cy={10.6} r={2.8} />
      <path
        d="M8.2 19.8c2.6 3.4 5.2 5 7.8 5s5.2-1.6 7.8-5"
        stroke="#4E8A2E"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

const SPECIES_ICON: Record<string, ComponentType<IconProps> | undefined> = {
  dog: DogIcon,
  cat: CatIcon,
  rabbit: RabbitIcon,
  hamster: HamsterIcon,
  guinea_pig: GuineaPigIcon,
  chinchilla: ChinchillaIcon,
  ferret: FerretIcon,
  hedgehog: HedgehogIcon,
  sugar_glider: SugarGliderIcon,
  bird: BirdIcon,
  turtle: TurtleIcon,
  lizard: LizardIcon,
  snake: SnakeIcon,
  amphibian: AmphibianIcon,
};

export function SpeciesIcon({ code, ...props }: IconProps & { code: string }) {
  const Icon = SPECIES_ICON[code];
  return Icon ? <Icon aria-hidden {...props} /> : null;
}
