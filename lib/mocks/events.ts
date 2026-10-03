import type {
  Announcement,
  Event,
  EventRsvp,
  RsvpStatus,
} from "@/lib/types/domain";
import {
  MOCK_EVENT_IDS as E,
  MOCK_GROUP_IDS as G,
  MOCK_USER_IDS as U,
  mockId,
} from "./ids";

/* Task 013: 정원 초과·대기자·마감·취소·정원 없음·완료 이벤트 */

export const MOCK_EVENTS = [
  {
    id: E.overCapacity,
    groupId: G.climbing,
    title: "10월 정기 산행",
    description: "북한산 백운대 코스. 8시 구파발역 집합.",
    location: "북한산 국립공원",
    startAt: "2026-10-17T23:00:00.000Z",
    rsvpDeadline: "2026-10-14T15:00:00.000Z",
    capacity: 3,
    status: "scheduled",
    clonedFromEventId: E.completed,
  },
  {
    id: E.unlimited,
    groupId: G.climbing,
    title: "실내 클라이밍 번개",
    description: null,
    location: "더클라임 강남",
    startAt: "2026-10-10T10:00:00.000Z",
    rsvpDeadline: null,
    capacity: null,
    status: "scheduled",
    clonedFromEventId: null,
  },
  {
    id: E.closed,
    groupId: G.climbing,
    title: "가을 MT 사전 답사",
    description: "숙소 후보 두 곳 방문",
    location: "가평",
    startAt: "2026-10-07T01:00:00.000Z",
    rsvpDeadline: "2026-10-01T15:00:00.000Z",
    capacity: 4,
    status: "closed",
    clonedFromEventId: null,
  },
  {
    id: E.canceled,
    groupId: G.climbing,
    title: "우중 산행",
    description: "태풍 예보로 취소합니다.",
    location: "관악산",
    startAt: "2026-10-04T23:00:00.000Z",
    rsvpDeadline: null,
    capacity: 10,
    status: "canceled",
    clonedFromEventId: null,
  },
  {
    id: E.completed,
    groupId: G.climbing,
    title: "9월 정기 산행",
    description: null,
    location: "도봉산",
    startAt: "2026-09-19T23:00:00.000Z",
    rsvpDeadline: "2026-09-16T15:00:00.000Z",
    capacity: 8,
    status: "completed",
    clonedFromEventId: null,
  },
  {
    id: E.settlementPending,
    groupId: G.climbing,
    title: "8월 번개 모임",
    description: null,
    location: "을지로",
    startAt: "2026-08-22T10:00:00.000Z",
    rsvpDeadline: null,
    capacity: null,
    status: "completed",
    clonedFromEventId: null,
  },
  {
    id: E.settlementLocked,
    groupId: G.climbing,
    title: "여름 MT",
    description: null,
    location: "양평",
    startAt: "2026-07-25T03:00:00.000Z",
    rsvpDeadline: "2026-07-20T15:00:00.000Z",
    capacity: 6,
    status: "completed",
    clonedFromEventId: null,
  },
  {
    id: E.bookClubNext,
    groupId: G.bookClub,
    title: "10월 독서 모임: 『작별하지 않는다』",
    description: null,
    location: "합정 카페",
    startAt: "2026-10-12T05:00:00.000Z",
    rsvpDeadline: "2026-10-10T15:00:00.000Z",
    capacity: 8,
    status: "scheduled",
    clonedFromEventId: null,
  },
] satisfies Event[];

type RsvpRow = [
  eventId: string,
  userId: string,
  status: RsvpStatus,
  respondedAt: string,
  checkedInAt?: string,
];

/**
 * RSVP 행 정의를 도메인 타입으로 바꾼다. 대기자는 응답 시각을 waitlistedAt으로 쓴다.
 */
function toRsvp(
  [eventId, userId, status, respondedAt, checkedInAt]: RsvpRow,
  index: number,
): EventRsvp {
  return {
    id: mockId("rsvp", index + 1),
    eventId,
    userId,
    status,
    respondedAt,
    waitlistedAt: status === "waitlisted" ? respondedAt : null,
    checkedInAt: checkedInAt ?? null,
  };
}

const CHECKED_IN = "2026-09-19T23:05:00.000Z";

