export default {
  command: "reboot",
  description: "Restart the bot process (owner only).",
  category: "owner",
  ownerOnly: true, // index.js checks this before the handler ever runs
  handler: async ({ reply }) => {
    await reply("Restarting...");
    process.exit(0); // rely on a process manager (pm2, systemd, Docker) to restart
  },
};
