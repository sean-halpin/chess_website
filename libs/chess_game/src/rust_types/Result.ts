export class Result<T, E> {
  success: boolean;
  data: T;
  error: E;

  constructor(success: boolean, data: T, error: E) {
    this.success = success;
    this.data = data;
    this.error = error;
  }

  isError(): this is { success: false; error: E } {
    return !this.success;
  }

  isOk(): this is { success: true; data: T } {
    return this.success;
  }
}

export function Ok<T, E>(data: T): Result<T, E> {
  return new Result<T, E>(true, data, undefined as any);
}

export function Err<T, E>(error: E): Result<T, E> {
  return new Result<T, E>(false, undefined as any, error);
}