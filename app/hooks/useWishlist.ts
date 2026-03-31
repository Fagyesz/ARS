import {useState, useEffect, useCallback} from 'react';

const STORAGE_KEY = 'ars-wishlist';

function readStorage(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeStorage(handles: string[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(handles));
  } catch {
    // localStorage unavailable (private mode, quota exceeded) — silently ignore
  }
}

export function useWishlist() {
  const [handles, setHandles] = useState<string[]>([]);

  // Hydrate from localStorage after mount (SSR-safe)
  useEffect(() => {
    setHandles(readStorage());
  }, []);

  const toggle = useCallback((handle: string) => {
    setHandles((prev) => {
      const next = prev.includes(handle)
        ? prev.filter((h) => h !== handle)
        : [...prev, handle];
      writeStorage(next);
      return next;
    });
  }, []);

  const has = useCallback(
    (handle: string) => handles.includes(handle),
    [handles],
  );

  return {handles, toggle, has};
}
