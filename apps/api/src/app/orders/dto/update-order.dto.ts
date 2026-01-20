import { PartialType } from '@nestjs/mapped-types';
import { CreateOrderDto } from './create-order.dto';
import { IsIn, IsMongoId, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from '../../schemas/order.schema';

const ORDER_STATUS_VALUES: OrderStatus[] = ['QUEUED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
  @IsIn(ORDER_STATUS_VALUES, { message: 'Invalid status' })
  @IsOptional()
  status?: OrderStatus;

  @IsMongoId()
  @IsOptional()
  staff_id?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
