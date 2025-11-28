import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import helmet from "helmet";

import { AppModule } from "./app.module";

const SHUTDOWN_TIMEOUT_MS = 30_000;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger("Bootstrap");

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
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
  });

  // Enable graceful shutdown hooks
  app.enableShutdownHooks();

  // Handle SIGTERM for graceful shutdown
  let isShuttingDown = false;
  const gracefulShutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    logger.log(`Received ${signal}, starting graceful shutdown...`);

    // Set a timeout for graceful shutdown
    const shutdownTimer = setTimeout(() => {
      logger.error(
        `Graceful shutdown timed out after ${SHUTDOWN_TIMEOUT_MS}ms, forcing exit`,
      );
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);

    try {
      await app.close();
      clearTimeout(shutdownTimer);
      logger.log("Graceful shutdown completed");
      process.exit(0);
    } catch (error) {
      clearTimeout(shutdownTimer);
      logger.error("Error during graceful shutdown", error);
      process.exit(1);
    }
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));

  const port = process.env.PORT ?? 4000;
  await app.listen(port);

  logger.log(`API Gateway running on http://localhost:${port}`);
  logger.log(`GraphQL Playground: http://localhost:${port}/graphql`);
}

bootstrap();
