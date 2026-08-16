export default {
  command: "ping",
  aliases: ["speed"],
  description: "Check the bot's response time.",
  category: "core",
  handler: async ({ sock, msg, reply }) => {
    const start = Date.now();
    await reply("Pinging...");
    const ms = Date.now() - start;
    await reply(`Pong! ${ms}ms`);
  },
};
