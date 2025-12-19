import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { MenuService } from './menu.service';
import { CreateDishDto } from './dto/create-dish.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateDishDto } from './dto/update-dish.dto';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/permissions.decorator';
import { FeatureFlagGuard } from '../common/guards/feature-flag.guard';
import { FeatureFlag } from '../common/decorators/feature-flag.decorator';

@Controller('menu')
@UseGuards(JwtAuthGuard, PermissionsGuard, FeatureFlagGuard)
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Post()
  @Permissions('menu.write')
  @FeatureFlag('menu')
  create(@Body() dto: CreateDishDto) {
    return this.menuService.create(dto);
  }

  @Get()
  @Permissions('menu.read')
  @FeatureFlag('menu')
  findAll() {
    return this.menuService.findAll();
  }

  @Delete(':id')
  @Permissions('menu.delete')
  @FeatureFlag('menu')
  delete(@Param('id') id: string) {
    return this.menuService.delete(id);
  }

  @Get(':id')
  @Permissions('menu.read')
  @FeatureFlag('menu')
  findOne(@Param('id') id: string) {
    return this.menuService.findOne(id);
  }

  @Patch(':id')
  @Permissions('menu.write')
  @FeatureFlag('menu')
  update(@Param('id') id: string, @Body() dto: UpdateDishDto) {
    return this.menuService.update(id, dto);
  }
}
