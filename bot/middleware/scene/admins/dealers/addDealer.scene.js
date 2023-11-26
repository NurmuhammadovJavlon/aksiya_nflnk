const { Markup, Scenes, Composer } = require("telegraf");
const { match } = require("telegraf-i18n");
const generateDealerAdminKeys = require("../../../../functions/keyboards/admins/dealer.keyboard");
const {
  CreateDealer,
} = require("../../../../common/sequelize/dealer.sequelize");
const {
  getRegionsWithPagination,
} = require("../../../../common/sequelize/region.sequelize");
const generateItemsKeyboard = require("../../../../functions/keyboards/admins/slider.keyboard");

const startStep = new Composer();
startStep.hears(match("AdminDealerForm.addDealerBtn"), async (ctx) => {
  try {
    ctx.wizard.state.dealerForm = {};
    ctx.wizard.state.dealerForm.keyboard = Markup.keyboard([
      // [Markup.button.text(ctx.i18n.t("Client.backOneStepMsg"))],
      [Markup.button.text(ctx.i18n.t("Client.cancelApplicationBtn"))],
    ]).resize();
    await ctx.reply(
      ctx.i18n.t("AdminDealerForm.enterDealerUzName"),
      ctx.wizard.state.dealerForm.keyboard
    );
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});

const getUzDealerName = new Composer();
getUzDealerName.hears(match("Client.cancelApplicationBtn"), async (ctx) => {
  try {
    const MainMenu = await generateDealerAdminKeys(ctx);
    await ctx.reply(ctx.i18n.t("Client.successfullyCancelledMsg"), MainMenu);
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});
getUzDealerName.on("message", async (ctx) => {
  try {
    ctx.wizard.state.dealerForm.name_uz = ctx.message.text;
    await ctx.reply(ctx.i18n.t("AdminDealerForm.enterDealerRuName"));
    return ctx.wizard.next();
  } catch (e) {
    console.log(e);
  }
});

const getRuDealerName = new Composer();
getRuDealerName.hears(match("Client.cancelApplicationBtn"), async (ctx) => {
  try {
    const MainMenu = await generateDealerAdminKeys(ctx);
    await ctx.reply(ctx.i18n.t("Client.successfullyCancelledMsg"), MainMenu);
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});
getRuDealerName.on("message", async (ctx) => {
  try {
    ctx.wizard.state.dealerForm.name_ru = ctx.update.message.text;
    const confirmationMsg = {
      text: ctx.i18n.t("AdminDealerForm.confirmationMessage", {
        name_uz: ctx.wizard.state.dealerForm.name_uz,
        name_ru: ctx.wizard.state.dealerForm.name_ru,
      }),
      buttons: Markup.inlineKeyboard([
        [
          Markup.button.callback(ctx.i18n.t("Admin.yesBtn"), "yes"),
          Markup.button.callback(ctx.i18n.t("Admin.noBtn"), "no"),
        ],
      ]),
    };

    await ctx.reply(confirmationMsg.text, confirmationMsg.buttons);
    return ctx.wizard.next();
  } catch (e) {
    console.log(e);
  }
});

const confirmDetailStep = new Composer();
confirmDetailStep.hears(match("Client.cancelApplicationBtn"), async (ctx) => {
  try {
    const MainMenu = await generateDealerAdminKeys(ctx);
    await ctx.reply(ctx.i18n.t("Client.successfullyCancelledMsg"), MainMenu);
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});
confirmDetailStep.action(["yes", "no"], async (ctx) => {
  try {
    const callBackData = ctx.update.callback_query.data;
    const MainMenu = await generateDealerAdminKeys(ctx);
    if (callBackData === "yes") {
      const dealer = await CreateDealer(
        ctx.wizard.state.dealerForm.name_uz,
        ctx.wizard.state.dealerForm.name_ru
      );
      await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
      if (dealer) {
        await ctx.reply(ctx.i18n.t("dataSavedMsg"), MainMenu);
      } else {
        await ctx.reply(ctx.i18n.t("errorText"), MainMenu);
      }
    } else if (callBackData === "no") {
      await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
      await ctx.reply(ctx.i18n.t("Client.successfullyCancelledMsg"), MainMenu);
    }
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});

module.exports = new Scenes.WizardScene(
  "AddDealerWizard",
  startStep,
  getUzDealerName,
  getRuDealerName,
  confirmDetailStep
);
