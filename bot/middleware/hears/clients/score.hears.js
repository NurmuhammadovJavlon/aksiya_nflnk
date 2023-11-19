const bot = require("../../../connection/token.connection");
const { match } = require("telegraf-i18n");
const generateScorePageButtons = require("../../../functions/keyboards/clients/getScoreKeyboard");

module.exports = bot.hears(match("scoresBtn"), async (ctx) => {
  try {
    const scorePanel = {
      text: ctx.i18n.t("Score.scoresMenu"),
      buttons: generateScorePageButtons(ctx),
    };
    await ctx.reply(scorePanel.text, scorePanel.buttons);
  } catch (error) {
    console.log(error);
  }
});
