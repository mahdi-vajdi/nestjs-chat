import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { SchemaTypes, Types } from 'mongoose';
import { UserDocument } from 'src/users/models/user.schema';

export const MESSAGE_COLLECTION_NAME = 'messages';

@Schema({ collection: MESSAGE_COLLECTION_NAME, versionKey: false })
export class MessageDocument {
  @Prop({ type: SchemaTypes.ObjectId })
  _id: Types.ObjectId;

  @Prop()
  timestamp: Date;

  @Prop()
  chat: string;

  @Prop()
  text: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: UserDocument.name,
  })
  sender: UserDocument;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: UserDocument.name,
  })
  receiver: UserDocument;
}

export const MessageSchema = SchemaFactory.createForClass(MessageDocument);
