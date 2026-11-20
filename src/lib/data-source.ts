/**
 * Data layer.
 *
 * The demo keeps the catalogue, sale and settings in the browser (localStorage),
 * so no database is needed. Everything goes through the `DataSource` interface,
 * so a Supabase (or any API) implementation can replace `localDataSource` later
 * without touching the UI.
 */
import { DATA_VERSION, seedData } from "./seed";
import type { StoreData } from "./types";

export interface DataSource {
  /** Returns saved data, or null when nothing has been saved yet. */
  load(): StoreData | null;
  save(data: StoreData): void;
  clear(): void;
  /** Notifies when data changes elsewhere (e.g. admin open in another tab). */
  subscribe(onChange: () => void): () => void;
}

const KEY = "mf.store";

export const localDataSource: DataSource = {
  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as StoreData;
      if (parsed?.version !== DATA_VERSION || !Array.isArray(parsed.products)) return null;
      const seed = seedData();
      return {
        ...parsed,
        sale: { ...seed.sale, ...parsed.sale },
        settings: { ...seed.settings, ...parsed.settings },
      };
    } catch {
      return null;
    }
  },
  save(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {
      // Usually quota exceeded from large uploaded images.
      throw new Error("Couldn't save. The browser storage is full. Try smaller images.", { cause: e });
    }
  },
  clear() {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  },
  subscribe(onChange) {
    const h = (e: StorageEvent) => {
      if (e.key === KEY || e.key === null) onChange();
    };
    window.addEventListener("storage", h);
    return () => window.removeEventListener("storage", h);
  },
};
