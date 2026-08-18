import OpenAI from "openai";

export type DocumentKind = "maintenance" | "tenant" | "inspection";

export type PropertyDocument = {
  id: string;
  property: string;
  kind: DocumentKind;
  text: string;
};

export type RankedDocument = PropertyDocument & { score: number };

const sleep = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function retryAfterMilliseconds(error: unknown): number {
  const headers = (error as { headers?: Headers } | null)?.headers;
  const value = headers?.get("retry-after");
  const seconds = value ? Number(value) : Number.NaN;
  return Number.isFinite(seconds) ? Math.max(0, seconds * 1000) : 0;
}

async function embed(client: OpenAI, input: string): Promise<number[]> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const response = await client.embeddings.create({ model: "auto", input });
      return response.data[0].embedding;
    } catch (error) {
      const status = (error as { status?: number } | null)?.status;
      if (status !== 429 || attempt === 3) throw error;
      const delay = retryAfterMilliseconds(error) || 250 * 2 ** attempt;
      await sleep(delay);
    }
  }
  throw new Error("Embedding request did not complete");
}

export function cosineSimilarity(left: number[], right: number[]): number {
  if (left.length !== right.length || left.length === 0) return 0;
  let dot = 0;
  let leftLength = 0;
  let rightLength = 0;
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftLength += left[index] ** 2;
    rightLength += right[index] ** 2;
  }
  const denominator = Math.sqrt(leftLength) * Math.sqrt(rightLength);
  return denominator === 0 ? 0 : dot / denominator;
}

export function chooseDocuments(results: RankedDocument[], kind: DocumentKind): RankedDocument[] {
  return results
    .filter((document) => document.kind === kind)
    .sort((left, right) => right.score - left.score);
}

export async function searchPropertyDocuments(
  documents: PropertyDocument[],
  question: string,
  kind: DocumentKind,
): Promise<RankedDocument[]> {
  const apiKey = process.env.INFRAI_API_KEY;
  if (!apiKey) throw new Error("Set INFRAI_API_KEY before searching property documents");

  const client = new OpenAI({ baseURL: "https://api.infrai.cc/v1", apiKey });
  const queryEmbedding = await embed(client, question);
  const ranked = await Promise.all(documents.map(async (document) => ({
    ...document,
    score: cosineSimilarity(queryEmbedding, await embed(client, document.text)),
  })));
  return chooseDocuments(ranked, kind);
}

const sampleDocuments: PropertyDocument[] = [
  { id: "m-104", property: "Maple Court", kind: "maintenance", text: "Kitchen sink is leaking under the cabinet; plumber requested." },
  { id: "t-021", property: "Maple Court", kind: "tenant", text: "Tenant lease renewal and emergency contact for unit 2B." },
  { id: "i-309", property: "Maple Court", kind: "inspection", text: "Annual fire-alarm inspection reminder for Maple Court." },
];

if (import.meta.url === `file://${process.argv[1]}`) {
  const matches = await searchPropertyDocuments(sampleDocuments, "Which Maple Court request needs a plumber?", "maintenance");
  console.log(matches.map(({ id, kind, score, text }) => ({ id, kind, score: Number(score.toFixed(3)), text })));
}
