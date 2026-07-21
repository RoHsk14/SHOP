import { createNhostClient } from "@nhost/nhost-js";

const nhostSubdomain =
  process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || "zkbpzymsaxwshpqiktlc";
const nhostRegion = process.env.NEXT_PUBLIC_NHOST_REGION || "eu-central-1";

export const nhost = createNhostClient({
  subdomain: nhostSubdomain,
  region: nhostRegion,
});

export function getNhostGraphqlUrl() {
  return `https://${nhostSubdomain}.graphql.${nhostRegion}.nhost.run/v1`;
}

export function getNhostAuthUrl() {
  return `https://${nhostSubdomain}.auth.${nhostRegion}.nhost.run/v1`;
}

export function getNhostStorageUrl() {
  return `https://${nhostSubdomain}.storage.${nhostRegion}.nhost.run/v1`;
}

export function getNhostAdminSecret() {
  return process.env.NHOST_ADMIN_SECRET || "";
}
