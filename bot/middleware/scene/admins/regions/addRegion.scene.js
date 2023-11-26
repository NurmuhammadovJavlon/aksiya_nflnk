const { Markup, Scenes, Composer } = require("telegraf");
const {
  CreateRegion,
} = require("../../../../common/sequelize/region.sequelize");
const { match } = require("telegraf-i18n");
const generateMainMenuKeys = require("../../../../functions/keyboards/main-menu.keyboard");
const generateRegionAdminKeys = require("../../../../functions/keyboards/admins/region.keyboard");

const initScene = new Composer();
initScene.on("message", async (ctx) => {
  try {
    ctx.wizard.state.regionData = {};
    ctx.wizard.state.regionData.keyboard = Markup.keyboard([
      [Markup.button.text(ctx.i18n.t("Client.cancelApplicationBtn"))],
    ]).resize();
    await ctx.reply(
      ctx.i18n.t("AdminRegionForm.enterRegionNameUzText"),
      ctx.wizard.state.regionData.keyboard
    );
    return ctx.wizard.next();
  } catch (e) {
    console.log(e);
  }
});

const getUzRegionName = new Composer();
getUzRegionName.hears(match("Client.cancelApplicationBtn"), async (ctx) => {
  try {
    const MainMenu = await generateRegionAdminKeys(ctx);
    await ctx.reply(ctx.i18n.t("Client.successfullyCancelledMsg"), MainMenu);
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});
getUzRegionName.on("message", async (ctx) => {
  try {
    ctx.wizard.state.regionData = {};
    const regionName = ctx.update.message.text;
    ctx.wizard.state.regionData.name_uz = regionName;
    ctx.wizard.state.regionData.keyboard = Markup.keyboard([
      [Markup.button.text(ctx.i18n.t("Client.backOneStepMsg"))],
      [Markup.button.text(ctx.i18n.t("Client.cancelApplicationBtn"))],
    ]);
    await ctx.reply(
      ctx.i18n.t("AdminRegionForm.enterRegionNameRuText"),
      ctx.wizard.state.regionData.keyboard
    );
    return ctx.wizard.next();
  } catch (e) {
    console.log(e);
  }
});

const getRuRegionName = new Composer();
getRuRegionName.hears(match("Client.backOneStepMsg"), async (ctx) => {
  try {
    ctx.wizard.state.regionData.keyboard = Markup.keyboard([
      [Markup.button.text(ctx.i18n.t("Client.cancelApplicationBtn"))],
    ]).resize();
    await ctx.reply(
      ctx.i18n.t("AdminRegionForm.enterRegionNameUzText"),
      ctx.wizard.state.regionData.keyboard
    );
    return ctx.wizard.back();
  } catch (error) {
    console.log(error);
  }
});
getRuRegionName.hears(match("Client.cancelApplicationBtn"), async (ctx) => {
  try {
    const MainMenu = await generateRegionAdminKeys(ctx);
    await ctx.reply(ctx.i18n.t("Client.successfullyCancelledMsg"), MainMenu);
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});
getRuRegionName.on("message", async (ctx) => {
  try {
    const regionName = ctx.update.message.text;
    ctx.wizard.state.regionData.name_ru = regionName;
    const confirmMsg = {
      text: ctx.i18n.t("AdminRegionForm.editConfirmationMsg", {
        regionNameUz: ctx.wizard.state.regionData.name_uz,
        regionNameRu: ctx.wizard.state.regionData.name_ru,
      }),
      buttons: Markup.inlineKeyboard([
        [
          Markup.button.callback(ctx.i18n.t("Admin.yesBtn"), "yes"),
          Markup.button.callback(ctx.i18n.t("Admin.noBtn"), "no"),
        ],
      ]),
    };
    await ctx.reply(confirmMsg.text, confirmMsg.buttons);
    return ctx.wizard.next();
  } catch (e) {
    console.log(e);
  }
});

const confirmationStep = new Composer();
confirmationStep.hears(match("Client.backOneStepMsg"), async (ctx) => {
  try {
    ctx.wizard.state.regionData.keyboard = Markup.keyboard([
      [Markup.button.text(ctx.i18n.t("Client.backOneStepMsg"))],
      [Markup.button.text(ctx.i18n.t("Client.cancelApplicationBtn"))],
    ]);
    await ctx.reply(
      ctx.i18n.t("AdminRegionForm.enterRegionNameRuText"),
      ctx.wizard.state.regionData.keyboard
    );
    return ctx.wizard.back();
  } catch (error) {
    console.log(error);
  }
});
confirmationStep.action("yes", async (ctx) => {
  try {
    await CreateRegion(
      ctx.wizard.state.regionData.name_uz,
      ctx.wizard.state.regionData.name_ru
    );
    ctx.wizard.state.regionData = {};
    const keyboard = await generateRegionAdminKeys(ctx);
    ctx.reply(ctx.i18n.t("AdminRegionForm.regionSavedText"), keyboard);
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});
confirmationStep.action("no", async (ctx) => {
  try {
    const MainMenu = await generateRegionAdminKeys(ctx);
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.reply(ctx.i18n.t("Client.successfullyCancelledMsg"), MainMenu);
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});

module.exports = new Scenes.WizardScene(
  "AddRegionWizard",
  initScene,
  getUzRegionName,
  getRuRegionName,
  confirmationStep
);
