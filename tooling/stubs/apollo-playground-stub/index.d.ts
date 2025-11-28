import type { ApolloServerPlugin } from '@apollo/server';

export interface ApolloServerPluginLandingPageGraphQLPlaygroundOptions {
  version?: string;
  settings?: Record<string, unknown>;
  tabs?: Array<{ endpoint?: string; query?: string; variables?: string }>;
}

export default function ApolloServerPluginLandingPageGraphQLPlayground(
  options?: ApolloServerPluginLandingPageGraphQLPlaygroundOptions
): ApolloServerPlugin;

export { ApolloServerPluginLandingPageGraphQLPlayground };
