const bot = require("../../connection/token.connection");

module.exports = bot.command("commands", async (ctx) => {
   try {
      return ctx.setMyCommands([
         { command: "start", description: "Launch the bot" },
         { command: "help", description: "Bot support" },
         { command: "setting", description: "Setting up the bot" }
      ]);
   } catch (e) {
      console.log(e);
   }
});