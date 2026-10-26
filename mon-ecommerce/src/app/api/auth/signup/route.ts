import { NextRequest, NextResponse } from "next/server";
import { getNhostAuthUrl, getNhostGraphqlUrl, getNhostAdminSecret } from "@/lib/nhost";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, shopSlug } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email et mot de passe requis." }, { status: 400 });
    }

    const authUrl = getNhostAuthUrl();
    const graphqlUrl = getNhostGraphqlUrl();
    const adminSecret = getNhostAdminSecret();

    // 1. Inscription du compte utilisateur auprès de Nhost
    const signupRes = await fetch(`${authUrl}/signup/email-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        options: {
          allowedRoles: ["user", "me"],
          defaultRole: "user",
        },
      }),
    });

    const signupData = await signupRes.json().catch(() => ({}));

    if (!signupRes.ok) {
      const msg = signupData?.message || signupData?.error || "";
      if (signupRes.status === 409 || msg.toLowerCase().includes("already") || msg.toLowerCase().includes("exists")) {
        return NextResponse.json({ error: "Cet email est déjà utilisé. Veuillez vous connecter." }, { status: 409 });
      }
      return NextResponse.json({ error: msg || "Erreur lors de l'inscription." }, { status: signupRes.status || 400 });
    }

    // 2. Validation immédiate de l'email via Hasura GraphQL (admin secret)
    // Permet d'éviter le blocage par confirmation email qui n'aboutit jamais
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
                returning {
                  id
                  email
                  emailVerified
                }
              }
            }
          `,
          variables: { email },
        }),
      });
    } catch (verifyErr) {
      console.error("[signup] Error auto-verifying user:", verifyErr);
    }

    // 3. Connexion immédiate pour obtenir une session active complète
    const signinRes = await fetch(`${authUrl}/signin/email-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const signinData = await signinRes.json().catch(() => ({}));

    if (!signinRes.ok || !signinData?.session) {
      return NextResponse.json(
        { error: signinData?.message || "Compte créé, mais échec de la connexion automatique. Veuillez vous connecter." },
        { status: 500 }
      );
    }

    const session = signinData.session;
    const userId = session?.user?.id;

    // 4. Création de la boutique dans settings si shopSlug fourni
    if (shopSlug && userId) {
      try {
        await fetch(graphqlUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-hasura-admin-secret": adminSecret,
          },
          body: JSON.stringify({
            query: `
              mutation CreateInitialSettings($shopSlug: String!, $userId: uuid!) {
                insert_settings_one(
                  object: { shop_slug: $shopSlug, user_id: $userId }
                  on_conflict: { constraint: settings_shop_slug_key, update_columns: [user_id] }
                ) {
                  id
                  shop_slug
                }
              }
            `,
            variables: { shopSlug, userId },
          }),
        });
      } catch (settingsErr) {
        console.error("[signup] Error creating initial settings:", settingsErr);
      }
    }

    return NextResponse.json({
      success: true,
      session,
      user: session?.user,
      shopSlug,
    });
  } catch (error: any) {
    console.error("[signup] Unhandled error:", error);
    return NextResponse.json({ error: error.message || "Erreur serveur inattendue." }, { status: 500 });
  }
}
