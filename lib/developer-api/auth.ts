import { supabaseAdmin } from "@/lib/supabase-admin";
import crypto from "crypto";

export type ApiKeyType = "publishable" | "secret";

export interface ApiAuthContext {
  organisationId: string;
  keyId: string;
  keyType: ApiKeyType;
}

/**
 * Extracts the API key from the Authorization header
 * (`Authorization: Bearer sk_live_...`) or the `X-API-Key` header.
 */
function extractApiKey(req: Request): string | null {
  const auth = req.headers.get("authorization");

  if (auth?.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }

  const xApiKey = req.headers.get("x-api-key");

  if (xApiKey) {
    return xApiKey.trim();
  }

  return null;
}

function isRevoked(apiKey: { revoked_at: string | null } | null) {
  return Boolean(apiKey?.revoked_at);
}

/**
 * Validates the request API key and returns the owning organisation.
 *
 * `allowPublishable` controls whether a publishable key is accepted
 * (used by read-only endpoints such as products and plans).
 */
export async function authenticateApiRequest(
  req: Request,
  options: { allowPublishable?: boolean } = {},
): Promise<ApiAuthContext | null> {
  const apiKey = extractApiKey(req);

  if (!apiKey) {
    return null;
  }

  const { data, error } = await supabaseAdmin
    .from("api_keys")
    .select("id, organisation_id, type, revoked_at")
    .eq("key", apiKey)
    .maybeSingle();

  if (error || !data || isRevoked(data)) {
    return null;
  }

  if (data.type === "publishable" && !options.allowPublishable) {
    return null;
  }

  // Touch last_used_at (best effort, non-blocking)
  await supabaseAdmin
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id);

  return {
    organisationId: data.organisation_id,
    keyId: data.id,
    keyType: data.type as ApiKeyType,
  };
}

/**
 * Generates a new Orbit API key.
 */
export function generateApiKey(type: ApiKeyType): string {
  const prefix = type === "publishable" ? "pk_live" : "sk_live";
  const entropy = crypto.randomBytes(24).toString("hex");
  return `${prefix}_${entropy}`;
}

export function apiKeyLabel(type: ApiKeyType): string {
  return type === "publishable" ? "Publishable key" : "Secret key";
}