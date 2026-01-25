import { Type } from 'class-transformer';
import { ArrayMinSize, IsIn, IsMongoId, IsNumber, IsOptional, IsPositive, IsString, Min, ValidateNested } from 'class-validator';
import { OrderStatus } from '../../schemas/order.schema';

const ORDER_STATUS_VALUES: OrderStatus[] = ['QUEUED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];

class OrderItemToppingDto {
  @IsString()
  topping_id!: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  quantity?: number;
}

class OrderItemDto {
  @IsMongoId()
  dish_id!: string;

  @IsString()
  @IsOptional()
  variant_id?: string;

  @ValidateNested({ each: true })
  @Type(() => OrderItemToppingDto)
  @IsOptional()
  toppings?: OrderItemToppingDto[];

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

  @IsString()
  @IsOptional()
  customer_email?: string;

  @IsMongoId()
  @IsOptional()
  consumer_id?: string;

  @IsString()
  @IsOptional()
  order_type?: string;

  @IsOptional()
  delivery_address?: any;

  @IsMongoId()
  @IsOptional()
  staff_id?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
