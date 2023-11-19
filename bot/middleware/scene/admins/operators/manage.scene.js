const { Markup, Scenes, Composer } = require("telegraf");
const { match } = require("telegraf-i18n");
const {
  GetDealersWithPagination,
} = require("../../../../common/sequelize/dealer.sequelize");
const generateItemsKeyboard = require("../../../../functions/keyboards/admins/slider.keyboard");
const generateOperatorAdminKeys = require("../../../../functions/keyboards/admins/operator.keyboard");
const {
  GetOperators,
  GetOperatorById,
  DeleteOperator,
  ChangeDealer,
} = require("../../../../common/sequelize/operator.sequelize");

const sendOperatorKeys = async (ctx) => {
  try {
    const operators = await GetOperators(
      ctx.wizard.state.operator.operatorPage,
      ctx.wizard.state.operator.itemsPerPage
    );

    if (operators.totalItems === 0) {
      await ctx.reply(ctx.i18n.t("Client.emptyDataMsg"));
      return;
    }

    const endPage = Math.ceil(
      operators.totalItems / ctx.wizard.state.operator.itemsPerPage
    );
    const keyboards = [
      ...operators.items.map((item) => {
        const id = item.id;
        return [Markup.button.callback(id, `i_${item.id}`)];
      }),
    ];

    // Add pagination buttons
    const paginationButtons = [];
    if (ctx.wizard.state.operator.operatorPage > 1) {
      paginationButtons.push(Markup.button.callback("⬅️", `prev`));
    }
    if (ctx.wizard.state.operator.operatorPage < endPage) {
      paginationButtons.push(Markup.button.callback("➡️", `next`));
    }

    if (paginationButtons.length > 0) {
      keyboards.push(paginationButtons);
    }

    keyboards.push([
      Markup.button.callback(
        ctx.i18n.t("Client.cancelApplicationBtn"),
        `cancel`
      ),
    ]);

    // await ctx.deleteMessage(ctx.update.message.message_id);
    await ctx.reply(
      ctx.i18n.t("AdminOperatorForm.chooseOneOperatorMsg"),
      Markup.inlineKeyboard(keyboards)
    );
  } catch (error) {
    console.log(error);
  }
};

const sendDealerKeys = async (ctx) => {
  try {
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

const sendSingleOperatorKey = async (ctx) => {
  try {
    const operator = await GetOperatorById(ctx.wizard.state.operator.id);
    const dealerName =
      ctx.i18n.locale() === "uz"
        ? operator.dealer.name_uz
        : operator.dealer.name_ru;
    const msg = ctx.i18n.t("AdminOperatorForm.operatorInfoMsg", {
      name: operator.user.firstname ?? operator.user.lastName,
      phoneNumber: operator.user.phoneNumber,
      dealerName,
    });
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback(ctx.i18n.t("Admin.deleteBtn"), "delete")],
      [
        Markup.button.callback(
          ctx.i18n.t("AdminOperatorForm.changeDealerBtn"),
          "changeDealer"
        ),
      ],
      [
        Markup.button.callback(
          ctx.i18n.t("Client.cancelApplicationBtn"),
          `cancel`
        ),
      ],
    ]);
    ctx.reply(msg, keyboard);
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
startStep.hears(match("AdminOperatorForm.manageOperatorBtn"), async (ctx) => {
  try {
    ctx.wizard.state.operator = {};
    ctx.wizard.state.operator.operatorPage = 1;
    ctx.wizard.state.operator.itemsPerPage = 2;
    await sendOperatorKeys(ctx);
  } catch (e) {
    console.log(e);
  }
});
startStep.action("cancel", async (ctx) => {
  try {
    const MainMenu = await generateOperatorAdminKeys(ctx);
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.reply(ctx.i18n.t("Client.successfullyCancelledMsg"), MainMenu);
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});
startStep.action(["prev", "next"], async (ctx) => {
  try {
    const match = ctx.update?.callback_query?.data;
    switch (match) {
      case "prev":
        ctx.wizard.state.operator.operatorPage--;
        break;
      case "next":
        ctx.wizard.state.operator.operatorPage++;
        break;
    }
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await sendOperatorKeys(ctx);
  } catch (error) {
    console.log(error);
  }
});
startStep.on("callback_query", async (ctx) => {
  try {
    if (!ctx.update.callback_query?.data.includes("i_")) {
      return ctx.reply("invalid_callback_query");
    }
    const operatorId = parseInt(
      ctx.update.callback_query?.data.match(/i_(\d+)/)[1],
      10
    );
    ctx.wizard.state.operator.id = operatorId;
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await sendSingleOperatorKey(ctx);

    // await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    // await sendDealerKeys(ctx);
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});

const manageStep = new Composer();
manageStep.action("cancel", async (ctx) => {
  try {
    const MainMenu = await generateOperatorAdminKeys(ctx);
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.reply(ctx.i18n.t("Client.successfullyCancelledMsg"), MainMenu);
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});
manageStep.action("delete", async (ctx) => {
  try {
    await DeleteOperator(ctx.wizard.state.operator.id);
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await sendOperatorKeys(ctx);
    return ctx.wizard.back();
  } catch (error) {
    console.log(error);
  }
});
manageStep.action("changeDealer", async (ctx) => {
  try {
    // await ChangeDealer(ctx.wizard.state.order.id);
    ctx.wizard.state.operator.dealer = {};
    ctx.wizard.state.operator.dealer.dealerPage = 1;
    ctx.wizard.state.operator.dealer.itemsPerPage = 2;
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await sendDealerKeys(ctx);
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});

const connectDealerStep = new Composer();
connectDealerStep.action("cancel", async (ctx) => {
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
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await sendDealerKeys(ctx);
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
    await ChangeDealer(
      ctx.wizard.state.operator.id,
      ctx.wizard.state.operator.dealer.dealerId
    );
    const MainMenu = await generateOperatorAdminKeys(ctx);
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await sendSingleOperatorKey(ctx);
    return ctx.wizard.back();
  } catch (error) {
    console.log(error);
  }
});

module.exports = new Scenes.WizardScene(
  "ManageOperatorsWizard",
  startStep,
  manageStep,
  connectDealerStep
);
