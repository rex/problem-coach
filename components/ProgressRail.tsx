import { STEP_META, STEP_ORDER } from "@/lib/pipeline";
import { StepId, StepState } from "@/lib/types";

const STATUS_STYLES: Record<string, string> = {
  pending: "border-white/10 text-slate-500",
  running: "border-emerald-300/60 text-emerald-200",
  success: "border-emerald-400/70 text-emerald-200",
  error: "border-rose-400/60 text-rose-300"
};

type ProgressRailProps = {
  steps: Record<StepId, StepState>;
  running: boolean;
  onRetry: (stepId: StepId) => void;
};

export function ProgressRail({ steps, running, onRetry }: ProgressRailProps) {
  const formatDuration = (ms?: number) => {
    if (!ms || ms <= 0) return null;
    const seconds = Math.round(ms / 100) / 10;
    return `${seconds}s`;
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-ink-900/60 p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/60">Pipeline</p>
          <h3 className="mt-2 text-lg font-semibold text-white">Signal path</h3>
        </div>
        <span className="mono text-xs text-slate-500">{STEP_ORDER.length} steps</span>
      </div>

      <div className="mt-6 space-y-3">
        {STEP_ORDER.map((stepId) => {
          const step = steps[stepId];
          const meta = STEP_META[stepId];
          const statusStyle = STATUS_STYLES[step.status] ?? STATUS_STYLES.pending;
          return (
            <div
              key={stepId}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-ink-950/70 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-white">{meta.title}</p>
                <p className="text-xs text-slate-400">{meta.subtitle}</p>
                {step.durationMs ? (
                  <p className="mono mt-1 text-[10px] text-slate-500">
                    {formatDuration(step.durationMs)}
                  </p>
                ) : null}
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.3em] ${statusStyle}`}
                >
                  {step.status}
                </span>
                {step.status === "error" ? (
                  <button
                    type="button"
                    disabled={running}
                    onClick={() => onRetry(stepId)}
                    className="rounded-full border border-rose-400/40 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-rose-300 transition hover:border-rose-300 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Retry
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
