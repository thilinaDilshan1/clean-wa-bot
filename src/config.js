import "dotenv/config";

// Fail loudly instead of silently running with bad config —
// this is deliberately the opposite of "hide what's happening".
function required(name, fallback = undefined) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  prefix: process.env.PREFIX || "!",
  ownerNumber: process.env.OWNER_NUMBER || "", // digits only, no "+"
  botName: process.env.BOT_NAME || "CleanBot",
};
