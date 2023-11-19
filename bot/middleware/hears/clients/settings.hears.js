const bot = require("../../../connection/token.connection");
const { match } = require("telegraf-i18n");

module.exports = bot.hears(match("settingsBtn"), async (ctx) => {
  try {
    return ctx.scene.enter("SettingsWizard");
  } catch (error) {
    console.log(error);
  }
});
