export function Field({
  label,
  name,
  type = "text",
  required = true,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className="block text-start">
      <span className="mb-1.5 block text-sm text-muted">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        className="w-full rounded-lg border px-4 py-2.5 text-ink outline-none transition-colors focus:border-teal-2"
        style={{ background: "var(--glass)", borderColor: "var(--border-g)" }}
      />
    </label>
  );
}
