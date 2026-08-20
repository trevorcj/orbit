"use server";

import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { generateApiKey } from "@/lib/developer-api/auth";
import { ORBIT_WEBHOOK_EVENT_TYPES } from "@/lib/developer-api/webhooks";

async function resolveOrganisation() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, organisation: null };
  }

  const { data: organisation } = await supabase
    .from("organisations")
    .select("id")
    .eq("user_id", user.id)
    .single();

  return { supabase, user, organisation };
}

export interface DeveloperApiKey {
  id: string;
  name: string;
  type: "publishable" | "secret";
  key: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

export interface DeveloperWebhookEndpoint {
  id: string;
  url: string;
  secret: string;
  events: string[];
  is_active: boolean;
  created_at: string;
}

export interface DeveloperData {
  organisationId: string | null;
  apiKeys: DeveloperApiKey[];
  webhookEndpoints: DeveloperWebhookEndpoint[];
  webhookEvents: string[];
}

export async function getDeveloperData(): Promise<DeveloperData> {
  const { supabase, user, organisation } = await resolveOrganisation();

  if (!user || !organisation) {
    return {
      organisationId: null,
      apiKeys: [],
      webhookEndpoints: [],
      webhookEvents: ORBIT_WEBHOOK_EVENT_TYPES,
    };
  }

  const [keysResult, endpointsResult] = await Promise.all([
    supabase
      .from("api_keys")
      .select("id, name, type, key, created_at, last_used_at, revoked_at")
      .eq("organisation_id", organisation.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("webhook_endpoints")
      .select("id, url, secret, events, is_active, created_at")
      .eq("organisation_id", organisation.id)
      .order("created_at", { ascending: false }),
  ]);

  return {
    organisationId: organisation.id,
    apiKeys: (keysResult.data ?? []) as DeveloperApiKey[],
    webhookEndpoints: (endpointsResult.data ?? []) as DeveloperWebhookEndpoint[],
    webhookEvents: ORBIT_WEBHOOK_EVENT_TYPES,
  };
}

export async function generateNewApiKey(formData: FormData) {
  const { supabase, user, organisation } = await resolveOrganisation();

  if (!user || !organisation) {
    return { success: false, message: "Unauthorized" };
  }

  const name = String(formData.get("name") || "API key").trim();
  const type = formData.get("type") === "publishable" ? "publishable" : "secret";

  const { data, error } = await supabase
    .from("api_keys")
    .insert({
      organisation_id: organisation.id,
      name: name || "API key",
      type,
      key: generateApiKey(type),
    })
    .select("id, name, type, key, created_at")
    .single();

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/dashboard/settings");

  return {
    success: true,
    // The raw key is only returned once on creation
    apiKey: data,
  };
}

export async function revokeApiKey(keyId: string) {
  const { supabase, user, organisation } = await resolveOrganisation();

  if (!user || !organisation) {
    return { success: false, message: "Unauthorized" };
  }

  const { error } = await supabase
    .from("api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", keyId)
    .eq("organisation_id", organisation.id);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function createWebhookEndpoint(formData: FormData) {
  const { supabase, user, organisation } = await resolveOrganisation();

  if (!user || !organisation) {
    return { success: false, message: "Unauthorized" };
  }

  const url = String(formData.get("url") || "").trim();
  const eventsRaw = String(formData.get("events") || "").trim();
  const events = eventsRaw
    ? eventsRaw
        .split(",")
        .map((event) => event.trim())
        .filter((event) => ORBIT_WEBHOOK_EVENT_TYPES.includes(event as never))
    : [];

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return { success: false, message: "Endpoint must be a valid http(s) URL" };
    }
  } catch {
    return { success: false, message: "Endpoint must be a valid http(s) URL" };
  }

  const { data, error } = await supabase
    .from("webhook_endpoints")
    .insert({
      organisation_id: organisation.id,
      url,
      secret: `whsec_${crypto.randomBytes(24).toString("hex")}`,
      events,
    })
    .select("id, url, secret, events, created_at")
    .single();

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/dashboard/settings");

  return {
    success: true,
    endpoint: data,
  };
}

export async function deleteWebhookEndpoint(endpointId: string) {
  const { supabase, user, organisation } = await resolveOrganisation();

  if (!user || !organisation) {
    return { success: false, message: "Unauthorized" };
  }

  const { error } = await supabase
    .from("webhook_endpoints")
    .delete()
    .eq("id", endpointId)
    .eq("organisation_id", organisation.id);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function toggleWebhookEndpoint(endpointId: string, isActive: boolean) {
  const { supabase, user, organisation } = await resolveOrganisation();

  if (!user || !organisation) {
    return { success: false, message: "Unauthorized" };
  }

  const { error } = await supabase
    .from("webhook_endpoints")
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", endpointId)
    .eq("organisation_id", organisation.id);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}