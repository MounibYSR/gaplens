import { redirect } from "next/navigation";
import { LandingPage } from "./landing-page";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;

  if (code) {
    redirect(`/auth/callback?code=${encodeURIComponent(code)}`);
  }

  return <LandingPage />;
}
