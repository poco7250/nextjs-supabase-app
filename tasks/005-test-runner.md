# 005. 테스트 러너 도입 및 CI 연결

- ROADMAP: Task 005
- 규모: S | 기능 ID: 품질 기반 (정산 로직 선행 조건) | 의존: Task 001

## 명세

Vitest를 도입해 순수 로직(Zod 스키마, 응답 헬퍼, 더미 데이터 정합성, 이후 정산 계산·`safe-next`)을 단위 테스트로 검증할 수 있게 한다. Task 004에서 일회성 스크립트로만 확인한 계약을 정식 테스트로 옮기고, `npm run check`와 CI에 테스트 단계를 연결한다. Playwright MCP E2E에 쓸 테스트 계정과 시드 절차는 `docs/testing.md`에 정리한다.

결정 사항:

- Vitest 5 + Vite 8이다. `vite`는 Vitest의 필수 peer 의존성이라 직접 설치한다. `@types/node`는 peer 요구에 맞춰 `^22`로 올린다.
- `@/*` 별칭은 Vite 8 내장 `resolve.tsconfigPaths: true`로 해석한다(`vite-tsconfig-paths` 플러그인 불필요).
- 환경은 `node`다. 테스트 파일은 소스 옆 `*.test.ts`이고, `describe`/`it`/`expect`는 명시적으로 import한다(globals 끔).
- `npm run check`에 test를 넣고, pre-commit 훅은 그대로 둔다.
- 테스트 계정은 사용자가 Supabase 대시보드에서 직접 만든다. 비밀번호는 gitignore된 `.env.test.local`에만 둔다.

## 관련 파일

| 파일                              | 구분 | 설명                                                          |
| --------------------------------- | ---- | ------------------------------------------------------------- |
| `package.json`                    | 수정 | vitest·coverage-v8·vite 추가, `@types/node` ^22, 스크립트     |
| `vitest.config.mts`               | 생성 | node 환경, tsconfigPaths, v8 커버리지 (CJS 패키지라 `.mts`)   |
| `tsconfig.json`                   | 수정 | `**/*.mts`를 include에 추가                                   |
| `lib/utils.test.ts`               | 생성 | `cn()` 샘플 테스트                                            |
| `lib/types/action-result.test.ts` | 생성 | `ok`/`fail`/`fromZodError`                                    |
| `lib/validations/*.test.ts`       | 생성 | common·event·expense·payment-account·rsvp 스키마              |
| `lib/test-utils/zod.ts`           | 생성 | 거부 입력의 필드별 메시지를 꺼내는 테스트 헬퍼(커버리지 제외) |
| `lib/mocks/mocks.test.ts`         | 생성 | id 형식·DB 제약·분담 합계·송금 재계산·시나리오                |
| `.github/workflows/ci.yml`        | 수정 | 테스트 단계 추가                                              |
| `docs/testing.md`                 | 생성 | 단위 테스트 규칙, E2E 계정·시드 절차, 브라우저 우회           |
| `CLAUDE.md`                       | 수정 | 테스트 명령어 안내                                            |

## 수락 기준

- [x] 로컬에서 `npm run test`가 통과한다
- [x] 실패하는 테스트가 있으면 `npm run test`가 0이 아닌 코드로 끝나고, CI가 같은 명령을 실행한다
- [x] 테스트에서 `@/` 별칭 import가 해석된다
- [x] `docs/testing.md`에 테스트 계정 3개와 시드 절차가 있다
- [x] `npm run check`(test 포함), `npm run build` 통과

## 구현 단계

- [x] Vitest 설치·설정·샘플 테스트
- [x] Task 004 계약 단위 테스트 이관
- [x] CI 연결과 실패 감지 확인
- [x] testing 문서와 테스트 계정
- [x] 검증 및 로드맵 반영

## 테스트 체크리스트

> 테스트 인프라 작업이라 Playwright 시나리오 대신 Vitest 실행 결과와 계정 로그인 스모크로 확인한다.

- [x] `npm run test` 전체 통과
- [x] 임시 실패 테스트 추가 시 종료 코드 ≠ 0 (확인 후 제거)
- [x] `npm run test:coverage` 리포트 생성
- [x] Zod 거부 케이스(응답 마감 역전, 일반 항목 음수, 분담자 0명·중복, http 토스 링크, 문자 섞인 계좌번호, `waitlisted` 직접 입력)에서 한국어 메시지 확인
- [x] 더미 데이터 송금 요약이 PRD 규칙 재계산과 일치
- [x] 테스트 계정 3개 이메일 로그인 → `/dashboard` 진입

## 변경 사항 요약

- **버전과 의존성**: Vitest 5.0.3, `@vitest/coverage-v8` 5.0.3, Vite 8.3.2를 넣었다.
  - Vitest 5는 `vite`가 필수 peer라 직접 설치했다.
  - `@types/node` peer 요구(`^22` 이상)에 맞춰 `^20`에서 `^22`로 올렸다. `.nvmrc`·`engines`가 이미 Node 22라 영향은 없다.
  - 설치 후 `npm audit`에 high 8건이 나왔다. 모두 기존 `tailwindcss`·`eslint-config-next`의 `braces` 체인이라 이번 범위에서 제외했다.
- **별칭 해석**: `@/*`는 ROADMAP에 적힌 `vite-tsconfig-paths` 대신 Vite 8 내장 `resolve.tsconfigPaths`로 해석한다(의존성 1개 감소).
- **설정 파일**: `vitest.config.ts`는 `package.json`에 `"type": "module"`이 없어서 CJS로 로드됐고, Vite가 `configLoader` 경고를 냈다.
  - `"type": "module"`은 Next·Tailwind 설정까지 영향을 주므로, 설정 파일만 `vitest.config.mts`로 바꿨다.
  - `tsconfig.json` include에 `**/*.mts`를 추가해 타입 체크 대상에 넣었다.
- **테스트 이관**: Task 004 TODO였던 일회성 스모크 스크립트를 정식 테스트 7개 파일로 옮겼다(샘플 포함 8파일 71케이스).
  - 거부 케이스는 `lib/test-utils/zod.ts`의 `fieldErrorsOf`로 화면에 전달될 한국어 메시지까지 검증한다. 이 헬퍼는 커버리지에서 제외한다.
  - 더미 송금액 하나를 일부러 틀리게 바꾸면 해당 테스트만 실패하는 것을 확인했다.
- **CI 연결**: `check`에 test를 붙이고 CI에 테스트 단계를 추가했다. pre-commit 훅은 커밋 속도를 위해 그대로 뒀다.
  - 임시 실패 테스트로 `npm run test` 종료 코드가 1이 되는 것을 확인했다.
  - `npm ci --dry-run`으로 lock 파일 동기화도 확인했다. 원격 CI 실행은 push·PR 때 확인한다.
- **커버리지**: 이번 기준선은 lines 58%다. 모듈별 기준은 해당 Task에서 건다(정산 90%는 Task 025).
- **테스트 계정**: 사용자가 대시보드에서 만든 첫 계정 중 하나가 도메인 오타로 미확인 상태여서 다시 만들었다.
  - 문서에는 역할과 `.env.test.local` 변수명만 적고, 실제 이메일·비밀번호는 저장소에 넣지 않았다.
  - Auth 로그인과 화면 로그인(`/dashboard` 진입) 스모크를 3계정 모두 통과했다. 스크립트가 `.env.test.local`을 직접 읽어서 비밀번호를 출력하지 않았다.
