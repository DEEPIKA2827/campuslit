"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import {
  MessageSquare,
  Plus,
  Compass,
  FileText,
  Mic,
  BookOpen,
  Send,
  Sparkles,
  UserCheck,
  Copy,
  Check,
  Terminal,
  Paperclip,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  X,
  FileUp,
} from "lucide-react";
import { ChatThreadPreviewDTO } from "@/types/api.types";
import { MarkdownRenderer } from "@/components/ai/markdown-renderer";

// Suggested Prompt Chips
const promptCategories = [
  {
    id: "roadmap",
    icon: Compass,
    title: "Roadmap Guidance",
    prompt: "What is my next priority milestone in my CampusOS roadmap and how should I approach it?",
    color: "from-purple-500/20 to-indigo-500/20",
    textColor: "text-purple-300",
  },
  {
    id: "action-radar",
    icon: FileText,
    title: "Action Radar Mission",
    prompt: "Explain my current Action Radar mission and what urgent actions I need to take this week.",
    color: "from-blue-500/20 to-cyan-500/20",
    textColor: "text-blue-300",
  },
  {
    id: "interview",
    icon: Mic,
    title: "Lab Viva Prep",
    prompt: "Simulate top 5 engineering lab viva questions for my current semester with model answers.",
    color: "from-emerald-500/20 to-teal-500/20",
    textColor: "text-emerald-300",
  },
  {
    id: "academics",
    icon: BookOpen,
    title: "Attendance & CIE",
    prompt: "Analyze my current attendance risks and tell me where I stand regarding safe bunks.",
    color: "from-amber-500/20 to-orange-500/20",
    textColor: "text-amber-300",
  },
];

interface UIMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  verified: boolean;
  isError?: boolean;
}

