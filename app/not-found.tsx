import { SegmentNotFound } from "@/components/route-states/segment-not-found";

/**
 * 어떤 라우트에도 매칭되지 않는 URL용 루트 404 페이지.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-svh items-center justify-center">
      <SegmentNotFound />
    </main>
  );
}
