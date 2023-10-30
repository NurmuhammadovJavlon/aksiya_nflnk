const { Markup } = require("telegraf");
const bot = require("../../connection/token.connection");

module.exports = bot.start(async (ctx) => {
   try {
      return ctx.reply("Here you can configure the bot!");
   } catch (e) {
      console.log(e);
   }
});