import {
  Controller,
  Post,
  Get,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Param,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { VoiceService } from './voice.service';

/**
 * VoiceController - Handles voice/audio operations
 * Protected by AuthGuard
 */
@Controller('api/voice')
@UseGuards(JwtAuthGuard)
export class VoiceController {
  constructor(private readonly voiceService: VoiceService) {}

  /**
   * POST /api/voice/upload
   * Upload audio file for transcription
   * 
   * Accepts multipart/form-data with:
   * - file: Audio file (required)
   * - projectId: ID of project to link message to (optional)
   * - taskId: ID of task to link message to (optional)
   * 
   * Validation:
   * - Max size: 25MB
   * - Allowed types: mp3, wav, m4a, ogg, webm
   */
  @Post('upload')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseInterceptors(FileInterceptor('file'))
  async uploadAudio(
    @UploadedFile() file: Express.Multer.File,
    @Body('projectId') projectId: string | undefined,
    @Body('taskId') taskId: string | undefined,
    @CurrentUser() user: any,
  ) {
    if (!file) {
      throw new BadRequestException('No audio file provided');
    }

    // Validate file size (25MB)
    const maxSize = 25 * 1024 * 1024; // 25MB in bytes
    if (file.size > maxSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`,
      );
    }

    // Validate file type
    const allowedMimeTypes = [
      'audio/mpeg', // mp3
      'audio/wav', // wav
      'audio/x-wav', // wav
      'audio/mp4', // m4a
      'audio/x-m4a', // m4a
      'audio/ogg', // ogg
      'audio/webm', // webm
    ];
    
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Allowed types: mp3, wav, m4a, ogg, webm',
      );
    }

    // Upload and enqueue transcription
    const result = await this.voiceService.uploadAudio({
      file,
      userId: user.id,
      projectId,
      taskId,
    });

    return result;
  }

  /**
   * GET /api/voice/transcription/:attachmentId
   * Get transcription status and result
   */
  @Get('transcription/:attachmentId')
  async getTranscription(
    @Param('attachmentId') attachmentId: string,
    @CurrentUser() user: any,
  ) {
    return this.voiceService.getTranscriptionStatus(attachmentId, user.id);
  }

  /**
   * POST /api/voice/tts
   * Convert text to speech
   * 
   * Body:
   * - text: Text to convert (required)
   * - voice: Voice to use (optional, e.g., 'alloy', 'echo', 'fable')
   */
  @Post('tts')
  @HttpCode(HttpStatus.OK)
  async textToSpeech(
    @Body('text') text: string,
    @Body('voice') voice: string | undefined,
    @CurrentUser() user: any,
  ) {
    if (!text || text.trim().length === 0) {
      throw new BadRequestException('Text is required');
    }

    if (text.length > 4000) {
      throw new BadRequestException('Text must be less than 4000 characters');
    }

    const result = await this.voiceService.textToSpeech({
      text: text.trim(),
      userId: user.id,
      voice,
    });

    return {
      audioUrl: result.audioUrl,
      filename: result.filename,
      message: 'Text converted to speech successfully',
    };
  }
}
