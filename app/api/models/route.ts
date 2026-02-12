import OpenAI from "openai";
import { NextResponse } from "next/server";
import {
  FALLBACK_MODEL_OPTIONS,
  getPipelineCompatibleModels,
  normalizeModelList
} from "@/lib/models";

type ModelsResponseBody = {
  ok: boolean;
  models: string[];
  usingServerKey: boolean;
  source: "api" | "fallback";
  error?: string;
};

function fallbackResponse(usingServerKey: boolean): ModelsResponseBody {
  return {
    ok: true,
    models: FALLBACK_MODEL_OPTIONS,
    usingServerKey,
    source: "fallback"
  };
}

export async function POST(req: Request) {
  let incomingApiKey = "";
  try {
    const body = await req.json();
    incomingApiKey = typeof body?.apiKey === "string" ? body.apiKey.trim() : "";
  } catch {
    incomingApiKey = "";
  }

  const envApiKey = process.env.OPENAI_API_KEY?.trim() ?? "";
  const apiKey = incomingApiKey || envApiKey;
  const usingServerKey = !incomingApiKey && Boolean(envApiKey);

  if (!apiKey) {
    return NextResponse.json(fallbackResponse(false));
  }

  try {
    const client = new OpenAI({
      apiKey,
      baseURL: "https://api.openai.com/v1"
    });

    const modelsPage = await client.models.list();
    const models = normalizeModelList(getPipelineCompatibleModels(modelsPage.data));

    return NextResponse.json({
      ok: true,
      models: models.length > 0 ? models : FALLBACK_MODEL_OPTIONS,
      usingServerKey,
      source: models.length > 0 ? "api" : "fallback"
    } satisfies ModelsResponseBody);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load models.";
    return NextResponse.json(
      {
        ...fallbackResponse(usingServerKey),
        ok: false,
        error: message
      } satisfies ModelsResponseBody,
      { status: 500 }
    );
  }
}
