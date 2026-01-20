import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Category, CategorySchema } from '../../schemas/category.schema';
import { Dish, DishSchema } from '../../schemas/dish.schema';
import { Tenant, TenantSchema } from '../../schemas/tenant.schema';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { DishService } from './dish.service';
import { DishController } from './dish.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Category.name, schema: CategorySchema },
      { name: Dish.name, schema: DishSchema },
      { name: Tenant.name, schema: TenantSchema },
    ]),
  ],
  providers: [CategoryService, DishService],
  controllers: [CategoryController, DishController],
})
export class MenuModule {}
