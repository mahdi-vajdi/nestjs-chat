import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ChatsService } from './chats.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { Request } from 'express';
import { UserDocument } from 'src/users/models/user.schema';

@UseGuards(JwtAuthGuard)
@Controller('chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Post()
  create(@Req() req: Request, @Body() createChatDto: CreateChatDto) {
    return this.chatsService.create(createChatDto, req.user as UserDocument);
  }

  @Get()
  findAll(@Req() req: Request) {
    return this.chatsService.findAllChats(req.user as UserDocument);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.chatsService.findOne(+id);
  }
}
