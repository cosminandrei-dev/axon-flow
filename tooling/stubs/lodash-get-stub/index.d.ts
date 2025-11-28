declare function get<TObject extends object, TKey extends keyof TObject>(
  object: TObject,
  path: TKey | [TKey]
): TObject[TKey];

declare function get<TObject extends object, TKey extends keyof TObject, TDefault>(
  object: TObject | null | undefined,
  path: TKey | [TKey],
  defaultValue: TDefault
): TObject[TKey] | TDefault;

declare function get<T>(
  object: unknown,
  path: string | Array<string | number>,
  defaultValue?: T
): T;

export = get;
