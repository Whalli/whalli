import { IsString, MinLength, MaxLength } from 'class-validator';

export class CreatePresetDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsString()
  color: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  systemInstruction: string;
}
