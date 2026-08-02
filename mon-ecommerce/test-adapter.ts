import { createSupabaseClient } from "./src/lib/supabase-adapter";

const supabase = createSupabaseClient("++Xor),Asu-QKD)1**,inhn!H43X-T=P");

async function test() {
  const { data, error } = await supabase
    .from("orders")
    .select("*, products(name, images)")
    .eq("shop_slug", "test")
    .order("created_at", { ascending: false });
  console.log(JSON.stringify({ data, error }, null, 2));
}

test();
