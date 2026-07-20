import { useState } from "react";
import { LiftLogProvider, useLiftLog } from "./lib/state.jsx";
import { ToastProvider } from "./lib/toast.jsx";
import { RestTimerProvider, RestChip } from "./components/RestTimer.jsx";
import { addDays, formatDisplayDate, todayKey } from "./lib/util.js";
import { DumbbellIcon, CoachIcon, StatsIcon, HistoryIcon, SettingsIcon } from "./components/Icons.jsx";
import Log from "./views/Log.jsx";
import Coach from "./views/Coach.jsx";
import Stats from "./views/Stats.jsx";
import History from "./views/History.jsx";
import Settings from "./views/Settings.jsx";

const TABS = [
  { key: "log", label: "Log", Icon: DumbbellIcon },
  { key: "coach", label: "Coach", Icon: CoachIcon },
  { key: "stats", label: "Stats", Icon: StatsIcon },
  { key: "history", label: "History", Icon: HistoryIcon },
  { key: "settings", label: "Settings", Icon: SettingsIcon },
];

function SyncDot() {
  const { getSyncStatus, syncNow } = useLiftLog();
  const [busy, setBusy] = useState(false);
  const sync = getSyncStatus();
  const state = busy || sync.state === "syncing" ? "syncing" : sync.state;

  return (
    <button
      type="button"
      onClick={async () => {
        setBusy(true);
        await syncNow();
        setBusy(false);
      }}
      title={sync.message}
      className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-ink-muted transition-colors hover:text-ink"
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          state === "synced" ? "bg-ink" : state === "syncing" ? "animate-pulse bg-ink-muted" : "bg-border-strong"
        }`}
      />
      {state === "syncing" ? "Syncing" : state === "synced" ? "Synced" : "Pending"}
    </button>
  );
}

function LiftLogShell({ embedded }) {
  const [tab, setTab] = useState("log");
  const [dateKey, setDateKey] = useState(todayKey());

  const view =
    tab === "log" ? (
      <Log dateKey={dateKey} />
    ) : tab === "coach" ? (
      <Coach />
    ) : tab === "stats" ? (
      <Stats />
    ) : tab === "history" ? (
      <History />
    ) : (
      <Settings />
    );

  return (
    <div className={embedded ? "" : "flex min-h-dvh flex-col"}>
      <header className="mb-5 flex items-center justify-between">
        <div className="text-xl font-extrabold uppercase tracking-[0.25em] text-ink">
          Lift<span className="text-ink-muted">log</span>
        </div>
        <SyncDot />
      </header>

      {tab === "log" ? (
        <div className="mb-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setDateKey(addDays(dateKey, -1))}
            aria-label="Previous day"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-secondary transition-colors hover:border-ink"
          >
            ‹
          </button>
          <div className="text-center">
            <div className="text-base font-bold uppercase tracking-[0.15em] text-ink">{formatDisplayDate(dateKey)}</div>
            {dateKey !== todayKey() ? (
              <button
                type="button"
                onClick={() => setDateKey(todayKey())}
                className="text-[10px] font-bold uppercase tracking-[0.15em] text-ink-muted underline underline-offset-2"
              >
                Jump to today
              </button>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setDateKey(addDays(dateKey, 1))}
            aria-label="Next day"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-secondary transition-colors hover:border-ink"
          >
            ›
          </button>
        </div>
      ) : null}

      <div className="flex-1">{view}</div>

      <RestChip />

      <nav className="sticky bottom-0 mt-8 -mx-4 flex border-t border-line bg-surface/95 px-2 pb-[max(env(safe-area-inset-bottom),4px)] pt-1 backdrop-blur sm:mx-0">
        {TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg py-2 transition-colors ${
              tab === key ? "text-ink" : "text-ink-muted hover:text-ink-secondary"
            }`}
          >
            <Icon className="h-6 w-6" strokeWidth={tab === key ? 2.2 : 1.6} />
            <span className={`text-[9px] uppercase tracking-[0.15em] ${tab === key ? "font-bold" : "font-medium"}`}>
              {label}
            </span>
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
        <RestTimerProvider>
          <LiftLogShell embedded={embedded} />
        </RestTimerProvider>
      </ToastProvider>
    </LiftLogProvider>
  );

  if (embedded) return content;

  return <div className="mx-auto max-w-2xl px-4 pt-5">{content}</div>;
}
