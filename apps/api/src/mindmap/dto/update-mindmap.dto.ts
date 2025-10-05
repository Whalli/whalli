import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class UpdateMindmapDto {
  @IsString()
  @IsOptional()
  title?: string;
}

export class UpdateMindmapNodeDto {
  @IsString()
  @IsOptional()
  label?: string;

  @IsOptional()
  positionX?: number;

  @IsOptional()
  positionY?: number;

  @IsOptional()
  metadata?: any;
}

export class UpdateMindmapEdgeDto {
  @IsString()
  @IsOptional()
  label?: string;

  @IsOptional()
  metadata?: any;
}
