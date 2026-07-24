// 닉네임 인라인 편집 — 표시 상태와 편집 상태를 오간다.
"use client";

import { useState } from "react";
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
      <div className="flex items-center gap-2">
        <span className="font-heading text-xl font-bold">{nickname}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setDraft(nickname);
            setEditing(true);
          }}
        >
          수정
        </Button>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-80 flex-col gap-2">
      <Input
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
          disabled={!valid || update.isPending || trimmed === nickname}
          onClick={() =>
            update.mutate(trimmed, { onSuccess: () => setEditing(false) })
          }
        >
          {update.isPending ? "저장 중…" : "저장"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
          취소
        </Button>
      </div>
    </div>
  );
}
