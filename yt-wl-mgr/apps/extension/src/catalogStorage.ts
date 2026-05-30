import {
  createEmptyCatalogStore,
  parseCatalogStore,
  type CatalogStore
} from "../../../packages/core/src/index.js";
import { browser } from "./browserApi.js";

export const catalogStorageKey = "watchLaterCatalog";
const indexedDbName = "ytWatchLaterManager";
const indexedDbStoreName = "extensionState";

type StorageItems = Record<string, unknown>;

function canUseIndexedDb(): boolean {
  return typeof globalThis.indexedDB !== "undefined";
}

function openIndexedDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = globalThis.indexedDB.open(indexedDbName, 1);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(indexedDbStoreName)) {
        database.createObjectStore(indexedDbStoreName);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error(request.error?.message ?? "Unable to open IndexedDB."));
  });
}

function readFromIndexedDb(database: IDBDatabase): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(indexedDbStoreName, "readonly");
    const store = transaction.objectStore(indexedDbStoreName);
    const request = store.get(catalogStorageKey);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error(request.error?.message ?? "Unable to read from IndexedDB."));
  });
}

function writeToIndexedDb(database: IDBDatabase, catalog: CatalogStore): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(indexedDbStoreName, "readwrite");
    const store = transaction.objectStore(indexedDbStoreName);
    const request = store.put(catalog, catalogStorageKey);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error(request.error?.message ?? "Unable to write to IndexedDB."));
  });
}

export async function loadCatalogStore(): Promise<CatalogStore> {
  if (canUseIndexedDb()) {
    try {
      const database = await openIndexedDb();
      const storedCatalog = await readFromIndexedDb(database);
      database.close();

      if (storedCatalog !== undefined) {
        return parseCatalogStore(storedCatalog);
      }
    } catch {
      // Fall through to extension storage fallback.
    }
  }

  const storedItems = await browser.storage.local.get(catalogStorageKey);
  const fallbackCatalog = storedItems[catalogStorageKey];
  if (fallbackCatalog === undefined) {
    return createEmptyCatalogStore();
  }

  return parseCatalogStore(fallbackCatalog);
}

export async function saveCatalogStore(catalog: CatalogStore): Promise<void> {
  if (canUseIndexedDb()) {
    try {
      const database = await openIndexedDb();
      await writeToIndexedDb(database, catalog);
      database.close();
      return;
    } catch {
      // Fall through to extension storage fallback.
    }
  }

  const fallbackItems: StorageItems = {
    [catalogStorageKey]: catalog
  };
  await browser.storage.local.set(fallbackItems);
}
