import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';

export enum IntervalType {
  CRON = 'cron',
  HOURS = 'hours',
}

export class CreateRecurringSearchDto {
  @IsString()
  @IsNotEmpty()
  query: string;

  @IsEnum(IntervalType)
  intervalType: IntervalType;

  @IsString()
  @IsNotEmpty()
  intervalValue: string; // cron expression or hours as string (e.g., "6")
}

export class UpdateRecurringSearchDto {
  @IsString()
  @IsOptional()
  query?: string;

  @IsEnum(IntervalType)
  @IsOptional()
  intervalType?: IntervalType;

  @IsString()
  @IsOptional()
  intervalValue?: string;

  @IsOptional()
  isActive?: boolean;
}
