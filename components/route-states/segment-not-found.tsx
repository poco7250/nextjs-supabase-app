import Link from "next/link";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/constants/routes";

/**
 * not-found.tsx가 공통으로 쓰는 404 화면. 대시보드로 돌아가는 링크를 준다.
 */
export function SegmentNotFound() {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-4 p-10 text-center">
      <h2 className="text-lg font-semibold">페이지를 찾을 수 없어요</h2>
      <p className="text-sm text-muted-foreground">
        주소가 잘못됐거나 접근할 수 없는 페이지예요.
      </p>
      <Button asChild variant="outline">
        <Link href={routes.dashboard}>대시보드로 이동</Link>
      </Button>
    </div>
  );
}
