import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateChatDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsString()
  model: string;

  @IsOptional()
  @IsString()
  presetId?: string;
}
