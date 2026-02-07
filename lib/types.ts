export type StepId =
  | "distill"
  | "constraints"
  | "breakdown"
  | "prioritize"
  | "solutions"
  | "physical"
  | "ai_leverage"
  | "plan";

export type StepStatus = "pending" | "running" | "success" | "error";

export type StepOutput = {
  title: string;
  summary: string;
  bullets: string[];
  actions: string[];
  questions: string[];
};

export type StepState = {
  status: StepStatus;
  output?: StepOutput;
  error?: string;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
};

export type Session = {
  id: string;
  createdAt: string;
  problem: string;
  model: string;
  steps: Record<StepId, StepState>;
};

export type PipelineContext = Partial<Record<StepId, StepOutput>>;
