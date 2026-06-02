type DemoKind = "ok" | "no" | "warn";

type BadgeNavigator = Navigator & {
  setAppBadge?(contents?: number): Promise<void>;
  clearAppBadge?(): Promise<void>;
};

interface DevicePostureTarget {
  type: string;
  addEventListener(type: "change", listener: () => void): void;
  removeEventListener(type: "change", listener: () => void): void;
}

interface BackgroundFetchManagerLike {
  fetch(
    id: string,
    requests: RequestInfo[],
    options: { title: string; downloadTotal?: number }
  ): Promise<{ id: string }>;
}

type WebApiNavigator = Navigator & BadgeNavigator & {
  devicePosture?: DevicePostureTarget & {
    type: string;
  };
};

interface ServiceWorkerRegistrationLike extends ServiceWorkerRegistration {
  backgroundFetch?: BackgroundFetchManagerLike;
}

interface PlaygroundMessage {
  kind: "background-fetch";
  phase: "started" | "success" | "fail" | "abort";
  id: string;
}

export {};

const app = document.querySelector<HTMLElement>("#demo-grid");
const log = document.querySelector<HTMLPreElement>("#activity-log");
const note = document.querySelector<HTMLElement>("#environment-note");
const clearLogButton = document.querySelector<HTMLButtonElement>("#clear-log");

if (!app || !log || !note || !clearLogButton) {
  throw new Error("WebAPI Playground failed to initialize.");
}

const appendLog = (message: string) => {
  const timestamp = new Date().toLocaleTimeString();
  log.textContent = `${log.textContent}${log.textContent ? "\n" : ""}[${timestamp}] ${message}`;
};

const setNote = () => {
  const secure = window.isSecureContext ? "secure context" : "insecure context";
  note.textContent = `Running in a ${secure}. Some APIs need HTTPS or localhost, and some require browser-specific support.`;
};

const createEl = <K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  className?: string,
  textContent?: string
) => {
  const element = document.createElement(tagName);
  if (className) {
    element.className = className;
  }
  if (textContent !== undefined) {
    element.textContent = textContent;
  }
  return element;
};

const badgeFor = (kind: DemoKind, text: string) => {
  const badge = createEl("span", `badge ${kind}`, text);
  badge.setAttribute("role", "status");
  return badge;
};

