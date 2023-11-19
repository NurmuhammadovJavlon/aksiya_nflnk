const { Markup, Scenes, Composer } = require("telegraf");
const { match } = require("telegraf-i18n");
const { GetAllRegions } = require("../../../common/sequelize/region.sequelize");
const {
  GetDealersByRegionId,
} = require("../../../common/sequelize/dealer.sequelize");
const {
  GetProductsByDealerId,
  GetProductById,
} = require("../../../common/sequelize/product.sequelize");
const {
  GetOperatorsByDealerId,
} = require("../../../common/sequelize/operator.sequelize");
const {
  CreateOrderBeforeValid,
} = require("../../../common/sequelize/order.sequelize");
const { GetUserScore } = require("../../../common/sequelize/user.sequelize");

const initScene = new Composer();
initScene.on("message", async (ctx) => {
  try {
    ctx.wizard.state.formData = {};
    ctx.wizard.state.clientChatID = String(ctx.chat.id);
    const regions = await GetAllRegions();
    const lang = ctx.i18n.locale();
    const inlineRegionKeys = [
      ...regions.map((region) => {
        const name =
          lang === "uz"
            ? region.name_uz
            : lang === "ru"
            ? region.name_ru
            : null;
        return [Markup.button.callback(name, `r_${region.id}`)];
      }),
      [
        Markup.button.callback(
          ctx.i18n.t("Client.cancelApplicationBtn"),
          `cancel`
        ),
      ],
    ];

    await ctx.reply("...", Markup.removeKeyboard());
    await ctx.deleteMessage(ctx.update.message.message_id + 1);
    setTimeout(async () => {
      await ctx.reply(ctx.i18n.t("chooseRegionInfo"), {
        reply_markup: {
          // keyboard: [[Markup.button.text(ctx.i18n.t("backToPrMenuBtn"))]],
          inline_keyboard: inlineRegionKeys,
        },
      });
    }, 500);
    return ctx.wizard.next();
  } catch (e) {
    console.log(e);
  }
});

