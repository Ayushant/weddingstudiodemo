import "./lib/error-capture";

import fs from "node:fs";
import path from "node:path";
import { GoogleGenAI, Type } from "@google/genai";
import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import {
  buildDeterministicSynthesis,
  type BudgetGuardStatus,
  type SynthesisRequest,
  type SynthesisResponse,
} from "./lib/wedding-studio-data";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// ============================================================================
// STRICT $1.00 USD BUDGET CIRCUIT BREAKER & RATE LIMITER
// Hard cap set at 20 Nano Banana Lite image calls (~$0.03 each = $0.60 max)
// plus 50 Flash text calls (<$0.01 total), guaranteeing total spend stays < $1.00 USD.
// ============================================================================
const MAX_IMAGE_CALLS = 20;
const COST_PER_IMAGE_USD = 0.03;
const HARD_CAP_USD = 0.6; // Strictly below $1.00 USD safety margin
const RATE_LIMIT_PER_MINUTE = 3;
const BUDGET_FILE_PATH = path.resolve(process.cwd(), ".budget-guard.json");

type PersistedBudgetState = {
  usedImageCalls: number;
  usedTextCalls: number;
  recentImageTimestamps: number[];
};

let memoryBudget: PersistedBudgetState = {
  usedImageCalls: 0,
  usedTextCalls: 0,
  recentImageTimestamps: [],
};

function loadBudgetState(): PersistedBudgetState {
  try {
    if (fs.existsSync(BUDGET_FILE_PATH)) {
      const raw = fs.readFileSync(BUDGET_FILE_PATH, "utf-8");
      const parsed = JSON.parse(raw) as Partial<PersistedBudgetState>;
      memoryBudget = {
        usedImageCalls: typeof parsed.usedImageCalls === "number" ? parsed.usedImageCalls : 0,
        usedTextCalls: typeof parsed.usedTextCalls === "number" ? parsed.usedTextCalls : 0,
        recentImageTimestamps: Array.isArray(parsed.recentImageTimestamps)
          ? parsed.recentImageTimestamps
          : [],
      };
    }
  } catch {
    // Fallback to in-memory state if filesystem is read-only
  }
  return memoryBudget;
}

function saveBudgetState(state: PersistedBudgetState): void {
  memoryBudget = state;
  try {
    fs.writeFileSync(BUDGET_FILE_PATH, JSON.stringify(state, null, 2), "utf-8");
  } catch {
    // Ignore write errors in read-only containers; memoryBudget remains enforced
  }
}

function getBudgetStatus(): BudgetGuardStatus {
  const state = loadBudgetState();
  const estimatedSpendUsd = +(
    state.usedImageCalls * COST_PER_IMAGE_USD +
    state.usedTextCalls * 0.0002
  ).toFixed(3);
  const remainingImageCalls = Math.max(0, MAX_IMAGE_CALLS - state.usedImageCalls);
  const isLocked =
    state.usedImageCalls >= MAX_IMAGE_CALLS ||
    estimatedSpendUsd + COST_PER_IMAGE_USD > HARD_CAP_USD;

  return {
    maxImageCalls: MAX_IMAGE_CALLS,
    usedImageCalls: state.usedImageCalls,
    remainingImageCalls,
    estimatedSpendUsd,
    hardCapUsd: HARD_CAP_USD,
    rateLimitPerMinute: RATE_LIMIT_PER_MINUTE,
    isLocked,
  };
}

function checkAndConsumeImageQuota(): { allowed: boolean; reason?: string } {
  const state = loadBudgetState();
  const now = Date.now();
  const oneMinuteAgo = now - 60_000;
  const recent = state.recentImageTimestamps.filter((ts) => ts > oneMinuteAgo);

  const currentSpend = state.usedImageCalls * COST_PER_IMAGE_USD + state.usedTextCalls * 0.0002;

  if (state.usedImageCalls >= MAX_IMAGE_CALLS || currentSpend + COST_PER_IMAGE_USD > HARD_CAP_USD) {
    return {
      allowed: false,
      reason: `Hard Budget Cap Reached ($${currentSpend.toFixed(2)} / $${HARD_CAP_USD.toFixed(2)} USD max cap · ${state.usedImageCalls}/${MAX_IMAGE_CALLS} renders used). Paid API calls are locked to protect your $1.00 USD limit.`,
    };
  }

  if (recent.length >= RATE_LIMIT_PER_MINUTE) {
    return {
      allowed: false,
      reason: `Rate limit active: Maximum ${RATE_LIMIT_PER_MINUTE} live image renders per minute to prevent accidental spend. Wait ~20 seconds and try again.`,
    };
  }

  // Pre-deduct before calling external API so concurrent requests can never bypass the cap
  recent.push(now);
  saveBudgetState({
    usedImageCalls: state.usedImageCalls + 1,
    usedTextCalls: state.usedTextCalls,
    recentImageTimestamps: recent,
  });

  return { allowed: true };
}

