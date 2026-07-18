import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  Res,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { BaseHttpController } from '@common/http/base-http-controller';
import {
  BlockRequestBody,
  BlockResponse,
} from '@user/presentation/http/dtos/block.dto';
import { CommandBus } from '@nestjs/cqrs';
import { BlockUserCommand } from '@user/application/commands/block-user/block-user.command';
import { UnblockUserCommand } from '@user/application/commands/unblock-user/unblock-user.command';
import { CurrentUserId } from '@common/http/decorators/current-user-id.decorator';
import { Response } from 'express';
import { Result } from '@common/result/result';
import { ErrorCode } from '@common/result/error';
import {
  UnblockRequestParams,
  UnblockResponse,
} from '@user/presentation/http/dtos/unblock.dto';
import { HttpStatus } from '@nestjs/common/enums/http-status.enum';
import {
  ApiConflictResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ValidationPipe } from '@common/validation/validation.pipe';
import { UserHttpGuard } from '@user/presentation/http/guards/user-http.guard';

@Controller('user')
@ApiTags('User')
export class UserHttpController extends BaseHttpController {
  constructor(private readonly commandBus: CommandBus) {
    super();
  }

  @ApiOperation({
    summary: 'Block',
    description: 'Block a user',
  })
  @ApiOkResponse({
    type: BlockResponse,
    description: 'Successfully blocked the user',
  })
  @ApiConflictResponse({
    type: null,
    description: 'User is already blocked',
  })
  @Post('block')
  @UseGuards(UserHttpGuard)
  @UsePipes(new ValidationPipe(BlockRequestBody, ['body'], 'http'))
  async block(
    @Body() body: BlockRequestBody,
    @Res() response: Response,
    @CurrentUserId() authUserId: string,
  ): Promise<void> {
    const res = await this.commandBus.execute(
      new BlockUserCommand(authUserId, body.targetUserId),
    );
    if (res.isError()) {
      this.respond(response, res);
      return;
    }

    if (res.value == false) {
      this.respond(
        response,
        Result.error('User is already blocked', ErrorCode.ALREADY_EXISTS),
      );
      return;
    }

    this.respond(response, Result.ok<BlockResponse>({}));
  }

  @ApiOperation({
    summary: 'Unblock',
    description: 'Unblock a blocked user',
  })
  @ApiOkResponse({
    type: UnblockResponse,
    description: 'Successfully blocked the user',
  })
  @ApiNoContentResponse({ type: null, description: 'User was not blocked' })
  @Delete('block/:userId')
  @UseGuards(UserHttpGuard)
  @UsePipes(new ValidationPipe(UnblockRequestParams, ['body'], 'http'))
  async unblock(
    @Param() params: UnblockRequestParams,
    @Res() response: Response,
    @CurrentUserId() authUserId: string,
  ): Promise<void> {
    const res = await this.commandBus.execute(
      new UnblockUserCommand(authUserId, params.targetUserId),
    );
    if (res.isError()) {
      this.respond(response, res);
      return;
    }

    if (res.value === false) {
      this.respond(
        response,
        Result.ok<UnblockResponse>({}),
        HttpStatus.NO_CONTENT,
      );
      return;
    }

    this.respond(response, Result.ok<UnblockResponse>({}));
  }
}
