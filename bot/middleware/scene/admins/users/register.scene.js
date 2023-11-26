const { Markup, Scenes, Composer } = require("telegraf");
const { match } = require("telegraf-i18n");
const generateUserManagementAdminKeys = require("../../../../functions/keyboards/admins/manageUser.keyboard");
const {
  getUserLang,
  GetUserByNumber,
  SaveUser,
} = require("../../../../common/sequelize/user.sequelize");

const Leave = async (ctx) => {
  try {
    const keyboard = generateUserManagementAdminKeys(ctx);
    await ctx.reply(ctx.i18n.t("Client.applicationCanceledMsg"), keyboard);
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
};

const startStep = new Composer();
startStep.hears(match("AdminUserManagement.registerUserBtn"), async (ctx) => {
  try {
    ctx.wizard.state.formData = {};
    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback(
          ctx.i18n.t("Client.cancelApplicationBtn"),
          `cancel`
        ),
      ],
    ]);
    await ctx.reply(ctx.i18n.t("AdminUserManagement.enterUserName"), keyboard);
  } catch (e) {
    console.log(e);
  }
});
startStep.action("cancel", async (ctx) => {
  try {
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await Leave(ctx);
  } catch (error) {
    console.log(error);
  }
});
startStep.on("message", async (ctx) => {
  try {
    ctx.wizard.state.formData.firstName = ctx.message.text;
    ctx.wizard.state.formData.mainKeyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback(ctx.i18n.t("Client.backOneStepMsg"), `back`),
        Markup.button.callback(
          ctx.i18n.t("Client.cancelApplicationBtn"),
          `cancel`
        ),
      ],
    ]);
    await ctx.reply(
      ctx.i18n.t("AdminUserManagement.enterUserLastName"),
      ctx.wizard.state.formData.mainKeyboard
    );
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});

const getLastNameStep = new Composer();
getLastNameStep.action("cancel", async (ctx) => {
  try {
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await Leave(ctx);
  } catch (error) {
    console.log(error);
  }
});
getLastNameStep.action("back", async (ctx) => {
  try {
    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback(
          ctx.i18n.t("Client.cancelApplicationBtn"),
          `cancel`
        ),
      ],
    ]);
    await ctx.editMessageText(
      ctx.i18n.t("AdminUserManagement.enterUserName"),
      keyboard
    );
    return ctx.wizard.back();
  } catch (error) {
    console.log(error);
  }
});
getLastNameStep.on("message", async (ctx) => {
  try {
    ctx.wizard.state.formData.lastName = ctx.message.text;
    const langMsg = {
      text: ctx.i18n.t("AdminUserManagement.chooseUserLangMsg"),
      langButtons: Markup.inlineKeyboard([
        [
          Markup.button.callback("O'zbek", "lang_uz"),
          Markup.button.callback("Russian", "lang_ru"),
        ],
        [
          Markup.button.callback(ctx.i18n.t("Client.backOneStepMsg"), `back`),
          Markup.button.callback(
            ctx.i18n.t("Client.cancelApplicationBtn"),
            `cancel`
          ),
        ],
      ]),
    };
    await ctx.reply(langMsg.text, langMsg.langButtons);
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});

const getUserLangStep = new Composer();
getUserLangStep.action("cancel", async (ctx) => {
  try {
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await Leave(ctx);
  } catch (error) {
    console.log(error);
  }
});
getUserLangStep.action("back", async (ctx) => {
  try {
    await ctx.editMessageText(
      ctx.i18n.t("AdminUserManagement.enterUserLastName"),
      ctx.wizard.state.formData.mainKeyboard
    );
    return ctx.wizard.back();
  } catch (error) {
    console.log(error);
  }
});
getUserLangStep.action(["lang_uz", "lang_ru"], async (ctx) => {
  try {
    ctx.wizard.state.formData.userLang =
      ctx.match[0] === "lang_uz"
        ? "uz"
        : ctx.match[0] === "lang_ru"
        ? "ru"
        : "ru";
    await ctx.editMessageText(
      ctx.i18n.t("AdminUserManagement.enterPhonenumber"),
      ctx.wizard.state.formData.mainKeyboard
    );
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});

const getUserPhoneNumber = new Composer();
getUserPhoneNumber.action("cancel", async (ctx) => {
  try {
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await Leave(ctx);
  } catch (error) {
    console.log(error);
  }
});
getUserPhoneNumber.action("back", async (ctx) => {
  try {
    const langMsg = {
      text: ctx.i18n.t("AdminUserManagement.chooseUserLangMsg"),
      langButtons: Markup.inlineKeyboard([
        [
          Markup.button.callback("O'zbek", "lang_uz"),
          Markup.button.callback("Russian", "lang_ru"),
        ],
        [
          Markup.button.callback(ctx.i18n.t("Client.backOneStepMsg"), `back`),
          Markup.button.callback(
            ctx.i18n.t("Client.cancelApplicationBtn"),
            `cancel`
          ),
        ],
      ]),
    };
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.reply(langMsg.text, langMsg.langButtons);
    return ctx.wizard.back();
  } catch (error) {
    console.log(error);
  }
});
getUserPhoneNumber.on("message", async (ctx) => {
  try {
    // check for invalid phone number
    const phoneRegex = /^\d{12}$/;
    const repeatingDigitsRegex = /(\d)\1{9,}/;
    const phoneNumber = ctx.message.text.replace(/\s+|\+|\D/g, "");
    if (
      !phoneRegex.test(parseInt(phoneNumber)) ||
      repeatingDigitsRegex.test(parseInt(phoneNumber))
    ) {
      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback(ctx.i18n.t("Client.backOneStepMsg"), `back`),
          Markup.button.callback(
            ctx.i18n.t("Client.cancelApplicationBtn"),
            `cancel`
          ),
        ],
      ]);
      await ctx.reply(ctx.i18n.t("Client.sendValidPhoneNumberMsg"), keyboard);
    }
    ctx.wizard.state.formData.phoneNumber = phoneNumber;
    await ctx.reply(
      ctx.i18n.t("AdminUserManagement.forwardFromUserMsg"),
      ctx.wizard.state.formData.mainKeyboard
    );
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});

