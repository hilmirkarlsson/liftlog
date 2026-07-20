import { useState } from "react";
import { LiftLogProvider, useLiftLog } from "./lib/state.jsx";
import { ToastProvider } from "./lib/toast.jsx";
import { addDays, formatDisplayDate, todayKey } from "./lib/util.js";
import Log from "./views/Log.jsx";
import Coach from "./views/Coach.jsx";
import History from "./views/History.jsx";
import Progress from "./views/Progress.jsx";
import Settings from "./views/Settings.jsx";

const TABS = [
  { key: "log", label: "Log" },
  { key: "coach", label: "Coach" },
  { key: "history", label: "History" },
  { key: "progress", label: "Progress" },
  { key: "settings", label: "Settings" },
];

function LiftLogShell({ embedded }) {
  const { getSyncStatus, syncNow } = useLiftLog();
  const [tab, setTab] = useState("log");
  const [dateKey, setDateKey] = useState(todayKey());
  const [syncingNow, setSyncingNow] = useState(false);
  const sync = getSyncStatus();

  async function runSyncNow() {
    setSyncingNow(true);
    await syncNow();
    setSyncingNow(false);
  }

  const view =
    tab === "log" ? (
      <Log dateKey={dateKey} />
    ) : tab === "coach" ? (
      <Coach />
    ) : tab === "history" ? (
      <History />
    ) : tab === "progress" ? (
      <Progress />
    ) : (
      <Settings />
    );

  return (
    <div className={embedded ? "" : "min-h-dvh"}>
      <div className="mb-4 flex items-center justify-between">
        {tab === "log" ? (
          <div className="flex w-full items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setDateKey(addDays(dateKey, -1))}
              aria-label="Previous day"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-ink-secondary transition-colors hover:bg-surface-muted"
            >
              ‹
            </button>
            <div className="text-center">
              <div className="text-lg font-bold text-ink">{formatDisplayDate(dateKey)}</div>
              {dateKey !== todayKey() ? (
                <button
                  type="button"
                  onClick={() => setDateKey(todayKey())}
                  className="text-xs font-medium text-accent"
                >
                  Jump to today
                </button>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setDateKey(addDays(dateKey, 1))}
              aria-label="Next day"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-ink-secondary transition-colors hover:bg-surface-muted"
            >
              ›
            </button>
          </div>
        ) : (
          <h1 className="text-lg font-bold text-ink">{TABS.find((t) => t.key === tab)?.label}</h1>
        )}
      </div>

      <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-2 text-xs shadow-card">
        <div className="min-w-0">
          <div className="font-bold uppercase tracking-wide text-ink-muted">Drive sync</div>
          <div className={`truncate ${sync.state === "synced" ? "font-semibold text-accent" : "font-semibold text-ink-secondary"}`}>
            {sync.message}
          </div>
        </div>
        <button
          type="button"
          onClick={runSyncNow}
          disabled={syncingNow || sync.state === "syncing"}
          className="shrink-0 rounded-lg bg-ink px-3 py-2 font-semibold text-white transition-colors hover:bg-ink-secondary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {syncingNow || sync.state === "syncing" ? "Syncing" : "Sync now"}
        </button>
      </div>

      {view}

      <nav className="sticky bottom-0 mt-6 -mx-4 flex border-t border-line bg-surface px-2 py-1 sm:mx-0 sm:rounded-xl sm:border">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors ${
              tab === t.key ? "text-accent" : "text-ink-muted hover:text-ink-secondary"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

export default function App({ embedded = false }) {
  const content = (
    <LiftLogProvider>
      <ToastProvider>
        <LiftLogShell embedded={embedded} />
      </ToastProvider>
    </LiftLogProvider>
  );

  if (embedded) return content;

  return <div className="mx-auto max-w-2xl px-4 py-6">{content}</div>;
}
