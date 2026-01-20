import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { FeatureFlagGuard } from '../common/guards/feature-flag.guard';
import { Permissions } from '../common/permissions.decorator';
import { FeatureFlag } from '../common/decorators/feature-flag.decorator';

@Controller('orders')
@UseGuards(JwtAuthGuard, PermissionsGuard, FeatureFlagGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Permissions('orders.write')
  @FeatureFlag('order_processing')
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @Get()
  @Permissions('orders.read')
  @FeatureFlag('order_processing')
  findAll(@Query('status') status?: string) {
    return this.ordersService.findAll(status);
  }

  @Get(':id')
  @Permissions('orders.read')
  @FeatureFlag('order_processing')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id')
  @Permissions('orders.write')
  @FeatureFlag('order_processing')
  update(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    return this.ordersService.update(id, dto);
  }
}
