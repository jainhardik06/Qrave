import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Tenant } from '../../schemas/tenant.schema';
import { User } from '../../schemas/user.schema';
import { CreateTenantOwnerDto } from './dto/create-tenant-owner.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Tenant.name) private readonly tenantModel: Model<Tenant>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async createTenantWithOwner(dto: CreateTenantOwnerDto) {
    const email = dto.ownerEmail.toLowerCase();
    const existing = await this.userModel.findOne({ email });
    if (existing) throw new ConflictException('Owner email already exists');

    const subdomain = dto.subdomain || dto.businessName.toLowerCase().replace(/\s+/g, '-');
    const tenant = await this.tenantModel.create({
      name: dto.businessName,
      subdomain,
      subscription_status: dto.subscription_status || 'TRIAL',
      features: dto.features || {
        menu_management: true,
        order_processing: true,
        staff_management: true,
        analytics: false,
        customer_database: false,
        payment_integration: false,
      },
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    });

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(dto.ownerPassword, salt);

    const owner = await this.userModel.create({
      email,
      password_hash,
      role: 'OWNER',
      roles: ['OWNER'],
      tenant_id: tenant._id,
    } as any);

    return {
      tenant: {
        id: tenant._id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        subscription_status: tenant.subscription_status,
        features: tenant.features,
        trial_ends_at: tenant.trial_ends_at,
      },
      owner: {
        id: (owner as any)._id,
        email: owner.email,
        role: owner.role,
      },
    };
  }

  async getAllTenants() {
    const tenants = await this.tenantModel.find().sort({ createdAt: -1 }).lean();
    const tenantsWithOwners = await Promise.all(
      tenants.map(async (tenant) => {
        const owner = await this.userModel.findOne({ tenant_id: tenant._id, role: 'OWNER' }).lean();
        const userCount = await this.userModel.countDocuments({ tenant_id: tenant._id });
        return {
          ...tenant,
          ownerEmail: owner?.email,
          userCount,
        };
      })
    );
    return tenantsWithOwners;
  }

  async getTenantById(id: string) {
    const tenant = await this.tenantModel.findById(id).lean();
    if (!tenant) return null;
    const users = await this.userModel.find({ tenant_id: id }).lean();
    return { ...tenant, users };
  }

  async updateTenantStatus(id: string, status: string) {
    return this.tenantModel.findByIdAndUpdate(id, { subscription_status: status }, { new: true });
  }

  async updateTenantFeatures(id: string, features: Record<string, boolean>) {
    return this.tenantModel.findByIdAndUpdate(id, { features }, { new: true });
  }

  async deleteTenant(id: string) {
    await this.userModel.deleteMany({ tenant_id: id });
    return this.tenantModel.findByIdAndDelete(id);
  }

  async getPlatformStats() {
    const totalTenants = await this.tenantModel.countDocuments();
    const activeTenants = await this.tenantModel.countDocuments({ subscription_status: 'ACTIVE' });
    const trialTenants = await this.tenantModel.countDocuments({ subscription_status: 'TRIAL' });
    const suspendedTenants = await this.tenantModel.countDocuments({ subscription_status: 'SUSPENDED' });
    const totalUsers = await this.userModel.countDocuments({ role: { $ne: 'SUPERADMIN' } });

    const tenants = await this.tenantModel.find().lean();
    const totalMRR = tenants.reduce((sum, t) => sum + (t.monthly_revenue || 0), 0);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const newTenantsThisMonth = await this.tenantModel.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

    return {
      totalTenants,
      activeTenants,
      trialTenants,
      suspendedTenants,
      totalUsers,
      totalMRR,
      newTenantsThisMonth,
    };
  }

  async getAllUsers() {
    return this.userModel.find({ role: { $ne: 'SUPERADMIN' } })
      .populate('tenant_id', 'name subdomain')
      .sort({ createdAt: -1 })
      .lean();
  }
}
