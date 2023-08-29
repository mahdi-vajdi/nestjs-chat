import { PartialType } from '@nestjs/mapped-types';
import { SignupDto } from './signup.dto';

export class UpdateAuthDto extends PartialType(SignupDto) {}
