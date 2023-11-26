const { Markup, Scenes, Composer } = require("telegraf");
const { match } = require("telegraf-i18n");
const {
  GetUserByNumber,
  getUser,
} = require("../../../../common/sequelize/user.sequelize");
const {
  GetOrdersByClient,
  GetOrderById,
  ConfirmOrder,
} = require("../../../../common/sequelize/order.sequelize");
const User = require("../../../../model/user.model");

const paginateOrders = async (ctx, userChatId) => {
  try {
    let caption = "";
    const orders = await GetOrdersByClient(
      ctx.wizard.state.orderData.orderPage,
      ctx.wizard.state.orderData.itemsPerPage,
      userChatId
    );

    if (orders.totalItems === 0) {
      ctx.wizard.state.orderData.caption = ctx.i18n.t("Client.emptyDataMsg");
      ctx.wizard.state.orderData.keyboard = [];
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
      orders.totalItems / ctx.wizard.state.orderData.itemsPerPage
    );
    const keyboards = [];
    // Add pagination buttons
    const paginationButtons = [];
    if (ctx.wizard.state.orderData.page > 1) {
      paginationButtons.push(Markup.button.callback("⬅️", `prev`));
    }
    if (ctx.wizard.state.orderData.page < endPage) {
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

    ctx.wizard.state.orderData.caption = caption;
    ctx.wizard.state.orderData.keyboard = Markup.inlineKeyboard(keyboards);
  } catch (error) {
    console.log(error);
  }
};

const handleScore = async (ctx, user, amount) => {
  try {
    const currentScore = parseFloat(user?.score);
    const newScore = (amount * 1) / 100000000;
    const finalScore = parseFloat((currentScore + newScore).toFixed(5));

    await User.update({ score: finalScore }, { where: { chatID: user.id } });

    await ctx.telegram.sendMessage(
      user.chatID,
      ctx.i18n.t("Client.orderIsConfirmedMsg", {
        newScore,
        score: finalScore,
      })
    );
  } catch (error) {
    console.log(error);
  }
};

const startStep = new Composer();
startStep.hears(match("AdminOrderForm.orderStatusBtn"), async (ctx) => {
  try {
    ctx.wizard.state.orderData = {};
    ctx.wizard.state.orderData.orderPage = 1;
    ctx.wizard.state.orderData.itemsPerPage = 15;
    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback(
          ctx.i18n.t("AdminOrderForm.phoneNumberBtn"),
          "phoneNumber"
        ),
      ],
      [Markup.button.callback("ID", "withID")],
    ]);
    await ctx.reply(ctx.i18n.t("AdminOrderForm.orderViewTypesMsg"), keyboard);
  } catch (error) {
    console.log(error);
  }
});
startStep.action("phoneNumber", async (ctx) => {
  try {
    await ctx.editMessageText(ctx.i18n.t("AdminOrderForm.sendUserPhoneNumber"));
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});
startStep.action("withID", async (ctx) => {
  try {
    ctx.editMessageText(ctx.i18n.t("AdminOrderForm.sendOrderIdMsg"));
    await ctx.wizard.selectStep(2);
  } catch (error) {
    console.log(error);
  }
});

const getOrderDetails = new Composer();
getOrderDetails.action("cancel", async (ctx) => {
  try {
    await ctx.reply(ctx.i18n.t("Client.successfullyCancelledMsg"));
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});
getOrderDetails.command("cancel", async (ctx) => {
  try {
    await ctx.reply(ctx.i18n.t("Client.successfullyCancelledMsg"));
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});
getOrderDetails.on("message", async (ctx) => {
  try {
    const phoneRegex = /^\d{12}$/;
    if (!phoneRegex.test(ctx.message.text)) {
      return await ctx.reply(ctx.i18n.t("Client.sendValidPhoneNumberMsg"));
    }
    ctx.wizard.state.orderData.phoneNumber = ctx.message.text;
    const user = await GetUserByNumber(ctx.wizard.state.orderData.phoneNumber);
    await paginateOrders(ctx, user.chatID);
    await ctx.reply(
      ctx.wizard.state.orderData.caption,
      ctx.wizard.state.orderData.keyboard
    );
    return;
  } catch (error) {
    console.log(error);
  }
});

const manageOrderStep = new Composer();
manageOrderStep.on("message", async (ctx) => {
  try {
    ctx.wizard.state.orderData.orderId = ctx.message.text;
    const order = await GetOrderById(ctx.wizard.state.orderData.orderId);

    if (!order) {
      await ctx.reply(ctx.i18n.t("Client.emptyDataMsg"));
      return ctx.scene.leave();
    }

    const user = await getUser(order.clientChatID);
    const orderDate = new Intl.DateTimeFormat(ctx.i18n.locale(), {
      minute: "2-digit",
      hour: "2-digit",
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Tashkent",
    }).format(order?.createdAt);
    const orderMsg = {
      text: ctx.i18n.t("AdminOrderForm.orderCaptionMsg", {
        id: order.id,
        amount: order.amount,
        confirmed: order.isValidated ? "✅️️️️️️️" : "❌",
        name: user.firstName + " " + user.lastName,
        phoneNumber: user.phoneNumber,
        date: orderDate,
      }),
    };
    ctx.wizard.state.orderData.user = user;
    ctx.wizard.state.orderData.orderAmount = order.amount;

    if (order.isValidated) {
      await ctx.reply(orderMsg.text);
      return ctx.scene.leave();
    } else {
      const keyboard = Markup.inlineKeyboard([
        Markup.button.callback(
          ctx.i18n.t("AdminOrderForm.confirmBtn"),
          "confirm"
        ),
      ]);
      await ctx.reply(orderMsg.text, keyboard);
      return ctx.wizard.next();
    }
  } catch (error) {
    console.log(error);
  }
});

const confirmOrderStep = new Composer();
confirmOrderStep.action("confirm", async (ctx) => {
  try {
    await ConfirmOrder(ctx.wizard.state.orderData.orderId);
    await handleScore(
      ctx,
      ctx.wizard.state.orderData.user,
      ctx.wizard.state.orderData.orderAmount
    );
    await ctx.editMessageText(ctx.i18n.t("AdminOrderForm.orderIsConfirmedMsg"));
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});

module.exports = new Scenes.WizardScene(
  "OrderStatusWizard",
  startStep,
  getOrderDetails,
  manageOrderStep,
  confirmOrderStep
);
