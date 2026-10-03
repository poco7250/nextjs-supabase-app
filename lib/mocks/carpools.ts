import type { Carpool, CarpoolRider } from "@/lib/types/domain";
import { getMockEventBundle } from "./events";
import {
  MOCK_CARPOOL_IDS as C,
  MOCK_EVENT_IDS as E,
  MOCK_USER_IDS as U,
  mockId,
} from "./ids";

/* Task 020: 만석·잔여 있음·내가 탑승 중·내가 운전자·참석 확정자 아님 */

export const MOCK_CARPOOLS = [
  {
    id: C.minjiFull,
    eventId: E.unlimited,
    driverId: U.minji,
    departurePoint: "강남역 11번 출구",
    departureTime: "2026-10-10T09:30:00.000Z",
    seatCount: 1,
  },
  {
    id: C.seoyeonAvailable,
    eventId: E.unlimited,
    driverId: U.seoyeon,
    departurePoint: "사당역 4번 출구",
    departureTime: "2026-10-10T09:20:00.000Z",
    seatCount: 3,
  },
  {
    id: C.mine,
    eventId: E.overCapacity,
    driverId: U.me,
    departurePoint: "합정역 7번 출구",
    departureTime: "2026-10-17T22:00:00.000Z",
    seatCount: 2,
  },
] satisfies Carpool[];

export const MOCK_CARPOOL_RIDERS = [
  {
    id: mockId("rider", 1),
    carpoolId: C.minjiFull,
    riderId: U.junho,
    status: "requested",
    requestedAt: "2026-10-02T01:00:00.000Z",
  },
  {
    id: mockId("rider", 2),
    carpoolId: C.seoyeonAvailable,
    riderId: U.me,
    status: "requested",
    requestedAt: "2026-10-02T02:00:00.000Z",
  },
  // 취소한 신청은 좌석 계산에서 빠진다
  {
    id: mockId("rider", 3),
    carpoolId: C.seoyeonAvailable,
    riderId: U.junho,
    status: "canceled",
    requestedAt: "2026-10-01T09:00:00.000Z",
  },
  {
    id: mockId("rider", 4),
    carpoolId: C.mine,
    riderId: U.minji,
    status: "requested",
    requestedAt: "2026-10-02T03:00:00.000Z",
  },
] satisfies CarpoolRider[];

export type MockCarpoolView = {
  carpool: Carpool;
  /** 신청 중(requested)인 탑승자만 */
  riders: CarpoolRider[];
  remainingSeats: number;
};

/**
 * 카풀 카드 표시용: 신청 중인 탑승자와 잔여 좌석을 계산한다.
 */
export function toMockCarpoolView(carpool: Carpool): MockCarpoolView {
  const riders = MOCK_CARPOOL_RIDERS.filter(
    (rider) => rider.carpoolId === carpool.id && rider.status === "requested",
  );
  return { carpool, riders, remainingSeats: carpool.seatCount - riders.length };
}

export const MOCK_CARPOOL_SCENARIOS = [
  "full",
  "available",
  "riding",
  "driver",
  "notAttendee",
] as const;
export type MockCarpoolScenario = (typeof MOCK_CARPOOL_SCENARIOS)[number];

/** 시나리오별 이벤트와 보는 사람. notAttendee는 대기자(서연) 시점이다 */
const CARPOOL_SCENARIO_CONTEXT: Record<
  MockCarpoolScenario,
  { eventId: string; viewerId: string }
> = {
  full: { eventId: E.unlimited, viewerId: U.me },
  available: { eventId: E.unlimited, viewerId: U.me },
  riding: { eventId: E.unlimited, viewerId: U.me },
  driver: { eventId: E.overCapacity, viewerId: U.me },
  notAttendee: { eventId: E.overCapacity, viewerId: U.seoyeon },
};

/**
 * 카풀 페이지(Task 020)용 시나리오. 보는 사람의 참석 확정 여부와 카풀 카드 목록을 돌려준다.
 */
export function getMockCarpoolScenario(scenario: MockCarpoolScenario) {
  const { eventId, viewerId } = CARPOOL_SCENARIO_CONTEXT[scenario];
  const rsvps = getMockEventBundle(eventId)?.rsvps ?? [];
  const isAttendee = rsvps.some(
    (rsvp) => rsvp.userId === viewerId && rsvp.status === "going",
  );
  const carpools = MOCK_CARPOOLS.filter((item) => item.eventId === eventId);
  return {
    eventId,
    viewerId,
    isAttendee,
    carpools: carpools.map(toMockCarpoolView),
  };
}
