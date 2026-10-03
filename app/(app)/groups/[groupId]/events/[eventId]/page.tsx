import { RouteParamsText } from "@/components/route-states/route-params-text";

/**
 * 이벤트 상세 페이지. RSVP·명단은 Phase 2에서 채운다.
 * params는 RouteParamsText 안의 Suspense에서 읽는다(클라이언트 내비게이션이 막히지 않게).
 */
export default function EventDetailPage(
  props: PageProps<"/groups/[groupId]/events/[eventId]">,
) {
  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-xl font-bold">이벤트 상세</h2>
      <RouteParamsText params={props.params} />
    </section>
  );
}
