import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FEATURE_FLAG_KEY } from '../decorators/feature-flag.decorator';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tenant } from '../../../schemas/tenant.schema';
import { RequestContext } from '../../../common/context/request-context';

@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectModel(Tenant.name) private readonly tenantModel: Model<Tenant>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const flag = this.reflector.getAllAndOverride<string>(FEATURE_FLAG_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!flag) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user || {};
    if (user.role === 'SUPERADMIN') return true;

    const tenantId = RequestContext.getTenantId();
    if (!tenantId) return false;

    const tenant = await this.tenantModel.findById(tenantId).lean().exec();
    if (!tenant) return false;

    const features = (tenant as any).features || {};
    // Only block when explicitly disabled; undefined defaults to enabled.
    if (features[flag] === false) {
      throw new ForbiddenException('Feature not enabled');
    }
    return true;
  }
}
