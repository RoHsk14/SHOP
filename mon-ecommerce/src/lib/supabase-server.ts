import { createServerClient } from "@supabase/ssr";
import { NextRequest } from "next/server";

export function createSupabaseServerClient(request: NextRequest) {
  let cookieStore = "";
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-url.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key",
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string) {
          cookieStore += `${name}=${value}; `;
        },
        remove(name: string) {
          cookieStore += `${name}=; Max-Age=0; `;
        },
      },
    }
  );
}
