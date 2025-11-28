import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Response, Request } from "express";

interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
  correlationId?: string;
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Extract message from exception response
    const message =
      typeof exceptionResponse === "object" &&
      "message" in exceptionResponse &&
      exceptionResponse.message !== null
        ? (exceptionResponse.message as string | string[])
        : exception.message;

    const correlationId =
      (request.headers["x-request-id"] as string) ??
      (request.headers["x-correlation-id"] as string);

    const errorResponse: ErrorResponse = {
      statusCode: status,
      message,
      error: HttpStatus[status] ?? "Unknown Error",
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(correlationId && { correlationId }),
    };

    // Log the error
    this.logger.error(
      `HTTP Exception: ${status} ${request.method} ${request.url}`,
      {
        statusCode: status,
        message,
        correlationId,
      },
    );

    response.status(status).json(errorResponse);
  }
}
