declare function omit<T extends object, K extends keyof T>(
  object: T | null | undefined,
  ...paths: Array<K | K[]>
): Omit<T, K>;

declare function omit<T extends object>(
  object: T | null | undefined,
  ...paths: Array<string | string[]>
): Partial<T>;

export = omit;
