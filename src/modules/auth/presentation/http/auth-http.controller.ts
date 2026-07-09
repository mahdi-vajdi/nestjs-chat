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
} from '@auth/presentation/http/dtos/signup.dto';
import { ValidationPipe } from '@common/validation/validation.pipe';
import { AuthService } from '@auth/application/services/auth.service';
import {
  SigninRequestBody,
  SigninResponse,
} from '@auth/presentation/http/dtos/signin.dto';

@Controller('v1/auth')
@ApiTags('Auth')
export class AuthHttpController extends BaseHttpController {
  constructor(private readonly authService: AuthService) {
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
    const res = await this.authService.signup(body);
    this.respond(response, res);
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
    const res = await this.authService.signin(body);
    this.respond(response, res);
  }
}
