"use client";

import { useEffect, useMemo, useState } from "react";
import { InputCard } from "@/components/InputCard";
import { ProgressRail } from "@/components/ProgressRail";
import { ResultCard } from "@/components/ResultCard";
import { SessionHistory } from "@/components/SessionHistory";
import { buildContextFromSession, createEmptySteps, STEP_META, STEP_ORDER } from "@/lib/pipeline";
import { downloadJson, downloadMarkdown, stepToMarkdown } from "@/lib/export";
import {
  clearApiKey,
  deleteSession,
  loadApiKey,
  loadLastSession,
  loadSessions,
  saveApiKey,
  upsertSession
} from "@/lib/storage";
import { Session, StepId, StepState } from "@/lib/types";

const DEFAULT_MODEL = "gpt-5";

function createSession(problem: string, model: string): Session {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    problem,
    model,
    steps: createEmptySteps()
  };
}

function updateStep(session: Session, stepId: StepId, patch: Partial<StepState>): Session {
  return {
    ...session,
    steps: {
      ...session.steps,
      [stepId]: {
        ...session.steps[stepId],
        ...patch
      }
    }
  };
}

function setStepStart(session: Session, stepId: StepId): Session {
  const now = new Date().toISOString();
  return updateStep(session, stepId, { status: "running", startedAt: now, error: undefined });
}

function setStepFinish(
  session: Session,
  stepId: StepId,
  patch: Partial<StepState>
): Session {
  const startedAt = session.steps[stepId].startedAt;
  const finishedAt = new Date().toISOString();
  const durationMs = startedAt ? new Date(finishedAt).getTime() - new Date(startedAt).getTime() : undefined;
  return updateStep(session, stepId, { ...patch, finishedAt, durationMs });
}

function resetStepsFrom(session: Session, startIndex: number): Session {
  const nextSteps = { ...session.steps };
  for (let i = startIndex; i < STEP_ORDER.length; i += 1) {
    const stepId = STEP_ORDER[i];
    nextSteps[stepId] = { status: "pending" };
  }
  return {
    ...session,
    steps: nextSteps
  };
}

function getResumeIndex(target: Session | null): number | null {
  if (!target) return null;
  for (let i = 0; i < STEP_ORDER.length; i += 1) {
    const stepId = STEP_ORDER[i];
    if (target.steps[stepId].status !== "success") {
      return i;
    }
  }
  return null;
}

