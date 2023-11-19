const bot = require("../../../../connection/token.connection");
const { match } = require("telegraf-i18n");
const CompanyInfo = require("../../../../model/companyInfo.model");

const getCompanyInfo = async () => {
  try {
    const companyInfo = await CompanyInfo.findOne({ raw: true });
    if (!companyInfo) return null;
    return companyInfo;
  } catch (error) {
    console.log(error);
  }
};

module.exports = bot.hears(match("aboutCompanyBtn"), async (ctx) => {
  try {
    const companyInfo = await getCompanyInfo();
    if (!companyInfo) return ctx.reply("404");
    const caption =
      ctx.i18n.locale() === "uz" ? companyInfo.text_uz : companyInfo.text_ru;
    await ctx.replyWithHTML(caption);
  } catch (error) {
    console.log(error);
  }
});
