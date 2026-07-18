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
import { CommandBus } from '@nestjs/cqrs';
import { SignupCommand } from '@auth/application/commands/signup/signup.command';
import { SigninCommand } from '@auth/application/commands/signin/signin.command';
import { Result } from '@common/result/result';
import {
  SigninRequestBody,
  SigninResponse,
} from '@auth/presentation/http/dtos/signin.dto';

@Controller('v1/auth')
@ApiTags('Auth')
export class AuthHttpController extends BaseHttpController {
  constructor(private readonly commandBus: CommandBus) {
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
    const res = await this.commandBus.execute<
      SignupCommand,
      Result<SignupResponse>
    >(
      new SignupCommand(
        body.email,
        body.password,
        body.firstName,
        body.lastName,
      ),
    );
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
    const res = await this.commandBus.execute<
      SigninCommand,
      Result<SigninResponse>
    >(new SigninCommand(body.property, body.password));
    this.respond(response, res);
  }
}
