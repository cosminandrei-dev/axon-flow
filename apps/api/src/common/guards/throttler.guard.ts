import { Injectable, ExecutionContext } from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";
import { ThrottlerGuard, ThrottlerException } from "@nestjs/throttler";

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  /**
   * Get client identifier for rate limiting
   * Uses IP address for tracking requests per client
   */
  protected async getTracker(req: Record<string, unknown>): Promise<string> {
    // Extract IP from request, handling proxies
    const forwarded = req.headers as Record<string, string | string[]>;
    const forwardedFor = forwarded?.["x-forwarded-for"];
    const ip =
      (typeof forwardedFor === "string"
        ? forwardedFor.split(",")[0]
        : forwardedFor?.[0]) ??
      (req.ip as string) ??
      "unknown";

    return ip.trim();
  }

  /**
   * Handle both REST and GraphQL contexts
   */
  getRequestResponse(context: ExecutionContext) {
    const contextType = context.getType<string>();

    if (contextType === "graphql") {
      const gqlCtx = GqlExecutionContext.create(context);
      const ctx = gqlCtx.getContext();
      return { req: ctx.req, res: ctx.res };
    }

    // REST context
    return {
      req: context.switchToHttp().getRequest(),
      res: context.switchToHttp().getResponse(),
    };
  }

  /**
   * Custom error message for rate limit exceeded
   */
  protected async throwThrottlingException(): Promise<void> {
    throw new ThrottlerException(
      "Too many requests. Please wait before making another request.",
    );
  }
}
