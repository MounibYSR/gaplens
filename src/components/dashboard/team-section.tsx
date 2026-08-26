import { ConsoleLabel } from "@/components/ui/console-label";
import { appDictionary } from "@/lib/i18n/app-dictionary";
import type { EntryLang } from "@/lib/i18n/entry-dictionary";
import type { Department } from "@/lib/supabase/types";
import { InviteGenerator } from "@/app/dashboard/invite-generator";

type ExistingInvite = {
  id: string;
  department: Department;
  token: string;
  invitee_name: string | null;
  status: string;
};

export function TeamSection({
  lang,
  sessionId,
  existingInvites,
  origin,
}: {
  lang: EntryLang;
  sessionId: string;
  existingInvites: ExistingInvite[];
  origin: string;
}) {
  const nav = appDictionary[lang].dashboardNav;

  return (
    <div className="w-full max-w-md xl:max-w-5xl">
      <ConsoleLabel>{nav.teamBadge}</ConsoleLabel>
      <h1 className="mt-2 mb-4 text-xl font-extrabold text-ink">{nav.team}</h1>

      <div className="grid grid-cols-1 gap-6">
        <InviteGenerator
          sessionId={sessionId}
          existingInvites={existingInvites}
          lang={lang}
          origin={origin}
        />
      </div>
    </div>
  );
}
