"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import {
  Sparkles,
  X,
  Send,
  Loader2,
  ScanEye,
  Bot,
  Minimize2,
  Maximize2,
  RefreshCw,
  HelpCircle,
  BookOpen,
  Calendar,
  Compass,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { MarkdownRenderer } from "@/components/ai/markdown-renderer";

interface CopilotMessage {
  id: string;
  sender: "user" | "copilot";
  text: string;
  timestamp: string;
  isPageAnalysis?: boolean;
}

export function FloatingCopilot() {
  const pathname = usePathname();
  const { user, profile } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  // Initial welcome message tailored to current page
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome_0",
          sender: "copilot",
          text: `👋 Hey **${profile?.firstName || "Engineer"}**! I'm your **Senior AI Copilot**.\n\nI can explain any page you're currently viewing, highlight your attendance risks, or solve technical problems. Click **"Scan This Page"** below or ask me anything!`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  }, [profile?.firstName, messages.length]);

  /**
   * Scans current page DOM & state to provide an instant Comet-style intelligence summary.
   */
  const handleScanPage = async () => {
    if (isScanning || isStreaming) return;
    setIsScanning(true);

    const pageTitle = typeof document !== "undefined" ? document.title : "";
    const pageHeading = typeof document !== "undefined" ? document.querySelector("h1, h2")?.textContent || "" : "";
    
    // Extract key visible text snippets safely
    let visibleContext = "";
    if (typeof document !== "undefined") {
      const textElements = Array.from(document.querySelectorAll("h1, h2, h3, p, span, tr"))
        .map((el) => el.textContent?.trim() || "")
        .filter((t) => t.length > 15 && !t.includes("CampusOS"))
        .slice(0, 15);
      visibleContext = textElements.join(" | ");
    }

    const scanPrompt = `[PAGE CONTEXT SCAN]
The student is currently browsing the route: "${pathname}".
Page Title: "${pageTitle}"
Key Heading: "${pageHeading}"
Student's Registered Semester: ${profile?.semester ? `Semester ${profile.semester}` : "Engineering Student"}
Branch / Specialization: ${profile?.specializationBranch || profile?.careerGoal || "Computer Science"}

Visible Screen Signals:
${visibleContext.slice(0, 800)}

Please perform a 3-part structured Comet AI analysis for this student:
1. 📍 **What this page is showing**: Summarize the purpose of this screen in 1 concise sentence.
2. 🎯 **Key highlights on your screen**: List 2-3 specific action items or academic metrics relevant to their semester.
3. 💡 **Senior Pro-Tip**: Give 1 immediate recommendation for what they should do next on this page.`;

    const userMsg: CopilotMessage = {
      id: `scan_user_${Date.now()}`,
      sender: "user",
      text: `🔍 *Scanned current page: ${pathname}*`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);

    await sendCopilotMessage(scanPrompt, true);
    setIsScanning(false);
  };

  /**
   * Sends user query to the AI Mentor streaming route
   */
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || isStreaming) return;

    const textToSend = inputMessage.trim();
    setInputMessage("");

    const userMsg: CopilotMessage = {
      id: `user_${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    await sendCopilotMessage(textToSend, false);
  };

  const sendCopilotMessage = async (promptText: string, isPageAnalysis = false) => {
    setIsStreaming(true);

    const copilotMsgId = `copilot_${Date.now()}`;
    const placeholderMsg: CopilotMessage = {
      id: copilotMsgId,
      sender: "copilot",
      text: "",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isPageAnalysis,
    };

    setMessages((prev) => [...prev, placeholderMsg]);

    try {
      const response = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: promptText,
          threadId: null,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      if (reader) {
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
                accumulated += eventData.token;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === copilotMsgId ? { ...m, text: accumulated } : m
                  )
                );
              } else if (eventData.type === "done") {
                // Done event
              } else if (eventData.type === "error") {
                accumulated += `\n\n⚠️ ${eventData.error || "Streaming error"}`;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === copilotMsgId ? { ...m, text: accumulated } : m
                  )
                );
              }
            } catch {
              // Partial buffer
            }
          }
        }
      }
    } catch (err: unknown) {
      const errorText =
        err instanceof Error
          ? err.message
          : "Couldn't reach Copilot. Please retry in a moment.";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === copilotMsgId
            ? { ...m, text: `⚠️ **Notice**: ${errorText}` }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <>
      {/* FLOATING ACTION TRIGGER ICON (Bottom-Right) */}
      {!isOpen && (
        <aside
          aria-label="CampusOS Assistant"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2"
        >
          {/* Pulsing Pill Prompt */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
            }}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#12141f]/90 border border-purple-500/30 text-xs text-purple-200 backdrop-blur-md shadow-lg shadow-purple-500/10 hover:border-purple-400 hover:scale-105 transition cursor-pointer"
          >
            <Sparkles className="size-3.5 text-purple-400 animate-spin-slow" />
            <span className="font-semibold">Ask Copilot</span>
            <span className="bg-purple-500/20 text-[10px] px-1.5 py-0.5 rounded text-purple-300">
              Live
            </span>
          </button>

          {/* Main Floating Button */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
            }}
            className="group relative flex size-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-purple-500 text-white shadow-xl shadow-purple-600/40 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-white/20"
            title="Open CampusOS AI Copilot"
          >
            <Bot className="size-7 transition group-hover:rotate-6" />
            <span className="absolute -top-1 -right-1 flex size-3.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-3.5 rounded-full bg-emerald-500 border-2 border-[#08090e]" />
            </span>
          </button>
        </aside>
      )}

      {/* EXPANDED COPILOT DRAWER (Like Comet AI Assistant) */}
      {isOpen && (
        <aside
          aria-label="CampusOS AI Senior Copilot"
          className={`fixed z-50 transition-all duration-300 ease-out flex flex-col shadow-2xl ${
            isMinimized
              ? "bottom-6 right-6 w-80 h-14 rounded-2xl border border-white/15 bg-[#0f111a]/95 backdrop-blur-xl"
              : "bottom-4 right-4 sm:bottom-6 sm:right-6 w-[95vw] sm:w-[420px] h-[600px] max-h-[85vh] rounded-2xl border border-white/15 bg-[#0d0f18]/95 backdrop-blur-2xl"
          }`}
        >
          {/* HEADER */}
          <div className="flex h-14 items-center justify-between px-4 border-b border-white/10 bg-white/[0.02] shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 text-white shadow-sm">
                <Bot className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  CampusOS Copilot
                  <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/20">
                    Dual AI
                  </span>
                </span>
                <span className="text-[10px] text-gray-400 truncate max-w-[170px]">
                  Viewing: {pathname === "/" ? "Mission Control" : pathname}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-gray-400">
              <button
                type="button"
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 hover:text-white rounded-lg hover:bg-white/5 transition"
                title={isMinimized ? "Expand" : "Minimize"}
              >
                {isMinimized ? <Maximize2 className="size-3.5" /> : <Minimize2 className="size-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:text-rose-400 rounded-lg hover:bg-white/5 transition"
                title="Close"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* SCREEN SCAN QUICK ACTION BAR */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-purple-500/[0.04]">
                <button
                  type="button"
                  onClick={handleScanPage}
                  disabled={isScanning || isStreaming}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/30 text-[11px] font-semibold text-purple-200 transition cursor-pointer disabled:opacity-50"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="size-3 animate-spin text-purple-300" />
                      <span>Scanning screen...</span>
                    </>
                  ) : (
                    <>
                      <ScanEye className="size-3.5 text-purple-300" />
                      <span>Scan This Page</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-1 text-[10px] text-gray-400">
                  <ShieldCheck className="size-3 text-emerald-400" />
                  <span>Sem {profile?.semester || 1} Grounded</span>
                </div>
              </div>

              {/* MESSAGES SCROLL CONTAINER */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs text-left no-scrollbar">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${
                      m.sender === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                        m.sender === "user"
                          ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-none shadow-md shadow-purple-600/20"
                          : "bg-white/[0.05] border border-white/10 text-gray-200 rounded-bl-none"
                      }`}
                    >
                      {m.sender === "copilot" ? (
                        <div className="prose prose-invert prose-xs max-w-none">
                          <MarkdownRenderer content={m.text || "Thinking..."} />
                        </div>
                      ) : (
                        <span>{m.text}</span>
                      )}
                    </div>
                    <span className="text-[9px] text-gray-500 mt-1 px-1">{m.timestamp}</span>
                  </div>
                ))}

                {isStreaming && messages[messages.length - 1]?.sender === "user" && (
                  <div className="flex items-center gap-2 text-gray-400 text-xs py-2">
                    <Loader2 className="size-3.5 animate-spin text-purple-400" />
                    <span>Senior Copilot is drafting answer...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* INPUT BAR */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 border-t border-white/10 bg-[#08090e]/60"
              >
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask about this page or any engineering doubt..."
                    disabled={isStreaming}
                    className="w-full rounded-xl border border-white/15 bg-white/[0.04] py-2.5 pl-3 pr-10 text-xs text-white placeholder-gray-500 focus:border-purple-500 focus:bg-white/[0.08] focus:outline-none transition"
                  />
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || isStreaming}
                    className="absolute right-1.5 flex size-7 items-center justify-center rounded-lg bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-30 disabled:hover:bg-purple-600 transition cursor-pointer"
                  >
                    <Send className="size-3.5" />
                  </button>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[10px] text-gray-500 px-1">
                  <span>Powered by Gemini & Groq Failover</span>
                  <span>Esc to close</span>
                </div>
              </form>
            </>
          )}
        </aside>
      )}
    </>
  );
}
