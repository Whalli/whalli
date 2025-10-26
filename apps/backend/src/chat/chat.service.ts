import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { Chat, Message } from '@whalli/utils';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async create(userId: string, createChatDto: CreateChatDto): Promise<Chat> {
    const { title, model, presetId } = createChatDto;

    // Verify preset belongs to user if presetId provided
    if (presetId) {
      const preset = await this.prisma.preset.findUnique({
        where: { id: presetId },
      });

      if (!preset || preset.userId !== userId) {
        throw new ForbiddenException('Preset not found or does not belong to user');
      }
    }

    const chat = await this.prisma.chat.create({
      data: {
        title,
        model,
        presetId,
        userId,
      },
      include: {
        messages: true,
        preset: true,
      },
    });

    return this.mapChatToDto(chat);
  }

  async findAll(userId: string): Promise<Chat[]> {
    const chats = await this.prisma.chat.findMany({
      where: { userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        preset: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return chats.map((chat) => this.mapChatToDto(chat));
  }

  async findOne(chatId: string, userId: string): Promise<Chat> {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        preset: true,
      },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    if (chat.userId !== userId) {
      throw new ForbiddenException('You do not have access to this chat');
    }

    return this.mapChatToDto(chat);
  }

  async update(
    chatId: string,
    userId: string,
    updateChatDto: UpdateChatDto,
  ): Promise<Chat> {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    if (chat.userId !== userId) {
      throw new ForbiddenException('You do not have access to this chat');
    }

    const updatedChat = await this.prisma.chat.update({
      where: { id: chatId },
      data: updateChatDto,
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        preset: true,
      },
    });

    return this.mapChatToDto(updatedChat);
  }

  async remove(chatId: string, userId: string): Promise<void> {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    if (chat.userId !== userId) {
      throw new ForbiddenException('You do not have access to this chat');
    }

    await this.prisma.chat.delete({
      where: { id: chatId },
    });
  }

  async addMessage(
    chatId: string,
    userId: string,
    createMessageDto: CreateMessageDto,
  ): Promise<Message> {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    if (chat.userId !== userId) {
      throw new ForbiddenException('You do not have access to this chat');
    }

    const message = await this.prisma.message.create({
      data: {
        role: createMessageDto.role,
        content: createMessageDto.content,
        chatId,
      },
    });

    // Update chat's updatedAt timestamp
    await this.prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    return {
      id: message.id,
      role: message.role,
      content: message.content,
      chatId: message.chatId,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    };
  }

  async getMessages(chatId: string, userId: string): Promise<Message[]> {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    if (chat.userId !== userId) {
      throw new ForbiddenException('You do not have access to this chat');
    }

    const messages = await this.prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
    });

    return messages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      chatId: msg.chatId,
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
    }));
  }

  async sendMessageWithAi(
    chatId: string,
    userId: string,
    createMessageDto: CreateMessageDto,
  ): Promise<{ userMessage: Message; assistantMessage: Message }> {
    // Verify chat belongs to user
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        preset: true,
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 50, // Last 50 messages for context
        },
      },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    if (chat.userId !== userId) {
      throw new ForbiddenException('You do not have access to this chat');
    }

    // 1. Store user message
    const userMessage = await this.prisma.message.create({
      data: {
        role: 'USER',
        content: createMessageDto.content,
        chatId,
      },
    });

    // 2. Build conversation history for AI
    const conversationHistory = chat.messages.map((msg) => ({
      role: msg.role.toLowerCase() as 'system' | 'user' | 'assistant',
      content: msg.content,
    }));

    // Add the new user message
    conversationHistory.push({
      role: 'user',
      content: createMessageDto.content,
    });

    // 3. Call AI service
    const aiResponse = await this.aiService.generateCompletion({
      model: chat.model,
      messages: conversationHistory,
      systemInstruction: chat.preset?.systemInstruction,
    });

    // 4. Store assistant response
    const assistantMessage = await this.prisma.message.create({
      data: {
        role: 'ASSISTANT',
        content: aiResponse.content,
        chatId,
      },
    });

    // 5. Update chat's updatedAt timestamp
    await this.prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    // 6. Return both messages
    return {
      userMessage: {
        id: userMessage.id,
        role: userMessage.role,
        content: userMessage.content,
        chatId: userMessage.chatId,
        createdAt: userMessage.createdAt,
        updatedAt: userMessage.updatedAt,
      },
      assistantMessage: {
        id: assistantMessage.id,
        role: assistantMessage.role,
        content: assistantMessage.content,
        chatId: assistantMessage.chatId,
        createdAt: assistantMessage.createdAt,
        updatedAt: assistantMessage.updatedAt,
      },
    };
  }

  private mapChatToDto(chat: any): Chat {
    return {
      id: chat.id,
      title: chat.title,
      model: chat.model,
      presetId: chat.presetId,
      userId: chat.userId,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    };
  }
}
