export type Option<T> =
  | {
      kind: "Some";
      value: T;
    }
  | {
      kind: "None";
    };

export function Some<T>(value: T): Option<T> {
  return {
    kind: "Some",
    value: value,
  };
}

export const None: Option<never> = {
  kind: "None",
};

export function isSome<T>(option: Option<T>): boolean {
  return option.kind === "Some";
}

export function isNone<T>(option: Option<T>): boolean {
  return option.kind === "None";
}

export function unwrap<T>(option: Option<T>): T {
  if (option.kind === "Some") {
    return option.value;
  } else {
    throw new Error("Cannot unwrap None");
  }
}
