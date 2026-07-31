// 펫 한 줄 — 목록 안의 행. 종은 tint 배지로 올린다(해자 가시성, design-convention).
//
// 테두리·배경을 스스로 갖지 않는다. 카드가 하나씩 떠 있으면 목록이 산만해지고,
// 항목이 늘수록 경계선이 두 배로 겹쳐 보인다. 바깥이 그룹 카드로 묶고
// divide-y 로 나눈다(모바일 앱 설정·목록의 일반형).
//
// 종 아이콘을 직접 import 하지 않고 주입받는다. entities 는 같은 레이어(species)를
// 참조할 수 없다(entities/README). 조립하는 쪽(views)이 두 슬라이스를 다 알고 있다.
//
// <li> 를 렌더하지 않는다 — 이건 "행"이지 "목록 항목"이 아니다. 목록 시맨틱은
// 호출부가 갖는다(그래야 motion.li 로 감싸 순차 등장을 줄 수 있다).

import type { ReactNode } from "react";
import Link from "next/link";
import { LuChevronRight } from "react-icons/lu";
import { Badge } from "@/shared/ui/badge";
import type { PetListItem } from "../api/use-query-pets";
import { PET_SEX_LABEL } from "../model/sex";

export function PetCard({
  pet,
  speciesIcon,
  href,
}: {
  pet: PetListItem;
  speciesIcon?: ReactNode;
  /**
   * 주면 행 전체가 눌린다. 우측에 아이콘 버튼을 따로 두지 않는 이유는 그 자리를
   * 종 태그가 쓰고 있어서고, 44px 터치 영역을 행 전체로 주는 편이 더 크다.
   * **없으면 링크로 감싸지 않는다** — 갈 곳 없는 화살표는 거짓말이다.
   */
  href?: string;
}) {
  const row = (
    <>
      {speciesIcon}
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate font-medium">{pet.name}</span>
        {/* 모르는 정보를 "모름"이라고 굳이 보여주지 않는다 — 줄 자체를 뺀다. */}
        {pet.sex !== "unknown" && (
          <span className="text-xs text-muted-foreground">
            {PET_SEX_LABEL[pet.sex]}
          </span>
        )}
      </div>
      <Badge variant="tint" className="ml-auto shrink-0">
        {pet.species.name_ko}
      </Badge>
      {href && (
        <LuChevronRight
          aria-hidden
          className="-mr-1 size-4 shrink-0 text-muted-foreground"
        />
      )}
    </>
  );

  const className = "flex min-h-16 items-center gap-3 px-4 py-3";

  if (!href) return <div className={className}>{row}</div>;

  return (
    <Link
      href={href}
      // 링크 이름은 안의 텍스트로 만들어진다("코코 암컷 페럿"). 그것만으로는
      // 눌러서 무엇이 되는지 알 수 없어 aria-label 로 행동을 명시한다.
      aria-label={`${pet.name} 정보 수정`}
      // Static Export 에서 App Router 의 세그먼트 prefetch 는 동작하지 않는다
      // (요청 파일명에 세그먼트가 덧붙어 404). 목록이 길수록 헛된 요청만 늘어난다.
      // 근거와 실측은 docs/router.md.
      prefetch={false}
      className={`${className} transition-colors active:bg-muted`}
    >
      {row}
    </Link>
  );
}
