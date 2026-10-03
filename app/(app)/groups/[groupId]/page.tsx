import { EmptyState } from "@/components/empty-state";
import { RoleBadge } from "@/components/groups/role-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/lib/constants/routes";
import { canManageMembers } from "@/lib/groups/member-permissions";
import { unwrapPageResult } from "@/lib/navigation/page-result";
import { getGroupHome } from "@/lib/services/group-service";
import type { Group, GroupRole } from "@/lib/types/domain";
import { CalendarDays, Megaphone, Settings, UsersRound } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

/**
 * 그룹 홈 페이지. 그룹 정보와 관리자 바로가기를 보여주고, 공지·이벤트 목록은 Phase 2에서 채운다.
 * params는 페이지 안 Suspense에서 읽는다(cacheComponents에서 탭 이동이 막히지 않게).
 */
export default function GroupHomePage(props: PageProps<"/groups/[groupId]">) {
  return (
    <section className="flex flex-col gap-6">
      <h2 className="sr-only">그룹 홈</h2>
      <Suspense fallback={<Skeleton className="h-40 rounded-xl" />}>
        <GroupHomeContent params={props.params} />
      </Suspense>
      <PlaceholderSection
        icon={Megaphone}
        title="공지"
        emptyTitle="아직 공지가 없어요"
      />
      <PlaceholderSection
        icon={CalendarDays}
        title="이벤트"
        emptyTitle="예정된 이벤트가 없어요"
      />
    </section>
  );
}

/**
 * 그룹 정보·내 역할·멤버 수를 조회한다. 없는 그룹이나 비멤버면 404.
 */
async function GroupHomeContent({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const { group, role, memberCount } = unwrapPageResult(
    await getGroupHome(groupId),
  );

  return <GroupInfoCard group={group} role={role} memberCount={memberCount} />;
}

/**
 * 그룹명·설명·멤버 수·내 역할 카드. 관리자면 설정·멤버 관리 바로가기를 붙인다.
 */
function GroupInfoCard({
  group,
  role,
  memberCount,
}: {
  group: Group;
  role: GroupRole;
  memberCount: number;
}) {
  return (
    <Card>
      <CardHeader className="gap-1">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="break-keep text-xl">{group.name}</CardTitle>
          <RoleBadge role={role} />
        </div>
        {group.description && (
          <CardDescription className="break-keep">
            {group.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <UsersRound aria-hidden className="size-4" />
          멤버 {memberCount}명
        </p>
        {canManageMembers(role) && <AdminShortcuts groupId={group.id} />}
      </CardContent>
    </Card>
  );
}

/**
 * 관리자(owner/admin) 바로가기: 그룹 설정, 멤버 관리.
 */
function AdminShortcuts({ groupId }: { groupId: string }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Button asChild variant="outline">
        <Link href={routes.groupSettings(groupId)}>
          <Settings aria-hidden />
          그룹 설정
        </Link>
      </Button>
      <Button asChild variant="outline">
        <Link href={routes.groupMembers(groupId)}>
          <UsersRound aria-hidden />
          멤버 관리
        </Link>
      </Button>
    </div>
  );
}

/**
 * Phase 2에서 채울 목록 영역의 자리 표시.
 */
function PlaceholderSection({
  icon,
  title,
  emptyTitle,
}: {
  icon: typeof Megaphone;
  title: string;
  emptyTitle: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-semibold">{title}</h3>
      <EmptyState icon={icon} title={emptyTitle} />
    </div>
  );
}
