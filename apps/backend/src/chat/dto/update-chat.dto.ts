import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class UpdateChatDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  model?: string;
}
