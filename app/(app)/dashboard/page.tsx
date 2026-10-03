import { EmptyState } from "@/components/empty-state";
import { GroupCard } from "@/components/groups/group-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/lib/constants/routes";
import { getMockDashboardGroups } from "@/lib/mocks/groups";
import { MOCK_CURRENT_USER_ID } from "@/lib/mocks/ids";
import { Plus, UsersRound } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

/**
 * 대시보드(내 그룹 목록) 페이지 (F022). 소속 그룹과 각 그룹의 다음 예정 이벤트를 보여준다.
 * 지금은 더미 데이터다. Task 009에서 실데이터로 바꾸고 `?preview=empty` 미리보기를 지운다.
 */
export default function DashboardPage(props: PageProps<"/dashboard">) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-bold">내 그룹</h2>
        <Button asChild size="sm">
          <Link href={routes.newGroup}>
            <Plus aria-hidden />새 그룹 만들기
          </Link>
        </Button>
      </div>
      <Suspense fallback={<GroupListSkeleton />}>
        <GroupList searchParams={props.searchParams} />
      </Suspense>
    </section>
  );
}

/**
 * 그룹 카드 목록. searchParams가 런타임 데이터라 Suspense 안에서 읽는다.
 * `?preview=empty`면 빈 상태를 보여준다(개발용 미리보기).
 */
async function GroupList({
  searchParams,
}: {
  searchParams: PageProps<"/dashboard">["searchParams"];
}) {
  const { preview } = await searchParams;
  const groups =
    preview === "empty" ? [] : getMockDashboardGroups(MOCK_CURRENT_USER_ID);

  if (groups.length === 0) {
    return (
      <EmptyState
        icon={UsersRound}
        title="아직 가입한 그룹이 없어요"
        description="그룹을 만들거나, 받은 초대 링크로 가입해 보세요."
        action={
          <Button asChild variant="outline">
            <Link href={routes.newGroup}>새 그룹 만들기</Link>
          </Button>
        }
      />
    );
  }
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {groups.map((item) => (
        <li key={item.group.id}>
          <GroupCard {...item} />
        </li>
      ))}
    </ul>
  );
}

/**
 * 그룹 목록 로딩 자리.
 */
function GroupListSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Skeleton className="h-36 rounded-xl" />
      <Skeleton className="h-36 rounded-xl" />
    </div>
  );
}
