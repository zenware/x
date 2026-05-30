type PageScanRequest = import("../messages.js").PageScanRequest;
import { browser } from "../browserApi.js";
import { buildWatchLaterPageScanResponse } from "./watchLaterPage.js";

function isPageScanRequest(value: unknown): value is PageScanRequest {
  return Boolean(value && typeof value === "object" && "type" in value && value.type === "watch-later/scan-page");
}

browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!isPageScanRequest(message)) {
    return false;
  }

  void buildWatchLaterPageScanResponse(document, window.location.href, message.loadAll === true)
    .then((response) => {
      sendResponse(response);
    })
    .catch((error: unknown) => {
      const messageText = error instanceof Error ? error.message : "Unable to scan the Watch Later page.";
      sendResponse({
        type: "watch-later/scan-result",
        ok: false,
        message: messageText
      });
    });

  return true;
});
