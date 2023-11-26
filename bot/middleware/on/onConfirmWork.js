const {
  GetBestWorkById,
} = require("../../common/sequelize/bestwork.sequelize");
const bot = require("../../connection/token.connection");
const BestWork = require("../../model/bestwork.model");
const Order = require("../../model/order.model");
const User = require("../../model/user.model");

module.exports = bot.action(/^confirm_w_(\d+)$/, async (ctx) => {
  try {
    const workId = parseInt(ctx.match[1]) ?? null;
    const work = await GetBestWorkById(workId);

    if (!work) return;

    if (work.status !== "FINISHED") {
      await BestWork.update(
        { status: "FINISHED", isConfirmed: true },
        {
          where: {
            id: workId,
          },
        }
      );

      // Operator related
      // Edit the reply markup (remove the inline keyboard)
      ctx.editMessageReplyMarkup();
      return;
    }

    await ctx.reply(ctx.i18n.t("Client.videoIsConfirmedMsg"));
  } catch (error) {
    console.log(error);
  }
});
