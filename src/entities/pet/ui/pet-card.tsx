// 펫 카드 — 목록 한 줄. 종은 tint 배지로 올린다(해자 가시성, design-convention).
import { Badge } from "@/shared/ui/badge";
import type { PetListItem } from "../api/use-query-pets";
import { PET_SEX_LABEL } from "../model/sex";

export function PetCard({ pet }: { pet: PetListItem }) {
  return (
    <li className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
      <div className="flex min-w-0 flex-col gap-1">
        <span className="truncate font-medium">{pet.name}</span>
        {/* 모르는 정보를 "모름"이라고 굳이 보여주지 않는다 — 줄 자체를 뺀다. */}
        {pet.sex !== "unknown" && (
          <span className="text-xs text-muted-foreground">
            {PET_SEX_LABEL[pet.sex]}
          </span>
        )}
      </div>
      <Badge variant="tint" className="ml-auto">
        {pet.species.name_ko}
      </Badge>
    </li>
  );
}
