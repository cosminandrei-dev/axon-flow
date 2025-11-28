import type { ApolloServerPlugin, GraphQLRequestListener } from "@apollo/server";
import { GraphQLError, type GraphQLSchema } from "graphql";
import {
  getComplexity,
  simpleEstimator,
  fieldExtensionsEstimator,
} from "graphql-query-complexity";

interface ComplexityPluginOptions {
  maxComplexity: number;
}

interface RequestContext {
  schema: GraphQLSchema;
}

/**
 * Apollo Server plugin to enforce query complexity limits.
 * Prevents DoS attacks via expensive queries by calculating
 * the cost of each query and rejecting those that exceed the limit.
 *
 * Default complexity: 1 per field
 * Maximum complexity: configurable (default 1000)
 *
 * @see https://www.npmjs.com/package/graphql-query-complexity
 */
export function createComplexityPlugin(
  options: ComplexityPluginOptions,
): ApolloServerPlugin<RequestContext> {
  return {
    async requestDidStart(): Promise<GraphQLRequestListener<RequestContext>> {
      return {
        async didResolveOperation(requestContext) {
          const { request, document, schema } = requestContext;

          if (!document || !schema) {
            return;
          }

          const complexity = getComplexity({
            schema,
            query: document,
            variables: request.variables ?? {},
            estimators: [
              // Use field extensions if defined (for fine-grained control)
              fieldExtensionsEstimator(),
              // Fall back to simple estimator (1 point per field)
              simpleEstimator({ defaultComplexity: 1 }),
            ],
          });

          if (complexity > options.maxComplexity) {
            throw new GraphQLError(
              `Query complexity ${complexity} exceeds maximum allowed complexity ${options.maxComplexity}`,
              {
                extensions: {
                  code: "QUERY_TOO_COMPLEX",
                  complexity,
                  maxComplexity: options.maxComplexity,
                },
              },
            );
          }
        },
      };
    },
  };
}
