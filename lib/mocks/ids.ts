/**
 * 더미 데이터용 결정적 id와 기준 시각. 화면 상태가 매번 같게 나오도록 `Math.random`을 쓰지 않는다.
 * id는 `z.uuid()` 검증을 통과하는 v4 형식(버전 4, variant 8)이다.
 */

/** 엔티티별 id 접두 번호. 같은 순번이라도 엔티티가 다르면 id가 겹치지 않는다 */
const ENTITY_CODE = {
  user: 1,
  group: 2,
  member: 3,
  invite: 4,
  event: 5,
  rsvp: 6,
  announcement: 7,
  carpool: 8,
  rider: 9,
  expense: 10,
  share: 11,
  transfer: 12,
} as const;

export type MockEntity = keyof typeof ENTITY_CODE;

/**
 * 엔티티 종류와 순번으로 고정 uuid를 만든다. 예: mockId("user", 1) → "00000000-0000-4000-8001-000000000001"
 */
export function mockId(entity: MockEntity, seq: number): string {
  const code = ENTITY_CODE[entity].toString(16).padStart(3, "0");
  return `00000000-0000-4000-8${code}-${seq.toString(16).padStart(12, "0")}`;
}

/** 더미 데이터의 "지금". 마감 여부·만료 여부는 이 시각 기준으로 정해져 있다 */
export const MOCK_NOW = "2026-10-03T00:00:00.000Z";

export const MOCK_USER_IDS = {
  /** 로그인 사용자(기본 시점) */
  me: mockId("user", 1),
  minji: mockId("user", 2),
  junho: mockId("user", 3),
  seoyeon: mockId("user", 4),
  /** 등반 모임에서 내보낸 멤버. 과거 RSVP·정산 기록만 남아 있다 */
  leftMember: mockId("user", 5),
} as const;

/** 더미 화면의 기본 로그인 사용자 */
export const MOCK_CURRENT_USER_ID = MOCK_USER_IDS.me;

export const MOCK_GROUP_IDS = {
  /** 내가 owner인 그룹. 대부분의 시나리오가 여기 있다 */
  climbing: mockId("group", 1),
  /** 내가 member인 그룹 */
  bookClub: mockId("group", 2),
  /** 내가 아직 가입하지 않은 그룹(초대 수락 시나리오) */
  running: mockId("group", 3),
} as const;

export const MOCK_INVITE_IDS = {
  climbingActive: mockId("invite", 1),
  climbingRevoked: mockId("invite", 2),
  bookClubExpired: mockId("invite", 3),
  runningActive: mockId("invite", 4),
} as const;

export const MOCK_EVENT_IDS = {
  /** 정원 3명이 찼고 대기자 1명 */
  overCapacity: mockId("event", 1),
  /** 정원 없음, 카풀 시나리오 */
  unlimited: mockId("event", 2),
  /** 응답 마감 */
  closed: mockId("event", 3),
  canceled: mockId("event", 4),
  /** 완료 + 정산 "송금 표시" 시나리오 */
  completed: mockId("event", 5),
  /** 완료 + 정산 "정산 전" 시나리오 */
  settlementPending: mockId("event", 6),
  /** 완료 + 정산 "입금 확인·잠금" 시나리오 */
  settlementLocked: mockId("event", 7),
  /** 독서 모임의 다음 이벤트 */
  bookClubNext: mockId("event", 8),
} as const;

export const MOCK_CARPOOL_IDS = {
  /** 민지 운전, 만석 */
  minjiFull: mockId("carpool", 1),
  /** 서연 운전, 내가 탑승 중, 잔여 있음 */
  seoyeonAvailable: mockId("carpool", 2),
  /** 내가 운전 */
  mine: mockId("carpool", 3),
} as const;

export const MOCK_EXPENSE_IDS = {
  augustDinner: mockId("expense", 1),
  augustCafe: mockId("expense", 2),
  septemberParking: mockId("expense", 3),
  septemberSnack: mockId("expense", 4),
  summerLodging: mockId("expense", 5),
  summerGroceries: mockId("expense", 6),
  summerRefund: mockId("expense", 7),
} as const;
