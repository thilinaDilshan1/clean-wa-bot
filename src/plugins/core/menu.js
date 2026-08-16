export default {
  command: "menu",
  aliases: ["list", "help"],
  description: "List all available commands.",
  category: "core",
  handler: async ({ reply, commandMap, config }) => {
    const byCategory = {};
    const seen = new Set();

    for (const plugin of commandMap.values()) {
      if (seen.has(plugin.command)) continue; // avoid listing aliases twice
      seen.add(plugin.command);
      const cat = plugin.category || "misc";
      byCategory[cat] = byCategory[cat] || [];
      byCategory[cat].push(plugin);
    }

    let text = `*${config.botName} — Command Menu*\n\n`;
    for (const [category, plugins] of Object.entries(byCategory)) {
      text += `*${category.toUpperCase()}*\n`;
      for (const p of plugins) {
        text += `${config.prefix}${p.command} — ${p.description}\n`;
      }
      text += "\n";
    }

    await reply(text.trim());
  },
};
