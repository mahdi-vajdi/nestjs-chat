import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument } from 'src/database/abstract.schema';

@Schema({ versionKey: false })
export class MessageDocument extends AbstractDocument {
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
