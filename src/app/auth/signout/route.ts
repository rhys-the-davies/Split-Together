import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const next = searchParams.get("next") ?? "/login";

  const supabase = await createClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(new URL(next, request.url));
}
