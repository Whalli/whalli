import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatCacheService } from './chat-cache.service';
import { OpenAIAdapter } from './adapters/openai.adapter';
import { AnthropicAdapter } from './adapters/anthropic.adapter';
import { XAIAdapter } from './adapters/xai.adapter';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ProjectsModule } from '../projects/projects.module';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [PrismaModule, AuthModule, ConfigModule, ProjectsModule, TasksModule],
  controllers: [ChatController],
  providers: [ChatService, ChatCacheService, OpenAIAdapter, AnthropicAdapter, XAIAdapter],
  exports: [ChatService],
})
export class ChatModule {}
