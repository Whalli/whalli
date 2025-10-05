import { IsString, IsOptional, IsBoolean, IsEnum, IsInt, Min, IsUrl } from 'class-validator';
import { SubscriptionPlan } from '@prisma/client';

export class CreateCompanyDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateModelDto {
  @IsString()
  companyId: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  capabilities?: string[]; // Will be stored as JSON

  @IsOptional()
  @IsInt()
  @Min(0)
  contextWindow?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxOutput?: number;

  @IsOptional()
  @IsString()
  latencyHint?: string;

  @IsOptional()
  @IsString()
  costEstimate?: string;

  @IsOptional()
  @IsEnum(SubscriptionPlan)
  tierRequired?: SubscriptionPlan;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class UpdateModelDto {
  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  capabilities?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  contextWindow?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxOutput?: number;

  @IsOptional()
  @IsString()
  latencyHint?: string;

  @IsOptional()
  @IsString()
  costEstimate?: string;

  @IsOptional()
  @IsEnum(SubscriptionPlan)
  tierRequired?: SubscriptionPlan;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
