declare module "graphql-depth-limit" {
  import type { ValidationRule } from "graphql";
  function depthLimit(
    maxDepth: number,
    options?: {
      ignore?: (string | RegExp | ((queryDepths: Record<string, number>) => boolean))[];
    },
    callback?: (queryDepths: Record<string, number>) => void
  ): ValidationRule;
  export = depthLimit;
}
