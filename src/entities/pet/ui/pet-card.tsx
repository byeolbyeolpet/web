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
import { Badge } from "@/shared/ui/badge";
import type { PetListItem } from "../api/use-query-pets";
import { PET_SEX_LABEL } from "../model/sex";

export function PetCard({
  pet,
  speciesIcon,
}: {
  pet: PetListItem;
  speciesIcon?: ReactNode;
}) {
  return (
    <div className="flex min-h-16 items-center gap-3 px-4 py-3">
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
    </div>
  );
}
