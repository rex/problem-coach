import OpenAI from "openai";
import { NextResponse } from "next/server";
import {
  STEP_META,
  STEP_OUTPUT_SCHEMA,
  buildStepPrompt,
  normalizeStepOutput
} from "@/lib/pipeline";
import { DEFAULT_MODEL } from "@/lib/models";
import { PipelineContext, StepId, StepOutput } from "@/lib/types";

const SYSTEM_PROMPT =
  "You are a pragmatic problem-solving coach. Respond ONLY with valid JSON that matches the schema. " +
  "No markdown, no extra keys, no commentary. Provide concise, actionable content.";

function extractOutputText(response: unknown): string {
  if (typeof response !== "object" || response === null) return "";
  const maybeResponse = response as Record<string, unknown>;
  if (typeof maybeResponse.output_text === "string") {
    return maybeResponse.output_text;
  }
  const output = Array.isArray(maybeResponse.output) ? maybeResponse.output : [];
  const chunks: string[] = [];
  for (const item of output) {
    if (typeof item !== "object" || item === null) continue;
    const contentValue = (item as Record<string, unknown>).content;
    const content = Array.isArray(contentValue) ? contentValue : [];
    for (const block of content) {
      if (typeof block !== "object" || block === null) continue;
      const text = (block as Record<string, unknown>).text;
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
    const bodyApiKey = typeof body?.apiKey === "string" ? body.apiKey.trim() : "";
    const envApiKey = process.env.OPENAI_API_KEY?.trim() ?? "";
    const apiKey = bodyApiKey || envApiKey;
    const model = (body?.model as string | undefined) ?? DEFAULT_MODEL;
    const stepId = body?.stepId as StepId | undefined;
    const problem = body?.problem as string | undefined;
    const context = (body?.context as PipelineContext | undefined) ?? {};

    if (!problem || !stepId) {
      return NextResponse.json(
        {
          stepId: stepId ?? "unknown",
          ok: false,
          output: null,
          error: "Missing required fields: problem or stepId."
        },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        {
          stepId,
          ok: false,
          output: null,
          error: "Missing API key. Provide one in the UI or set OPENAI_API_KEY in .env.local."
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
          name: "problem_coach_step_output",
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
