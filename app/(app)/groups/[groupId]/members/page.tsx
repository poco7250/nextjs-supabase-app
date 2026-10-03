import {
  MemberList,
  type MemberListItem,
} from "@/components/groups/member-list";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/lib/constants/routes";
import { canManageMembers } from "@/lib/groups/member-permissions";
import { changeMemberRoleMock, removeMemberMock } from "@/lib/mocks/actions";
import {
  getMockGroup,
  getMockGroupMembers,
  getMockMemberDisplayName,
  getMockRole,
} from "@/lib/mocks/groups";
import { MOCK_CURRENT_USER_ID } from "@/lib/mocks/ids";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

/**
 * 멤버 관리 페이지 (F004, F005, owner/admin). 멤버 목록·역할 변경·내보내기.
 * params는 페이지 안 Suspense에서 읽는다(cacheComponents에서 탭 이동이 막히지 않게).
 */
export default function GroupMembersPage(
  props: PageProps<"/groups/[groupId]/members">,
) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-bold">멤버 관리</h2>
      <Suspense fallback={<Skeleton className="h-72 rounded-xl" />}>
        <MembersContent params={props.params} />
      </Suspense>
    </section>
  );
}

/**
 * 그룹이 없으면 404, 관리자가 아니면 그룹 홈으로 보낸다. 지금은 더미 데이터를 쓴다.
 */
async function MembersContent({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  if (!getMockGroup(groupId)) notFound();
  const viewerRole = getMockRole(groupId, MOCK_CURRENT_USER_ID);
  if (!viewerRole || !canManageMembers(viewerRole)) {
    redirect(routes.group(groupId));
  }

  const members: MemberListItem[] = getMockGroupMembers(groupId).map(
    ({ member }) => ({
      userId: member.userId,
      role: member.role,
      joinedAt: member.joinedAt,
      name: getMockMemberDisplayName(groupId, member.userId),
    }),
  );

  return (
    <>
      <p className="text-sm text-muted-foreground">멤버 {members.length}명</p>
      <MemberList
        groupId={groupId}
        viewer={{ userId: MOCK_CURRENT_USER_ID, role: viewerRole }}
        members={members}
        changeRoleAction={changeMemberRoleMock}
        removeAction={removeMemberMock}
      />
    </>
  );
}
