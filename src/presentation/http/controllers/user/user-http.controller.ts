import { Body, Controller, Delete, Param, Post, Res } from '@nestjs/common';
import { BaseHttpController } from '@common/http/base-http-controller';
import { UserService } from '@user/services/user.service';
import {
  BlockRequestBody,
  BlockResponse,
} from '@presentation/http/controllers/user/dtos/block.dto';
import { AuthHttpUserId } from '@presentation/http/decorators/auth-http-user-id.decorator';
import { Response } from 'express';
import { Result } from '@common/result/result';
import { ErrorCode } from '@common/result/error';
import {
  UnblockRequestParams,
  UnblockResponse,
} from '@presentation/http/controllers/user/dtos/unblock.dto';
import { HttpStatus } from '@nestjs/common/enums/http-status.enum';
import {
  ApiConflictResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

@Controller('user')
@ApiTags('User')
export class UserHttpController extends BaseHttpController {
  constructor(private readonly userService: UserService) {
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
  async block(
    @Body() body: BlockRequestBody,
    @Res() response: Response,
    @AuthHttpUserId() authUserId: string,
  ): Promise<void> {
    const res = await this.userService.block(authUserId, body.targetUserId);
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
  async unblock(
    @Param() params: UnblockRequestParams,
    @Res() response: Response,
    @AuthHttpUserId() authUserId: string,
  ): Promise<void> {
    const res = await this.userService.unblock(authUserId, params.targetUserId);
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
