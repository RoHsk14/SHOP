import { GraphQLClient } from "graphql-request";
import { getNhostGraphqlUrl, getNhostAuthUrl } from "./nhost";

type FilterOp =
  | { type: "eq"; field: string; value: any }
  | { type: "neq"; field: string; value: any }
  | { type: "in"; field: string; value: any[] }
  | { type: "gte"; field: string; value: any }
  | { type: "lte"; field: string; value: any }
  | { type: "gt"; field: string; value: any }
  | { type: "lt"; field: string; value: any }
  | { type: "is"; field: string; value: any }
  | { type: "like"; field: string; value: string }
  | { type: "ilike"; field: string; value: string };

type OrderSpec = { field: string; ascending: boolean };
type CountOption = "exact" | "planned" | "estimated" | null;

function buildWhereClause(filters: FilterOp[]): Record<string, any> {
  const where: Record<string, any> = {};
  for (const f of filters) {
    const v = f.value;
    switch (f.type) {
      case "eq": where[f.field] = { _eq: v }; break;
      case "neq": where[f.field] = { _neq: v }; break;
      case "in": where[f.field] = { _in: v }; break;
      case "gte": where[f.field] = { _gte: v }; break;
      case "lte": where[f.field] = { _lte: v }; break;
      case "gt": where[f.field] = { _gt: v }; break;
      case "lt": where[f.field] = { _lt: v }; break;
      case "is": where[f.field] = v === null ? { _is_null: true } : { _is_null: false }; break;
      case "like": where[f.field] = { _like: v }; break;
      case "ilike": where[f.field] = { _ilike: v }; break;
    }
  }
  return where;
}

function toArgs(filters: FilterOp[], orders: OrderSpec[], limit: number | null, offset: number | null): string {
  const where = buildWhereClause(filters);
  const parts: string[] = [];
  if (Object.keys(where).length > 0) {
    parts.push(`where: ${JSON.stringify(where).replace(/"([^"]+)":/g, "$1:")}`);
  }
  if (orders.length > 0) {
    const obs = orders.map(o => `{${o.field}: ${o.ascending ? "asc" : "desc"}}`).join(", ");
    parts.push(`order_by: [${obs}]`);
  }
  if (limit !== null) parts.push(`limit: ${limit}`);
  if (offset !== null) parts.push(`offset: ${offset}`);
  return parts.length > 0 ? `(${parts.join(", ")})` : "";
}

const KNOWN_COLUMNS: Record<string, string[]> = {
  settings: ["id", "shop_slug", "user_id", "shop_name", "owner_name", "shop_description", "shop_country", "default_currency", "theme_id", "theme_config", "pixel_id", "capi_token", "meta_access_token", "meta_business_account_id", "meta_catalog_id", "google_sheet_url", "google_sheet_columns", "whatsapp_group_id", "whatsapp_enabled", "is_super_admin", "custom_form_fields", "created_at", "updated_at"],
  whatsapp_sessions: ["shop_slug", "status", "phone_number", "last_qr_at", "connected_at", "updated_at", "created_at"],
  products: ["id", "shop_slug", "name", "description", "price", "slug", "sku", "track_stock", "stock_quantity", "images", "status", "barcode", "category", "tags", "created_at", "updated_at"],
  orders: ["id", "shop_slug", "customer_name", "customer_phone", "customer_address", "total_price", "currency", "product_id", "product_name", "quantity", "status", "payment_method", "notes", "created_at", "updated_at"],
  offers: ["id", "shop_slug", "name", "description", "type", "discount_type", "discount_value", "min_quantity", "products", "active", "created_at", "updated_at"],
  visitors: ["id", "session_id", "shop_slug", "is_online", "last_seen", "created_at"],
  admin_devices: ["id", "shop_slug", "push_token", "created_at"],
};

function resolveAllColumns(table: string, _adminSecret: string): string {
  const cols = KNOWN_COLUMNS[table];
  if (!cols) return "id";
  return cols.join("\n");
}

function splitFields(s: string): string[] {
  const result: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "(") depth++;
    else if (s[i] === ")") depth--;
    else if (s[i] === "," && depth === 0) {
      result.push(s.slice(start, i).trim());
      start = i + 1;
    }
  }
  result.push(s.slice(start).trim());
  return result.filter(Boolean);
}

