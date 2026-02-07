import { Session } from "@/lib/types";
import { STEP_META, STEP_ORDER } from "@/lib/pipeline";
import { StepOutput } from "@/lib/types";

function formatList(items: string[], indent = "- ") {
  if (items.length === 0) return `${indent}None`;
  return items.map((item) => `${indent}${item}`).join("\n");
}

export function sessionToMarkdown(session: Session): string {
  const lines: string[] = [];
  lines.push(`# Problem Coach Session`);
  lines.push("");
  lines.push(`**Created:** ${new Date(session.createdAt).toLocaleString()}`);
  lines.push(`**Model:** ${session.model}`);
  lines.push("");
  lines.push("## Problem");
  lines.push(session.problem);
  lines.push("");

  for (const stepId of STEP_ORDER) {
    const step = session.steps[stepId];
    const meta = STEP_META[stepId];
    lines.push(`## ${meta.title}`);
    if (step.status === "error") {
      lines.push(`**Status:** Error`);
      lines.push(step.error ?? "Step failed.");
      lines.push("");
      continue;
    }
    if (!step.output) {
      lines.push("**Status:** Not completed");
      lines.push("");
      continue;
    }
    lines.push(stepToMarkdown(step.output));
    lines.push("");
  }

  return lines.join("\n");
}

export function stepToMarkdown(output: StepOutput): string {
  const lines: string[] = [];
  lines.push(output.summary);
  lines.push("");
  lines.push("**Key Ideas**");
  lines.push(formatList(output.bullets));
  lines.push("");
  lines.push("**Actions**");
  lines.push(formatList(output.actions));
  lines.push("");
  lines.push("**Open Questions**");
  lines.push(formatList(output.questions));
  return lines.join("\n");
}

export function downloadMarkdown(session: Session) {
  const markdown = sessionToMarkdown(session);
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `problem-coach-${session.id}.md`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function downloadJson(session: Session) {
  const json = JSON.stringify(session, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `problem-coach-${session.id}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
