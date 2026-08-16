import { downloadContentFromMessage } from "@whiskeysockets/baileys";
import sharp from "sharp";
export default {
  command: "sticker",
  aliases: ["s", "stiker"],
  description:
    "Reply to an image with this command to convert it into a sticker.",
  category: "converter",
  handler: async ({ sock, msg, reply }) => {
    const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
    const imageMessage = msg.message.imageMessage || quoted?.imageMessage;
    if (!imageMessage) {
      return reply(
        "Reply to an image with .sticker, or send an image with .sticker as the caption."
      );
    }
    await reply("Creating sticker...");
    const stream = await downloadContentFromMessage(imageMessage, "image");
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }
    const webpBuffer = await sharp(buffer)
      .resize(512, 512, { fit: "inside", withoutEnlargement: true })
      .webp()
      .toBuffer();
    await sock.sendMessage(
      msg.key.remoteJid,
      { sticker: webpBuffer },
      { quoted: msg }
    );
  },
};
