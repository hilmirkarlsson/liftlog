import { useState } from "react";
import { useLiftLog } from "../lib/state.jsx";
import { useToast } from "../lib/toast.jsx";
import { pendingCount } from "../lib/sync.js";

function exportData(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "liftlog-backup-" + new Date().toISOString().slice(0, 10) + ".json";
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function Settings() {
  const { getSettings, updateSettings, getExercises, addExercise, getSplits, syncNow: syncWithDrive } = useLiftLog();
  const showToast = useToast();
  const settings = getSettings();
  const [apiBase, setApiBase] = useState(settings.apiBase || "");
  const [anthropicKey, setAnthropicKey] = useState(settings.anthropicApiKey || "");
  const [pending, setPending] = useState(pendingCount());

  async function syncNow() {
    showToast("Syncing…");
    const res = await syncWithDrive();
    setPending(pendingCount());
    if (res) showToast(`${res.synced} synced, ${res.pending} still pending`);
  }

  function addNewExercise() {
    const name = prompt("New exercise name:");
    if (name) addExercise(name);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-line bg-surface p-4 shadow-card">
        <h2 className="mb-2 font-semibold text-ink">AI Coach</h2>
        <p className="mb-3 text-sm text-ink-muted">
          Paste your Anthropic API key to power the Coach tab with Claude. Without a key the coach
          still works using on-device analysis. The key is stored only in this browser and sent only
          to the Anthropic API.
        </p>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink-secondary">Anthropic API key</span>
          <input
            type="password"
            placeholder="sk-ant-…"
            autoComplete="off"
            value={anthropicKey}
            onChange={(e) => setAnthropicKey(e.target.value)}
            onBlur={(e) => updateSettings({ anthropicApiKey: e.target.value.trim() })}
            className="rounded-lg border border-border-input bg-surface-input px-3 py-2.5 outline-none focus:border-accent"
          />
        </label>
      </div>

      <div className="rounded-xl border border-line bg-surface p-4 shadow-card">
        <h2 className="mb-2 font-semibold text-ink">Dashboard sync</h2>
        <p className="mb-3 text-sm text-ink-muted">
          Paste your Dashboard API URL to push finished sessions to your Health card and Obsidian daily note.
        </p>
        <label className="mb-3 flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink-secondary">API base URL</span>
          <input
            type="url"
            placeholder="https://…"
            value={apiBase}
            onChange={(e) => setApiBase(e.target.value)}
            onBlur={(e) => updateSettings({ apiBase: e.target.value.trim() })}
            className="rounded-lg border border-border-input bg-surface-input px-3 py-2.5 outline-none focus:border-accent"
          />
        </label>
        <div className="mb-3 text-sm text-ink-muted">{pending} session(s) waiting to sync</div>
        <button
          type="button"
          onClick={syncNow}
          className="w-full rounded-lg bg-surface-muted-alt py-2.5 text-sm font-medium text-ink transition-colors hover:bg-border"
        >
          Sync now
        </button>
      </div>

      <div className="rounded-xl border border-line bg-surface p-4 shadow-card">
        <h2 className="mb-2 font-semibold text-ink">Exercises</h2>
        <div className="mb-3 flex flex-col gap-1">
          {getExercises().map((ex) => (
            <div key={ex.id} className="rounded-lg px-3 py-2 text-sm text-ink-secondary">
              {ex.name}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addNewExercise}
          className="w-full rounded-lg bg-accent-soft py-2.5 text-sm font-medium text-accent transition-opacity hover:opacity-90"
        >
          + Add exercise
        </button>
      </div>

      <div className="rounded-xl border border-line bg-surface p-4 shadow-card">
        <h2 className="mb-2 font-semibold text-ink">Training split</h2>
        <div className="text-sm text-ink-muted">{getSplits().join(" · ")}</div>
      </div>

      <div className="rounded-xl border border-line bg-surface p-4 shadow-card">
        <h2 className="mb-2 font-semibold text-ink">Backup</h2>
        <ExportButton />
      </div>
    </div>
  );
}

function ExportButton() {
  const { getState } = useLiftLog();
  return (
    <button
      type="button"
      onClick={() => exportData(getState())}
      className="w-full rounded-lg bg-surface-muted-alt py-2.5 text-sm font-medium text-ink transition-colors hover:bg-border"
    >
      Export data (JSON)
    </button>
  );
}
