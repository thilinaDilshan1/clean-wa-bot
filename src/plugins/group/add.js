export default {
  command: "add",
  description: "Add a member to the group. Usage: .add <phone number>",
  category: "group",
  groupOnly: true,
  adminOnly: true,
  handler: async ({ sock, msg, args, reply }) => {
    const number = args[0]?.replace(/[^0-9]/g, "");
    if (!number) {
      return reply("Usage: .add <phone number, digits only with country code>");
    }
    const jid = `${number}@s.whatsapp.net`;
    try {
      const result = await sock.groupParticipantsUpdate(
        msg.key.remoteJid,
        [jid],
        "add"
      );
      const status = result?.[0]?.status;
      if (status === "200") {
        await reply(`Added ${number}.`);
      } else {
        await reply(
          `Couldn't add ${number} directly (their privacy settings may require an invite link instead).`
        );
      }
    } catch (err) {
      await reply(`Failed to add ${number}: ${err.message}`);
    }
  },
};
