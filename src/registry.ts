import { Context, MiddlewareFn } from "https://deno.land/x/grammy@v1.38.3/mod.ts";

import { RegistryValue } from "./registry-value.ts";

export type RegistryFlavor<C extends Context, T extends Record<string, RegistryValue<unknown>>> = C & {
  registry: Registry<C, T>;
};

export class Registry<C extends Context, T extends Record<string, RegistryValue<unknown>>> {
  private store: T;

  constructor() {
    this.store = {} as T;
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
    }
  }
}
