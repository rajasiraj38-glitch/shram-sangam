import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client (safe to use in Client Components)
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";
  return createBrowserClient(url, anonKey);
}

export const supabase = createClient();
