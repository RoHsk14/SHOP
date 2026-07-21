import { createSupabaseClient } from "./supabase-adapter";
import { getNhostAdminSecret } from "./nhost";

const secret = getNhostAdminSecret();

if (!secret) {
  console.warn("Missing NHOST_ADMIN_SECRET — service client will fail");
}

export const serviceSupabase = createSupabaseClient(secret);
