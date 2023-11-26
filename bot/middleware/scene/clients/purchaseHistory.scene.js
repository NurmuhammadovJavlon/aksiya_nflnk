const { Markup, Scenes, Composer } = require("telegraf");
const { match } = require("telegraf-i18n");
const {
  GetOrdersByClient,
} = require("../../../common/sequelize/order.sequelize");
const generateScorePageButtons = require("../../../functions/keyboards/clients/getScoreKeyboard");

const paginateOrders = async (ctx) => {
  try {
    let caption = "";
    const orders = await GetOrdersByClient(
      ctx.wizard.state.purchaseHistory.page,
      ctx.wizard.state.purchaseHistory.itemsPerPage,
      ctx.wizard.state.purchaseHistory.clientChatId
    );

    if (orders.totalItems === 0) {
      ctx.wizard.state.purchaseHistory.caption = ctx.i18n.t(
        "Client.emptyDataMsg"
      );
      ctx.wizard.state.purchaseHistory.keyboard = [];
      return;
    }

    orders.items.forEach((item) => {
      const date = item.createdAt.toLocaleString(ctx.i18n.locale(), {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        timeZoneName: "short",
      });
      const status =
        item.status === "PENDING"
          ? "⌛"
          : item.status === "FINISHED"
          ? "✅"
          : "";

      const amount = new Intl.NumberFormat(ctx.i18n.locale(), {
        style: "currency",
        currency: "UZS",
      }).format(item.amount);

      caption +=
        "\n\n" +
        ctx.i18n.t("purchaseHistoryMsg", {
          orderId: item.id,
          amount,
          dealerName:
            ctx.i18n.locale() === "uz"
              ? item.dealer.name_uz
              : item.dealer.name_ru,
          status,
          date,
        });
    });
    const endPage = Math.ceil(
      orders.totalItems / ctx.wizard.state.purchaseHistory.itemsPerPage
    );
    const keyboards = [];
    // Add pagination buttons
    const paginationButtons = [];
    if (ctx.wizard.state.purchaseHistory.page > 1) {
      paginationButtons.push(Markup.button.callback("⬅️", `prev`));
    }
    if (ctx.wizard.state.purchaseHistory.page < endPage) {
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

    ctx.wizard.state.purchaseHistory.caption = caption;
    ctx.wizard.state.purchaseHistory.keyboard =
      Markup.inlineKeyboard(keyboards);
  } catch (error) {
    console.log(error);
  }
};

const startStep = new Composer();
startStep.hears(match("Score.purchaseHistoryBtn"), async (ctx) => {
  try {
    ctx.wizard.state.purchaseHistory = {};
    ctx.wizard.state.purchaseHistory.page = 1;
    ctx.wizard.state.purchaseHistory.itemsPerPage = 15;
    ctx.wizard.state.purchaseHistory.caption = "";
    ctx.wizard.state.purchaseHistory.clientChatId = String(ctx.chat.id);
    await paginateOrders(ctx);
    await ctx.reply(
      ctx.wizard.state.purchaseHistory.caption,
      ctx.wizard.state.purchaseHistory.keyboard
    );
    // return ctx.wizard.next();
  } catch (e) {
    console.log(e);
  }
});
startStep.action("cancel", async (ctx) => {
  try {
    const MainMenu = generateScorePageButtons(ctx);
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
        ctx.wizard.state.purchaseHistory.page--;
        break;
      case "next":
        ctx.wizard.state.purchaseHistory.page++;
        break;
    }
    await paginateOrders(ctx);
    await ctx.editMessageText(
      ctx.wizard.state.purchaseHistory.caption,
      ctx.wizard.state.purchaseHistory.keyboard
    );
  } catch (error) {
    console.log(error);
  }
});

module.exports = new Scenes.WizardScene("PurchaseHistoryWizard", startStep);
