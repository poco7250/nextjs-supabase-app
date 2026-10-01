"use client";

import { routes } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

/**
 * 로그아웃 함수를 돌려준다. 성공하면 랜딩으로 이동하고, 실패하면 토스트로 알린다.
 * refresh()로 서버 컴포넌트를 다시 그려 남아 있는 세션 기반 화면을 지운다.
 */
export function useLogout(): () => Promise<void> {
  const router = useRouter();

  return async () => {
    const { error } = await createClient().auth.signOut();

    if (error) {
      // TODO(Task 004): lib/logger.ts 도입 후 로거로 교체
      console.error("[use-logout] 로그아웃 실패:", error);
      toast.error("로그아웃하지 못했어요. 다시 시도해 주세요.");
      return;
    }

    router.replace(routes.home);
    router.refresh();
  };
}
