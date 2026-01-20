import { Injectable, NestMiddleware } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';
import { RequestContext } from '../common/context/request-context';

@Injectable()
export class TenancyMiddleware implements NestMiddleware {
  private readonly jwt = new JwtService({
    secret: process.env.JWT_SECRET || 'dev-secret',
  });

  use(req: Request, res: Response, next: NextFunction) {
    // Extract JWT payload first
    const payload = this.extractJwtPayload(req);
    const tenantId = payload?.tenant_id || payload?.tenantId;
    
    if (tenantId) {
      console.log('TenancyMiddleware - Setting tenant_id:', tenantId);
    } else {
      console.warn('TenancyMiddleware - No tenant_id found in token');
    }

    // Wrap the entire request handling in RequestContext.run()
    RequestContext.run(() => {
      if (payload) {
        RequestContext.set({
          tenantId,
          userId: payload.sub,
          email: payload.email,
          roles: payload.roles,
          token: this.getToken(req),
        });
      }
      next();
    });
  }

  private extractJwtPayload(req: Request): any | null {
    const token = this.getToken(req);
    if (!token) return null;

    try {
      return this.jwt.verify(token, { ignoreExpiration: false });
    } catch (error) {
      // Invalid tokens should not block the request; just proceed without context.
      return null;
    }
  }

  private getToken(req: Request): string | undefined {
    const header = req.headers['authorization'];
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.substring('Bearer '.length);
    }

    const cookieToken = req.cookies?.['qrave_token'];
    if (cookieToken && typeof cookieToken === 'string') {
      return cookieToken;
    }

    return undefined;
  }
}
