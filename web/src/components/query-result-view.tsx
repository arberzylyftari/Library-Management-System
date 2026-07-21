import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPrice, statusLabel } from "@/lib/book-display";
import type { AiToolResult, ReadingStatus } from "@/lib/types";

// Keys that are noise in a user-facing table.
const HIDDEN_KEYS = new Set(["id", "userId", "createdAt", "updatedAt"]);
const CURRENCY_KEYS = new Set(["price", "min", "max", "avg"]);

function humanizeKey(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (key === "status" && typeof value === "string") {
    return statusLabel(value as ReadingStatus);
  }
  if (CURRENCY_KEYS.has(key)) return formatPrice(String(value));
  if (isRecord(value)) {
    if ("name" in value) return String(value.name);
    return JSON.stringify(value);
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function columnsFor(rows: Record<string, unknown>[]): string[] {
  const seen = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!HIDDEN_KEYS.has(key)) seen.add(key);
    }
  }
  return [...seen];
}

function DataTable({ rows }: { rows: Record<string, unknown>[] }) {
  const columns = columnsFor(rows);
  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col}>{humanizeKey(col)}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={i}>
              {columns.map((col) => (
                <TableCell key={col} className={col === "status" ? "" : "text-muted-foreground"}>
                  {formatValue(col, row[col])}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// A summary object (e.g. library_summary): primitives become labeled stats,
// nested arrays-of-objects become sub-tables, nested objects become a group.
function SummaryView({ data }: { data: Record<string, unknown> }) {
  const stats: [string, unknown][] = [];
  const groups: [string, Record<string, unknown>][] = [];
  const tables: [string, Record<string, unknown>[]][] = [];

  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value) && value.length > 0 && isRecord(value[0])) {
      tables.push([key, value as Record<string, unknown>[]]);
    } else if (isRecord(value)) {
      groups.push([key, value]);
    } else if (!Array.isArray(value)) {
      stats.push([key, value]);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {stats.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {stats.map(([key, value]) => (
            <div key={key} className="rounded-lg border px-4 py-3">
              <div className="text-xs text-muted-foreground">{humanizeKey(key)}</div>
              <div className="text-lg font-semibold tabular-nums">
                {formatValue(key, value)}
              </div>
            </div>
          ))}
          {groups.flatMap(([, obj]) =>
            Object.entries(obj).map(([key, value]) => (
              <div key={key} className="rounded-lg border px-4 py-3">
                <div className="text-xs text-muted-foreground">{humanizeKey(key)}</div>
                <div className="text-lg font-semibold tabular-nums">
                  {formatValue(key, value)}
                </div>
              </div>
            )),
          )}
        </div>
      )}
      {tables.map(([key, rows]) => (
        <div key={key} className="flex flex-col gap-2">
          <div className="text-sm font-medium">{humanizeKey(key)}</div>
          <DataTable rows={rows} />
        </div>
      ))}
    </div>
  );
}

export function QueryResultView({ result }: { result: AiToolResult }) {
  const { data } = result;

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return <p className="text-sm text-muted-foreground">No matching results.</p>;
    }
    if (isRecord(data[0])) {
      return <DataTable rows={data as Record<string, unknown>[]} />;
    }
    // Array of primitives.
    return <p className="text-sm">{data.map(String).join(", ")}</p>;
  }

  if (isRecord(data)) {
    return <SummaryView data={data} />;
  }

  return <p className="text-sm">{String(data)}</p>;
}
