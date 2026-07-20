import { useState } from "react";
import { useLiftLog } from "../lib/state.jsx";
import { useToast } from "../lib/toast.jsx";

function UnlockProgress({ readiness }) {
  const pct = Math.round(
    (Math.min(readiness.daysTracked, readiness.daysNeeded) / readiness.daysNeeded) * 100
  );
  return (
    <div className="rounded-xl border border-line bg-surface p-5 shadow-card">
      <h2 className="mb-1 text-lg font-bold text-ink">Your AI coach is watching</h2>
      <p className="mb-4 text-sm text-ink-secondary">
        Keep logging every set and exercise. After a week of tracking, the coach analyzes how you
        train, tells you what to improve, and calculates targets for each session.
      </p>
      <div className="mb-2 h-2 overflow-hidden rounded-full bg-surface-muted-alt">
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-xs text-ink-muted">
        <span>
          {readiness.daysTracked}/{readiness.daysNeeded} days tracked
        </span>
        <span>
          {readiness.sessionsLogged}/{readiness.sessionsNeeded} sessions · {readiness.setsLogged} sets logged
        </span>
      </div>
    </div>
  );
}

function InsightCard({ insight }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-card">
      <div className="mb-1 text-xs font-bold uppercase tracking-wide text-accent">{insight.area}</div>
      <p className="mb-2 text-sm text-ink">{insight.observation}</p>
      <p className="text-sm text-ink-secondary">→ {insight.recommendation}</p>
    </div>
  );
}

function TargetGroup({ group }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
      <div className="border-b border-line bg-surface-muted px-4 py-2.5 font-semibold text-ink">
        {group.split}
      </div>
      {group.exercises.map((t, i) => (
        <div key={i} className="flex items-start justify-between gap-3 border-b border-line px-4 py-3 last:border-b-0">
          <div className="min-w-0">
            <div className="font-medium text-ink">{t.name}</div>
            <div className="text-xs text-ink-muted">{t.note}</div>
          </div>
          <div className="shrink-0 rounded-lg bg-ink px-3 py-1.5 font-mono text-sm font-bold tabular-nums text-white">
            {t.sets}×{t.reps}
            {t.weight != null ? ` @ ${t.weight}kg` : ""}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Coach() {
  const { getCoach, getCoachReadiness, isCoachStale, getSettings, refreshCoach } = useLiftLog();
  const showToast = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const readiness = getCoachReadiness();
  const coach = getCoach();
  const hasKey = !!getSettings().anthropicApiKey?.trim();

  if (!readiness.ready) return <UnlockProgress readiness={readiness} />;

  async function regenerate(preferLocal) {
    setBusy(true);
    setError(null);
    try {
      const { source } = await refreshCoach({ preferLocal });
      showToast(source === "ai" ? "Plan updated by Claude" : "Plan updated");
    } catch (e) {
      setError(e?.message || "Couldn't reach the AI coach. Check your API key and connection.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-line bg-surface p-4 shadow-card">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="font-semibold text-ink">Coach's plan</h2>
          {coach ? (
            <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-ink-muted">
              {coach.source === "ai" ? "Powered by Claude" : "On-device analysis"}
            </span>
          ) : null}
        </div>
        {coach ? (
          <p className="mb-3 text-sm text-ink-secondary">{coach.plan.weeklyFocus}</p>
        ) : (
          <p className="mb-3 text-sm text-ink-secondary">
            A week of training is logged — generate your first plan. It reads every set you've
            tracked, tells you what to improve, and calculates what to hit next session.
          </p>
        )}
        {coach && isCoachStale() ? (
          <p className="mb-3 rounded-lg bg-accent-soft px-3 py-2 text-xs font-medium text-accent">
            You've logged new sets since this plan — regenerate to build on them.
          </p>
        ) : null}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => regenerate(false)}
            disabled={busy}
            className="flex-1 rounded-xl bg-ink py-3 text-xs font-bold uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Thinking…" : hasKey ? "Generate with AI" : "Generate plan"}
          </button>
          {hasKey ? (
            <button
              type="button"
              onClick={() => regenerate(true)}
              disabled={busy}
              className="rounded-lg bg-surface-muted-alt px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-border disabled:cursor-not-allowed disabled:opacity-60"
            >
              Offline plan
            </button>
          ) : null}
        </div>
        {!hasKey ? (
          <p className="mt-2 text-xs text-ink-muted">
            Add your Anthropic API key in Settings to upgrade to the smart AI coach — without it the
            plan is computed on-device.
          </p>
        ) : null}
        {error ? <p className="mt-2 text-xs font-medium text-danger">{error}</p> : null}
      </div>

      {coach ? (
        <>
          <div>
            <h2 className="mb-2 px-1 text-sm font-bold uppercase tracking-wide text-ink-muted">
              What to improve
            </h2>
            <div className="flex flex-col gap-3">
              {coach.plan.insights.map((insight, i) => (
                <InsightCard key={i} insight={insight} />
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-2 px-1 text-sm font-bold uppercase tracking-wide text-ink-muted">
              Targets for your next sessions
            </h2>
            <div className="flex flex-col gap-3">
              {coach.plan.targets.map((group, i) => (
                <TargetGroup key={i} group={group} />
              ))}
            </div>
            <p className="mt-2 px-1 text-xs text-ink-muted">
              These show up in the Log tab when you start a session — set inputs come pre-filled
              with the target.
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}
