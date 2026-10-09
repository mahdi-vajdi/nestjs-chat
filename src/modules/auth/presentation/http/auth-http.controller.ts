import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  SignupRequestBody,
  SignupResponse,
} from '@modules/auth/presentation/http/dtos/signup.dto';
import { CommandBus } from '@nestjs/cqrs';
import { SignupCommand } from '@modules/auth/application/commands/signup/signup.command';
import { SigninCommand } from '@modules/auth/application/commands/signin/signin.command';
import {
  SigninRequestBody,
  SigninResponse,
} from '@modules/auth/presentation/http/dtos/signin.dto';
import {
  RefreshTokensRequestBody,
  RefreshTokensResponse,
} from '@modules/auth/presentation/http/dtos/refresh-token.dto';
import { RefreshTokensCommand } from '@modules/auth/application/commands/refresh-tokens/refresh-tokens.command';
import {
  LogoutRequestBody,
  LogoutResponse,
} from '@modules/auth/presentation/http/dtos/logout.dto';
import { LogoutCommand } from '@modules/auth/application/commands/logout/logout.command';
import { AuthHttpGuard } from '@modules/auth/presentation/guards/auth-http.guard';
import { CurrentUserId } from '@common/decorators/current-user-id.decorator';

@Controller('v1/auth')
@ApiTags('Auth')
export class AuthHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('signup')
  @ApiOperation({
    summary: 'Signup',
    description: 'Sign up and create a new user',
  })
  @ApiBody({ type: SignupRequestBody })
  @ApiResponse({ type: SignupResponse })
  async signup(@Body() body: SignupRequestBody): Promise<SignupResponse> {
    return this.commandBus.execute(
      new SignupCommand(
        body.email,
        body.password,
        body.firstName,
        body.lastName,
      ),
    );
  }

  @Post('signin')
  @ApiOperation({
    summary: 'Signin',
    description: 'Provide credentials and get user info and tokens',
  })
  @ApiOkResponse({ type: SigninResponse })
  async signin(@Body() body: SigninRequestBody): Promise<SigninResponse> {
    return this.commandBus.execute(
      new SigninCommand(body.identifier, body.password),
    );
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Refresh Tokens',
    description: 'Provide a valid refresh token to get a new pair of tokens',
  })
  @ApiBody({ type: RefreshTokensRequestBody })
  @ApiOkResponse({ type: RefreshTokensResponse })
  async refresh(
    @Body() body: RefreshTokensRequestBody,
  ): Promise<RefreshTokensResponse> {
    return this.commandBus.execute(new RefreshTokensCommand(body.refreshToken));
  }

  @Post('logout')
  @UseGuards(AuthHttpGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout',
    description: 'Revoke active refresh token session(s)',
  })
  @ApiBody({ type: LogoutRequestBody })
  @ApiOkResponse({ type: LogoutResponse })
  async logout(
    @CurrentUserId() authUserId: string,
    @Body() body: LogoutRequestBody,
  ): Promise<LogoutResponse> {
    const success = await this.commandBus.execute(
      new LogoutCommand(authUserId, body.refreshToken, body.allDevices),
    );
    return { success };
  }
}
