const { Markup, Scenes, Composer } = require("telegraf");
const {
  getRegionsWithPagination,
} = require("../../../common/sequelize/region.sequelize");
const generatePaginatedInlineKeyboards = require("../../../functions/keyboards/clients/generatePagination");
const {
  GetDealersByRegionId,
} = require("../../../common/sequelize/dealer.sequelize");
const {
  GetProductsByDealerId,
  GetProductById,
} = require("../../../common/sequelize/product.sequelize");
const {
  CreateOrderBeforeValid,
} = require("../../../common/sequelize/order.sequelize");
const {
  GetOperatorsByDealerId,
} = require("../../../common/sequelize/operator.sequelize");
const generateMainMenuKeys = require("../../../functions/keyboards/main-menu.keyboard");

const getRegion = new Composer();
getRegion.action("cancel", async (ctx) => {
  await ctx.reply(ctx.i18n.t("Client.applicationCanceledMsg"));
  return ctx.scene.leave();
});
getRegion.on("message", async (ctx) => {
  try {
    // Define inital state in session
    ctx.wizard.state.formData = {};
    ctx.wizard.state.clientChatID = String(ctx.chat.id);
    ctx.wizard.state.formData.region = {};
    ctx.wizard.state.formData.region.regionPage = 1;
    ctx.wizard.state.formData.region.itemsPerPage = 2;

    const regions = await getRegionsWithPagination(
      ctx.wizard.state.formData.region.regionPage,
      ctx.wizard.state.formData.region.itemsPerPage
    );
    const keyboard = generatePaginatedInlineKeyboards(
      ctx.wizard.state.formData.region.regionPage,
      ctx.i18n.locale(),
      regions.totalItems,
      ctx.wizard.state.formData.region.itemsPerPage,
      regions.items,
      ctx.i18n,
      true
    );

    await ctx.reply("...", Markup.removeKeyboard());
    await ctx.deleteMessage(ctx.update.message.message_id + 1);
    setTimeout(async () => {
      await ctx.reply(ctx.i18n.t("chooseRegionInfo"), keyboard);
    }, 500);
  } catch (error) {
    console.log(error);
  }
});
getRegion.action(["prev", "next"], async (ctx) => {
  try {
    const match = ctx.update?.callback_query?.data;
    switch (match) {
      case "prev":
        ctx.wizard.state.formData.region.regionPage--;
        break;
      case "next":
        ctx.wizard.state.formData.region.regionPage++;
        break;
    }
    const regions = await getRegionsWithPagination(
      ctx.wizard.state.formData.region.regionPage,
      ctx.wizard.state.formData.region.itemsPerPage
    );
    const keyboard = generatePaginatedInlineKeyboards(
      ctx.wizard.state.formData.region.regionPage,
      ctx.i18n.locale(),
      regions.totalItems,
      ctx.wizard.state.formData.region.itemsPerPage,
      regions.items,
      ctx.i18n,
      true
    );
    await ctx.editMessageText(ctx.i18n.t("chooseRegionInfo"), keyboard);
  } catch (error) {
    console.log(error);
  }
});
getRegion.on("callback_query", async (ctx) => {
  try {
    if (!ctx.update.callback_query?.data.includes("i_")) {
      return ctx.reply("invalid_callback_query");
    }
    const regionId = parseInt(
      ctx.update.callback_query?.data.match(/i_(\d+)/)[1],
      10
    );
    if (!regionId) {
      return ctx.reply("region_not_found");
    }
    ctx.wizard.state.formData.region.regionId = regionId;
    ctx.wizard.state.formData.dealer = {};
    ctx.wizard.state.formData.dealer.dealerPage = 1;
    ctx.wizard.state.formData.dealer.itemsPerPage = 2;
    const dealers = await GetDealersByRegionId(
      ctx.wizard.state.formData.region.regionId,
      ctx.wizard.state.formData.dealer.dealerPage,
      ctx.wizard.state.formData.dealer.itemsPerPage
    );

    if (dealers.totalItems === 0) {
      await ctx.answerCbQuery(ctx.i18n.t("Client.emptyDataMsg"));
      return;
    }

    const keyboard = generatePaginatedInlineKeyboards(
      ctx.wizard.state.formData.dealer.dealerPage,
      ctx.i18n.locale(),
      dealers.totalItems,
      ctx.wizard.state.formData.dealer.itemsPerPage,
      dealers.items,
      ctx.i18n
    );

    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.reply(ctx.i18n.t("Client.chooseDealerTxt"), keyboard);
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});

const getDealer = new Composer();
getDealer.action("cancel", async (ctx) => {
  await ctx.reply(ctx.i18n.t("Client.applicationCanceledMsg"));
  return ctx.scene.leave();
});
getDealer.action("back", async (ctx) => {
  try {
    ctx.wizard.state.formData.region.regionPage = 1;
    const regions = await getRegionsWithPagination(
      ctx.wizard.state.formData.region.regionPage,
      ctx.wizard.state.formData.region.itemsPerPage
    );
    const keyboard = generatePaginatedInlineKeyboards(
      ctx.wizard.state.formData.region.regionPage,
      ctx.i18n.locale(),
      regions.totalItems,
      ctx.wizard.state.formData.region.itemsPerPage,
      regions.items,
      ctx.i18n,
      true
    );

    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.reply(ctx.i18n.t("chooseRegionInfo"), keyboard);
    return ctx.wizard.back();
  } catch (error) {
    console.log(error);
  }
});
getDealer.action(["prev", "next"], async (ctx) => {
  try {
    const match = ctx.update?.callback_query?.data;
    switch (match) {
      case "prev":
        ctx.wizard.state.formData.dealer.dealerPage--;
        break;
      case "next":
        ctx.wizard.state.formData.dealer.dealerPage++;
        break;
    }
    const dealers = await GetDealersByRegionId(
      ctx.wizard.state.formData.region.regionId,
      ctx.wizard.state.formData.dealer.dealerPage,
      ctx.wizard.state.formData.dealer.itemsPerPage
    );
    const keyboard = generatePaginatedInlineKeyboards(
      ctx.wizard.state.formData.dealer.dealerPage,
      ctx.i18n.locale(),
      dealers.totalItems,
      ctx.wizard.state.formData.dealer.itemsPerPage,
      dealers.items,
      ctx.i18n
    );
    await ctx.editMessageText(ctx.i18n.t("Client.chooseDealerTxt"), keyboard);
  } catch (error) {
    console.log(error);
  }
});
getDealer.on("callback_query", async (ctx) => {
  try {
    if (!ctx.update.callback_query?.data.includes("i_")) {
      return ctx.reply("invalid_callback_query");
    }
    const dealerId = parseInt(
      ctx.update.callback_query?.data.match(/i_(\d+)/)[1],
      10
    );
    ctx.wizard.state.formData.dealer.dealerId = dealerId;
    ctx.wizard.state.formData.product = {};
    ctx.wizard.state.formData.product.productPage = 1;
    ctx.wizard.state.formData.product.itemsPerPage = 2;

    const products = await GetProductsByDealerId(
      ctx.wizard.state.formData.dealer.dealerId,
      ctx.wizard.state.formData.product.productPage,
      ctx.wizard.state.formData.product.itemsPerPage
    );

    if (products.totalItems === 0) {
      await ctx.answerCbQuery(ctx.i18n.t("Client.emptyDataMsg"));
      return;
    }

    const keyboard = generatePaginatedInlineKeyboards(
      ctx.wizard.state.formData.product.productPage,
      ctx.i18n.locale(),
      products.totalItems,
      ctx.wizard.state.formData.product.itemsPerPage,
      products.items,
      ctx.i18n
    );
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.reply(ctx.i18n.t("Client.chooseProductTxt"), keyboard);
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});

const getProduct = new Composer();
getProduct.action("cancel", async (ctx) => {
  await ctx.reply(ctx.i18n.t("Client.applicationCanceledMsg"));
  return ctx.scene.leave();
});
getProduct.action("back", async (ctx) => {
  try {
    ctx.wizard.state.formData.dealer.dealerPage = 1;
    const dealers = await GetDealersByRegionId(
      ctx.wizard.state.formData.region.regionId,
      ctx.wizard.state.formData.dealer.dealerPage,
      ctx.wizard.state.formData.dealer.itemsPerPage
    );
    const keyboard = generatePaginatedInlineKeyboards(
      ctx.wizard.state.formData.dealer.dealerPage,
      ctx.i18n.locale(),
      dealers.totalItems,
      ctx.wizard.state.formData.dealer.itemsPerPage,
      dealers.items,
      ctx.i18n
    );

    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.reply(ctx.i18n.t("Client.chooseDealerTxt"), keyboard);
    return ctx.wizard.back();
  } catch (error) {
    console.log(error);
  }
});
getProduct.action(["prev", "next"], async (ctx) => {
  try {
    const match = ctx.update?.callback_query?.data;
    switch (match) {
      case "prev":
        ctx.wizard.state.formData.product.productPage--;
        break;
      case "next":
        ctx.wizard.state.formData.product.productPage++;
        break;
    }
    const products = await GetProductsByDealerId(
      ctx.wizard.state.formData.dealer.dealerId,
      ctx.wizard.state.formData.product.productPage,
      ctx.wizard.state.formData.product.itemsPerPage
    );
    const keyboard = generatePaginatedInlineKeyboards(
      ctx.wizard.state.formData.product.productPage,
      ctx.i18n.locale(),
      products.totalItems,
      ctx.wizard.state.formData.product.itemsPerPage,
      products.items,
      ctx.i18n
    );
    await ctx.editMessageText(ctx.i18n.t("Client.chooseProductTxt"), keyboard);
  } catch (error) {
    console.log(error);
  }
});
getProduct.on("callback_query", async (ctx) => {
  try {
    if (!ctx.update.callback_query?.data.includes("i_")) {
      return ctx.reply("invalid_callback_query");
    }
    const productId = parseInt(
      ctx.update.callback_query?.data.match(/i_(\d+)/)[1],
      10
    );
    ctx.wizard.state.formData.productId = productId;
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.reply(
      ctx.i18n.t("Client.enterAmountTxt"),
      Markup.inlineKeyboard([
        [Markup.button.callback(ctx.i18n.t("Client.backOneStepMsg"), `back`)],
        [
          Markup.button.callback(
            ctx.i18n.t("Client.cancelApplicationBtn"),
            `cancel`
          ),
        ],
      ])
    );
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});

const getAmount = new Composer();
getAmount.action("cancel", async (ctx) => {
  await ctx.reply(ctx.i18n.t("Client.applicationCanceledMsg"));
  return ctx.scene.leave();
});
getAmount.action("back", async (ctx) => {
  try {
    ctx.wizard.state.formData.product.productPage = 1;
    const products = await GetProductsByDealerId(
      ctx.wizard.state.formData.dealer.dealerId,
      ctx.wizard.state.formData.product.productPage,
      ctx.wizard.state.formData.product.itemsPerPage
    );

    const keyboard = generatePaginatedInlineKeyboards(
      ctx.wizard.state.formData.product.productPage,
      ctx.i18n.locale(),
      products.totalItems,
      ctx.wizard.state.formData.product.itemsPerPage,
      products.items,
      ctx.i18n
    );
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.reply(ctx.i18n.t("Client.chooseProductTxt"), keyboard);
    return ctx.wizard.back();
  } catch (error) {
    console.log(error);
  }
});
getAmount.on("message", async (ctx) => {
  try {
    const amount = ctx.message.text;
    const numberPattern = /^(\d{1,3}([ ,]\d{3})*|(\d+))(\.\d{1,2})?$/;
    if (!numberPattern.test(amount)) {
      ctx.reply(ctx.i18n.t("Client.wrongAmountMsg"));
      return;
    }
    const rawAmount = amount.replace(/[, ]/g, "");

    const newOrder = await CreateOrderBeforeValid(
      rawAmount,
      ctx.wizard.state.clientChatID,
      ctx.wizard.state.formData.dealer.dealerId
    );
    console.log(newOrder);

    ctx.wizard.state.formData.productAmount = amount;
    const product = await GetProductById(ctx.wizard.state.formData.productId);
    const productName =
      ctx.i18n.locale() === "uz" ? product?.name_uz : product?.name_ru;
    const operatorNotification = {
      text: `${ctx.i18n.t(
        "Client.operatorNotificationTxt"
      )}\n\nProduct:${productName}\nAmount: ${
        ctx.wizard.state.formData.productAmount
      }`,
      buttons: Markup.inlineKeyboard([
        [Markup.button.callback("Confirm", `confirm_purchase_${newOrder?.id}`)],
      ])
        .oneTime()
        .resize(),
    };

    // Send it to Operators
    const operators = await GetOperatorsByDealerId(
      ctx.wizard.state.formData.dealer.dealerId
    );

    const processedOperators = new Set();
    const interval = setInterval(() => {
      operators.forEach(async (operator) => {
        if (!processedOperators.has(operator.chatId)) {
          try {
            await ctx.telegram.sendMessage(
              operator.chatId,
              operatorNotification.text,
              operatorNotification.buttons
            );
            processedOperators.add(operator.chatId);
            // console.log(`Message sent to ${operator.name}`);
          } catch (error) {
            console.error(
              `Error sending message to operator.name: ${error.message}`
            );
          }
        }
      });
    }, 3000);

    // Stop sending messages after a certain time (e.g., 30 seconds)
    setTimeout(() => {
      clearInterval(interval);
      console.log("Messages sent to all operators.");
    }, 30000); // Stop after 30 seconds (30000 milliseconds)

    const finalMsg = {
      text: ctx.i18n.t("Client.waitForOperatorsMsg"),
      buttons: await generateMainMenuKeys(ctx),
    };

    await ctx.reply(finalMsg.text, finalMsg.buttons);
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});

module.exports = new Scenes.WizardScene(
  "FirstEventWizard",
  getRegion,
  getDealer,
  getProduct,
  getAmount
);
