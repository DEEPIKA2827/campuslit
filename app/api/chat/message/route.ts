/**
 * @file app/api/chat/message/route.ts
 * @description Next.js Route Handler for CampusOS AI Mentor Conversational Messages.
 * @purpose Handles real server-side LLM completion, user context injection, and message persistence.
 * @security Strictly enforces getAuthenticatedUser() session verification and thread isolation.
 */

import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { chatRepository } from "@/repositories/chat.repository";
import { mentorService } from "@/services/mentor.service";
import {
  ProviderConfigError,
  ProviderTimeoutError,
  ProviderUpstreamError,
} from "@/services/llm-provider.service";
import { ResponseBuilder } from "@/utils/api-response";
import { Logger } from "@/lib/logger";

const MAX_MESSAGE_LENGTH = 4000;

/**
 * POST /api/chat/message
 * Sends a message to the AI Mentor, orchestrating LLM completion and thread persistence.
 */
export async function POST(request: NextRequest) {
  try {
    const session = getAuthenticatedUser(request);
    if (!session) {
      return ResponseBuilder.error(
        "Unauthorized: Authentication required.",
        401,
        "UNAUTHORIZED"
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return ResponseBuilder.error(
        "Validation Error: Request body must be a valid JSON object.",
        400,
        "VALIDATION_ERROR"
      );
    }

    const { threadId, message } = body as { threadId?: unknown; message?: unknown };

    // 1. Validate message input
    if (typeof message !== "string") {
      return ResponseBuilder.error(
        "Validation Error: Message text is required and must be a string.",
        400,
        "VALIDATION_ERROR"
      );
    }

    const cleanMessage = message.trim();
    if (cleanMessage.length === 0) {
      return ResponseBuilder.error(
        "Validation Error: Message text cannot be empty or whitespace only.",
        400,
        "VALIDATION_ERROR"
      );
    }

    if (cleanMessage.length > MAX_MESSAGE_LENGTH) {
      return ResponseBuilder.error(
        `Validation Error: Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters.`,
        400,
        "VALIDATION_ERROR"
      );
    }

    // 2. Resolve or create chat thread with strict user isolation
    let activeChatId: number;

    if (threadId !== undefined && threadId !== null) {
      const parsedThreadId = Number(threadId);
      if (!Number.isInteger(parsedThreadId) || parsedThreadId <= 0) {
        return ResponseBuilder.error(
          "Validation Error: Thread ID must be a positive integer.",
          400,
          "VALIDATION_ERROR"
        );
      }

      const existingThread = await chatRepository.getThreadById(
        parsedThreadId,
        session.userId
      );
      if (!existingThread) {
        return ResponseBuilder.error(
          "Not Found Error: Chat thread not found or unauthorized.",
          404,
          "NOT_FOUND"
        );
      }
      activeChatId = existingThread.chatId;
    } else {
      // Auto-generate title from message snippet
      const titleSnippet =
        cleanMessage.length > 36
          ? `${cleanMessage.slice(0, 36).trim()}...`
          : cleanMessage;
      const newThread = await chatRepository.createThread(
        session.userId,
        titleSnippet || "AI Mentor Session"
      );
      activeChatId = newThread.chatId;
    }

    Logger.info("POST /api/chat/message processing", {
      userId: session.userId,
      chatId: activeChatId,
    });

    // 3. Persist user message to chat_messages
    await chatRepository.appendMessage(activeChatId, "user", cleanMessage);

    // 4. Generate real assistant response via MentorService
    const assistantText = await mentorService.generateMentorResponse(
      session.userId,
      activeChatId,
      cleanMessage
    );

    // 5. Persist assistant response to chat_messages
    const persistedAssistantMsg = await chatRepository.appendMessage(
      activeChatId,
      "assistant",
      assistantText
    );

    return ResponseBuilder.success(
      {
        threadId: activeChatId,
        message: {
          messageId: persistedAssistantMsg.messageId,
          senderType: "assistant",
          message: persistedAssistantMsg.message,
          createdAt: persistedAssistantMsg.createdAt,
        },
      },
      "Assistant response generated successfully."
    );
  } catch (error: unknown) {
    if (error instanceof ProviderConfigError) {
      Logger.warn("POST /api/chat/message: Provider configuration error", {
        message: error.message,
      });
      return ResponseBuilder.error(
        error.message,
        503,
        "PROVIDER_CONFIG_ERROR"
      );
    }

    if (error instanceof ProviderTimeoutError) {
      Logger.error("POST /api/chat/message: Provider timeout", {
        message: error.message,
      });
      return ResponseBuilder.error(
        error.message,
        504,
        "GATEWAY_TIMEOUT"
      );
    }

    if (error instanceof ProviderUpstreamError) {
      Logger.error("POST /api/chat/message: Provider upstream failure", {
        message: error.message,
        upstreamStatus: error.upstreamStatus,
      });
      return ResponseBuilder.error(
        error.message,
        502,
        "BAD_GATEWAY"
      );
    }

    Logger.error("POST /api/chat/message: Unexpected error", error);
    return ResponseBuilder.error(
      "An unexpected error occurred while processing your message.",
      500,
      "INTERNAL_ERROR"
    );
  }
}
