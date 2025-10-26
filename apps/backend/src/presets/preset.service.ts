import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePresetDto } from './dto/create-preset.dto';
import { UpdatePresetDto } from './dto/update-preset.dto';
import { Preset } from '@whalli/utils';

@Injectable()
export class PresetService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, createPresetDto: CreatePresetDto): Promise<Preset> {
    const preset = await this.prisma.preset.create({
      data: {
        ...createPresetDto,
        userId,
      },
    });

    return this.mapPresetToDto(preset);
  }

  async findAll(userId: string): Promise<Preset[]> {
    const presets = await this.prisma.preset.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return presets.map((preset) => this.mapPresetToDto(preset));
  }

  async findOne(presetId: string, userId: string): Promise<Preset> {
    const preset = await this.prisma.preset.findUnique({
      where: { id: presetId },
    });

    if (!preset) {
      throw new NotFoundException('Preset not found');
    }

    if (preset.userId !== userId) {
      throw new ForbiddenException('You do not have access to this preset');
    }

    return this.mapPresetToDto(preset);
  }

  async update(
    presetId: string,
    userId: string,
    updatePresetDto: UpdatePresetDto,
  ): Promise<Preset> {
    const preset = await this.prisma.preset.findUnique({
      where: { id: presetId },
    });

    if (!preset) {
      throw new NotFoundException('Preset not found');
    }

    if (preset.userId !== userId) {
      throw new ForbiddenException('You do not have access to this preset');
    }

    const updatedPreset = await this.prisma.preset.update({
      where: { id: presetId },
      data: updatePresetDto,
    });

    return this.mapPresetToDto(updatedPreset);
  }

  async remove(presetId: string, userId: string): Promise<void> {
    const preset = await this.prisma.preset.findUnique({
      where: { id: presetId },
    });

    if (!preset) {
      throw new NotFoundException('Preset not found');
    }

    if (preset.userId !== userId) {
      throw new ForbiddenException('You do not have access to this preset');
    }

    await this.prisma.preset.delete({
      where: { id: presetId },
    });
  }

  private mapPresetToDto(preset: any): Preset {
    return {
      id: preset.id,
      name: preset.name,
      color: preset.color,
      systemInstruction: preset.systemInstruction,
      userId: preset.userId,
      createdAt: preset.createdAt,
      updatedAt: preset.updatedAt,
    };
  }
}
