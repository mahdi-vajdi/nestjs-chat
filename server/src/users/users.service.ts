import {
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersRepository } from './users.repository';
import * as bcrypt from 'bcryptjs';
import { User } from './interfaces/user.interface';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    await this.validateCreateUserDto(createUserDto);
    return this.usersRepository.create({
      ...createUserDto,
      createdAt: new Date(),
      password: await bcrypt.hash(createUserDto.password, 10),
    });
  }

  async findOneByUsername(username: string): Promise<User> {
    return this.usersRepository.findOneByUsername(username);
  }

  async verifyUser(username: string, password: string): Promise<User> {
    const user = await this.usersRepository.findOneByUsername(username);
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid)
      throw new UnauthorizedException('Credintials are not valid');
    return user;
  }

  private async validateCreateUserDto(createUserDto: CreateUserDto) {
    try {
      await this.usersRepository.findOneByUsername(createUserDto.username);
    } catch (error) {
      return;
    }
    throw new UnprocessableEntityException('Username Already Exists.');
  }
}
