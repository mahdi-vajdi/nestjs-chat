import { Body, Controller, Post, Res, UsePipes } from '@nestjs/common';
import { BaseHttpController } from '@common/http/base-http-controller';
import { Response } from 'express';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SignupRequestBody, SignupResponse } from './models/signup.model';
import { Result } from '@common/result/result';
import { ValidationPipe } from '@common/validation/validation.pipe';
import { AuthService } from '@application/auth/auth.service';

@Controller('v1/auth')
export class AuthHttpController extends BaseHttpController {
  constructor(private readonly userAuthService: AuthService) {
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
    const res = await this.userAuthService.signupUser({
      email: body.email,
      password: body.password,
      firstName: body.firstName,
      lastName: body.lastName,
    });
    if (res.isError()) {
      this.respond(response, res);
      return;
    }

    this.respond(
      response,
      Result.ok<SignupResponse>({
        id: res.value.id,
        createdAt: res.value.createdAt,
      }),
    );
  }
}
