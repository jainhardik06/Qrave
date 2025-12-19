import { IsBoolean, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class UpdateRecipeItemDto {
  @IsMongoId()
  @IsOptional()
  inventory_item_id?: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  quantity?: number;
}

export class UpdateDishDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  price?: number;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  image_url?: string;

  @IsBoolean()
  @IsOptional()
  is_available?: boolean;

  @ValidateNested({ each: true })
  @Type(() => UpdateRecipeItemDto)
  @IsOptional()
  recipe?: UpdateRecipeItemDto[];
}
