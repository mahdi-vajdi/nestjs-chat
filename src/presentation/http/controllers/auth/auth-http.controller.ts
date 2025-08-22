import { Body, Controller, Post, Res, UsePipes } from '@nestjs/common';
import { BaseHttpController } from '@common/http/base-http-controller';
import { Response } from 'express';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  SignupRequestBody,
  SignupResponse,
} from '@presentation/http/controllers/auth/dtos/signup.dto';
import { Result } from '@common/result/result';
import { ValidationPipe } from '@common/validation/validation.pipe';
import { UserService } from '@user/services/user.service';
import { AuthService } from '@auth/services/auth.service';
import { UserRole } from '@user/enums/user-role.enum';
import { ErrorCode } from '@common/result/error';
import {
  SigninRequestBody,
  SigninResponse,
} from '@presentation/http/controllers/auth/dtos/signin.dto';

@Controller('v1/auth')
@ApiTags('Auth')
export class AuthHttpController extends BaseHttpController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {
    super();
  }

  @Post('signup')
  @UsePipes(new ValidationPipe(SignupRequestBody, ['body'], 'http'))
  @ApiOperation({
    summary: 'Signup',
    description: 'Sign up and create a new user',
  })
  @ApiBody({ type: SignupRequestBody })
  @ApiResponse({ type: SignupResponse })
  async signup(
    @Res() response: Response,
    @Body() body: SignupRequestBody,
  ): Promise<void> {
    // Create a user
    const createUserRes = await this.userService.createUser({
      email: body.email,
      username: null,
      password: body.password,
      firstName: body.firstName,
      lastName: body.lastName,
      avatar: null, // FIXME
      role: UserRole.USER,
    });
    if (createUserRes.isError()) {
      this.respond(response, createUserRes);
      return;
    }

    // Create auth tokens for the user
    const createAuthTokensRes = await this.authService.createTokens(
      createUserRes.value.id,
      'USER',
    );
    if (createAuthTokensRes.isError()) {
      this.respond(
        response,
        Result.error(
          'Failed to create token; please sign in again',
          ErrorCode.INTERNAL,
        ),
      );
      return;
    }

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

  @Post('signin')
  @ApiOperation({
    summary: 'Signin',
    description: 'Provide credentials and get user info and tokens',
  })
  @ApiOkResponse({ type: SigninResponse })
  async signin(
    @Body() body: SigninRequestBody,
    @Res() response: Response,
  ): Promise<void> {
    const validateRes = await this.userService.validatePassword(
      body.property,
      body.password,
    );
    if (validateRes.isError()) {
      if (validateRes.error.code == ErrorCode.INTERNAL) {
        this.respond(
          response,
          Result.error('Something went wrong. Please try again.'),
        );
        return;
      }
      this.respond(
        response,
        Result.error('Invalid Credentials', ErrorCode.UNAUTHENTICATED),
      );
      return;
    }

    const tokensRes = await this.authService.createTokens(
      validateRes.value.id,
      validateRes.value.role,
    );
    if (tokensRes.isError()) {
      this.respond(response, tokensRes);
      return;
    }

    this.respond(
      response,
      Result.ok<SigninResponse>({
        user: {
          id: validateRes.value.id,
          firstName: validateRes.value.firstName,
          lastName: validateRes.value.lastName,
          createdAt: validateRes.value.createdAt.toISOString(),
        },
        tokens: {
          accessToken: tokensRes.value.accessToken,
          refreshToken: tokensRes.value.refreshToken,
        },
      }),
    );
  }
}
