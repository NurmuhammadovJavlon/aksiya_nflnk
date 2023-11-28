const { Markup, Scenes, Composer } = require("telegraf");
const { match } = require("telegraf-i18n");
const generateTextsAdminKeys = require("../../../../functions/keyboards/admins/texts.keyboard");
const uploadPhotoToCloudinary = require("../../../../functions/cloudinary/photo.upload");
const {
  GetLatestBestWorkInfo,
  UpdateBestWorkInfo,
  CreateBestWorkText,
} = require("../../../../common/sequelize/bestworkInfo.sequelize");

const GoBack = async (ctx) => {
  try {
    const MainMenu = await generateTextsAdminKeys(ctx);
    await ctx.reply(ctx.i18n.t("Client.successfullyCancelledMsg"), MainMenu);
  } catch (error) {
    console.log(error);
  }
};

const startStep = new Composer();
startStep.hears(match("AdminTextsForm.bestWorkInfoBtn"), async (ctx) => {
  try {
    ctx.wizard.state.bestWork = {};
    const eventInfo = await GetLatestBestWorkInfo();
    ctx.wizard.state.bestWork.data = eventInfo;
    ctx.wizard.state.bestWork.method = eventInfo ? "UPDATE" : "CREATE";
    ctx.wizard.state.bestWork.keyboard = Markup.inlineKeyboard([
      [Markup.button.callback(ctx.i18n.t("skipBtn"), "skip")],
      [
        Markup.button.callback(
          ctx.i18n.t("Client.cancelApplicationBtn"),
          `cancel`
        ),
      ],
    ]);
    await ctx.reply(
      ctx.i18n.t("AdminTextsForm.sendEventTextUzMsg"),
      ctx.wizard.state.bestWork.keyboard
    );
    return ctx.wizard.next();
  } catch (e) {
    console.log(e);
  }
});

const getEventUzText = new Composer();
getEventUzText.action("skip", async (ctx) => {
  try {
    ctx.wizard.state.bestWork.text_uz = ctx.wizard.state.bestWork.data?.text_uz;
    ctx.wizard.state.bestWork.keyboard = Markup.inlineKeyboard([
      [Markup.button.callback(ctx.i18n.t("Client.backOneStepMsg"), "back")],
      [Markup.button.callback(ctx.i18n.t("skipBtn"), "skip")],
      [
        Markup.button.callback(
          ctx.i18n.t("Client.cancelApplicationBtn"),
          `cancel`
        ),
      ],
    ]);
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.reply(
      ctx.i18n.t("AdminTextsForm.sendEventTextRuMsg"),
      ctx.wizard.state.bestWork.keyboard
    );
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});
getEventUzText.action("cancel", async (ctx) => {
  try {
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await GoBack(ctx);
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});
getEventUzText.on("message", async (ctx) => {
  try {
    ctx.wizard.state.bestWork.text_uz = ctx.message.text;
    ctx.wizard.state.bestWork.keyboard = Markup.inlineKeyboard([
      [Markup.button.callback(ctx.i18n.t("Client.backOneStepMsg"), "back")],
      [Markup.button.callback(ctx.i18n.t("skipBtn"), "skip")],
      [
        Markup.button.callback(
          ctx.i18n.t("Client.cancelApplicationBtn"),
          `cancel`
        ),
      ],
    ]);
    await ctx.reply(
      ctx.i18n.t("AdminTextsForm.sendEventTextRuMsg"),
      ctx.wizard.state.bestWork.keyboard
    );
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});

const getEventRuText = new Composer();
getEventRuText.action("back", async (ctx) => {
  try {
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.reply(
      ctx.i18n.t("AdminTextsForm.sendEventTextUzMsg"),
      ctx.wizard.state.bestWork.keyboard
    );
    return ctx.wizard.back();
  } catch (error) {
    console.log(error);
  }
});
getEventRuText.action("skip", async (ctx) => {
  try {
    ctx.wizard.state.bestWork.text_ru = ctx.wizard.state.bestWork.data?.text_ru;
    const confirmationMsg = {
      text: ctx.i18n.t("AdminTextsForm.confirmationMsg", {
        text_uz: ctx.wizard.state.bestWork.text_uz,
        text_ru: ctx.wizard.state.bestWork.text_ru,
      }),
      buttons: [
        [
          Markup.button.callback(ctx.i18n.t("Admin.yesBtn"), "yes"),
          Markup.button.callback(ctx.i18n.t("Admin.noBtn"), "no"),
        ],
      ],
    };
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.replyWithHTML(
      confirmationMsg.text,
      Markup.inlineKeyboard(confirmationMsg.buttons).resize()
    );
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});
getEventRuText.action("cancel", async (ctx) => {
  try {
    await GoBack(ctx);
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});
getEventRuText.on("message", async (ctx) => {
  try {
    ctx.wizard.state.bestWork.text_ru = ctx.message.text;
    const confirmationMsg = {
      text: ctx.i18n.t("AdminTextsForm.confirmationMsg", {
        text_uz: ctx.wizard.state.bestWork.text_uz,
        text_ru: ctx.wizard.state.bestWork.text_ru,
      }),
      buttons: [
        [
          Markup.button.callback(ctx.i18n.t("Admin.yesBtn"), "yes"),
          Markup.button.callback(ctx.i18n.t("Admin.noBtn"), "no"),
        ],
      ],
    };

    await ctx.replyWithHTML(
      confirmationMsg.text,
      Markup.inlineKeyboard(confirmationMsg.buttons).resize()
    );
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});

const confirmDetailStep = new Composer();
confirmDetailStep.hears(match("Client.cancelApplicationBtn"), async (ctx) => {
  try {
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await GoBack(ctx);
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});
confirmDetailStep.action("yes", async (ctx) => {
  try {
    const MainMenu = await generateTextsAdminKeys(ctx);

    if (ctx.wizard.state.bestWork.method === "CREATE") {
      const eventInfo = await CreateBestWorkText(
        ctx.wizard.state.bestWork.text_uz,
        ctx.wizard.state.bestWork.text_ru
      );
      await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
      if (eventInfo) {
        await ctx.reply(ctx.i18n.t("dataSavedMsg"), MainMenu);
      } else {
        await ctx.reply(ctx.i18n.t("errorText"), MainMenu);
      }
    } else if (ctx.wizard.state.bestWork.method === "UPDATE") {
      const bestWorkInfoId = ctx.wizard.state.bestWork.data?.id;
      const bestWorkInfo = await UpdateBestWorkInfo(
        ctx.wizard.state.bestWork.text_uz,
        ctx.wizard.state.bestWork.text_ru,
        bestWorkInfoId
      );
      await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
      if (bestWorkInfo) {
        await ctx.reply(ctx.i18n.t("dataSavedMsg"), MainMenu);
      } else {
        await ctx.reply(ctx.i18n.t("errorText"), MainMenu);
      }
    }
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});
confirmDetailStep.action("no", async (ctx) => {
  try {
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await GoBack(ctx);
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});

module.exports = new Scenes.WizardScene(
  "BestWorkInfoWizard",
  startStep,
  getEventUzText,
  getEventRuText,
  confirmDetailStep
);
