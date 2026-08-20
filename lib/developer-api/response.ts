import { NextResponse } from "next/server";

export function apiError(
  message: string,
  status = 400,
  extra: Record<string, unknown> = {},
) {
  return NextResponse.json(
    {
      error: {
        message,
        ...extra,
      },
    },
    { status },
  );
}

export function apiUnauthorized() {
  return apiError(
    "Invalid or missing API key. Provide it via the Authorization header: Authorization: Bearer <key>",
    401,
  );
}

export function apiForbidden() {
  return apiError(
    "This endpoint requires a secret key. Publishable keys can only read products and plans.",
    403,
  );
}

export function apiNotFound(resource = "Resource") {
  return apiError(`${resource} not found.`, 404);
}