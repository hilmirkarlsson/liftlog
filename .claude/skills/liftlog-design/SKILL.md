---
name: liftlog-design
description: The LiftLog monochrome design system — pure black-and-white minimalist workout-app look with red reserved exclusively for muscle activation. Use whenever building or restyling UI in this project (or porting the look to another app) so new screens, components, banners, and graphics match: colors, typography, spacing, buttons, cards, tab bar, modals, body-figure heatmap.
---

# LiftLog design system

A minimalist, monochrome training-app look. Everything is black on white;
**red exists for exactly one meaning: muscle activation.** If a design uses
red for anything else (errors excepted), it's wrong.

## Colors

| Token | Value | Use |
|---|---|---|
| ink | `#0a0a0a` | Text, buttons, active icons, chart lines |
| ink-secondary | `#404040` | Secondary text |
| ink-muted | `#a3a3a3` | Micro-labels, placeholders, inactive tabs |
| surface | `#ffffff` | Background and cards (same white — separation comes from borders, not fills) |
| surface-muted | `#fafafa` / `#f4f4f4` | Input backgrounds, subtle fills |
| border | `#e5e5e5` (strong `#d4d4d4`) | Hairline borders everywhere |
| neutral figure | `#e8e8e8` | Untrained muscle segments |
| **activation** | `#dc2626` | Muscle activation ONLY — heatmap fills, activation legend. Opacity encodes intensity: `0.18 + 0.82 × activation` |
| danger | `#dc2626` | Destructive actions only (delete hover) |

No shadows (`--shadow-card: 0 0 #0000`). No gradients except the single
gray→red activation legend. Never introduce a third hue.

## Typography

- Font: **Plus Jakarta Sans** (weights 400–800); numbers in `font-mono tabular-nums`.
- **Micro-labels**: `text-[9px]`–`text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted` — used for every section title, stat label, and chip.
- **Headings**: `text-2xl font-extrabold uppercase tracking-tight`.
- **Wordmark**: `LIFT` in ink + `LOG` in ink-muted, `font-extrabold uppercase tracking-[0.25em]`.
- **Numbers are heroes**: big mono bold (`font-mono text-lg/2xl font-bold tabular-nums`), units small and muted beside them.

## Components

- **Cards**: `rounded-2xl border border-line bg-surface p-4`. No shadow. Lists inside cards separate rows with `border-b border-line` on each row, `last:border-b-0`.
- **Primary button**: `rounded-xl/2xl bg-ink text-white text-xs font-bold uppercase tracking-[0.2em] py-3+`. Hover: `opacity-90`.
- **Secondary button**: `border border-line text-ink` same type treatment; hover `border-ink` (optionally invert to `bg-ink text-white`).
- **Ghost/danger action**: tiny uppercase underlined text link (`text-[10px] font-bold uppercase tracking-[0.2em] underline underline-offset-2`).
- **Stat bar** (inverted card): `rounded-2xl bg-ink text-white`, cells split by `divide-x divide-white/15`, label in `text-white/50` micro-label, value in mono bold.
- **Chips/pills**: `rounded-full border border-line px-3 py-1.5` with micro-label type; filled variant `bg-ink text-white`.
- **Tab bar**: sticky bottom, `border-t border-line bg-surface/95 backdrop-blur`; 1.6px-stroke line icons (2.2 when active), `text-[9px]` uppercase labels; active = ink, inactive = ink-muted.
- **Modals**: bottom sheet `rounded-t-2xl` (desktop centered `rounded-2xl`); modals containing text inputs use `align="top"` and a max-height driven by `visualViewport` so the keyboard never covers content (see `src/components/Modal.jsx`).
- **Inputs**: `rounded-xl border border-border-input bg-surface-input`, focus ring `focus:border-ink`. Numeric entry pairs the input with −/+ stepper squares (`h-11 w-11 rounded-xl border`).
- **Charts**: single ink-colored line/bars on white; current period bar in ink, past bars in border-strong gray. No grid lines, no fills except activation.

## Body figure (muscle heatmap)

Front/back humanoid built from simple SVG segments (`src/components/MuscleMap.jsx`):
neutral parts (head, hands, hips, feet) in `#e8e8e8`, muscle segments per
group. Activation fills a segment `#dc2626` with group opacity
`0.18 + 0.82 × normalized activation`; untrained segments stay gray.
Selected segment gets a `#0a0a0a` 1.5px stroke. Labels FRONT/BACK in
micro-label type. Reuse these shapes for banners and graphics.

## Voice

Copy is short, imperative, gym-plain: "Start workout", "Log set", "Finish
workout". No emojis in UI chrome. Toasts are single sentences.

## Anti-patterns

- Colors beyond black/white/gray + activation red; blue links; colored icons.
- Drop shadows, glassmorphism, gradients, rounded-full cards.
- Sentence-case section headers (always uppercase micro-labels).
- Emoji in buttons or headers.
- Red used decoratively — if it isn't muscle activation (or a destructive action), it isn't red.
