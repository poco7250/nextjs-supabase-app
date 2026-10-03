/**
 * PRD 데이터 모델 기준 도메인 타입. 화면·service는 이 camelCase 모델만 다룬다.
 *
 * - DB 타입(`lib/supabase/database.types.ts`)은 각 DB Task에서 재생성한다. snake_case Row
 *   (`Database['public']['Tables'][...]['Row']`)를 이 모델로 바꾸는 일은 repository 매퍼가 맡는다.
 * - 상태 값 목록은 Zod 스키마(`lib/validations`)와 DB CHECK 제약(`docs/db-schema.md`)이 함께 쓰므로
 *   값을 바꾸면 세 곳을 같이 고친다.
 * - id는 uuid 문자열, 시각은 ISO 8601 문자열, 금액은 원 단위 정수다.
 */

/* ───────────── 상태 값 (DB CHECK와 일치) ───────────── */

/** 그룹 내 역할 */
export const GROUP_ROLES = ["owner", "admin", "member"] as const;
export type GroupRole = (typeof GROUP_ROLES)[number];

/** 이벤트 상태(예정/마감/완료/취소). 주최자가 수동으로만 바꾼다 */
export const EVENT_STATUSES = [
  "scheduled",
  "closed",
  "completed",
  "canceled",
] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

/** RSVP 상태. waitlisted는 서버(RPC)만 정하고 사용자가 직접 고르지 않는다 */
export const RSVP_STATUSES = [
  "going",
  "not_going",
  "maybe",
  "waitlisted",
] as const;
export type RsvpStatus = (typeof RSVP_STATUSES)[number];

/** 카풀 탑승 신청 상태 */
export const CARPOOL_RIDER_STATUSES = ["requested", "canceled"] as const;
export type CarpoolRiderStatus = (typeof CARPOOL_RIDER_STATUSES)[number];

/* ───────────── 한국어 라벨 ───────────── */

export const GROUP_ROLE_LABEL: Record<GroupRole, string> = {
  owner: "소유자",
  admin: "관리자",
  member: "멤버",
};

export const EVENT_STATUS_LABEL: Record<EventStatus, string> = {
  scheduled: "예정",
  closed: "마감",
  completed: "완료",
  canceled: "취소",
};

export const RSVP_STATUS_LABEL: Record<RsvpStatus, string> = {
  going: "참석",
  not_going: "불참",
  maybe: "미정",
  waitlisted: "대기",
};

export const CARPOOL_RIDER_STATUS_LABEL: Record<CarpoolRiderStatus, string> = {
  requested: "신청",
  canceled: "취소",
};

/* ───────────── 엔티티 ───────────── */

/** 사용자 프로필 (기존 profiles 테이블). fullName을 표시 이름으로 쓴다 */
export type Profile = {
  id: string;
  email: string | null;
  fullName: string | null;
  /** MVP UI 미노출 */
  username: string | null;
  /** MVP UI 미노출 */
  avatarUrl: string | null;
  /** MVP UI 미노출 */
  bio: string | null;
};

/** 정산용 계좌 정보 (profiles와 1:1). 정산 상대에게만 RPC로 노출 */
export type PaymentAccount = {
  userId: string;
  bankName: string | null;
  bankAccountNumber: string | null;
  tossLink: string | null;
  updatedAt: string;
};

export type Group = {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
};

export type GroupMember = {
  id: string;
  groupId: string;
  userId: string;
  role: GroupRole;
  joinedAt: string;
};

/** 초대 링크. 그룹당 활성 초대(revokedAt이 null)는 1개 */
export type GroupInvite = {
  id: string;
  groupId: string;
  token: string;
  createdBy: string;
  expiresAt: string | null;
  revokedAt: string | null;
};

export type Event = {
  id: string;
  groupId: string;
  title: string;
  description: string | null;
  location: string | null;
  startAt: string;
  rsvpDeadline: string | null;
  /** null이면 정원 제한 없음 */
  capacity: number | null;
  status: EventStatus;
  clonedFromEventId: string | null;
};

export type EventRsvp = {
  id: string;
  eventId: string;
  userId: string;
  status: RsvpStatus;
  respondedAt: string;
  /** 대기 등록 시각. 승급 순서(오름차순) 기준 */
  waitlistedAt: string | null;
  checkedInAt: string | null;
};

/** 공지. eventId가 null이면 그룹 공지 */
export type Announcement = {
  id: string;
  groupId: string;
  eventId: string | null;
  authorId: string;
  content: string;
  isPinned: boolean;
  /** PRD 외 추가: 고정 공지 다음 최신순 정렬 기준 */
  createdAt: string;
};

export type Carpool = {
  id: string;
  eventId: string;
  driverId: string;
  departurePoint: string;
  departureTime: string;
  seatCount: number;
};

export type CarpoolRider = {
  id: string;
  carpoolId: string;
  riderId: string;
  status: CarpoolRiderStatus;
  requestedAt: string;
};

/** 비용 항목. 일반 항목은 0 이상, isAdjustment가 true인 조정 항목만 음수 허용 */
export type Expense = {
  id: string;
  eventId: string;
  name: string;
  amount: number;
  payerId: string;
  isAdjustment: boolean;
  /** PRD 외 추가: 수정·삭제 권한 판정(결정 필요 사항 6번) */
  createdBy: string;
  /** PRD 외 추가: 항목 목록 정렬 기준 */
  createdAt: string;
};

export type ExpenseShare = {
  id: string;
  expenseId: string;
  userId: string;
  shareAmount: number;
};

/** 사람별 정산 송금 요약. 비용 항목이 바뀔 때마다 재계산된다 */
export type SettlementTransfer = {
  id: string;
  eventId: string;
  fromUserId: string;
  /** 받을 사람(결제자) */
  toUserId: string;
  amount: number;
  transferMarkedAt: string | null;
  confirmedAt: string | null;
};
