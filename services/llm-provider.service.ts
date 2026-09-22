/**
 * @file services/llm-provider.service.ts
 * @description Provider abstraction and Google Gemini API adapter for CampusOS AI Mentor.
 * @purpose Enables server-side LLM completion using Google's free-tier Gemini API with strict timeouts, error normalization, and safe defaults.
 */

import { env } from "@/lib/env";
import { Logger } from "@/lib/logger";

export type LLMAttachment = {
  mimeType: string;
  base64: string;
  fileName?: string;
};

export type LLMMessage = {
  role: "system" | "user" | "assistant";
  content: string;
  attachment?: LLMAttachment;
  attachments?: LLMAttachment[];
};

export type LLMCompletionOptions = {
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  thinkingBudget?: number;
  maxRetries?: number;
};

export interface ILLMProvider {
  getProviderName(): string;
  getModelName?(): string;
  generateText(
    messages: LLMMessage[],
    options?: LLMCompletionOptions
  ): Promise<string>;
  generateStream?(
    messages: LLMMessage[],
    options?: LLMCompletionOptions
  ): AsyncIterable<string>;
}

export class ProviderConfigError extends Error {
  public statusCode = 503;
  constructor(message: string) {
    super(message);
    this.name = "ProviderConfigError";
  }
}

export class ProviderTimeoutError extends Error {
  public statusCode = 504;
  constructor(message: string) {
    super(message);
    this.name = "ProviderTimeoutError";
  }
}

export class ProviderUpstreamError extends Error {
  public statusCode = 502;
  constructor(message: string, public upstreamStatus?: number) {
    super(message);
    this.name = "ProviderUpstreamError";
  }
}

export class GeminiProviderAdapter implements ILLMProvider {
  private apiKey: string;
  private model: string;
  private baseUrl: string;
  private customFetch?: typeof fetch;

  constructor(options?: {
    apiKey?: string;
    model?: string;
    baseUrl?: string;
    fetchFn?: typeof fetch;
  }) {
    this.apiKey = options?.apiKey ?? env.get("GEMINI_API_KEY") ?? process.env.GEMINI_API_KEY ?? "";
    this.model = options?.model ?? env.get("GEMINI_MODEL", "gemini-2.0-flash") ?? process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
    this.baseUrl = options?.baseUrl ?? "https://generativelanguage.googleapis.com/v1beta/models";
    this.customFetch = options?.fetchFn;
  }

  public getProviderName(): string {
    return "Google Gemini";
  }

  public getModelName(): string {
    return this.model;
  }

  public isConfigured(): boolean {
    const key = (this.apiKey || env.get("GEMINI_API_KEY") || process.env.GEMINI_API_KEY || "").trim();
    return key.length > 0;
  }

