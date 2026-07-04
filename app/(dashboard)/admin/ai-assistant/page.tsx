"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { PageContainer, PageHeader } from "@/components/layout/page-container";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Send, Sparkles, User, Bot, AlertTriangle, Loader2 } from "lucide-react";
import { askNexusAIAction } from "@/actions/ai";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "List all active employees, their departments, and joining dates.",
  "Which department has the highest average salary?",
  "Check attendance logs for Aarav Sharma.",
  "Are there any pending leave requests we need to look at?",
];

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hello! I am **NexusAI**, your human resource intelligence assistant. You can ask me details about any employee, their attendance logs, leave balances, active designations, salary histories, or recent operations data. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPending]);

  const handleSend = (text: string) => {
    if (!text.trim() || isPending) return;

    const userMessage: ChatMessage = { role: "user", content: text };
    
    // Create the immediate updated array to send to the server
    const updatedMessages = [...messages, userMessage];
    
    // Update local state immediately
    setMessages(updatedMessages);
    setInput("");

    startTransition(async () => {
      try {
        const payload = updatedMessages.map((m) => ({
          role: m.role,
          content: m.content,
        }));
        
        const res = await askNexusAIAction(payload);
        if (res.success && res.data) {
          setMessages((prev) => [...prev, { role: "assistant", content: res.data! }]);
        } else {
          toast.error(res.error || "Failed to query NexusAI");
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to connect to assistant service.");
      }
    });
  };

  return (
    <PageContainer className="h-[calc(100vh-7rem)] flex flex-col overflow-hidden">
      <div className="shrink-0">
        <PageHeader
          title="NexusAI Assistant ✨"
          subtitle="Conversational HR intelligence powered by live directory databases"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 flex-1 min-h-0 overflow-hidden pb-4">
        {/* Helper Panel */}
        <div className="xl:col-span-1 h-full min-h-0">
          <Card className="glass border-[var(--border)] h-full flex flex-col justify-between p-5 overflow-hidden">
            <div className="space-y-4 overflow-y-auto pr-1 flex-1 min-h-0">
              <div className="flex items-center gap-2 text-amber-500 font-bold shrink-0">
                <Sparkles className="h-4 w-4" />
                <h3 className="text-xs uppercase tracking-wider">Suggested Queries</h3>
              </div>
              <div className="space-y-2">
                {SUGGESTIONS.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(s)}
                    disabled={isPending}
                    className="w-full text-left text-xs p-3 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-subtle)] hover:border-[var(--accent)] hover:bg-[var(--surface-raised-hover)] text-[var(--text-secondary)] transition-all cursor-pointer select-none active:scale-[0.98]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 border-t border-[var(--border-subtle)] pt-4 space-y-2 text-[10px] text-[var(--text-muted)] shrink-0">
              <div className="flex gap-1.5 items-start">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500/80 shrink-0 mt-0.5" />
                <p>NexusAI references live tables. All payroll information, leave balances, and join dates are computed in real time.</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Chat Console */}
        <div className="xl:col-span-3 h-full min-h-0">
          <Card className="glass border-[var(--border)] h-full flex flex-col overflow-hidden">
            {/* Messages Log */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex gap-3.5 max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-200",
                    m.role === "user"
                      ? "ml-auto bg-[var(--accent)] text-white"
                      : "mr-auto bg-[var(--surface-raised)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
                  )}
                >
                  <div className="shrink-0 mt-0.5">
                    {m.role === "user" ? (
                      <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center text-white">
                        <User className="h-3.5 w-3.5" />
                      </div>
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-[var(--accent)] flex items-center justify-center text-white">
                        <Bot className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="font-bold text-[10px] uppercase tracking-wider opacity-60">
                      {m.role === "user" ? "You (HR Admin)" : "NexusAI"}
                    </p>
                    <div 
                      className="markdown-content whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{
                        __html: m.content
                          .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                          .replace(/^- (.*)$/gm, "• $1")
                      }}
                    />
                  </div>
                </div>
              ))}
              {isPending && (
                <div className="flex gap-3.5 max-w-[85%] rounded-2xl p-4 bg-[var(--surface-raised)] border border-[var(--border-subtle)] text-[var(--text-primary)] mr-auto">
                  <div className="shrink-0 mt-0.5">
                    <div className="h-6 w-6 rounded-full bg-[var(--accent)] flex items-center justify-center text-white">
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="font-bold text-[10px] uppercase tracking-wider opacity-60">NexusAI</p>
                    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-medium">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--accent)]" /> 
                      Analyzing employee directory database...
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--surface)] shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend(input);
                }}
                className="flex items-center gap-2.5"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask NexusAI about employee status, joining date, or salary history..."
                  className="flex-1 h-10 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
                  disabled={isPending}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-xl"
                  disabled={!input.trim() || isPending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
