const bot = require("../../../../connection/token.connection");
const { match } = require("telegraf-i18n");

module.exports = bot.hears(
  match("AdminUserManagement.getInfoBtn"),
  async (ctx) => {
    try {
      return await ctx.scene.enter("ManageUserWizard");
    } catch (error) {
      console.log(error);
    }
  }
);
