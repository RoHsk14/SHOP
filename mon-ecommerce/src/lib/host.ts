export function extractSubdomain(host: string): string | null {
  const cleanHost = host.replace(/:\d+$/, "");

  // Dev/local : sous.localhost ou sous.lvh.me
  for (const suffix of ["localhost", "lvh.me"]) {
    if (cleanHost.endsWith(suffix) && cleanHost !== suffix) {
      return cleanHost.slice(0, cleanHost.length - suffix.length - 1);
    }
  }

  // Production : host avec plus de 2 parties → la 1ère est le sous-domaine
  const parts = cleanHost.split(".");
  if (parts.length > 2) {
    const sub = parts[0];
    if (sub === "www") return null;
    return sub;
  }

  return null;
}
