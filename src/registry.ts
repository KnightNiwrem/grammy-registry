import { Context, MiddlewareFn, StorageAdapter } from "grammy";

import { RegistryValue } from "./registry-value.ts";

type RegistryStorageKeyGetter<C extends Context> = (
  ctx: Omit<C, "registry">,
) => Promise<string | undefined> | string | undefined;

function defaultRegistryStorageKey(ctx: Context): string | undefined {
  return ctx.from?.id.toString();
}

/**
 * Options for configuring a registry instance.
 */
export interface RegistryOption<C extends Context = Context> {
  /**
   * Optional storage adapter used to persist registry values.
   */
  storage?: StorageAdapter<Record<string, string>>;
  /**
   * Optional prefix to prepend to the storage key.
   */
  prefix?: string;
  /**
   * Custom function to determine the storage key for the current context.
   *
   * `storageKey` is kept as an alias to mirror the vault plugin's terminology.
   */
  storageKey?: RegistryStorageKeyGetter<C>;
  /**
   * Custom function to determine the storage key for the current context.
   */
  getStorageKey?: RegistryStorageKeyGetter<C>;
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
  private readonly storage?: StorageAdapter<Record<string, string>>;
  private readonly prefix: string;
  private readonly getStorageKey: RegistryStorageKeyGetter<C>;

  constructor(options?: RegistryOption<C>) {
    this.store = {} as T;
    this.storage = options?.storage;
    this.prefix = options?.prefix ?? "";
    this.getStorageKey = options?.storageKey ??
      options?.getStorageKey ??
      defaultRegistryStorageKey;
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
      let storageKey: string | undefined;

      if (this.storage) {
        const rawKey = await this.getStorageKey(ctx);

        if (rawKey === undefined) {
          throw new Error(
            "Cannot access registry data because the storage key is undefined! " +
              "This update does not have a user ID, or you provided a custom " +
              "storageKey/getStorageKey function that returned undefined.",
          );
        }

        storageKey = this.prefix + rawKey;
        const storedData = await this.storage.read(storageKey);

        if (storedData !== undefined) {
          this.hydrateStore(storedData);
        }
      }

      ctx.registry = this;
      await next();

      if (this.storage && storageKey !== undefined) {
        await this.storage.write(storageKey, this.serializeStore());
      }
    };
  }

  private serializeStore(): Record<string, string> {
    const serialized: Record<string, string> = {};

    for (const key of Object.keys(this.store) as Array<keyof T & string>) {
      const registryValue = this.store[key];

      if (registryValue === undefined) {
        continue;
      }

      serialized[key] = registryValue.stringify(registryValue.value);
    }

    return serialized;
  }

  private hydrateStore(data: Record<string, string>): void {
    for (const [key, storedValue] of Object.entries(data)) {
      const registryValue = this.store[key as keyof T];

      if (registryValue === undefined) {
        continue;
      }

      registryValue.value = registryValue.reviver(storedValue);
    }
  }
}
