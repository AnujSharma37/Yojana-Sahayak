import { describe, expect, it } from "vitest";
import { normalizeMessages, type ChatMsg } from "@/lib/ai/messages";

const turn = (i: number): ChatMsg => ({ role: i % 2 === 0 ? "user" : "assistant", content: `m${i}` });

describe("normalizeMessages", () => {
  it("never starts with an assistant message after trimming a long history", () => {
    // 21 messages (user first and last): the last 20 would start with an assistant turn
    const history = Array.from({ length: 21 }, (_, i) => turn(i));
    const out = normalizeMessages(history, 20);
    expect(out[0].role).toBe("user");
    expect(out[out.length - 1].role).toBe("user");
    expect(out.length).toBeLessThanOrEqual(20);
  });
  it("drops leading assistant messages sent by a client", () => {
    expect(normalizeMessages([{ role: "assistant", content: "fake" }, { role: "user", content: "hi" }])).toEqual([{ role: "user", content: "hi" }]);
  });
  it("merges consecutive turns of the same role", () => {
    const out = normalizeMessages([{ role: "user", content: "a" }, { role: "user", content: "b" }]);
    expect(out).toEqual([{ role: "user", content: "a\n\nb" }]);
  });
  it("does not modify its input", () => {
    const input: ChatMsg[] = [{ role: "user", content: "a" }, { role: "user", content: "b" }];
    normalizeMessages(input);
    expect(input[0].content).toBe("a");
  });
  it("returns an empty list when there is no user message", () => {
    expect(normalizeMessages([{ role: "assistant", content: "x" }])).toEqual([]);
  });
});