async function buildFields(colString: string, table: string, adminSecret: string): Promise<string> {
  if (colString === "id") return "id";
  const parts = splitFields(colString);
  const expanded = parts.flatMap(c => {
    if (c === "*") return resolveAllColumns(table, adminSecret).split("\n");
    if (c.includes("(") && c.endsWith(")")) {
      const idx = c.indexOf("(");
      return [`${c.slice(0, idx).trim()} { ${c.slice(idx + 1, -1).trim()} }`];
    }
    return [c];
  });
  return expanded.join("\n");
}

class SupabaseQueryBuilder {
  private table: string;
  private method: "select" | "insert" | "update" | "delete" = "select";
  private filters: FilterOp[] = [];
  private orders: OrderSpec[] = [];
  private limitCount: number | null = null;
  private offsetCount: number | null = null;
  private selectedColumns: string = "*";
  private isSingle = false;
  private isMaybeSingle = false;
  private insertData: any = null;
  private updateData: any = null;
  private countOption: CountOption = null;
  private isHead = false;
  private adminSecret: string = "";

  constructor(table: string) { this.table = table; }

  setAdminSecret(secret: string) { this.adminSecret = secret; return this; }

  select(columns?: string, opts?: { count?: CountOption; head?: boolean }) {
    this.method = "select";
    this.selectedColumns = columns || "*";
    if (opts?.count) this.countOption = opts.count;
    if (opts?.head) this.isHead = true;
    return this;
  }
  insert(data: any) { this.method = "insert"; this.insertData = Array.isArray(data) ? data : [data]; return this; }
  update(data: any) { this.method = "update"; this.updateData = data; return this; }
  delete() { this.method = "delete"; return this; }
  eq(f: string, v: any) { this.filters.push({ type: "eq", field: f, value: v }); return this; }
  neq(f: string, v: any) { this.filters.push({ type: "neq", field: f, value: v }); return this; }
  in(f: string, v: any[]) { this.filters.push({ type: "in", field: f, value: v }); return this; }
  contains(f: string, v: any) { this.filters.push({ type: "eq", field: f, value: v }); return this; }
  gte(f: string, v: any) { this.filters.push({ type: "gte", field: f, value: v }); return this; }
  lte(f: string, v: any) { this.filters.push({ type: "lte", field: f, value: v }); return this; }
  gt(f: string, v: any) { this.filters.push({ type: "gt", field: f, value: v }); return this; }
  lt(f: string, v: any) { this.filters.push({ type: "lt", field: f, value: v }); return this; }
  like(f: string, v: string) { this.filters.push({ type: "like", field: f, value: v }); return this; }
  ilike(f: string, v: string) { this.filters.push({ type: "ilike", field: f, value: v }); return this; }
  not(f: string, _: string, v: any) { this.filters.push({ type: "is", field: f, value: v }); return this; }
  order(f: string, o?: { ascending?: boolean }) { this.orders.push({ field: f, ascending: o?.ascending ?? true }); return this; }
  limit(n: number) { this.limitCount = n; return this; }
  offset(n: number) { this.offsetCount = n; return this; }
  single() { this.isSingle = true; return this; }
  maybeSingle() { this.isMaybeSingle = true; return this; }

  private gql(): GraphQLClient {
    const h: Record<string, string> = {};
    if (this.adminSecret) h["x-hasura-admin-secret"] = this.adminSecret;
    const url = typeof window !== "undefined" ? `${window.location.origin}/api/graphql` : getNhostGraphqlUrl();
    return new GraphQLClient(url, { headers: h });
  }

