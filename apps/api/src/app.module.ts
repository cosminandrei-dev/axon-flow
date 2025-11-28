import { join } from "path";

import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { GraphQLModule } from "@nestjs/graphql";
import { ThrottlerModule } from "@nestjs/throttler";
import type { Request, Response } from "express";
import depthLimit from "graphql-depth-limit";

import { CustomThrottlerGuard } from "./common/guards/throttler.guard";
import { createComplexityPlugin } from "./graphql/plugins";
import { HealthModule } from "./modules/health/health.module";

// Configuration constants
const MAX_QUERY_DEPTH = 10;
const MAX_QUERY_COMPLEXITY = 1000;

@Module({
  imports: [
    // Rate limiting: 100 requests per minute per IP
    ThrottlerModule.forRoot([
      {
        name: "default",
        ttl: 60000, // 1 minute in milliseconds
        limit: 100, // 100 requests per minute
      },
    ]),

    // GraphQL Apollo Server configuration
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      typePaths: ["./**/*.graphql"],
      definitions: {
        path: join(process.cwd(), "src/graphql/generated/graphql.ts"),
        outputAs: "interface",
      },
      playground: process.env.NODE_ENV !== "production",
      introspection: process.env.NODE_ENV !== "production",
      context: ({ req, res }: { req: Request; res: Response }) => ({ req, res }),
      // Security: Query depth limiting (prevents deeply nested queries)
      validationRules: [depthLimit(MAX_QUERY_DEPTH)],
      // Security: Query complexity limiting (prevents expensive queries)
      plugins: [createComplexityPlugin({ maxComplexity: MAX_QUERY_COMPLEXITY })],
      includeStacktraceInErrorResponses: process.env.NODE_ENV !== "production",
    }),

    // Feature modules
    HealthModule,
  ],
  providers: [
    // Apply rate limiting globally
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule {}
