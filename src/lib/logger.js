import pino from "pino";

// A plain, readable logger — every action the bot takes should be
// traceable in the console. Nothing about this bot's behavior should
// require reverse-engineering to understand.
export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: {
    target: "pino-pretty",
    options: { colorize: true, translateTime: "SYS:standard" },
  },
});
