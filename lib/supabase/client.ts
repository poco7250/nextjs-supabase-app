import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

/**
 * 브라우저용 Supabase 클라이언트 생성 (Database 타입 적용)
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
