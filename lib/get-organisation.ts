import { createClient } from "@/lib/supabase/server";

export async function getOrganisation() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      user: null,
      profile: null,
      organisation: null,
    };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, email, first_name, last_name")
    .eq("id", user.id)
    .maybeSingle();

  const { data: organisation, error: organisationError } = await supabase
    .from("organisations")
    .select(
      `
      id,
      name,
      logo_url
      `,
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (organisationError) {
    console.error("ORGANISATION FETCH ERROR:", organisationError);
  }

  return {
    user,
    profile,
    organisation,
  };
}
