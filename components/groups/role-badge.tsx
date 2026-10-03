import { Badge, type BadgeProps } from "@/components/ui/badge";
import { GROUP_ROLE_LABEL, type GroupRole } from "@/lib/types/domain";

const ROLE_VARIANT: Record<GroupRole, BadgeProps["variant"]> = {
  owner: "default",
  admin: "secondary",
  member: "outline",
};

/**
 * 그룹 내 역할 배지(소유자/관리자/멤버).
 */
export function RoleBadge({ role }: { role: GroupRole }) {
  return <Badge variant={ROLE_VARIANT[role]}>{GROUP_ROLE_LABEL[role]}</Badge>;
}
