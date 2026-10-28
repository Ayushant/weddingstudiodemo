import { defineConfig as baseDefineConfig } from "@lovable.dev/vite-tanstack-config";
import type { ConfigEnv, PluginOption, UserConfig } from "vite";

const rawConfigFn = baseDefineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
}) as (env: ConfigEnv) => Promise<UserConfig>;

function filterPluginOption(plugin: PluginOption): PluginOption {
  if (!plugin) return plugin;
  if (Array.isArray(plugin)) {
    return plugin.map(filterPluginOption).filter(Boolean);
  }
  if (typeof plugin === "object" && "name" in plugin && typeof plugin.name === "string") {
    if (
      plugin.name.startsWith("@tanstack/devtools") ||
      plugin.name.startsWith("lovable:assets-proxy")
    ) {
      return null;
    }
  }
  return plugin;
}

export default async function defineConfig(env: ConfigEnv): Promise<UserConfig> {
  const resolved = await rawConfigFn(env);
  if (Array.isArray(resolved.plugins)) {
    resolved.plugins = resolved.plugins.map(filterPluginOption).filter(Boolean);
  }
  return resolved;
}
