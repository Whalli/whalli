import { Module } from '@nestjs/common';
import { PresetService } from './preset.service';
import { PresetController } from './preset.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PresetController],
  providers: [PresetService],
  exports: [PresetService],
})
export class PresetModule {}
