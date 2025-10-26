import { IsString, IsEnum, IsNotEmpty } from 'class-validator';

export class CreateMessageDto {
  @IsEnum(['USER', 'ASSISTANT', 'SYSTEM'])
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';

  @IsString()
  @IsNotEmpty()
  content: string;
}