const formatBytes = (value: number | undefined) => {
  if (value === undefined) {
    return "unknown";
  }
  const units = ["B", "KB", "MB", "GB"];
  let current = value;
  let index = 0;
  while (current >= 1024 && index < units.length - 1) {
    current /= 1024;
    index += 1;
  }
  return `${current.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
};

const isSupported = (condition: boolean) => (condition ? "ok" : "no");

const renderCard = (
  title: string,
  description: string,
  supported: boolean,
  builder: (output: HTMLElement, actions: HTMLElement) => void
) => {
  const card = createEl("section", "card");
  const header = createEl("div", "card-header");
  const heading = createEl("div");
  heading.append(createEl("h3", "", title), createEl("p", "meta", description));
  header.append(heading, badgeFor(isSupported(supported), supported ? "supported" : "unsupported"));

  const actions = createEl("div", "actions");
  const output = createEl("div", "output", "Ready.");

  builder(output, actions);

  card.append(header, actions, output);
  app.append(card);
};

const registerServiceWorker = async () => {
  if (!("serviceWorker" in navigator)) {
    appendLog("Service workers are not supported in this browser.");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("./dist/background-fetch-worker.js", {
      scope: "./"
    });
    await navigator.serviceWorker.ready;
    appendLog("Service worker registered for background fetch demos.");
    return registration as ServiceWorkerRegistrationLike;
  } catch (error) {
    appendLog(`Service worker registration failed: ${String(error)}`);
    return null;
  }
};

const serviceWorkerReady = registerServiceWorker();

const handleServiceWorkerMessage = (event: MessageEvent<PlaygroundMessage>) => {
  if (event.data.kind === "background-fetch") {
    appendLog(`Background Fetch ${event.data.phase} for ${event.data.id}.`);
  }
};

navigator.serviceWorker?.addEventListener("message", handleServiceWorkerMessage as EventListener);

const backgroundFetchSupported =
  "serviceWorker" in navigator && "backgroundFetch" in ServiceWorkerRegistration.prototype;

renderCard(
  "Canvas API",
  "Draw shapes, gradients, and text on a canvas element.",
  "CanvasRenderingContext2D" in window,
  (output, actions) => {
    const canvasWrap = createEl("div", "canvas-wrap");
    const canvas = createEl("canvas") as HTMLCanvasElement;
    canvas.width = 640;
    canvas.height = 320;
    canvasWrap.append(canvas);
    const status = createEl("div", "meta", "Ready to draw.");

    const drawButton = createEl("button", "", "Draw scene");
    drawButton.addEventListener("click", () => {
      const context = canvas.getContext("2d");
      if (!context) {
        status.textContent = "2D canvas context is unavailable.";
        return;
      }

      const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, "#5f8bff");
      gradient.addColorStop(1, "#38b769");
      context.fillStyle = gradient;
      context.fillRect(0, 0, canvas.width, canvas.height);

      context.fillStyle = "rgba(11, 16, 26, 0.75)";
      context.fillRect(28, 28, 240, 120);

      context.beginPath();
      context.arc(460, 160, 72, 0, Math.PI * 2);
      context.fillStyle = "#ffbf47";
      context.fill();

      context.fillStyle = "#ffffff";
      context.font = "bold 30px system-ui";
      context.fillText("WebAPI Playground", 50, 88);
      context.font = "18px system-ui";
      context.fillText("Canvas API example", 50, 118);
      context.fillText("Gradient + shapes + text", 50, 146);

      status.textContent = "Canvas scene rendered.";
    });

    const code = createEl(
      "pre",
      "output mini",
      `const context = canvas.getContext("2d");
const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
gradient.addColorStop(0, "#5f8bff");
gradient.addColorStop(1, "#38b769");
context.fillRect(0, 0, canvas.width, canvas.height);`
    );

    actions.append(drawButton);
    output.replaceChildren(canvasWrap, code, status);
  }
);

renderCard(
  "Beacon API",
  "Queue a small analytics-style payload for delivery without blocking the page.",
  "sendBeacon" in navigator,
  (output, actions) => {
    const endpointField = createEl("div", "field");
    const endpointLabel = createEl("label", "", "Endpoint URL");
    const endpointInput = document.createElement("input");
    endpointInput.type = "url";
    endpointInput.value = "/api/beacon";
    endpointField.append(endpointLabel, endpointInput);

    const payloadField = createEl("div", "field");
    const payloadLabel = createEl("label", "", "Payload");
    const payloadInput = document.createElement("textarea");
    payloadInput.value = JSON.stringify(
      {
        event: "playground-opened",
        api: "beacon",
        at: new Date().toISOString()
      },
      null,
      2
    );
    payloadField.append(payloadLabel, payloadInput);

    const sendButton = createEl("button", "", "Send beacon");
    sendButton.addEventListener("click", () => {
      const body = new Blob([payloadInput.value], { type: "application/json" });
      const delivered = navigator.sendBeacon(endpointInput.value, body);
      output.textContent = delivered
        ? "Beacon queued for delivery. Check the server console for the request body."
        : "Beacon could not be queued.";
    });

    actions.append(sendButton);
    output.replaceChildren(endpointField, payloadField);
  }
);

renderCard(
  "Badging API",
  "Set or clear an app badge from the page.",
  typeof (navigator as BadgeNavigator).setAppBadge === "function",
  (output, actions) => {
    const setButton = createEl("button", "", "Set badge to 7");
    const clearButton = createEl("button", "", "Clear badge");

    setButton.addEventListener("click", async () => {
      try {
        await (navigator as BadgeNavigator).setAppBadge?.(7);
        output.textContent = "App badge set to 7.";
      } catch (error) {
        output.textContent = `Failed to set badge: ${String(error)}`;
      }
    });

    clearButton.addEventListener("click", async () => {
      try {
        await (navigator as BadgeNavigator).clearAppBadge?.();
        output.textContent = "App badge cleared.";
      } catch (error) {
        output.textContent = `Failed to clear badge: ${String(error)}`;
      }
    });

    actions.append(setButton, clearButton);
  }
);

renderCard(
  "Clipboard API",
  "Copy a sample message to the clipboard.",
  Boolean(navigator.clipboard?.writeText),
  (output, actions) => {
    const copyButton = createEl("button", "", "Copy sample text");
    copyButton.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText("Copied from WebAPI Playground.");
        output.textContent = "Copied sample text to the clipboard.";
      } catch (error) {
        output.textContent = `Clipboard write failed: ${String(error)}`;
      }
    });
    actions.append(copyButton);
  }
);

renderCard(
  "Geolocation API",
  "Request the current position from the browser.",
  Boolean(navigator.geolocation),
  (output, actions) => {
    const locateButton = createEl("button", "", "Find my location");
    locateButton.addEventListener("click", () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          output.textContent = `Lat ${latitude.toFixed(5)}, Lng ${longitude.toFixed(5)} (accuracy ${Math.round(
            accuracy
          )}m).`;
        },
        (error) => {
          output.textContent = `Geolocation error: ${error.message}`;
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
    actions.append(locateButton);
  }
);

renderCard(
  "Notifications API",
  "Ask for notification permission and emit a local notification.",
  "Notification" in window,
  (output, actions) => {
    const permissionButton = createEl("button", "", "Request permission");
    const notifyButton = createEl("button", "", "Show notification");

    permissionButton.addEventListener("click", async () => {
      if (typeof Notification === "undefined") {
        output.textContent = "Notification API is unavailable.";
        return;
      }
      const permission = await Notification.requestPermission();
      output.textContent = `Notification permission: ${permission}.`;
    });

    notifyButton.addEventListener("click", async () => {
      if (typeof Notification === "undefined") {
        output.textContent = "Notification API is unavailable.";
        return;
      }
      if (Notification.permission !== "granted") {
        output.textContent = "Request permission first.";
        return;
      }
      new Notification("WebAPI Playground", {
        body: "This is a sample notification from the playground."
      });
      output.textContent = "Notification displayed.";
    });

    actions.append(permissionButton, notifyButton);
  }
);

renderCard(
  "Screen Wake Lock API",
  "Request a wake lock to keep the screen on while a demo is active.",
  "wakeLock" in navigator,
  (output, actions) => {
    let wakeLock: WakeLockSentinel | null = null;
    const toggleButton = createEl("button", "", "Toggle wake lock");

    toggleButton.addEventListener("click", async () => {
      try {
        if (wakeLock) {
          await wakeLock.release();
          wakeLock = null;
          output.textContent = "Wake lock released.";
          return;
        }
        wakeLock = await navigator.wakeLock.request("screen");
        wakeLock.addEventListener("release", () => {
          wakeLock = null;
          output.textContent = "Wake lock released.";
        });
        output.textContent = "Wake lock acquired.";
      } catch (error) {
        output.textContent = `Wake lock failed: ${String(error)}`;
      }
    });

    actions.append(toggleButton);
  }
);

renderCard(
  "Share API",
  "Open the platform share sheet with sample text and a URL.",
  Boolean(navigator.share),
  (output, actions) => {
    const shareButton = createEl("button", "", "Share sample link");
    shareButton.addEventListener("click", async () => {
      if (!navigator.share) {
        output.textContent = "Share API is unavailable.";
        return;
      }
      try {
        await navigator.share({
          title: "WebAPI Playground",
          text: "A browser playground for Web APIs.",
          url: location.href
        });
        output.textContent = "Share sheet opened.";
      } catch (error) {
        output.textContent = `Share failed: ${String(error)}`;
      }
    });
    actions.append(shareButton);
  }
);

renderCard(
  "Storage API",
  "Inspect quota and request persisted storage when the browser supports it.",
  Boolean(navigator.storage?.estimate),
  (output, actions) => {
    const inspectButton = createEl("button", "", "Inspect storage");
    const persistButton = createEl("button", "", "Request persistence");

    inspectButton.addEventListener("click", async () => {
      const storage = navigator.storage;
      if (!storage) {
        output.textContent = "Storage API is unavailable.";
        return;
      }
      const { usage, quota } = await storage.estimate();
      const persisted = await storage.persisted();
      output.textContent = `Usage: ${formatBytes(usage)} / ${formatBytes(quota)}. Persisted: ${persisted}.`;
    });

    persistButton.addEventListener("click", async () => {
      const storage = navigator.storage;
      if (!storage) {
        output.textContent = "Storage API is unavailable.";
        return;
      }
      const granted = await storage.persist();
      output.textContent = granted ? "Persistent storage granted." : "Persistent storage not granted.";
    });

    actions.append(inspectButton, persistButton);
  }
);

renderCard(
  "Device Posture API",
  "Watch the current posture type and react to posture changes on foldable devices.",
  Boolean((navigator as WebApiNavigator).devicePosture),
  (output, actions) => {
    const posture = (navigator as WebApiNavigator).devicePosture;
    const postureLabel = createEl("div", "meta", `Current posture: ${posture?.type ?? "unknown"}.`);
    const refreshButton = createEl("button", "", "Refresh posture");

    if (posture) {
      const refresh = () => {
        postureLabel.textContent = `Current posture: ${posture.type}.`;
      };
      posture.addEventListener("change", refresh);
      refresh();
    }

    output.replaceChildren(postureLabel);
    actions.append(refreshButton);
    refreshButton.addEventListener("click", () => {
      const current = (navigator as WebApiNavigator).devicePosture?.type ?? "unknown";
      output.textContent = `Current posture: ${current}.`;
    });
  }
);

renderCard(
  "Background Fetch API",
  "Register a service worker and start a background download when the browser supports it.",
  backgroundFetchSupported,
  (output, actions) => {
    const urlField = createEl("div", "field");
    const urlLabel = createEl("label", "", "Download URL");
    const urlInput = document.createElement("input");
    urlInput.type = "url";
    urlInput.value = "/api/download?size=4096";
    urlField.append(urlLabel, urlInput);

    const startButton = createEl("button", "", "Start background fetch");
    startButton.addEventListener("click", async () => {
      const registration = await serviceWorkerReady;
      if (!registration?.backgroundFetch) {
        output.textContent = "Background Fetch API is unavailable in this browser.";
        return;
      }
      try {
        const download = await registration.backgroundFetch.fetch(
          `webapi-playground-${Date.now()}`,
          [urlInput.value],
          {
            title: "WebAPI Playground sample download",
            downloadTotal: 1024
          }
        );
        output.textContent = `Background fetch started: ${download.id}. Watch the activity log for completion updates.`;
        registration.active?.postMessage({
          kind: "background-fetch",
          phase: "started",
          id: download.id
        } satisfies PlaygroundMessage);
      } catch (error) {
        output.textContent = `Background fetch failed to start: ${String(error)}`;
      }
    });

    actions.append(startButton);
    output.replaceChildren(urlField);
  }
);

const bytesToHex = (bytes: Uint8Array) =>
  Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

const openSampleDatabase = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open("webapi-playground", 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("samples")) {
        db.createObjectStore("samples");
      }
    };

    request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed."));
    request.onsuccess = () => resolve(request.result);
  });

renderCard(
  "Fetch API",
  "Request JSON from the network and abort long-running requests with AbortController.",
  typeof AbortController !== "undefined",
  (output, actions) => {
    const fetchButton = createEl("button", "", "Fetch sample JSON");
    const abortButton = createEl("button", "", "Abort after 2s");
    let controller: AbortController | null = null;

    fetchButton.addEventListener("click", async () => {
      controller = new AbortController();
      const timeout = window.setTimeout(() => controller?.abort(), 2000);
      try {
        const response = await fetch("/api/todo", {
          signal: controller.signal
        });
        const data: unknown = await response.json();
        output.textContent = JSON.stringify(data, null, 2);
      } catch (error) {
        output.textContent = `Fetch failed: ${String(error)}`;
      } finally {
        window.clearTimeout(timeout);
        controller = null;
      }
    });

    abortButton.addEventListener("click", () => {
      controller?.abort();
      output.textContent = "Fetch aborted.";
    });

    actions.append(fetchButton, abortButton);
  }
);

renderCard(
  "Web Crypto API",
  "Generate random bytes and compute a SHA-256 hash.",
  Boolean(window.crypto?.subtle),
  (output, actions) => {
    const hashButton = createEl("button", "", "Hash sample text");
    hashButton.addEventListener("click", async () => {
      const bytes = crypto.getRandomValues(new Uint8Array(12));
      const digest = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode("WebAPI Playground")
      );
      output.textContent = `Random bytes: ${bytesToHex(bytes)}\nSHA-256: ${bytesToHex(
        new Uint8Array(digest)
      )}`;
    });
    actions.append(hashButton);
  }
);

renderCard(
  "IndexedDB API",
  "Persist a record locally and read it back with a transactional object store.",
  Boolean(window.indexedDB),
  (output, actions) => {
    const saveButton = createEl("button", "", "Save sample record");
    saveButton.addEventListener("click", async () => {
      try {
        const db = await openSampleDatabase();
        const tx = db.transaction("samples", "readwrite");
        const store = tx.objectStore("samples");
        const key = `record-${Date.now()}`;
        await new Promise<void>((resolve, reject) => {
          const putRequest = store.put(
            {
              createdAt: new Date().toISOString(),
              note: "Saved from WebAPI Playground"
            },
            key
          );
          putRequest.onerror = () => reject(putRequest.error ?? new Error("IndexedDB put failed."));
          putRequest.onsuccess = () => resolve();
        });
        const read = await new Promise<unknown>((resolve, reject) => {
          const getRequest = store.get(key);
          getRequest.onerror = () => reject(getRequest.error ?? new Error("IndexedDB get failed."));
          getRequest.onsuccess = () => resolve(getRequest.result);
        });
        output.textContent = JSON.stringify({ key, read }, null, 2);
        db.close();
      } catch (error) {
        output.textContent = `IndexedDB error: ${String(error)}`;
      }
    });
    actions.append(saveButton);
  }
);

renderCard(
  "Cache API",
  "Cache a network response and read it back from the browser cache.",
  Boolean(window.caches),
  (output, actions) => {
    const cacheButton = createEl("button", "", "Cache sample response");
    cacheButton.addEventListener("click", async () => {
      try {
        const cache = await caches.open("webapi-playground");
        const url = "/api/todo";
        const response = await fetch(url);
        await cache.put(url, response.clone());
        const cached = await cache.match(url);
        output.textContent = cached ? await cached.text() : "No cached response found.";
      } catch (error) {
        output.textContent = `Cache API error: ${String(error)}`;
      }
    });
    actions.append(cacheButton);
  }
);

renderCard(
  "BroadcastChannel API",
  "Send a message between browsing contexts on the same origin.",
  Boolean(window.BroadcastChannel),
  (output, actions) => {
    const channel = new BroadcastChannel("webapi-playground");
    channel.onmessage = (event) => {
      output.textContent = `Received broadcast: ${JSON.stringify(event.data)}`;
    };

    const sendButton = createEl("button", "", "Broadcast a message");
    sendButton.addEventListener("click", () => {
      channel.postMessage({
        from: "WebAPI Playground",
        at: new Date().toISOString()
      });
      output.textContent = "Broadcast message sent.";
    });

    actions.append(sendButton);
  }
);

renderCard(
  "Fullscreen API",
  "Promote an element to fullscreen and then exit fullscreen mode.",
  Boolean(document.fullscreenEnabled),
  (output, actions) => {
    const stage = createEl("div", "canvas-wrap");
    stage.innerHTML =
      '<div style="padding:24px;background:linear-gradient(135deg,#5f8bff,#38b769);color:#08111d;font-weight:700">Fullscreen demo stage</div>';
    const status = createEl("div", "meta", "Ready for fullscreen.");
    const enterButton = createEl("button", "", "Enter fullscreen");
    const exitButton = createEl("button", "", "Exit fullscreen");

    enterButton.addEventListener("click", async () => {
      const target = stage.firstElementChild as HTMLElement | null;
      if (!target) {
        return;
      }
      await target.requestFullscreen();
      status.textContent = "Fullscreen requested.";
    });

    exitButton.addEventListener("click", async () => {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      status.textContent = "Exited fullscreen.";
    });

    actions.append(enterButton, exitButton);
    output.replaceChildren(stage, status);
  }
);

renderCard(
  "Media Devices API",
  "List cameras and microphones available to the browser.",
  Boolean(navigator.mediaDevices?.enumerateDevices),
  (output, actions) => {
    const listButton = createEl("button", "", "List devices");
    listButton.addEventListener("click", async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        output.textContent = devices
          .map((device) => `${device.kind}: ${device.label || "(label hidden until permission)"}`)
          .join("\n");
      } catch (error) {
        output.textContent = `MediaDevices error: ${String(error)}`;
      }
    });
    actions.append(listButton);
  }
);

renderCard(
  "Permissions API",
  "Query the browser permission state for common features.",
  Boolean(navigator.permissions?.query),
  (output, actions) => {
    const queryButton = createEl("button", "", "Query notification permission");
    queryButton.addEventListener("click", async () => {
      try {
        const notifications = await navigator.permissions.query({
          name: "notifications" as PermissionName
        });
        const geolocation = await navigator.permissions.query({
          name: "geolocation" as PermissionName
        });
        output.textContent = `notifications: ${notifications.state}\ngeolocation: ${geolocation.state}`;
      } catch (error) {
        output.textContent = `Permissions API error: ${String(error)}`;
      }
    });
    actions.append(queryButton);
  }
);

clearLogButton.addEventListener("click", () => {
  log.textContent = "";
});

setNote();
appendLog("WebAPI Playground loaded.");
