export type ExtensionTab = {
  id?: number;
  url?: string;
  active?: boolean;
};

export type ExtensionMessageSender = {
  tab?: ExtensionTab;
  url?: string;
};

type SendResponse<T = unknown> = (response: T) => void;

type RuntimeApi = {
  lastError?: { message: string } | undefined;
  onInstalled: {
    addListener(callback: () => void): void;
  };
  onMessage: {
    addListener(
      callback: (
        message: unknown,
        sender: ExtensionMessageSender,
        sendResponse: SendResponse
      ) => boolean | void
    ): void;
  };
  getURL(path: string): string;
  sendMessage<T = unknown>(message: unknown): Promise<T>;
};

type TabsApi = {
  create(createProperties: {
    active?: boolean;
    url?: string;
  }): Promise<ExtensionTab>;
  query(queryInfo: {
    active?: boolean;
    currentWindow?: boolean;
  }): Promise<ExtensionTab[]>;
  sendMessage<T = unknown>(tabId: number, message: unknown): Promise<T>;
};

type DownloadsApi = {
  download(options: {
    filename?: string;
    saveAs?: boolean;
    url: string;
  }, callback?: (downloadId?: number) => void): Promise<number> | void;
};

type StorageLocalApi = {
  get(keys?: string | string[] | null): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
};

export type BrowserApi = {
  runtime: RuntimeApi;
  tabs: TabsApi;
  downloads?: DownloadsApi;
  storage: {
    local: StorageLocalApi;
  };
};

declare global {
  var browser: BrowserApi | undefined;
  var chrome: BrowserApi | undefined;
}

const preferredApi = globalThis.browser ?? globalThis.chrome;
const downloadsApi = globalThis.browser?.downloads ?? globalThis.chrome?.downloads;

if (!preferredApi) {
  throw new Error("WebExtension APIs are unavailable in this context.");
}

// Safari can expose APIs across namespaces inconsistently. Keep one normalized object.
export const browser: BrowserApi = downloadsApi
  ? { ...preferredApi, downloads: downloadsApi }
  : preferredApi;
