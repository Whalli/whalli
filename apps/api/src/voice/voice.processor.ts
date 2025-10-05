import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { VoiceService } from './voice.service';

/**
 * Voice Transcription Worker
 * Processes audio transcription jobs from the queue
 */
@Processor('voice-transcription')
export class VoiceTranscriptionProcessor extends WorkerHost {
  private readonly logger = new Logger(VoiceTranscriptionProcessor.name);

  constructor(
    private prisma: PrismaService,
    private voiceService: VoiceService,
  ) {
    super();
  }

  /**
   * Process transcription job
   */
  async process(job: Job<any, any, string>): Promise<any> {
    const { attachmentId, audioUrl, userId, projectId, taskId } = job.data;

    this.logger.log(`Processing transcription job ${job.id} for attachment ${attachmentId}`);

    try {
      // Update attachment status to processing
      await this.prisma.attachment.update({
        where: { id: attachmentId },
        data: {
          metadata: {
            ...(await this.getAttachmentMetadata(attachmentId)),
            transcriptionStatus: 'processing',
          },
        },
      });

      // Transcribe audio
      const transcript = await this.voiceService.transcribeAudio(audioUrl);

      this.logger.log(`Transcription complete for attachment ${attachmentId}`);

      // Create message with transcript
      const message = await this.prisma.message.create({
        data: {
          userId,
          content: transcript,
          projectId,
          taskId,
        },
      });

      // Update attachment to link to message and store transcript
      await this.prisma.attachment.update({
        where: { id: attachmentId },
        data: {
          messageId: message.id,
          metadata: {
            ...(await this.getAttachmentMetadata(attachmentId)),
            transcriptionStatus: 'completed',
            transcript,
            transcribedAt: new Date().toISOString(),
          },
        },
      });

      this.logger.log(
        `Transcription saved as message ${message.id} for attachment ${attachmentId}`,
      );

      return {
        success: true,
        attachmentId,
        messageId: message.id,
        transcript,
      };
    } catch (error) {
      this.logger.error(
        `Error processing transcription job ${job.id}:`,
        error,
      );

      // Update attachment with error status
      try {
        await this.prisma.attachment.update({
          where: { id: attachmentId },
          data: {
            metadata: {
              ...(await this.getAttachmentMetadata(attachmentId)),
              transcriptionStatus: 'failed',
              transcriptionError:
                error instanceof Error ? error.message : 'Unknown error',
            },
          },
        });
      } catch (updateError) {
        this.logger.error('Failed to update attachment error status:', updateError);
      }

      throw error;
    }
  }

  /**
   * Get current attachment metadata
   */
  private async getAttachmentMetadata(attachmentId: string): Promise<any> {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id: attachmentId },
    });

    return (attachment?.metadata || {}) as any;
  }
}
