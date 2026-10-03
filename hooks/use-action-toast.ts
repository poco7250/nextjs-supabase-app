"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import type { ActionState } from "@/lib/types/action-result";

/**
 * Server Action 결과가 바뀔 때 토스트를 띄운다.
 * 성공이면 successMessage, 필드 에러가 없는 실패(권한·충돌 등)면 에러 메시지를 보여준다.
 * 필드 에러는 폼 안에 표시하므로 토스트로 중복해 띄우지 않는다.
 */
export function useActionToast<T>(
  state: ActionState<T>,
  successMessage: string,
) {
  useEffect(() => {
    if (!state) return;
    if (state.ok) toast.success(successMessage);
    else if (
      !state.error.fieldErrors ||
      Object.keys(state.error.fieldErrors).length === 0
    ) {
      toast.error(state.error.message);
    }
  }, [state, successMessage]);
}
