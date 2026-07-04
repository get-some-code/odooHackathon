import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJWT } from "./lib/auth";

// Define matchers for route guarding
const isProtectedRoute = (path: string) => {
  return (
    path.startsWith("/dashboard") ||
    path.startsWith("/profile") ||
    path.startsWith("/attendance") ||
    path.startsWith("/leave") ||
    path.startsWith("/payroll") ||
    path.startsWith("/admin")
  );
};

const isAdminRoute = (path: string) => {
  return path.startsWith("/admin");
};

const isAuthRoute = (path: string) => {
  return path.startsWith("/login") || path.startsWith("/register");
};

export async function middleware(request: NextRequest) {
  const { nextUrl } = request;
  const path = nextUrl.pathname;

  // Retrieve auth token
  const token = request.cookies.get("auth_token")?.value;
  const session = token ? await verifyJWT(token) : null;

  // 1. Handlers for Protected Routes
  if (isProtectedRoute(path)) {
    if (!session) {
      // User is unauthenticated, redirect to login
      const loginUrl = new URL("/login", request.url);
      // Optional: keep redirect URL for post-login redirection
      loginUrl.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(loginUrl);
    }

    if (isAdminRoute(path) && session.role !== "ADMIN") {
      // Non-admins attempting to access admin dashboard redirect to employee dashboard
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // 2. Handlers for Auth Routes (Login / Register)
  if (isAuthRoute(path) && session) {
    // If authenticated user attempts to access login/register, redirect to dashboard based on role
    if (session.role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

// Limit the middleware to run on specific route groups (excluding static assets, next files, api)
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/ (public images)
     * - icons/ (public icons)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|images|icons).*)",
  ],
};
