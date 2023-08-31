import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { UserDocument } from './models/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';

@Injectable()
export class UsersRepository {
  protected readonly logger: Logger = new Logger(UsersRepository.name);

  constructor(
    @InjectModel(UserDocument.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async create(document: Omit<UserDocument, '_id'>): Promise<UserDocument> {
    const createdDocument = new this.userModel({
      ...document,
      _id: new Types.ObjectId(),
    });
    return (await createdDocument.save()).toJSON() as unknown as UserDocument;
  }

  async findOne(filterQuery: FilterQuery<UserDocument>): Promise<UserDocument> {
    const document = await this.userModel.findOne(filterQuery);
    if (!document) {
      this.logger.warn('Document not found with filterQuery: ', filterQuery);
      throw new NotFoundException('Document not found');
    }
    return document;
  }
}
