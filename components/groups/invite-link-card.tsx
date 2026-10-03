"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useActionToast } from "@/hooks/use-action-toast";
import { routes } from "@/lib/constants/routes";
import { formatDate } from "@/lib/format/date";
import { logger } from "@/lib/logger";
import type { ActionState } from "@/lib/types/action-result";
import { Copy, RefreshCw } from "lucide-react";
import { startTransition, useActionState, useSyncExternalStore } from "react";
import { toast } from "sonner";

type RegenerateAction = (
  prev: ActionState<{ token: string }>,
  formData: FormData,
) => Promise<ActionState<{ token: string }>>;

type InviteLinkCardProps = {
  groupId: string;
  /** 현재 활성 초대. 없으면 재발급으로 새로 만든다 */
  invite: { token: string; expiresAt: string | null } | null;
  regenerateAction: RegenerateAction;
};

const noopSubscribe = () => () => {};

/**
 * 브라우저의 origin. 서버 렌더에서는 빈 문자열이라 hydration 불일치 없이 경로만 먼저 보인다.
 */
function useOrigin() {
  return useSyncExternalStore(
    noopSubscribe,
    () => window.location.origin,
    () => "",
  );
}

/**
 * 그룹 설정의 초대 링크 카드 (F002). 링크 표시·복사, 재발급(기존 링크 즉시 만료) 확인 다이얼로그.
 */
export function InviteLinkCard({
  groupId,
  invite,
  regenerateAction,
}: InviteLinkCardProps) {
  const [state, regenerate, pending] = useActionState(regenerateAction, null);
  const origin = useOrigin();
  useActionToast(
    state,
    "새 초대 링크를 만들었어요. 이전 링크는 더 이상 쓸 수 없어요.",
  );

  const regenerated = state?.ok ? state.data.token : null;
  const token = regenerated ?? invite?.token;
  const expiresAt = regenerated ? null : (invite?.expiresAt ?? null);
  const url = token ? `${origin}${routes.invite(token)}` : "";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">초대 링크</CardTitle>
        <CardDescription>
          링크를 단톡방에 공유하면 받은 사람이 바로 가입할 수 있어요.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {token ? (
          <InviteLinkField url={url} expiresAt={expiresAt} />
        ) : (
          <p className="text-sm text-muted-foreground">
            아직 초대 링크가 없어요. 새로 만들어 주세요.
          </p>
        )}
        <RegenerateDialog
          pending={pending}
          onConfirm={() =>
            startTransition(() => regenerate(toFormData(groupId)))
          }
        />
      </CardContent>
    </Card>
  );
}

/**
 * 재발급 액션에 넘길 FormData.
 */
function toFormData(groupId: string) {
  const formData = new FormData();
  formData.set("groupId", groupId);
  return formData;
}

/**
 * 링크 읽기 전용 입력 + 복사 버튼 + 만료일.
 */
function InviteLinkField({
  url,
  expiresAt,
}: {
  url: string;
  expiresAt: string | null;
}) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("초대 링크를 복사했어요.");
    } catch (error) {
      logger.warn("invite-link-card", "클립보드 복사 실패", error);
      toast.error("복사하지 못했어요. 링크를 길게 눌러 직접 복사해 주세요.");
    }
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          readOnly
          value={url}
          aria-label="초대 링크"
          className="min-w-0 flex-1"
          onFocus={(e) => e.currentTarget.select()}
        />
        <Button
          type="button"
          variant="secondary"
          onClick={copy}
          disabled={!url}
        >
          <Copy aria-hidden />
          복사
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {expiresAt
          ? `${formatDate(expiresAt)}까지 쓸 수 있어요.`
          : "만료 기한 없이 쓸 수 있어요."}
      </p>
    </div>
  );
}

/**
 * 재발급 확인 다이얼로그. 확인하면 기존 링크가 즉시 만료된다.
 */
function RegenerateDialog({
  pending,
  onConfirm,
}: {
  pending: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          className="w-full sm:w-fit"
        >
          <RefreshCw aria-hidden />
          {pending ? "만드는 중..." : "초대 링크 재발급"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>초대 링크를 다시 만들까요?</AlertDialogTitle>
          <AlertDialogDescription>
            지금 링크는 바로 만료돼서, 이미 공유한 링크로는 가입할 수 없어요.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>재발급</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
