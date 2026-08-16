export default {
  command: "kick",
  description: "Remove a mentioned/replied-to member from the group (admins only).",
  category: "group",
  groupOnly: true,
  adminOnly: true, // index.js verifies the SENDER is a real group admin before calling this
  handler: async ({ sock, msg, reply, targetJid }) => {
    if (!targetJid) {
      return reply("Mention or reply to the user you want to remove.");
    }

    // Baileys re-checks group metadata itself, but we already verified
    // the sender's admin status in index.js before we got here — this
    // handler never has to trust anything the message claims about itself.
    await sock.groupParticipantsUpdate(msg.key.remoteJid, [targetJid], "remove");
    await reply("Done.");
  },
};