  /**
   * Generates completion text from Google Gemini API with bounded retries & exponential backoff.
   */
  public async generateText(
    messages: LLMMessage[],
    options?: LLMCompletionOptions
  ): Promise<string> {
    const requestStartTime = Date.now();
    const apiKey = (this.apiKey || env.get("GEMINI_API_KEY") || process.env.GEMINI_API_KEY || "").trim();
    if (!apiKey || apiKey.length === 0) {
      Logger.warn("GeminiProviderAdapter: Missing GEMINI_API_KEY configuration.");
      throw new ProviderConfigError(
        "AI Mentor service is temporarily unavailable: LLM provider is not configured. Please configure GEMINI_API_KEY in server environment."
      );
    }

    // Bounded configuration defaults
    const boundedTimeoutMs = Math.min(
      Math.max(5000, options?.timeoutMs ?? 30000),
      45000
    );
    const boundedMaxTokens = Math.min(
      Math.max(64, options?.maxTokens ?? 1024),
      2048
    );
    const boundedTemperature = Math.min(
      Math.max(0.0, options?.temperature ?? 0.3),
      1.0
    );
    const thinkingBudget = options?.thinkingBudget ?? 0;
    const maxRetries = options?.maxRetries ?? 2;

    // Extract system messages into systemInstruction
    const systemParts: string[] = [];
    const nonSystemMessages: LLMMessage[] = [];

    for (const msg of messages) {
      if (msg.role === "system") {
        systemParts.push(msg.content);
      } else {
        nonSystemMessages.push(msg);
      }
    }

    // Map conversation turns to Gemini format with turn coalescing & multimodal parts
    type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } };
    const contents: Array<{ role: "user" | "model"; parts: GeminiPart[] }> = [];

    for (const msg of nonSystemMessages) {
      const geminiRole = msg.role === "assistant" ? "model" : "user";
      const parts: GeminiPart[] = [];

      // Support both single attachment and array of attachments
      const allAttachments: LLMAttachment[] = [];
      if (msg.attachments && Array.isArray(msg.attachments)) {
        allAttachments.push(...msg.attachments);
      } else if (msg.attachment) {
        allAttachments.push(msg.attachment);
      }

      for (const att of allAttachments) {
        if (att && att.mimeType && att.base64) {
          parts.push({
            inlineData: {
              mimeType: att.mimeType,
              data: att.base64,
            },
          });
        }
      }

      if (msg.content) {
        parts.push({ text: msg.content });
      }

      const lastContent = contents[contents.length - 1];

      if (lastContent && lastContent.role === geminiRole) {
        lastContent.parts.push(...parts);
      } else {
        contents.push({
          role: geminiRole,
          parts: parts.length > 0 ? parts : [{ text: "Hello" }],
        });
      }
    }

    if (contents.length === 0) {
      contents.push({
        role: "user",
        parts: [{ text: "Hello" }],
      });
    }

    // Build standard Google Gemini generateContent payload
    const requestBody: {
      contents: typeof contents;
      generationConfig: {
        temperature: number;
        maxOutputTokens: number;
        thinkingConfig?: {
          thinkingBudget: number;
        };
      };
      systemInstruction?: {
        parts: Array<{ text: string }>;
      };
    } = {
      contents,
      generationConfig: {
        temperature: boundedTemperature,
        maxOutputTokens: boundedMaxTokens,
        thinkingConfig: {
          thinkingBudget,
        },
      },
    };

    if (systemParts.length > 0) {
      requestBody.systemInstruction = {
        parts: [{ text: systemParts.join("\n\n") }],
      };
    }

    const fetchImpl = this.customFetch || fetch;
    const endpoint = `${this.baseUrl}/${encodeURIComponent(this.model)}:generateContent`;

    // Execute with bounded retries & exponential backoff for transient network/503/429 failures
    let lastError: unknown = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        const backoffMs = Math.min(1500 * Math.pow(2, attempt - 1), 5000);
        Logger.info(`GeminiProviderAdapter: Retrying request after backoff (attempt ${attempt}/${maxRetries})`, {
          backoffMs,
        });
        await new Promise((r) => setTimeout(r, backoffMs));
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), boundedTimeoutMs);

      try {
        const providerReqStart = Date.now();
        Logger.info("GeminiProviderAdapter: Calling Google Gemini API", {
          model: this.model,
          attempt,
          turnsCount: contents.length,
          hasSystemInstruction: systemParts.length > 0,
          maxTokens: boundedMaxTokens,
          thinkingBudget,
        });

        const response = await fetchImpl(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });

        const providerReqEnd = Date.now();
        clearTimeout(timeoutId);

        if (!response.ok) {
          let errorSnippet = "";
          try {
            const errJson = await response.json();
            errorSnippet = errJson?.error?.message || response.statusText;
          } catch {
            errorSnippet = response.statusText;
          }

          Logger.error("GeminiProviderAdapter: Upstream API returned error", {
            status: response.status,
            statusText: response.statusText,
            errorSnippet: errorSnippet.slice(0, 100),
            latencyMs: providerReqEnd - providerReqStart,
            attempt,
          });

          const lowerErr = errorSnippet.toLowerCase();
          if (
            response.status === 401 ||
            response.status === 403 ||
            (response.status === 400 && (lowerErr.includes("api_key") || lowerErr.includes("key not valid")))
          ) {
            // Fatal auth configuration error - do NOT retry
            throw new ProviderConfigError(
              "AI Mentor upstream authentication failed. Please check provider credentials."
            );
          }

          // Deterministic client errors - do NOT retry
          if (response.status === 400 || response.status === 404 || response.status === 413) {
            throw new ProviderUpstreamError(
              response.status === 413
                ? "Attachment payload exceeds provider limits."
                : "The request could not be processed by the AI provider.",
              response.status
            );
          }

          // Retryable transient errors: 429 (rate limit) or 503/500/502/504
          const isRetryable =
            response.status === 429 ||
            response.status === 500 ||
            response.status === 502 ||
            response.status === 503 ||
            response.status === 504;

          if (isRetryable && attempt < maxRetries) {
            lastError = new ProviderUpstreamError(
              response.status === 429
                ? "The AI service is temporarily busy. Please retry in a few seconds."
                : "The AI service encountered a temporary hiccup. Retrying...",
              response.status
            );
            continue;
          }

          if (response.status === 429) {
            throw new ProviderUpstreamError(
              "The AI service is temporarily busy due to high demand. Please retry in a few seconds.",
              429
            );
          }

          throw new ProviderUpstreamError(
            "The AI service is temporarily busy. Please retry in a moment.",
            response.status
          );
        }

        const data = await response.json();
        const totalLatency = Date.now() - requestStartTime;
        const upstreamLatency = providerReqEnd - providerReqStart;

        Logger.info("GeminiProviderAdapter: Successful response received", {
          model: this.model,
          upstreamLatencyMs: upstreamLatency,
          totalLatencyMs: totalLatency,
          attempt,
        });

        const candidate = data?.candidates?.[0];
        const assistantContent =
          candidate?.content?.parts
            ?.map((p: { text?: string }) => p.text || "")
            .join("") || "";

        if (typeof assistantContent !== "string" || assistantContent.trim().length === 0) {
          Logger.error("GeminiProviderAdapter: Empty or invalid candidate content returned", {
            finishReason: candidate?.finishReason,
          });
          if (candidate?.finishReason === "SAFETY") {
            throw new ProviderUpstreamError(
              "I can help with engineering, academics, careers, projects, and student learning, but I can't assist with that."
            );
          }
          throw new ProviderUpstreamError(
            "The AI service returned an empty response. Please retry."
          );
        }

        return assistantContent.trim();
      } catch (error: unknown) {
        clearTimeout(timeoutId);

        if (error instanceof ProviderConfigError) {
          throw error;
        }

        if (error instanceof Error && error.name === "AbortError") {
          Logger.error("GeminiProviderAdapter: Request timed out", {
            timeoutMs: boundedTimeoutMs,
            attempt,
          });
          if (attempt < maxRetries) {
            lastError = error;
            continue;
          }
          throw new ProviderTimeoutError(
            "I couldn't complete the response in time. Your message is safe; please retry in a moment."
          );
        }

        // Retryable network errors (e.g. fetch failed, socket closed)
        if (attempt < maxRetries) {
          Logger.warn("GeminiProviderAdapter: Network error during request, will retry", {
            message: error instanceof Error ? error.message : "Unknown error",
            attempt,
          });
          lastError = error;
          continue;
        }

        if (error instanceof ProviderUpstreamError) {
          throw error;
        }

        Logger.error("GeminiProviderAdapter: Unexpected network or execution failure", {
          message: error instanceof Error ? error.message : "Unknown error",
        });

        throw new ProviderUpstreamError(
          "I couldn't reach the AI service right now. Your message is safe. Please retry in a moment."
        );
      }
    }

    if (lastError instanceof Error) {
      throw lastError;
    }
    throw new ProviderUpstreamError(
      "The AI service is temporarily busy. Please retry in a few seconds."
    );
  }

  /**
   * Generates a streaming text completion from Google Gemini API via Server-Sent Events (SSE).
   * Yields token text chunks progressively as they arrive from upstream.
   */
  public async *generateStream(
    messages: LLMMessage[],
    options?: LLMCompletionOptions
  ): AsyncIterable<string> {
    const apiKey = (this.apiKey || env.get("GEMINI_API_KEY") || process.env.GEMINI_API_KEY || "").trim();
    if (!apiKey || apiKey.length === 0) {
      Logger.warn("GeminiProviderAdapter stream: Missing GEMINI_API_KEY configuration.");
      throw new ProviderConfigError(
        "AI Mentor service is temporarily unavailable: LLM provider is not configured. Please configure GEMINI_API_KEY in server environment."
      );
    }

    const boundedTimeoutMs = Math.min(Math.max(5000, options?.timeoutMs ?? 35000), 45000);
    const boundedMaxTokens = Math.min(Math.max(64, options?.maxTokens ?? 1200), 2048);
    const boundedTemperature = Math.min(Math.max(0.0, options?.temperature ?? 0.3), 1.0);
    const thinkingBudget = options?.thinkingBudget ?? 0;
    const maxRetries = options?.maxRetries ?? 2;

    const systemParts: string[] = [];
    const nonSystemMessages: LLMMessage[] = [];

    for (const msg of messages) {
      if (msg.role === "system") {
        systemParts.push(msg.content);
      } else {
        nonSystemMessages.push(msg);
      }
    }

    type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } };
    const contents: Array<{ role: "user" | "model"; parts: GeminiPart[] }> = [];

    for (const msg of nonSystemMessages) {
      const geminiRole = msg.role === "assistant" ? "model" : "user";
      const parts: GeminiPart[] = [];

      const allAttachments: LLMAttachment[] = [];
      if (msg.attachments && Array.isArray(msg.attachments)) {
        allAttachments.push(...msg.attachments);
      } else if (msg.attachment) {
        allAttachments.push(msg.attachment);
      }

      for (const att of allAttachments) {
        if (att && att.mimeType && att.base64) {
          parts.push({
            inlineData: {
              mimeType: att.mimeType,
              data: att.base64,
            },
          });
        }
      }

      if (msg.content) {
        parts.push({ text: msg.content });
      }

      const lastContent = contents[contents.length - 1];
      if (lastContent && lastContent.role === geminiRole) {
        lastContent.parts.push(...parts);
      } else {
        contents.push({
          role: geminiRole,
          parts: parts.length > 0 ? parts : [{ text: "Hello" }],
        });
      }
    }

    if (contents.length === 0) {
      contents.push({ role: "user", parts: [{ text: "Hello" }] });
    }

    const requestBody: {
      contents: typeof contents;
      generationConfig: {
        temperature: number;
        maxOutputTokens: number;
        thinkingConfig?: { thinkingBudget: number };
      };
      systemInstruction?: { parts: Array<{ text: string }> };
    } = {
      contents,
      generationConfig: {
        temperature: boundedTemperature,
        maxOutputTokens: boundedMaxTokens,
        thinkingConfig: { thinkingBudget },
      },
    };

    if (systemParts.length > 0) {
      requestBody.systemInstruction = {
        parts: [{ text: systemParts.join("\n\n") }],
      };
    }

    const fetchImpl = this.customFetch || fetch;
    const endpoint = `${this.baseUrl}/${encodeURIComponent(this.model)}:streamGenerateContent?alt=sse`;

    let response: Response | null = null;
    let lastError: unknown = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        const backoffMs = Math.min(1500 * Math.pow(2, attempt - 1), 5000);
        Logger.info(`GeminiProviderAdapter stream: Retrying after backoff (attempt ${attempt}/${maxRetries})`, { backoffMs });
        await new Promise((r) => setTimeout(r, backoffMs));
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), boundedTimeoutMs);

      try {
        const res = await fetchImpl(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          response = res;
          break;
        }

        const isRetryable =
          res.status === 429 ||
          res.status === 500 ||
          res.status === 502 ||
          res.status === 503 ||
          res.status === 504;

        if (isRetryable && attempt < maxRetries) {
          lastError = new ProviderUpstreamError(
            res.status === 429
              ? "The AI service is temporarily busy due to high demand. Please retry in a few seconds."
              : "The AI service encountered a temporary hiccup. Retrying...",
            res.status
          );
          continue;
        }

        if (res.status === 429) {
          throw new ProviderUpstreamError(
            "The AI service is temporarily busy due to high demand. Please retry in a few seconds.",
            429
          );
        }
        if (res.status === 503) {
          throw new ProviderUpstreamError(
            "The AI service is temporarily busy. Please retry in a few seconds.",
            503
          );
        }

        throw new ProviderUpstreamError(
          "The AI service encountered an upstream error. Please retry in a moment.",
          res.status
        );
      } catch (err: unknown) {
        clearTimeout(timeoutId);
        if (err instanceof ProviderConfigError || err instanceof ProviderUpstreamError) {
          throw err;
        }
        if (err instanceof Error && (err.name === "AbortError" || err.message.includes("abort"))) {
          if (attempt < maxRetries) {
            lastError = err;
            continue;
          }
          throw new ProviderTimeoutError(
            "I couldn't complete the response in time. Your message is safe; please retry in a moment."
          );
        }
        if (attempt < maxRetries) {
          lastError = err;
          continue;
        }
        throw new ProviderUpstreamError(
          "I couldn't reach the AI service right now. Your message is safe. Please retry in a moment."
        );
      }
    }

    if (!response || !response.body) {
      if (lastError instanceof Error) throw lastError;
      throw new ProviderUpstreamError(
        "I couldn't reach the AI service right now. Your message is safe. Please retry in a moment."
      );
    }

    // Read SSE stream chunks
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data:")) continue;
          const jsonStr = trimmed.slice(5).trim();
          if (!jsonStr || jsonStr === "[DONE]") continue;

          try {
            const parsed = JSON.parse(jsonStr);
            const parts = parsed.candidates?.[0]?.content?.parts;
            if (Array.isArray(parts)) {
              for (const part of parts) {
                if (typeof part.text === "string" && !part.thought && part.text.length > 0) {
                  yield part.text;
                }
              }
            }
          } catch {
            // Partial JSON buffer, wait for next chunk
          }
        }
      }

      if (buffer.trim().startsWith("data:")) {
        const jsonStr = buffer.trim().slice(5).trim();
        if (jsonStr && jsonStr !== "[DONE]") {
          try {
            const parsed = JSON.parse(jsonStr);
            const parts = parsed.candidates?.[0]?.content?.parts;
            if (Array.isArray(parts)) {
              for (const part of parts) {
                if (typeof part.text === "string" && !part.thought && part.text.length > 0) {
                  yield part.text;
                }
              }
            }
          } catch {
            // Ignore
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

export const geminiProvider = new GeminiProviderAdapter();

// Backward compatibility alias for existing tests
export class XAIProviderAdapter extends GeminiProviderAdapter {}
export const xaiProvider = geminiProvider;
