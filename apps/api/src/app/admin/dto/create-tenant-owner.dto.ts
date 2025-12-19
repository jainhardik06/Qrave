import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateTenantOwnerDto {
  @IsString()
  @IsNotEmpty()
  businessName!: string;

  @IsEmail()
  ownerEmail!: string;

  @IsString()
  @MinLength(6)
  ownerPassword!: string;

  @IsString()
  @IsOptional()
  subscription_status?: string;

  @IsOptional()
  features?: Record<string, boolean>;
}
