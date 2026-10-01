import { RouteParamsText } from "@/components/route-states/route-params-text";

/**
 * 이벤트 카풀 페이지. Phase 3에서 채운다.
 * params는 RouteParamsText 안의 Suspense에서 읽는다(클라이언트 내비게이션이 막히지 않게).
 */
export default function EventCarpoolPage(
  props: PageProps<"/groups/[groupId]/events/[eventId]/carpool">,
) {
  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-xl font-bold">카풀</h2>
      <RouteParamsText params={props.params} />
    </section>
  );
}
