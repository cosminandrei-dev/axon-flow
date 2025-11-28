import { NestFactory } from "@nestjs/core";
import helmet from "helmet";
import {
  logger,
  correlationMiddleware,
  metricsMiddleware,
  initTracer,
  shutdownTracer,
} from "@repo/observability";

import { AppModule } from "./app.module";

// Initialize OpenTelemetry tracer before app bootstrap
const sdk = initTracer("axon-flow-api", process.env.npm_package_version || "0.0.0");

const SHUTDOWN_TIMEOUT_MS = 30_000;

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Use Pino-based structured logger
    logger: {
      log: (message: string) => logger.info({ context: "NestJS" }, message),
      error: (message: string, trace?: string) =>
        logger.error({ context: "NestJS", trace }, message),
      warn: (message: string) => logger.warn({ context: "NestJS" }, message),
      debug: (message: string) => logger.debug({ context: "NestJS" }, message),
      verbose: (message: string) => logger.debug({ context: "NestJS" }, message),
    },
  });

  // Register observability middleware
  app.use(correlationMiddleware());
  app.use(metricsMiddleware());

  // Security: Helmet headers (disabled CSP in dev for GraphQL Playground)
  app.use(
    helmet({
      contentSecurityPolicy:
        process.env.NODE_ENV === "production" ? undefined : false,
    }),
  );

  // CORS configuration
  const allowedOrigins = process.env.CORS_ORIGINS?.split(",") ?? [
    "http://localhost:3000",
  ];
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID", "X-Correlation-ID"],
  });

  // Enable graceful shutdown hooks
  app.enableShutdownHooks();

  // Handle SIGTERM for graceful shutdown
  let isShuttingDown = false;
  const gracefulShutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    logger.info({ context: "Shutdown" }, `Received ${signal}, starting graceful shutdown...`);

    // Set a timeout for graceful shutdown
    const shutdownTimer = setTimeout(() => {
      logger.error(
        { context: "Shutdown" },
        `Graceful shutdown timed out after ${SHUTDOWN_TIMEOUT_MS}ms, forcing exit`
      );
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);

    try {
      // Shutdown tracer to flush pending traces
      await shutdownTracer(sdk);
      await app.close();
      clearTimeout(shutdownTimer);
      logger.info({ context: "Shutdown" }, "Graceful shutdown completed");
      process.exit(0);
    } catch (error) {
      clearTimeout(shutdownTimer);
      logger.error({ context: "Shutdown", err: error }, "Error during graceful shutdown");
      process.exit(1);
    }
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));

  const port = process.env.PORT ?? 4000;
  await app.listen(port);

  logger.info(
    { context: "Bootstrap", port },
    `API Gateway running on http://localhost:${port}`
  );
  logger.info(
    { context: "Bootstrap" },
    `GraphQL Playground: http://localhost:${port}/graphql`
  );
  logger.info(
    { context: "Bootstrap" },
    `Metrics endpoint: http://localhost:${port}/metrics`
  );
}

bootstrap();
