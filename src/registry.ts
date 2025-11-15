import { Context, MiddlewareFn, StorageAdapter } from "grammy";

import { RegistryValue } from "./registry-value.ts";

/**
 * Options for configuring the registry.
 */
export interface RegistryOptions<C extends Context = Context> {
  /**
   * An optional prefix to prepend to the storage key.
   */
  prefix?: string;

  /**
   * This option lets you generate your own storage keys per context object.
   * The default implementation stores data per user ID.
   */
  getStorageKey?: (
    ctx: Omit<C, "registry">,
  ) => Promise<string | undefined> | string | undefined;

  /**
   * A storage adapter to your storage solution. Provides read, write, and
   * delete access to the registry middleware.
   *
   * You must provide a storage adapter. Example with memory storage:
   * ```ts
   * import { MemorySessionStorage } from "grammy";
   * const storage = new MemorySessionStorage<Record<string, unknown>>();
   * ```
   */
  storage: StorageAdapter<Record<string, unknown>>;
}

export type RegistryFlavor<
  C extends Context,
  T extends Record<string, RegistryValue<unknown>>,
> = C & {
  registry: Registry<C, T>;
};

export class Registry<
  C extends Context,
  T extends Record<string, RegistryValue<unknown>>,
> {
  private store: T;
  private options: RegistryOptions<C>;

  constructor(options: RegistryOptions<C>) {
    this.store = {} as T;
    this.options = options;
  }

  set(id: keyof T, value: T[keyof T]): void {
    this.store[id] = value;
  }

  get(id: keyof T): T[keyof T] | undefined {
    return this.store[id];
  }

  has(id: keyof T): boolean {
    return !!this.store[id];
  }

  middleware(): MiddlewareFn<RegistryFlavor<C, T>> {
    return async (ctx, next) => {
      ctx.registry = this;
      await next();
    };
  }
}
