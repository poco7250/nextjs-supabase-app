import { AuthButton } from "@/components/auth-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { routes } from "@/lib/constants/routes";
import { siteConfig } from "@/lib/constants/site";
import { createClient } from "@/lib/supabase/server";
import { hasEnvVars } from "@/lib/utils";
import {
  Car,
  Link2,
  ReceiptText,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

type Feature = { icon: LucideIcon; title: string; description: string };

/** 랜딩에서 소개하는 핵심 기능 (PRD MVP 핵심 기능 묶음) */
const FEATURES: Feature[] = [
  {
    icon: Link2,
    title: "초대 링크 하나로 시작",
    description:
      "그룹을 만들고 링크를 단톡방에 공유하면, 받은 사람은 미리보기를 보고 바로 가입해요.",
  },
  {
    icon: UsersRound,
    title: "참석 응답과 대기 순번",
    description:
      "참석·불참·미정으로 응답받고, 정원이 차면 대기 순번대로 자동으로 자리가 채워져요.",
  },
  {
    icon: Car,
    title: "카풀 좌석 신청",
    description:
      "운전자가 출발지와 좌석을 올리면 참석자가 선착순으로 탑승을 신청해요.",
  },
  {
    icon: ReceiptText,
    title: "N빵 정산까지 한 번에",
    description:
      "비용을 등록하면 누가 누구에게 얼마를 보낼지 계산하고, 계좌·토스 링크까지 보여줘요.",
  },
];

/**
 * 랜딩 페이지. 비로그인 사용자에게 서비스를 소개하고 로그인·회원가입으로 안내한다.
 * AuthButton·HeroActions는 쿠키를 읽으므로 cacheComponents 환경에서 Suspense 안에 둔다.
 */
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center">
      <nav className="flex h-16 w-full justify-center border-b border-b-foreground/10">
        <div className="flex w-full max-w-5xl items-center justify-between gap-2 px-4 text-sm">
          <Link href={routes.home} className="truncate font-semibold">
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
      <section className="flex w-full max-w-5xl flex-1 flex-col gap-10 break-keep px-4 py-12">
        <Hero />
        <FeatureGrid />
      </section>
      <footer className="flex w-full items-center justify-center border-t py-8">
        <ThemeSwitcher />
      </footer>
    </main>
  );
}

/**
 * 서비스 소개 카피와 시작 버튼.
 */
function Hero() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
        단톡방·엑셀·계좌번호 복붙 없이 모임을 굴려요
      </h1>
      <p className="text-muted-foreground">{siteConfig.description}</p>
      <Suspense fallback={<div className="h-10" />}>
        <HeroActions />
      </Suspense>
    </div>
  );
}

/**
 * 로그인 상태면 내 그룹으로, 아니면 회원가입·로그인으로 안내한다.
 */
async function HeroActions() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (data?.claims) {
    return (
      <Button asChild size="lg" className="w-full sm:w-fit">
        <Link href={routes.dashboard}>내 그룹으로 가기</Link>
      </Button>
    );
  }
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Button asChild size="lg">
        <Link href={routes.signUp}>무료로 시작하기</Link>
      </Button>
      <Button asChild size="lg" variant="outline">
        <Link href={routes.login}>로그인</Link>
      </Button>
    </div>
  );
}

/**
 * 핵심 기능 카드 4개.
 */
function FeatureGrid() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {FEATURES.map(({ icon: Icon, title, description }) => (
        <li key={title}>
          <Card className="h-full">
            <CardHeader className="gap-2">
              <Icon aria-hidden className="size-6 text-primary" />
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
          </Card>
        </li>
      ))}
    </ul>
  );
}
