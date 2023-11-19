const { GetUserScore } = require("../../../common/sequelize/user.sequelize");
const bot = require("../../../connection/token.connection");
const { match } = require("telegraf-i18n");

module.exports = bot.hears(match("Score.myscoreBtn"), async (ctx) => {
  try {
    const score = await GetUserScore(String(ctx.chat.id));
    ctx.reply(ctx.i18n.t("Client.totalScoreMsg", { score }));
  } catch (error) {
    console.log(error);
  }
});
