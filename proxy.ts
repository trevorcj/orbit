import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "./lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  const { supabase, response } = createClient(request);

  const path = request.nextUrl.pathname;

  if (
    path.startsWith("/api") ||
    path.startsWith("/checkout") ||
    path.startsWith("/portal") ||
    path.includes(".")
  ) {
    return response;
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("Auth error:", error);
  }

  const publicRoutes = ["/login", "/signup"];

  if (!user) {
    if (!publicRoutes.includes(path)) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return response;
  }

  if (publicRoutes.includes(path)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const { data: organisation } = await supabase
    .from("organisations")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!organisation) {
    if (path !== "/onboarding") {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }

    return response;
  }

  if (path === "/onboarding") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
