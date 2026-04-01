import {useState, useEffect, useCallback} from 'react';

const STORAGE_KEY = 'ars-recently-viewed';
const MAX_ITEMS = 8;

export type RecentProduct = {
  handle: string;
  title: string;
  vendor: string;
  imageUrl: string | null;
  imageAlt: string | null;
  price: string;
  currencyCode: string;
};

function readStorage(): RecentProduct[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RecentProduct[]) : [];
  } catch {
    return [];
  }
}

function writeStorage(items: RecentProduct[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Silently ignore quota/private-mode errors
  }
}

export function useRecentlyViewed(currentHandle?: string) {
  const [items, setItems] = useState<RecentProduct[]>([]);

  // Hydrate from localStorage after mount
  useEffect(() => {
    setItems(readStorage());
  }, []);

  const addItem = useCallback((product: RecentProduct) => {
    setItems((prev) => {
      // Remove existing entry for this handle (dedup), prepend new, cap at MAX_ITEMS
      const filtered = prev.filter((p) => p.handle !== product.handle);
      const next = [product, ...filtered].slice(0, MAX_ITEMS);
      writeStorage(next);
      return next;
    });
  }, []);

  // Items to display: exclude current product, limit to 4
  const displayItems = items
    .filter((p) => p.handle !== currentHandle)
    .slice(0, 4);

  return {items, addItem, displayItems};
}
