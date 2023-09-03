import { Injectable } from '@nestjs/common';
import { SignupDto } from './dto/signup.dto';
import { UsersService } from 'src/users/users.service';
import { UserDocument } from 'src/users/models/user.schema';
import { JwtService } from '@nestjs/jwt';
import { ResponseSignin } from './interfaces/response-signin.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(signupDto: SignupDto): Promise<ResponseSignin> {
    const createdUser = await this.usersService.create(signupDto);
    const signinObject = this.signin(createdUser);
    return {
      message: 'Signup Successfull',
      username: createdUser.username,
      access_token: signinObject.access_token,
    };
  }

  signin(user: UserDocument): ResponseSignin {
    const payload = {
      username: user.username,
      sub: user._id,
    };

    return {
      message: 'Signin Successfull',
      username: user.username,
      access_token: this.jwtService.sign(payload),
    };
  }

  async validate(username: string, password: string) {
    return this.usersService.verifyUser(username, password);
  }

  async getUserByUsername(username: string) {
    return this.usersService.findOne(username);
  }
}
