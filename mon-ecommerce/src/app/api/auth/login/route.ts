import { NextRequest, NextResponse } from "next/server";
import { getNhostAuthUrl, getNhostGraphqlUrl, getNhostAdminSecret } from "@/lib/nhost";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email et mot de passe requis." }, { status: 400 });
    }

    const authUrl = getNhostAuthUrl();
    const graphqlUrl = getNhostGraphqlUrl();
    const adminSecret = getNhostAdminSecret();

    // 1. Tenter la connexion
    let signinRes = await fetch(`${authUrl}/signin/email-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    let signinData = await signinRes.json().catch(() => ({}));

    // 2. Si le compte est marqué unverified-user, validation immédiate et re-tentative
    if (
      !signinRes.ok &&
      (signinData?.error === "unverified-user" ||
        signinData?.message?.toLowerCase().includes("not verified") ||
        signinData?.message?.toLowerCase().includes("unverified"))
    ) {
      try {
        await fetch(graphqlUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-hasura-admin-secret": adminSecret,
          },
          body: JSON.stringify({
            query: `
              mutation VerifyUser($email: citext!) {
                updateUsers(where: { email: { _eq: $email } }, _set: { emailVerified: true }) {
                  returning { id email }
                }
              }
            `,
            variables: { email },
          }),
        });

        // Re-tentative de connexion avec compte validé
        signinRes = await fetch(`${authUrl}/signin/email-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        signinData = await signinRes.json().catch(() => ({}));
      } catch (e) {
        console.error("[login] Error recovering unverified user:", e);
      }
    }

    if (!signinRes.ok || !signinData?.session) {
      const msg = signinData?.message || signinData?.error || "Identifiants invalides.";
      return NextResponse.json({ error: msg }, { status: signinRes.status || 401 });
    }

    return NextResponse.json({
      success: true,
      session: signinData.session,
      user: signinData.session.user,
    });
  } catch (error: any) {
    console.error("[login] Error:", error);
    return NextResponse.json({ error: error.message || "Erreur serveur." }, { status: 500 });
  }
}
