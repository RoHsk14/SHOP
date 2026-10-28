import { NextRequest, NextResponse } from "next/server";
import { getNhostAuthUrl, getNhostGraphqlUrl, getNhostAdminSecret } from "@/lib/nhost";

const SUPER_ADMIN_EMAILS = ["rodriguehessou14@gmail.com"];

interface HasuraUser {
  id: string;
  email: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  createdAt: string;
  lastSeen?: string | null;
  emailVerified: boolean;
  disabled: boolean;
  defaultRole: string;
  phoneNumber?: string | null;
}

interface HasuraSetting {
  id: string;
  user_id: string;
  shop_slug: string;
  shop_name?: string | null;
  owner_name?: string | null;
  shop_description?: string | null;
  shop_country?: string | null;
  default_currency?: string | null;
  pixel_id?: string | null;
  google_sheet_url?: string | null;
  whatsapp_enabled?: boolean | null;
  whatsapp_group_id?: string | null;
  is_super_admin?: boolean | null;
  created_at: string;
  updated_at?: string | null;
}

interface HasuraOrder {
  id: string;
  shop_slug: string;
  total_price: number;
  currency?: string | null;
  created_at: string;
}

interface HasuraProduct {
  id: string;
  shop_slug: string;
}

async function verifySuperAdmin(request: NextRequest): Promise<{ authorized: boolean; email?: string; userId?: string }> {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    const headerEmail = (request.headers.get("x-user-email") || "").toLowerCase().trim();
    const headerUserId = (request.headers.get("x-user-id") || "").trim();

    const adminSecret = getNhostAdminSecret();
    const gqlUrl = getNhostGraphqlUrl();

    // Strategy 1: Try Nhost /user endpoint if token present
    if (token) {
      try {
        const authUrl = getNhostAuthUrl();
        const res = await fetch(`${authUrl}/user`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });

        if (res.ok) {
          const user = await res.json().catch(() => null);
          if (user?.id) {
            const email = (user.email || "").toLowerCase();
            if (SUPER_ADMIN_EMAILS.includes(email)) {
              return { authorized: true, email, userId: user.id };
            }

            // Check is_super_admin in settings
            const checkRes = await fetch(gqlUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-hasura-admin-secret": adminSecret,
              },
              body: JSON.stringify({
                query: `query CheckAdmin($userId: uuid!) {
                  settings(where: { user_id: { _eq: $userId }, is_super_admin: { _eq: true } }, limit: 1) {
                    id
                  }
                }`,
                variables: { userId: user.id },
              }),
            });
            const checkData = await checkRes.json().catch(() => null);
            if (checkData?.data?.settings?.length > 0) {
              return { authorized: true, email, userId: user.id };
            }
          }
        }
      } catch (e) {
        console.warn("[verifySuperAdmin] /user fetch warning:", e);
      }

      // Strategy 2: If /user failed (e.g. token expired), extract userId from JWT claims
      try {
        const parts = token.split(".");
        if (parts.length === 3) {
          const json = Buffer.from(parts[1], "base64url").toString("utf-8");
          const payload = JSON.parse(json);
          const jwtUserId =
            payload["https://hasura.io/jwt/claims"]?.["x-hasura-user-id"] ||
            payload.sub ||
            payload.id;

          if (jwtUserId) {
            const checkRes = await fetch(gqlUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-hasura-admin-secret": adminSecret,
              },
              body: JSON.stringify({
                query: `query GetUserAndAdminCheck($userId: uuid!) {
                  user(id: $userId) {
                    id
                    email
                    disabled
                  }
                  settings(where: { user_id: { _eq: $userId }, is_super_admin: { _eq: true } }, limit: 1) {
                    id
                  }
                }`,
                variables: { userId: jwtUserId },
              }),
            });
            const checkData = await checkRes.json().catch(() => null);
            const dbUser = checkData?.data?.user;
            const hasAdminSetting = checkData?.data?.settings?.length > 0;

            if (dbUser && !dbUser.disabled) {
              const email = (dbUser.email || "").toLowerCase();
              if (SUPER_ADMIN_EMAILS.includes(email) || hasAdminSetting) {
                return { authorized: true, email, userId: dbUser.id };
              }
            }
          }
        }
      } catch (jwtErr) {
        console.warn("[verifySuperAdmin] JWT decode fallback warning:", jwtErr);
      }
    }

    // Strategy 3: Check headerUserId & headerEmail cross-check with Hasura
    if (headerUserId && headerEmail && SUPER_ADMIN_EMAILS.includes(headerEmail)) {
      const checkRes = await fetch(gqlUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-hasura-admin-secret": adminSecret,
        },
        body: JSON.stringify({
          query: `query VerifyEmailId($userId: uuid!) {
            user(id: $userId) {
              id
              email
              disabled
            }
          }`,
          variables: { userId: headerUserId },
        }),
      });
      const checkData = await checkRes.json().catch(() => null);
      const dbUser = checkData?.data?.user;
      if (dbUser && (dbUser.email || "").toLowerCase() === headerEmail && !dbUser.disabled) {
        return { authorized: true, email: headerEmail, userId: headerUserId };
      }
    }

    return { authorized: false };
  } catch (err) {
    console.error("[api/admin/users] Auth verification error:", err);
    return { authorized: false };
  }
}

