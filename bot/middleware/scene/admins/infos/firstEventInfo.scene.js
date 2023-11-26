const { Markup, Scenes, Composer } = require("telegraf");
const { match } = require("telegraf-i18n");
const generateTextsAdminKeys = require("../../../../functions/keyboards/admins/texts.keyboard");
const uploadPhotoToCloudinary = require("../../../../functions/cloudinary/photo.upload");
const {
  GetLatestEventInfo,
  CreateEventText,
  UpdateEventInfo,
} = require("../../../../common/sequelize/eventInfo.sequelize");

const GoBack = async (ctx) => {
  try {
    const MainMenu = await generateTextsAdminKeys(ctx);
    await ctx.reply(ctx.i18n.t("Client.successfullyCancelledMsg"), MainMenu);
  } catch (error) {
    console.log(error);
  }
};

const startStep = new Composer();
startStep.hears(match("AdminTextsForm.firstEventTextBtn"), async (ctx) => {
  try {
    ctx.wizard.state.firstEvent = {};
    const eventInfo = await GetLatestEventInfo();
    ctx.wizard.state.firstEvent.data = eventInfo;
    ctx.wizard.state.firstEvent.method = eventInfo ? "UPDATE" : "CREATE";
    ctx.wizard.state.firstEvent.keyboard = Markup.inlineKeyboard([
      [Markup.button.callback(ctx.i18n.t("skipBtn"), "skip")],
      [
        Markup.button.callback(
          ctx.i18n.t("Client.cancelApplicationBtn"),
          `cancel`
        ),
      ],
    ]);
    await ctx.reply(
      ctx.i18n.t("AdminTextsForm.sendPhotoMsg"),
      ctx.wizard.state.firstEvent.keyboard
    );
    return ctx.wizard.next();
  } catch (e) {
    console.log(e);
  }
});

const getEventPhotoStep = new Composer();
getEventPhotoStep.action("cancel", async (ctx) => {
  try {
    await GoBack(ctx);
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});
getEventPhotoStep.action("skip", async (ctx) => {
  try {
    ctx.wizard.state.firstEvent.photo = ctx.wizard.state.firstEvent.data?.image;
    ctx.wizard.state.firstEvent.keyboard = Markup.inlineKeyboard([
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
      ctx.i18n.t("AdminTextsForm.sendEventTextUzMsg"),
      ctx.wizard.state.firstEvent.keyboard
    );
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});
getEventPhotoStep.on("photo", async (ctx) => {
  try {
    const fileId = ctx.message.photo[ctx.message.photo.length - 1]?.file_id;
    const { href } = await ctx.telegram.getFileLink(fileId);
    const res = await uploadPhotoToCloudinary(href);
    ctx.wizard.state.firstEvent.photo = res?.secure_url;
    ctx.wizard.state.firstEvent.keyboard = Markup.inlineKeyboard([
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
      ctx.i18n.t("AdminTextsForm.sendEventTextUzMsg"),
      ctx.wizard.state.firstEvent.keyboard
    );
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});

const getEventUzText = new Composer();
getEventUzText.action("back", async (ctx) => {
  try {
    ctx.wizard.state.firstEvent.keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback(
          ctx.i18n.t("Client.cancelApplicationBtn"),
          `cancel`
        ),
      ],
    ]);
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.reply(
      ctx.i18n.t("AdminTextsForm.sendPhotoMsg"),
      ctx.wizard.state.firstEvent.keyboard
    );
    return ctx.wizard.back();
  } catch (error) {
    console.log(error);
  }
});
getEventUzText.action("skip", async (ctx) => {
  try {
    ctx.wizard.state.firstEvent.text_uz =
      ctx.wizard.state.firstEvent.data?.text_uz;
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.reply(
      ctx.i18n.t("AdminTextsForm.sendEventTextRuMsg"),
      ctx.wizard.state.firstEvent.keyboard
    );
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});
getEventUzText.action("cancel", async (ctx) => {
  try {
    await GoBack(ctx);
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});
getEventUzText.on("message", async (ctx) => {
  try {
    ctx.wizard.state.firstEvent.text_uz = ctx.message.text;
    await ctx.reply(
      ctx.i18n.t("AdminTextsForm.sendEventTextRuMsg"),
      ctx.wizard.state.firstEvent.keyboard
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
      ctx.wizard.state.firstEvent.keyboard
    );
    return ctx.wizard.back();
  } catch (error) {
    console.log(error);
  }
});
getEventRuText.action("skip", async (ctx) => {
  try {
    ctx.wizard.state.firstEvent.text_ru =
      ctx.wizard.state.firstEvent.data?.text_ru;
    const confirmationMsg = {
      text: ctx.i18n.t("AdminTextsForm.confirmationMsg", {
        text_uz: ctx.wizard.state.firstEvent.text_uz,
        text_ru: ctx.wizard.state.firstEvent.text_ru,
      }),
      buttons: [
        [
          Markup.button.callback(ctx.i18n.t("Admin.yesBtn"), "yes"),
          Markup.button.callback(ctx.i18n.t("Admin.noBtn"), "no"),
        ],
      ],
    };
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.replyWithPhoto(ctx.wizard.state.firstEvent.photo, {
      caption: confirmationMsg.text,
      reply_markup: {
        inline_keyboard: confirmationMsg.buttons,
      },
      parse_mode: "HTML",
    });
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
    ctx.wizard.state.firstEvent.text_ru = ctx.message.text;
    const confirmationMsg = {
      text: ctx.i18n.t("AdminTextsForm.confirmationMsg", {
        text_uz: ctx.wizard.state.firstEvent.text_uz,
        text_ru: ctx.wizard.state.firstEvent.text_ru,
      }),
      buttons: [
        [
          Markup.button.callback(ctx.i18n.t("Admin.yesBtn"), "yes"),
          Markup.button.callback(ctx.i18n.t("Admin.noBtn"), "no"),
        ],
      ],
    };

    await ctx.replyWithPhoto(ctx.wizard.state.firstEvent.photo, {
      caption: confirmationMsg.text,
      reply_markup: {
        inline_keyboard: confirmationMsg.buttons,
      },
      parse_mode: "HTML",
    });
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});

const confirmDetailStep = new Composer();
confirmDetailStep.hears(match("Client.cancelApplicationBtn"), async (ctx) => {
  try {
    await GoBack(ctx);
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});
confirmDetailStep.action("yes", async (ctx) => {
  try {
    const MainMenu = await generateTextsAdminKeys(ctx);

    if (ctx.wizard.state.firstEvent.method === "CREATE") {
      const eventInfo = await CreateEventText(
        ctx.wizard.state.firstEvent.text_uz,
        ctx.wizard.state.firstEvent.text_ru,
        ctx.wizard.state.firstEvent.photo
      );
      await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
      if (eventInfo) {
        await ctx.reply(ctx.i18n.t("dataSavedMsg"), MainMenu);
      } else {
        await ctx.reply(ctx.i18n.t("errorText"), MainMenu);
      }
    } else if (ctx.wizard.state.firstEvent.method === "UPDATE") {
      const eventInfoId = ctx.wizard.state.firstEvent.data?.id;
      const eventInfo = await UpdateEventInfo(
        ctx.wizard.state.firstEvent.text_uz,
        ctx.wizard.state.firstEvent.text_ru,
        ctx.wizard.state.firstEvent.photo,
        eventInfoId
      );
      await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
      if (eventInfo) {
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
  "FirstInfoWizard",
  startStep,
  getEventPhotoStep,
  getEventUzText,
  getEventRuText,
  confirmDetailStep
);
