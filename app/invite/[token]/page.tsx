import { AcceptInviteForm } from "@/components/groups/accept-invite-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/lib/constants/routes";
import { siteConfig } from "@/lib/constants/site";
import { acceptInviteMock } from "@/lib/mocks/actions";
import { resolveMockInvite } from "@/lib/mocks/groups";
import { MOCK_CURRENT_USER_ID } from "@/lib/mocks/ids";
import type { Group } from "@/lib/types/domain";
import { CircleAlert, UsersRound } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

/**
 * 초대 수락 페이지 (F003). 앱 셸 밖의 단독 화면이다. 공개 경로 등록과 next 복귀는 Task 010에서 한다.
 * params는 Suspense 안의 InviteContent에서 읽는다(cacheComponents에서 static shell을 유지하게).
 */
export default function InvitePage(props: PageProps<"/invite/[token]">) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-5">
      <h1 className="text-lg font-semibold text-muted-foreground">
        {siteConfig.name} 초대
      </h1>
      <section className="w-full max-w-sm">
        <h2 className="sr-only">초대 수락</h2>
        <Suspense fallback={<Skeleton className="h-64 rounded-xl" />}>
          <InviteContent params={props.params} />
        </Suspense>
      </section>
    </main>
  );
}

/**
 * 토큰을 판정해 상태(유효·이미 멤버·만료·무효)별 카드를 고른다. 지금은 더미 데이터를 쓴다.
 */
async function InviteContent({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = resolveMockInvite(token, MOCK_CURRENT_USER_ID);

  switch (result.status) {
    case "valid":
      return <ValidInviteCard token={token} group={result.group} />;
    case "alreadyMember":
      return <AlreadyMemberCard group={result.group} />;
    case "expired":
      return (
        <InviteErrorCard
          title="만료된 초대 링크예요"
          description="초대 기한이 지났어요. 그룹 관리자에게 새 링크를 요청해 주세요."
        />
      );
    case "invalid":
      return (
        <InviteErrorCard
          title="유효하지 않은 초대 링크예요"
          description="링크가 잘못됐거나 관리자가 새 링크로 바꿨어요. 최신 링크를 다시 받아 주세요."
        />
      );
  }
}

/**
 * 그룹 이름·설명 미리보기 헤더.
 */
function GroupPreviewHeader({ group }: { group: Group }) {
  return (
    <CardHeader className="items-center gap-2 text-center">
      <UsersRound aria-hidden className="size-10 text-primary" />
      <CardTitle className="break-keep text-xl">{group.name}</CardTitle>
      <CardDescription className="break-keep">
        {group.description ?? "그룹 소개가 아직 없어요."}
      </CardDescription>
    </CardHeader>
  );
}

/**
 * 유효한 초대: 그룹 미리보기와 가입하기 버튼.
 */
function ValidInviteCard({ token, group }: { token: string; group: Group }) {
  return (
    <Card>
      <GroupPreviewHeader group={group} />
      <CardContent>
        <p className="break-keep text-center text-sm text-muted-foreground">
          이 그룹에 초대받았어요. 가입하면 공지와 이벤트를 함께 볼 수 있어요.
        </p>
      </CardContent>
      <CardFooter>
        <div className="w-full">
          <AcceptInviteForm token={token} action={acceptInviteMock} />
        </div>
      </CardFooter>
    </Card>
  );
}

/**
 * 이미 멤버인 경우: 안내와 그룹 홈 링크.
 */
function AlreadyMemberCard({ group }: { group: Group }) {
  return (
    <Card>
      <GroupPreviewHeader group={group} />
      <CardContent>
        <p className="break-keep text-center text-sm text-muted-foreground">
          이미 이 그룹의 멤버예요.
        </p>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href={routes.group(group.id)}>그룹 홈으로 가기</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

/**
 * 만료·무효 초대: 에러 안내와 대시보드 링크.
 */
function InviteErrorCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card role="alert">
      <CardHeader className="items-center gap-2 text-center">
        <CircleAlert aria-hidden className="size-10 text-destructive" />
        <CardTitle className="break-keep text-xl">{title}</CardTitle>
        <CardDescription className="break-keep">{description}</CardDescription>
      </CardHeader>
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <Link href={routes.dashboard}>대시보드로 가기</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
