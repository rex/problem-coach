type ModelLike = {
  id: string;
  created?: number;
};

export const DEFAULT_MODEL = "gpt-5";

export const FALLBACK_MODEL_OPTIONS = [
  "gpt-5",
  "gpt-5-mini",
  "gpt-5-nano",
  "gpt-4.1",
  "gpt-4.1-mini",
  "gpt-4.1-nano",
  "o3",
  "o4-mini",
  "o1",
  "o1-mini"
];

const MODEL_PRIORITY = new Map(FALLBACK_MODEL_OPTIONS.map((modelId, index) => [modelId, index]));

const BLOCKED_MODEL_SUBSTRINGS = [
  "embedding",
  "moderation",
  "tts",
  "audio",
  "transcribe",
  "whisper",
  "realtime",
  "image",
  "dall",
  "search",
  "instruct"
];

export function normalizeModelList(models: string[]): string[] {
  const seen = new Set<string>();
  const next: string[] = [];
  for (const raw of models) {
    const modelId = raw.trim();
    if (!modelId || seen.has(modelId)) continue;
    seen.add(modelId);
    next.push(modelId);
  }
  return next;
}

export function isPipelineModel(modelId: string): boolean {
  const lower = modelId.toLowerCase();
  if (BLOCKED_MODEL_SUBSTRINGS.some((token) => lower.includes(token))) {
    return false;
  }
  return (
    lower.startsWith("gpt-") ||
    lower.startsWith("chatgpt-") ||
    lower.startsWith("gpt-oss-") ||
    /^o\d/.test(lower)
  );
}

export function getPipelineCompatibleModels(models: ModelLike[]): string[] {
  const latestById = new Map<string, number>();
  for (const model of models) {
    if (!isPipelineModel(model.id)) continue;
    const created = typeof model.created === "number" ? model.created : 0;
    const prev = latestById.get(model.id) ?? -1;
    if (created > prev) {
      latestById.set(model.id, created);
    }
  }

  return [...latestById.entries()]
    .sort((a, b) => {
      const [aId, aCreated] = a;
      const [bId, bCreated] = b;
      const aPriority = MODEL_PRIORITY.get(aId);
      const bPriority = MODEL_PRIORITY.get(bId);
      if (aPriority !== undefined || bPriority !== undefined) {
        if (aPriority === undefined) return 1;
        if (bPriority === undefined) return -1;
        if (aPriority !== bPriority) return aPriority - bPriority;
      }
      if (aCreated !== bCreated) return bCreated - aCreated;
      return aId.localeCompare(bId);
    })
    .map(([id]) => id);
}
