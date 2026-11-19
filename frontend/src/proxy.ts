import { NextResponse, type NextRequest } from "next/server";

// Must match the backend COOKIE_NAME. This check only gates navigation (UX);
// the API re-validates the JWT on every request, so a forged cookie yields no data.
const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME ?? "dt_session";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE);

  if (pathname === "/login") {
    return hasSession ? NextResponse.redirect(new URL("/dashboard", request.url)) : NextResponse.next();
  }
  if (!hasSession) {
    const url = new URL("/login", request.url);
    if (pathname !== "/") url.searchParams.set("next", pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
