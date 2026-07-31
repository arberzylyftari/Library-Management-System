import { describe, expect, it } from "vitest";
import { buildHistory } from "../src/ai/history";

describe("buildHistory", () => {
  it("maps USER/ASSISTANT roles to lowercase user/assistant", () => {
    const history = buildHistory([
      { role: "USER", content: "Who owns the most books?" },
      { role: "ASSISTANT", content: "Ada owns the most books." },
    ]);
    expect(history).toEqual([
      { role: "user", content: "Who owns the most books?" },
      { role: "assistant", content: "Ada owns the most books." },
    ]);
  });

  it("caps history to the most recent 10 messages", () => {
    const messages = Array.from({ length: 20 }, (_, i) => ({
      role: i % 2 === 0 ? ("USER" as const) : ("ASSISTANT" as const),
      content: `message ${i}`,
    }));

    const history = buildHistory(messages);

    expect(history).toHaveLength(10);
    expect(history[0].content).toBe("message 10");
    expect(history[9].content).toBe("message 19");
  });

  it("returns an empty array for a new conversation", () => {
    expect(buildHistory([])).toEqual([]);
  });
});
