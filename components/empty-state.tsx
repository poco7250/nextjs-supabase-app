import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  /** 버튼·링크 등 다음 행동 */
  action?: ReactNode;
  className?: string;
};

/**
 * 목록이 비었거나 아직 채워지지 않은 영역에 쓰는 안내 블록.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 break-keep rounded-lg border border-dashed px-6 py-10 text-center",
        className,
      )}
    >
      {Icon && <Icon aria-hidden className="size-8 text-muted-foreground" />}
      <p className="font-medium">{title}</p>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {action}
    </div>
  );
}