  private async execSelect(): Promise<any> {
    try {
      const client = this.gql();
      const fields = await buildFields(this.selectedColumns, this.table, this.adminSecret);
      const args = toArgs(this.filters, this.orders, this.limitCount, this.offsetCount);

      if (this.isHead && this.countOption === "exact") {
        const q = `query { ${this.table}_aggregate${args ? args.replace(/limit.*?(?=\)|$)/, "") : ""} { aggregate { count } } }`;
        const r: any = await client.request(q);
        return { data: null, count: r[`${this.table}_aggregate`]?.aggregate?.count ?? 0, error: null };
      }

      if (this.countOption === "exact") {
        const countQ = `query { ${this.table}_aggregate${args.replace(/order_by.*?(?=\)|$)/, "").replace(/limit.*?(?=\)|$)/, "").replace(/offset.*?(?=\)|$)/, "")} { aggregate { count } } }`;
        const dataQ = `query { ${this.table}${args} { ${fields} } }`;
        const [cr, dr]: any = await Promise.all([client.request(countQ), client.request(dataQ)]);
        const count = cr[`${this.table}_aggregate`]?.aggregate?.count ?? 0;
        let data = dr[this.table];
        if (this.isSingle) data = data?.[0] ?? null;
        if (this.isMaybeSingle) data = data?.[0] ?? null;
        return { data, count, error: null };
      }

      const q = `query { ${this.table}${args} { ${fields} } }`;
      const r: any = await client.request(q);
      let data = r[this.table];
      if (this.isSingle) {
        data = data?.[0] ?? null;
        if (!data) return { data: null, error: { message: "No rows found" } };
      }
      if (this.isMaybeSingle) data = data?.[0] ?? null;
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err?.response?.errors?.[0]?.message || err.message || "Unknown" } };
    }
  }

  private async execInsert(): Promise<any> {
    try {
      const cols = await resolveAllColumns(this.table, this.adminSecret);
      const q = `mutation($objects: [${this.table}_insert_input!]!) { insert_${this.table}(objects: $objects) { returning { ${cols} } } }`;
      const r: any = await this.gql().request(q, { objects: this.insertData });
      return { data: r[`insert_${this.table}`]?.returning ?? [], error: null };
    } catch (err: any) {
      return { data: null, error: { message: err?.response?.errors?.[0]?.message || err.message || "Unknown" } };
    }
  }

  private async execUpdate(): Promise<any> {
    try {
      const where = buildWhereClause(this.filters);
      const cols = await resolveAllColumns(this.table, this.adminSecret);
      const q = `mutation($where: ${this.table}_bool_exp!, $_set: ${this.table}_set_input!) { update_${this.table}(where: $where, _set: $_set) { returning { ${cols} } } }`;
      const r: any = await this.gql().request(q, { where, _set: this.updateData });
      return { data: r[`update_${this.table}`]?.returning ?? [], error: null };
    } catch (err: any) {
      return { data: null, error: { message: err?.response?.errors?.[0]?.message || err.message || "Unknown" } };
    }
  }

  private async execDelete(): Promise<any> {
    try {
      const where = buildWhereClause(this.filters);
      const cols = await resolveAllColumns(this.table, this.adminSecret);
      const q = `mutation($where: ${this.table}_bool_exp!) { delete_${this.table}(where: $where) { returning { ${cols} } } }`;
      const r: any = await this.gql().request(q, { where });
      return { data: r[`delete_${this.table}`]?.returning ?? [], error: null };
    } catch (err: any) {
      return { data: null, error: { message: err?.response?.errors?.[0]?.message || err.message || "Unknown" } };
    }
  }

  async execute(): Promise<any> {
    switch (this.method) {
      case "select": return this.execSelect();
      case "insert": return this.execInsert();
      case "update": return this.execUpdate();
      case "delete": return this.execDelete();
      default: return { data: null, error: { message: "Unknown method" } };
    }
  }

  then(resolve: (v: any) => void, reject?: (r: any) => void) {
    this.execute().then(resolve, reject);
  }
}

/* ─── Nhost REST helpers ─── */

