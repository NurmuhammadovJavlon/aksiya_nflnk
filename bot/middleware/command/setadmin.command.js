const { Markup } = require("telegraf");
const bot = require("../../connection/token.connection");
const {
  SetAdminByPhoneNumber,
} = require("../../common/sequelize/user.sequelize");

module.exports = bot.command("setadmin", async (ctx) => {
  try {
    const inputString = ctx.update.message.text;
    const numericPart = inputString.match(/\d+/);
    superAdmin = 1193294102;

    if (ctx.chat.id === superAdmin) {
      if (numericPart) {
        const extractedNumber = numericPart[0];
        await SetAdminByPhoneNumber(extractedNumber);
        await ctx.reply("user is now admin");
      } else {
        console.log("No numeric part found in the string");
      }
    } else {
      await ctx.reply("you are not authorized");
    }
  } catch (e) {
    console.log(e);
  }
});
