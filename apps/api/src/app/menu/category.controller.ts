import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Permissions } from '../common/permissions.decorator';

@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @Permissions('menu.write')
  async create(
    @Body()
    createCategoryDto: {
      name: string;
      description?: string;
      icon?: string;
      color?: string;
    },
  ) {
    return this.categoryService.create(createCategoryDto);
  }

  @Get()
  async findAll() {
    return this.categoryService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.categoryService.findOne(id);
  }

  @Patch(':id')
  @Permissions('menu.write')
  async update(
    @Param('id') id: string,
    @Body()
    updateCategoryDto: {
      name?: string;
      description?: string;
      icon?: string;
      color?: string;
      order?: number;
      is_active?: boolean;
    },
  ) {
    return this.categoryService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @Permissions('menu.write')
  async delete(@Param('id') id: string) {
    await this.categoryService.delete(id);
    return { message: 'Category deleted successfully' };
  }

  @Post('reorder')
  @Permissions('menu.write')
  async reorder(
    @Body() reorderData: Array<{ id: string; order: number }>,
  ) {
    await this.categoryService.reorder(reorderData);
    return { message: 'Categories reordered successfully' };
  }
}
