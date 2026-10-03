import { DEFAULT_AUTH_REDIRECT } from "@/lib/constants/routes";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

/**
 * 리다이렉트 대상 경로를 검증한다.
 * 오픈 리다이렉트를 막기 위해 "/"로 시작하는 상대 경로만 허용한다("//evil.com" 차단).
 */
function getSafeNext(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return DEFAULT_AUTH_REDIRECT;
  }
  return next;
}

/**
 * 리다이렉트에 사용할 origin을 구한다.
 * 배포 환경에서는 로드밸런서 뒤의 원래 호스트(x-forwarded-host)를 우선한다.
 */
function getRedirectOrigin(request: NextRequest, origin: string): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (process.env.NODE_ENV === "development" || !forwardedHost) {
    return origin;
  }
  return `https://${forwardedHost}`;
}

/**
 * 에러 페이지로 보내는 응답을 만든다.
 */
function redirectToError(origin: string, message: string): NextResponse {
  const params = new URLSearchParams({ error: message });
  return NextResponse.redirect(`${origin}/auth/error?${params}`);
}

/**
 * OAuth(PKCE) 콜백: Supabase가 넘겨준 code를 세션으로 교환하고 쿠키를 설정한다.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = getSafeNext(searchParams.get("next"));

  // 사용자가 구글 동의 화면에서 취소하는 등 provider 쪽 에러
  if (searchParams.get("error")) {
    return redirectToError(origin, "소셜 로그인이 취소되었거나 실패했어요.");
  }

  if (!code) {
    return redirectToError(origin, "인증 코드가 없어요.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    logger.error("auth/callback", "세션 교환 실패", error.message);
    return redirectToError(origin, "로그인 처리 중 문제가 발생했어요.");
  }

  return NextResponse.redirect(`${getRedirectOrigin(request, origin)}${next}`);
}
