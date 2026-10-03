"use client";

import { RoleBadge } from "@/components/groups/role-badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/format/date";
import {
  canRemoveMember,
  getAssignableRoles,
  type MemberRef,
} from "@/lib/groups/member-permissions";
import { logger } from "@/lib/logger";
import type { ActionState } from "@/lib/types/action-result";
import { GROUP_ROLE_LABEL, type GroupRole } from "@/lib/types/domain";
import { UserMinus } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

type MemberAction = (
  prev: ActionState,
  formData: FormData,
) => Promise<ActionState>;

/** 화면 표시용 멤버. 이름은 서버에서 계산해 넘긴다 */
export type MemberListItem = MemberRef & { name: string; joinedAt: string };

type MemberListProps = {
  groupId: string;
  viewer: MemberRef;
  members: MemberListItem[];
  /** 지금은 목 액션, Task 011에서 실제 액션 */
  changeRoleAction: MemberAction;
  removeAction: MemberAction;
};

/**
 * 멤버 관리 목록 (F004, F005). 역할 변경 Select와 내보내기 확인 다이얼로그.
 * 버튼·옵션 노출은 member-permissions 규칙을 따르고, 최종 판정은 Server Action이 한다.
 */
export function MemberList({
  groupId,
  viewer,
  members: initialMembers,
  changeRoleAction,
  removeAction,
}: MemberListProps) {
  const [members, setMembers] = useState(initialMembers);
  const { pending, changeRole, remove } = useMemberMutations({
    groupId,
    changeRoleAction,
    removeAction,
    setMembers,
  });
  const ownerCount = members.filter((m) => m.role === "owner").length;

  return (
    <ul className="divide-y rounded-xl border bg-card">
      {members.map((member) => (
        <MemberRow
          key={member.userId}
          member={member}
          isMe={member.userId === viewer.userId}
          roles={getAssignableRoles(viewer.role, member, ownerCount)}
          removable={canRemoveMember(viewer, member, ownerCount)}
          pending={pending}
          onChangeRole={(role) => changeRole(member, role)}
          onRemove={() => remove(member)}
        />
      ))}
    </ul>
  );
}

/**
 * 액션에 넘길 FormData를 만든다.
 */
function toFormData(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

/**
 * 역할 변경·내보내기 액션을 호출하고 결과를 토스트로 알린다. 성공하면 로컬 목록을 갱신한다.
 */
function useMemberMutations({
  groupId,
  changeRoleAction,
  removeAction,
  setMembers,
}: Pick<MemberListProps, "groupId" | "changeRoleAction" | "removeAction"> & {
  setMembers: React.Dispatch<React.SetStateAction<MemberListItem[]>>;
}) {
  const [pending, startTransition] = useTransition();

  /** 액션 실행 공통 처리: 예외는 로깅 후 일반 에러 토스트 */
  function run(action: () => Promise<ActionState>, onOk: () => void) {
    startTransition(async () => {
      try {
        const result = await action();
        if (result?.ok) onOk();
        else if (result) toast.error(result.error.message);
      } catch (error) {
        logger.error("member-list", "멤버 액션 실패", error);
        toast.error("요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.");
      }
    });
  }

  const changeRole = (member: MemberListItem, role: GroupRole) =>
    run(
      () =>
        changeRoleAction(
          null,
          toFormData({ groupId, userId: member.userId, role }),
        ),
      () => {
        setMembers((prev) =>
          prev.map((m) => (m.userId === member.userId ? { ...m, role } : m)),
        );
        toast.success(
          `${member.name}님을 ${GROUP_ROLE_LABEL[role]}(으)로 바꿨어요.`,
        );
      },
    );

  const remove = (member: MemberListItem) =>
    run(
      () => removeAction(null, toFormData({ groupId, userId: member.userId })),
      () => {
        setMembers((prev) => prev.filter((m) => m.userId !== member.userId));
        toast.success(`${member.name}님을 그룹에서 내보냈어요.`);
      },
    );

  return { pending, changeRole, remove };
}

type MemberRowProps = {
  member: MemberListItem;
  isMe: boolean;
  /** 지정 가능한 역할. 2개 이상일 때만 Select를 보여준다 */
  roles: GroupRole[];
  removable: boolean;
  pending: boolean;
  onChangeRole: (role: GroupRole) => void;
  onRemove: () => void;
};

/**
 * 멤버 한 줄: 이름·가입일, 역할(Select 또는 배지), 내보내기 버튼.
 */
function MemberRow({
  member,
  isMe,
  roles,
  removable,
  pending,
  onChangeRole,
  onRemove,
}: MemberRowProps) {
  return (
    <li className="flex flex-wrap items-center gap-3 p-4">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">
          {member.name}
          {isMe && <span className="text-muted-foreground"> (나)</span>}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDate(member.joinedAt)} 가입
        </p>
      </div>
      {roles.length > 1 ? (
        <RoleSelect
          name={member.name}
          value={member.role}
          roles={roles}
          disabled={pending}
          onChange={onChangeRole}
        />
      ) : (
        <RoleBadge role={member.role} />
      )}
      {removable && (
        <RemoveMemberDialog
          name={member.name}
          disabled={pending}
          onConfirm={onRemove}
        />
      )}
    </li>
  );
}

/**
 * 역할 변경 Select.
 */
function RoleSelect({
  name,
  value,
  roles,
  disabled,
  onChange,
}: {
  name: string;
  value: GroupRole;
  roles: GroupRole[];
  disabled: boolean;
  onChange: (role: GroupRole) => void;
}) {
  return (
    <Select
      value={value}
      disabled={disabled}
      onValueChange={(next) => {
        if (next !== value) onChange(next as GroupRole);
      }}
    >
      <SelectTrigger className="h-9 w-28" aria-label={`${name}님 역할`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {roles.map((role) => (
          <SelectItem key={role} value={role}>
            {GROUP_ROLE_LABEL[role]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * 내보내기 확인 다이얼로그. 과거 기록은 남는다는 점을 안내한다.
 */
function RemoveMemberDialog({
  name,
  disabled,
  onConfirm,
}: {
  name: string;
  disabled: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled}
          aria-label={`${name}님 내보내기`}
        >
          <UserMinus aria-hidden className="text-destructive" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{name}님을 내보낼까요?</AlertDialogTitle>
          <AlertDialogDescription>
            그룹에서 바로 빠지고, 다시 들어오려면 초대 링크가 필요해요. 지난
            참여·정산 기록은 &quot;나간 멤버&quot;로 남아요.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            내보내기
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
