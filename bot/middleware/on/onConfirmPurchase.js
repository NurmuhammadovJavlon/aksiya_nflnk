const bot = require("../../connection/token.connection");
const Order = require("../../model/order.model");
const User = require("../../model/user.model");

module.exports = bot.action(/confirm_purchase_(\d+)/, async (ctx) => {
  try {
    const orderId = parseInt(
      ctx.callbackQuery.data.match(/confirm_purchase_(\d+)/)[1]
    );

    const order = await Order.findOne({
      where: {
        id: orderId,
      },
      raw: true,
    });

    if (!order) {
      return;
    }

    if (order.status !== "FINISHED") {
      await Order.update(
        { status: "FINISHED", isValidated: true },
        {
          where: {
            id: orderId,
          },
        }
      );

      // Operator related
      await ctx.deleteMessage(ctx.update?.callback_query?.message?.message_id);
      await ctx.reply(ctx.i18n.t("Operator.operatorConfirmedMsg"));

      // Client related
      const user = await User.findOne({
        where: {
          chatID: order.clientChatID,
        },
        raw: true,
      });

      const currentScore = parseFloat(user?.score);
      const newScore = (order.amount * 1) / 100000000;
      const finalScore = parseFloat((currentScore + newScore).toFixed(5));

      await User.update(
        { score: finalScore },
        { where: { chatID: order.clientChatID } }
      );

      await ctx.telegram.sendMessage(
        order.clientChatID,
        ctx.i18n.t("Client.orderIsConfirmedMsg", {
          newScore,
          score: finalScore,
        })
      );
      return;
    }

    await ctx.deleteMessage(ctx.update?.callback_query?.message?.message_id);
    await ctx.reply(ctx.i18n.t("Client.purchaseIsConfirmedMsg"));
  } catch (error) {
    console.log(error);
  }
});
