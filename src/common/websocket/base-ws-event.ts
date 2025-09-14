export abstract class BaseWsEvent<T> {
  constructor(protected readonly _data: T) {}

  abstract get eventName(): string;

  get data(): T {
    return this._data;
  }
}
