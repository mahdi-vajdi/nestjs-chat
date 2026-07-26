export class ValidatePasswordQuery {
  constructor(
    public readonly property: string,
    public readonly password: string,
  ) {}
}
