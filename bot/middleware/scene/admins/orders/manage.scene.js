const { Markup, Scenes, Composer } = require("telegraf");
const { match } = require("telegraf-i18n");
const {
  GetDealersWithPagination,
  GetDealerById,
} = require("../../../../common/sequelize/dealer.sequelize");
const generateOrderAdminKeys = require("../../../../functions/keyboards/admins/order.keyboard");
const generateItemsKeyboard = require("../../../../functions/keyboards/admins/slider.keyboard");
const {
  GetAllInvalidOrders,
  GetOrderById,
  DeleteOrder,
  ConfirmOrder,
} = require("../../../../common/sequelize/order.sequelize");

const sendOrdersKeys = async (ctx, dealerId) => {
  try {
    let orders;

    if (dealerId) {
      orders = await GetAllInvalidOrders(
        ctx.wizard.state.order.orderPage,
        ctx.wizard.state.order.itemsPerPage,
        ctx.wizard.state.order.dealer.id
      );
    } else {
      orders = await GetAllInvalidOrders(
        ctx.wizard.state.order.orderPage,
        ctx.wizard.state.order.itemsPerPage
      );
    }

    if (orders.totalItems === 0) {
      await ctx.reply(ctx.i18n.t("Client.emptyDataMsg"));
      return;
    }

    const endPage = Math.ceil(
      orders.totalItems / ctx.wizard.state.order.itemsPerPage
    );
    const keyboards = [
      ...orders.items.map((item) => {
        const id = item.id;
        return [Markup.button.callback(id, `i_${item.id}`)];
      }),
    ];

    // Add pagination buttons
    const paginationButtons = [];
    if (ctx.wizard.state.order.orderPage > 1) {
      paginationButtons.push(Markup.button.callback("⬅️", `prev`));
    }
    if (ctx.wizard.state.order.orderPage < endPage) {
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

    await ctx.reply(
      ctx.i18n.t("AdminDealerForm.chooseDealerTxt"),
      Markup.inlineKeyboard(keyboards)
    );
  } catch (error) {
    console.log(error);
  }
};

const sendDealerKeys = async (ctx) => {
  try {
    const dealers = await GetDealersWithPagination(
      ctx.wizard.state.order.dealer.dealerPage,
      ctx.wizard.state.order.dealer.itemsPerPage
    );

    if (dealers.totalItems === 0) {
      await ctx.reply(ctx.i18n.t("Client.emptyDataMsg"));
      return;
    }

    const keyboard = generateItemsKeyboard(
      ctx.wizard.state.order.dealer.dealerPage,
      ctx.i18n.locale(),
      dealers.totalItems,
      ctx.wizard.state.order.dealer.itemsPerPage,
      dealers.items,
      ctx.i18n
    );
    // await ctx.deleteMessage(ctx.update.message.message_id);
    await ctx.reply(ctx.i18n.t("AdminDealerForm.chooseDealerTxt"), keyboard);
  } catch (error) {
    console.log(error);
  }
};

const startStep = new Composer();
startStep.hears(
  match("AdminOrderForm.recentUnValidatedOrdersBtn"),
  async (ctx) => {
    try {
      ctx.wizard.state.order = {};
      ctx.wizard.state.order.dealer = {};
      ctx.wizard.state.order.dealer.dealerPage = 1;
      ctx.wizard.state.order.dealer.itemsPerPage = 2;
      await sendDealerKeys(ctx);
    } catch (e) {
      console.log(e);
    }
  }
);
startStep.action("cancel", async (ctx) => {
  try {
    const MainMenu = await generateOrderAdminKeys(ctx);
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
        ctx.wizard.state.order.dealer.dealerPage--;
        break;
      case "next":
        ctx.wizard.state.order.dealer.dealerPage++;
        break;
    }
    const dealers = await GetDealersWithPagination(
      ctx.wizard.state.order.dealer.dealerPage,
      ctx.wizard.state.order.dealer.itemsPerPage
    );

    const keyboard = generateItemsKeyboard(
      ctx.wizard.state.order.dealer.dealerPage,
      ctx.i18n.locale(),
      dealers.totalItems,
      ctx.wizard.state.order.dealer.itemsPerPage,
      dealers.items,
      ctx.i18n
    );
    await ctx.editMessageText(
      ctx.i18n.t("AdminDealerForm.chooseDealerTxt"),
      keyboard
    );
  } catch (error) {
    console.log(error);
  }
});
startStep.on("callback_query", async (ctx) => {
  try {
    if (!ctx.update.callback_query?.data.includes("i_")) {
      return ctx.reply("invalid_callback_query");
    }
    const dealerId = parseInt(
      ctx.update.callback_query?.data.match(/i_(\d+)/)[1],
      10
    );
    ctx.wizard.state.order.orderPage = 1;
    ctx.wizard.state.order.itemsPerPage = 2;
    ctx.wizard.state.order.dealer.id = dealerId;

    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await sendOrdersKeys(ctx);
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});

const sendOrdersStep = new Composer();
sendOrdersStep.action("cancel", async (ctx) => {
  try {
    const MainMenu = await generateOrderAdminKeys(ctx);
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.reply(ctx.i18n.t("Client.successfullyCancelledMsg"), MainMenu);
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});
sendOrdersStep.action(["prev", "next"], async (ctx) => {
  try {
    const match = ctx.update?.callback_query?.data;
    switch (match) {
      case "prev":
        ctx.wizard.state.order.orderPage--;
        break;
      case "next":
        ctx.wizard.state.order.orderPage++;
        break;
    }
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await sendOrdersKeys(ctx);
  } catch (error) {
    console.log(error);
  }
});
sendOrdersStep.on("callback_query", async (ctx) => {
  try {
    if (!ctx.update.callback_query?.data.includes("i_")) {
      return ctx.reply("invalid_callback_query");
    }
    const orderId = parseInt(
      ctx.update.callback_query?.data.match(/i_(\d+)/)[1],
      10
    );
    const order = await GetOrderById(orderId);
    const id = order.id;
    const orderAmount = new Intl.NumberFormat(ctx.i18n.locale(), {
      style: "currency",
      currency: "UZS",
    }).format(order.amount);
    const orderConfirm = order.confirm === true ? "✅" : "❌";
    const order_caption = ctx.i18n.t("AdminOrderForm.orderUpdateMsg", {
      id,
      amount: orderAmount,
      confirmed: orderConfirm,
    });

    ctx.wizard.state.order.id = orderId;
    ctx.wizard.state.order.keyboard = Markup.inlineKeyboard([
      [Markup.button.callback(ctx.i18n.t("Admin.deleteBtn"), "delete")],
      [
        Markup.button.callback(
          ctx.i18n.t("AdminOrderForm.confirmBtn"),
          "confirm"
        ),
      ],
      [Markup.button.callback(ctx.i18n.t("Client.backOneStepMsg"), "back")],
    ]);

    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.reply(order_caption, ctx.wizard.state.order.keyboard);
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});

const manageStep = new Composer();
manageStep.action("cancel", async (ctx) => {
  try {
    const MainMenu = await generateOrderAdminKeys(ctx);
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.reply(ctx.i18n.t("Client.successfullyCancelledMsg"), MainMenu);
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});
manageStep.action("delete", async (ctx) => {
  try {
    await DeleteOrder(ctx.wizard.state.order.id);
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await sendOrdersKeys(ctx);
    return ctx.wizard.back();
  } catch (error) {
    console.log(error);
  }
});
manageStep.action("confirm", async (ctx) => {
  try {
    await ConfirmOrder(ctx.wizard.state.order.id);
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await sendOrdersKeys(ctx);
    return ctx.wizard.back();
  } catch (error) {
    console.log(error);
  }
});

module.exports = new Scenes.WizardScene(
  "ManageOrdersWizard",
  startStep,
  sendOrdersStep,
  manageStep
);
