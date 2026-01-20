import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { Order, OrderSchema } from '../schemas/order.schema';
import { Tenant, TenantSchema } from '../../schemas/tenant.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }, { name: Tenant.name, schema: TenantSchema }])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
