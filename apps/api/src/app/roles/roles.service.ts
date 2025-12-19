import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Role } from '../../schemas/role.schema';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RequestContext } from '../../common/context/request-context';

@Injectable()
export class RolesService {
  constructor(@InjectModel(Role.name) private readonly roleModel: Model<Role>) {}

  private resolveTenantId(overrideTenantId?: string | null) {
    const ctxTenant = RequestContext.getTenantId();
    const tenantId = overrideTenantId || ctxTenant;
    if (!tenantId) {
      throw new ForbiddenException('Tenant context required');
    }
    return new Types.ObjectId(tenantId);
  }

  async create(dto: CreateRoleDto, tenantIdOverride?: string | null) {
    const tenantId = this.resolveTenantId(tenantIdOverride);
    return this.roleModel.create({
      tenant_id: tenantId,
      name: dto.name,
      permissions: dto.permissions || [],
    });
  }

  async findAll(tenantIdOverride?: string | null) {
    const tenantId = this.resolveTenantId(tenantIdOverride);
    return this.roleModel.find({ tenant_id: tenantId }).exec();
  }

  async findOne(id: string, tenantIdOverride?: string | null) {
    const tenantId = this.resolveTenantId(tenantIdOverride);
    const role = await this.roleModel.findOne({ _id: id, tenant_id: tenantId }).exec();
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async update(id: string, dto: UpdateRoleDto, tenantIdOverride?: string | null) {
    const tenantId = this.resolveTenantId(tenantIdOverride);
    const updated = await this.roleModel
      .findOneAndUpdate({ _id: id, tenant_id: tenantId }, dto, { new: true, runValidators: true })
      .exec();
    if (!updated) throw new NotFoundException('Role not found');
    return updated;
  }

  async remove(id: string, tenantIdOverride?: string | null) {
    const tenantId = this.resolveTenantId(tenantIdOverride);
    const deleted = await this.roleModel.findOneAndDelete({ _id: id, tenant_id: tenantId }).exec();
    if (!deleted) throw new NotFoundException('Role not found');
    return deleted;
  }
}
