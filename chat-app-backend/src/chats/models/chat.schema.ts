import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types, Schema as MongooseShcema } from 'mongoose';
import {
  USER_COLLECTION_NAME,
  UserDocument,
} from 'src/users/models/user.schema';

export const CHAT_COLLECTION_NAME = 'chats';

@Schema({ collection: 'chats', versionKey: false })
export class ChatDocument {
  @Prop({ type: SchemaTypes.ObjectId })
  _id: Types.ObjectId;

  @Prop()
  createdAt: Date;

  @Prop({
    type: MongooseShcema.Types.ObjectId,
    required: true,
    ref: USER_COLLECTION_NAME,
  })
  user1: UserDocument;

  @Prop({
    type: MongooseShcema.Types.ObjectId,
    required: true,
    ref: USER_COLLECTION_NAME,
  })
  user2: UserDocument;
}

export const ChatSchema = SchemaFactory.createForClass(ChatDocument);
