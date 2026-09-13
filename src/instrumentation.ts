import type { Instrumentation } from "next";
import { reportFrontendError } from "./lib/frontend-observability";

export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  await reportFrontendError({
    message: error instanceof Error ? error.message : "Unhandled frontend server error",
    stack: error instanceof Error ? error.stack : undefined,
    route: context.routePath || request.path,
    code: "FRONTEND_SERVER_ERROR",
  });
};
