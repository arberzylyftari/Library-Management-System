import { describe, expect, it } from "vitest";
import { formatPrice, statusBadgeVariant, statusLabel } from "@/lib/book-display";

describe("statusLabel", () => {
  it("maps each status to its display label", () => {
    expect(statusLabel("WANT_TO_READ")).toBe("Want to Read");
    expect(statusLabel("READING")).toBe("Reading");
    expect(statusLabel("COMPLETED")).toBe("Completed");
  });
});

describe("statusBadgeVariant", () => {
  it("increases visual weight as a book gets closer to done", () => {
    expect(statusBadgeVariant("WANT_TO_READ")).toBe("outline");
    expect(statusBadgeVariant("READING")).toBe("secondary");
    expect(statusBadgeVariant("COMPLETED")).toBe("default");
  });
});

describe("formatPrice", () => {
  it("renders an em dash for null", () => {
    expect(formatPrice(null)).toBe("—");
  });

  it("renders an em dash for a non-numeric string", () => {
    expect(formatPrice("not-a-number")).toBe("—");
  });

  it("formats a numeric string as USD currency", () => {
    expect(formatPrice("12.5")).toBe("$12.50");
  });

  it("formats zero as currency, not as falsy", () => {
    expect(formatPrice("0")).toBe("$0.00");
  });
});
