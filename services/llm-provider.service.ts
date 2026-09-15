/**
 * @file services/llm-provider.service.ts
 * @description Provider abstraction and xAI/Grok adapter for CampusOS AI Mentor.
 * @purpose Enables server-side LLM completion with strict timeouts, error normalization, and safe defaults.
 */

import { env } from "@/lib/env";
import { Logger } from "@/lib/logger";

export type LLMMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type LLMCompletionOptions = {
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
};

export interface ILLMProvider {
  getProviderName(): string;
  generateText(
    messages: LLMMessage[],
    options?: LLMCompletionOptions
  ): Promise<string>;
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

export class XAIProviderAdapter implements ILLMProvider {
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
    this.apiKey = options?.apiKey ?? env.get("XAI_API_KEY");
    this.model = options?.model ?? env.get("XAI_MODEL", "grok-2-latest");
    this.baseUrl = options?.baseUrl ?? "https://api.x.ai/v1/chat/completions";
    this.customFetch = options?.fetchFn;
  }

  public getProviderName(): string {
    return "xAI/Grok";
  }

  public getModelName(): string {
    return this.model;
  }

  /**
   * Generates completion text from xAI Grok API.
   */
  public async generateText(
    messages: LLMMessage[],
    options?: LLMCompletionOptions
  ): Promise<string> {
    const apiKey = this.apiKey || env.get("XAI_API_KEY");
    if (!apiKey || apiKey.trim().length === 0) {
      Logger.warn("XAIProviderAdapter: Missing XAI_API_KEY configuration.");
      throw new ProviderConfigError(
        "AI Mentor service is temporarily unavailable: LLM provider is not configured."
      );
    }

    // Bounded configuration defaults
    const boundedTimeoutMs = Math.min(
      Math.max(5000, options?.timeoutMs ?? 25000),
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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), boundedTimeoutMs);

    const fetchImpl = this.customFetch || fetch;

    try {
      Logger.info("XAIProviderAdapter: Calling xAI completions API", {
        model: this.model,
        messageCount: messages.length,
        maxTokens: boundedMaxTokens,
      });

      const response = await fetchImpl(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: boundedTemperature,
          max_tokens: boundedMaxTokens,
          stream: false,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorSnippet = "";
        try {
          const errJson = await response.json();
          errorSnippet = errJson?.error?.message || response.statusText;
        } catch {
          errorSnippet = response.statusText;
        }

        Logger.error("XAIProviderAdapter: Upstream API returned error", {
          status: response.status,
          statusText: response.statusText,
          errorSnippet: errorSnippet.slice(0, 100), // bounded, no secrets
        });

        if (response.status === 401 || response.status === 403) {
          throw new ProviderConfigError(
            "AI Mentor upstream authentication failed. Please check provider credentials."
          );
        }

        throw new ProviderUpstreamError(
          `AI Mentor provider error (HTTP ${response.status}).`,
          response.status
        );
      }

      const data = await response.json();
      const choice = data?.choices?.[0];
      const assistantContent = choice?.message?.content;

      if (typeof assistantContent !== "string") {
        Logger.error("XAIProviderAdapter: Empty or invalid choice content returned", {
          choicesCount: data?.choices?.length,
        });
        throw new ProviderUpstreamError("AI Mentor received an empty response from provider.");
      }

      return assistantContent.trim();
    } catch (error: unknown) {
      clearTimeout(timeoutId);

      if (error instanceof ProviderConfigError || error instanceof ProviderUpstreamError) {
        throw error;
      }

      if (error instanceof Error && error.name === "AbortError") {
        Logger.error("XAIProviderAdapter: Request timed out", { timeoutMs: boundedTimeoutMs });
        throw new ProviderTimeoutError(
          `AI Mentor request timed out after ${boundedTimeoutMs / 1000}s.`
        );
      }

      Logger.error("XAIProviderAdapter: Unexpected network or execution failure", {
        message: error instanceof Error ? error.message : "Unknown error",
      });

      throw new ProviderUpstreamError("Failed to communicate with AI Mentor provider.");
    }
  }
}

export const xaiProvider = new XAIProviderAdapter();
