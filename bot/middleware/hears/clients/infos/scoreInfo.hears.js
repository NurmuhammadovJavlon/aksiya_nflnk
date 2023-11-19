const bot = require("../../../../connection/token.connection");
const { match } = require("telegraf-i18n");
const CompanyInfo = require("../../../../model/companyInfo.model");
const ContactInfo = require("../../../../model/contactInfo.mode");
const ScoreInfo = require("../../../../model/scoreInfo.model");

const getScoreInfo = async () => {
  try {
    const scoreInfo = await ScoreInfo.findOne({ raw: true });
    if (!scoreInfo) return null;
    return scoreInfo;
  } catch (error) {
    console.log(error);
  }
};

module.exports = bot.hears(match("Score.infoAboutScorebtn"), async (ctx) => {
  try {
    const scoreInfo = await getScoreInfo();
    if (!scoreInfo) return ctx.reply("404");
    const caption =
      ctx.i18n.locale() === "uz" ? scoreInfo.text_uz : scoreInfo.text_ru;
    await ctx.replyWithHTML(caption);
  } catch (error) {
    console.log(error);
  }
});
