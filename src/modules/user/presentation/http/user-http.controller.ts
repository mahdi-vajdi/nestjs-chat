import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Param,
  Post,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import {
  BlockRequestBody,
  BlockResponse,
} from '@modules/user/presentation/http/dtos/block.dto';
import { CommandBus } from '@nestjs/cqrs';
import { BlockUserCommand } from '@modules/user/application/commands/block-user/block-user.command';
import { UnblockUserCommand } from '@modules/user/application/commands/unblock-user/unblock-user.command';
import { CurrentUserId } from '@common/decorators/current-user-id.decorator';
import {
  UnblockRequestParams,
  UnblockResponse,
} from '@modules/user/presentation/http/dtos/unblock.dto';
import {
  ApiConflictResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ValidationPipe } from '@common/validation/validation.pipe';
import { UserHttpGuard } from '@modules/user/presentation/http/guards/user-http.guard';

@Controller('user')
@ApiTags('User')
export class UserHttpController {
  constructor(private readonly commandBus: CommandBus) {}

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
    @CurrentUserId() authUserId: string,
  ): Promise<BlockResponse> {
    const success = await this.commandBus.execute(
      new BlockUserCommand(authUserId, body.targetUserId),
    );

    if (success === false) {
      throw new ConflictException('User is already blocked');
    }

    return {};
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
    @CurrentUserId() authUserId: string,
  ): Promise<UnblockResponse> {
    await this.commandBus.execute(
      new UnblockUserCommand(authUserId, params.targetUserId),
    );

    return {};
  }
}
