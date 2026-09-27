import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // console.log 대신 로깅 라이브러리 사용 (warn/error는 허용)
      "no-console": ["warn", { allow: ["warn", "error"] }],
      // `_` 접두사 변수는 의도적으로 사용하지 않는 것으로 간주
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // 타입 import는 `import type`으로 분리해 번들에 섞이지 않게 함
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
    },
  },
  {
    // Tailwind v3 설정 파일은 CommonJS require 플러그인을 사용
    files: ["tailwind.config.ts"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  // 포맷 관련 규칙은 Prettier에 맡기므로 항상 마지막에 둔다
  prettier,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "next-env.d.ts",
    "shrimp_data/**",
    // Supabase CLI/MCP가 생성하는 파일
    "lib/supabase/database.types.ts",
  ]),
]);

export default eslintConfig;