export default function HomePage() {
  const [problem, setProblem] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [rememberKey, setRememberKey] = useState(false);
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [session, setSession] = useState<Session | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [collapsedSteps, setCollapsedSteps] = useState<Record<StepId, boolean>>(() =>
    STEP_ORDER.reduce((acc, stepId) => {
      acc[stepId] = false;
      return acc;
    }, {} as Record<StepId, boolean>)
  );

  useEffect(() => {
    const storedKey = loadApiKey();
    if (storedKey) {
      setApiKey(storedKey);
      setRememberKey(true);
    }
    const lastSession = loadLastSession();
    if (lastSession) {
      setSession(lastSession);
      setProblem(lastSession.problem);
      setModel(lastSession.model ?? DEFAULT_MODEL);
    }
    setSessions(loadSessions());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!session) return;
    setCollapsedSteps(
      STEP_ORDER.reduce((acc, stepId) => {
        acc[stepId] = false;
        return acc;
      }, {} as Record<StepId, boolean>)
    );
  }, [session?.id]);

  useEffect(() => {
    if (!hydrated) return;
    if (!rememberKey) {
      clearApiKey();
    } else if (apiKey) {
      saveApiKey(apiKey);
    }
  }, [rememberKey, apiKey]);

  const runningStep = useMemo(() => {
    if (!session) return null;
    return STEP_ORDER.find((stepId) => session.steps[stepId].status === "running") ?? null;
  }, [session]);

  const resumeIndex = useMemo(() => getResumeIndex(session), [session]);

  const formatDuration = (ms?: number) => {
    if (!ms || ms <= 0) return undefined;
    const seconds = Math.round(ms / 100) / 10;
    return `${seconds}s`;
  };

  const persistSession = (nextSession: Session) => {
    setSession(nextSession);
    const nextSessions = upsertSession(nextSession);
    setSessions(nextSessions);
  };

  const runPipeline = async (baseSession: Session, startIndex: number) => {
    let current = resetStepsFrom(baseSession, startIndex);
    persistSession(current);
    setRunning(true);
    setError(null);

    for (let i = startIndex; i < STEP_ORDER.length; i += 1) {
      const stepId = STEP_ORDER[i];
      current = setStepStart(current, stepId);
      persistSession(current);

      try {
        const context = buildContextFromSession(current, stepId);
        const response = await fetch("/api/run-step", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            apiKey: apiKey.trim(),
            model: model.trim() || DEFAULT_MODEL,
            stepId,
            problem: current.problem,
            context
          })
        });

        const data = await response.json();
        if (!response.ok || !data?.ok) {
          const message = data?.error ?? "Step failed to complete.";
          current = setStepFinish(current, stepId, { status: "error", error: message });
          persistSession(current);
          setError(message);
          setRunning(false);
          return;
        }

        current = setStepFinish(current, stepId, { status: "success", output: data.output });
        persistSession(current);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Network error while calling the API.";
        current = setStepFinish(current, stepId, { status: "error", error: message });
        persistSession(current);
        setError(message);
        setRunning(false);
        return;
      }
    }

    setRunning(false);
  };

  const handleRun = async () => {
    if (running) return;
    if (!problem.trim()) {
      setError("Please describe the problem you want to work on.");
      return;
    }
    if (!apiKey.trim()) {
      setError("Please provide a valid OpenAI API key.");
      return;
    }
    const freshSession = createSession(problem.trim(), model.trim() || DEFAULT_MODEL);
    persistSession(freshSession);
    await runPipeline(freshSession, 0);
  };

  const handleRetry = async (stepId: StepId) => {
    if (!session || running) return;
    const startIndex = STEP_ORDER.indexOf(stepId);
    if (startIndex < 0) return;
    await runPipeline(session, startIndex);
  };

  const handleReset = () => {
    if (running) return;
    setProblem("");
    setSession(null);
    setError(null);
  };

  const handleResume = async () => {
    if (!session || running) return;
    const resumeIndex = getResumeIndex(session);
    if (resumeIndex === null) return;
    await runPipeline(session, resumeIndex);
  };

  const handleToggleCollapse = (stepId: StepId) => {
    setCollapsedSteps((prev) => ({ ...prev, [stepId]: !prev[stepId] }));
  };

  const handleCopyStep = async (stepId: StepId) => {
    if (!session) return;
    const step = session.steps[stepId];
    if (!step.output) return;
    const text = `# ${STEP_META[stepId].title}\n\n${stepToMarkdown(step.output)}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      setError("Clipboard copy failed. Try again or export instead.");
    }
  };

  const handleSelectSession = (selected: Session) => {
    if (running) return;
    setSession(selected);
    setProblem(selected.problem);
    setModel(selected.model ?? DEFAULT_MODEL);
  };

  const handleDeleteSession = (selected: Session) => {
    if (running) return;
    const nextSessions = deleteSession(selected.id);
    setSessions(nextSessions);
    if (session?.id === selected.id) {
      const next = nextSessions[0] ?? null;
      setSession(next);
      setProblem(next?.problem ?? "");
      setModel(next?.model ?? DEFAULT_MODEL);
    }
  };

  const handleExportSession = (selected: Session) => {
    downloadMarkdown(selected);
  };

  const handleExportSessionJson = (selected: Session) => {
    downloadJson(selected);
  };

  return (
    <div className="min-h-screen px-6 py-12 md:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-emerald-300/30 px-3 py-1 text-xs uppercase tracking-[0.3em] text-emerald-200">
              Problem Coach
            </span>
            <span className="mono text-xs text-slate-500">Deep-dive pipeline</span>
          </div>
          <h1 className="text-4xl font-semibold text-white md:text-5xl">
            Turn messy problems into clear, actionable pathways.
          </h1>
          <p className="max-w-2xl text-base text-slate-300">
            This coach runs a multi-step analysis to unpack your challenge, prioritize the work, and
            suggest tangible actions. Each step is its own API call, so you get depth without hitting
            response limits.
          </p>
          {runningStep ? (
            <p className="mono text-xs text-emerald-200/80">
              Running: {STEP_META[runningStep].title}
            </p>
          ) : null}
          {session && resumeIndex !== null && !running ? (
            <button
              type="button"
              onClick={handleResume}
              className="w-fit rounded-full border border-emerald-300/30 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-emerald-200 transition hover:border-emerald-300/70"
            >
              Resume from {STEP_META[STEP_ORDER[resumeIndex]].title}
            </button>
          ) : null}
          {error ? (
            <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <InputCard
            problem={problem}
            apiKey={apiKey}
            rememberKey={rememberKey}
            model={model}
            running={running}
            onProblemChange={setProblem}
            onApiKeyChange={setApiKey}
            onRememberKeyChange={setRememberKey}
            onModelChange={setModel}
            onRun={handleRun}
            onReset={handleReset}
          />
          <div className="space-y-6">
            <ProgressRail steps={session?.steps ?? createEmptySteps()} running={running} onRetry={handleRetry} />
            <SessionHistory
              sessions={sessions}
              activeId={session?.id}
              onSelect={handleSelectSession}
              onDelete={handleDeleteSession}
              onExportMarkdown={handleExportSession}
              onExportJson={handleExportSessionJson}
            />
          </div>
        </div>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-white">Deep Dive Results</h2>
            {session ? (
              <div className="flex items-center gap-3">
                <span className="mono text-xs text-slate-500">
                  Session {new Date(session.createdAt).toLocaleString()}
                </span>
                <button
                  type="button"
                  onClick={() => handleExportSession(session)}
                  className="rounded-full border border-emerald-300/30 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-emerald-200 transition hover:border-emerald-300/70"
                >
                  Export Markdown
                </button>
                <button
                  type="button"
                  onClick={() => handleExportSessionJson(session)}
                  className="rounded-full border border-sky-300/30 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-sky-200 transition hover:border-sky-300/70"
                >
                  Export JSON
                </button>
              </div>
            ) : null}
          </div>
          {session ? (
            <div className="grid gap-6">
              {STEP_ORDER.map((stepId, index) => {
                const step = session.steps[stepId];
                if (step.status === "error") {
                  return (
                    <div
                      key={stepId}
                      className="rounded-3xl border border-rose-400/40 bg-rose-500/10 p-6 text-sm text-rose-200"
                    >
                      <p className="text-base font-semibold text-rose-100">{STEP_META[stepId].title}</p>
                      <p className="mt-2">{step.error ?? "This step failed."}</p>
                    </div>
                  );
                }
                if (!step.output) return null;
                return (
                  <ResultCard
                    key={stepId}
                    output={step.output}
                    index={index}
                    collapsed={collapsedSteps[stepId]}
                    onToggle={() => handleToggleCollapse(stepId)}
                    onCopy={() => handleCopyStep(stepId)}
                    durationLabel={formatDuration(step.durationMs)}
                  />
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-ink-900/50 p-8 text-sm text-slate-400">
              Your results will show up here after the pipeline runs.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
