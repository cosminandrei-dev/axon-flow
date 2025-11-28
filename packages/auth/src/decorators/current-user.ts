import { createParamDecorator, type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

import type { TokenPayload } from '../jwt.js';

/**
 * Parameter decorator that extracts the authenticated user from the request.
 *
 * Must be used with AuthGuard or TenantGuard to ensure user is populated.
 *
 * @example
 * ```typescript
 * // In a GraphQL resolver
 * @UseGuards(AuthGuard)
 * @Query(() => User)
 * async me(@CurrentUser() user: TokenPayload) {
 *   return this.userService.findById(user.sub);
 * }
 *
 * // In a REST controller
 * @UseGuards(AuthGuard)
 * @Get('profile')
 * async getProfile(@CurrentUser() user: TokenPayload) {
 *   return { userId: user.sub, tenantId: user.tenantId };
 * }
 * ```
 *
 * @throws UnauthorizedException if user context is not present (guard not applied)
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext): TokenPayload => {
    const type = context.getType<string>();
    let user: TokenPayload | undefined;

    if (type === 'graphql') {
      const gqlContext = GqlExecutionContext.create(context);
      user = gqlContext.getContext().req?.user as TokenPayload | undefined;
    } else {
      const request = context.switchToHttp().getRequest<{ user?: TokenPayload }>();
      user = request.user;
    }

    if (!user) {
      throw new UnauthorizedException(
        'User context not found. Ensure AuthGuard is applied to this route.',
      );
    }

    return user;
  },
);
