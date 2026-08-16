import { readdirSync, statSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { logger } from "./logger.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLUGINS_DIR = join(__dirname, "..", "plugins");

/**
 * Recursively finds every .js file under src/plugins/.
 * Deliberately does NOT accept a URL, gist link, or any other
 * runtime source — every command your bot can run is a file
 * that's physically in your repo and reviewable in a PR/diff.
 */
function findPluginFiles(dir) {
  let files = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      files = files.concat(findPluginFiles(fullPath));
    } else if (entry.endsWith(".js")) {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * Loads all plugins into a single command map.
 * Each plugin file must export a default object shaped like:
 * {
 *   command: "ping",
 *   aliases: ["pong"],       // optional
 *   description: "...",
 *   category: "core",
 *   ownerOnly: false,        // optional, defaults false
 *   groupOnly: false,        // optional, defaults false
 *   adminOnly: false,        // optional, defaults false — requires sender to be a group admin
 *   handler: async (ctx) => { ... }
 * }
 */
export async function loadPlugins() {
  const commandMap = new Map();
  const files = findPluginFiles(PLUGINS_DIR);

  for (const file of files) {
    const mod = await import(pathToFileURL(file).href);
    const plugin = mod.default;

    if (!plugin || !plugin.command || typeof plugin.handler !== "function") {
      logger.warn(`Skipped invalid plugin file: ${file}`);
      continue;
    }

    const names = [plugin.command, ...(plugin.aliases || [])];
    for (const name of names) {
      if (commandMap.has(name)) {
        logger.warn(`Duplicate command "${name}" in ${file} — overwriting.`);
      }
      commandMap.set(name.toLowerCase(), plugin);
    }
  }

  logger.info(`Loaded ${files.length} plugin file(s), ${commandMap.size} command name(s) total.`);
  return commandMap;
}
