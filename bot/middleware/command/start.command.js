const { Markup } = require("telegraf");
const bot = require("../../connection/token.connection");
const { getUser } = require("../../common/sequelize/user.sequelize");
const generateMainMenuKeys = require("../../functions/keyboards/main-menu.keyboard");
const sendOtpSMSCode = require("../../functions/eskiz_sms/sendSms");

module.exports = bot.start(async (ctx) => {
  try {
    const chatID = String(ctx.chat.id);
    const userExist = await getUser(chatID);

    // Texts
    const helloMsg =
      "Уважаемые участники! Добро пожаловать в бот акций компании Alutex. Мы ценим ваш интерес к нашим акциям и стремимся сделать ваше участие максимально удобным и выгодным.\n\nHurmatli ishtirokchilar! Alutex aksiyalar botiga xush kelibsiz. Aksiyalarimizga qiziqishingizni qadrlaymiz va ishtirokingizni qulay va foydali qilishga intilamiz.";
    const greeting = {
      text: "Iltimos, tilni tanlang!\nПожалуйста, выберите язык!",
      langButtons: [
        [
          { text: "O'zbek", callback_data: "lang_uz" },
          { text: "Russian", callback_data: "lang_ru" },
        ],
      ],
    };

    const welcome = {
      text: ctx.i18n.t("choosePromotion"),
      buttons: await generateMainMenuKeys(ctx),
    };

    if (!userExist) {
      await ctx.reply(helloMsg);
      await ctx.reply(greeting.text, {
        reply_markup: {
          inline_keyboard: greeting.langButtons,
        },
      });
      return ctx.scene.enter("InitialForm");
    }
    return ctx.reply(welcome.text, welcome.buttons);
  } catch (e) {
    console.log(e);
  }
});
