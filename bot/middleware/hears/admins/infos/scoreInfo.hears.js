const bot = require("../../../../connection/token.connection");
const { match } = require("telegraf-i18n");

module.exports = bot.hears(match("Admin.scoreInfoBtn"), async (ctx) => {
  try {
    return ctx.scene.enter("ScoreWizard");
  } catch (error) {
    console.log(error);
  }
});
