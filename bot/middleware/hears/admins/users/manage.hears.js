const bot = require("../../../../connection/token.connection");
const { match } = require("telegraf-i18n");
const generateUserManagementAdminKeys = require("../../../../functions/keyboards/admins/manageUser.keyboard");

module.exports = bot.hears(match("Admin.usersBtn"), async (ctx) => {
  try {
    const menu = await generateUserManagementAdminKeys(ctx);
    await ctx.reply(ctx.i18n.t("AdminUserManagement.panelTxt"), menu);
  } catch (error) {
    console.log(error);
  }
});

// module.exports = bot.hears(match("Admin.usersBtn"), async (ctx) => {
//   return await ctx.scene.enter("ManageUserWizard");
// });
