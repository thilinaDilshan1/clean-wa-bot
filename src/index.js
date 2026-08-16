import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
} from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";
import { Boom } from "@hapi/boom";
import { config } from "./config.js";
import { logger } from "./lib/logger.js";
import { loadPlugins } from "./lib/loadPlugins.js";

async function start() {
  const commandMap = await loadPlugins();

  // Session credentials are stored ONLY in the local ./session folder,
  // which is gitignored. Nothing about auth ever leaves this machine
  // except the direct connection to WhatsApp's own servers.
  const { state, saveCreds } = await useMultiFileAuthState("session");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger: logger.child({ module: "baileys" }),
    printQRInTerminal: false, // we handle QR display ourselves below
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      qrcode.generate(qr, { small: true });
      logger.info("Scan the QR code above with WhatsApp > Linked Devices.");
    }

    if (connection === "close") {
      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      logger.warn(`Connection closed. Reconnecting: ${shouldReconnect}`);
      if (shouldReconnect) start();
    } else if (connection === "open") {
      logger.info(`${config.botName} connected.`);
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    for (const msg of messages) {
      try {
        await handleMessage(sock, msg, commandMap);
      } catch (err) {
        // Errors are logged loudly, never swallowed silently and never eval'd.
        logger.error({ err }, "Error handling message");
      }
    }
  });
}

async function handleMessage(sock, msg, commandMap) {
  if (!msg.message) return;

  const remoteJid = msg.key.remoteJid;
  const isGroup = remoteJid.endsWith("@g.us");
  // When you send a message yourself (fromMe), Baileys doesn't include a
  // "participant" field the way it does for other people's messages — the
  // sender IS the bot's own linked account in that case.
  const senderJid = msg.key.fromMe
    ? sock.user.id
    : isGroup
    ? msg.key.participant
    : remoteJid;

  const body =
    msg.message.conversation ||
    msg.message.extendedTextMessage?.text ||
    "";

  if (!body.startsWith(config.prefix)) return;

  const [rawCommand, ...args] = body.slice(config.prefix.length).trim().split(/\s+/);
  const command = rawCommand.toLowerCase();
  const plugin = commandMap.get(command);
  if (!plugin) return;

  // --- Permission checks happen here, in one place, not inside every plugin ---
  const senderNumber = senderJid?.split("@")[0];
  const isOwner = senderNumber === config.ownerNumber;

  if (plugin.ownerOnly && !isOwner) {
    return sock.sendMessage(remoteJid, { text: "This command is owner-only." });
  }
  if (plugin.groupOnly && !isGroup) {
    return sock.sendMessage(remoteJid, { text: "This command only works in groups." });
  }
  if (plugin.adminOnly) {
    const metadata = await sock.groupMetadata(remoteJid);
    const senderIsAdmin = metadata.participants.some(
      (p) => p.id === senderJid && (p.admin === "admin" || p.admin === "superadmin")
    );
    if (!senderIsAdmin && !isOwner) {
      return sock.sendMessage(remoteJid, { text: "This command requires group admin rights." });
    }
  }

  // Resolve a mentioned or replied-to user, for commands like kick.
  const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
  const repliedTo = msg.message.extendedTextMessage?.contextInfo?.participant;
  const targetJid = mentioned || repliedTo || null;

  const reply = (text) => sock.sendMessage(remoteJid, { text }, { quoted: msg });

  await plugin.handler({
    sock,
    msg,
    args,
    reply,
    commandMap,
    config,
    isOwner,
    isGroup,
    targetJid,
  });
}

start().catch((err) => {
  logger.error({ err }, "Fatal startup error");
  process.exit(1);
});
