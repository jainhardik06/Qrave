import {
  IsString,
  IsNumber,
  IsNotEmpty,
  Min,
  IsOptional,
  IsBoolean,
  ValidateNested,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';

class RecipeItemDto {
  @IsMongoId()
  inventory_item_id!: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  quantity!: number;
}

export class CreateDishDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price!: number;

  @IsString()
  @IsNotEmpty()
  category!: string;

  @IsString()
  @IsOptional()
  image_url?: string;

  @IsBoolean()
  @IsOptional()
  is_available?: boolean;

  @ValidateNested({ each: true })
  @Type(() => RecipeItemDto)
  @IsOptional()
  recipe?: RecipeItemDto[];
}
