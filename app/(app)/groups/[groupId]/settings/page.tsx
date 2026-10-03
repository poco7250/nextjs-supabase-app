import { GroupForm } from "@/components/groups/group-form";
import { InviteLinkCard } from "@/components/groups/invite-link-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  regenerateInviteAction,
  updateGroupAction,
} from "@/app/(app)/groups/actions";
import { routes } from "@/lib/constants/routes";
import { unwrapPageResult } from "@/lib/navigation/page-result";
import { getGroupSettings } from "@/lib/services/group-service";
import { redirect } from "next/navigation";
import { Suspense } from "react";

/**
 * 그룹 설정 페이지 (F001, F002, owner/admin). 그룹 정보 수정과 초대 링크 관리.
 * params는 페이지 안 Suspense에서 읽는다(cacheComponents에서 탭 이동이 막히지 않게).
 */
export default function GroupSettingsPage(
  props: PageProps<"/groups/[groupId]/settings">,
) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="sr-only">그룹 설정</h2>
      <Suspense fallback={<Skeleton className="h-80 rounded-xl" />}>
        <SettingsContent params={props.params} />
      </Suspense>
    </section>
  );
}

/**
 * 그룹이 없거나 비멤버면 404, 관리자가 아니면 그룹 홈으로 보낸다.
 */
async function SettingsContent({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const result = await getGroupSettings(groupId);
  if (!result.ok && result.error.code === "FORBIDDEN") {
    redirect(routes.group(groupId));
  }
  const { group, invite } = unwrapPageResult(result);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">그룹 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <GroupForm
            action={updateGroupAction}
            groupId={groupId}
            defaultValues={{ name: group.name, description: group.description }}
            submitLabel="저장"
            successMessage="그룹 정보를 저장했어요."
          />
        </CardContent>
      </Card>
      <InviteLinkCard
        groupId={groupId}
        invite={invite}
        regenerateAction={regenerateInviteAction}
      />
    </>
  );
}