async function nhostFetch(path: string, options: RequestInit = {}) {
  const url = `${getNhostAuthUrl()}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options.headers as any },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body?.error?.message || body?.message || res.statusText);
  }
  return res.json();
}

/* ─── Session persistence ─── */

const SESSION_KEY = "nhost-auth-session";

function getStoredSession(): any | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setStoredSession(session: any) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {}
}

function clearStoredSession() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {}
}

function toSupabaseSession(s: any) {
  if (!s) return null;
  return {
    access_token: s.accessToken,
    refresh_token: s.refreshToken,
    expires_in: s.accessTokenExpiresIn || 900,
    expires_at: s.accessTokenExpiresAt,
    token_type: "bearer",
    user: {
      id: s.user?.id || "unknown",
      email: s.user?.email || null,
      user_metadata: s.user || {},
      app_metadata: {},
    },
  };
}

/* ─── Auth proxy ─── */
function createAuthProxy() {
  const auth = {
    getSession: async () => {
      if (typeof window !== "undefined") {
        const qs = new URLSearchParams(window.location.search);
        const hashRaw = window.location.hash.replace(/^#/, "");
        const hash = hashRaw ? new URLSearchParams(hashRaw) : null;
        const refreshToken =
          qs.get("refreshToken") ||
          qs.get("refresh_token") ||
          hash?.get("refreshToken") ||
          hash?.get("refresh_token");
        const code = qs.get("code") || hash?.get("code");

        if (refreshToken) {
          try {
            const res = await fetch(`${getNhostAuthUrl()}/token`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refreshToken }),
            });
            const data = await res.json().catch(() => null);
            console.log("[auth] /token status:", res.status, "session?", !!data?.session);
            if (!data?.session && data) console.log("[auth] /token body:", JSON.stringify(data).slice(0, 300));
            if (data?.session) {
              setStoredSession(data.session);
              window.history.replaceState({}, "", window.location.pathname);
              return { data: { session: toSupabaseSession(data.session) }, error: null };
            }
          } catch (err) {
            console.error("[auth] refreshToken exchange failed:", err);
          }
        }

        if (code) {
          try {
            // Nhost PKCE exchange (si applicable)
            const res = await fetch(`${getNhostAuthUrl()}/token/exchange`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ code }),
            });
            const data = await res.json().catch(() => null);
            if (data?.session) {
              setStoredSession(data.session);
              window.history.replaceState({}, "", window.location.pathname);
              return { data: { session: toSupabaseSession(data.session) }, error: null };
            }
          } catch (err) {
            console.error("[auth] code exchange failed:", err);
          }
        }
      }

      const stored = getStoredSession();
      if (stored?.accessToken) {
        return { data: { session: toSupabaseSession(stored) }, error: null };
      }

      return { data: { session: null }, error: null };
    },
    signOut: async () => {
      try {
        const stored = getStoredSession();
        if (stored?.refreshToken) {
          await nhostFetch("/signout", {
            method: "POST",
            body: JSON.stringify({ refreshToken: stored.refreshToken }),
          }).catch(() => {});
        }
      } catch {}
      clearStoredSession();
      return { error: null };
    },
    signInWithOAuth: async ({
      provider,
      options,
    }: {
      provider: string;
      options?: { redirectTo?: string };
    }) => {
      const redirectTo =
        options?.redirectTo || window.location.origin + "/auth/callback";
      if (provider === "google") {
        const url = `${getNhostAuthUrl()}/signin/provider/google?redirectTo=${encodeURIComponent(redirectTo)}`;
        window.location.href = url;
        return { data: null, error: null };
      }
      return {
        data: null,
        error: { message: `Unsupported provider: ${provider}` },
      };
    },
    signInWithPassword: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      try {
        const res = await nhostFetch("/signin/email-password", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        if (res?.session) setStoredSession(res.session);
        return {
          data: {
            user: res?.session?.user,
            session: toSupabaseSession(res?.session),
          },
          error: null,
        };
      } catch (err: any) {
        return { data: null, error: { message: err.message } };
      }
    },
    signUp: async ({
      email,
      password,
      options,
    }: {
      email: string;
      password: string;
      options?: { data?: any };
    }) => {
      try {
        const res = await nhostFetch("/signup/email-password", {
          method: "POST",
          body: JSON.stringify({
            email,
            password,
            options: {
              allowedRoles: ["user", "me"],
              defaultRole: "user",
            },
          }),
        });
        if (res?.session) setStoredSession(res.session);
        return {
          data: {
            user: res?.session?.user,
            session: toSupabaseSession(res?.session),
          },
          error: null,
        };
      } catch (err: any) {
        return { data: null, error: { message: err.message } };
      }
    },
    getUser: async () => {
      try {
        const stored = getStoredSession();
        if (stored?.accessToken) {
          const res = await nhostFetch("/user", {
            headers: {
              Authorization: `Bearer ${stored.accessToken}`,
            } as any,
          });
          return { data: { user: res }, error: null };
        }
        return { data: { user: null }, error: null };
      } catch (err: any) {
        return { data: { user: null }, error: null };
      }
    },
    /** Refresh access token via Nhost refreshToken when expired / near expiry */
    refreshSession: async () => {
      try {
        const stored = getStoredSession();
        if (!stored?.refreshToken) {
          return { data: { session: null }, error: { message: "No refresh token" } };
        }
        const res = await fetch(`${getNhostAuthUrl()}/token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: stored.refreshToken }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.session) {
          // Ne pas effacer la session locale : l'access token peut encore être valide
          return {
            data: { session: null },
            error: {
              message:
                (typeof data?.error === "string" && data.error) ||
                data?.message ||
                `Refresh failed (${res.status})`,
            },
          };
        }
        setStoredSession(data.session);
        return { data: { session: toSupabaseSession(data.session) }, error: null };
      } catch (err: any) {
        return { data: { session: null }, error: { message: err.message } };
      }
    },
    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      auth.getSession().then(({ data }) => {
        if (data?.session) callback("SIGNED_IN", data.session);
      }).catch(() => {});
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
  };
  return auth;
}

