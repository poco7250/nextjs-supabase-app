import Link from "next/link";
import { Button } from "./ui/button";
import { LogoutButton } from "./logout-button";
import { routes } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";

/**
 * 랜딩 상단의 인증 영역. 로그인 상태면 내 그룹 링크와 로그아웃, 아니면 로그인/회원가입 버튼을 보여준다.
 * 쿠키를 읽으므로 Suspense 안에서 렌더한다.
 */
export async function AuthButton() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  return data?.claims ? (
    <div className="flex items-center gap-2">
      <Button asChild size="sm" variant="outline">
        <Link href={routes.dashboard}>내 그룹</Link>
      </Button>
      <LogoutButton size="sm" variant="ghost" />
    </div>
  ) : (
    <div className="flex gap-2">
      <Button asChild size="sm" variant="outline">
        <Link href={routes.login}>로그인</Link>
      </Button>
      <Button asChild size="sm">
        <Link href={routes.signUp}>회원가입</Link>
      </Button>
    </div>
  );
}
