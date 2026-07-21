import { NextRequest } from "next/server";
import { createSupabaseClient } from "./supabase-adapter";
import { getNhostAdminSecret } from "./nhost";

export function createSupabaseServerClient(_request: NextRequest) {
  const secret = getNhostAdminSecret();
  return createSupabaseClient(secret);
}
