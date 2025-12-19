import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MenuService } from './menu.service';
import { MenuController } from './menu.controller';
import { Dish, DishSchema } from '../schemas/dish.schema';
import { Tenant, TenantSchema } from '../../schemas/tenant.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Dish.name, schema: DishSchema },
      { name: Tenant.name, schema: TenantSchema },
    ]),
  ],
  controllers: [MenuController],
  providers: [MenuService],
})
export class MenuModule {}
