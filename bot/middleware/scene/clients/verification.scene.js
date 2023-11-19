const { Markup, Scenes, Composer } = require("telegraf");
const { match } = require("telegraf-i18n");
const getAddressFromLatLng = require("../../../functions/keyboards/clients/getAddress");
const {
  CreateClientBeforeValid,
} = require("../../../common/sequelize/client.sequelize");
const {
  GetAllAdminUsers,
} = require("../../../common/sequelize/user.sequelize");

const startStep = new Composer();
startStep.hears(match("validateClientBtn"), async (ctx) => {
  try {
    ctx.wizard.state.formData = {};
    const locationKeyboard = Markup.keyboard([
      [Markup.button.locationRequest(ctx.i18n.t("Client.sendLocationBtn"))],
      [Markup.button.text(ctx.i18n.t("backToMainMenuBtn"))],
    ]).resize();
    await ctx.reply(ctx.i18n.t("Client.sendLocationMsg"), locationKeyboard);
  } catch (e) {
    console.log(e);
  }
});
startStep.on("location", async (ctx) => {
  try {
    const location = ctx.message.location;
    const res = await getAddressFromLatLng(
      location.latitude,
      location.longitude
    );
    if (!res) {
      await ctx.reply(ctx.i18n.t("Client.sendValidLocationMsg"));
      return;
    }
    ctx.wizard.state.formData.location = res;
    ctx.wizard.state.formData.keyboard = Markup.keyboard([
      [Markup.button.text(ctx.i18n.t("Client.backOneStepMsg"))],
      [Markup.button.text(ctx.i18n.t("backToMainMenuBtn"))],
    ]).resize();
    await ctx.reply(
      ctx.i18n.t("Client.sendInsideVideoMsg"),
      ctx.wizard.state.formData.keyboard
    );
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});

const insideVideoStep = new Composer();
insideVideoStep.hears(match("Client.backOneStepMsg"), async (ctx) => {
  try {
    const locationKeyboard = Markup.keyboard([
      [Markup.button.locationRequest(ctx.i18n.t("Client.sendLocationBtn"))],
      [Markup.button.text(ctx.i18n.t("backToMainMenuBtn"))],
    ]).resize();
    await ctx.reply(ctx.i18n.t("Client.sendLocationMsg"), locationKeyboard);
    return ctx.wizard.back();
  } catch (error) {
    console.log(error);
  }
});
insideVideoStep.on("video", async (ctx) => {
  try {
    if (!ctx.message.video) {
      await ctx.reply(ctx.i18n.t("Client.sendInsideVideoMsg"));
      return;
    }
    const insideVideo = ctx.message.video;
    ctx.wizard.state.formData.insideVideo = insideVideo.file_id;
    await ctx.reply(
      ctx.i18n.t("Client.sendOutsideVideoMsg"),
      ctx.wizard.state.formData.keyboard
    );
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});

const outsideVideoStep = new Composer();
outsideVideoStep.hears(match("Client.backOneStepMsg"), async (ctx) => {
  try {
    await ctx.reply(
      ctx.i18n.t("Client.sendInsideVideoMsg"),
      ctx.wizard.state.formData.keyboard
    );
    return ctx.wizard.back();
  } catch (error) {
    console.log(error);
  }
});
outsideVideoStep.on("video", async (ctx) => {
  try {
    if (!ctx.message.video) {
      await ctx.reply(ctx.i18n.t("Client.sendOutsideVideoMsg"));
      return;
    }
    const outsideVideo = ctx.message.video;
    ctx.wizard.state.formData.outsideVideo = outsideVideo.file_id;
    await ctx.reply(ctx.i18n.t("Client.askForEmployeesNumberMsg"));
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});

const employeesNumberStep = new Composer();
employeesNumberStep.hears(match("Client.backOneStepMsg"), async (ctx) => {
  try {
    await ctx.reply(
      ctx.i18n.t("Client.sendOutsideVideoMsg"),
      ctx.wizard.state.formData.keyboard
    );
    return ctx.wizard.back();
  } catch (error) {
    console.log(error);
  }
});
employeesNumberStep.on("message", async (ctx) => {
  try {
    const digitRegex = /^\d+$/;
    const text = ctx.message.text ?? "";
    if (!digitRegex.test(text)) {
      await ctx.reply(ctx.i18n.t("Client.askForEmployeesNumberMsg"));
    }
    ctx.wizard.state.formData.numberOfEmployees = text;
    const client = await CreateClientBeforeValid(
      String(ctx.chat.id),
      ctx.wizard.state.formData.location,
      ctx.wizard.state.formData.numberOfEmployees
    );

    const msg = ctx.i18n.t("AdminClientForm.queryCaption", {
      id: client?.id,
      location: ctx.wizard.state.formData.location,
      numberOfEmployees: ctx.wizard.state.formData.numberOfEmployees,
    });
    ctx.wizard.state.formData.keyboard = Markup.keyboard([
      [Markup.button.text(ctx.i18n.t("backToMainMenuBtn"))],
    ]).resize();
    await ctx.reply(
      ctx.i18n.t("Client.finalRespondMsgForValidation"),
      ctx.wizard.state.formData.keyboard
    );
    const processedAdmins = new Set();
    const admins = await GetAllAdminUsers();
    for (const admin of admins) {
      if (!processedAdmins.has(admin.chatID)) {
        try {
          await ctx.telegram.sendMediaGroup(parseInt(admin.chatID), [
            { media: ctx.wizard.state.formData.outsideVideo, type: "video" },
            {
              media: ctx.wizard.state.formData.insideVideo,
              type: "video",
              caption: msg,
            },
          ]);
          processedAdmins.add(admin.chatID);
          // console.log(`Message sent to ${operator.name}`);
        } catch (error) {
          console.error(`Error sending message to admin: ${error.message}`);
        }
      }

      // Introduce a delay (e.g., 3 seconds) before sending to the next admin
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
    ctx.wizard.state.formData = {};
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});

module.exports = new Scenes.WizardScene(
  "ClientValidationWizard",
  startStep,
  insideVideoStep,
  outsideVideoStep,
  employeesNumberStep
);
