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
      // [Markup.button.text(ctx.i18n.t("Client.backOneStepMsg"))],
      [Markup.button.text(ctx.i18n.t("Client.cancelApplicationBtn"))],
    ]);
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
    await ctx.reply(ctx.i18n.t("AdminRegionForm.enterRegionNameRuText"));
    return ctx.wizard.next();
  } catch (e) {
    console.log(e);
  }
});

const getRuRegionName = new Composer();
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
    await CreateRegion(
      ctx.wizard.state.regionData.name_uz,
      ctx.wizard.state.regionData.name_ru
    );
    ctx.wizard.state.regionData = {};
    const keyboard = await generateRegionAdminKeys(ctx);
    ctx.reply(ctx.i18n.t("AdminRegionForm.regionSavedText"), keyboard);
    return ctx.scene.leave();
  } catch (e) {
    console.log(e);
  }
});

module.exports = new Scenes.WizardScene(
  "AddRegionWizard",
  initScene,
  getUzRegionName,
  getRuRegionName
);
