import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard, CurrentUser } from '../auth/auth.guard';
import { FilesService } from './files.service';

/**
 * FilesController - Handles file uploads to MinIO
 * Protected by AuthGuard
 */
@Controller('api/files')
@UseGuards(AuthGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  /**
   * POST /api/files/upload
   * Upload a file and optionally attach to a message
   * 
   * Accepts multipart/form-data with:
   * - file: The file to upload (required)
   * - messageId: ID of message to attach to (optional)
   * 
   * Validation:
   * - Max size: 10MB
   * - Allowed types: pdf, png, jpg, jpeg
   */
  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('messageId') messageId: string | undefined,
    @CurrentUser() user: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`,
      );
    }

    // Validate file type
    const allowedMimeTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Allowed types: pdf, png, jpg, jpeg',
      );
    }

    // Upload to MinIO and save to database
    const result = await this.filesService.uploadFile(
      file,
      user.id,
      messageId,
    );

    return result;
  }

  /**
   * POST /api/files/upload-multiple
   * Upload multiple files at once
   * 
   * Accepts multipart/form-data with:
   * - files: Array of files (max 5)
   * - messageId: ID of message to attach to (optional)
   */
  @Post('upload-multiple')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('files'))
  async uploadMultipleFiles(
    @UploadedFile() files: Express.Multer.File[],
    @Body('messageId') messageId: string | undefined,
    @CurrentUser() user: any,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    if (files.length > 5) {
      throw new BadRequestException('Maximum 5 files allowed per upload');
    }

    const results = await Promise.all(
      files.map((file) => this.filesService.uploadFile(file, user.id, messageId)),
    );

    return {
      uploaded: results.length,
      files: results,
    };
  }
}
