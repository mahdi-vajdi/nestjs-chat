import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';

@Schema({ versionKey: false })
export class MessageDocument {
  @Prop({ type: SchemaTypes.ObjectId })
  _id: Types.ObjectId;

  @Prop()
  timestamp: Date;

  @Prop()
  text: string;

  @Prop()
  sender: string;

  @Prop()
  receiver: string;
}

export const MessageSchema = SchemaFactory.createForClass(MessageDocument);
