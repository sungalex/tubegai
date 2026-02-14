import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import Navigation from "./common/components/navigation";
import { Toaster } from "~/common/components/ui/sonner";
import { createSupabaseServerClient } from "~/lib/auth.server";
import "./app.css";

// =============================================================================
// Types
// =============================================================================

export interface UserInfo {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  provider: string | null;
}

// =============================================================================
// Loader
// =============================================================================

export async function loader({ request }: Route.LoaderArgs) {
  // Get current user from session
  let user: UserInfo | null = null;

  try {
    const { supabase } = createSupabaseServerClient(request);
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (authUser) {
      const provider = authUser.app_metadata?.provider ||
        authUser.identities?.[0]?.provider ||
        "email";

      user = {
        id: authUser.id,
        email: authUser.email ?? null,
        name: authUser.user_metadata?.full_name ?? authUser.user_metadata?.name ?? null,
        avatarUrl: authUser.user_metadata?.avatar_url ?? null,
        provider,
      };
    }
  } catch (error) {
    console.error("[Root] Error getting user:", error);
  }

  return {
    user,
    ENV: {
      SUPABASE_URL: process.env.SUPABASE_URL!,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!,
    },
  };
}

// =============================================================================
// Links
// =============================================================================

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
  {
    rel: "icon",
    type: "image/png",
    href: "/favicon.png",
  },
];

// =============================================================================
// Layout
// =============================================================================

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Toaster />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

// =============================================================================
// App Component
// =============================================================================

export default function App({ loaderData }: Route.ComponentProps) {
  const { user, ENV } = loaderData;

  return (
    <>
      {/* Expose ENV to client-side JavaScript */}
      <script
        dangerouslySetInnerHTML={{
          __html: `window.ENV = ${JSON.stringify(ENV)}`,
        }}
      />
      <div className="py-20">
        <Navigation
          user={user}
          hasNotifications={false}
          hasMessages={false}
        />
        <Outlet />
      </div>
    </>
  );
}

// =============================================================================
// Error Boundary
// =============================================================================

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "오류!";
  let details = "예기치 않은 오류가 발생했습니다.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "오류";
    details =
      error.status === 404
        ? "요청하신 페이지를 찾을 수 없습니다."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
