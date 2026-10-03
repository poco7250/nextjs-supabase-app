import { RoleBadge } from "@/components/groups/role-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { routes } from "@/lib/constants/routes";
import { formatEventDateTime } from "@/lib/format/date";
import type { Event, Group, GroupRole } from "@/lib/types/domain";
import { CalendarDays, UsersRound } from "lucide-react";
import Link from "next/link";

type GroupCardProps = {
  group: Group;
  role: GroupRole;
  memberCount: number;
  /** 다음 예정 이벤트. 없으면 "예정 이벤트 없음" */
  nextEvent: Event | undefined;
};

/**
 * 대시보드의 그룹 카드. 카드 전체가 그룹 홈 링크다.
 */
export function GroupCard({
  group,
  role,
  memberCount,
  nextEvent,
}: GroupCardProps) {
  return (
    <Link
      href={routes.group(group.id)}
      className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card className="transition-colors hover:bg-accent/50">
        <CardHeader className="gap-1">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="break-keep text-base">{group.name}</CardTitle>
            <RoleBadge role={role} />
          </div>
          {group.description && (
            <CardDescription className="line-clamp-1">
              {group.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <p className="flex items-center gap-2 text-muted-foreground">
            <UsersRound aria-hidden className="size-4" />
            멤버 {memberCount}명
          </p>
          <NextEventSummary event={nextEvent} />
        </CardContent>
      </Card>
    </Link>
  );
}

/**
 * 다음 예정 이벤트 한 줄 요약.
 */
function NextEventSummary({ event }: { event: Event | undefined }) {
  if (!event) {
    return (
      <p className="flex items-center gap-2 text-muted-foreground">
        <CalendarDays aria-hidden className="size-4" />
        예정 이벤트 없음
      </p>
    );
  }
  return (
    <p className="flex items-start gap-2">
      <CalendarDays
        aria-hidden
        className="mt-0.5 size-4 shrink-0 text-primary"
      />
      <span className="min-w-0">
        <span className="block truncate font-medium">{event.title}</span>
        <span className="text-muted-foreground">
          {formatEventDateTime(event.startAt)}
        </span>
      </span>
    </p>
  );
}
