"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

type SegmentErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

/**
 * 라우트 세그먼트의 error.tsx가 공통으로 쓰는 에러 화면.
 * 서버 에러는 message가 가려지므로 digest로 서버 로그와 맞춰 본다.
 */
export function SegmentError({ error, retry }: SegmentErrorProps) {
  useEffect(() => {
    // logger 도입 전까지는 console.error로 기록한다
    console.error("[segment-error]", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="flex w-full flex-col items-center justify-center gap-4 p-10 text-center">
      <h2 className="text-lg font-semibold">문제가 발생했어요</h2>
      <p className="text-sm text-muted-foreground">
        잠시 후 다시 시도해 주세요.
      </p>
      <Button onClick={() => retry()}>다시 시도</Button>
    </div>
  );
}
