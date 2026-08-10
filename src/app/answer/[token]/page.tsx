import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionLang } from "@/lib/i18n/get-lang";
import { InviteAnswerChat } from "./invite-answer-chat";

export default async function AnswerPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: invite } = await admin
    .from("team_invites")
    .select("department, invitee_name")
    .eq("token", token)
    .maybeSingle();

  if (!invite) notFound();

  const lang = await getSessionLang();

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <InviteAnswerChat
        token={token}
        department={invite.department}
        inviteeName={invite.invitee_name}
        lang={lang}
      />
    </div>
  );
}
