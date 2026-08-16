# clean-wa-bot

A minimal, fully-readable WhatsApp bot built on [Baileys](https://github.com/WhiskeySockets/Baileys).
Every line of code in this repo is plain, unobfuscated JavaScript you can read top to bottom.

## Setup

```bash
npm install
cp .env.example .env
# edit .env — set OWNER_NUMBER to your own number (digits only, e.g. 947XXXXXXXX)
npm start
```

Scan the QR code that appears in your terminal with WhatsApp → Linked Devices.
Your session is saved locally in `./session/` (gitignored) so you don't need to re-scan on restart.

## Adding a command

Create a new file anywhere under `src/plugins/`, e.g. `src/plugins/tools/weather.js`:

```js
export default {
  command: "weather",
  description: "Get the weather for a city.",
  category: "tools",
  handler: async ({ reply, args }) => {
    const city = args.join(" ");
    if (!city) return reply("Usage: !weather <city>");
    // ...call a weather API here...
    await reply(`Weather for ${city}: ...`);
  },
};
```

It's picked up automatically on the next restart — no manual registration step.

## Security decisions, and why they're different from typical "MD bot" forks

If you've compared this against bots like Phoenix-MD, here's what's deliberately different:

1. **No obfuscation, anywhere.** Every file is readable as-is. If you (or anyone reviewing
   a PR) can't understand what a command does by reading it, that's a bug to fix, not a
   feature to protect with a minifier.

2. **No `eval()` / `new Function()` / remote code execution of any kind.** Commands are
   plain functions shipped in this repo. There is no `plugin <url>` command that installs
   code from an external Gist or URL at runtime — that pattern lets anyone who convinces
   you to run a link execute arbitrary code with your bot's WhatsApp session attached.
   If you want a plugin marketplace later, do it via reviewed pull requests, not runtime
   fetches.

3. **Permission checks live in one place** (`src/index.js`), not scattered inside each
   plugin. `ownerOnly`, `groupOnly`, and `adminOnly` are enforced centrally before a
   handler ever runs, so a bug in one plugin can't accidentally skip a permission check.

4. **Secrets never touch the source tree.** `OWNER_NUMBER` and any future API keys live in
   `.env` (gitignored). `config.js` reads from `process.env` only.

5. **Session data stays local.** `useMultiFileAuthState("session")` writes only to your own
   disk. Nothing about your WhatsApp session is sent anywhere except WhatsApp's own servers
   via the Baileys socket connection.

6. **Dependencies are few and well-known**: Baileys itself, `dotenv`, `pino` for logging,
   and `qrcode-terminal`. Check `npm audit` periodically as you add more.

## A note on WhatsApp's Terms of Service

Unofficial clients like Baileys are not sanctioned by WhatsApp/Meta, and using one carries
a real risk of the linked account being banned. This is true of any bot built this way,
including this one — use a secondary number for testing, not your primary account.
