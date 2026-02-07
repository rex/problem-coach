import { PipelineContext, Session, StepId, StepOutput, StepState } from "@/lib/types";

export const STEP_ORDER: StepId[] = [
  "distill",
  "constraints",
  "breakdown",
  "prioritize",
  "solutions",
  "physical",
  "ai_leverage",
  "plan"
];

export const STEP_META: Record<StepId, { title: string; subtitle: string; focus: string }> = {
  distill: {
    title: "Distill",
    subtitle: "Clarify the real problem",
    focus: "Clarify and restate the core problem. Surface missing context and assumptions."
  },
  constraints: {
    title: "Constraints",
    subtitle: "Root causes + blockers",
    focus: "Identify constraints, root causes, and risks that shape the solution space."
  },
  breakdown: {
    title: "Breakdown",
    subtitle: "Compartmentalize",
    focus: "Split the problem into domains and sub-problems with clear boundaries."
  },
  prioritize: {
    title: "Prioritize",
    subtitle: "Sequence the work",
    focus: "Rank compartments by impact, urgency, and effort; suggest sequencing."
  },
  solutions: {
    title: "Solutions",
    subtitle: "Creative pathways",
    focus: "Offer creative solution pathways for the top priorities."
  },
  physical: {
    title: "Physical",
    subtitle: "Tangible changes",
    focus: "Suggest physical environment changes: organization, inventory, cleanup, workspace tweaks."
  },
  ai_leverage: {
    title: "AI Leverage",
    subtitle: "Harness AI",
    focus: "Explain how AI can help for each compartment and overall."
  },
  plan: {
    title: "Action Plan",
    subtitle: "Next steps",
    focus: "Synthesize a short, ordered plan with next actions."
  }
};

export const STEP_OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    summary: { type: "string" },
    bullets: { type: "array", items: { type: "string" } },
    actions: { type: "array", items: { type: "string" } },
    questions: { type: "array", items: { type: "string" } }
  },
  required: ["title", "summary", "bullets", "actions", "questions"]
} as const;

export function createEmptySteps(): Record<StepId, StepState> {
  return STEP_ORDER.reduce((acc, stepId) => {
    acc[stepId] = { status: "pending" };
    return acc;
  }, {} as Record<StepId, StepState>);
}

export function buildContextFromSession(session: Session, stopBefore?: StepId): PipelineContext {
  const context: PipelineContext = {};
  for (const stepId of STEP_ORDER) {
    if (stepId === stopBefore) {
      break;
    }
    const output = session.steps[stepId]?.output;
    if (output) {
      context[stepId] = output;
    }
  }
  return context;
}

export function summarizeContext(context: PipelineContext): string {
  const lines: string[] = [];
  for (const stepId of STEP_ORDER) {
    const output = context[stepId];
    if (!output) continue;
    const bullets = output.bullets.slice(0, 4).join("; ");
    lines.push(`${STEP_META[stepId].title}: ${output.summary}${bullets ? ` | ${bullets}` : ""}`);
  }
  return lines.join("\n");
}

export function buildStepPrompt(stepId: StepId, problem: string, context: PipelineContext): string {
  const contextSummary = summarizeContext(context);
  const meta = STEP_META[stepId];
  const guidance = [
    `Focus: ${meta.focus}`,
    "Write concise, tactical language.",
    "Bullets should be crisp and specific.",
    "Actions should be immediately executable.",
    "Questions should unlock missing context."
  ].join("\n");

  return [
    `Problem: ${problem}`,
    contextSummary ? `Existing context:\n${contextSummary}` : "Existing context: None",
    guidance
  ].join("\n\n");
}

export function normalizeStepOutput(
  raw: Partial<StepOutput> | null,
  fallbackTitle: string,
  fallbackSummary: string
): StepOutput {
  const safeArray = (value?: unknown) => (Array.isArray(value) ? value.filter(Boolean).map(String) : []);
  return {
    title: typeof raw?.title === "string" ? raw.title : fallbackTitle,
    summary: typeof raw?.summary === "string" ? raw.summary : fallbackSummary,
    bullets: safeArray(raw?.bullets),
    actions: safeArray(raw?.actions),
    questions: safeArray(raw?.questions)
  };
}
