import { GroupForm } from "@/components/groups/group-form";
import { InviteLinkCard } from "@/components/groups/invite-link-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/lib/constants/routes";
import { canManageMembers } from "@/lib/groups/member-permissions";
import { regenerateInviteMock, updateGroupMock } from "@/lib/mocks/actions";
import {
  getMockActiveInvite,
  getMockGroup,
  getMockRole,
} from "@/lib/mocks/groups";
import { MOCK_CURRENT_USER_ID } from "@/lib/mocks/ids";
import { notFound, redirect } from "next/navigation";
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
 * 그룹이 없으면 404, 관리자가 아니면 그룹 홈으로 보낸다. 지금은 더미 데이터를 쓴다.
 */
async function SettingsContent({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const group = getMockGroup(groupId);
  if (!group) notFound();
  if (!canManageMembers(getMockRole(groupId, MOCK_CURRENT_USER_ID))) {
    redirect(routes.group(groupId));
  }
  const invite = getMockActiveInvite(groupId);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">그룹 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <GroupForm
            action={updateGroupMock}
            groupId={groupId}
            defaultValues={{ name: group.name, description: group.description }}
            submitLabel="저장"
            successMessage="그룹 정보를 저장했어요."
          />
        </CardContent>
      </Card>
      <InviteLinkCard
        groupId={groupId}
        invite={
          invite ? { token: invite.token, expiresAt: invite.expiresAt } : null
        }
        regenerateAction={regenerateInviteMock}
      />
    </>
  );
}
