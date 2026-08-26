# GapLens Design Rules

## 6. Sizing, spacing & typography consistency

Enforced app-wide as of the 2026 design-consistency pass. Any new component must follow these.

### Typography scale

One real scale: **12 / 14 / 16 / 20 / 24 / 32 / 48px**. No arbitrary in-between sizes (13px, 15px, 17px, 22px, etc.) anywhere.

- Body text: 15–16px (`text-sm`/`text-base`). Secondary/muted text: 13–14px (`text-sm`). Nothing below 12px anywhere, including fine print, timestamps, or badge labels — use `text-xs`.
- Tailwind's `text-lg`, `text-3xl`, and `text-4xl` are remapped in `globals.css`'s `@theme` block to snap onto this scale (20px / 32px / 32px respectively) rather than their off-scale defaults (18px / 30px / 36px). This means `text-lg` and `text-xl` render identically (both 20px) — that's intentional, not a bug. Don't reach for an arbitrary `text-[Npx]` value; if none of the named steps fit, that's a sign the design itself needs a decision, not a one-off pixel value.
- The PDF export (`src/lib/roadmap/render-html.ts`) is a standalone HTML document with its own hardcoded CSS (no Tailwind, no shared tokens) — it follows the same 12/14/16/20/24/32/48 scale by convention, kept in sync by hand.

### Spacing consistency

Every padding/margin/gap must be a multiple of 4px: 4/8/12/16/24/32/48/64.

- Tailwind's fractional utilities (`-0.5`, `-1.5`, `-2.5`, `-3.5` → 2px/6px/10px/14px) are off-grid and must not be used. Round to the nearest 4px step (in practice: round up — `py-2.5` becomes `py-3`, `gap-1.5` becomes `gap-2`, etc.) rather than introducing a new arbitrary value.
- Elements in a row must share top/bottom edges; related items must align to the same left/start edge.

### Sizing standards

- **Buttons**: 36–44px tall (`py-3`/`py-2` on `text-sm`/`text-xs` gets you there), padding sized to the label, **never full-width on desktop** — use `w-full xl:w-auto` (or the equivalent breakpoint) for any CTA that also appears on a wide viewport. Full-width is fine and expected on mobile.
- **Touch targets**: minimum 44×44px for anything interactive on mobile, minimum 24×24px on desktop. A visually small control (a status dot, a tiny icon button) can still hit 44px by expanding the click area with padding + a matching negative margin (see `StatusDot` in `tool-relationship-map.tsx` for the pattern) rather than growing the visible element.
- **Icons**: inline icons 16–20px, standalone icons (in their own tile/badge/avatar) 24px. No oversized decorative icons (48px+).
- **Section padding**: 64–96px vertical on desktop, 40–56px on mobile for real content sections. Compact elements (footers, thin strips between two already-padded sections) are a reasonable, deliberate exception — don't force padding onto something that isn't a content section just to hit the range.

### One border-radius per role

Three roles, one value each:
- **Pills / dots / avatars / badges** → `rounded-full`
- **Buttons / inputs / small tiles** → `rounded-lg`
- **Cards** (anything using `.glass-card`/`.glass-card-elevated`) → `rounded-2xl`

Chat bubbles, message-composer bars, and dropdown/popover panels are legitimate small additional families (`rounded-xl`) — self-consistent across every place they're used, not a violation, just not one of the three primary roles above.

### Borders & tokens

- Default border color/style everywhere: `var(--border-g)`.
- The one intentional exception is `.glass-card-elevated`'s teal-tinted border, which is itself a named token (`var(--border-elevated)` in `globals.css`) rather than a bare rgba literal at the call site — don't hardcode a new one-off color; add a token if you need a new exception.
- Department-accent colors (the 5 hex values in `src/lib/assessment/departments.ts`) are semantic by design (they color-code a specific department) and are not a token-consistency violation.
- Before hardcoding any new color, spacing, or radius value: check whether `globals.css` already has a token for it. If it should be reused elsewhere, add it as a token instead of inlining it.
