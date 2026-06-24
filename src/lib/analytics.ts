type AnalyticsEvent = {
  name: string;
  properties?: Record<string, string | number | boolean>;
  timestamp?: number;
};

type AnalyticsProvider = {
  name: string;
  track: (event: AnalyticsEvent) => void;
  page: (url: string) => void;
  identify: (userId: string, traits?: Record<string, string | number | boolean>) => void;
};

class Analytics {
  private provider: AnalyticsProvider | null = null;
  private queue: AnalyticsEvent[] = [];
  private enabled = false;

  init(provider: AnalyticsProvider) {
    this.provider = provider;
    this.enabled = true;
    this.flush();
  }

  track(name: string, properties?: Record<string, string | number | boolean>) {
    const event: AnalyticsEvent = {
      name,
      properties,
      timestamp: Date.now(),
    };

    if (this.enabled && this.provider) {
      this.provider.track(event);
    } else {
      this.queue.push(event);
    }
  }

  page(url: string) {
    if (this.enabled && this.provider) {
      this.provider.page(url);
    }
  }

  identify(userId: string, traits?: Record<string, string | number | boolean>) {
    if (this.enabled && this.provider) {
      this.provider.identify(userId, traits);
    }
  }

  private flush() {
    while (this.queue.length > 0) {
      const event = this.queue.shift();
      if (event && this.provider) {
        this.provider.track(event);
      }
    }
  }
}

export const analytics = new Analytics();

export function trackEvent(name: string, properties?: Record<string, string | number | boolean>) {
  analytics.track(name, properties);
}

export function trackPage(url: string) {
  analytics.page(url);
}

export function identifyUser(userId: string, traits?: Record<string, string | number | boolean>) {
  analytics.identify(userId, traits);
}
