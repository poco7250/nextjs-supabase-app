# 004. 도메인 타입·Zod 스키마·레이어 구조 및 DB 스키마 설계

- ROADMAP: Task 004
- 규모: M | 기능 ID: 전체 | 의존: Task 001

## 명세

Phase 1~4의 UI Task(007·013·020·024)와 DB Task(008·014·021·026)가 함께 쓸 공통 계약을 만든다. 범위는 도메인 타입, Zod 입력 DTO, Server Action 응답 형식(`ActionResult`), 자체 경량 로거, services/repositories 레이어 규칙, 더미 데이터, 전체 DB 설계 문서다. 마이그레이션·RLS·RPC 구현은 각 Phase에서 하고, 여기서는 설계까지만 한다.

결정 사항:

- 로거는 의존성 없는 자체 구현이다. `console.warn`/`console.error`만 쓰고, 운영에서는 debug/info를 끈다.
- Zod v4를 쓴다. 에러 문구는 `error` 파라미터로 넘기고, 포맷 검증은 `z.uuid()`/`z.url()`/`z.int()`를 쓰며, 메시지는 한국어로 쓴다.
- 도메인 모델은 camelCase다. DB Row(snake_case)는 repository 매퍼가 변환한다. 상태 enum은 `as const` 배열에서 유니온 타입을 파생한다.

## 관련 파일

| 파일                                                                                                                                   | 구분 | 설명                                                     |
| -------------------------------------------------------------------------------------------------------------------------------------- | ---- | -------------------------------------------------------- |
| `package.json`                                                                                                                         | 수정 | `zod@^4` 직접 의존성 추가                                |
| `lib/logger.ts`                                                                                                                        | 생성 | 레벨별 자체 로거                                         |
| `lib/types/action-result.ts`                                                                                                           | 생성 | `ActionResult<T>`, 에러 코드, `ok`/`fail`/`fromZodError` |
| `lib/services/README.md`, `lib/repositories/README.md`                                                                                 | 생성 | 레이어 작성 규칙                                         |
| `lib/types/domain.ts`                                                                                                                  | 생성 | 상태 enum·라벨, 13개 엔티티 타입                         |
| `lib/validations/*.ts`                                                                                                                 | 생성 | 공통 + 도메인별 입력 스키마와 DTO 타입                   |
| `lib/mocks/*.ts`                                                                                                                       | 생성 | 결정적 id, Phase 1~4 UI용 더미 데이터·시나리오           |
| `docs/db-schema.md`                                                                                                                    | 생성 | ERD, 테이블·제약·인덱스, 함수·RPC, RLS 매트릭스          |
| `lib/navigation/tabs.ts`, `lib/mocks/dummy-role.ts`, `components/layout/bottom-tab-nav.tsx`                                            | 수정 | `GroupRole`을 domain으로 이전                            |
| `hooks/use-logout.ts`, `components/route-states/segment-error.tsx`, `app/auth/callback/route.ts`, `components/google-login-button.tsx` | 수정 | `console.error` → logger                                 |

## 수락 기준

- [ ] 모든 더미 데이터가 도메인 타입으로 타입 체크된다 (`satisfies`)
- [ ] `docs/db-schema.md`에 PRD의 12개 신규 테이블과 CHECK·UNIQUE·부분 유니크 제약이 빠짐없이 매핑된다
- [ ] ROADMAP의 헬퍼 함수·RPC(Task 008·014·017·018·021·026)가 시그니처와 함께 설계 문서에 있다
- [x] logger 밖에서 `console.error`/`console.warn` 직접 호출이 없다
- [ ] `npm run check`, `npm run build` 통과

## 구현 단계

- [x] 기반: zod 설치, 로거, ActionResult, 레이어 규칙
- [x] 도메인 타입 정의 및 `GroupRole` 이전
- [x] Zod 입력 스키마 작성
- [ ] Phase 1~4 UI용 더미 데이터 작성
- [ ] DB 스키마 설계 문서 작성
- [ ] 검증 및 로드맵 반영

## 테스트 체크리스트

> API 연동이 없는 작업이라 Playwright 시나리오는 없다. 정적 검증과 스모크 체크로 대신하고, Zod 정식 단위 테스트는 Vitest가 들어오는 Task 005에서 작성한다.

- [ ] `npm run check`, `npm run build` 통과
- [x] 스모크 스크립트(24케이스 통과): 정상 입력은 통과하고, 다음 오류 입력은 거부되며 한국어 메시지가 나온다
  - 응답 마감이 시작보다 늦음
  - 일반 항목 음수 금액
  - 분담자 0명·중복
  - http 토스 링크
  - 문자가 섞인 계좌번호
  - RSVP `waitlisted` 직접 입력
- [x] grep: `type GroupRole =` 정의가 `lib/types/domain.ts`에만 있다
- [ ] grep: 12개 신규 테이블명이 `docs/db-schema.md`의 ERD와 정의 절에 모두 있다
- [ ] 더미 시나리오가 각 UI Task 완료 조건의 상태를 덮는다
  - 007: 그룹·멤버 역할·초대 유효/만료/무효
  - 013: 정원 초과·대기자·마감
  - 020: 만석·잔여·탑승 중·운전자
  - 024: 정산 전·송금 표시·입금 확인·잠금

## 변경 사항 요약

(완료 후 작성)
