"use client";

import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useActionToast } from "@/hooks/use-action-toast";
import type { ActionState } from "@/lib/types/action-result";
import { GROUP_DESCRIPTION_MAX, GROUP_NAME_MAX } from "@/lib/validations/group";
import { useActionState, useState } from "react";

type GroupFormProps = {
  /** (prevState, formData) 시그니처의 Server Action. 지금은 목 액션, Task 009에서 실제 액션 */
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  submitLabel: string;
  /** 수정 폼이면 대상 그룹 id(숨김 필드) */
  groupId?: string;
  defaultValues?: { name: string; description: string | null };
  /** 성공 토스트 문구(그룹 생성처럼 성공 시 이동하면 쓰이지 않는다) */
  successMessage?: string;
};

/**
 * 그룹 생성·수정 공용 폼. 필드 에러는 FormField로 입력과 연결한다.
 * React 19는 액션 후 비제어 입력을 초기화하므로, 검증 실패 시 입력이 사라지지 않게 제어 입력으로 둔다.
 */
export function GroupForm({
  action,
  submitLabel,
  groupId,
  defaultValues,
  successMessage = "저장했어요.",
}: GroupFormProps) {
  const [state, formAction, pending] = useActionState(action, null);
  const [name, setName] = useState(defaultValues?.name ?? "");
  const [description, setDescription] = useState(
    defaultValues?.description ?? "",
  );
  const errors = state && !state.ok ? (state.error.fieldErrors ?? {}) : {};
  useActionToast(state, successMessage);

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      {groupId && <input type="hidden" name="groupId" value={groupId} />}
      <FormField id="group-name" label="그룹명" error={errors.name}>
        {(control) => (
          <Input
            {...control}
            name="name"
            value={name}
            maxLength={GROUP_NAME_MAX}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 주말 등반 모임"
          />
        )}
      </FormField>
      <FormField
        id="group-description"
        label="그룹 설명 (선택)"
        description={`${GROUP_DESCRIPTION_MAX}자까지 쓸 수 있어요.`}
        error={errors.description}
      >
        {(control) => (
          <Textarea
            {...control}
            name="description"
            value={description}
            maxLength={GROUP_DESCRIPTION_MAX}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        )}
      </FormField>
      <Button type="submit" disabled={pending} className="w-full sm:w-fit">
        {pending ? "저장하는 중..." : submitLabel}
      </Button>
    </form>
  );
}
