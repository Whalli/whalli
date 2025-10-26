import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PresetService } from './preset.service';
import { CreatePresetDto } from './dto/create-preset.dto';
import { UpdatePresetDto } from './dto/update-preset.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserSafe, Preset } from '@whalli/utils';

@Controller('presets')
@UseGuards(JwtAuthGuard)
export class PresetController {
  constructor(private readonly presetService: PresetService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: UserSafe,
    @Body() createPresetDto: CreatePresetDto,
  ): Promise<Preset> {
    return this.presetService.create(user.id, createPresetDto);
  }

  @Get()
  async findAll(@CurrentUser() user: UserSafe): Promise<Preset[]> {
    return this.presetService.findAll(user.id);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: UserSafe,
  ): Promise<Preset> {
    return this.presetService.findOne(id, user.id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser() user: UserSafe,
    @Body() updatePresetDto: UpdatePresetDto,
  ): Promise<Preset> {
    return this.presetService.update(id, user.id, updatePresetDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: UserSafe,
  ): Promise<void> {
    return this.presetService.remove(id, user.id);
  }
}
