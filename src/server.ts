import "./lib/error-capture";

import { GoogleGenAI, Type } from "@google/genai";
import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import {
  buildDeterministicSynthesis,
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

async function handleSynthesizeRequest(request: Request): Promise<Response> {
  const startedAt = Date.now();
  try {
    const body = (await request.json()) as SynthesisRequest;
    const baseResult = buildDeterministicSynthesis(body);

    const apiKey = process.env["GEMINI_API_KEY"];
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          ...baseResult,
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
    try {
      const promptText = `You are a luxury architectural wedding designer and computer vision perspective analyzer.
Analyze the venue and synthesize a cohesive wedding setup combining:
- Base Venue: ${body.venueName} (${body.venueType})
- Selected Pinterest Inspiration References: ${body.pinTitles.join("; ")}
- Guest Count: ${body.guestCount}
- Floral Density: ${body.floralDensity}
- Lighting Color Temperature: ${body.lightingKelvin}K
- Primary Focal Structure: ${body.focalStructure}

If an image of the empty venue is attached, inspect its perspective and detect the best normalized percentage coordinates (0 to 100 for x and y) to place:
- focalArch: the main stage/altar focal wall center (x: 35-65, y: 38-58)
- canopy: the ceiling chandelier/drapery center (x: 40-60, y: 12-26)
- aisleRunner: the central floor aisle perspective center (x: 40-60, y: 75-88)

Return a JSON object with conceptTitle, curatorialNote, masterImagePrompt, focalArchX, focalArchY, canopyY, and aisleY.`;

      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
        { text: promptText },
      ];

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
              focalArchX: { type: Type.NUMBER },
              focalArchY: { type: Type.NUMBER },
              canopyY: { type: Type.NUMBER },
              aisleY: { type: Type.NUMBER },
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
          focalArchX?: number;
          focalArchY?: number;
          canopyY?: number;
          aisleY?: number;
        };
        if (parsed.conceptTitle) baseResult.conceptTitle = parsed.conceptTitle;
        if (parsed.curatorialNote) baseResult.curatorialNote = parsed.curatorialNote;
        if (parsed.masterImagePrompt) baseResult.masterImagePrompt = parsed.masterImagePrompt;
        if (parsed.focalArchX && parsed.focalArchY) {
          baseResult.detectedLayerCoords = {
            focalArch: {
              x: Math.max(25, Math.min(75, parsed.focalArchX)),
              y: Math.max(32, Math.min(62, parsed.focalArchY)),
              scale: 1.08,
            },
            canopy: {
              x: Math.max(35, Math.min(65, parsed.focalArchX)),
              y: Math.max(10, Math.min(28, parsed.canopyY ?? 17)),
              scale: 1.05,
            },
            aisleRunner: {
              x: Math.max(35, Math.min(65, parsed.focalArchX)),
              y: Math.max(72, Math.min(90, parsed.aisleY ?? 82)),
              scale: 1.05,
            },
          };
        }
        baseResult.modelUsed = "gemini-3.8-flash (Live Vision Perspective + Style Synthesis)";
      }
    } catch (flashErr) {
      console.warn("Gemini 3.8 Flash synthesis fallback used:", flashErr);
    }

    // Optional Stage 3: Live Nano Banana image generation if requested and key has paid image quota
    if (body.wantLiveImageRender) {
      try {
        const imgParts: Array<
          { text: string } | { inlineData: { mimeType: string; data: string } }
        > = [{ text: baseResult.masterImagePrompt }];

        if (body.venueImageBase64 && body.venueImageBase64.includes(",")) {
          const [meta, base64Data] = body.venueImageBase64.split(",");
          const mimeMatch = meta?.match(/data:(.*?);base64/);
          if (base64Data) {
            imgParts.unshift({
              inlineData: {
                mimeType: mimeMatch?.[1] ?? "image/jpeg",
                data: base64Data,
              },
            });
          }
        }

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
        for (const part of candidateParts) {
          if (part.inlineData?.data) {
            const mime = part.inlineData.mimeType || "image/png";
            baseResult.generatedImageDataUrl = `data:${mime};base64,${part.inlineData.data}`;
            baseResult.modelUsed =
              "gemini-3.8-flash + gemini-3.1-flash-lite-image (Nano Banana Live Render)";
            baseResult.imageEngineStatus =
              "Live Nano Banana (gemini-3.1-flash-lite-image) image synthesis completed.";
            break;
          }
        }
      } catch (imgErr) {
        console.warn("Nano Banana image generation skipped/fallback (free tier):", imgErr);
        baseResult.imageEngineStatus =
          "Gemini 3.8 Flash Vision mapped your venue perspective & style tokens. Interactive Spatial Décor Layers composited directly onto your uploaded venue photo.";
      }
    }

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
