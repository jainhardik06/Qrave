import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsObject } from 'class-validator';

export class CreateTenantOwnerDto {
  @IsString()
  @IsNotEmpty()
  businessName!: string;

  @IsString()
  @IsNotEmpty()
  subdomain!: string;

  @IsEmail()
  ownerEmail!: string;

  @IsString()
  @MinLength(8)
  ownerPassword!: string;

  @IsOptional()
  @IsString()
  subscription_status?: 'TRIAL' | 'ACTIVE';

  @IsOptional()
  @IsObject()
  features?: Record<string, boolean>;
}
