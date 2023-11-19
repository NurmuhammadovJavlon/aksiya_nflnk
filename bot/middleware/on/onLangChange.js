const {
  SaveUser,
  UpdateUserLang,
  getUser,
} = require("../../common/sequelize/user.sequelize");
const bot = require("../../connection/token.connection");

module.exports = bot.on("callback_query", async (ctx) => {
  try {
    const chatID = String(ctx.chat.id);
    const firstName = ctx.chat.first_name;
    const lastName = ctx.chat.last_name;
    const username = ctx.chat.username ?? "anonymous";
    const userExist = await getUser(chatID);

    // set Language
    if (ctx.callbackQuery.data === "lang_uz") {
      ctx.i18n.locale("uz");
    } else if (ctx.callbackQuery.data === "lang_ru") {
      ctx.i18n.locale("ru");
    }

    if (!userExist) {
      const res = await SaveUser(
        chatID,
        username,
        firstName,
        lastName,
        ctx.i18n.locale()
      );
      console.log(res);
    } else {
      UpdateUserLang(ctx.i18n.locale(), chatID);
    }

    ctx.reply(ctx.i18n.t("enterPhoneNumber"));

    return ctx.scene.enter("PhoneNumber");
  } catch (error) {
    console.log(error);
  }
});
