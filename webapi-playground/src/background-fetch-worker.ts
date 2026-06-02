interface PlaygroundMessage {
  kind: "background-fetch";
  phase: "started" | "success" | "fail" | "abort";
  id: string;
}

interface BackgroundFetchEventLike extends Event {
  registration: {
    id: string;
  };
}

interface ServiceWorkerClientsLike {
  matchAll(options?: { type?: "window"; includeUncontrolled?: boolean }): Promise<
    Array<{
      postMessage(message: PlaygroundMessage): void;
    }>
  >;
  claim(): Promise<void>;
}

interface ServiceWorkerGlobalScopeLike extends WorkerGlobalScope {
  clients: ServiceWorkerClientsLike;
  skipWaiting(): Promise<void>;
}

interface ExtendableEventLike extends Event {
  waitUntil(promise: Promise<unknown>): void;
}

const sw = self as unknown as ServiceWorkerGlobalScopeLike;

const notifyClients = async (phase: PlaygroundMessage["phase"], id: string) => {
  const clients = await sw.clients.matchAll({ type: "window", includeUncontrolled: true });
  for (const client of clients) {
    client.postMessage({ kind: "background-fetch", phase, id } satisfies PlaygroundMessage);
  }
};

self.addEventListener("install", () => {
  void sw.skipWaiting();
});

self.addEventListener("activate", (event: Event) => {
  (event as unknown as ExtendableEventLike).waitUntil(sw.clients.claim());
});

self.addEventListener("message", (event: MessageEvent<PlaygroundMessage>) => {
  const data = event.data as PlaygroundMessage | undefined;
  if (data?.kind === "background-fetch") {
    void notifyClients(data.phase, data.id);
  }
});

self.addEventListener("backgroundfetchsuccess", ((event: BackgroundFetchEventLike) => {
  void notifyClients("success", (event as BackgroundFetchEventLike).registration.id);
}) as EventListener);

self.addEventListener("backgroundfetchfail", ((event: BackgroundFetchEventLike) => {
  void notifyClients("fail", (event as BackgroundFetchEventLike).registration.id);
}) as EventListener);

self.addEventListener("backgroundfetchabort", ((event: BackgroundFetchEventLike) => {
  void notifyClients("abort", (event as BackgroundFetchEventLike).registration.id);
}) as EventListener);
