import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";

type RouteParamsTextProps = {
  /** 페이지 props.params (Promise) */
  params: Promise<Record<string, string>>;
};

/**
 * 골격 페이지에서 동적 파라미터 값을 " / "로 이어 보여준다. 각 Phase에서 실제 콘텐츠로 교체한다.
 * 클라이언트 내비게이션은 공유 레이아웃 아래만 다시 그려 상위 loading.tsx가 fallback이 되지 못하므로,
 * params를 읽는 부분은 페이지 안의 Suspense로 감싼다(감싸지 않으면 내비게이션이 막힌다).
 */
export function RouteParamsText({ params }: RouteParamsTextProps) {
  return (
    <Suspense fallback={<Skeleton className="h-5 w-40" />}>
      <ParamsValue params={params} />
    </Suspense>
  );
}

/**
 * params를 await해서 값만 출력한다.
 */
async function ParamsValue({ params }: RouteParamsTextProps) {
  const values = Object.values(await params);
  return <p className="text-sm text-muted-foreground">{values.join(" / ")}</p>;
}
