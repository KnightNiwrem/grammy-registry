/**
 * Example bot demonstrating the text vault plugin.
 *
 * To run this example:
 * 1. Set your bot token: export BOT_TOKEN="your-token-here"
 * 2. Run: deno run --allow-net --allow-env example.ts
 */

import { Bot, MemorySessionStorage } from "grammy";
import type { Context } from "grammy";
import { Registry, type RegistryFlavor } from "../src/registry.ts";
import { RegistryValue } from "../src/registry-value.ts";

type MyRegistries = {
  users: RegistryValue<Map<string, string>>;
};

type RegistryContext = RegistryFlavor<Context, MyRegistries>;

const token = Deno.env.get("BOT_TOKEN");
if (!token) {
  console.error("BOT_TOKEN environment variable is required!");
  Deno.exit(1);
}

const bot = new Bot<RegistryContext>(token);
const registry = new Registry<Context, MyRegistries>({
  storage: new MemorySessionStorage<Record<string, unknown>>(),
});
bot.use(registry);

bot.start();
