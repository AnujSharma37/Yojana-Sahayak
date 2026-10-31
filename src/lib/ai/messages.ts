// Pure helper (no server imports) shared by the chat page and the chat API.
// Claude's Messages API needs the conversation to start with a user turn, so trimming a long
// history must never leave an assistant message first.

export type ChatMsg = { role: "user" | "assistant"; content: string };

export function normalizeMessages(messages: ChatMsg[], max = 20): ChatMsg[] {
  // Merge consecutive turns from the same role (e.g. after a failed reply was filtered out).
  const merged: ChatMsg[] = [];
  for (const m of messages) {
    const prev = merged[merged.length - 1];
    if (prev && prev.role === m.role) prev.content = `${prev.content}\n\n${m.content}`;
    else merged.push({ role: m.role, content: m.content });
  }
  let out = merged.length > max ? merged.slice(-max) : merged;
  while (out.length && out[0].role !== "user") out = out.slice(1);
  return out;
}
