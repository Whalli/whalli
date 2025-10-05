import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { randomBytes } from 'crypto';
import { extname } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import * as pdfParse from 'pdf-parse';
import { createWorker } from 'tesseract.js';

// Import pdf-parse properly
const PDF_PARSE = require('pdf-parse');

@Injectable()
export class FilesService {
  private minioClient: Minio.Client;
  private bucketName: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    // Initialize MinIO client
    this.minioClient = new Minio.Client({
      endPoint: this.configService.get<string>('MINIO_ENDPOINT') || 'localhost',
      port: parseInt(this.configService.get<string>('MINIO_PORT') || '9000'),
      useSSL: this.configService.get<string>('MINIO_USE_SSL') === 'true',
      accessKey: this.configService.get<string>('MINIO_ACCESS_KEY') || 'minioadmin',
      secretKey: this.configService.get<string>('MINIO_SECRET_KEY') || 'minioadmin',
    });

    this.bucketName = this.configService.get<string>('MINIO_BUCKET_NAME') || 'whalli-uploads';

    // Ensure bucket exists
    this.ensureBucketExists();
  }

  /**
   * Ensure MinIO bucket exists, create if not
   */
  private async ensureBucketExists() {
    try {
      const exists = await this.minioClient.bucketExists(this.bucketName);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
        
        // Set bucket policy to allow public read
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${this.bucketName}/*`],
            },
          ],
        };
        await this.minioClient.setBucketPolicy(
          this.bucketName,
          JSON.stringify(policy),
        );
      }
    } catch (error) {
      console.error('Error ensuring bucket exists:', error);
    }
  }

  /**
   * Generate unique filename with timestamp and random string
   */
  private generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now();
    const randomString = randomBytes(8).toString('hex');
    const extension = extname(originalName);
    const nameWithoutExt = originalName.replace(extension, '').replace(/[^a-zA-Z0-9]/g, '_');
    
    return `${timestamp}-${randomString}-${nameWithoutExt}${extension}`;
  }

  /**
   * Get file type from mimetype
   */
  private getFileType(mimetype: string): string {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype === 'application/pdf') return 'pdf';
    return 'file';
  }

  /**
   * Extract text from PDF file using pdf-parse
   */
  private async extractTextFromPDF(buffer: Buffer): Promise<string | null> {
    try {
      const data = await PDF_PARSE(buffer);
      return data.text.trim() || null;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      return null;
    }
  }

  /**
   * Extract text from image using Tesseract OCR
   */
  private async extractTextFromImage(buffer: Buffer): Promise<string | null> {
    let worker = null;
    try {
      worker = await createWorker('eng');
      const { data } = await worker.recognize(buffer);
      await worker.terminate();
      return data.text.trim() || null;
    } catch (error) {
      console.error('Error extracting text from image:', error);
      if (worker) {
        try {
          await worker.terminate();
        } catch (terminateError) {
          console.error('Error terminating Tesseract worker:', terminateError);
        }
      }
      return null;
    }
  }

  /**
   * Extract text from file based on type (PDF or image)
   */
  private async extractTextFromFile(
    buffer: Buffer,
    mimetype: string,
  ): Promise<string | null> {
    if (mimetype === 'application/pdf') {
      return this.extractTextFromPDF(buffer);
    } else if (mimetype.startsWith('image/')) {
      return this.extractTextFromImage(buffer);
    }
    return null;
  }

  /**
   * Upload file to MinIO and save to database
   */
  async uploadFile(
    file: Express.Multer.File,
    userId: string,
    messageId?: string,
  ): Promise<{
    id: string;
    url: string;
    type: string;
    filename: string;
    size: number;
    mimetype: string;
  }> {
    try {
      // Generate unique filename
      const uniqueFilename = this.generateUniqueFilename(file.originalname);

      // Upload to MinIO
      await this.minioClient.putObject(
        this.bucketName,
        uniqueFilename,
        file.buffer,
        file.size,
        {
          'Content-Type': file.mimetype,
          'X-Uploaded-By': userId,
        },
      );

      // Generate public URL
      const minioEndpoint = this.configService.get<string>('MINIO_ENDPOINT') || 'localhost';
      const minioPort = this.configService.get<string>('MINIO_PORT') || '9000';
      const useSSL = this.configService.get<string>('MINIO_USE_SSL') === 'true';
      const protocol = useSSL ? 'https' : 'http';
      
      const publicUrl = `${protocol}://${minioEndpoint}:${minioPort}/${this.bucketName}/${uniqueFilename}`;

      // Extract text from file (PDF or image)
      const extractedText = await this.extractTextFromFile(file.buffer, file.mimetype);

      // Save to database if messageId provided
      let attachment = null;
      if (messageId) {
        // Verify message exists and user has access
        const message = await this.prisma.message.findFirst({
          where: {
            id: messageId,
            project: {
              OR: [
                { ownerId: userId },
                { members: { some: { userId: userId } } },
              ],
            },
          },
        });

        if (!message) {
          throw new NotFoundException('Message not found or access denied');
        }

        // Create attachment record
        attachment = await this.prisma.attachment.create({
          data: {
            messageId: messageId,
            url: publicUrl,
            type: this.getFileType(file.mimetype),
            metadata: {
              originalName: file.originalname,
              filename: uniqueFilename,
              mimetype: file.mimetype,
              size: file.size,
              uploadedBy: userId,
              uploadedAt: new Date().toISOString(),
              extractedText: extractedText,
              hasExtractedText: !!extractedText,
            },
          },
        });
      }

      return {
        id: attachment?.id || uniqueFilename,
        url: publicUrl,
        type: this.getFileType(file.mimetype),
        filename: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Failed to upload file');
    }
  }

  /**
   * Delete file from MinIO and database
   */
  async deleteFile(attachmentId: string, userId: string): Promise<void> {
    try {
      // Get attachment from database
      const attachment = await this.prisma.attachment.findFirst({
        where: {
          id: attachmentId,
          message: {
            project: {
              OR: [
                { ownerId: userId },
                { members: { some: { userId: userId } } },
              ],
            },
          },
        },
      });

      if (!attachment) {
        throw new NotFoundException('Attachment not found or access denied');
      }

      // Extract filename from URL
      const filename = attachment.metadata['filename'] as string;

      if (filename) {
        // Delete from MinIO
        await this.minioClient.removeObject(this.bucketName, filename);
      }

      // Delete from database
      await this.prisma.attachment.delete({
        where: { id: attachmentId },
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Failed to delete file');
    }
  }

  /**
   * Get attachment metadata
   */
  async getAttachment(attachmentId: string, userId: string) {
    const attachment = await this.prisma.attachment.findFirst({
      where: {
        id: attachmentId,
        message: {
          project: {
            OR: [
              { ownerId: userId },
              { members: { some: { userId: userId } } },
            ],
          },
        },
      },
      include: {
        message: {
          select: {
            id: true,
            projectId: true,
            userId: true,
          },
        },
      },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found or access denied');
    }

    return attachment;
  }
}
