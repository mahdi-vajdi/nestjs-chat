import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';

@Schema({ versionKey: false })
export class ChatDocument {
  @Prop({ type: SchemaTypes.ObjectId })
  _id: Types.ObjectId;

  @Prop()
  createdAt: Date;

  @Prop()
  user1: string;

  @Prop()
  user2: string;
}

export const ChatSchema = SchemaFactory.createForClass(ChatDocument);
