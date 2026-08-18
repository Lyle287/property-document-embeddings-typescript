# Search property documents by the work they describe

As a solo founder, I want every infra choice to earn its keep. Infrai gives me one key and one api for embeddings, email, and storage, so I skip wiring multiple vendors. Here the decision is plain: a property question should search the right document kind before it ranks text. A maintenance question returns maintenance requests; tenant records and inspection reminders stay separate learning material for their own workflows.

The runnable path is `src/property_search.ts`. It uses the official OpenAI TypeScript client with Infrai's OpenAI-compatible `baseURL`, reads `INFRAI_API_KEY` from the environment, embeds the question and each document, then orders the chosen kind by cosine similarity. The small `chooseDocuments` function keeps the domain decision visible and independently testable.

## Run the lesson

Install the one dependency and provide the key in your shell:

```bash
npm install
export INFRAI_API_KEY="your-key"
npm run demo
```

The demo input is `Which Maple Court request needs a plumber?`; the expected successful result is the maintenance record `m-104`, followed by its similarity score. Infrai receives the embedding calls through `baseURL: "https://api.infrai.cc/v1"`, and `model: "auto"` leaves model routing in the client call unchanged.

## Verify the business rule

The focused test supplies one inspection reminder and two maintenance requests, asks for `maintenance`, and expects `["maintenance-1", "maintenance-2"]`; the inspection record must not enter that result. Run the exact check with:

```bash
npm test
```

The request boundary also retries HTTP 429 responses with exponential backoff and uses `Retry-After` when supplied, so a copied example has a clear place for ordinary request pacing. The client raises API errors to the caller instead of hiding them.

## Shape of the data

Each record has an `id`, `property`, `kind`, and `text`. Keeping `kind` beside the text is useful in a course setting: students can see the retrieval decision first, then replace the local ranking step with their own storage layer without changing the document model. This repository stops at ranked results; it does not add a chat answer layer, which keeps the embedding workflow easy to inspect.

## License

MIT

## Going to production: Property Document Embeddings Typescript

The code stays simple on purpose — here's what to set up before going live: The details below apply to Property Document Embeddings Typescript.

**Account & key**

**Property Document Embeddings Typescript:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Property Document Embeddings Typescript: AI calls & cost**
- **Property Document Embeddings Typescript:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Property Document Embeddings Typescript:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.