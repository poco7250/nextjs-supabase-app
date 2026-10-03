"use client";

import { Button } from "@/components/ui/button";
import { useActionToast } from "@/hooks/use-action-toast";
import type { ActionState } from "@/lib/types/action-result";
import { useActionState } from "react";

type AcceptInviteFormProps = {
  token: string;
  /** (prevState, formData) 시그니처의 Server Action. 지금은 목 액션, Task 010에서 실제 액션 */
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
};

/**
 * 초대 수락 "그룹 가입하기" 폼 (F003). 성공하면 액션이 그룹 홈으로 이동시키고,
 * 실패(무효·만료 토큰 등)하면 에러 토스트를 띄운다.
 */
export function AcceptInviteForm({ token, action }: AcceptInviteFormProps) {
  const [state, formAction, pending] = useActionState(action, null);
  useActionToast(state, "그룹에 가입했어요.");

  return (
    <form action={formAction}>
      <input type="hidden" name="token" value={token} />
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "가입하는 중..." : "그룹 가입하기"}
      </Button>
    </form>
  );
}
