import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { DishService } from './dish.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Permissions } from '../common/permissions.decorator';

@Controller('dishes')
@UseGuards(JwtAuthGuard)
export class DishController {
  constructor(private readonly dishService: DishService) {}

  @Post()
  @Permissions('menu.write')
  async create(
    @Body()
    createDishDto: {
      category_ids: string[];
      name: string;
      description?: string;
      image_url?: string;
      base_price: number;
      variants?: any[];
      toppings?: any[];
      allergens?: string[];
      dietary_tags?: string[];
      preparation_time_minutes?: number;
      is_bestseller?: boolean;
      is_new?: boolean;
      is_available?: boolean;
      calories?: number;
      is_vegetarian?: boolean;
      is_vegan?: boolean;
    },
  ) {
    return this.dishService.create(createDishDto);
  }

  @Get()
  async findAll(
    @Query('categoryId') categoryId?: string,
    @Query('allergen') allergen?: string,
  ) {
    return this.dishService.findAll(categoryId, allergen);
  }

  @Get('category/:categoryId')
  async findByCategory(@Param('categoryId') categoryId: string) {
    return this.dishService.findByCategory(categoryId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.dishService.findOne(id);
  }

  @Patch(':id')
  @Permissions('menu.write')
  async update(
    @Param('id') id: string,
    @Body() updateDishDto: Partial<any>,
  ) {
    return this.dishService.update(id, updateDishDto);
  }

  @Delete(':id')
  @Permissions('menu.write')
  async delete(@Param('id') id: string) {
    await this.dishService.delete(id);
    return { message: 'Dish deleted successfully' };
  }
}
