import {
  Injectable,
  type NestInterceptor,
  type OnApplicationShutdown,
} from "@nestjs/common";
import { PostHog } from "posthog-node";
import { PostHogInterceptor } from "posthog-node/nestjs";
import type { CaptureAi } from "./observed-harness.js";

type AnalyticsProperties = Record<string, boolean | number | string | null>;

@Injectable()
export class AnalyticsService implements OnApplicationShutdown {
  private readonly client: PostHog | null;

  constructor() {
    const token = process.env.POSTHOG_PROJECT_TOKEN;
    const host = process.env.POSTHOG_HOST;

    this.client =
      token && host
        ? new PostHog(token, {
            host,
            enableExceptionAutocapture: true,
            logs: { serviceName: "agent-eval-backend" },
          })
        : null;
  }

  interceptor(): NestInterceptor {
    return this.client
      ? new PostHogInterceptor(this.client, { captureExceptions: true })
      : { intercept: (_context, next) => next.handle() };
  }

  capture(event: string, properties: AnalyticsProperties = {}): void {
    if (!this.client) return;

    this.client.capture({
      distinctId: this.client.getContext()?.distinctId ?? "agent-eval-local",
      event,
      properties,
    });
  }

  info(message: string, properties: AnalyticsProperties = {}): void {
    this.client?.logger.info(message, properties);
  }

  captureAi: CaptureAi = (event, properties, timestamp) => {
    try {
      this.client?.capture({
        distinctId:
          this.client.getContext()?.distinctId ??
          String(properties.$ai_trace_id),
        event,
        properties: { ...properties, $process_person_profile: false },
        timestamp,
      });
    } catch {
      // Instrumentation cannot change a session's result.
    }
  };

  exception(error: unknown, operation: string): void {
    this.client?.captureException(
      error,
      this.client.getContext()?.distinctId ?? "agent-eval-local",
      { operation },
    );
    this.client?.logger.error("Operation failed", { operation });
  }

  async onApplicationShutdown(): Promise<void> {
    await this.client?.shutdown();
  }
}
