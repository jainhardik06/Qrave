import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from '../../schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { RequestContext } from '../../common/context/request-context';

@Injectable()
export class StaffService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {}

  async create(dto: CreateStaffDto) {
    const tenantId = RequestContext.getTenantId();
    if (!tenantId) throw new Error('Tenant context not found');

    const existing = await this.userModel.findOne({ email: dto.email.toLowerCase() });
    if (existing) throw new ConflictException('Email already in use');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    const staff = await this.userModel.create({
      email: dto.email.toLowerCase(),
      password_hash: hashedPassword,
      role: dto.role || 'STAFF',
      roles: [dto.role || 'STAFF'],
      tenant_id: new Types.ObjectId(tenantId as any),
    });

    return { _id: staff._id, email: staff.email, role: staff.role };
  }

  async findAll() {
    const tenantId = RequestContext.getTenantId();
    if (!tenantId) throw new Error('Tenant context not found');

    return this.userModel
      .find({ tenant_id: new Types.ObjectId(tenantId as any) })
      .select('_id email role roles tenant_id createdAt')
      .lean()
      .exec();
  }

  async findOne(id: string) {
    const tenantId = RequestContext.getTenantId();
    if (!tenantId) throw new Error('Tenant context not found');

    const staff = await this.userModel
      .findOne({ _id: id, tenant_id: new Types.ObjectId(tenantId as any) })
      .select('_id email role roles tenant_id createdAt')
      .lean()
      .exec();

    if (!staff) throw new NotFoundException('Staff member not found');
    return staff;
  }

  async update(id: string, dto: UpdateStaffDto) {
    const tenantId = RequestContext.getTenantId();
    if (!tenantId) throw new Error('Tenant context not found');

    const updated = await this.userModel
      .findOneAndUpdate(
        { _id: id, tenant_id: new Types.ObjectId(tenantId as any) },
        { role: dto.role, roles: dto.role ? [dto.role] : undefined },
        { new: true, runValidators: true }
      )
      .select('_id email role roles tenant_id')
      .lean()
      .exec();

    if (!updated) throw new NotFoundException('Staff member not found');
    return updated;
  }

  async resetPassword(id: string, newPassword: string) {
    const tenantId = RequestContext.getTenantId();
    if (!tenantId) throw new Error('Tenant context not found');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const updated = await this.userModel
      .findOneAndUpdate(
        { _id: id, tenant_id: new Types.ObjectId(tenantId as any) },
        { password_hash: hashedPassword },
        { new: true, runValidators: true }
      )
      .select('_id email role')
      .lean()
      .exec();

    if (!updated) throw new NotFoundException('Staff member not found');
    return updated;
  }
}
