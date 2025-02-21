import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../entities/user.entity';
import { Repository } from 'typeorm';
import { TryCatch } from '@common/decorators/try-catch.decorator';
import { Result } from '@common/result/result';
import { ErrorCode } from '@common/result/error';
import { UserExistsInput } from './dto/user-exists.dto';
import { DatabaseType } from '@infrastructure/database/database-type.enum';
import { IUserDatabaseProvider } from '@application/user/database/providers/user-database.provider';
import { IUser, IUserEntity } from '@application/user/models/user.model';

@Injectable()
export class UserPostgresService implements IUserDatabaseProvider {
  constructor(
    @InjectRepository(UserEntity, DatabaseType.POSTGRES)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  @TryCatch
  async createUser(user: IUser): Promise<Result<IUserEntity>> {
    const res = await this.userRepository.save(UserEntity.fromDomain(user));

    if (!res) Result.error('Could not create user', ErrorCode.INTERNAL);

    return Result.ok(UserEntity.toDomain(res));
  }

  @TryCatch
  async userExists(data: UserExistsInput): Promise<Result<boolean>> {
    const query = this.userRepository.createQueryBuilder('user');

    if (data.email) query.where('user.email = :email', { email: data.email });
    if (data.username)
      query.orWhere('user.username = :username', { username: data.username });

    const res = await query.getExists();

    return Result.ok(res);
  }
}
