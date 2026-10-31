"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import type { Citation } from "@/lib/schemes/types";
import SourceChips from "./SourceChips";
import { normalizeMessages } from "@/lib/ai/messages";

type Msg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  status?: "streaming" | "done" | "error" | "fallback";
  fallbackReason?: string;
};

const STORE = "ys:chat:v1"; // sessionStorage: cleared when the tab closes
const uid = () => Math.random().toString(36).slice(2);

export default function Chat({ locale }: { locale: string }) {
  const t = useTranslations("chat");
  const search = useSearchParams();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const autoAsked = useRef(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try { const raw = sessionStorage.getItem(STORE); if (raw) setMessages(JSON.parse(raw)); } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    try { sessionStorage.setItem(STORE, JSON.stringify(messages.filter((m) => m.status !== "streaming"))); } catch { /* ignore */ }
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  const ask = useCallback(async (history: Msg[]) => {
    const replyId = uid();
    setMessages([...history, { id: replyId, role: "assistant", content: "", status: "streaming" }]);
    setBusy(true);
    const patch = (p: Partial<Msg>) => setMessages((ms) => ms.map((m) => (m.id === replyId ? { ...m, ...p } : m)));
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          // Trimming must never leave an assistant message first: the API rejects that.
          messages: normalizeMessages(history.filter((m) => m.content && m.status !== "error" && m.status !== "fallback").map((m) => ({ role: m.role, content: m.content }))),
        }),
      });
      if (res.status === 429) { patch({ status: "error", content: t("rateLimited") }); return; }
      if (!res.ok || !res.body) { patch({ status: "error", content: t("error") }); return; }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let text = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const ev = JSON.parse(line);
          if (ev.type === "meta") patch({ citations: ev.citations });
          else if (ev.type === "text") { text += ev.delta; patch({ content: text }); }
          else if (ev.type === "done") patch({ status: "done" });
          else if (ev.type === "fallback") patch({ status: "fallback", fallbackReason: ev.reason, citations: ev.schemes, content: "" });
        }
      }
      setMessages((ms) => ms.map((m) => (m.id === replyId && m.status === "streaming" ? { ...m, status: text ? "done" : "error", content: text || t("error") } : m)));
    } catch {
      patch({ status: "error", content: t("error") });
    } finally {
      setBusy(false);
    }
  }, [locale, t]);

  const send = (text: string) => {
    const content = text.trim().slice(0, 2000);
    if (!content || busy) return;
    setInput("");
    void ask([...messages, { id: uid(), role: "user", content }]);
  };

  useEffect(() => {
    const q = search.get("q");
    if (q && !autoAsked.current) { autoAsked.current = true; send(q); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const retry = () => {
    const lastUser = [...messages].reverse().findIndex((m) => m.role === "user");
    if (lastUser < 0) return;
    void ask(messages.slice(0, messages.length - lastUser));
  };
  const reset = () => { setMessages([]); try { sessionStorage.removeItem(STORE); } catch { /* ignore */ } };
  const copy = async (m: Msg) => {
    try { await navigator.clipboard.writeText(m.content); setCopied(m.id); setTimeout(() => setCopied(null), 2000); } catch { /* ignore */ }
  };

  const suggestions = [t("s1"), t("s2"), t("s3"), t("s4")];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-secondary" onClick={reset} disabled={busy || !messages.length}>{t("newChat")}</button>
        <button type="button" className="btn-quiet underline" onClick={reset} disabled={busy || !messages.length}>{t("clear")}</button>
      </div>
      <p className="rounded-lg bg-surface p-3 text-sm text-ink-muted">{t("privacy")}</p>

      <div className="flex flex-col gap-3" aria-live="polite" aria-busy={busy}>
        {messages.length === 0 && (
          <div>
            <p className="font-semibold">{t("suggested")}</p>
            <ul className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {suggestions.map((s) => (
                <li key={s}><button type="button" className="btn-secondary h-auto text-left font-normal" onClick={() => send(s)}>{s}</button></li>
              ))}
            </ul>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div className={`max-w-[92%] rounded-2xl p-4 sm:max-w-[80%] ${m.role === "user" ? "bg-navy text-white" : "border border-surface-line bg-surface"}`}>
              <p className="sr-only">{m.role === "user" ? t("you") : t("assistant")}:</p>

              {m.status === "streaming" && !m.content && (
                <p className="text-ink-muted"><span aria-hidden="true">● ● ●</span><span className="sr-only">{t("typing")}</span></p>
              )}

              {m.status === "fallback" ? (
                <div>
                  <p className="font-semibold">{m.fallbackReason === "search_unavailable" ? t("searchDown") : t("fallbackTitle")}</p>
                  {m.fallbackReason !== "search_unavailable" && (
                    <p className="mt-1">{m.citations?.length ? t("fallbackText") : t("fallbackNone")}</p>
                  )}
                </div>
              ) : (
                // Plain text only: model output is never injected as HTML.
                m.content && <p className={`whitespace-pre-wrap break-words ${m.status === "error" ? "font-semibold text-danger" : ""}`}>{m.content}</p>
              )}

              {m.role === "assistant" && m.status !== "streaming" && m.status !== "error" && <SourceChips citations={m.citations ?? []} />}

              {m.role === "assistant" && m.status === "done" && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button type="button" className="btn-quiet text-sm" onClick={() => copy(m)}>{copied === m.id ? `✓ ${t("copied")}` : t("copy")}</button>
                  <span className="text-xs text-ink-muted">{t("disclaimer")}</span>
                </div>
              )}
              {m.role === "assistant" && (m.status === "error" || m.status === "fallback") && (
                <button type="button" className="btn-secondary mt-3" onClick={retry} disabled={busy}>{t("retry")}</button>
              )}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="sticky bottom-0 flex gap-2 border-t border-surface-line bg-white py-3">
        <label htmlFor="chat-input" className="sr-only">{t("inputLabel")}</label>
        <textarea
          id="chat-input" rows={1} maxLength={2000} value={input} placeholder={t("placeholder")}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
          className="field flex-1 resize-none"
        />
        <button type="submit" className="btn-primary" disabled={busy || !input.trim()}>{t("send")}</button>
      </form>
    </div>
  );
}
