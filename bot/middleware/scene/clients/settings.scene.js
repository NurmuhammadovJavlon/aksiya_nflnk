const { Markup, Scenes, Composer } = require("telegraf");
const { match } = require("telegraf-i18n");
const {
  getUser,
  UpdateUserLang,
  UpdatePhoneNumber,
} = require("../../../common/sequelize/user.sequelize");
const generateMainMenuKeys = require("../../../functions/keyboards/main-menu.keyboard");

const initStep = new Composer();
initStep.hears(match("settingsBtn"), async (ctx) => {
  try {
    ctx.wizard.state.settingsData = {};
    const chatID = String(ctx.chat.id);
    const user = await getUser(chatID);
    ctx.wizard.state.settingsData.phoneNumber = user.phoneNumber;
    ctx.wizard.state.settingsData.score = user.score;
    ctx.wizard.state.settingsData.lang =
      user.preferedLanguageCode === "uz"
        ? "🇺🇿 O'zbek"
        : user.preferedLanguageCode === "ru"
        ? "🇷🇺 Русский"
        : null;
    ctx.wizard.state.settingsData.caption = ctx.i18n.t(
      "Client.settingsInitialCaption",
      {
        lang: ctx.wizard.state.settingsData.lang,
        number: ctx.wizard.state.settingsData.phoneNumber,
        score: ctx.wizard.state.settingsData.score,
      }
    );
    ctx.wizard.state.settingsData.initialKeyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback(ctx.i18n.t("Client.langOfBot"), "lang"),
        Markup.button.callback(
          ctx.i18n.t("Client.userPhoneNumberBtn"),
          "phoneNumber"
        ),
      ],
      [
        Markup.button.callback(
          ctx.i18n.t("Client.MainMenuBtn"),
          "backToMainMenu"
        ),
      ],
    ]);
    await ctx.reply("...", Markup.removeKeyboard());
    await ctx.deleteMessage(ctx.message.message_id + 1);
    await ctx.reply(
      ctx.wizard.state.settingsData.caption,
      ctx.wizard.state.settingsData.initialKeyboard
    );
  } catch (error) {
    console.log(error);
  }
});
initStep.action("lang", async (ctx) => {
  try {
    const updateMsg = ctx.update.callback_query.message.message_id;
    const langKeyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback("🇺🇿 O'zbek", "uz"),
        Markup.button.callback("🇷🇺 Русский", "ru"),
      ],
      [
        Markup.button.callback(
          ctx.i18n.t("Client.backOneStepMsg"),
          "backtoSettings"
        ),
      ],
      [
        Markup.button.callback(
          ctx.i18n.t("Client.MainMenuBtn"),
          "backToMainMenu"
        ),
      ],
    ]);
    ctx.editMessageText(ctx.wizard.state.settingsData.caption, langKeyboard);
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});
initStep.action("backToMainMenu", async (ctx) => {
  try {
    ctx.wizard.state.settingsData = {};
    ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    const mainMenu = {
      text: ctx.i18n.t("choosePromotion"),
      buttons: await generateMainMenuKeys(ctx),
    };
    ctx.reply(mainMenu.text, mainMenu.buttons);
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});
initStep.action("phoneNumber", async (ctx) => {
  try {
    const phoneNumberSettingsCaption = ctx.i18n.t(
      "Client.phoneNumberSettingsCaption",
      {
        lang: ctx.wizard.state.settingsData.lang,
        number: ctx.wizard.state.settingsData.phoneNumber,
        score: ctx.wizard.state.settingsData.score,
      }
    );
    const newKeyword = Markup.keyboard([
      [Markup.button.contactRequest(ctx.i18n.t("Client.sendPhoneNumberMsg"))],
      [
        Markup.button.text(ctx.i18n.t("Client.backOneStepMsg")),
        Markup.button.text(ctx.i18n.t("Client.MainMenuBtn")),
      ],
    ]).resize();
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.reply(phoneNumberSettingsCaption, newKeyword);
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});

const secondStep = new Composer();
secondStep.action(["uz", "ru"], async (ctx) => {
  try {
    const match = ctx.update.callback_query.data;

    if (match === "uz" || match === "ru") {
      ctx.i18n.locale(match);
      ctx.wizard.state.settingsData.lang =
        ctx.i18n.locale() === "uz"
          ? "🇺🇿 O'zbek"
          : ctx.i18n.locale() === "ru"
          ? "🇷🇺 Русский"
          : null;
      ctx.wizard.state.settingsData.caption = ctx.i18n.t(
        "Client.settingsInitialCaption",
        {
          lang: ctx.wizard.state.settingsData.lang,
          number: ctx.wizard.state.settingsData.phoneNumber,
          score: ctx.wizard.state.settingsData.score,
        }
      );
      ctx.wizard.state.settingsData.initialKeyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback(ctx.i18n.t("Client.langOfBot"), "lang"),
          Markup.button.callback(
            ctx.i18n.t("Client.userPhoneNumberBtn"),
            "phoneNumber"
          ),
        ],
        [
          Markup.button.callback(
            ctx.i18n.t("Client.MainMenuBtn"),
            "backToMainMenu"
          ),
        ],
      ]);
      await UpdateUserLang(match, String(ctx.chat.id));
      await ctx.editMessageText(
        ctx.wizard.state.settingsData.caption,
        ctx.wizard.state.settingsData.initialKeyboard
      );
      return ctx.wizard.back();
    }
    return;
  } catch (error) {
    console.log(error);
  }
});
secondStep.action("backToMainMenu", async (ctx) => {
  try {
    ctx.wizard.state.settingsData = {};
    ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    const mainMenu = {
      text: ctx.i18n.t("choosePromotion"),
      buttons: await generateMainMenuKeys(ctx),
    };
    ctx.reply(mainMenu.text, mainMenu.buttons);
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});
secondStep.action("backtoSettings", async (ctx) => {
  try {
    await ctx.editMessageText(
      ctx.wizard.state.settingsData.caption,
      ctx.wizard.state.settingsData.initialKeyboard
    );
    return ctx.wizard.back();
  } catch (error) {
    console.log(error);
  }
});
secondStep.on("contact", async (ctx) => {
  try {
    const contactNumber = ctx.message.contact?.phone_number?.replace(
      /\s+|\+|\D/g,
      ""
    );
    const mainMenu = await generateMainMenuKeys(ctx);
    await UpdatePhoneNumber(String(ctx.chat.id), contactNumber);
    await ctx.reply(ctx.i18n.t("Client.userPhoneUpdatedSuccessMsg"), mainMenu);
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});
secondStep.hears(match("Client.backOneStepMsg"), async (ctx) => {
  try {
    ctx.wizard.state.settingsData.caption = ctx.i18n.t(
      "Client.settingsInitialCaption",
      {
        lang: ctx.wizard.state.settingsData.lang,
        number: ctx.wizard.state.settingsData.phoneNumber,
        score: ctx.wizard.state.settingsData.score,
      }
    );
    ctx.wizard.state.settingsData.initialKeyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback(ctx.i18n.t("Client.langOfBot"), "lang"),
        Markup.button.callback(
          ctx.i18n.t("Client.userPhoneNumberBtn"),
          "phoneNumber"
        ),
      ],
      [
        Markup.button.callback(
          ctx.i18n.t("Client.MainMenuBtn"),
          "backToMainMenu"
        ),
      ],
    ]);
    await ctx.reply("...", Markup.removeKeyboard());
    await ctx.deleteMessage(ctx.message.message_id + 1);
    await ctx.reply(
      ctx.wizard.state.settingsData.caption,
      ctx.wizard.state.settingsData.initialKeyboard
    );
    return ctx.wizard.back();
  } catch (error) {
    console.log(error);
  }
});
secondStep.hears(match("Client.MainMenuBtn"), async (ctx) => {
  try {
    ctx.wizard.state.settingsData = {};
    const mainMenu = {
      text: ctx.i18n.t("choosePromotion"),
      buttons: await generateMainMenuKeys(ctx),
    };
    ctx.reply(mainMenu.text, mainMenu.buttons);
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});

module.exports = new Scenes.WizardScene("SettingsWizard", initStep, secondStep);
