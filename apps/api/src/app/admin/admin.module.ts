import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { Tenant, TenantSchema } from '../../schemas/tenant.schema';
import { User, UserSchema } from '../../schemas/user.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Tenant.name, schema: TenantSchema }, { name: User.name, schema: UserSchema }])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