const getDealer = new Composer();
// Cancel Scene
getDealer.action("cancel", (ctx) => {
  ctx.reply(ctx.i18n.t("Client.applicationCanceledMsg"));
  return ctx.scene.leave();
});
getDealer.on("callback_query", async (ctx) => {
  try {
    const regionId = parseInt(
      ctx.update.callback_query?.data.match(/r_(\d+)/)[1],
      10
    );
    ctx.wizard.state.formData.regionId = regionId;
    const dealers = await GetDealersByRegionId(regionId);
    const dealerInlineKeys = Markup.inlineKeyboard([
      ...dealers.map((dealer) => [
        Markup.button.callback(dealer.name, `d_${dealer.id}`),
      ]),
      [
        Markup.button.callback(
          ctx.i18n.t("Client.backOneStepMsg"),
          `backOneStep`
        ),
      ],
      [
        Markup.button.callback(
          ctx.i18n.t("Client.cancelApplicationBtn"),
          `cancel`
        ),
      ],
    ]);
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.reply(ctx.i18n.t("Client.chooseDealerTxt"), dealerInlineKeys);
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});

const getProducts = new Composer();
// Cancel Scene
getProducts.action("cancel", (ctx) => {
  ctx.reply(ctx.i18n.t("Client.applicationCanceledMsg"));
  return ctx.scene.leave();
});
// Step Back
getProducts.action("backOneStep", async (ctx) => {
  try {
    const regions = await GetAllRegions();
    const lang = ctx.i18n.locale();
    const inlineRegionKeys = [
      ...regions.map((region) => {
        const name =
          lang === "uz"
            ? region.name_uz
            : lang === "ru"
            ? region.name_ru
            : null;
        return [Markup.button.callback(name, `r_${region.id}`)];
      }),
      [
        Markup.button.callback(
          ctx.i18n.t("Client.cancelApplicationBtn"),
          `cancel`
        ),
      ],
    ];

    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    setTimeout(async () => {
      await ctx.reply(ctx.i18n.t("chooseRegionInfo"), {
        reply_markup: {
          // keyboard: [[Markup.button.text(ctx.i18n.t("backToPrMenuBtn"))]],
          inline_keyboard: inlineRegionKeys,
        },
      });
    }, 500);
    ctx.wizard.back(); // Set the listener to the previous function
  } catch (error) {
    console.log(error);
  }
});
getProducts.on("callback_query", async (ctx) => {
  try {
    const dealerId = parseInt(
      ctx.update.callback_query?.data.match(/d_(\d+)/)[1],
      10
    );
    ctx.wizard.state.formData.dealerId = dealerId;
    const products = await GetProductsByDealerId(dealerId);
    const productInlineKeys = Markup.inlineKeyboard([
      ...products.map((product) => [
        Markup.button.callback(product.name, `p_${product.id}`),
      ]),
      [
        Markup.button.callback(
          ctx.i18n.t("Client.backOneStepMsg"),
          `backOneStep`
        ),
      ],
      [
        Markup.button.callback(
          ctx.i18n.t("Client.cancelApplicationBtn"),
          `cancel`
        ),
      ],
    ]);
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.reply(ctx.i18n.t("Client.chooseProductTxt"), productInlineKeys);
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});

const getAmount = new Composer();
getAmount.action("cancel", (ctx) => {
  ctx.reply(ctx.i18n.t("Client.applicationCanceledMsg"));
  return ctx.scene.leave();
});
getAmount.action("backOneStep", async (ctx) => {
  try {
    const dealers = await GetDealersByRegionId(
      ctx.wizard.state.formData.regionId
    );
    const dealerInlineKeys = Markup.inlineKeyboard([
      ...dealers.map((dealer) => [
        Markup.button.callback(dealer.name, `d_${dealer.id}`),
      ]),
      [
        Markup.button.callback(
          ctx.i18n.t("Client.backOneStepMsg"),
          `backOneStep`
        ),
      ],
      [
        Markup.button.callback(
          ctx.i18n.t("Client.cancelApplicationBtn"),
          `cancel`
        ),
      ],
    ]);
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.reply(ctx.i18n.t("Client.chooseDealerTxt"), dealerInlineKeys);
    return ctx.wizard.back(); // Set the listener to the previous function
  } catch (error) {
    console.log(error);
  }
});
getAmount.on("callback_query", async (ctx) => {
  try {
    const productId = parseInt(
      ctx.update.callback_query?.data.match(/p_(\d+)/)[1],
      10
    );
    ctx.wizard.state.formData.productId = productId;
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.reply(
      ctx.i18n.t("Client.enterAmountTxt"),
      Markup.inlineKeyboard([
        [
          Markup.button.callback(
            ctx.i18n.t("Client.backOneStepMsg"),
            `backOneStep`
          ),
        ],
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

const validatePurchase = new Composer();
validatePurchase.action("cancel", (ctx) => {
  ctx.reply(ctx.i18n.t("Client.applicationCanceledMsg"));
  return ctx.scene.leave();
});
validatePurchase.action("backOneStep", async (ctx) => {
  try {
    const products = await GetProductsByDealerId(
      ctx.wizard.state.formData.dealerId
    );
    const productInlineKeys = Markup.inlineKeyboard([
      ...products.map((product) => [
        Markup.button.callback(product.name, `p_${product.id}`),
      ]),
      [
        Markup.button.callback(
          ctx.i18n.t("Client.backOneStepMsg"),
          `backOneStep`
        ),
      ],
      [
        Markup.button.callback(
          ctx.i18n.t("Client.cancelApplicationBtn"),
          `cancel`
        ),
      ],
    ]);
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.reply(ctx.i18n.t("Client.chooseProductTxt"), productInlineKeys);
    return ctx.wizard.back(); // Set the listener to the previous function
  } catch (error) {
    console.log(error);
  }
});
validatePurchase.on("message", async (ctx) => {
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
      ctx.wizard.state.formData.dealerId
    );
    console.log(newOrder);

    ctx.wizard.state.formData.productAmount = amount;
    const product = await GetProductById(ctx.wizard.state.formData.productId);
    const operatorNotification = {
      text: `${ctx.i18n.t("Client.operatorNotificationTxt")}\n\nProduct:${
        product?.name
      }\nAmount: ${ctx.wizard.state.formData.productAmount}`,
      buttons: Markup.inlineKeyboard([
        [Markup.button.callback("Confirm", `confirm_purchase_${newOrder?.id}`)],
      ])
        .oneTime()
        .resize(),
    };

    // Send it to Operators
    const operators = await GetOperatorsByDealerId(
      ctx.wizard.state.formData.dealerId
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

    await ctx.reply("Ожидайте подтверждение от дилера");
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});

module.exports = new Scenes.WizardScene(
  "FirstPromotionWizard",
  initScene,
  getDealer,
  getProducts,
  getAmount,
  validatePurchase
);
