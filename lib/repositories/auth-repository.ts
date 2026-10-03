import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

/**
 * 현재 로그인한 사용자 id. 세션이 없거나 검증에 실패하면 null.
 * getClaims()는 JWT 서명을 검증하므로 서버 권한 판정에 써도 된다.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error) {
    logger.warn("auth-repository", "세션 확인 실패", error);
    return null;
  }
  return data?.claims.sub ?? null;
}
