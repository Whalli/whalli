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
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserSafe, Chat, Message } from '@whalli/utils';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: UserSafe,
    @Body() createChatDto: CreateChatDto,
  ): Promise<Chat> {
    return this.chatService.create(user.id, createChatDto);
  }

  @Get()
  async findAll(@CurrentUser() user: UserSafe): Promise<Chat[]> {
    return this.chatService.findAll(user.id);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: UserSafe,
  ): Promise<Chat> {
    return this.chatService.findOne(id, user.id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser() user: UserSafe,
    @Body() updateChatDto: UpdateChatDto,
  ): Promise<Chat> {
    return this.chatService.update(id, user.id, updateChatDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: UserSafe,
  ): Promise<void> {
    return this.chatService.remove(id, user.id);
  }

  @Post(':id/messages')
  @HttpCode(HttpStatus.CREATED)
  async addMessage(
    @Param('id') chatId: string,
    @CurrentUser() user: UserSafe,
    @Body() createMessageDto: CreateMessageDto,
  ): Promise<Message> {
    return this.chatService.addMessage(chatId, user.id, createMessageDto);
  }

  @Post(':id/message')
  @HttpCode(HttpStatus.CREATED)
  async sendMessage(
    @Param('id') chatId: string,
    @CurrentUser() user: UserSafe,
    @Body() createMessageDto: CreateMessageDto,
  ): Promise<{ userMessage: Message; assistantMessage: Message }> {
    return this.chatService.sendMessageWithAi(chatId, user.id, createMessageDto);
  }

  @Get(':id/messages')
  async getMessages(
    @Param('id') chatId: string,
    @CurrentUser() user: UserSafe,
  ): Promise<Message[]> {
    return this.chatService.getMessages(chatId, user.id);
  }
}
