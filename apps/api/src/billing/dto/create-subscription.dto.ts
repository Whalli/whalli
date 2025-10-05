import { IsEnum, IsOptional, IsInt, Min, Max } from 'class-validator';
import { SubscriptionPlan } from '@prisma/client';

export class CreateSubscriptionDto {
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(90)
  trialPeriodDays?: number;
}
