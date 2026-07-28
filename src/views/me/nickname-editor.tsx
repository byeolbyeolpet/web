// 닉네임 편집 폼 — 프로필 행이 편집 상태일 때만 렌더된다.
//
// 표시 상태(이름 + 연필 버튼)는 이 컴포넌트가 갖지 않는다. 연필 버튼의 터치
// 영역(44px)이 이름 줄의 높이를 지배해 아바타와 세로 중심이 어긋나기 때문에,
// 버튼은 프로필 행 레벨에 두고 여기는 편집 UI 만 맡는다.
"use client";

import { useState } from "react";
import { useUpdateNickname } from "@/entities/user";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

const NICKNAME_MAX = 20;

export function NicknameEditor({
  userId,
  nickname,
  onDone,
}: {
  userId: string;
  nickname: string;
  onDone: () => void;
}) {
  const [draft, setDraft] = useState(nickname);
  const update = useUpdateNickname(userId);

  const trimmed = draft.trim();
  const valid = trimmed.length > 0 && trimmed.length <= NICKNAME_MAX;

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <Input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        maxLength={NICKNAME_MAX}
        aria-label="닉네임"
        aria-invalid={!valid}
      />
      {!valid && (
        <p className="text-sm text-destructive">
          닉네임은 1~{NICKNAME_MAX}자로 입력해 주세요.
        </p>
      )}
      <div className="flex gap-2">
        <Button
          size="sm"
          loading={update.isPending}
          disabled={!valid || trimmed === nickname}
          onClick={() => update.mutate(trimmed, { onSuccess: onDone })}
        >
          저장
        </Button>
        <Button variant="ghost" size="sm" onClick={onDone}>
          취소
        </Button>
      </div>
    </div>
  );
}
