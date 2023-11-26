const { Markup, Scenes, Composer } = require("telegraf");
const { match } = require("telegraf-i18n");
const {
  GetUserByNumber,
} = require("../../../../common/sequelize/user.sequelize");
const generateUserManagementAdminKeys = require("../../../../functions/keyboards/admins/manageUser.keyboard");

const startStep = new Composer();
startStep.hears(match("AdminUserManagement.getInfoBtn"), async (ctx) => {
  try {
    ctx.wizard.state.formData = {};
    ctx.wizard.state.formData.keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback(
          ctx.i18n.t("Client.cancelApplicationBtn"),
          "cancel"
        ),
      ],
    ]);
    await ctx.reply(
      ctx.i18n.t("AdminUserManagement.sendUserPhoneNumberMsg"),
      ctx.wizard.state.formData.keyboard
    );
    // return ctx.wizard.next();
  } catch (e) {
    console.log(e);
  }
});
startStep.action("cancel", async (ctx) => {
  try {
    await ctx.reply(ctx.i18n.t("Client.successfullyCancelledMsg"));
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});
startStep.on("message", async (ctx) => {
  try {
    const phoneRegex = /^\d{12}$/;
    if (!phoneRegex.test(ctx.message.text)) {
      return await ctx.reply(ctx.i18n.t("Client.sendValidPhoneNumberMsg"));
    }
    ctx.wizard.state.formData.phoneNumber = ctx.message.text;
    const user = await GetUserByNumber(ctx.wizard.state.formData.phoneNumber);
    ctx.wizard.state.formData.userChatID = user.chatID;

    if (!user) {
      const MainMenu = await generateUserManagementAdminKeys(ctx);
      await ctx.reply(ctx.i18n.t("Client.emptyDataMsg"), MainMenu);
      return ctx.scene.leave();
    }

    const createdDate = new Intl.DateTimeFormat(ctx.i18n.locale(), {
      minute: "2-digit",
      hour: "2-digit",
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Tashkent",
    }).format(user.createdAt);
    const userInfoMsg = ctx.i18n.t("AdminUserManagement.userInfoCaption", {
      userId: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      isAdmin: user.admin ? "✅️️️️️️️" : "❌",
      isSuperAdmin: user.superAdmin ? "✅️️️️️️️" : "❌",
      isOperator: user.isOperator ? "✅️️️️️️️" : "❌",
      lang:
        user.preferedLanguageCode === "uz"
          ? "🇺🇿"
          : user.preferedLanguageCode === "ru"
          ? "🇷🇺"
          : null,
      phoneNumber: `+${user.phoneNumber}`,
      score: user.score,
      createdAt: createdDate,
    });
    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback(
          ctx.i18n.t("AdminUserManagement.sendMessageBtn"),
          "sendMessage"
        ),
      ],
      [
        Markup.button.callback(
          ctx.i18n.t("Client.cancelApplicationBtn"),
          "cancel"
        ),
      ],
    ]);
    await ctx.replyWithHTML(userInfoMsg, keyboard);
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});

const sendMessageStep = new Composer();
sendMessageStep.action("cancel", async (ctx) => {
  try {
    await ctx.reply(ctx.i18n.t("Client.successfullyCancelledMsg"));
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});
sendMessageStep.action("sendMessage", async (ctx) => {
  try {
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.reply(
      ctx.i18n.t("AdminUserManagement.sendMessageTxt"),
      ctx.wizard.state.formData.keyboard
    );
  } catch (error) {
    console.log(error);
  }
});
sendMessageStep.on("message", async (ctx) => {
  try {
    ctx.wizard.state.formData.message = ctx.message.text;
    const confirmMsg = {
      text: ctx.i18n.t("AdminUserManagement.confirmMsg", {
        message: ctx.wizard.state.formData.message,
      }),
      buttons: Markup.inlineKeyboard([
        [
          Markup.button.callback(ctx.i18n.t("Admin.yesBtn"), "yes"),
          Markup.button.callback(ctx.i18n.t("Admin.noBtn"), "no"),
        ],
        [Markup.button.callback(ctx.i18n.t("Client.backOneStepMsg"), `back`)],
      ]),
    };
    await ctx.replyWithHTML(confirmMsg.text, confirmMsg.buttons);
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});

const confirmMessageStep = new Composer();
confirmMessageStep.action("cancel", async (ctx) => {
  try {
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.reply(ctx.i18n.t("Client.successfullyCancelledMsg"));
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});
confirmMessageStep.action("no", async (ctx) => {
  try {
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.reply(ctx.i18n.t("Client.successfullyCancelledMsg"));
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});
confirmMessageStep.action("yes", async (ctx) => {
  try {
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.telegram.sendMessage(
      ctx.wizard.state.formData.userChatID,
      ctx.wizard.state.formData.message
    );
    await ctx.reply(ctx.i18n.t("AdminUserManagement.messageIsSent"));
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});

module.exports = new Scenes.WizardScene(
  "ManageUserWizard",
  startStep,
  sendMessageStep,
  confirmMessageStep
);
