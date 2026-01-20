import { Type } from 'class-transformer';
import { ArrayMinSize, IsIn, IsMongoId, IsNumber, IsOptional, IsPositive, IsString, Min, ValidateNested } from 'class-validator';
import { OrderStatus } from '../../schemas/order.schema';

const ORDER_STATUS_VALUES: OrderStatus[] = ['QUEUED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];

class OrderItemDto {
  @IsMongoId()
  dish_id!: string;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  quantity!: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price!: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateOrderDto {
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  @ArrayMinSize(1)
  items!: OrderItemDto[];

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  total_amount?: number;

  @IsIn(ORDER_STATUS_VALUES, { message: 'Invalid status' })
  @IsOptional()
  status?: OrderStatus;

  @IsString()
  @IsOptional()
  customer_name?: string;

  @IsString()
  @IsOptional()
  customer_phone?: string;

  @IsMongoId()
  @IsOptional()
  staff_id?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
