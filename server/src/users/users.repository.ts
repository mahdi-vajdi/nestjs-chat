import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { USER_COLLECTION_NAME, UserDocument } from './models/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

@Injectable()
export class UsersRepository {
  protected readonly logger: Logger = new Logger(UsersRepository.name);

  constructor(
    @InjectModel(USER_COLLECTION_NAME)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async create(document: Omit<UserDocument, '_id'>): Promise<UserDocument> {
    const createdUser = new this.userModel({
      ...document,
      _id: new Types.ObjectId(),
    });
    return (await createdUser.save()).toJSON() as unknown as UserDocument;
  }

  async findOne(username: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ username });
    if (!user) {
      this.logger.warn(`User not found with username: ${username}`);
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
