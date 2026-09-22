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
import { rateLimiter, RATE_LIMIT_TIERS } from "@/lib/rate-limiter";

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

    // Free-tier safety: Bounded AI requests per user (approx 10/min)
    const rateLimitResult = rateLimiter.check(
      `ai_mentor_${session.userId}`,
      RATE_LIMIT_TIERS.AI_MENTOR
    );
    if (!rateLimitResult.allowed) {
      return ResponseBuilder.error(
        `Rate limit exceeded: You can make up to ${rateLimitResult.limit} AI Mentor requests per minute. Please wait ${rateLimitResult.retryAfter}s.`,
        429,
        "RATE_LIMIT_EXCEEDED"
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

    const { threadId, message, attachment, attachments, stream: requestStream } = body as {
      threadId?: unknown;
      message?: unknown;
      attachment?: { name?: unknown; mimeType?: unknown; base64?: unknown };
      attachments?: Array<{ name?: unknown; mimeType?: unknown; base64?: unknown }>;
      stream?: unknown;
    };

    const isStreamRequested =
      requestStream === true ||
      request.headers.get("accept")?.includes("text/event-stream") === true;

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

    // 2. Validate attachments if provided (support up to 2 for document comparison)
    const ALLOWED_MIME_TYPES = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/webp",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.ms-powerpoint",
    ];
    const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024; // 5MB per file

    const rawAttachments: Array<{ name?: unknown; mimeType?: unknown; base64?: unknown }> = [];
    if (attachments && Array.isArray(attachments)) {
      rawAttachments.push(...attachments.slice(0, 2));
    } else if (attachment && typeof attachment === "object") {
      rawAttachments.push(attachment);
    }

    const validAttachments: Array<{ name: string; mimeType: string; base64: string }> = [];

    for (const att of rawAttachments) {
      if (
        typeof att !== "object" ||
        typeof att.mimeType !== "string" ||
        typeof att.base64 !== "string"
      ) {
        return ResponseBuilder.error(
          "Validation Error: Invalid attachment format.",
          400,
          "VALIDATION_ERROR"
        );
      }

      const attName =
        typeof att.name === "string" && att.name.trim()
          ? att.name.trim().slice(0, 100)
          : "document";

      const lowerName = attName.toLowerCase();
      const isDocxExt = lowerName.endsWith(".docx") || lowerName.endsWith(".doc");
      const isPptxExt = lowerName.endsWith(".pptx") || lowerName.endsWith(".ppt");
      const isAllowedMime =
        ALLOWED_MIME_TYPES.includes(att.mimeType) ||
        ((isDocxExt || isPptxExt) &&
          (att.mimeType === "application/octet-stream" ||
            att.mimeType === "application/x-zip-compressed" ||
            att.mimeType === "application/zip"));

      if (!isAllowedMime) {
        return ResponseBuilder.error(
          `This file type isn't supported yet. Please attach a PDF, DOCX, PPTX, PNG, JPG/JPEG, or WEBP file.`,
          400,
          "UNSUPPORTED_MEDIA_TYPE"
        );
      }

      const approxBytes = Math.ceil((att.base64.length * 3) / 4);
      if (approxBytes > MAX_ATTACHMENT_SIZE) {
        return ResponseBuilder.error(
          "Attachment exceeds maximum allowed size of 5MB.",
          400,
          "PAYLOAD_TOO_LARGE"
        );
      }

      let resolvedMime = att.mimeType;
      if (isDocxExt && !att.mimeType.includes("wordprocessingml")) {
        resolvedMime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      } else if (isPptxExt && !att.mimeType.includes("presentationml")) {
        resolvedMime = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
      }

      validAttachments.push({
        name: attName,
        mimeType: resolvedMime,
        base64: att.base64,
      });
    }

    // 3. Resolve or create chat thread with strict user isolation
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
      attachmentsCount: validAttachments.length,
      streaming: isStreamRequested,
    });

    // 4. Persist user message to chat_messages (with attachment header if provided)
    let messageToPersist = cleanMessage;
    if (validAttachments.length === 1) {
      messageToPersist = `[Attachment: ${validAttachments[0].name} (${validAttachments[0].mimeType})]\n${cleanMessage}`;
    } else if (validAttachments.length > 1) {
      const names = validAttachments.map((a) => a.name).join(", ");
      messageToPersist = `[Attachments: ${names}]\n${cleanMessage}`;
    }

    await chatRepository.appendMessage(activeChatId, "user", messageToPersist);

    // 5. Handle Progressive Streaming SSE Mode
    if (isStreamRequested) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            let fullAssistantText = "";
            for await (const chunk of mentorService.generateMentorStream(
              session.userId,
              activeChatId,
              cleanMessage,
              validAttachments
            )) {
              fullAssistantText += chunk;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "token", token: chunk })}\n\n`)
              );
            }

            // Persist final assistant response to chat_messages in database
            const persistedAssistantMsg = await chatRepository.appendMessage(
              activeChatId,
              "assistant",
              fullAssistantText
            );

            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "done",
                  threadId: activeChatId,
                  message: {
                    messageId: persistedAssistantMsg.messageId,
                    senderType: "assistant",
                    message: persistedAssistantMsg.message,
                    createdAt: persistedAssistantMsg.createdAt,
                  },
                })}\n\n`
              )
            );
            controller.close();
          } catch (err: unknown) {
            Logger.error("POST /api/chat/message: Streaming error", err);
            let friendlyError = "AI Mentor is temporarily unavailable. Your message has been saved. Please retry shortly.";
            if (err instanceof ProviderTimeoutError) {
              friendlyError = "I couldn't complete the response in time. Your message is safe; please retry in a moment.";
            } else if (err instanceof ProviderUpstreamError && err.upstreamStatus === 429) {
              friendlyError = "The AI service is temporarily busy due to high demand. Please retry in a few seconds.";
            }
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "error", error: friendlyError })}\n\n`)
            );
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          "Connection": "keep-alive",
        },
      });
    }

    // 6. Non-Streaming Fallback: Generate real assistant response via MentorService
    const assistantText = await mentorService.generateMentorResponse(
      session.userId,
      activeChatId,
      cleanMessage,
      validAttachments
    );

    // 7. Persist assistant response to chat_messages
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
        "The AI Mentor service is temporarily unconfigured. Please contact support or check server settings.",
        503,
        "PROVIDER_CONFIG_ERROR"
      );
    }

    if (error instanceof ProviderTimeoutError) {
      Logger.error("POST /api/chat/message: Provider timeout", {
        message: error.message,
      });
      return ResponseBuilder.error(
        "I couldn't complete the response in time. Your message is safe; please retry in a moment.",
        504,
        "GATEWAY_TIMEOUT"
      );
    }

    if (error instanceof ProviderUpstreamError) {
      Logger.error("POST /api/chat/message: Provider upstream failure", {
        message: error.message,
        upstreamStatus: error.upstreamStatus,
      });
      const statusCode = error.upstreamStatus === 429 ? 429 : 502;
      const errorCode = error.upstreamStatus === 429 ? "RATE_LIMIT_EXCEEDED" : "BAD_GATEWAY";
      const friendlyMessage =
        error.upstreamStatus === 429
          ? "The AI service is temporarily busy due to high demand. Please retry in a few seconds."
          : "The AI service encountered a temporary hiccup. Please retry in a moment.";
      return ResponseBuilder.error(
        friendlyMessage,
        statusCode,
        errorCode
      );
    }

    Logger.error("POST /api/chat/message: Unexpected error", error);
    return ResponseBuilder.error(
      "I couldn't reach the AI service right now. Your message is safe. Please retry in a moment.",
      500,
      "INTERNAL_ERROR"
    );
  }
}
