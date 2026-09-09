"use client";

import React, { useState, useEffect } from "react";
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
  ShieldCheck
} from "lucide-react";

// Mock Chat History Items
const chatHistory = [
  { id: "h1", title: "Math IA1 Calculus Derivations", time: "Today", category: "Academics" },
  { id: "h2", title: "C Pointers & Memory Bug Fix", time: "Today", category: "Coding" },
  { id: "h3", title: "VTU 75% Attendance Safe Bunks", time: "Yesterday", category: "College Rules" },
  { id: "h4", title: "RVCE Hackathon Team Pitch Review", time: "Past 7 Days", category: "Projects" },
  { id: "h5", title: "LeetCode Starter Array Track", time: "Past 7 Days", category: "Placement" },
];

// Suggested Prompt Chips
const promptCategories = [
  {
    id: "roadmap",
    icon: Compass,
    title: "Roadmap Generator",
    prompt: "Generate a 1st-year SDE roadmap for CSE students balancing academics & coding.",
    color: "from-purple-500/20 to-indigo-500/20",
    textColor: "text-purple-300",
  },
  {
    id: "resume",
    icon: FileText,
    title: "Resume Review",
    prompt: "Review my 1st-year engineering resume and tell me what proof-of-work to add.",
    color: "from-blue-500/20 to-cyan-500/20",
    textColor: "text-blue-300",
  },
  {
    id: "interview",
    icon: Mic,
    title: "Lab Viva Prep",
    prompt: "Simulate top 10 C Programming lab viva questions with ideal senior answers.",
    color: "from-emerald-500/20 to-teal-500/20",
    textColor: "text-emerald-300",
  },
  {
    id: "math",
    icon: BookOpen,
    title: "VTU Derivations",
    prompt: "Explain Cayley-Hamilton Theorem in 3 steps for VTU BMAT101 exam.",
    color: "from-amber-500/20 to-orange-500/20",
    textColor: "text-amber-300",
  },
];

