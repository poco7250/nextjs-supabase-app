import { LogoutButton } from "@/components/logout-button";
import { Separator } from "@/components/ui/separator";

/**
 * 내 프로필 페이지. 표시 이름·계좌 정보는 Phase 4에서 채운다.
 * 로그아웃 버튼은 헤더 메뉴와 이 페이지 두 곳에 있다.
 */
export default function ProfilePage() {
  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-xl font-bold">내 프로필</h2>
      <Separator />
      <LogoutButton variant="outline" className="min-h-11 w-full sm:w-auto" />
    </section>
  );
}
