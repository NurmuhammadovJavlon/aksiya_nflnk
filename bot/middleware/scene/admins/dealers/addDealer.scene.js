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
    ctx.wizard.state.dealerForm.region = {};
    ctx.wizard.state.dealerForm.region.regionPage = 1;
    ctx.wizard.state.dealerForm.region.itemsPerPage = 6;

    const regions = await getRegionsWithPagination(
      ctx.wizard.state.dealerForm.region.regionPage,
      ctx.wizard.state.dealerForm.region.itemsPerPage
    );

    if (regions.totalItems === 0) {
      await ctx.deleteMessage(ctx.update.message.message_id);
      await ctx.reply(ctx.i18n.t("Client.emptyDataMsg"));
      return ctx.scene.leave();
    }

    const keyboard = generateItemsKeyboard(
      ctx.wizard.state.dealerForm.region.regionPage,
      ctx.i18n.locale(),
      regions.totalItems,
      ctx.wizard.state.dealerForm.region.itemsPerPage,
      regions.items,
      ctx.i18n
    );

    await ctx.reply(ctx.i18n.t("AdminRegionForm.chooseRegionTxt"), keyboard);
    return ctx.wizard.next();
  } catch (e) {
    console.log(e);
  }
});

const connectRegionStep = new Composer();
connectRegionStep.action(["prev", "next"], async (ctx) => {
  try {
    const match = ctx.update?.callback_query?.data;
    switch (match) {
      case "prev":
        ctx.wizard.state.dealerForm.region.regionPage--;
        break;
      case "next":
        ctx.wizard.state.dealerForm.region.regionPage++;
        break;
    }
    const regions = await getRegionsWithPagination(
      ctx.wizard.state.dealerForm.region.regionPage,
      ctx.wizard.state.dealerForm.region.itemsPerPage
    );
    const keyboard = generateItemsKeyboard(
      ctx.wizard.state.dealerForm.region.regionPage,
      ctx.i18n.locale(),
      regions.totalItems,
      ctx.wizard.state.dealerForm.region.itemsPerPage,
      regions.items,
      ctx.i18n
    );
    await ctx.editMessageText(
      ctx.i18n.t("AdminRegionForm.chooseRegionTxt"),
      keyboard
    );
  } catch (error) {
    console.log(error);
  }
});
connectRegionStep.action("cancel", async (ctx) => {
  try {
    const MainMenu = await generateDealerAdminKeys(ctx);
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.reply(ctx.i18n.t("Client.successfullyCancelledMsg"), MainMenu);
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});
connectRegionStep.on("callback_query", async (ctx) => {
  try {
    if (!ctx.update.callback_query?.data.includes("i_")) {
      return ctx.reply("invalid_callback_query");
    }
    const regionId = parseInt(
      ctx.update.callback_query?.data.match(/i_(\d+)/)[1],
      10
    );
    ctx.wizard.state.dealerForm.regionId = regionId;
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
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.reply(confirmationMsg.text, confirmationMsg.buttons);
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
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
        ctx.wizard.state.dealerForm.name_ru,
        ctx.wizard.state.dealerForm.regionId
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
  connectRegionStep,
  confirmDetailStep
);
