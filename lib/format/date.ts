/**
 * 화면 표시용 날짜 포맷. 서비스 기준 시간대(KST)로 고정해 서버·브라우저 결과가 같게 한다.
 */

const TIME_ZONE = "Asia/Seoul";

const eventDateTimeFormat = new Intl.DateTimeFormat("ko-KR", {
  timeZone: TIME_ZONE,
  month: "long",
  day: "numeric",
  weekday: "short",
  hour: "numeric",
  minute: "2-digit",
});

const dateFormat = new Intl.DateTimeFormat("ko-KR", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "long",
  day: "numeric",
});

/**
 * 이벤트 일시. 예: "10월 18일 (일) 오전 8:00"
 */
export function formatEventDateTime(iso: string): string {
  return eventDateTimeFormat.format(new Date(iso));
}

/**
 * 날짜만. 예: "2026년 6월 1일"
 */
export function formatDate(iso: string): string {
  return dateFormat.format(new Date(iso));
}
