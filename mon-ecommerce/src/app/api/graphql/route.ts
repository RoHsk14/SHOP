import { NextRequest, NextResponse } from "next/server";
import { getNhostGraphqlUrl } from "@/lib/nhost";
import { serviceSupabase } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const queryStr = typeof body?.query === "string" ? body.query : "";

    // Garde-fou automatique : si une mise à jour de theme_config ne contient pas savedThemes,
    // on préserve systématiquement ceux déjà présents en base pour éviter toute perte
    if (queryStr.includes("update_settings") && body?.variables?._set?.theme_config) {
      const incomingThemes = body.variables._set.theme_config.savedThemes;
      if (!incomingThemes || incomingThemes.length === 0) {
        const shopSlug = body.variables?.where?.shop_slug?._eq;
        const id = body.variables?.where?.id?._eq;
        if (shopSlug || id) {
          try {
            const qb = serviceSupabase.from("settings").select("theme_config");
            if (shopSlug) qb.eq("shop_slug", shopSlug);
            if (id) qb.eq("id", id);
            const { data: existing } = await qb.maybeSingle();
            const existingThemes = existing?.theme_config?.savedThemes;
            if (existingThemes && Array.isArray(existingThemes) && existingThemes.length > 0) {
              body.variables._set.theme_config.savedThemes = existingThemes;
            }
            if (existing?.theme_config?.themeName && !body.variables._set.theme_config.themeName) {
              body.variables._set.theme_config.themeName = existing.theme_config.themeName;
            }
          } catch (err) {
            console.warn("[GraphQL Proxy] Erreur vérification savedThemes:", err);
          }
        }
      }
    }

    const nhostUrl = getNhostGraphqlUrl();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const adminSecret = request.headers.get("x-hasura-admin-secret");
    if (adminSecret) headers["x-hasura-admin-secret"] = adminSecret;

    const res = await fetch(nhostUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const text = await res.text();
    try {
      const data = JSON.parse(text);
      return NextResponse.json(data, { status: res.status });
    } catch {
      console.error("GraphQL upstream non-JSON:", res.status, text.slice(0, 300));
      return NextResponse.json(
        {
          errors: [
            {
              message: `GraphQL upstream returned non-JSON (HTTP ${res.status})`,
            },
          ],
        },
        { status: 502 }
      );
    }
  } catch (error: any) {
    console.error("GraphQL proxy error:", error);
    return NextResponse.json(
      { errors: [{ message: error.message || "GraphQL proxy error" }] },
      { status: 500 }
    );
  }
}