const getMessageId = () => `m_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
const getFormattedTime = (date?: string | number | Date) => {
  const d = date ? new Date(date) : new Date();
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export default function AIMentorPage() {
  const { user, profile } = useAuth();
  const studentName = profile?.firstName || user?.email?.split("@")[0] || "Engineer";

  const getGreetingMessage = useCallback(
    (name: string): UIMessage => ({
      id: "greeting",
      sender: "ai",
      text: `Hello ${name} 👋 I'm your CampusOS AI Senior Mentor, connected to your verified academic record, personalized roadmap, and Action Radar mission control. How can I help you conquer your engineering semester today?`,
      timestamp: getFormattedTime(),
      verified: true,
    }),
    []
  );

  // Messages state
  const [messages, setMessages] = useState<UIMessage[]>([getGreetingMessage(studentName)]);

  // Threads state
  const [threads, setThreads] = useState<ChatThreadPreviewDTO[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [loadingThreads, setLoadingThreads] = useState<boolean>(true);

  // Input & submission state
  const [inputPrompt, setInputPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<
    Array<{
      file: File;
      base64: string;
      mimeType: string;
      fileName: string;
    }>
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2500);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (selectedFiles.length >= 2) {
      showNotification("You can attach up to 2 documents for comparison.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showNotification("File exceeds maximum allowed size of 5MB.");
      return;
    }
    const allowed = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.ms-powerpoint",
    ];
    const isOffice =
      file.name.toLowerCase().endsWith(".docx") ||
      file.name.toLowerCase().endsWith(".doc") ||
      file.name.toLowerCase().endsWith(".pptx") ||
      file.name.toLowerCase().endsWith(".ppt");
    if (!allowed.includes(file.type) && !isOffice) {
      showNotification("Unsupported file format. Please attach a PDF, DOCX, PPTX, or image (PNG/JPG/WEBP).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      const base64 = res.includes(",") ? res.split(",")[1] : res;
      setSelectedFiles((prev) => [
        ...prev,
        {
          file,
          base64,
          mimeType: file.type,
          fileName: file.name,
        },
      ]);
      showNotification(`Attached ${file.name}`);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Update initial greeting when profile first resolves
  useEffect(() => {
    if (profile?.firstName && activeThreadId === null) {
      setMessages((prev) =>
        prev.length === 1 && prev[0].id === "greeting"
          ? [getGreetingMessage(profile.firstName)]
          : prev
      );
    }
  }, [profile?.firstName, activeThreadId, getGreetingMessage]);

  // Load real user chat threads from API
  const fetchThreads = useCallback(async () => {
    try {
      setLoadingThreads(true);
      const res = await fetch("/api/chat/threads?preview=true", {
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setThreads(json.data);
        }
      }
    } catch {
      // Background load error handled silently
    } finally {
      setLoadingThreads(false);
    }
  }, []);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  // Load selected thread messages
  const handleSelectThread = async (chatId: number) => {
    if (activeThreadId === chatId || isGenerating) return;
    try {
      setActiveThreadId(chatId);
      const res = await fetch(`/api/chat/threads/${chatId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.messages) {
          const loaded: UIMessage[] = json.data.messages.map((m: any) => ({
            id: `msg_${m.messageId}`,
            sender: m.senderType === "assistant" ? "ai" : "user",
            text: m.message,
            timestamp: getFormattedTime(m.createdAt),
            verified: m.senderType === "assistant",
          }));
          setMessages(loaded.length > 0 ? loaded : [getGreetingMessage(studentName)]);
        }
      }
    } catch {
      showNotification("Failed to load conversation messages.");
    }
  };

  // Start new chat session
  const handleNewChat = () => {
    if (isGenerating) return;
    setActiveThreadId(null);
    setMessages([getGreetingMessage(studentName)]);
    showNotification("Started New Senior Mentor Session");
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Send message via real LLM API
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputPrompt).trim();
    if ((!query && selectedFiles.length === 0) || isGenerating) return;

    const currentAttachments = selectedFiles.map((sf) => ({
      name: sf.fileName,
      mimeType: sf.mimeType,
      base64: sf.base64,
    }));

    // Optimistically append user message with attachment notice if present
    let displayAttachmentNotice = "";
    if (currentAttachments.length === 1) {
      displayAttachmentNotice = `[Attached: ${currentAttachments[0].name}]\n`;
    } else if (currentAttachments.length > 1) {
      displayAttachmentNotice = `[Attached: ${currentAttachments.map((a) => a.name).join(", ")}]\n`;
    }

    const userMsg: UIMessage = {
      id: getMessageId(),
      sender: "user",
      text: `${displayAttachmentNotice}${query || "Please analyze this document."}`,
      timestamp: getFormattedTime(),
      verified: false,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputPrompt("");
    setSelectedFiles([]);
    setIsGenerating(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, currentAttachments.length > 0 ? 48000 : 32000);

    try {
      const response = await fetch("/api/chat/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream, application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          threadId: activeThreadId || undefined,
          message: query || "Please analyze this document.",
          attachments: currentAttachments,
          attachment: currentAttachments[0],
          stream: true,
        }),
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get("content-type") || "";

      if (response.ok && contentType.includes("text/event-stream") && response.body) {
        const aiMsgId = `msg_${Date.now()}`;
        const placeholderAiMsg: UIMessage = {
          id: aiMsgId,
          sender: "ai",
          text: "",
          timestamp: getFormattedTime(),
          verified: true,
        };
        setMessages((prev) => [...prev, placeholderAiMsg]);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulatedText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() || "";

          for (const part of parts) {
            const trimmed = part.trim();
            if (!trimmed.startsWith("data:")) continue;
            const dataStr = trimmed.slice(5).trim();
            if (!dataStr) continue;

            try {
              const eventData = JSON.parse(dataStr);
              if (eventData.type === "token" && typeof eventData.token === "string") {
                accumulatedText += eventData.token;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === aiMsgId ? { ...m, text: accumulatedText } : m
                  )
                );
              } else if (eventData.type === "done") {
                if (!activeThreadId && eventData.threadId) {
                  setActiveThreadId(eventData.threadId);
                }
                if (eventData.message?.messageId) {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === aiMsgId
                        ? {
                            ...m,
                            id: `msg_${eventData.message.messageId}`,
                            text: eventData.message.message || accumulatedText,
                            timestamp: getFormattedTime(eventData.message.createdAt),
                          }
                        : m
                    )
                  );
                }
                fetchThreads();
              } else if (eventData.type === "error") {
                throw new Error(eventData.error || "Streaming error encountered.");
              }
            } catch (err: unknown) {
              if (dataStr.includes("error")) throw err;
            }
          }
        }
      } else {
        const json = await response.json().catch(() => null);

        if (response.ok && json?.success && json?.data) {
          const { threadId, message: reply } = json.data;

          // Set thread id if newly created
          if (!activeThreadId && threadId) {
            setActiveThreadId(threadId);
          }

          const aiMsg: UIMessage = {
            id: `msg_${reply.messageId || Date.now()}`,
            sender: "ai",
            text: reply.message,
            timestamp: getFormattedTime(reply.createdAt),
            verified: true,
          };

          setMessages((prev) => [...prev, aiMsg]);

          // Refresh thread list in sidebar
          fetchThreads();
        } else {
          // Restore user query on error so message doesn't disappear
          setInputPrompt(query);

          const errorMsg =
            json?.message ||
            json?.error?.message ||
            (response.status === 503
              ? "The AI service is temporarily busy. Please retry in a few seconds."
              : response.status === 504
              ? "I couldn't complete the response in time. Your message is safe; please retry in a moment."
              : response.status === 429
              ? "AI Mentor request rate limit reached. Please wait a moment before trying again."
              : "I couldn't reach the AI service right now. Your message is safe. Please retry in a moment.");

          const errorUiMsg: UIMessage = {
            id: getMessageId(),
            sender: "ai",
            text: `⚠️ **Mentor Notice**: ${errorMsg}`,
            timestamp: getFormattedTime(),
            verified: false,
            isError: true,
          };

          setMessages((prev) => [...prev, errorUiMsg]);
        }
      }
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      // Restore user query so message does not disappear
      setInputPrompt(query);

      const isTimeout =
        err instanceof Error &&
        (err.name === "AbortError" || err.message.toLowerCase().includes("abort"));

      const networkErrorMsg: UIMessage = {
        id: getMessageId(),
        sender: "ai",
        text: isTimeout
          ? "⚠️ **Request Timeout**: The AI Senior Mentor request exceeded time limit. Your question has been restored to the input box so you can retry."
          : `⚠️ **Connection Notice**: ${
              err instanceof Error && err.message && !err.message.includes("Streaming error")
                ? err.message
                : "I couldn't reach the AI service right now. Your message is safe in the input box. Please retry in a moment."
            }`,
        timestamp: getFormattedTime(),
        verified: false,
        isError: true,
      };

      setMessages((prev) => [...prev, networkErrorMsg]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#08090e] text-[#f3f4f6] flex flex-col justify-between selection:bg-purple-500/30 selection:text-purple-200">
      {/* HEADER NAVBAR */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#08090e]/80 border-b border-white/10">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 font-bold text-white text-xs shadow-lg shadow-purple-500/25"
            >
              CO
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">CampusOS AI Mentor</span>
              <span className="inline-flex items-center rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-medium text-purple-400 border border-purple-500/20">
                <Sparkles className="size-3 mr-1" /> Real Gemini LLM
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-gray-400 bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/10">
              <ShieldCheck className="size-3.5 text-emerald-400" /> CampusOS Context Active
            </span>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] px-3 py-1.5 font-semibold text-gray-200 hover:bg-white/[0.08]"
            >
              Back to Workspace
            </Link>
          </div>
        </div>
      </header>

      {/* NOTIFICATION TOAST */}
      {notification && (
        <div className="fixed top-16 right-4 z-50 rounded-xl border border-purple-500/40 bg-[#0f111d] px-4 py-2 text-xs font-semibold text-white shadow-2xl flex items-center gap-2 animate-pulse">
          <Sparkles className="size-3.5 text-purple-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* MAIN CHAT INTERFACE (ChatGPT 2-COLUMN LAYOUT) */}
      <div className="flex-1 flex max-w-7xl mx-auto w-full overflow-hidden">
        {/* LEFT PANEL: REAL CHAT HISTORY */}
        <aside className="w-64 border-r border-white/10 bg-white/[0.01] p-4 hidden md:flex flex-col justify-between shrink-0">
          <div className="space-y-4">
            <button
              onClick={handleNewChat}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600/20 border border-purple-500/40 py-2.5 text-xs font-bold text-white hover:bg-purple-600/30 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="size-4 text-purple-400" />
              New Senior Chat
            </button>

            <div className="space-y-3">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block px-1">
                Recent Mentorship Chats
              </span>

              <div className="space-y-1 text-xs max-h-[60vh] overflow-y-auto scrollbar-thin">
                {loadingThreads ? (
                  <div className="p-3 text-center text-gray-500 text-xs animate-pulse">
                    Loading conversations...
                  </div>
                ) : threads.length === 0 ? (
                  <div className="p-3 text-center text-gray-500 text-xs">
                    No previous chats yet. Start a new session!
                  </div>
                ) : (
                  threads.map((item) => {
                    const isActive = activeThreadId === item.chatId;
                    return (
                      <button
                        key={item.chatId}
                        onClick={() => handleSelectThread(item.chatId)}
                        disabled={isGenerating}
                        className={`w-full text-left p-2.5 rounded-xl border transition cursor-pointer flex items-center gap-2 truncate ${
                          isActive
                            ? "bg-white/[0.06] border-purple-500/40 text-white font-semibold"
                            : "border-transparent text-gray-400 hover:bg-white/[0.03] hover:text-white"
                        }`}
                      >
                        <MessageSquare className="size-3.5 text-purple-400 shrink-0" />
                        <span className="truncate">{item.title || "AI Mentor Session"}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-3">
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.02]">
              <div className="size-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                CO
              </div>
              <div className="text-[11px] truncate">
                <span className="font-bold text-white block truncate">Senior Context Active</span>
                <span className="text-gray-400 block truncate">
                  {profile
                    ? `Sem ${profile.semester} • ${profile.careerGoal ? profile.careerGoal.toUpperCase() : "ENGINEERING"}`
                    : "Loading student context…"}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* RIGHT PANEL: CHAT STREAM & INPUT AREA */}
        <section className="flex-1 flex flex-col justify-between p-4 sm:p-6 overflow-hidden">
          {/* CHAT MESSAGES STREAM */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
            {/* PROMPT SUGGESTION CHIPS (Show if only initial message) */}
            {messages.length <= 1 && (
              <div className="mb-6 space-y-3">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                  Suggested Senior Prompts
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {promptCategories.map((cat) => {
                    const IconComp = cat.icon;
                    return (
                      <div
                        key={cat.id}
                        onClick={() => handleSendMessage(cat.prompt)}
                        className={`p-3.5 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition cursor-pointer space-y-1 group ${cat.color}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${cat.textColor} flex items-center gap-1.5`}>
                            <IconComp className="size-3.5" />
                            {cat.title}
                          </span>
                          <ChevronRight className="size-3.5 text-gray-500 group-hover:text-white transition" />
                        </div>
                        <p className="text-xs text-gray-300 leading-snug">{cat.prompt}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* MESSAGES LIST */}
            {messages.map((msg, idx) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${
                  msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                {/* Avatar */}
                <div
                  className={`size-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                    msg.sender === "user"
                      ? "bg-purple-600 text-white"
                      : msg.isError
                      ? "bg-amber-600 text-white"
                      : "bg-gradient-to-tr from-purple-600 to-indigo-500 text-white shadow-md shadow-purple-500/30"
                  }`}
                >
                  {msg.sender === "user" ? "You" : msg.isError ? "!" : "CO"}
                </div>

                {/* Message Bubble */}
                <div
                  className={`rounded-2xl p-4 text-xs sm:text-sm space-y-2 border ${
                    msg.sender === "user"
                      ? "bg-purple-600/20 border-purple-500/40 text-white"
                      : msg.isError
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-200"
                      : "bg-white/[0.03] border-white/10 text-gray-200 backdrop-blur-md"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 text-[10px] text-gray-400 border-b border-white/10 pb-1">
                    <span className="font-semibold flex items-center gap-1">
                      {msg.sender === "user" ? "Student" : "CampusOS Senior Mentor"}
                      {msg.verified && <UserCheck className="size-3 text-emerald-400 inline" />}
                      {msg.isError && <AlertCircle className="size-3 text-amber-400 inline" />}
                    </span>
                    <span suppressHydrationWarning>{msg.timestamp}</span>
                  </div>

                  {msg.sender === "ai" && !msg.isError ? (
                    <MarkdownRenderer content={msg.text} />
                  ) : (
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {msg.text}
                    </div>
                  )}

                  {msg.sender === "ai" && !msg.isError && (
                    <div className="pt-2 flex items-center justify-between border-t border-white/10 text-[11px]">
                      <button
                        onClick={() => handleCopy(msg.text, idx)}
                        className="flex items-center gap-1 text-gray-400 hover:text-white transition cursor-pointer"
                      >
                        {copiedIndex === idx ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                        <span>{copiedIndex === idx ? "Copied" : "Copy Response"}</span>
                      </button>

                      <span className="text-[10px] bg-white/10 text-gray-400 px-2 py-0.5 rounded">
                        Senior Vetted
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isGenerating && (
              <div className="flex items-center gap-2 text-xs text-purple-400 animate-pulse p-2">
                <Sparkles className="size-4 animate-spin" />
                <span>
                  {selectedFiles.some((f) => f.mimeType === "application/pdf")
                    ? "Reading your academic PDF and grounding response…"
                    : selectedFiles.some((f) => f.mimeType.startsWith("image/"))
                    ? "Analyzing technical diagram with vision and grounding response…"
                    : "Senior Mentor is reasoning over your academic context and verified resources…"}
                </span>
              </div>
            )}
          </div>

          {/* INPUT BAR */}
          <div className="pt-4 border-t border-white/10">
            {/* Attachment preview chips */}
            {selectedFiles.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {selectedFiles.map((sf, idx) => (
                  <div
                    key={`att_${idx}`}
                    className="flex items-center gap-2 bg-purple-950/40 border border-purple-500/30 rounded-xl px-3 py-1.5 text-xs text-purple-200"
                  >
                    <Paperclip className="size-3.5 text-purple-400 shrink-0" />
                    <span className="truncate max-w-[160px] font-mono">{sf.fileName}</span>
                    <span className="text-[10px] text-gray-400 shrink-0">
                      ({(sf.file.size / 1024).toFixed(1)} KB)
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="p-0.5 hover:bg-white/10 rounded-md text-gray-400 hover:text-white transition cursor-pointer"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="relative rounded-2xl border border-white/15 bg-black/60 p-2 focus-within:border-purple-500 transition shadow-xl">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".pdf,.docx,.doc,.pptx,.ppt,.png,.jpg,.jpeg,.webp"
                multiple
                className="hidden"
              />

              <textarea
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isGenerating}
                placeholder="Ask your AI Senior Mentor (e.g. Next roadmap step, Action Radar priorities, attendance risks)..."
                rows={2}
                className="w-full bg-transparent px-3 py-1 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none resize-none disabled:opacity-50"
              />

              <div className="flex items-center justify-between border-t border-white/10 pt-2 px-2">
                <div className="flex items-center gap-2 text-gray-400 text-xs">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Attach academic document (PDF, DOCX, PPTX) or diagram (Max 5MB each, up to 2 files)"
                    className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition cursor-pointer"
                  >
                    <Paperclip className="size-4" />
                  </button>
                  <button className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition cursor-pointer">
                    <Terminal className="size-4 text-purple-400" />
                  </button>
                  <span className="text-[10px] text-gray-500 hidden sm:inline">Press Enter to send</span>
                </div>

                <button
                  onClick={() => handleSendMessage()}
                  disabled={(!inputPrompt.trim() && selectedFiles.length === 0) || isGenerating}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    (inputPrompt.trim() || selectedFiles.length > 0) && !isGenerating
                      ? "bg-purple-600 text-white shadow-md shadow-purple-600/30 hover:bg-purple-500"
                      : "bg-white/10 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  <span>Send</span>
                  <Send className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-[#06070a] py-3 text-center text-xs text-gray-500">
        CampusOS AI Senior Mentor • Context Locked for Karnataka VTU & Autonomous Schemes
      </footer>
    </main>
  );
}
