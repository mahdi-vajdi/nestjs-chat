export abstract class BaseWsEvent<T> {
  constructor(protected readonly _data: T) {}

  abstract get name(): string;

  get data(): T {
    return this._data;
  }
}
