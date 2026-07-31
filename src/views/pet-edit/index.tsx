// 펫 수정 화면 — 로그인 필수 (클라 가드, ADR-0004).
//
// 경로가 `/pet/[id]/edit` 이 아니라 `/pet/edit?id=...` 인 이유:
// Static Export 는 동적 세그먼트에 generateStaticParams 를 요구하고
// dynamicParams 가 강제로 false 라, **빌드 시점에 없던 id 는 404** 다.
// 펫은 사용자가 런타임에 만드는 것이라 빌드 때 알 수 없다. 정적 페이지 한 장 +
// 쿼리스트링 + 클라이언트 조회로 간다(docs/router.md, ADR-0002).
//
// 쿼리스트링은 useSearchParams 로 읽고 Suspense 로 감싼다. window 를 effect 에서
// 읽는 방법도 있지만(auth/callback 이 그렇게 한다) 그건 setState 를 effect 안에서
// 부르게 되고, React Compiler 린트(react-hooks/set-state-in-effect)가 막는다.
"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQueryPet } from "@/entities/pet";
import { useRequireSession } from "@/features/auth";
import { EditPetForm } from "@/features/manage-pet";
import { APP_MESSAGE_CODE } from "@/shared/config/app-message";
import { Button } from "@/shared/ui/button";
import { ErrorState } from "@/shared/ui/error-state";
import { Skeleton } from "@/shared/ui/skeleton";

const SHELL = "flex flex-1 flex-col";

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-4">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}

/** 고칠 대상이 없을 때. id 가 없든, 없는 펫이든, 남의 펫이든 같은 자리다. */
function NothingToEdit() {
  return (
    <div className={`${SHELL} gap-4 p-4`}>
      <ErrorState code={APP_MESSAGE_CODE.pet.notFound} />
      <Button variant="outline" size="lg" className="w-full" asChild>
        <Link href="/me" prefetch={false}>
          내 반려동물 보기
        </Link>
      </Button>
    </div>
  );
}

function PetEditContent() {
  const { session, isLoading } = useRequireSession();
  const petId = useSearchParams().get("id");
  const pet = useQueryPet(petId ?? undefined);

  // 세션 미확정이거나 리다이렉트 직전 — 빈 화면 대신 스켈레톤.
  if (isLoading || !session) return <LoadingSkeleton />;
  if (!petId) return <NothingToEdit />;

  if (pet.isPending) return <LoadingSkeleton />;

  if (pet.isError) {
    return (
      <div className={`${SHELL} p-4`}>
        <ErrorState
          code={APP_MESSAGE_CODE.pet.detailLoadFailed}
          onRetry={() => pet.refetch()}
        />
      </div>
    );
  }

  // 없는 펫과 남의 펫을 같은 문구로 묶는다 — pets 는 읽기 공개라 갈라 놓으면
  // 그 id 가 존재하는지가 문구로 새어나간다.
  if (!pet.data || pet.data.owner_id !== session.user.id) {
    return <NothingToEdit />;
  }

  return (
    <div className={SHELL}>
      <h1 className="px-4 pt-6 pb-5 font-heading text-2xl font-bold text-balance break-keep">
        {pet.data.name} 정보를 고쳐주세요
      </h1>
      <EditPetForm pet={pet.data} />
    </div>
  );
}

export function PetEditView() {
  // useSearchParams 는 Static Export 에서 Suspense 경계를 요구한다. 없으면
  // 빌드가 missing-suspense-with-csr-bailout 으로 멈춘다.
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <PetEditContent />
    </Suspense>
  );
}
