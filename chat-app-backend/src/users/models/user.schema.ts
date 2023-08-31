import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';

@Schema({ versionKey: false })
export class UserDocument {
  @Prop({ type: SchemaTypes.ObjectId })
  _id: Types.ObjectId;

  @Prop()
  username: string;

  @Prop()
  password: string;
}

export const UserSchema = SchemaFactory.createForClass(UserDocument);
