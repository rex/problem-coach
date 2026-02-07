import OpenAI from "openai";
import { NextResponse } from "next/server";
import {
  STEP_META,
  STEP_OUTPUT_SCHEMA,
  buildStepPrompt,
  normalizeStepOutput
} from "@/lib/pipeline";
import { PipelineContext, StepId, StepOutput } from "@/lib/types";

const SYSTEM_PROMPT =
  "You are a pragmatic problem-solving coach. Respond ONLY with valid JSON that matches the schema. " +
  "No markdown, no extra keys, no commentary. Provide concise, actionable content.";

function extractOutputText(response: unknown): string {
  if (typeof response !== "object" || response === null) return "";
  const maybeAny = response as Record<string, any>;
  if (typeof maybeAny.output_text === "string") {
    return maybeAny.output_text;
  }
  const output = Array.isArray(maybeAny.output) ? maybeAny.output : [];
  const chunks: string[] = [];
  for (const item of output) {
    const content = Array.isArray(item.content) ? item.content : [];
    for (const block of content) {
      const text = block?.text;
      if (typeof text === "string") {
        chunks.push(text);
      }
    }
  }
  return chunks.join("\n").trim();
}

function parseStepOutput(text: string, fallbackTitle: string): StepOutput {
  if (!text) {
    return normalizeStepOutput(null, fallbackTitle, "No response text returned.");
  }
  try {
    const parsed = JSON.parse(text) as Partial<StepOutput>;
    return normalizeStepOutput(parsed, fallbackTitle, text);
  } catch {
    return normalizeStepOutput(null, fallbackTitle, text);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const apiKey = body?.apiKey as string | undefined;
    const model = (body?.model as string | undefined) ?? "gpt-5";
    const stepId = body?.stepId as StepId | undefined;
    const problem = body?.problem as string | undefined;
    const context = (body?.context as PipelineContext | undefined) ?? {};

    if (!apiKey || !problem || !stepId) {
      return NextResponse.json(
        {
          stepId: stepId ?? "unknown",
          ok: false,
          output: null,
          error: "Missing required fields: apiKey, problem, or stepId."
        },
        { status: 400 }
      );
    }

    if (!STEP_META[stepId]) {
      return NextResponse.json(
        {
          stepId,
          ok: false,
          output: null,
          error: "Unknown step id."
        },
        { status: 400 }
      );
    }

    const client = new OpenAI({
      apiKey,
      baseURL: "https://api.openai.com/v1"
    });
    const prompt = buildStepPrompt(stepId, problem, context);

    const response = await client.responses.create({
      model,
      input: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      text: {
        format: {
          type: "json_schema",
          strict: true,
          schema: STEP_OUTPUT_SCHEMA
        }
      }
    });

    const text = extractOutputText(response);
    const output = parseStepOutput(text, STEP_META[stepId].title);

    return NextResponse.json({ stepId, ok: true, output });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error while running this step.";
    return NextResponse.json(
      {
        stepId: "unknown",
        ok: false,
        output: null,
        error: message
      },
      { status: 500 }
    );
  }
}
