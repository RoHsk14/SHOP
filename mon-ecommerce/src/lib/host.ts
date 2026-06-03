export function extractSubdomain(host: string): string | null {
  const cleanHost = host.replace(/:\d+$/, "");
  for (const suffix of ["localhost", "lvh.me"]) {
    if (cleanHost.endsWith(suffix) && cleanHost !== suffix) {
      return cleanHost.slice(0, cleanHost.length - suffix.length - 1);
    }
  }
  return null;
}
