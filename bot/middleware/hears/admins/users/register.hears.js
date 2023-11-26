const bot = require("../../../../connection/token.connection");
const { match } = require("telegraf-i18n");

module.exports = bot.hears(
  match("AdminUserManagement.registerUserBtn"),
  async (ctx) => {
    try {
      return await ctx.scene.enter("RegisterUserWizard");
    } catch (error) {
      console.log(error);
    }
  }
);
