import { IsEnum, IsUrl } from 'class-validator';
import { SubscriptionPlan } from '@prisma/client';

export class CreateCheckoutDto {
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;

  @IsUrl()
  successUrl: string;

  @IsUrl()
  cancelUrl: string;
}
