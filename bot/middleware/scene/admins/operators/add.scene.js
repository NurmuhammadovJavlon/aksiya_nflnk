const { Markup, Scenes, Composer } = require("telegraf");
const { match } = require("telegraf-i18n");
const {
  GetUserByNumber,
} = require("../../../../common/sequelize/user.sequelize");
const {
  CreateOperator,
} = require("../../../../common/sequelize/operator.sequelize");
const {
  GetDealersWithPagination,
} = require("../../../../common/sequelize/dealer.sequelize");
const generateItemsKeyboard = require("../../../../functions/keyboards/admins/slider.keyboard");
const generateOperatorAdminKeys = require("../../../../functions/keyboards/admins/operator.keyboard");

const sendDealerKeys = async (ctx) => {
  try {
    ctx.wizard.state.operator.dealer.dealerPage = 1;
    ctx.wizard.state.operator.dealer.itemsPerPage = 2;

    const dealers = await GetDealersWithPagination(
      ctx.wizard.state.operator.dealer.dealerPage,
      ctx.wizard.state.operator.dealer.itemsPerPage
    );

    if (dealers.totalItems === 0) {
      await ctx.reply(ctx.i18n.t("Client.emptyDataMsg"));
      return;
    }

    const keyboard = generateItemsKeyboard(
      ctx.wizard.state.operator.dealer.dealerPage,
      ctx.i18n.locale(),
      dealers.totalItems,
      ctx.wizard.state.operator.dealer.itemsPerPage,
      dealers.items,
      ctx.i18n
    );
    // await ctx.deleteMessage(ctx.update.message.message_id);
    await ctx.reply(ctx.i18n.t("AdminDealerForm.chooseDealerTxt"), keyboard);
  } catch (error) {
    console.log(error);
  }
};

const GoBack = async (ctx) => {
  try {
    const MainMenu = await generateOperatorAdminKeys(ctx);
    await ctx.reply(ctx.i18n.t("Client.successfullyCancelledMsg"), MainMenu);
  } catch (error) {
    console.log(error);
  }
};

const startStep = new Composer();
startStep.hears(match("AdminOperatorForm.addOperatorBtn"), async (ctx) => {
  try {
    ctx.wizard.state.operator = {};
    ctx.wizard.state.operator.dealer = {};
    await ctx.reply(
      ctx.i18n.t("AdminOperatorForm.sendOperatorContactMsg"),
      Markup.keyboard([
        [Markup.button.text(ctx.i18n.t("Client.cancelApplicationBtn"))],
      ])
    );
    return ctx.wizard.next();
  } catch (e) {
    console.log(e);
  }
});

const setOperator = new Composer();
setOperator.hears(match("Client.cancelApplicationBtn"), async (ctx) => {
  try {
    await GoBack(ctx);
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});
setOperator.on("message", async (ctx) => {
  try {
    const regex = /^\d{12}$/;
    if (!regex.test(ctx.update.message.text)) {
      await ctx.reply(
        ctx.i18n.t("AdminOperatorForm.sendOperatorContactMsg"),
        Markup.keyboard([
          [Markup.button.text(ctx.i18n.t("Client.cancelApplicationBtn"))],
        ])
      );
      return;
    }
    ctx.wizard.state.operator.phoneNumber = ctx.update.message.text;
    const user = await GetUserByNumber(ctx.wizard.state.operator.phoneNumber);
    if (!user) {
      ctx.reply("no user found");
      return ctx.scene.leave();
    }
    if (user.isOperator) {
      const MainMenu = await generateOperatorAdminKeys(ctx);
      ctx.reply("user is already operator", MainMenu);
      return ctx.scene.leave();
    }
    await sendDealerKeys(ctx);
    ctx.wizard.state.operator.user = user;
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});

const connectDealerStep = new Composer();
connectDealerStep.hears(match("Client.cancelApplicationBtn"), async (ctx) => {
  try {
    await GoBack(ctx);
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});
connectDealerStep.action(["prev", "next"], async (ctx) => {
  try {
    const match = ctx.update?.callback_query?.data;
    switch (match) {
      case "prev":
        ctx.wizard.state.operator.dealer.dealerPage--;
        break;
      case "next":
        ctx.wizard.state.operator.dealer.dealerPage++;
        break;
    }
    const dealers = await GetDealersWithPagination(
      ctx.wizard.state.operator.dealer.dealerPage,
      ctx.wizard.state.operator.dealer.itemsPerPage
    );
    const keyboard = generateItemsKeyboard(
      ctx.wizard.state.operator.dealer.dealerPage,
      ctx.i18n.locale(),
      dealers.totalItems,
      ctx.wizard.state.operator.dealer.dealerPage,
      dealers.items,
      ctx.i18n
    );
    await ctx.editMessageText(
      ctx.i18n.t("AdminDealerForm.chooseDealerTxt"),
      keyboard
    );
    return;
  } catch (error) {
    console.log(error);
  }
});
connectDealerStep.on("callback_query", async (ctx) => {
  try {
    if (!ctx.update.callback_query?.data.includes("i_")) {
      return ctx.reply("invalid_callback_query");
    }
    const dealerId = parseInt(
      ctx.update.callback_query?.data.match(/i_(\d+)/)[1],
      10
    );
    ctx.wizard.state.operator.dealer.dealerId = dealerId;
    const operator = await CreateOperator(
      ctx.wizard.state.operator.user.chatID,
      ctx.wizard.state.operator.user.id,
      ctx.wizard.state.operator.dealer.dealerId
    );
    if (!operator) {
      await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
      await ctx.reply(ctx.i18n.t("errorText"), MainMenu);
      return ctx.scene.leave();
    }
    const MainMenu = await generateOperatorAdminKeys(ctx);
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.reply(
      ctx.i18n.t("AdminOperatorForm.operatorAddedSuccessfully"),
      MainMenu
    );
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});

module.exports = new Scenes.WizardScene(
  "OperatorWizard",
  startStep,
  setOperator,
  connectDealerStep
);
