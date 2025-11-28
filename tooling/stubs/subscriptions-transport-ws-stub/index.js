// Stub for deprecated subscriptions-transport-ws
// This package is deprecated - use graphql-ws instead
// See: https://github.com/enisdenjo/graphql-ws

class SubscriptionClient {
  constructor() {
    throw new Error(
      'subscriptions-transport-ws is deprecated and has been stubbed out. ' +
      'Please use graphql-ws instead. See: https://github.com/enisdenjo/graphql-ws'
    );
  }
}

class SubscriptionServer {
  static create() {
    throw new Error(
      'subscriptions-transport-ws is deprecated and has been stubbed out. ' +
      'Please use graphql-ws instead. See: https://github.com/enisdenjo/graphql-ws'
    );
  }
}

module.exports = {
  SubscriptionClient,
  SubscriptionServer,
  GRAPHQL_WS: 'graphql-ws',
  GRAPHQL_SUBSCRIPTIONS: 'graphql-subscriptions',
};
