export class SignupUserDto {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
}

export class SignupUserResponseDto {
  id: string;
  createdAt: string;
}
