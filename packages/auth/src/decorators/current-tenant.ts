import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

import type { TokenPayload } from '../jwt.js';

/**
 * Parameter decorator that extracts the tenant ID from the authenticated user.
 *
 * Returns the tenantId from the JWT token payload, enabling tenant-scoped
 * database queries via Row-Level Security (RLS).
 *
 * @example
 * ```typescript
 * // In a GraphQL resolver
 * @UseGuards(AuthGuard)
 * @Query(() => [Workflow])
 * async workflows(@CurrentTenant() tenantId: string) {
 *   return this.workflowService.findByTenant(tenantId);
 * }
 *
 * // In a REST controller
 * @UseGuards(AuthGuard)
 * @Get('resources')
 * async getResources(@CurrentTenant() tenantId: string) {
 *   return this.resourceService.findAll({ tenantId });
 * }
 * ```
 *
 * @returns Tenant ID string, or undefined if user context is not present
 */
export const CurrentTenant = createParamDecorator(
  (data: unknown, context: ExecutionContext): string | undefined => {
    const type = context.getType<string>();
    let user: TokenPayload | undefined;

    if (type === 'graphql') {
      const gqlContext = GqlExecutionContext.create(context);
      user = gqlContext.getContext().req?.user as TokenPayload | undefined;
    } else {
      const request = context.switchToHttp().getRequest<{ user?: TokenPayload }>();
      user = request.user;
    }

    return user?.tenantId;
  },
);
