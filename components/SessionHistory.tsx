import { Session } from "@/lib/types";

const STATUS_STYLES: Record<string, string> = {
  pending: "border-white/10 text-slate-500",
  running: "border-emerald-300/60 text-emerald-200",
  partial: "border-amber-300/60 text-amber-200",
  success: "border-emerald-400/70 text-emerald-200",
  error: "border-rose-400/60 text-rose-300"
};

function summarizeStatus(session: Session): string {
  const statuses = Object.values(session.steps).map((step) => step.status);
  if (statuses.includes("error")) return "error";
  if (statuses.includes("running")) return "running";
  if (statuses.every((status) => status === "success")) return "success";
  if (statuses.some((status) => status === "success")) return "partial";
  return "pending";
}

type SessionHistoryProps = {
  sessions: Session[];
  activeId?: string;
  onSelect: (session: Session) => void;
  onDelete: (session: Session) => void;
  onExportMarkdown: (session: Session) => void;
  onExportJson: (session: Session) => void;
};

export function SessionHistory({
  sessions,
  activeId,
  onSelect,
  onDelete,
  onExportMarkdown,
  onExportJson
}: SessionHistoryProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-ink-900/60 p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/60">History</p>
          <h3 className="mt-2 text-lg font-semibold text-white">Saved sessions</h3>
        </div>
        <span className="mono text-xs text-slate-500">{sessions.length} total</span>
      </div>

      {sessions.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">No sessions saved yet.</p>
      ) : (
        <div className="mt-5 space-y-3">
          {sessions.map((session) => {
            const status = summarizeStatus(session);
            const statusStyle = STATUS_STYLES[status] ?? STATUS_STYLES.pending;
            const preview = session.problem.length > 90 ? `${session.problem.slice(0, 90)}…` : session.problem;
            return (
              <div
                key={session.id}
                className={`rounded-2xl border border-white/10 bg-ink-950/70 px-4 py-3 ${
                  session.id === activeId ? "ring-1 ring-emerald-300/50" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">{preview || "Untitled session"}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(session.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.3em] ${statusStyle}`}>
                    {status}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSelect(session)}
                    className="rounded-full border border-white/15 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-300 transition hover:border-white/40"
                  >
                    Load
                  </button>
                  <button
                    type="button"
                    onClick={() => onExportMarkdown(session)}
                    className="rounded-full border border-emerald-300/30 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-emerald-200 transition hover:border-emerald-300/70"
                  >
                    Markdown
                  </button>
                  <button
                    type="button"
                    onClick={() => onExportJson(session)}
                    className="rounded-full border border-sky-300/30 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-sky-200 transition hover:border-sky-300/70"
                  >
                    JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(session)}
                    className="rounded-full border border-rose-400/40 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-rose-200 transition hover:border-rose-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
