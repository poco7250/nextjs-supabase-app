/**
 * 라우트 세그먼트의 loading.tsx가 공통으로 쓰는 로딩 화면.
 */
export function SegmentLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      className="flex w-full items-center justify-center p-10 text-sm text-muted-foreground"
    >
      불러오는 중...
    </div>
  );
}