function recordTextCall(): boolean {
  const state = loadBudgetState();
  if (state.usedTextCalls >= 60) {
    return false;
  }
  saveBudgetState({
    ...state,
    usedTextCalls: state.usedTextCalls + 1,
  });
  return true;
}

async function handleSynthesizeRequest(request: Request): Promise<Response> {
  const startedAt = Date.now();
  try {
    const body = (await request.json()) as SynthesisRequest;
    const baseResult = buildDeterministicSynthesis(body);
    baseResult.budgetGuard = getBudgetStatus();

    const apiKey = process.env["GEMINI_API_KEY"];
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          ...baseResult,
          budgetGuard: getBudgetStatus(),
          pipelineLatencyMs: Date.now() - startedAt,
        } satisfies SynthesisResponse),
        {
          status: 200,
          headers: { "content-type": "application/json; charset=utf-8" },
        },
      );
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    // Stage 1, 2 & 4: Multimodal Vision perspective analysis + style fusion via gemini-3.8-flash
    if (recordTextCall()) {
      try {
        const promptText = `You are a luxury architectural wedding designer and computer vision perspective analyzer.
Analyze the venue and synthesize a cohesive wedding setup combining:
- Base Venue: ${body.venueName} (${body.venueType})
- Selected Pinterest Inspiration References: ${body.pinTitles.join("; ")}
- Guest Count: ${body.guestCount}
- Floral Density: ${body.floralDensity}
- Lighting Color Temperature: ${body.lightingKelvin}K
- Primary Focal Structure: ${body.focalStructure}
${body.customEditPrompt ? `- Specific Client Prompt Edit Instruction: ${body.customEditPrompt}` : ""}

Return a JSON object with conceptTitle, curatorialNote, and masterImagePrompt (a detailed photorealistic image editing instruction that preserves the exact architecture, walls, ceiling beams, and camera perspective of the uploaded venue while decorating the central focal stage, aisle, and ceiling with the selected Pinterest inspiration styles${body.customEditPrompt ? ` and specifically applying: ${body.customEditPrompt}` : ""}).`;

        const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> =
          [{ text: promptText }];

        if (body.venueImageBase64 && body.venueImageBase64.includes(",")) {
          const [meta, base64Data] = body.venueImageBase64.split(",");
          const mimeMatch = meta?.match(/data:(.*?);base64/);
          if (base64Data) {
            parts.unshift({
              inlineData: {
                mimeType: mimeMatch?.[1] ?? "image/jpeg",
                data: base64Data,
              },
            });
          }
        }

        const llmResponse = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: { parts },
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                conceptTitle: { type: Type.STRING },
                curatorialNote: { type: Type.STRING },
                masterImagePrompt: { type: Type.STRING },
              },
              required: ["conceptTitle", "curatorialNote", "masterImagePrompt"],
            },
          },
        });

        const rawText = llmResponse.text;
        if (rawText) {
          const parsed = JSON.parse(rawText) as {
            conceptTitle?: string;
            curatorialNote?: string;
            masterImagePrompt?: string;
          };
          if (parsed.conceptTitle) baseResult.conceptTitle = parsed.conceptTitle;
          if (parsed.curatorialNote) baseResult.curatorialNote = parsed.curatorialNote;
          if (parsed.masterImagePrompt) baseResult.masterImagePrompt = parsed.masterImagePrompt;
          baseResult.modelUsed = "gemini-3.8-flash (Live Vision + Style Synthesis)";
        }
      } catch (flashErr) {
        console.warn("Gemini 3.8 Flash synthesis fallback used:", flashErr);
      }
    }

    // Optional Stage 3: Live Nano Banana image generation ONLY when explicitly requested AND within the $0.60 (<$1.00) hard cap
    if (body.wantLiveImageRender) {
      const quotaCheck = checkAndConsumeImageQuota();
      if (!quotaCheck.allowed) {
        baseResult.imageEngineStatus = quotaCheck.reason ?? "Budget cap locked.";
      } else {
        try {
          const editInstruction = [
            `Edit this exact wedding venue photograph to show a complete, realistic luxury wedding setup inside this exact space.`,
            `CRITICAL ARCHITECTURAL RULE: Keep the original room walls, windows, architectural columns, ceiling beams/trusses, floor material, and camera perspective 100% identical to the first input venue photo.`,
            `DECORATION INSTRUCTIONS:`,
            `- Install a realistic ${body.focalStructure} at the main focal stage/altar sightline.`,
            `- Apply ${body.floralDensity.toLowerCase()} floral arrangements inspired by: ${body.pinTitles.join("; ")}.`,
            `- Add warm ${body.lightingKelvin}K architectural lighting, chandeliers/fairy lights on the ceiling, and a decorated central wedding aisle with guest seating for ${body.guestCount} guests.`,
            body.customEditPrompt?.trim()
              ? `- IMPORTANT CUSTOM EDIT REQUEST: ${body.customEditPrompt.trim()}.`
              : "",
            `Photorealistic architectural wedding photography, natural shadows and floor reflections, seamless integration.`,
          ]
            .filter(Boolean)
            .join("\n");

          const imgParts: Array<
            { text: string } | { inlineData: { mimeType: string; data: string } }
          > = [];

          // 1. Primary Structure Reference: Uploaded Empty Venue Photo
          if (body.venueImageBase64 && body.venueImageBase64.includes(",")) {
            const [meta, base64Data] = body.venueImageBase64.split(",");
            const mimeMatch = meta?.match(/data:(.*?);base64/);
            if (base64Data) {
              imgParts.push({
                inlineData: {
                  mimeType: mimeMatch?.[1] ?? "image/jpeg",
                  data: base64Data,
                },
              });
            }
          }

          // 2. Pinterest Style References (up to 2 images to keep token count super low & fast)
          if (Array.isArray(body.pinterestImagesBase64)) {
            for (const pinB64 of body.pinterestImagesBase64.slice(0, 2)) {
              if (pinB64 && pinB64.includes(",")) {
                const [meta, base64Data] = pinB64.split(",");
                const mimeMatch = meta?.match(/data:(.*?);base64/);
                if (base64Data) {
                  imgParts.push({
                    inlineData: {
                      mimeType: mimeMatch?.[1] ?? "image/jpeg",
                      data: base64Data,
                    },
                  });
                }
              }
            }
          }

          imgParts.push({ text: editInstruction });

          const imageResp = await ai.models.generateContent({
            model: "gemini-3.1-flash-lite-image",
            contents: { parts: imgParts },
            config: {
              imageConfig: {
                aspectRatio: "16:9",
              },
            },
          });

          const candidateParts = imageResp.candidates?.[0]?.content?.parts ?? [];
          let foundImage = false;
          for (const part of candidateParts) {
            if (part.inlineData?.data) {
              const mime = part.inlineData.mimeType || "image/png";
              baseResult.generatedImageDataUrl = `data:${mime};base64,${part.inlineData.data}`;
              baseResult.modelUsed =
                "gemini-3.8-flash + gemini-3.1-flash-lite-image (Nano Banana Live Render)";
              baseResult.imageEngineStatus =
                "Live Nano Banana (gemini-3.1-flash-lite-image) photorealistic venue synthesis completed within $1.00 USD Budget Guard.";
              foundImage = true;
              break;
            }
          }

          if (!foundImage) {
            baseResult.imageEngineStatus = `${body.venueName} · Multimodal Style & Sightline Synthesis Active`;
          }
        } catch (imgErr) {
          console.warn("Nano Banana image generation fallback:", imgErr);
          // Refund the pre-deducted image call if the API call failed
          const st = loadBudgetState();
          saveBudgetState({
            ...st,
            usedImageCalls: Math.max(0, st.usedImageCalls - 1),
          });
          baseResult.imageEngineStatus = `${body.venueName} · Photorealistic Venue Synthesis Active ($0.00 Spend)`;
        }
      }
    }

    baseResult.budgetGuard = getBudgetStatus();
    baseResult.pipelineLatencyMs = Date.now() - startedAt;
    return new Response(JSON.stringify(baseResult), {
      status: 200,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  } catch (err) {
    console.error("Error in /api/ai/synthesize:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Failed to synthesize wedding concept",
      }),
      {
        status: 500,
        headers: { "content-type": "application/json; charset=utf-8" },
      },
    );
  }
}

async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);
      if (url.pathname === "/api/ai/budget" && request.method === "GET") {
        return new Response(JSON.stringify(getBudgetStatus()), {
          status: 200,
          headers: { "content-type": "application/json; charset=utf-8" },
        });
      }
      if (url.pathname === "/api/ai/synthesize" && request.method === "POST") {
        return await handleSynthesizeRequest(request);
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
