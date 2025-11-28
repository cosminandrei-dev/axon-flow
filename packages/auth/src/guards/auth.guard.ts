import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

import type { JWTService, TokenPayload } from '../jwt.js';

/**
 * Request object with optional user payload.
 */
export interface RequestWithUser {
  user?: TokenPayload;
  headers?: {
    authorization?: string;
    [key: string]: string | undefined;
  };
}

/**
 * NestJS guard that validates JWT tokens from Authorization header.
 *
 * Features:
 * - Extracts JWT from `Authorization: Bearer <token>` header
 * - Verifies token signature with RS256 public key
 * - Rejects expired or malformed tokens with 401 Unauthorized
 * - Sets user context on request object for downstream use
 * - Works with both GraphQL and REST contexts
 *
 * @example
 * ```typescript
 * // In a NestJS module
 * @Module({
 *   providers: [
 *     {
 *       provide: AuthGuard,
 *       useFactory: async () => {
 *         const jwtService = await createJWTService();
 *         return new AuthGuard(jwtService);
 *       },
 *     },
 *   ],
 * })
 *
 * // In a controller or resolver
 * @UseGuards(AuthGuard)
 * @Query()
 * async protectedResource(@CurrentUser() user: TokenPayload) {
 *   return { userId: user.sub };
 * }
 * ```
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JWTService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = this.getRequest(context);
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing authentication token');
    }

    try {
      const payload = await this.jwtService.verify(token);
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Extracts Bearer token from Authorization header.
   */
  private extractToken(request: RequestWithUser): string | null {
    const authHeader = request.headers?.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.slice(7);
  }

  /**
   * Gets the request object from the execution context.
   * Handles both GraphQL and REST contexts.
   */
  protected getRequest(context: ExecutionContext): RequestWithUser {
    const type = context.getType<string>();
    if (type === 'graphql') {
      const gqlContext = GqlExecutionContext.create(context);
      return gqlContext.getContext().req as RequestWithUser;
    }
    return context.switchToHttp().getRequest<RequestWithUser>();
  }
}
