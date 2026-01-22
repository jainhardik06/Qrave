import { IsString, IsNumber, IsOptional, Min, IsEnum } from 'class-validator';

export class CreateInventoryItemDto {
  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsString()
  unit!: string; // kg, liters, pieces, grams, etc.

  @IsNumber()
  @Min(0)
  cost_per_unit!: number;

  @IsNumber()
  @Min(0)
  current_quantity!: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  reorder_level?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  reorder_quantity?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  restocking_quantity?: number;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  supplier_id?: string;

  @IsString()
  @IsOptional()
  storage_location?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  image_url?: string;
}

export class UpdateInventoryItemDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  cost_per_unit?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  reorder_level?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  reorder_quantity?: number;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  supplier_id?: string;

  @IsString()
  @IsOptional()
  storage_location?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  image_url?: string;
}

export class AdjustInventoryDto {
  @IsNumber()
  quantity_change!: number; // Can be positive or negative

  @IsString()
  reason!: string; // 'manual_adjustment', 'damage', 'expiry', etc.

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  user_id?: string;
}