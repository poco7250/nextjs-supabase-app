import { z } from "zod";

/**
 * 입력 스키마가 함께 쓰는 기본 조각. Server Action이 FormData를 객체로 바꿔 넘기는 것을 전제로
 * 빈 문자열 → null, 숫자 문자열 → 숫자, 체크박스("on") → boolean 변환을 여기서 처리한다.
 */

/** 시간대가 없는 일시(datetime-local 입력값)에 붙이는 기본 오프셋. 서비스 기준 시간대는 KST */
export const DEFAULT_TIME_ZONE_OFFSET = "+09:00";

/** 원 단위 금액 상한(1천만 원). 오입력 방지용 */
export const AMOUNT_MAX = 10_000_000;

/**
 * 빈 문자열·undefined를 null로 바꾼다. 선택 입력 필드의 전처리에 쓴다.
 */
function emptyToNull(value: unknown): unknown {
  return value === "" || value === undefined ? null : value;
}

/**
 * 단어 끝 받침에 맞는 조사를 붙인다. 예: withJosa("그룹명", "을/를") → "그룹명을", withJosa("좌석 수", "은/는") → "좌석 수는".
 * 끝 글자가 한글이 아니면 "을(를)"처럼 둘 다 적는다.
 */
export function withJosa(word: string, pair: "을/를" | "은/는" | "이/가") {
  const [withBatchim, withoutBatchim] = pair.split("/");
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  if (code < 0 || code > 11171)
    return `${word}${withBatchim}(${withoutBatchim})`;
  return `${word}${code % 28 === 0 ? withoutBatchim : withBatchim}`;
}

/** uuid 형식 id */
export const uuidSchema = z.uuid({ error: "잘못된 식별자예요." });

/**
 * 필수 텍스트. 앞뒤 공백을 지우고 1자 이상, max자 이하를 요구한다.
 */
export function requiredText(label: string, max: number) {
  return z
    .string({ error: `${withJosa(label, "을/를")} 입력해 주세요.` })
    .trim()
    .min(1, { error: `${withJosa(label, "을/를")} 입력해 주세요.` })
    .max(max, {
      error: `${withJosa(label, "은/는")} ${max}자 이하로 입력해 주세요.`,
    });
}

/**
 * 선택 텍스트. 공백만 있거나 비어 있으면 null이 된다.
 */
export function optionalText(label: string, max: number) {
  return z.preprocess(
    emptyToNull,
    z
      .string()
      .trim()
      .max(max, {
        error: `${withJosa(label, "은/는")} ${max}자 이하로 입력해 주세요.`,
      })
      .transform((value) => (value === "" ? null : value))
      .nullable(),
  );
}

/** 오프셋(Z 또는 ±HH:MM)으로 끝나는지 */
const OFFSET_SUFFIX = /(Z|[+-]\d{2}:\d{2})$/;

/**
 * 오프셋 없는 로컬 일시를 KST로 바꾼다. 초가 없으면(datetime-local) ":00"을 채운다.
 * Zod는 오프셋이 붙은 값에 초를 요구하므로, 결과도 같은 스키마를 다시 통과하는 형식으로 만든다.
 */
function toKstIfLocal(value: string): string {
  if (OFFSET_SUFFIX.test(value)) return value;
  const withSeconds = /T\d{2}:\d{2}$/.test(value) ? `${value}:00` : value;
  return `${withSeconds}${DEFAULT_TIME_ZONE_OFFSET}`;
}

/**
 * 일시(ISO 8601). 오프셋이 없으면 KST로 간주해 +09:00을 붙여 돌려준다.
 * 오프셋이 있는 값은 초까지 있어야 한다(Date.toISOString() 형식).
 */
export function dateTimeSchema(label: string) {
  return z
    .string({ error: `${withJosa(label, "을/를")} 입력해 주세요.` })
    .min(1, { error: `${withJosa(label, "을/를")} 입력해 주세요.` })
    .pipe(
      z.iso.datetime({
        local: true,
        offset: true,
        error: `${label} 형식이 올바르지 않아요.`,
      }),
    )
    .transform(toKstIfLocal);
}

/**
 * 선택 일시. 비어 있으면 null.
 */
export function optionalDateTimeSchema(label: string) {
  return z.preprocess(emptyToNull, dateTimeSchema(label).nullable());
}

/**
 * 원 단위 정수 금액. 문자열 숫자도 받는다. 부호 제한은 각 스키마에서 정한다.
 */
export function wonAmountSchema(label: string) {
  return z.coerce
    .number({ error: `${withJosa(label, "을/를")} 숫자로 입력해 주세요.` })
    .int({ error: `${withJosa(label, "은/는")} 원 단위 정수로 입력해 주세요.` })
    .min(-AMOUNT_MAX, { error: `${withJosa(label, "이/가")} 너무 작아요.` })
    .max(AMOUNT_MAX, {
      error: `${withJosa(label, "은/는")} 1천만 원 이하로 입력해 주세요.`,
    });
}

/**
 * 1 이상 max 이하 정수(정원·좌석 수). 문자열 숫자도 받는다.
 */
export function positiveIntSchema(label: string, max: number) {
  return z.coerce
    .number({ error: `${withJosa(label, "을/를")} 숫자로 입력해 주세요.` })
    .int({ error: `${withJosa(label, "은/는")} 정수로 입력해 주세요.` })
    .min(1, { error: `${withJosa(label, "은/는")} 1 이상이어야 해요.` })
    .max(max, {
      error: `${withJosa(label, "은/는")} ${max} 이하로 입력해 주세요.`,
    });
}

/**
 * 비우면 null(제한 없음)이 되는 양의 정수. 이벤트 정원에 쓴다.
 */
export function optionalPositiveIntSchema(label: string, max: number) {
  return z.preprocess(emptyToNull, positiveIntSchema(label, max).nullable());
}

/** 체크박스 값("on"/"true"/true)을 boolean으로 바꾼다. 없으면 false */
export const checkboxSchema = z.preprocess(
  (value) => value === true || value === "on" || value === "true",
  z.boolean(),
);

/** 비우면 null이 되는 uuid (예: 그룹 공지의 eventId, 복제 원본 이벤트) */
export const optionalUuidSchema = z.preprocess(
  emptyToNull,
  uuidSchema.nullable(),
);
