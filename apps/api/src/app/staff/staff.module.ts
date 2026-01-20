import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StaffService } from './staff.service';
import { StaffController } from './staff.controller';
import { User, UserSchema } from '../../schemas/user.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  controllers: [StaffController],
  providers: [StaffService],
})
export class StaffModule {}
