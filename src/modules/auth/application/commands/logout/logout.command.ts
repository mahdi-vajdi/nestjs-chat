export class LogoutCommand {
  constructor(
    public readonly userId: string,
    public readonly refreshToken?: string,
    public readonly allDevices: boolean = false,
  ) {}
}
