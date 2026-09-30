"use client";

import { SegmentError } from "@/components/route-states/segment-error";

/**
 * 이 세그먼트의 에러 경계. 공용 에러 화면으로 위임한다.
 */
export default function ErrorBoundary(props: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <SegmentError {...props} />;
}
