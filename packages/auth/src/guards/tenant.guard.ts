import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

import type { JWTService, TokenPayload } from '../jwt.js';

import type { RequestWithUser } from './auth.guard.js';

/**
 * Database client interface for RLS context setting.
 * Should match the execute method from @repo/database.
 */
export interface DatabaseClient {
  execute(query: { sql: string }): Promise<unknown>;
}

/**
 * NestJS guard that validates JWT and sets PostgreSQL RLS context.
 *
 * Extends AuthGuard functionality by:
 * - Validating JWT token (same as AuthGuard)
 * - Setting PostgreSQL session variable `app.current_tenant_id`
 * - Enabling tenant-scoped database queries via Row-Level Security
 *
 * @example
 * ```typescript
 * // In a NestJS module
 * @Module({
 *   providers: [
 *     {
 *       provide: TenantGuard,
 *       useFactory: async (db: DatabaseClient) => {
 *         const jwtService = await createJWTService();
 *         return new TenantGuard(jwtService, db);
 *       },
 *       inject: ['DATABASE'],
 *     },
 *   ],
 * })
 *
 * // In a controller or resolver
 * @UseGuards(TenantGuard)
 * @Query()
 * async tenantScopedData() {
 *   // Database queries automatically filtered by tenant_id via RLS
 *   return this.service.findAll();
 * }
 * ```
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private readonly jwtService: JWTService,
    private readonly db: DatabaseClient,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = this.getRequest(context);
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing authentication token');
    }

    let payload: TokenPayload;
    try {
      payload = await this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Set user on request
    request.user = payload;

    // Set PostgreSQL RLS context
    await this.setTenantContext(payload.tenantId);

    return true;
  }

  /**
   * Sets the PostgreSQL session variable for RLS.
   * Uses SET LOCAL to scope to the current transaction.
   */
  private async setTenantContext(tenantId: string): Promise<void> {
    // Sanitize tenantId to prevent SQL injection (UUIDs are safe, but extra caution)
    if (!/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(tenantId)) {
      throw new UnauthorizedException('Invalid tenant context');
    }

    await this.db.execute({
      sql: `SET LOCAL app.current_tenant_id = '${tenantId}'`,
    });
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
