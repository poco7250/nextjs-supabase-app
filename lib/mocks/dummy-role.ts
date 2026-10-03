import type { GroupRole } from "@/lib/types/domain";

/**
 * 하단 탭의 역할별 노출을 확인하기 위한 더미 역할.
 * 값을 "member"로 바꾸면 관리자 탭(이벤트 만들기/멤버/설정)이 사라진다.
 * Task 009에서 실제 멤버 역할 조회로 교체하고 이 파일은 제거한다.
 */
export const DUMMY_GROUP_ROLE: GroupRole = "owner";
