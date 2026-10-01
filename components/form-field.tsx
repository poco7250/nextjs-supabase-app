import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** 입력 컨트롤에 그대로 펼쳐 넣는 접근성 속성 */
export type FieldControlProps = {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
};

type FormFieldProps = {
  id: string;
  label: string;
  description?: string;
  error?: string;
  className?: string;
  children: (controlProps: FieldControlProps) => ReactNode;
};

/**
 * 레이블·설명·에러 메시지를 입력 컨트롤과 연결하는 필드 래퍼(react-hook-form Form 대체).
 * children 함수가 받은 속성을 Input/Textarea/SelectTrigger에 펼치면 aria-describedby가 연결된다.
 */
export function FormField({
  id,
  label,
  description,
  error,
  className,
  children,
}: FormFieldProps) {
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ");

  return (
    <div className={cn("grid gap-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children({
        id,
        "aria-describedby": describedBy || undefined,
        "aria-invalid": error ? true : undefined,
      })}
      {description && (
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
