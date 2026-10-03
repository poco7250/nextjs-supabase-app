"use client";

import { Button } from "@/components/ui/button";
import { useLogout } from "@/hooks/use-logout";
import { LogOut } from "lucide-react";
import type { ComponentProps } from "react";

/**
 * 로그아웃 버튼. 로그아웃 후 랜딩 페이지로 이동한다.
 */
export function LogoutButton(
  props: Omit<ComponentProps<typeof Button>, "onClick">,
) {
  const logout = useLogout();

  return (
    <Button onClick={logout} {...props}>
      <LogOut aria-hidden />
      로그아웃
    </Button>
  );
}
