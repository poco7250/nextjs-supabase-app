#!/bin/bash
# Claude Code PostToolUse 훅 - 편집한 파일을 즉시 포맷/린트
#
# Edit/Write 직후 실행된다. Prettier로 포맷하고 ESLint --fix를 적용한 뒤,
# 자동 수정되지 않는 린트 에러가 남아 있으면 exit 2로 Claude에게 피드백한다.

FILE_PATH=$(jq -r '.tool_input.file_path // empty')
[ -z "$FILE_PATH" ] || [ ! -f "$FILE_PATH" ] && exit 0

cd "$CLAUDE_PROJECT_DIR" || exit 0

case "$FILE_PATH" in
  *.ts|*.tsx|*.js|*.jsx|*.mjs|*.cjs)
    npx prettier --write --log-level=warn "$FILE_PATH" >/dev/null 2>&1
    if ! OUTPUT=$(npx eslint --fix --no-warn-ignored "$FILE_PATH" 2>&1); then
      echo "ESLint 에러가 남아 있어. 수정해줘:" >&2
      echo "$OUTPUT" >&2
      exit 2
    fi
    ;;
  *.json|*.css|*.md|*.yml|*.yaml)
    npx prettier --write --log-level=warn --ignore-unknown "$FILE_PATH" >/dev/null 2>&1
    ;;
esac

exit 0
