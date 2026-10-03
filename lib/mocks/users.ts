import type { PaymentAccount, Profile } from "@/lib/types/domain";
import { MOCK_USER_IDS as U } from "./ids";

/** 더미 프로필 5명. leftMember는 등반 모임에서 내보낸 사용자다 */
export const MOCK_PROFILES = [
  {
    id: U.me,
    email: "jiwoo@example.com",
    fullName: "김지우",
    username: null,
    avatarUrl: null,
    bio: null,
  },
  {
    id: U.minji,
    email: "minji@example.com",
    fullName: "이민지",
    username: null,
    avatarUrl: null,
    bio: null,
  },
  {
    id: U.junho,
    email: "junho@example.com",
    fullName: "박준호",
    username: null,
    avatarUrl: null,
    bio: null,
  },
  {
    id: U.seoyeon,
    email: "seoyeon@example.com",
    fullName: "최서연",
    username: null,
    avatarUrl: null,
    bio: null,
  },
  {
    id: U.leftMember,
    email: "haneul@example.com",
    fullName: "정하늘",
    username: null,
    avatarUrl: null,
    bio: null,
  },
] satisfies Profile[];

/** 정산 계좌. 준호는 미등록 상태(계좌 없음 안내 UI 확인용) */
export const MOCK_PAYMENT_ACCOUNTS = [
  {
    userId: U.me,
    bankName: "카카오뱅크",
    bankAccountNumber: "3333-01-1234567",
    tossLink: "https://toss.me/jiwoo",
    updatedAt: "2026-09-01T03:00:00.000Z",
  },
  {
    userId: U.minji,
    bankName: "국민은행",
    bankAccountNumber: "123456-01-234567",
    tossLink: null,
    updatedAt: "2026-09-02T03:00:00.000Z",
  },
  {
    userId: U.seoyeon,
    bankName: null,
    bankAccountNumber: null,
    tossLink: "https://toss.me/seoyeon",
    updatedAt: "2026-09-03T03:00:00.000Z",
  },
  {
    userId: U.leftMember,
    bankName: "신한은행",
    bankAccountNumber: "110-123-456789",
    tossLink: null,
    updatedAt: "2026-08-01T03:00:00.000Z",
  },
] satisfies PaymentAccount[];

/**
 * id로 더미 프로필을 찾는다. 없으면 undefined.
 */
export function getMockProfile(userId: string): Profile | undefined {
  return MOCK_PROFILES.find((profile) => profile.id === userId);
}

/**
 * id로 더미 계좌 정보를 찾는다. 등록하지 않은 사용자는 undefined.
 */
export function getMockPaymentAccount(
  userId: string,
): PaymentAccount | undefined {
  return MOCK_PAYMENT_ACCOUNTS.find((account) => account.userId === userId);
}