export async function GET(request: NextRequest) {
  try {
    const authCheck = await verifySuperAdmin(request);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: "Accès refusé. Droits administrateur requis." }, { status: 403 });
    }

    const adminSecret = getNhostAdminSecret();
    const graphqlUrl = getNhostGraphqlUrl();

    // Query all users, settings, orders, products from Hasura
    const query = `
      query GetAllPlatformUsers {
        users(order_by: { createdAt: desc }) {
          id
          email
          displayName
          avatarUrl
          createdAt
          lastSeen
          emailVerified
          disabled
          defaultRole
          phoneNumber
        }
        settings(order_by: { created_at: desc }) {
          id
          user_id
          shop_slug
          shop_name
          owner_name
          shop_description
          shop_country
          default_currency
          pixel_id
          google_sheet_url
          whatsapp_enabled
          whatsapp_group_id
          is_super_admin
          created_at
          updated_at
        }
        orders {
          id
          shop_slug
          total_price
          currency
          created_at
        }
        products {
          id
          shop_slug
        }
      }
    `;

    const res = await fetch(graphqlUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hasura-admin-secret": adminSecret,
      },
      body: JSON.stringify({ query }),
    });

    const result = await res.json();
    if (result.errors) {
      console.error("[api/admin/users] GraphQL errors:", result.errors);
      return NextResponse.json({ error: "Erreur lors de la récupération des utilisateurs." }, { status: 500 });
    }

    const rawUsers: HasuraUser[] = result.data?.users || [];
    const rawSettings: HasuraSetting[] = result.data?.settings || [];
    const rawOrders: HasuraOrder[] = result.data?.orders || [];
    const rawProducts: HasuraProduct[] = result.data?.products || [];

    // Pre-aggregate orders & products by shop_slug
    const ordersByShop = new Map<string, { count: number; revenue: number }>();
    for (const order of rawOrders) {
      const slug = order.shop_slug;
      if (!slug) continue;
      const current = ordersByShop.get(slug) || { count: 0, revenue: 0 };
      current.count += 1;
      current.revenue += Number(order.total_price) || 0;
      ordersByShop.set(slug, current);
    }

    const productsByShop = new Map<string, number>();
    for (const prod of rawProducts) {
      const slug = prod.shop_slug;
      if (!slug) continue;
      productsByShop.set(slug, (productsByShop.get(slug) || 0) + 1);
    }

    // Map settings by user_id
    const settingsByUser = new Map<string, HasuraSetting[]>();
    for (const setting of rawSettings) {
      const uid = setting.user_id;
      if (!uid) continue;
      const list = settingsByUser.get(uid) || [];
      list.push(setting);
      settingsByUser.set(uid, list);
    }

    // Format rich user list
    let platformTotalRevenue = 0;
    let platformTotalOrders = rawOrders.length;
    let superAdminsCount = 0;
    let merchantsCount = 0;

    const formattedUsers = rawUsers.map((user) => {
      const userSettings = settingsByUser.get(user.id) || [];
      const isKnownSuperAdmin = SUPER_ADMIN_EMAILS.includes((user.email || "").toLowerCase());
      const hasSuperAdminSetting = userSettings.some((s) => s.is_super_admin === true);
      const isSuperAdmin = isKnownSuperAdmin || hasSuperAdminSetting;

      if (isSuperAdmin) superAdminsCount++;
      if (userSettings.length > 0) merchantsCount++;

      let userOrdersCount = 0;
      let userRevenue = 0;
      let userProductsCount = 0;

      const shops = userSettings.map((shop) => {
        const orderStats = ordersByShop.get(shop.shop_slug) || { count: 0, revenue: 0 };
        const prodCount = productsByShop.get(shop.shop_slug) || 0;

        userOrdersCount += orderStats.count;
        userRevenue += orderStats.revenue;
        userProductsCount += prodCount;

        return {
          id: shop.id,
          shop_slug: shop.shop_slug,
          shop_name: shop.shop_name || shop.shop_slug,
          owner_name: shop.owner_name || "",
          shop_description: shop.shop_description || "",
          shop_country: shop.shop_country || "",
          default_currency: shop.default_currency || "XOF",
          pixel_id: shop.pixel_id || null,
          google_sheet_url: shop.google_sheet_url || null,
          whatsapp_enabled: Boolean(shop.whatsapp_enabled),
          is_super_admin: Boolean(shop.is_super_admin),
          created_at: shop.created_at,
          orders_count: orderStats.count,
          products_count: prodCount,
          revenue: orderStats.revenue,
        };
      });

      platformTotalRevenue += userRevenue;

      return {
        id: user.id,
        email: user.email,
        displayName: user.displayName || user.email?.split("@")[0] || "Utilisateur",
        avatarUrl: user.avatarUrl || null,
        createdAt: user.createdAt,
        lastSeen: user.lastSeen || null,
        emailVerified: Boolean(user.emailVerified),
        disabled: Boolean(user.disabled),
        defaultRole: user.defaultRole || "user",
        phoneNumber: user.phoneNumber || null,
        is_super_admin: isSuperAdmin,
        shops,
        total_shops: shops.length,
        total_orders: userOrdersCount,
        total_revenue: userRevenue,
        total_products: userProductsCount,
      };
    });

    const stats = {
      totalUsers: formattedUsers.length,
      verifiedUsers: formattedUsers.filter((u) => u.emailVerified).length,
      merchantsCount,
      superAdminsCount,
      totalShops: rawSettings.length,
      totalOrders: platformTotalOrders,
      totalRevenue: platformTotalRevenue,
      totalProducts: rawProducts.length,
    };

    return NextResponse.json({
      users: formattedUsers,
      stats,
    });
  } catch (error: any) {
    console.error("[api/admin/users] Unexpected error:", error);
    return NextResponse.json({ error: error.message || "Erreur interne" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authCheck = await verifySuperAdmin(request);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: "Accès refusé. Droits administrateur requis." }, { status: 403 });
    }

    const body = await request.json();
    const { userId, action, value } = body;

    if (!userId || !action) {
      return NextResponse.json({ error: "Paramètres manquants (userId, action)" }, { status: 400 });
    }

    const adminSecret = getNhostAdminSecret();
    const graphqlUrl = getNhostGraphqlUrl();

    if (action === "toggle_super_admin") {
      const isSuperAdmin = Boolean(value);
      // Update all settings rows for this user
      const mutation = `
        mutation SetSuperAdmin($userId: uuid!, $isSuperAdmin: Boolean!) {
          update_settings(
            where: { user_id: { _eq: $userId } },
            _set: { is_super_admin: $isSuperAdmin }
          ) {
            affected_rows
          }
        }
      `;
      const res = await fetch(graphqlUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-hasura-admin-secret": adminSecret,
        },
        body: JSON.stringify({
          query: mutation,
          variables: { userId, isSuperAdmin },
        }),
      });

      const resData = await res.json();
      if (resData.errors) {
        return NextResponse.json({ error: resData.errors[0]?.message || "Erreur Hasura" }, { status: 500 });
      }

      return NextResponse.json({ success: true, is_super_admin: isSuperAdmin });
    }

    if (action === "toggle_disabled") {
      const disabled = Boolean(value);
      const mutation = `
        mutation SetUserDisabled($userId: uuid!, $disabled: Boolean!) {
          updateUsers(
            where: { id: { _eq: $userId } },
            _set: { disabled: $disabled }
          ) {
            affected_rows
          }
        }
      `;
      const res = await fetch(graphqlUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-hasura-admin-secret": adminSecret,
        },
        body: JSON.stringify({
          query: mutation,
          variables: { userId, disabled },
        }),
      });

      const resData = await res.json();
      if (resData.errors) {
        return NextResponse.json({ error: resData.errors[0]?.message || "Erreur Hasura" }, { status: 500 });
      }

      return NextResponse.json({ success: true, disabled });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (error: any) {
    console.error("[api/admin/users/PATCH] Error:", error);
    return NextResponse.json({ error: error.message || "Erreur interne" }, { status: 500 });
  }
}
