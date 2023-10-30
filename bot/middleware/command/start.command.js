const { Markup } = require("telegraf");
const bot = require("../../connection/token.connection");
const db = require("../../connection/db.connection");
const UserModel = require("../../model/user.model");
const { SaveUser } = require("../../common/sequelize/saveUser.sequelize");
const { CheckUser } = require("../../common/sequelize/checkUser.sequelize");

module.exports = bot.start(async (ctx) => {
  try {
    const chatID = String(ctx.chat.id);
    const firstName = ctx.chat.first_name;
    const lastName = ctx.chat.last_name;
    const username = ctx.chat.username ?? "anonymous";

    const userExist = await CheckUser(chatID);

    // Texts
    const greeting = {
      text: "Salom, mos tilni tanlang",
      langButtons: [
        [
          { text: "O'zbek", callback_data: "uz" },
          { text: "Russian", callback_data: "ru" },
        ],
      ],
    };

    if (!userExist) {
      ctx.reply(greeting.text, {
        reply_markup: {
          inline_keyboard: greeting.langButtons,
        },
      });
      return ctx.scene.enter("LanguageWizard");
    }
    return ctx.reply(ctx.i18n.t("greeting"));
  } catch (e) {
    console.log(e);
  }
});
