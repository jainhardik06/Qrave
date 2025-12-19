import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from '../../schemas/user.schema';

@Injectable()
export class SuperAdminSeeder implements OnModuleInit {
  private readonly logger = new Logger(SuperAdminSeeder.name);

  constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {}

  async onModuleInit() {
    const email = process.env.SUPERADMIN_EMAIL;
    const password = process.env.SUPERADMIN_PASSWORD;
    if (!email || !password) {
      this.logger.log('SUPERADMIN_EMAIL/PASSWORD not set, skipping super admin seed');
      return;
    }

    const existing = await this.userModel.findOne({ email: email.toLowerCase() });
    if (existing) {
      this.logger.log('Super admin already exists, skipping seed');
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    await this.userModel.create({
      email: email.toLowerCase(),
      password_hash,
      role: 'SUPERADMIN',
      roles: ['SUPERADMIN'],
      tenant_id: null,
    } as any);

    this.logger.log('Super admin seeded');
  }
}
