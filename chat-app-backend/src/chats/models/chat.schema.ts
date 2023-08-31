import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument } from 'src/database/abstract.schema';

@Schema({ versionKey: false })
export class ChatDocument extends AbstractDocument {
  @Prop()
  createdAt: Date;

  @Prop()
  user1: string;

  @Prop()
  user2: string;
}

export const ChatSchema = SchemaFactory.createForClass(ChatDocument);
