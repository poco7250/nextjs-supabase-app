-- 스타터 킷 예제 테이블 제거: 앱 코드(app/instruments)는 이미 삭제됐다
-- 참조하는 FK·뷰·함수가 없고, 전용 RLS 정책은 테이블과 함께 삭제된다
drop table if exists public.instruments;