const getMessageId = () => `m_${Date.now()}`;
const getFormattedTime = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export default function AIMentorPage() {
  const { user, profile } = useAuth();
  const studentName = profile?.firstName || user?.email?.split("@")[0] || "Engineer";

  const [messages, setMessages] = useState([
    {
      id: "m1",
      sender: "ai",
      text: `Hello ${studentName} 👋 I'm your CampusOS AI Senior Mentor, pre-configured with VTU 2025 scheme guidelines and senior playbooks. How can I help you conquer your engineering semester today?`,
      timestamp: "8:00 PM",
      verified: true,
    },
  ]);

  // Update initial greeting when profile loads
  useEffect(() => {
    if (profile?.firstName) {
      setMessages((prev) =>
        prev.map((m, idx) =>
          idx === 0 && m.sender === "ai"
            ? {
                ...m,
                text: `Hello ${profile.firstName} 👋 I'm your CampusOS AI Senior Mentor, pre-configured with VTU 2025 scheme guidelines and senior playbooks. How can I help you conquer your engineering semester today?`,
              }
            : m
        )
      );
    }
  }, [profile?.firstName]);

  const [inputPrompt, setInputPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [activeHistoryId, setActiveHistoryId] = useState("h1");

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSendMessage = (textToSend?: string) => {
    const query = textToSend || inputPrompt;
    if (!query.trim() || isGenerating) return;

    // Add User Message
    const userMsg = {
      id: getMessageId(),
      sender: "user",
      text: query,
      timestamp: getFormattedTime(),
      verified: false,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputPrompt("");
    setIsGenerating(true);

    // Simulate AI Senior Mentor Response
    setTimeout(() => {
      let aiResponseText = "";

      if (query.toLowerCase().includes("viva") || query.toLowerCase().includes("c programming")) {
        aiResponseText = `Here are the top 3 C Lab Viva questions external examiners ask at VTU/Autonomous colleges:

1. **Difference between \`malloc()\` and \`calloc()\`?**
   - \`malloc()\` allocates a single memory block without initializing (contains garbage values).
   - \`calloc()\` allocates multiple blocks and initializes all bytes to zero.

2. **What is Call-by-Value vs Call-by-Reference?**
   - Call-by-Value passes copies of variables (changes don't affect original).
   - Call-by-Reference passes memory addresses using pointers (modifies actual variables).

\`\`\`c
// Example Call-by-Reference Swap Function
void swap(int *a, int *b) {
    int temp = *a;
    *a = *b;
    *b = temp;
}
\`\`\`

💡 *Senior Tip:* External examiners love asking you to trace \`swap(&x, &y)\` on paper!`;
      } else if (query.toLowerCase().includes("roadmap") || query.toLowerCase().includes("sde")) {
        aiResponseText = `Here is your **1st-Year SDE Velocity Roadmap** tailored for Karnataka Engineers:

- **Month 1-2:** Master C / C++ Basics & Setup GitHub Profile. Commit every lab record code.
- **Month 3-4:** Solve 25 LeetCode Easy problems (Arrays, Pointers, Strings). Keep CIE attendance >75%.
- **Month 5-6:** Build your first proof-of-work project (e.g. *VTU SGPA & CIE Calculator*) and host a live demo on Vercel.

🎯 *Target:* Enter 2nd year with 8.5+ SGPA and 1 solid GitHub repository!`;
      } else if (query.toLowerCase().includes("cayley") || query.toLowerCase().includes("math")) {
        aiResponseText = `**Cayley-Hamilton Theorem (VTU BMAT101 - 7 Marks Derivation)**

> *"Every square matrix satisfies its own characteristic equation."*

**3-Step Exam Solving Strategy:**
1. Compute the characteristic matrix equation: \`det(A - λI) = 0\`.
2. Expand the polynomial equation: \`λ³ - c₁λ² + c₂λ - c₃ = 0\`.
3. Replace \`λ\` with Matrix \`A\`: \`A³ - c₁A² + c₂A - c₃I = 0\` and verify equality.

📄 *Resource Attached:* Download full 2-page VTU PYQ derivation notes from the Academic Vault!`;
      } else {
        aiResponseText = `I've analyzed your query regarding **"${query}"** against verified senior playbooks for your college.

Key recommendations:
- Ensure your CIE internal marks stay above 34/40.
- Check the Resource Vault for subject-specific PYQs.
- Keep your daily streak active in Mission Control!

Feel free to ask me to debug code, generate project specs, or explain any VTU module.`;
      }

      const aiMsg = {
        id: getMessageId(),
        sender: "ai",
        text: aiResponseText,
        timestamp: getFormattedTime(),
        verified: true,
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsGenerating(false);
    }, 1200);
  };

  const handleNewChat = () => {
    setMessages([
      {
        id: getMessageId(),
        sender: "ai",
        text: `Hello ${studentName} 👋 I'm your CampusOS AI Senior Mentor, pre-configured with VTU 2025 scheme guidelines and senior playbooks. How can I help you conquer your engineering semester today?`,
        timestamp: getFormattedTime(),
        verified: true,
      },
    ]);
    showNotification("Started New Senior Mentor Session");
  };

  const [notification, setNotification] = useState<string | null>(null);
  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2500);
  };

  return (
    <main className="min-h-screen bg-[#08090e] text-[#f3f4f6] flex flex-col justify-between selection:bg-purple-500/30 selection:text-purple-200">
      {/* HEADER NAVBAR */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#08090e]/80 border-b border-white/10">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 font-bold text-white text-xs shadow-lg shadow-purple-500/25">
              CO
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">CampusOS AI Mentor</span>
              <span className="inline-flex items-center rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-medium text-purple-400 border border-purple-500/20">
                <Sparkles className="size-3 mr-1" /> Senior Copilot v2.4
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-gray-400 bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/10">
              <ShieldCheck className="size-3.5 text-emerald-400" /> VTU & Autonomous Context Locked
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
        {/* LEFT PANEL: CHAT HISTORY (Hidden on mobile, collapsible) */}
        <aside className="w-64 border-r border-white/10 bg-white/[0.01] p-4 hidden md:flex flex-col justify-between shrink-0">
          <div className="space-y-4">
            <button
              onClick={handleNewChat}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600/20 border border-purple-500/40 py-2.5 text-xs font-bold text-white hover:bg-purple-600/30 transition cursor-pointer"
            >
              <Plus className="size-4 text-purple-400" />
              New Senior Chat
            </button>

            <div className="space-y-3">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block px-1">
                Recent Mentorship Chats
              </span>

              <div className="space-y-1 text-xs">
                {chatHistory.map((item) => {
                  const isActive = activeHistoryId === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveHistoryId(item.id)}
                      className={`w-full text-left p-2.5 rounded-xl border transition cursor-pointer flex items-center gap-2 truncate ${
                        isActive
                          ? "bg-white/[0.06] border-purple-500/40 text-white font-semibold"
                          : "border-transparent text-gray-400 hover:bg-white/[0.03] hover:text-white"
                      }`}
                    >
                      <MessageSquare className="size-3.5 text-purple-400 shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </button>
                  );
                })}
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
                <span className="text-gray-400 block truncate">RVCE • CSE Sem 1</span>
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
                      : "bg-gradient-to-tr from-purple-600 to-indigo-500 text-white shadow-md shadow-purple-500/30"
                  }`}
                >
                  {msg.sender === "user" ? "You" : "CO"}
                </div>

                {/* Message Bubble */}
                <div
                  className={`rounded-2xl p-4 text-xs sm:text-sm space-y-2 border ${
                    msg.sender === "user"
                      ? "bg-purple-600/20 border-purple-500/40 text-white"
                      : "bg-white/[0.03] border-white/10 text-gray-200 backdrop-blur-md"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 text-[10px] text-gray-400 border-b border-white/10 pb-1">
                    <span className="font-semibold flex items-center gap-1">
                      {msg.sender === "user" ? "Student" : "CampusOS Senior Mentor"}
                      {msg.verified && <UserCheck className="size-3 text-emerald-400 inline" />}
                    </span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <div className="whitespace-pre-wrap leading-relaxed">
                    {msg.text}
                  </div>

                  {msg.sender === "ai" && (
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
                <span>Senior Mentor is crafting response...</span>
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
                placeholder="Ask your AI Senior Mentor (e.g. Debug C code, VTU 75% attendance rules, lab viva Qs)..."
                rows={2}
                className="w-full bg-transparent px-3 py-1 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none resize-none"
              />

              <div className="flex items-center justify-between border-t border-white/10 pt-2 px-2">
                <div className="flex items-center gap-2 text-gray-400 text-xs">
                  <button className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition">
                    <Paperclip className="size-4" />
                  </button>
                  <button className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition">
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
