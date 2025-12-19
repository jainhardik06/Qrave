import { IsArray, IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class UpdateRoleDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissions?: string[];
}
