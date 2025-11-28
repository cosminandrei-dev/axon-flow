export class SubscriptionClient {
  constructor(...args: unknown[]);
}

export class SubscriptionServer {
  static create(...args: unknown[]): never;
}

export const GRAPHQL_WS: string;
export const GRAPHQL_SUBSCRIPTIONS: string;
