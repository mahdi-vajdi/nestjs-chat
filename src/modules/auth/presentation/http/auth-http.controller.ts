import { Body, Controller, Post, UsePipes } from '@nestjs/common';
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
import {
  SigninRequestBody,
  SigninResponse,
} from '@auth/presentation/http/dtos/signin.dto';

@Controller('v1/auth')
@ApiTags('Auth')
export class AuthHttpController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('signup')
  @UsePipes(new ValidationPipe(SignupRequestBody, ['body'], 'http'))
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
      new SigninCommand(body.property, body.password),
    );
  }
}
