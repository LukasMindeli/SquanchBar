require("dotenv").config();
const { Telegraf, Markup } = require("telegraf");

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL;

if (!BOT_TOKEN) {
  console.error("ERROR: BOT_TOKEN is missing in .env");
  process.exit(1);
}
if (!WEBAPP_URL) {
  console.error("ERROR: WEBAPP_URL is missing in .env");
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

bot.start((ctx) => {
  return ctx.reply(
    "Привет! Открывай меню 👇",
    Markup.inlineKeyboard([Markup.button.url("Открыть меню", WEBAPP_URL)])
  );
});

bot.launch().then(() => console.log("Bot started"));

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));