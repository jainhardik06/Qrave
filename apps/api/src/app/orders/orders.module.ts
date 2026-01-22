import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersService } from './orders.service';
import { ConsumerService } from './consumer.service';
import { OrdersController } from './orders.controller';
import { PublicOrdersController } from './public-orders.controller';
import { Order, OrderSchema } from '../schemas/order.schema';
import { Consumer, ConsumerSchema } from '../../schemas/consumer.schema';
import { Tenant, TenantSchema } from '../../schemas/tenant.schema';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Consumer.name, schema: ConsumerSchema },
      { name: Tenant.name, schema: TenantSchema },
    ]),
    InventoryModule,
  ],
  controllers: [OrdersController, PublicOrdersController],
  providers: [OrdersService, ConsumerService],
  exports: [ConsumerService],
})
export class OrdersModule {}
