/**
 * Options for RegistryValue
 */
export type RegistryValueOptions<T> = {
  value: T;

  stringify?: (value: unknown) => string;
  reviver?: (value: string) => T;
};

/**
 * RegistryValue class
 */
export class RegistryValue<T> {
  public value: T;

  private stringifyFn: (value: unknown) => string;
  private reviverFn: (value: string) => T;

  constructor(options: RegistryValueOptions<T>) {
    this.value = options.value;
  
    this.stringifyFn = options.stringify ?? JSON.stringify;
    this.reviverFn = options.reviver ?? JSON.parse;
  }

  stringify(value: unknown): string {
    return this.stringifyFn(value);
  }

  reviver(value: string): T {
    return this.reviverFn(value);
  }
}
