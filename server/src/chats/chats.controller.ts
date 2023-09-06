import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { Request } from 'express';
import { User } from 'src/users/interfaces/user.interface';

@UseGuards(JwtAuthGuard)
@Controller('chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Post()
  async create(@Req() req: Request, @Body() createChatDto: CreateChatDto) {
    return this.chatsService.create(createChatDto, req.user as User);
  }

  @Get()
  async findAll(@Req() req: Request) {
    return this.chatsService.findAllChats(req.user as User);
  }
}