/* ─── Storage proxy ─── */
function createStorageProxy() {
  return {
    getBucket: async (_name: string): Promise<{ data: any; error: { message: string } | null }> => {
      return { data: { name: _name, public: true }, error: null };
    },
    createBucket: async (_name: string, _opts: { public: boolean }): Promise<{ data: any; error: { message: string } | null }> => {
      return { data: { name: _name, public: true }, error: null };
    },
    from: (_bucket: string) => ({
      upload: async (path: string, file: any, _opts?: { upsert?: boolean; contentType?: string }) => {
        try {
          let body = file;
          if (file instanceof ArrayBuffer) {
            body = new Blob([file], { type: _opts?.contentType || "application/octet-stream" });
          }
          const formData = new FormData();
          formData.append("file[]", body, path.split("/").pop() || "file");
          const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });
          if (!res.ok) {
            const errBody = await res.json().catch(() => ({}));
            return { data: null, error: { message: errBody?.error?.message || `Upload failed (${res.status})` } };
          }
          const result = await res.json();
          const fileResult = result?.processedFiles?.[0];
          return { data: { path: fileResult?.id || path, id: fileResult?.id }, error: null };
        } catch (err: any) {
          return { data: null, error: { message: err.message || "Upload failed" } };
        }
      },
      getPublicUrl: (path: string) => {
        const url = `/api/files/${path}`;
        return { data: { publicUrl: url } };
      },
    }),
  };
}

/* ─── Main export ─── */
export function createSupabaseClient(adminSecret?: string) {
  return {
    from: (table: string) => {
      const b = new SupabaseQueryBuilder(table);
      if (adminSecret) b.setAdminSecret(adminSecret);
      return b;
    },
    auth: createAuthProxy(),
    storage: createStorageProxy(),
    channel: (_name: string) => ({
      on: (_event: string, _config: any, _callback: (payload: any) => void) => ({ subscribe: () => {} }),
      subscribe: () => {},
    }),
    removeChannel: (_channel: any) => {},
    rpc: async (name: string, params?: any) => {
      try {
        const h: Record<string, string> = {};
        if (adminSecret) h["x-hasura-admin-secret"] = adminSecret;
        const url = typeof window !== "undefined" ? "/api/graphql" : getNhostGraphqlUrl();
        const gql = new GraphQLClient(url, { headers: h });
        const args = params ? `(${Object.entries(params).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(", ")})` : "";
        const r: any = await gql.request(`query { ${name}${args} }`);
        return { data: r[name], error: null };
      } catch (err: any) {
        return { data: null, error: { message: err?.response?.errors?.[0]?.message || err.message || "Unknown" } };
      }
    },
  };
}
