import { ChangeEvent } from "react";

type InputCardProps = {
  problem: string;
  apiKey: string;
  rememberKey: boolean;
  model: string;
  modelOptions: string[];
  modelsLoading: boolean;
  modelError: string | null;
  serverKeyAvailable: boolean;
  running: boolean;
  onProblemChange: (value: string) => void;
  onApiKeyChange: (value: string) => void;
  onRememberKeyChange: (value: boolean) => void;
  onModelChange: (value: string) => void;
  onRun: () => void;
  onReset: () => void;
};

export function InputCard({
  problem,
  apiKey,
  rememberKey,
  model,
  modelOptions,
  modelsLoading,
  modelError,
  serverKeyAvailable,
  running,
  onProblemChange,
  onApiKeyChange,
  onRememberKeyChange,
  onModelChange,
  onRun,
  onReset
}: InputCardProps) {
  const availableModels = modelOptions.includes(model) ? modelOptions : [model, ...modelOptions];

  return (
    <div className="relative rounded-3xl border border-white/10 bg-ink-900/70 p-8 shadow-soft">
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/5 via-transparent to-transparent" />
      <div className="relative space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/60">Problem Input</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Describe the situation</h2>
          <p className="mt-2 text-sm text-slate-300">
            Give the messy version. The coach will distill, organize, and push toward concrete action.
          </p>
        </div>

        <textarea
          value={problem}
          onChange={(event) => onProblemChange(event.target.value)}
          placeholder="Example: I feel overwhelmed managing my home office, invoices, and my project backlog..."
          className="min-h-[180px] w-full rounded-2xl border border-white/10 bg-ink-950/80 p-4 text-sm text-white shadow-inner focus:border-emerald-300/60 focus:outline-none focus:ring-2 focus:ring-emerald-300/20"
        />

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-300">
            <span>
              OpenAI API key
              {serverKeyAvailable ? " (optional)" : ""}
            </span>
            <input
              type="password"
              value={apiKey}
              onChange={(event: ChangeEvent<HTMLInputElement>) => onApiKeyChange(event.target.value)}
              placeholder={serverKeyAvailable ? "Optional when using .env key" : "sk-..."}
              className="w-full rounded-xl border border-white/10 bg-ink-950/80 px-3 py-2 text-sm text-white focus:border-emerald-300/60 focus:outline-none focus:ring-2 focus:ring-emerald-300/20"
            />
            <p className="text-xs text-slate-500">
              {serverKeyAvailable
                ? "Server key detected from OPENAI_API_KEY. You can still override it here."
                : "Stored locally only if you enable remember."}
            </p>
          </label>

          <label className="space-y-2 text-sm text-slate-300">
            <span>Model</span>
            <select
              value={model}
              onChange={(event: ChangeEvent<HTMLSelectElement>) => onModelChange(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-ink-950/80 px-3 py-2 text-sm text-white focus:border-emerald-300/60 focus:outline-none focus:ring-2 focus:ring-emerald-300/20"
            >
              {availableModels.map((modelId) => (
                <option key={modelId} value={modelId}>
                  {modelId}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500">
              {modelsLoading
                ? "Loading available models..."
                : modelError
                  ? "Could not refresh model list. Showing defaults."
                  : "Models are loaded from your OpenAI account access."}
            </p>
          </label>
        </div>

        <label className="flex items-center gap-3 text-xs text-slate-400">
          <input
            type="checkbox"
            checked={rememberKey}
            onChange={(event) => onRememberKeyChange(event.target.checked)}
            className="h-4 w-4 rounded border-white/10 bg-ink-950/80 text-emerald-400 focus:ring-emerald-300/30"
          />
          Remember API key in local storage on this device
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onRun}
            disabled={running}
            className="group inline-flex items-center gap-2 rounded-full bg-emerald-300 px-6 py-3 text-sm font-semibold text-ink-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:bg-emerald-300/50"
          >
            <span className="h-2.5 w-2.5 rounded-full bg-ink-900/70 transition group-hover:animate-pulse-glow" />
            {running ? "Deep Dive running..." : "Start Deep Dive"}
          </button>
          <button
            type="button"
            onClick={onReset}
            disabled={running}
            className="rounded-full border border-white/15 px-5 py-3 text-xs uppercase tracking-widest text-slate-300 transition hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-40"
          >
            New Session
          </button>
        </div>
      </div>
    </div>
  );
}
