import { downloadContentFromMessage } from "@whiskeysockets/baileys";
import sharp from "sharp";
export default {
  command: "photo",
  aliases: ["toimg"],
  description: "Reply to a sticker with this to convert it back into an image.",
  category: "converter",
  handler: async ({ sock, msg, reply }) => {
    const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
    const stickerMessage = msg.message.stickerMessage || quoted?.stickerMessage;
    if (!stickerMessage) {
      return reply(
        "Reply to a sticker with .photo to convert it back into an image."
      );
    }
    await reply("Converting...");
    const stream = await downloadContentFromMessage(stickerMessage, "sticker");
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }
    const pngBuffer = await sharp(buffer).png().toBuffer();
    await sock.sendMessage(
      msg.key.remoteJid,
      { image: pngBuffer },
      { quoted: msg }
    );
  },
};
