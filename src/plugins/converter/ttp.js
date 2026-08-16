import sharp from "sharp";
function escapeXml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
export default {
  command: "ttp",
  aliases: ["attp"],
  description: "Turn text into a sticker. Usage: .ttp <text>",
  category: "converter",
  handler: async ({ args, reply, sock, msg }) => {
    const text = args.join(" ");
    if (!text) return reply("Usage: .ttp <text>");
    if (text.length > 30)
      return reply(
        "Keep it under 30 characters so it stays readable on a sticker."
      );
    const svg = ` <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg"> <text x="50%" y="50%" font-size="60" font-family="sans-serif" font-weight="bold" fill="white" stroke="black" stroke-width="4" text-anchor="middle" dominant-baseline="middle"> ${escapeXml(
      text
    )} </text> </svg> `;
    const webpBuffer = await sharp(Buffer.from(svg)).webp().toBuffer();
    await sock.sendMessage(
      msg.key.remoteJid,
      { sticker: webpBuffer },
      { quoted: msg }
    );
  },
};
