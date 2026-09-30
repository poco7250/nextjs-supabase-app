import { AuthButton } from "@/components/auth-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { routes } from "@/lib/constants/routes";
import { siteConfig } from "@/lib/constants/site";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import { Suspense } from "react";

/**
 * 랜딩 페이지. 서비스 소개 카피는 Task 007에서 채운다.
 * AuthButton은 쿠키를 읽으므로 cacheComponents 환경에서 Suspense 안에 둔다.
 */
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center">
      <nav className="flex h-16 w-full justify-center border-b border-b-foreground/10">
        <div className="flex w-full max-w-5xl items-center justify-between p-3 px-5 text-sm">
          <Link href={routes.home} className="font-semibold">
            {siteConfig.name}
          </Link>
          {!hasEnvVars ? (
            <EnvVarWarning />
          ) : (
            <Suspense>
              <AuthButton />
            </Suspense>
          )}
        </div>
      </nav>
      <section className="flex w-full max-w-5xl flex-1 flex-col justify-center gap-4 p-5">
        <h1 className="text-3xl font-bold">{siteConfig.name}</h1>
        <p className="text-muted-foreground">{siteConfig.description}</p>
      </section>
      <footer className="flex w-full items-center justify-center border-t py-8">
        <ThemeSwitcher />
      </footer>
    </main>
  );
}
