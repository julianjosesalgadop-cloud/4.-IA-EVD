import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Redirect to the target page with correct origin (works on localhost and Vercel)
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Redirect to login page with error in case of failure
  return NextResponse.redirect(`${origin}/login?error=auth-code-error`);
}
