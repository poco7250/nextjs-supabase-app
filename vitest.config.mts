import { defineConfig } from "vitest/config";

/**
 * 순수 로직(Zod 스키마, 응답 헬퍼, 더미 데이터, 정산 계산 등) 단위 테스트 설정.
 * 테스트 파일은 소스 옆에 `*.test.ts`로 두고, describe/it/expect는 명시적으로 import한다.
 */
export default defineConfig({
  // Vite 8 내장 기능으로 tsconfig의 `@/*` 별칭을 해석한다
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**"],
    coverage: {
      provider: "v8",
      include: ["lib/**/*.ts"],
      exclude: [
        "lib/supabase/database.types.ts",
        "lib/test-utils/**",
        "**/*.test.ts",
      ],
      reporter: ["text", "html"],
    },
  },
});
