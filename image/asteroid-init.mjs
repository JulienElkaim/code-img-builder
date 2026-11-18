// Runs every time `pi` is launched. Writes ~/.pi/agent/models.json with the models
// LiteLLM serves right now (GET <base>/models). No static list. The key is never written: only its env var name.
import { writeFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const base = (process.env.LITELLM_BASE_URL || "").replace(/\/+$/, "");
const key = process.env.LITELLM_API_KEY;
const warn = (m) => { console.error(`[asteroid] ${m}`); process.exit(0); };

if (!base) warn("LITELLM_BASE_URL is not set (Windows env var or .env): no models.");
if (!key) warn("LITELLM_API_KEY is not set (Windows env var or .env): no models.");

let ids = [];
try {
  const res = await fetch(`${base}/models`, { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  ids = ((await res.json()).data ?? []).map((m) => m.id).filter(Boolean).sort();
} catch (e) {
  warn(`Model discovery failed at ${base}/models (${e.message}).`);
}
if (!ids.length) warn(`No models returned by ${base}/models.`);

const dir = join(homedir(), ".pi", "agent");
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, "models.json"), JSON.stringify({
  providers: { litellm: {
    baseUrl: base,
    api: "openai-completions",
    apiKey: "!printenv LITELLM_API_KEY",
    compat: { supportsDeveloperRole: false, supportsReasoningEffort: false },
    models: ids.map((id) => ({ id })),
  } },
}, null, 2));
console.error(`[asteroid] ${ids.length} models from ${base}`);
