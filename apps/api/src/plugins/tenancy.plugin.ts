import {
  CallbackWithoutResultAndOptionalError,
  HydratedDocument,
  Query,
  Schema,
  Types,
} from 'mongoose';
import { RequestContext } from '../common/context/request-context';

// Mongoose plugin to enforce tenant scoping on queries and writes.
export function tenancyPlugin(schema: Schema) {
  const shouldSkip = (schema as any).get?.('skipTenantPlugin');
  if (shouldSkip) {
    return;
  }

  // Add tenant_id field if schema does not already define it.
  if (!schema.path('tenant_id')) {
    schema.add({
      tenant_id: { type: Types.ObjectId, required: true, ref: 'Tenant' },
    });
  }

  // Attach tenant filter to query operations.
  const tenantGuard = function (this: Query<unknown, unknown>, next: CallbackWithoutResultAndOptionalError) {
    const tenantId = RequestContext.getTenantId();
    const normalizedTenantId = typeof tenantId === 'string' ? new Types.ObjectId(tenantId) : tenantId;
    if (normalizedTenantId) {
      this.where({ tenant_id: normalizedTenantId });
    }
    next();
  };

  schema.pre(['find', 'findOne', 'findOneAndUpdate', 'updateMany', 'count', 'countDocuments'], tenantGuard);

  const assignTenant = function (this: HydratedDocument<{ tenant_id?: Types.ObjectId }>, next: CallbackWithoutResultAndOptionalError) {
    const tenantId = RequestContext.getTenantId();
    const normalizedTenantId = typeof tenantId === 'string' ? new Types.ObjectId(tenantId) : tenantId;
    if (normalizedTenantId) {
      this.tenant_id = this.tenant_id || normalizedTenantId;
    }
    next();
  };

  schema.pre('validate', assignTenant);
  schema.pre('save', assignTenant);
}
