import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Sse,
  Logger,
  MessageEvent,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuthGuard, CurrentUser } from '../auth/auth.guard';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { StartChatDto } from './dto/start-chat.dto';

/**
 * ChatController - AI Chat with subscription-based model access
 * All routes are protected by AuthGuard
 */
@Controller('chat')
@UseGuards(AuthGuard)
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly chatService: ChatService) {}

  /**
   * GET /chat/models
   * Get available AI models based on user subscription
   */
  @Get('models')
  async getModels(@CurrentUser() user: any) {
    return this.chatService.getAvailableModels(user.id);
  }

  /**
   * POST /chat/start
   * Create a chat session and return sessionId
   * Frontend will use this sessionId to connect to the SSE stream
   */
  @Post('start')
  @HttpCode(HttpStatus.OK)
  async startChat(
    @CurrentUser() user: any,
    @Body() dto: StartChatDto,
  ) {
    this.logger.log(`Starting chat session for user ${user.id}, model ${dto.modelId}`);

    const session = await this.chatService.createChatSession({
      userId: user.id,
      modelId: dto.modelId,
      chatId: dto.chatId,
      projectId: dto.projectId,
      taskId: dto.taskId,
      prompt: dto.prompt,
    });

    return {
      sessionId: session.id,
      chatId: session.chatId || session.id, // Use sessionId as chatId if not provided
    };
  }

  /**
   * GET /chat/stream?sessionId=xxx
   * Server-Sent Events (SSE) endpoint for streaming AI responses
   * Frontend connects here after calling POST /chat/start
   */
  @Get('stream')
  @Sse()
  streamChat(
    @Query('sessionId') sessionId: string,
    @CurrentUser() user: any,
  ): Observable<MessageEvent> {
    this.logger.log(`SSE stream requested for session ${sessionId}`);

    if (!sessionId) {
      throw new BadRequestException('sessionId query parameter is required');
    }

    return new Observable((subscriber) => {
      (async () => {
        try {
          // Stream the chat response
          const generator = this.chatService.streamChatResponse(
            sessionId,
            user.id,
          );

          for await (const event of generator) {
            // Send SSE event in the format: data: {"type":"token","content":"text"}
            subscriber.next({
              data: JSON.stringify(event),
            } as MessageEvent);
          }

          subscriber.complete();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          const errorStack = error instanceof Error ? error.stack : undefined;
          this.logger.error(`Error in SSE stream: ${errorMessage}`, errorStack);
          
          // Send error event before completing
          subscriber.next({
            data: JSON.stringify({
              type: 'error',
              message: errorMessage,
            }),
          } as MessageEvent);
          
          subscriber.complete();
        }
      })();
    });
  }

  /**
   * GET /chat/history?chatId=xxx
   * Get chat history for a specific conversation
   * Returns all messages in chronological order
   */
  @Get('history')
  async getChatHistory(
    @CurrentUser() user: any,
    @Query('chatId') chatId?: string,
    @Query('projectId') projectId?: string,
    @Query('taskId') taskId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.chatService.getChatHistory({
      userId: user.id,
      chatId,
      projectId,
      taskId,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  /**
   * GET /chat/messages/:id
   * Get a specific message by ID
   */
  @Get('messages/:id')
  async getMessage(@Param('id') id: string, @CurrentUser() user: any) {
    return this.chatService.getMessage(id, user.id);
  }

  /**
   * GET /chat/check-access/:modelId
   * Check if user can access a specific model
   */
  @Get('check-access/:modelId')
  async checkModelAccess(
    @Param('modelId') modelId: string,
    @CurrentUser() user: any,
  ) {
    return this.chatService.checkModelAccess(user.id, modelId);
  }
}