const RSVP_ROWS: RsvpRow[] = [
  // 정원 3명 꽉 참 + 서연 대기 1번, 하늘(나간 멤버)은 기록 없음
  [E.overCapacity, U.me, "going", "2026-10-01T01:00:00.000Z"],
  [E.overCapacity, U.minji, "going", "2026-10-01T02:00:00.000Z"],
  [E.overCapacity, U.junho, "going", "2026-10-01T03:00:00.000Z"],
  [E.overCapacity, U.seoyeon, "waitlisted", "2026-10-02T04:00:00.000Z"],
  // 정원 없음: 4명 모두 참석(카풀 시나리오)
  [E.unlimited, U.me, "going", "2026-10-01T05:00:00.000Z"],
  [E.unlimited, U.minji, "going", "2026-10-01T06:00:00.000Z"],
  [E.unlimited, U.junho, "going", "2026-10-01T07:00:00.000Z"],
  [E.unlimited, U.seoyeon, "going", "2026-10-01T08:00:00.000Z"],
  // 마감: 미정·불참 응답 섞임, 준호는 무응답
  [E.closed, U.me, "going", "2026-09-28T01:00:00.000Z"],
  [E.closed, U.minji, "not_going", "2026-09-28T02:00:00.000Z"],
  [E.closed, U.seoyeon, "maybe", "2026-09-29T02:00:00.000Z"],
  // 취소
  [E.canceled, U.me, "going", "2026-09-30T01:00:00.000Z"],
  // 완료: 출석 체크 + 나간 멤버의 과거 기록
  [E.completed, U.me, "going", "2026-09-10T01:00:00.000Z", CHECKED_IN],
  [E.completed, U.minji, "going", "2026-09-10T02:00:00.000Z", CHECKED_IN],
  [E.completed, U.junho, "going", "2026-09-10T03:00:00.000Z", CHECKED_IN],
  [E.completed, U.seoyeon, "going", "2026-09-11T03:00:00.000Z"],
  [E.completed, U.leftMember, "going", "2026-09-11T04:00:00.000Z"],
  // 정산 이벤트 참석자
  [E.settlementPending, U.me, "going", "2026-08-20T01:00:00.000Z"],
  [E.settlementPending, U.minji, "going", "2026-08-20T02:00:00.000Z"],
  [E.settlementPending, U.junho, "going", "2026-08-20T03:00:00.000Z"],
  [E.settlementLocked, U.me, "going", "2026-07-10T01:00:00.000Z"],
  [E.settlementLocked, U.minji, "going", "2026-07-10T02:00:00.000Z"],
  [E.settlementLocked, U.seoyeon, "going", "2026-07-10T03:00:00.000Z"],
  // 독서 모임
  [E.bookClubNext, U.me, "maybe", "2026-10-02T01:00:00.000Z"],
  [E.bookClubNext, U.minji, "going", "2026-10-02T02:00:00.000Z"],
];

export const MOCK_RSVPS = RSVP_ROWS.map(toRsvp) satisfies EventRsvp[];

/** 그룹 공지(고정/일반)와 이벤트 공지 */
export const MOCK_ANNOUNCEMENTS = [
  {
    id: mockId("announcement", 1),
    groupId: G.climbing,
    eventId: null,
    authorId: U.me,
    content: "회비는 매달 5일까지 카카오뱅크 3333-01-1234567로 보내 주세요.",
    isPinned: true,
    createdAt: "2026-09-01T01:00:00.000Z",
  },
  {
    id: mockId("announcement", 2),
    groupId: G.climbing,
    eventId: null,
    authorId: U.minji,
    content: "10월 일정 공유합니다. 정기 산행은 셋째 주 일요일이에요.",
    isPinned: false,
    createdAt: "2026-09-28T01:00:00.000Z",
  },
  {
    id: mockId("announcement", 3),
    groupId: G.climbing,
    eventId: E.overCapacity,
    authorId: U.me,
    content: "집합 장소가 구파발역 1번 출구로 바뀌었어요.",
    isPinned: true,
    createdAt: "2026-10-02T01:00:00.000Z",
  },
  {
    id: mockId("announcement", 4),
    groupId: G.climbing,
    eventId: E.overCapacity,
    authorId: U.minji,
    content: "간식은 각자 챙겨 와 주세요.",
    isPinned: false,
    createdAt: "2026-10-02T02:00:00.000Z",
  },
] satisfies Announcement[];

export const MOCK_EVENT_SCENARIOS = [
  "overCapacity",
  "unlimited",
  "closed",
  "canceled",
  "completed",
] as const;
export type MockEventScenario = (typeof MOCK_EVENT_SCENARIOS)[number];

export type MockEventBundle = {
  event: Event;
  rsvps: EventRsvp[];
  announcements: Announcement[];
};

/**
 * 이벤트 하나와 그 RSVP·이벤트 공지를 묶어 돌려준다. 없는 id면 undefined.
 */
export function getMockEventBundle(
  eventId: string,
): MockEventBundle | undefined {
  const event = MOCK_EVENTS.find((item) => item.id === eventId);
  if (!event) return undefined;
  return {
    event,
    rsvps: MOCK_RSVPS.filter((item) => item.eventId === eventId),
    announcements: MOCK_ANNOUNCEMENTS.filter(
      (item) => item.eventId === eventId,
    ),
  };
}

/**
 * 이벤트 상세 화면(Task 013)용 시나리오. 정원 초과·대기자, 마감, 취소, 정원 없음, 완료 상태를 고른다.
 */
export function getMockEventScenario(
  scenario: MockEventScenario,
): MockEventBundle {
  const bundle = getMockEventBundle(E[scenario]);
  if (!bundle) throw new Error(`더미 이벤트가 없어요: ${scenario}`);
  return bundle;
}

/**
 * 그룹 홈용: 그룹의 이벤트(시작 시각 오름차순)와 그룹 공지(고정 우선, 최신순).
 */
export function getMockGroupHome(groupId: string) {
  const events = MOCK_EVENTS.filter((item) => item.groupId === groupId).sort(
    (a, b) => a.startAt.localeCompare(b.startAt),
  );
  const announcements = MOCK_ANNOUNCEMENTS.filter(
    (item) => item.groupId === groupId && item.eventId === null,
  ).sort(
    (a, b) =>
      Number(b.isPinned) - Number(a.isPinned) ||
      b.createdAt.localeCompare(a.createdAt),
  );
  return { events, announcements };
}

/**
 * 그룹의 다음 예정 이벤트(MOCK_NOW 이후, scheduled 중 가장 이른 것). 대시보드 카드 요약에 쓴다.
 */
export function getMockNextEvent(groupId: string, now: string) {
  return MOCK_EVENTS.filter(
    (item) =>
      item.groupId === groupId &&
      item.status === "scheduled" &&
      item.startAt > now,
  ).sort((a, b) => a.startAt.localeCompare(b.startAt))[0];
}
