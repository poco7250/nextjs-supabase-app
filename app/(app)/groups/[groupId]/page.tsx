import { RouteParamsText } from "@/components/route-states/route-params-text";

/**
 * 그룹 홈 페이지. 공지·이벤트 목록은 Phase 2에서 채운다.
 * params는 RouteParamsText 안의 Suspense에서 읽는다(클라이언트 내비게이션이 막히지 않게).
 */
export default function GroupHomePage(props: PageProps<"/groups/[groupId]">) {
  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-xl font-bold">그룹 홈</h2>
      <RouteParamsText params={props.params} />
    </section>
  );
}
