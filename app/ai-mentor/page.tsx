"use client";

import React, { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import { ChatThreadPreviewDTO } from "@/types/api.types";

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

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2500);
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
    if (!query || isGenerating) return;

    // Optimistically append user message
    const userMsg: UIMessage = {
      id: getMessageId(),
      sender: "user",
      text: query,
      timestamp: getFormattedTime(),
      verified: false,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputPrompt("");
    setIsGenerating(true);

    try {
      const response = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId: activeThreadId || undefined,
          message: query,
        }),
      });

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
        const errorMsg =
          json?.error?.message ||
          (response.status === 503
            ? "AI Mentor service is temporarily unavailable: LLM provider is not configured."
            : response.status === 504
            ? "AI Mentor request timed out. Please try again."
            : "Failed to communicate with AI Senior Mentor. Please retry.");

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
    } catch {
      const networkErrorMsg: UIMessage = {
        id: getMessageId(),
        sender: "ai",
        text: "⚠️ **Connection Error**: Unable to reach CampusOS servers. Please check your network connection.",
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
                <Sparkles className="size-3 mr-1" /> Real LLM Reasoner
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
                  Sem {profile?.semester ?? 1} • {profile?.careerGoal ? profile.careerGoal.toUpperCase() : "Engineering"}
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
                    <span>{msg.timestamp}</span>
                  </div>

                  <div className="whitespace-pre-wrap leading-relaxed">
                    {msg.text}
                  </div>

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
                <Sparkles className="size-4" />
                <span>Senior Mentor is thinking with real LLM reasoning...</span>
              </div>
            )}
          </div>

          {/* INPUT BAR */}
          <div className="pt-4 border-t border-white/10">
            <div className="relative rounded-2xl border border-white/15 bg-black/60 p-2 focus-within:border-purple-500 transition shadow-xl">
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
                  <button className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition cursor-pointer">
                    <Paperclip className="size-4" />
                  </button>
                  <button className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition cursor-pointer">
                    <Terminal className="size-4 text-purple-400" />
                  </button>
                  <span className="text-[10px] text-gray-500 hidden sm:inline">Press Enter to send</span>
                </div>

                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputPrompt.trim() || isGenerating}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    inputPrompt.trim() && !isGenerating
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
