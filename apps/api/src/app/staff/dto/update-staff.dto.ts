import { IsOptional, IsString } from 'class-validator';

export class UpdateStaffDto {
  @IsString()
  @IsOptional()
  role?: string;
}
