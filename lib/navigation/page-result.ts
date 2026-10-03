import { routes } from "@/lib/constants/routes";
import type { ActionResult } from "@/lib/types/action-result";
import { notFound, redirect } from "next/navigation";

/**
 * 서버 컴포넌트에서 service 결과를 꺼낸다.
 * NOT_FOUND는 notFound(), UNAUTHENTICATED는 로그인 화면으로 보내고, 그 밖의 실패는 세그먼트 error 경계로 던진다.
 * FORBIDDEN처럼 화면마다 처리가 다른 실패는 이 함수를 부르기 전에 직접 다룬다.
 */
export function unwrapPageResult<T>(result: ActionResult<T>): T {
  if (result.ok) return result.data;
  if (result.error.code === "NOT_FOUND") notFound();
  if (result.error.code === "UNAUTHENTICATED") redirect(routes.login);
  throw new Error(result.error.message);
}
