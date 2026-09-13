import { captureError } from "./lib/error-tracking";

window.addEventListener("error", (event) => {
  captureError(event.error instanceof Error ? event.error : new Error(event.message));
});
window.addEventListener("unhandledrejection", (event) => {
  captureError(event.reason instanceof Error ? event.reason : new Error("Unhandled promise rejection"));
});
