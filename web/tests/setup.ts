import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// jsdom's own localStorage getter comes back undefined in this Vitest/Node
// combination (a known rough edge, not anything the app does) — swap in a
// plain in-memory Storage stand-in so `localStorage.*` behaves normally.
class MemoryStorage implements Storage {
  private store = new Map<string, string>();
  get length() {
    return this.store.size;
  }
  clear() {
    this.store.clear();
  }
  getItem(key: string) {
    return this.store.get(key) ?? null;
  }
  key(index: number) {
    return [...this.store.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
}

Object.defineProperty(window, "localStorage", { value: new MemoryStorage(), configurable: true });
Object.defineProperty(globalThis, "localStorage", {
  value: window.localStorage,
  configurable: true,
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

// jsdom doesn't implement matchMedia; ThemeProvider (and anything that
// mounts it, e.g. AppLayout) reads it on mount.
window.matchMedia ??= ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => false,
})) as unknown as typeof window.matchMedia;
