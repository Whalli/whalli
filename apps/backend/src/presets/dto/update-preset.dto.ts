import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class UpdatePresetDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  systemInstruction?: string;
}
