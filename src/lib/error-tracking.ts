type ErrorSeverity = "error" | "warning" | "info";

type ErrorReport = {
  id: string;
  message: string;
  stack?: string;
  severity: ErrorSeverity;
  timestamp: number;
  url?: string;
  userId?: string;
  metadata?: Record<string, string | number | boolean>;
};

class ErrorTracker {
  private reports: ErrorReport[] = [];
  private enabled = true;
  private maxReports = 100;

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  captureError(error: Error, severity: ErrorSeverity = "error", metadata?: Record<string, string | number | boolean>) {
    if (!this.enabled) return;

    const report: ErrorReport = {
      id: this.generateId(),
      message: error.message,
      stack: error.stack,
      severity,
      timestamp: Date.now(),
      url: typeof window !== "undefined" ? window.location.href : undefined,
      metadata,
    };

    this.reports.push(report);

    if (this.reports.length > this.maxReports) {
      this.reports = this.reports.slice(-this.maxReports);
    }

    if (severity === "error") {
      console.error("[ErrorTracker]", error.message, metadata);
    }

    return report.id;
  }

  captureMessage(message: string, severity: ErrorSeverity = "info", metadata?: Record<string, string | number | boolean>) {
    if (!this.enabled) return;

    const report: ErrorReport = {
      id: this.generateId(),
      message,
      severity,
      timestamp: Date.now(),
      url: typeof window !== "undefined" ? window.location.href : undefined,
      metadata,
    };

    this.reports.push(report);

    if (this.reports.length > this.maxReports) {
      this.reports = this.reports.slice(-this.maxReports);
    }

    return report.id;
  }

  getReports() {
    return [...this.reports];
  }

  clearReports() {
    this.reports = [];
  }

  private generateId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
}

export const errorTracker = new ErrorTracker();

export function captureError(error: Error, severity?: ErrorSeverity, metadata?: Record<string, string | number | boolean>) {
  return errorTracker.captureError(error, severity, metadata);
}

export function captureMessage(message: string, severity?: ErrorSeverity, metadata?: Record<string, string | number | boolean>) {
  return errorTracker.captureMessage(message, severity, metadata);
}
