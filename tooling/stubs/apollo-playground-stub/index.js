// Stub for deprecated @apollo/server-plugin-landing-page-graphql-playground
// This plugin is no longer needed - Apollo Server 4+ has built-in landing pages
// Use ApolloServerPluginLandingPageLocalDefault or ApolloServerPluginLandingPageProductionDefault instead

module.exports = function ApolloServerPluginLandingPageGraphQLPlayground() {
  console.warn(
    '[@apollo/server-plugin-landing-page-graphql-playground] This plugin is deprecated and stubbed out. ' +
    'Use Apollo Sandbox instead by importing from "@apollo/server/plugin/landingPage/default"'
  );
  return {
    async serverWillStart() {
      return {
        async renderLandingPage() {
          return {
            html: '<html><body><h1>GraphQL Playground Deprecated</h1><p>Please use Apollo Sandbox instead.</p></body></html>'
          };
        }
      };
    }
  };
};

module.exports.default = module.exports;
