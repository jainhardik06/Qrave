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

    const subdomain = dto.businessName.toLowerCase().replace(/\s+/g, '-');
    const tenant = await this.tenantModel.create({
      name: dto.businessName,
      subdomain,
      subscription_status: dto.subscription_status || 'ACTIVE',
      features: dto.features || {},
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
      },
      owner: {
        id: (owner as any)._id,
        email: owner.email,
        role: owner.role,
      },
    };
  }
}
