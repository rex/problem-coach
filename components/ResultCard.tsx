import { StepOutput } from "@/lib/types";

type ResultCardProps = {
  output: StepOutput;
  index: number;
  collapsed: boolean;
  onToggle: () => void;
  onCopy: () => void;
  durationLabel?: string;
};

export function ResultCard({
  output,
  index,
  collapsed,
  onToggle,
  onCopy,
  durationLabel
}: ResultCardProps) {
  return (
    <div
      className="animate-float-up rounded-3xl border border-white/10 bg-ink-900/70 p-6 shadow-soft"
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white">{output.title}</h3>
          {durationLabel ? (
            <p className="mono mt-1 text-[11px] text-slate-500">Duration {durationLabel}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCopy}
            className="rounded-full border border-white/15 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-300 transition hover:border-white/40"
          >
            Copy
          </button>
          <button
            type="button"
            onClick={onToggle}
            className="rounded-full border border-emerald-300/30 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-emerald-200 transition hover:border-emerald-300/70"
          >
            {collapsed ? "Expand" : "Collapse"}
          </button>
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-200">{output.summary}</p>

      {collapsed ? null : output.bullets.length > 0 ? (
        <div className="mt-5">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Key ideas</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-200">
            {output.bullets.map((item, idx) => (
              <li key={`${item}-${idx}`} className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-300" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {collapsed ? null : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-ink-950/70 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Actions</p>
            {output.actions.length > 0 ? (
              <ul className="mt-3 space-y-2 text-sm text-slate-200">
                {output.actions.map((action, idx) => (
                  <li key={`${action}-${idx}`} className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-300" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs text-slate-500">No actions returned.</p>
            )}
          </div>
          <div className="rounded-2xl border border-white/10 bg-ink-950/70 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Open questions</p>
            {output.questions.length > 0 ? (
              <ul className="mt-3 space-y-2 text-sm text-slate-200">
                {output.questions.map((question, idx) => (
                  <li key={`${question}-${idx}`} className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-300" />
                    <span>{question}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs text-slate-500">No open questions returned.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
