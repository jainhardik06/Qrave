import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateStaffDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsString()
  @IsOptional()
  role?: string; // 'STAFF' or 'OWNER'
}
