const bot = require("../../../../connection/token.connection");
const { match } = require("telegraf-i18n");
const CompanyInfo = require("../../../../model/companyInfo.model");
const ContactInfo = require("../../../../model/contactInfo.mode");

const getContactInfo = async () => {
  try {
    const contactInfo = await ContactInfo.findOne({ raw: true });
    if (!contactInfo) return null;
    return contactInfo;
  } catch (error) {
    console.log(error);
  }
};

module.exports = bot.hears(match("contactsBtn"), async (ctx) => {
  try {
    const contactInfo = await getContactInfo();
    if (!contactInfo) return ctx.reply("404");
    const caption =
      ctx.i18n.locale() === "uz" ? contactInfo.text_uz : contactInfo.text_ru;
    await ctx.replyWithHTML(caption);
  } catch (error) {
    console.log(error);
  }
});
