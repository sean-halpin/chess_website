export class Option<T> {
  // #region Properties (2)

  private kind: "Some" | "None";
  private value?: T;

  // #endregion Properties (2)

  // #region Constructors (1)

  private constructor(kind: "Some" | "None", value?: T) {
    this.kind = kind;
    if (value !== undefined) {
      this.value = value;
    }
  }

  // #endregion Constructors (1)

  // #region Public Static Methods (2)

  public static None(): Option<never> {
    return new Option<never>("None");
  }

  static Some<T>(value: T): Option<T> {
    return new Option<T>("Some", value);
  }

  // #endregion Public Static Methods (2)

  // #region Public Methods (3)

  public isNone(): boolean {
    return this.kind === "None";
  }

  public isSome(): boolean {
    return this.kind === "Some";
  }

  public unwrap(): T {
    if (this.isSome()) {
      return this.value as T;
    } else {
      throw new Error("Cannot unwrap None");
    }
  }

  // #endregion Public Methods (3)
}

export function Some<T>(value: T): Option<T> {
  return Option.Some<T>(value);
}

export const None: Option<never> = Option.None();

export function isSome<T>(option: Option<T>): boolean {
  return option.isSome();
}

export function isNone<T>(option: Option<T>): boolean {
  return option.isNone();
}

export function unwrap<T>(option: Option<T>): T {
  return option.unwrap();
}
