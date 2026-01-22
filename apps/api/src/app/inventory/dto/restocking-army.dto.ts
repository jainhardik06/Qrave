import { Types } from 'mongoose';
import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class RestockingItemDto {
  @IsString()
  item_id!: string;

  @IsNumber()
  @Min(0)
  quantity!: number;
}

export class CreateRestockingArmyDto {
  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RestockingItemDto)
  items!: RestockingItemDto[];

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateRestockingArmyDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RestockingItemDto)
  @IsOptional()
  items?: RestockingItemDto[];

  @IsOptional()
  is_active?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class ExecuteRestockingArmyDto {
  army_id!: string;
  user_id?: string;
  notes?: string;
}
