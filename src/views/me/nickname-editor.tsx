// 닉네임 인라인 편집 — 표시 상태와 편집 상태를 오간다. 프로필 카드 안에 들어간다.
"use client";

import { useState } from "react";
import { LuPencil } from "react-icons/lu";
import { useUpdateNickname } from "@/entities/user";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

const NICKNAME_MAX = 20;

export function NicknameEditor({
  userId,
  nickname,
}: {
  userId: string;
  nickname: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(nickname);
  const update = useUpdateNickname(userId);

  const trimmed = draft.trim();
  const valid = trimmed.length > 0 && trimmed.length <= NICKNAME_MAX;

  if (!editing) {
    return (
      <div className="flex min-w-0 flex-1 items-center gap-1">
        <span className="min-w-0 flex-1 truncate font-heading text-lg font-bold">
          {nickname}
        </span>
        {/* 연필 아이콘만 둔다 — "수정" 글자를 붙이면 프로필 줄에서 이름보다
            부수적인 것이 더 큰 자리를 차지한다. 이름은 aria-label 로 전한다. */}
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="닉네임 수정"
          onClick={() => {
            setDraft(nickname);
            setEditing(true);
          }}
        >
          <LuPencil />
        </Button>
      </div>
    );
  }

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
          onClick={() =>
            update.mutate(trimmed, { onSuccess: () => setEditing(false) })
          }
        >
          저장
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
          취소
        </Button>
      </div>
    </div>
  );
}
