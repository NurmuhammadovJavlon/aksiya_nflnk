const { Markup, Scenes, Composer } = require("telegraf");
const {
  GetAllRegions,
  GetRegionByID,
} = require("../../../common/sequelize/region.sequelize");
const generatePaginatedInlineKeyboards = require("../../../functions/keyboards/clients/generatePagination");
const {
  GetDealersByRegionId,
  GetDealersWithPagination,
  GetDealerById,
} = require("../../../common/sequelize/dealer.sequelize");
const {
  GetProductsByDealerId,
  GetProductById,
  GetProducts,
} = require("../../../common/sequelize/product.sequelize");
const {
  CreateOrderBeforeValid,
} = require("../../../common/sequelize/order.sequelize");
const {
  GetOperatorsByDealerId,
} = require("../../../common/sequelize/operator.sequelize");
const generateMainMenuKeys = require("../../../functions/keyboards/main-menu.keyboard");
const generatePromotionButtons = require("../../../functions/keyboards/promotion.keyboards");
const {
  GetUserScore,
  GetAllAdminUsers,
  getUser,
} = require("../../../common/sequelize/user.sequelize");

const GoBack = async (ctx) => {
  try {
    const keyboard = generatePromotionButtons(ctx);
    await ctx.reply(ctx.i18n.t("Client.applicationCanceledMsg"), keyboard);
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
};

const getOrderDetails = async (ctx) => {
  const region = await GetRegionByID(ctx.wizard.state.formData.region.regionId);
  const dealer = await GetDealerById(ctx.wizard.state.formData.dealer.dealerId);
  const product = await GetProductById(ctx.wizard.state.formData.productId);
  if (ctx.i18n.locale() === "uz") {
    return {
      regionName: region.name_uz,
      dealerName: dealer.name_uz,
      productName: product.name_uz,
    };
  } else if (ctx.i18n.locale() === "ru") {
    return {
      regionName: region.name_ru,
      dealerName: dealer.name_ru,
      productName: product.name_ru,
    };
  }
};

const checkUserScore = async (userId) => {
  try {
    const userScore = await GetUserScore(userId);
    if (userScore <= 0.9) return false;
    else return true;
  } catch (error) {
    console.log(error);
  }
};

const getRegion = new Composer();
getRegion.action("cancel", async (ctx) => {
  await GoBack(ctx);
});
getRegion.on("message", async (ctx) => {
  try {
    // Define inital state in session
    ctx.wizard.state.formData = {};
    ctx.wizard.state.clientChatID = String(ctx.chat.id);
    ctx.wizard.state.formData.region = {};
    ctx.wizard.state.formData.region.regionPage = 1;
    ctx.wizard.state.formData.region.itemsPerPage = 2;

    const regions = await GetAllRegions();
    const keyboard = Markup.inlineKeyboard([
      ...regions.map((item) => {
        const name =
          ctx.i18n.locale() === "uz"
            ? item.name_uz
            : ctx.i18n.locale() === "ru"
            ? item.name_ru
            : null;
        return [Markup.button.callback(name, `i_${item.id}`)];
      }),
      [
        Markup.button.callback(
          ctx.i18n.t("Client.cancelApplicationBtn"),
          `cancel`
        ),
      ],
    ]);

    await ctx.reply("...", Markup.removeKeyboard());
    await ctx.deleteMessage(ctx.update.message.message_id + 1);
    setTimeout(async () => {
      await ctx.reply(ctx.i18n.t("chooseRegionInfo"), keyboard);
    }, 500);
  } catch (error) {
    console.log(error);
  }
});
getRegion.action(/i_(\d+)/, async (ctx) => {
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
    ctx.wizard.state.formData.dealer.itemsPerPage = 30;

    const dealers = await GetDealersWithPagination(
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
  await GoBack(ctx);
});
getDealer.action("back", async (ctx) => {
  try {
    const regions = await GetAllRegions();
    const keyboard = Markup.inlineKeyboard([
      ...regions.map((item) => {
        const name =
          ctx.i18n.locale() === "uz"
            ? item.name_uz
            : ctx.i18n.locale() === "ru"
            ? item.name_ru
            : null;
        return [Markup.button.callback(name, `i_${item.id}`)];
      }),
      [
        Markup.button.callback(
          ctx.i18n.t("Client.cancelApplicationBtn"),
          `cancel`
        ),
      ],
    ]);

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
getDealer.action(/i_(\d+)/, async (ctx) => {
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
    ctx.wizard.state.formData.product.itemsPerPage = 30;

    const products = await GetProducts(
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
  await GoBack(ctx);
});
getProduct.action("back", async (ctx) => {
  try {
    ctx.wizard.state.formData.dealer.dealerPage = 1;
    const dealers = await GetDealersWithPagination(
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
getProduct.action(/i_(\d+)/, async (ctx) => {
  try {
    if (!ctx.update.callback_query?.data.includes("i_")) {
      return ctx.reply("invalid_callback_query");
    }
    const productId = parseInt(
      ctx.update.callback_query?.data.match(/i_(\d+)/)[1],
      10
    );
    ctx.wizard.state.formData.productId = productId;
    const product = await GetProductById(productId);
    const productName =
      ctx.i18n.locale() === "uz" ? product.name_uz : product.name_ru;
    const productCaption =
      ctx.i18n.locale() === "uz" ? product.caption_uz : product.caption_ru;
    const product_caption = `<b>${productName}</b>\n\n${productCaption}`;

    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.replyWithPhoto(product.image, {
      caption: product_caption,
      parse_mode: "HTML",
    });
    await ctx.replyWithHTML(
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
  await GoBack(ctx);
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
    const limit = 300000;

    if (parseInt(rawAmount) < limit) {
      ctx.reply(ctx.i18n.t("Client.minPurchaseMsg"));
      return;
    }

    ctx.wizard.state.formData.purchase_amount = rawAmount;
    const { regionName, dealerName, productName } = await getOrderDetails(ctx);
    const purchaseAmount = new Intl.NumberFormat(ctx.i18n.locale(), {
      style: "currency",
      currency: "UZS",
    }).format(ctx.wizard.state.formData.purchase_amount);
    const confirmMsg = {
      text: ctx.i18n.t("Client.confirmPurchaseMsg", {
        regionName,
        dealerName,
        productName,
        amount: purchaseAmount,
      }),
      buttons: Markup.inlineKeyboard([
        [
          Markup.button.callback(ctx.i18n.t("Admin.yesBtn"), "yes"),
          Markup.button.callback(ctx.i18n.t("Admin.noBtn"), "no"),
        ],
        [Markup.button.callback(ctx.i18n.t("Client.backOneStepMsg"), `back`)],
      ]),
    };
    await ctx.replyWithHTML(confirmMsg.text, confirmMsg.buttons);
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});

const confirmPurchaseStep = new Composer();
confirmPurchaseStep.action("back", async (ctx) => {
  try {
    await ctx.editMessageText(ctx.i18n.t("Client.enterAmountTxt"), {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [Markup.button.callback(ctx.i18n.t("Client.backOneStepMsg"), `back`)],
          [
            Markup.button.callback(
              ctx.i18n.t("Client.cancelApplicationBtn"),
              `cancel`
            ),
          ],
        ],
      },
    });
    return ctx.wizard.back();
  } catch (error) {
    console.log(error);
  }
});
confirmPurchaseStep.action("yes", async (ctx) => {
  try {
    const scoreIsOk = await checkUserScore(String(ctx.chat.id));

    // if (!scoreIsOk) {
    //   await ctx.reply(ctx.i18n.t("Client.confirmAsClientMsg"));
    //   return ctx.scene.leave();
    // }

    const finalMsg = {
      text: ctx.i18n.t("Client.waitForOperatorsMsg"),
      buttons: await generateMainMenuKeys(ctx),
    };
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.reply(finalMsg.text, finalMsg.buttons);

    const newOrder = await CreateOrderBeforeValid(
      ctx.wizard.state.formData.purchase_amount,
      ctx.wizard.state.clientChatID,
      ctx.wizard.state.formData.dealer.dealerId
    );

    const user = await getUser(String(ctx.chat.id));
    const product = await GetProductById(ctx.wizard.state.formData.productId);
    const productName =
      ctx.i18n.locale() === "uz" ? product?.name_uz : product?.name_ru;
    const dateFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "Asia/Tashkent",
    };
    const date = new Intl.DateTimeFormat(
      ctx.i18n.locale(),
      dateFormatOptions
    ).format(new Date());
    const amount = new Intl.NumberFormat(ctx.i18n.locale(), {
      style: "currency",
      currency: "UZS",
    }).format(ctx.wizard.state.formData.purchase_amount);
    const operatorNotification = {
      text: ctx.i18n.t("Client.operatorNotificationTxt", {
        orderId: newOrder?.id,
        productName,
        amount,
        firstName: user.firstName,
        lastName: user.lastName,
        date,
      }),
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
    console.log(operators);
    if (operators.length === 0) {
      const admins = await GetAllAdminUsers();
      const processedAdmins = new Set();

      for (const admin of admins) {
        if (!processedAdmins.has(admin.chatID)) {
          try {
            await ctx.telegram.sendMessage(
              parseInt(admin.chatID),
              "No operator found to send this order details to confirm"
            );
            await ctx.telegram.sendMessage(
              parseInt(admin.chatID),
              operatorNotification.text,
              operatorNotification.buttons
            );
            processedAdmins.add(admin.chatID);
            // console.log(`Message sent to ${operator.name}`);
          } catch (error) {
            console.error(`Error sending message to admin: ${error.message}`);
          }
        }

        // Introduce a delay (e.g., 3 seconds) before sending to the next admin
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    const processedOperators = new Set();
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

      // Introduce a delay (e.g., 3 seconds) before sending to the next admin
      await new Promise((resolve) => setTimeout(resolve, 5000));
    });
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});
confirmPurchaseStep.action("no", async (ctx) => {
  try {
    const MainMenu = generatePromotionButtons(ctx);
    await ctx.reply(ctx.i18n.t("Client.applicationCanceledMsg"), MainMenu);
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
  getAmount,
  confirmPurchaseStep
);
