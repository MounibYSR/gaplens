import { ConsoleLabel } from "@/components/ui/console-label";

export default function CheckEmailPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <div
        className="w-full max-w-sm rounded-2xl border p-8"
        style={{ background: "var(--glass)", borderColor: "var(--border-g)" }}
      >
        <ConsoleLabel>GAPLENS.PENDING_CONFIRMATION</ConsoleLabel>
        <h1 className="mt-2 mb-2 text-xl font-extrabold text-ink">
          تحقق من بريدك الإلكتروني
        </h1>
        <p className="text-sm text-muted">
          أرسلنا رابط تفعيل إلى بريدك. اضغط عليه لإكمال إنشاء الحساب.
        </p>
      </div>
    </div>
  );
}
