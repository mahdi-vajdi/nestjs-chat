export class SignupCommand {
  constructor(
    public readonly email: string,
    public readonly password?: string,
    public readonly firstName?: string,
    public readonly lastName?: string,
  ) {}
}
