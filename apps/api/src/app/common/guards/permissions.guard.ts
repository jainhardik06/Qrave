import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const user = req.user || {};
    const userPerms: string[] = user.permissions || [];

    const hasAll = userPerms.includes('*') || required.every((p) => userPerms.includes(p));
    if (!hasAll) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}
