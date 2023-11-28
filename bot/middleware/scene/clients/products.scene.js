const { Markup, Scenes, Composer } = require("telegraf");
const { match } = require("telegraf-i18n");
const {
  GetProducts,
  GetProductById,
} = require("../../../common/sequelize/product.sequelize");
const generatePaginatedInlineKeyboards = require("../../../functions/keyboards/clients/generatePagination");

const generateProductsKeyboard = (
  page,
  lang,
  count,
  itemsPerPage,
  items,
  i18n
) => {
  const endPage = Math.ceil(count / itemsPerPage);
  const keyboards = [
    ...items.map((item) => {
      const name =
        lang === "uz" ? item.name_uz : lang === "ru" ? item.name_ru : null;
      return [Markup.button.callback(name, `p_${item.id}`)];
    }),
  ];

  // Add pagination buttons
  const paginationButtons = [];
  if (page > 1) {
    paginationButtons.push(Markup.button.callback("⬅️", `prev`));
  }
  if (page < endPage) {
    paginationButtons.push(Markup.button.callback("➡️", `next`));
  }

  if (paginationButtons.length > 0) {
    keyboards.push(paginationButtons);
  }

  // keyboards.push([
  //   Markup.button.callback(i18n.t("Client.cancelApplicationBtn"), `cancel`),
  // ]);

  // if (!inital) {
  //   keyboards.push([
  //     Markup.button.callback(i18n.t("Client.backOneStepMsg"), `back`),
  //   ]);
  // }

  return Markup.inlineKeyboard(keyboards);
};

const sendProducts = new Composer();
sendProducts.hears(match("productsBtn"), async (ctx) => {
  try {
    ctx.wizard.state.formData = {};
    ctx.wizard.state.formData.product = {};
    ctx.wizard.state.formData.product.productPage = 1;
    ctx.wizard.state.formData.product.itemsPerPage = 2;

    const products = await GetProducts(
      ctx.wizard.state.formData.product.productPage,
      ctx.wizard.state.formData.product.itemsPerPage
    );

    if (products.totalItems === 0) {
      await ctx.reply(ctx.i18n.t("Client.emptyDataMsg"));
      return;
    }

    const keyboard = generateProductsKeyboard(
      ctx.wizard.state.formData.product.productPage,
      ctx.i18n.locale(),
      products.totalItems,
      ctx.wizard.state.formData.product.itemsPerPage,
      products.items
    );
    // await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.reply(ctx.i18n.t("Client.chooseProductTxt"), keyboard);
  } catch (e) {
    console.log(e);
  }
});
sendProducts.action(["prev", "next"], async (ctx) => {
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
    const products = await GetProducts(
      ctx.wizard.state.formData.product.productPage,
      ctx.wizard.state.formData.product.itemsPerPage
    );
    const keyboard = generateProductsKeyboard(
      ctx.wizard.state.formData.product.productPage,
      ctx.i18n.locale(),
      products.totalItems,
      ctx.wizard.state.formData.product.itemsPerPage,
      products.items
    );
    await ctx.editMessageText(ctx.i18n.t("Client.chooseProductTxt"), keyboard);
  } catch (error) {
    console.log(error);
  }
});
sendProducts.on("callback_query", async (ctx) => {
  try {
    if (!ctx.update.callback_query?.data.includes("p_")) {
      return ctx.reply("invalid_callback_query");
    }
    const productId = parseInt(
      ctx.update.callback_query?.data.match(/p_(\d+)/)[1],
      10
    );
    ctx.wizard.state.formData.productId = productId;
    const product = await GetProductById(productId);
    const productName =
      ctx.i18n.locale() === "uz" ? product.name_uz : product.name_ru;
    const productCaption =
      ctx.i18n.locale() === "uz" ? product.caption_uz : product.caption_ru;
    const product_caption = `${productName}\n\n${productCaption}`;

    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.replyWithPhoto(product.image, {
      caption: product_caption,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [Markup.button.callback(ctx.i18n.t("Client.backOneStepMsg"), "back")],
        ],
      },
    });
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});

const sendProduct = new Composer();
sendProduct.action("back", async (ctx) => {
  try {
    const products = await GetProducts(
      ctx.wizard.state.formData.product.productPage,
      ctx.wizard.state.formData.product.itemsPerPage
    );
    const keyboard = generateProductsKeyboard(
      ctx.wizard.state.formData.product.productPage,
      ctx.i18n.locale(),
      products.totalItems,
      ctx.wizard.state.formData.product.itemsPerPage,
      products.items
    );
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.reply(ctx.i18n.t("Client.chooseProductTxt"), keyboard);
    return ctx.wizard.back();
  } catch (error) {
    console.log(error);
  }
});

module.exports = new Scenes.WizardScene(
  "ProductsWizard",
  sendProducts,
  sendProduct
);
