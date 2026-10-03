import { Skeleton } from "@/components/ui/skeleton";

/**
 * AppHeader가 suspend된 동안 보여줄 자리 표시자. 헤더와 같은 높이로 레이아웃 이동을 막는다.
 */
export function HeaderSkeleton() {
  return (
    <div
      aria-hidden
      className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur"
    >
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-center px-2">
        <Skeleton className="h-5 w-24" />
      </div>
    </div>
  );
}

/**
 * BottomTabNav가 suspend된 동안 보여줄 자리 표시자. 탭 바와 같은 높이·위치를 차지한다.
 */
export function TabBarSkeleton() {
  return (
    <div
      aria-hidden
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-around px-4">
        <Skeleton className="size-6 rounded-full" />
        <Skeleton className="size-6 rounded-full" />
      </div>
    </div>
  );
}
