"use client";

import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLogout } from "@/hooks/use-logout";
import { routes } from "@/lib/constants/routes";
import { getPageTitle, getParentHref } from "@/lib/navigation/page-meta";
import { ChevronLeft, LayoutGrid, LogOut, Menu, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * 로그인 후 화면의 상단 헤더: 뒤로 가기 / 페이지 제목 / 테마·컨텍스트 메뉴.
 * usePathname이 동적 경로에서 suspend하므로 Suspense 안에 둬야 한다.
 */
export function AppHeader() {
  const pathname = usePathname();
  const parentHref = getParentHref(pathname);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-1 px-2">
        <div className="size-11 shrink-0">
          {parentHref && (
            <Button variant="ghost" size="icon" className="size-11" asChild>
              <Link href={parentHref} aria-label="뒤로 가기">
                <ChevronLeft className="!size-5" aria-hidden />
              </Link>
            </Button>
          )}
        </div>
        <h1 className="min-w-0 flex-1 truncate text-center text-base font-semibold">
          {getPageTitle(pathname)}
        </h1>
        <div className="flex shrink-0 items-center">
          <div className="size-11">
            <ThemeSwitcher className="size-11" />
          </div>
          <HeaderMenu />
        </div>
      </div>
    </header>
  );
}

/**
 * 헤더 우측 컨텍스트 메뉴: 내 그룹 / 내 프로필 / 로그아웃
 */
function HeaderMenu() {
  const logout = useLogout();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-11"
          aria-label="메뉴"
        >
          <Menu className="!size-5" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem asChild className="min-h-11">
          <Link href={routes.dashboard}>
            <LayoutGrid aria-hidden />내 그룹
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="min-h-11">
          <Link href={routes.profile}>
            <User aria-hidden />내 프로필
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="min-h-11" onSelect={logout}>
          <LogOut aria-hidden />
          로그아웃
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
