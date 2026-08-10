import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateAndSaveRoadmap } from "@/lib/roadmap/generate-and-save";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await context.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const result = await generateAndSaveRoadmap(supabase, sessionId);
  if (!result.ok) {
    return new NextResponse(result.message, { status: result.status });
  }

  return NextResponse.redirect(new URL(`/roadmap/${sessionId}/pdf`, request.url));
}
