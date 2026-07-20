// Stylized front/back body figures built from tappable muscle segments.
// Untrained muscle is light gray; recent training fills it red with opacity
// proportional to activation — the only place red appears in the app.
// Photo-based figures can replace the SVGs later without changing the API.
const NEUTRAL = "#e8e8e8";
const RED = "var(--color-activation)";

const sh = (group, el, attrs) => ({ group, el, attrs });

const FRONT = [
  sh("shoulders", "ellipse", { cx: 36, cy: 45, rx: 9, ry: 8 }),
  sh("shoulders", "ellipse", { cx: 84, cy: 45, rx: 9, ry: 8 }),
  sh("chest", "rect", { x: 44, y: 40, width: 15, height: 17, rx: 6 }),
  sh("chest", "rect", { x: 61, y: 40, width: 15, height: 17, rx: 6 }),
  sh("abs", "rect", { x: 50, y: 59, width: 20, height: 26, rx: 6 }),
  sh("obliques", "rect", { x: 43, y: 59, width: 6, height: 22, rx: 3 }),
  sh("obliques", "rect", { x: 71, y: 59, width: 6, height: 22, rx: 3 }),
  sh("biceps", "ellipse", { cx: 30, cy: 66, rx: 6, ry: 11 }),
  sh("biceps", "ellipse", { cx: 90, cy: 66, rx: 6, ry: 11 }),
  sh("forearms", "ellipse", { cx: 26, cy: 92, rx: 5, ry: 13, transform: "rotate(8 26 92)" }),
  sh("forearms", "ellipse", { cx: 94, cy: 92, rx: 5, ry: 13, transform: "rotate(-8 94 92)" }),
  sh("quads", "rect", { x: 45, y: 97, width: 14, height: 42, rx: 7 }),
  sh("quads", "rect", { x: 61, y: 97, width: 14, height: 42, rx: 7 }),
  sh("calves", "rect", { x: 47, y: 143, width: 10, height: 34, rx: 5 }),
  sh("calves", "rect", { x: 63, y: 143, width: 10, height: 34, rx: 5 }),
];

const BACK = [
  sh("traps", "polygon", { points: "60,30 44,46 60,50 76,46" }),
  sh("shoulders", "ellipse", { cx: 34, cy: 47, rx: 8, ry: 7 }),
  sh("shoulders", "ellipse", { cx: 86, cy: 47, rx: 8, ry: 7 }),
  sh("lats", "polygon", { points: "43,50 58,54 58,80 46,77" }),
  sh("lats", "polygon", { points: "77,50 62,54 62,80 74,77" }),
  sh("lowerback", "rect", { x: 53, y: 79, width: 14, height: 13, rx: 4 }),
  sh("triceps", "ellipse", { cx: 30, cy: 66, rx: 6, ry: 11 }),
  sh("triceps", "ellipse", { cx: 90, cy: 66, rx: 6, ry: 11 }),
  sh("forearms", "ellipse", { cx: 26, cy: 92, rx: 5, ry: 13, transform: "rotate(8 26 92)" }),
  sh("forearms", "ellipse", { cx: 94, cy: 92, rx: 5, ry: 13, transform: "rotate(-8 94 92)" }),
  sh("glutes", "ellipse", { cx: 52, cy: 100, rx: 9, ry: 8 }),
  sh("glutes", "ellipse", { cx: 68, cy: 100, rx: 9, ry: 8 }),
  sh("hamstrings", "rect", { x: 45, y: 110, width: 14, height: 32, rx: 7 }),
  sh("hamstrings", "rect", { x: 61, y: 110, width: 14, height: 32, rx: 7 }),
  sh("calves", "ellipse", { cx: 52, cy: 160, rx: 7, ry: 15 }),
  sh("calves", "ellipse", { cx: 68, cy: 160, rx: 7, ry: 15 }),
];

// Head, neck, hands, hips, feet — never highlighted.
const NEUTRAL_PARTS = [
  { el: "circle", attrs: { cx: 60, cy: 15, r: 10 } },
  { el: "rect", attrs: { x: 54, y: 25, width: 12, height: 8, rx: 3 } },
  { el: "circle", attrs: { cx: 23, cy: 109, r: 4 } },
  { el: "circle", attrs: { cx: 97, cy: 109, r: 4 } },
  { el: "rect", attrs: { x: 46, y: 85, width: 28, height: 13, rx: 5 } },
  { el: "ellipse", attrs: { cx: 52, cy: 182, rx: 6, ry: 4 } },
  { el: "ellipse", attrs: { cx: 68, cy: 182, rx: 6, ry: 4 } },
];

function Shape({ el, attrs, fill, stroke, onClick }) {
  const El = el;
  return (
    <El
      {...attrs}
      fill={fill}
      fillOpacity={fill === RED ? undefined : 1}
      stroke={stroke}
      strokeWidth={stroke ? 1.5 : 0}
      onClick={onClick}
      style={onClick ? { cursor: "pointer" } : undefined}
    />
  );
}

function Figure({ shapes, label, activation, selected, onPick }) {
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 120 190" className="w-full max-w-[150px]">
        {NEUTRAL_PARTS.map((p, i) => (
          <Shape key={"n" + i} el={p.el} attrs={p.attrs} fill={NEUTRAL} />
        ))}
        {shapes.map((s, i) => {
          const a = activation[s.group] || 0;
          return (
            <g key={i} opacity={a > 0 ? 0.18 + 0.82 * a : 1}>
              <Shape
                el={s.el}
                attrs={s.attrs}
                fill={a > 0 ? RED : NEUTRAL}
                stroke={selected === s.group ? "#0a0a0a" : null}
                onClick={onPick ? () => onPick(s.group) : undefined}
              />
            </g>
          );
        })}
      </svg>
      <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted">{label}</div>
    </div>
  );
}

export default function MuscleMap({ activation, selected, onPick }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Figure shapes={FRONT} label="Front" activation={activation} selected={selected} onPick={onPick} />
      <Figure shapes={BACK} label="Back" activation={activation} selected={selected} onPick={onPick} />
    </div>
  );
}
