import { Body, Controller, Post, Res } from '@nestjs/common';
import { BaseHttpController } from '@common/http/base-http-controller';
import { Response } from 'express';
import { UserService } from '../../../../application/user/services/user.service';
import { User } from '@domain/user/entities/user.model';
import { ApiBody, ApiResponse } from '@nestjs/swagger';
import { SignupRequest, SignupResponse } from './models/signup.model';
import { Result } from '@common/result/result';

@Controller('v1/auth')
export class AuthHttpController extends BaseHttpController {
  constructor(private readonly userService: UserService) {
    super();
  }

  @Post('signup')
  @ApiBody({ type: SignupRequest })
  @ApiResponse({ type: SignupResponse })
  async signup(@Res() response: Response, @Body() body: SignupRequest) {
    const res = await this.userService.createUser(
      User.create({
        email: body.email,
        password: body.password,
        firstName: body.firstName,
        lastName: body.lastName,
      }),
    );
    if (res.isError()) {
      this.respond(response, res);
      return;
    }

    this.respond(
      response,
      Result.ok<SignupResponse>({
        id: res.value.id,
        createdAt: res.value.createdAt.toISOString(),
      }),
    );
  }
}
