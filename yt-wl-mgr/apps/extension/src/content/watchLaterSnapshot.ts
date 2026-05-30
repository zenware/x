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

  sendResponse(buildWatchLaterPageScanResponse(document, window.location.href));
  return false;
});
