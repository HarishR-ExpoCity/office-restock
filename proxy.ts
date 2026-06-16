import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options: CookieOptions };

// Next 16 renamed the `middleware` convention to `proxy` (runs on the Node.js
// runtime by default). This refreshes the Supabase auth session on every
// request and guards /dashboard.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: do not run code between createServerClient and getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Redirect while carrying over any cookies the session refresh just set —
  // otherwise a freshly-refreshed token is dropped and the session can desync.
  const redirectTo = (path: string, withRedirectParam = false) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    if (withRedirectParam) url.searchParams.set("redirect", pathname);
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  };

  // Protect the dashboard: send unauthenticated users to /login.
  if (pathname.startsWith("/dashboard") && !user) {
    return redirectTo("/login", true);
  }

  // Keep signed-in managers out of the login page.
  if (pathname === "/login" && user) {
    return redirectTo("/dashboard");
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
