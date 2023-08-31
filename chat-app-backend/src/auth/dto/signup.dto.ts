import { IsNotEmpty, IsString, IsStrongPassword } from 'class-validator';

export class SignupDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsStrongPassword()
  password: string;
}