const getUserChatID = new Composer();
getUserChatID.action("cancel", async (ctx) => {
  try {
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await Leave(ctx);
  } catch (error) {
    console.log(error);
  }
});
getUserChatID.action("back", async (ctx) => {
  try {
    await ctx.editMessageText(
      ctx.i18n.t("AdminUserManagement.enterPhonenumber"),
      ctx.wizard.state.formData.mainKeyboard
    );
    return ctx.wizard.back();
  } catch (error) {
    console.log(error);
  }
});
getUserChatID.on("message", async (ctx) => {
  try {
    if (!ctx.message.forward_from) {
      await ctx.reply(ctx.i18n.t("AdminUserManagement.noUserChatIdMsg"));
      return;
    }
    ctx.wizard.state.formData.userChatID = String(ctx.message.forward_from.id);
    ctx.wizard.state.formData.username = null;
    const confirmationMsg = {
      text: ctx.i18n.t("AdminUserManagement.userInfoMsg", {
        firstName: ctx.wizard.state.formData.firstName,
        lastName: ctx.wizard.state.formData.lastName,
        phoneNumber: ctx.wizard.state.formData.phoneNumber,
        lang: ctx.wizard.state.formData.userLang,
      }),
      buttons: Markup.inlineKeyboard([
        [
          Markup.button.callback(ctx.i18n.t("Admin.yesBtn"), "yes"),
          Markup.button.callback(ctx.i18n.t("Admin.noBtn"), "no"),
        ],
        [
          Markup.button.callback(ctx.i18n.t("Client.backOneStepMsg"), `back`),
          Markup.button.callback(
            ctx.i18n.t("Client.cancelApplicationBtn"),
            `cancel`
          ),
        ],
      ]),
    };

    await ctx.reply(confirmationMsg.text, confirmationMsg.buttons);
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});

const confirmationStep = new Composer();
confirmationStep.action("cancel", async (ctx) => {
  try {
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await Leave(ctx);
  } catch (error) {
    console.log(error);
  }
});
confirmationStep.action("back", async (ctx) => {
  try {
    await ctx.editMessageText(
      ctx.i18n.t("AdminUserManagement.forwardFromUserMsg"),
      ctx.wizard.state.formData.mainKeyboard
    );
    return ctx.wizard.back();
  } catch (error) {
    console.log(error);
  }
});
confirmationStep.action("yes", async (ctx) => {
  try {
    const user =
      (await GetUserByNumber(ctx.wizard.state.formData.phoneNumber)) ?? null;
    if (user) {
      await ctx.editMessageText(
        ctx.i18n.t("AdminUserManagement.userExistsMsg")
      );
      return ctx.scene.leave();
    }
    console.log(
      ctx.wizard.state.formData.userChatID,
      ctx.wizard.state.formData.username,
      ctx.wizard.state.formData.firstName,
      ctx.wizard.state.formData.lastName,
      ctx.wizard.state.formData.userLang,
      ctx.wizard.state.formData.phoneNumber
    );
    await SaveUser(
      ctx.wizard.state.formData.userChatID,
      ctx.wizard.state.formData.username,
      ctx.wizard.state.formData.firstName,
      ctx.wizard.state.formData.lastName,
      ctx.wizard.state.formData.userLang,
      ctx.wizard.state.formData.phoneNumber
    );
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.reply(ctx.i18n.t("AdminUserManagement.userCreatedMsg"));
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});

module.exports = new Scenes.WizardScene(
  "RegisterUserWizard",
  startStep,
  getLastNameStep,
  getUserLangStep,
  getUserPhoneNumber,
  getUserChatID,
  confirmationStep
);
