import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateMindmapDto {
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @IsString()
  @IsNotEmpty()
  title: string;
}

export class CreateMindmapNodeDto {
  @IsString()
  @IsNotEmpty()
  mindmapId: string;

  @IsString()
  @IsNotEmpty()
  label: string;

  @IsNotEmpty()
  positionX: number;

  @IsNotEmpty()
  positionY: number;

  @IsOptional()
  metadata?: any;
}

export class CreateMindmapEdgeDto {
  @IsString()
  @IsNotEmpty()
  mindmapId: string;

  @IsString()
  @IsNotEmpty()
  sourceId: string;

  @IsString()
  @IsNotEmpty()
  targetId: string;

  @IsString()
  @IsOptional()
  label?: string;

  @IsOptional()
  metadata?: any;
}
