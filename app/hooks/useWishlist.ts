import {useState, useEffect, useCallback} from 'react';

const STORAGE_KEY = 'ars-wishlist';
const SYNC_EVENT = 'ars-wishlist-sync';

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
    window.dispatchEvent(new CustomEvent(SYNC_EVENT));
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

  // Re-sync when another instance writes (same tab)
  useEffect(() => {
    const handler = () => setHandles(readStorage());
    window.addEventListener(SYNC_EVENT, handler);
    return () => window.removeEventListener(SYNC_EVENT, handler);
  }, []);

  const toggle = useCallback((handle: string) => {
    const current = readStorage();
    const next = current.includes(handle)
      ? current.filter((h) => h !== handle)
      : [...current, handle];
    writeStorage(next);
    setHandles(next);
  }, []);

  const has = useCallback(
    (handle: string) => handles.includes(handle),
    [handles],
  );

  return {handles, toggle, has};
}
