import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types, Schema as MongooseShcema } from 'mongoose';
import {
  CHAT_COLLECTION_NAME,
  ChatDocument,
} from 'src/chats/models/chat.schema';
import {
  USER_COLLECTION_NAME,
  UserDocument,
} from 'src/users/models/user.schema';

export const MESSAGE_COLLECTION_NAME = 'messages';

@Schema({ collection: MESSAGE_COLLECTION_NAME, versionKey: false })
export class MessageDocument {
  @Prop({ type: SchemaTypes.ObjectId })
  _id: Types.ObjectId;

  @Prop()
  timestamp: Date;

  @Prop({
    type: MongooseShcema.Types.ObjectId,
    required: true,
    ref: CHAT_COLLECTION_NAME,
  })
  chat: ChatDocument;

  @Prop()
  text: string;

  @Prop({
    type: MongooseShcema.Types.ObjectId,
    required: true,
    ref: USER_COLLECTION_NAME,
  })
  sender: UserDocument;

  @Prop({
    type: MongooseShcema.Types.ObjectId,
    required: true,
    ref: USER_COLLECTION_NAME,
  })
  receiver: UserDocument;

  @Prop()
  seen: boolean;
}

export const MessageSchema = SchemaFactory.createForClass(MessageDocument);
