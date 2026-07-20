import type { ReadingStatus } from "@/lib/types";

export const STATUS_OPTIONS: { value: ReadingStatus; label: string }[] = [
  { value: "WANT_TO_READ", label: "Want to Read" },
  { value: "READING", label: "Reading" },
  { value: "COMPLETED", label: "Completed" },
];

export function statusLabel(status: ReadingStatus): string {
  return STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status;
}

// Badge variant per status — neutral/outline for "not started" and "in
// progress", filled for "done", keeping the overall palette restrained.
export function statusBadgeVariant(
  status: ReadingStatus,
): "outline" | "secondary" | "default" {
  switch (status) {
    case "WANT_TO_READ":
      return "outline";
    case "READING":
      return "secondary";
    case "COMPLETED":
      return "default";
  }
}

export function formatPrice(price: string | null): string {
  if (price === null) return "—";
  const n = Number(price);
  if (Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}
