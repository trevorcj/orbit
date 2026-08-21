import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ success: false, error: "No image file provided." }, { status: 400 });
    }

    const { data: org } = await supabaseAdmin
      .from("organisations")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!org) {
      return NextResponse.json({ success: false, error: "Organization not found" }, { status: 404 });
    }

    const fileExt = file.name.split(".").pop() || "png";
    const filePath = `orgs/${org.id}-${Date.now()}.${fileExt}`;
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from("avatars")
      .upload(filePath, fileBuffer, {
        upsert: true,
        contentType: file.type || "image/png",
      });

    if (uploadError) {
      console.error("Org logo storage upload failed:", uploadError);
      return NextResponse.json({ success: false, error: uploadError.message }, { status: 500 });
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from("avatars")
      .getPublicUrl(filePath);

    const logoUrl = publicUrlData.publicUrl;

    const { error: updateError } = await supabaseAdmin
      .from("organisations")
      .update({
        logo_url: logoUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", org.id);

    if (updateError) {
      console.error("Failed to update organization logo in DB:", updateError);
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, url: logoUrl });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to upload logo";
    console.error("upload-logo api route exception:", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
