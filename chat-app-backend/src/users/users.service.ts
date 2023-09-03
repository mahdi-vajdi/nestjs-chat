import {
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersRepository } from './users.repository';
import * as bcrypt from 'bcryptjs';
import { UserDocument } from './models/user.schema';
import { ResponseUser } from './interfaces/response-user.interface';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async create(createUserDto: CreateUserDto) {
    await this.validateCreateUserDto(createUserDto);
    const user = await this.usersRepository.create({
      ...createUserDto,
      createdAt: new Date(),
      password: await bcrypt.hash(createUserDto.password, 10),
    });
    return user;
  }

  async findOne(username: string) {
    return this.usersRepository.findOne(username);
  }

  private async validateCreateUserDto(createUserDto: CreateUserDto) {
    try {
      await this.usersRepository.findOne(createUserDto.username);
    } catch (error) {
      return;
    }
    throw new UnprocessableEntityException('Username Already Exists.');
  }

  async verifyUser(username: string, password: string) {
    const user = await this.usersRepository.findOne(username);
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid)
      throw new UnauthorizedException('Credintials are not valid');
    return user;
  }

  private deserialize(user: UserDocument): ResponseUser {
    return {
      username: user.username,
      createdAt: user.createdAt,
    };
  }
}
