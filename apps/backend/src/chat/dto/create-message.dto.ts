import { IsString, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateMessageDto {
  @IsEnum(['USER', 'ASSISTANT', 'SYSTEM'])
  @IsOptional()
  role?: 'USER' | 'ASSISTANT' | 'SYSTEM';

  @IsString()
  @IsNotEmpty()
  content: string;
}
