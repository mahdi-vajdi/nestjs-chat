export class SignupUserDto {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
}

export class SignupUserResponseDto {
  id: string;
  username: string;
  createdAt: string;
  accessToken: string;
  refreshToken: string;
}
