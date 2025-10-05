import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as Minio from 'minio';
import { randomBytes } from 'crypto';
import { extname } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';
import FormData from 'form-data';

/**
 * VoiceService - Handles voice/audio operations
 * - Upload audio files to MinIO
 * - Enqueue transcription jobs
 * - Text-to-speech conversion
 */
@Injectable()
export class VoiceService {
  private readonly logger = new Logger(VoiceService.name);
  private minioClient: Minio.Client;
  private bucketName: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    @InjectQueue('voice-transcription') private transcriptionQueue: Queue,
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
   * Ensure MinIO bucket exists
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
      this.logger.error('Error ensuring bucket exists:', error);
    }
  }

  /**
   * Generate unique filename for audio files
   */
  private generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now();
    const randomString = randomBytes(8).toString('hex');
    const extension = extname(originalName);
    const nameWithoutExt = originalName
      .replace(extension, '')
      .replace(/[^a-zA-Z0-9]/g, '_');
    
    return `voice/${timestamp}-${randomString}-${nameWithoutExt}${extension}`;
  }

  /**
   * Upload audio file to MinIO and enqueue transcription job
   */
  async uploadAudio(data: {
    file: Express.Multer.File;
    userId: string;
    projectId?: string;
    taskId?: string;
  }) {
    this.logger.log(`Uploading audio for user ${data.userId}`);

    try {
      // Generate unique filename
      const uniqueFilename = this.generateUniqueFilename(data.file.originalname);

      // Upload to MinIO
      await this.minioClient.putObject(
        this.bucketName,
        uniqueFilename,
        data.file.buffer,
        data.file.size,
        {
          'Content-Type': data.file.mimetype,
          'X-Uploaded-By': data.userId,
        },
      );

      // Generate public URL
      const minioEndpoint = this.configService.get<string>('MINIO_ENDPOINT') || 'localhost';
      const minioPort = this.configService.get<string>('MINIO_PORT') || '9000';
      const useSSL = this.configService.get<string>('MINIO_USE_SSL') === 'true';
      const protocol = useSSL ? 'https' : 'http';
      
      const audioUrl = `${protocol}://${minioEndpoint}:${minioPort}/${this.bucketName}/${uniqueFilename}`;

      // Create attachment record (pending transcription)
      const attachment = await this.prisma.attachment.create({
        data: {
          messageId: null as any, // Will be linked after transcription
          url: audioUrl,
          type: 'audio',
          metadata: {
            originalName: data.file.originalname,
            filename: uniqueFilename,
            mimetype: data.file.mimetype,
            size: data.file.size,
            uploadedBy: data.userId,
            uploadedAt: new Date().toISOString(),
            transcriptionStatus: 'pending',
          },
        },
      });

      // Enqueue transcription job
      await this.transcriptionQueue.add('transcribe-audio', {
        attachmentId: attachment.id,
        audioUrl,
        userId: data.userId,
        projectId: data.projectId,
        taskId: data.taskId,
        filename: uniqueFilename,
      });

      this.logger.log(`Audio uploaded and transcription job enqueued: ${attachment.id}`);

      return {
        attachmentId: attachment.id,
        audioUrl,
        status: 'pending',
        message: 'Audio uploaded successfully. Transcription in progress.',
      };
    } catch (error) {
      this.logger.error('Error uploading audio:', error);
      throw new InternalServerErrorException('Failed to upload audio');
    }
  }

  /**
   * Transcribe audio using Whisper API (stub implementation)
   */
  async transcribeAudio(audioUrl: string): Promise<string> {
    this.logger.log(`Transcribing audio: ${audioUrl}`);

    try {
      // STUB: In production, call actual Whisper API
      // Example with OpenAI Whisper API:
      /*
      const response = await axios.post(
        'https://api.openai.com/v1/audio/transcriptions',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${this.configService.get('OPENAI_API_KEY')}`,
            ...formData.getHeaders(),
          },
        }
      );
      return response.data.text;
      */

      // For now, return a stub transcription
      await this.delay(2000); // Simulate API delay
      
      const stubTranscriptions = [
        'Hello, this is a test transcription of the audio file.',
        'Can you help me create a new task for the project?',
        'I need to schedule a meeting for next week.',
        'Please review the document I sent earlier.',
        'The deadline for this task is approaching.',
      ];

      const randomTranscription = stubTranscriptions[
        Math.floor(Math.random() * stubTranscriptions.length)
      ];

      this.logger.log(`Transcription complete: ${randomTranscription.substring(0, 50)}...`);
      return randomTranscription;
    } catch (error) {
      this.logger.error('Error transcribing audio:', error);
      throw new Error('Failed to transcribe audio');
    }
  }

  /**
   * Get transcription status and result
   */
  async getTranscriptionStatus(attachmentId: string, userId: string) {
    const attachment = await this.prisma.attachment.findFirst({
      where: {
        id: attachmentId,
      },
      include: {
        message: {
          select: {
            id: true,
            content: true,
            userId: true,
          },
        },
      },
    });

    if (!attachment) {
      throw new NotFoundException('Audio attachment not found');
    }

    // Check if user has access
    if (attachment.message?.userId !== userId) {
      throw new NotFoundException('Audio attachment not found or access denied');
    }

    const metadata = attachment.metadata as any;

    return {
      attachmentId: attachment.id,
      audioUrl: attachment.url,
      status: metadata.transcriptionStatus || 'unknown',
      transcript: metadata.transcript || null,
      messageId: attachment.message?.id || null,
      error: metadata.transcriptionError || null,
    };
  }

  /**
   * Convert text to speech using TTS API (stub implementation)
   */
  async textToSpeech(data: {
    text: string;
    userId: string;
    voice?: string;
  }): Promise<{ audioUrl: string; filename: string }> {
    this.logger.log(`Converting text to speech for user ${data.userId}`);

    try {
      // STUB: In production, call actual TTS API
      // Example with OpenAI TTS API:
      /*
      const response = await axios.post(
        'https://api.openai.com/v1/audio/speech',
        {
          model: 'tts-1',
          voice: data.voice || 'alloy',
          input: data.text,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.configService.get('OPENAI_API_KEY')}`,
          },
          responseType: 'arraybuffer',
        }
      );

      const audioBuffer = Buffer.from(response.data);
      */

      // For now, create a stub audio file reference
      await this.delay(1000); // Simulate API delay

      const filename = this.generateUniqueFilename(`tts-${Date.now()}.mp3`);
      
      // In production, upload the actual audio buffer
      // await this.minioClient.putObject(this.bucketName, filename, audioBuffer, audioBuffer.length, {
      //   'Content-Type': 'audio/mpeg',
      // });

      const minioEndpoint = this.configService.get<string>('MINIO_ENDPOINT') || 'localhost';
      const minioPort = this.configService.get<string>('MINIO_PORT') || '9000';
      const useSSL = this.configService.get<string>('MINIO_USE_SSL') === 'true';
      const protocol = useSSL ? 'https' : 'http';
      
      const audioUrl = `${protocol}://${minioEndpoint}:${minioPort}/${this.bucketName}/${filename}`;

      this.logger.log(`TTS conversion complete: ${audioUrl}`);

      return {
        audioUrl,
        filename,
      };
    } catch (error) {
      this.logger.error('Error converting text to speech:', error);
      throw new InternalServerErrorException('Failed to convert text to speech');
    }
  }

  /**
   * Helper: delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
