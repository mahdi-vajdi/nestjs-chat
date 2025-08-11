import { Body, Controller, Post, Res, UsePipes } from '@nestjs/common';
import { BaseHttpController } from '@common/http/base-http-controller';
import { Response } from 'express';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SignupRequestBody, SignupResponse } from './models/signup.model';
import { Result } from '@common/result/result';
import { ValidationPipe } from '@common/validation/validation.pipe';
import { UserService } from '@user/services/user.service';
import { AuthService } from '@auth/services/auth.service';
import { UserRole } from '@user/enums/user-role.enum';

@Controller('v1/auth')
export class AuthHttpController extends BaseHttpController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {
    super();
  }

  @Post('signup')
  @UsePipes(new ValidationPipe(['body'], 'http'))
  @ApiOperation({
    summary: 'Signup',
    description: 'Sign up and create a new user in the chatterbox',
  })
  @ApiBody({ type: SignupRequestBody })
  @ApiResponse({ type: SignupResponse })
  async signup(@Res() response: Response, @Body() body: SignupRequestBody) {
    // Create a user
    const createUserRes = await this.userService.createUser({
      email: body.email,
      username: null,
      password: body.password,
      firstName: body.firstName,
      lastName: body.lastName,
      role: UserRole.USER,
    });
    if (createUserRes.isError()) return Result.error(createUserRes.error);

    // Create auth tokens for the user
    const createAuthTokensRes = await this.authService.createTokens(
      createUserRes.value.id,
      'USER',
    );
    if (createUserRes.isError()) return Result.error(createUserRes.error);

    this.respond(
      response,
      Result.ok<SignupResponse>({
        id: createUserRes.value.id,
        accessToken: createAuthTokensRes.value.accessToken,
        refreshToken: createAuthTokensRes.value.refreshToken,
        createdAt: createUserRes.value.createdAt.toISOString(),
      }),
    );
  }
}
