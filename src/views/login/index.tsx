// 로그인 화면 — 게스트 열람이 기본인 앱이라 로그인은 권유형으로, 강요하지 않는다.
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { useSession, useSignInGoogle } from "@/features/auth";
import { Button } from "@/shared/ui/button";

export function LoginView() {
  const router = useRouter();
  const { session, isLoading } = useSession();
  const signIn = useSignInGoogle();

  // 이미 로그인된 상태로 들어오면(자동 로그인 포함) 되돌린다.
  useEffect(() => {
    if (!isLoading && session) router.replace("/");
  }, [isLoading, session, router]);

  // 세션 미확정·리다이렉트 대기 중에는 로그인 폼을 깜빡 보여주지 않는다.
  if (isLoading || session) return null;

  /*
   * isPending 만으로는 버튼이 잠기지 않는다.
   * 웹의 signInWithOAuth 는 window.location.assign(url) 을 부른 "직후" 곧바로
   * resolve 한다(auth-js _handleProviderSignIn). assign 은 이동을 예약할 뿐이라
   * 구글 동의 화면이 뜨기까지는 네트워크 왕복만큼 시간이 걸리는데, 그 구간에서
   * isPending 은 이미 false 다 — 버튼이 되살아나 다시 눌린다.
   * 그래서 성공을 "끝났다"가 아니라 "이 화면을 떠난다"로 읽는다.
   */
  const isLeaving = signIn.isPending || signIn.isSuccess;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6 pt-safe-top pb-safe-bottom">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="font-heading text-2xl font-bold">별별펫</h1>
        <p className="text-sm text-muted-foreground">
          별의별 반려동물이 다 여기에.
          <br />
          로그인하면 후기·커뮤니티·펫 프로필을 쓸 수 있어요.
        </p>
      </div>

      <div className="flex w-full max-w-80 flex-col gap-3">
        <Button
          variant="outline"
          size="lg"
          onClick={() => signIn.mutate()}
          loading={isLeaving}
        >
          {/* 진행 중에는 스피너가 그 자리를 대신한다 — 아이콘 둘이 나란히 서면
              무엇을 기다리는지 흐려진다. 문구는 그대로 둔다(design-convention). */}
          {!isLeaving && <FcGoogle aria-hidden className="size-5" />}
          Google로 계속하기
        </Button>
        <Link
          href="/"
          prefetch={false}
          className="py-2 text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          로그인 없이 둘러보기
        </Link>
      </div>
    </main>
  );
}
