import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const start = Date.now();
    const contextType = context.getType<string>();

    // Extract request info based on context type
    const requestInfo = this.getRequestInfo(context, contextType);

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - start;
          this.logger.log(`Request completed`, {
            ...requestInfo,
            duration: `${duration}ms`,
            status: "success",
          });
        },
        error: (error: Error) => {
          const duration = Date.now() - start;
          this.logger.error(`Request failed`, {
            ...requestInfo,
            duration: `${duration}ms`,
            status: "error",
            error: error.message,
          });
        },
      }),
    );
  }

  private getRequestInfo(
    context: ExecutionContext,
    contextType: string,
  ): Record<string, string | undefined> {
    if (contextType === "graphql") {
      const gqlCtx = GqlExecutionContext.create(context);
      const info = gqlCtx.getInfo();
      const req = gqlCtx.getContext().req;

      return {
        type: "graphql",
        operation: info?.operation?.operation ?? "unknown",
        fieldName: info?.fieldName ?? "unknown",
        correlationId:
          req?.headers?.["x-request-id"] ?? req?.headers?.["x-correlation-id"],
      };
    }

    // REST context
    const request = context.switchToHttp().getRequest();
    return {
      type: "rest",
      method: request?.method,
      path: request?.url,
      correlationId:
        request?.headers?.["x-request-id"] ??
        request?.headers?.["x-correlation-id"],
    };
  }
}
