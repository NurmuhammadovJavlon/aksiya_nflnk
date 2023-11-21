const { Markup, Scenes, Composer } = require("telegraf");
const { match } = require("telegraf-i18n");
const {
  GetProducts,
  GetProductById,
  ArchiveProduct,
  DeleteProduct,
  CreateProduct,
  UpdateProduct,
  GetDealersByProduct,
} = require("../../../../common/sequelize/product.sequelize");
const generateItemsKeyboard = require("../../../../functions/keyboards/admins/slider.keyboard");
const generateProductAdminKeys = require("../../../../functions/keyboards/admins/product.keyboard");
const {
  GetDealersWithPagination,
} = require("../../../../common/sequelize/dealer.sequelize");
const uploadPhotoToCloudinary = require("../../../../functions/cloudinary/photo.upload");

const sendProductKeys = async (ctx) => {
  try {
    const products = await GetProducts(
      ctx.wizard.state.product.regionPage,
      ctx.wizard.state.product.itemsPerPage
    );

    if (products.totalItems === 0) {
      await ctx.reply(ctx.i18n.t("Client.emptyDataMsg"));
      return;
    }

    const keyboard = generateItemsKeyboard(
      ctx.wizard.state.product.regionPage,
      ctx.i18n.locale(),
      products.totalItems,
      ctx.wizard.state.product.itemsPerPage,
      products.items,
      ctx.i18n
    );
    await ctx.reply(ctx.i18n.t("AdminDealerForm.chooseDealerTxt"), keyboard);
  } catch (error) {
    console.log(error);
  }
};

const sendDealerKeys = async (ctx) => {
  try {
    const dealers = await GetDealersWithPagination(
      ctx.wizard.state.product.form.dealer.dealerPage,
      ctx.wizard.state.product.form.dealer.itemsPerPage
    );

    if (dealers.totalItems === 0) {
      await ctx.reply(ctx.i18n.t("Client.emptyDataMsg"));
      return;
    }

    const endPage = Math.ceil(
      dealers.totalItems / ctx.wizard.state.product.form.dealer.itemsPerPage
    );
    const keyboards = [
      ...dealers.items?.map((item) => {
        const name =
          ctx.i18n.locale() === "uz"
            ? item.name_uz
            : ctx.i18n.locale() === "ru"
            ? item.name_ru
            : null;
        const finalName = ctx.wizard.state.product.form.dealer.ids.includes(
          item.id
        )
          ? `${name} – ✅`
          : name;
        return [Markup.button.callback(finalName, `i_${item.id}`)];
      }),
    ];

    // Add pagination buttons
    const paginationButtons = [];
    if (ctx.wizard.state.product.form.dealer.dealerPage > 1) {
      paginationButtons.push(Markup.button.callback("⬅️", `prev`));
    }
    if (ctx.wizard.state.product.form.dealer.dealerPage < endPage) {
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
      Markup.button.callback(
        ctx.i18n.t("AdminProductForm.finishSelectionBtn"),
        `finish`
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

const GoBack = async (ctx) => {
  try {
    const MainMenu = await generateProductAdminKeys(ctx);
    await ctx.reply(ctx.i18n.t("Client.successfullyCancelledMsg"), MainMenu);
  } catch (error) {
    console.log(error);
  }
};

const generateDealersText = async (id, lang) => {
  try {
    const dealers = await GetDealersByProduct(id);
    let msg = lang === "uz" ? "Dillerlar:\n" : "Дилеры:\n";

    dealers.forEach((dealer) => {
      const dealerName = lang === "uz" ? dealer.name_uz : dealer.name_ru;
      msg += `${dealerName}\n`;
    });

    return msg;
  } catch (error) {
    console.log(error);
  }
};

const startStep = new Composer();
startStep.hears(match("AdminProductForm.manageProductsBtn"), async (ctx) => {
  try {
    ctx.wizard.state.product = {};
    ctx.wizard.state.product.regionPage = 1;
    ctx.wizard.state.product.itemsPerPage = 6;
    await sendProductKeys(ctx);
  } catch (e) {
    console.log(e);
  }
});
startStep.action(["prev", "next"], async (ctx) => {
  try {
    const match = ctx.update?.callback_query?.data;
    switch (match) {
      case "prev":
        ctx.wizard.state.product.regionPage--;
        break;
      case "next":
        ctx.wizard.state.product.regionPage++;
        break;
    }
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await sendProductKeys(ctx);
  } catch (error) {
    console.log(error);
  }
});
startStep.action("cancel", async (ctx) => {
  try {
    const MainMenu = await generateProductAdminKeys(ctx);
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.reply(ctx.i18n.t("Client.successfullyCancelledMsg"), MainMenu);
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});
startStep.on("callback_query", async (ctx) => {
  try {
    if (!ctx.update.callback_query?.data.includes("i_")) {
      return ctx.reply("invalid_callback_query");
    }
    const productId = parseInt(
      ctx.update.callback_query?.data.match(/i_(\d+)/)[1],
      10
    );
    const product = await GetProductById(productId);
    const productName =
      ctx.i18n.locale() === "uz" ? product.name_uz : product.name_ru;
    const productCaption =
      ctx.i18n.locale() === "uz" ? product.caption_uz : product.caption_ru;
    const productPhoto = product.image;
    const dealerMsg = await generateDealersText(productId);
    const product_caption = ctx.i18n.t("AdminProductForm.productUpdateMsg", {
      productName,
      desc: productCaption,
      dealerMsg,
    });
    const isArchived = product.isArchived;

    ctx.wizard.state.product.id = productId;
    ctx.wizard.state.product.keyboard = [
      [Markup.button.callback(ctx.i18n.t("Admin.deleteBtn"), "delete")],
      [Markup.button.callback(ctx.i18n.t("Admin.editBtn"), "edit")],
      [
        isArchived
          ? Markup.button.callback(
              ctx.i18n.t("Admin.unarchiveBtn"),
              "unarchive"
            )
          : Markup.button.callback(ctx.i18n.t("Admin.archiveBtn"), "archive"),
      ],
      [Markup.button.callback(ctx.i18n.t("Client.backOneStepMsg"), "back")],
    ];

    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.replyWithPhoto(productPhoto, {
      caption: product_caption,
      reply_markup: {
        inline_keyboard: ctx.wizard.state.product.keyboard,
      },
    });
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});

const manageStep = new Composer();
manageStep.action("back", async (ctx) => {
  try {
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await sendProductKeys(ctx);
    return ctx.wizard.back();
  } catch (error) {
    console.log(error);
  }
});
manageStep.action("delete", async (ctx) => {
  try {
    await DeleteProduct(ctx.wizard.state.product.id);
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await sendProductKeys(ctx);
    return ctx.wizard.back();
  } catch (error) {
    console.log(error);
  }
});
manageStep.action(["archive", "unarchive"], async (ctx) => {
  try {
    const callbackData = ctx.update.callback_query.data;
    let productIsArchived = false;
    switch (callbackData) {
      case "archive":
        productIsArchived = true;
        break;
      case "unarchive":
        productIsArchived = false;
        break;
    }
    const message = productIsArchived
      ? ctx.i18n.t("AdminProductForm.productIsArchivedMsg")
      : ctx.i18n.t("AdminProductForm.productIsUnArchivedMsg");
    await ArchiveProduct(ctx.wizard.state.product.id, productIsArchived);
    await ctx.answerCbQuery(message);

    // Change Message
    const product = await GetProductById(ctx.wizard.state.product.id);
    const productName =
      ctx.i18n.locale() === "uz" ? product.name_uz : product.name_ru;
    const productCaption =
      ctx.i18n.locale() === "uz" ? product.caption_uz : product.caption_ru;
    const product_caption = ctx.i18n.t("AdminProductForm.productUpdateMsg", {
      productName,
      desc: productCaption,
    });
    const isArchived = product.isArchived;
    ctx.wizard.state.product.keyboard = [
      [Markup.button.callback(ctx.i18n.t("Admin.deleteBtn"), "delete")],
      [Markup.button.callback(ctx.i18n.t("Admin.editBtn"), "edit")],
      [
        isArchived
          ? Markup.button.callback(
              ctx.i18n.t("Admin.unarchiveBtn"),
              "unarchive"
            )
          : Markup.button.callback(ctx.i18n.t("Admin.archiveBtn"), "archive"),
      ],
      [Markup.button.callback(ctx.i18n.t("Client.backOneStepMsg"), "back")],
    ];

    // await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.editMessageCaption(product_caption, {
      reply_markup: {
        inline_keyboard: ctx.wizard.state.product.keyboard,
      },
    });
    return;
  } catch (error) {
    console.log(error);
  }
});
manageStep.action("edit", async (ctx) => {
  try {
    ctx.wizard.state.product.form = {};
    ctx.wizard.state.product.form.keyboard = Markup.keyboard([
      // [Markup.button.text(ctx.i18n.t("Client.backOneStepMsg"))],
      [Markup.button.text(ctx.i18n.t("Client.cancelApplicationBtn"))],
    ]);
    // await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.reply(
      ctx.i18n.t("AdminProductForm.enterUzProductNameMsg"),
      ctx.wizard.state.product.form.keyboard
    );
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});

const getUzProductName = new Composer();
getUzProductName.hears(match("Client.cancelApplicationBtn"), async (ctx) => {
  try {
    await GoBack(ctx);
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});
getUzProductName.on("message", async (ctx) => {
  try {
    ctx.wizard.state.product.form.name_uz = ctx.message.text;
    await ctx.reply(ctx.i18n.t("AdminProductForm.enterRuProductNameMsg"));
    return ctx.wizard.next();
  } catch (e) {
    console.log(e);
  }
});

const getRuProductName = new Composer();
getRuProductName.hears(match("Client.cancelApplicationBtn"), async (ctx) => {
  try {
    await GoBack(ctx);
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});
getRuProductName.on("message", async (ctx) => {
  try {
    ctx.wizard.state.product.form.name_ru = ctx.update.message.text;
    await ctx.reply(ctx.i18n.t("AdminProductForm.enterUzProductCaptionMsg"));
    return ctx.wizard.next();
  } catch (e) {
    console.log(e);
  }
});

const getUzCaption = new Composer();
getUzCaption.hears(match("Client.cancelApplicationBtn"), async (ctx) => {
  try {
    await GoBack(ctx);
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});
getUzCaption.on("message", async (ctx) => {
  try {
    ctx.wizard.state.product.form.caption_uz = ctx.update.message.text;
    await ctx.reply(ctx.i18n.t("AdminProductForm.enterRuProductCaptionMsg"));
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});

const getRuCaption = new Composer();
getRuCaption.hears(match("Client.cancelApplicationBtn"), async (ctx) => {
  try {
    await GoBack(ctx);
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});
getRuCaption.on("message", async (ctx) => {
  try {
    ctx.wizard.state.product.form.caption_ru = ctx.update.message.text;
    ctx.wizard.state.product.form.dealer = {};
    ctx.wizard.state.product.form.dealer.dealerPage = 1;
    ctx.wizard.state.product.form.dealer.itemsPerPage = 2;
    ctx.wizard.state.product.form.dealer.ids = [];

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
connectDealerStep.hears(match("Client.cancelApplicationBtn"), async (ctx) => {
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
        ctx.wizard.state.product.form.dealer.dealerPage--;
        break;
      case "next":
        ctx.wizard.state.product.form.dealer.dealerPage++;
        break;
    }
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await sendDealerKeys(ctx);
    return;
  } catch (error) {
    console.log(error);
  }
});
connectDealerStep.action(/i_(\d+)/, async (ctx) => {
  try {
    if (!ctx.update.callback_query?.data.includes("i_")) {
      return ctx.reply("invalid_callback_query");
    }
    const dealerId = parseInt(
      ctx.update.callback_query?.data.match(/i_(\d+)/)[1],
      10
    );
    if (!ctx.wizard.state.product.form.dealer.ids.includes(dealerId)) {
      ctx.wizard.state.product.form.dealer.ids = [
        ...ctx.wizard.state.product.form.dealer.ids,
        dealerId,
      ];
    } else if (ctx.wizard.state.product.form.dealer.ids.includes(dealerId)) {
      ctx.wizard.state.product.form.dealer.ids = [
        ...ctx.wizard.state.product.form.dealer.ids.filter(
          (id) => id !== dealerId
        ),
      ];
    }
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await sendDealerKeys(ctx);
    return;
    // return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});
connectDealerStep.action("finish", async (ctx) => {
  try {
    const keyboard = Markup.keyboard([
      [
        Markup.button.text(ctx.i18n.t("Client.cancelApplicationBtn")),
        Markup.button.text(ctx.i18n.t("skipBtn")),
      ],
    ]);
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.reply(
      ctx.i18n.t("AdminProductForm.sendProductPhotoMsg"),
      keyboard
    );
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});

const getProductPhotoStep = new Composer();
getProductPhotoStep.hears(match("Client.cancelApplicationBtn"), async (ctx) => {
  try {
    await GoBack(ctx);
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});
getProductPhotoStep.hears(match("skipBtn"), async (ctx) => {
  try {
    const product = await GetProductById(ctx.wizard.state.product.id);
    ctx.wizard.state.product.form.photo = product?.image;
    ctx.wizard.state.product.form.photoPublic_id = product?.image_publicId;
    const confirmationMsg = {
      text: ctx.i18n.t("AdminProductForm.confirmationMessage", {
        name_uz: ctx.wizard.state.product.form.name_ru,
        name_ru: ctx.wizard.state.product.form.name_ru,
      }),
      buttons: Markup.inlineKeyboard([
        [
          Markup.button.callback(ctx.i18n.t("Admin.yesBtn"), "yes"),
          Markup.button.callback(ctx.i18n.t("Admin.noBtn"), "no"),
        ],
      ]),
    };
    // await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.reply(confirmationMsg.text, confirmationMsg.buttons);
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});
getProductPhotoStep.on("photo", async (ctx) => {
  try {
    const fileId = ctx.message.photo[ctx.message.photo.length - 1]?.file_id;
    const { href } = await ctx.telegram.getFileLink(fileId);
    const res = await uploadPhotoToCloudinary(href);
    ctx.wizard.state.product.form.photo = res?.secure_url;
    ctx.wizard.state.product.form.photoPublic_id = res?.public_id;
    const confirmationMsg = {
      text: ctx.i18n.t("AdminProductForm.confirmationMessage", {
        name_uz: ctx.wizard.state.product.form.name_ru,
        name_ru: ctx.wizard.state.product.form.name_ru,
      }),
      buttons: Markup.inlineKeyboard([
        [
          Markup.button.callback(ctx.i18n.t("Admin.yesBtn"), "yes"),
          Markup.button.callback(ctx.i18n.t("Admin.noBtn"), "no"),
        ],
      ]),
    };
    // await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.reply(confirmationMsg.text, confirmationMsg.buttons);
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});

const confirmDetailStep = new Composer();
confirmDetailStep.hears(match("Client.cancelApplicationBtn"), async (ctx) => {
  try {
    await GoBack(ctx);
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});
confirmDetailStep.action(["yes", "no"], async (ctx) => {
  try {
    const callBackData = ctx.update.callback_query.data;
    const MainMenu = await generateProductAdminKeys(ctx);
    if (callBackData === "yes") {
      const product = await UpdateProduct(
        ctx.wizard.state.product.id,
        ctx.wizard.state.product.form.name_ru,
        ctx.wizard.state.product.form.name_ru,
        ctx.wizard.state.product.form.photo,
        ctx.wizard.state.product.form.photoPublic_id,
        ctx.wizard.state.product.form.caption_uz,
        ctx.wizard.state.product.form.caption_ru,
        ctx.wizard.state.product.form.dealer.ids
      );
      await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
      if (product) {
        await ctx.reply(ctx.i18n.t("dataSavedMsg"), MainMenu);
      } else {
        await ctx.reply(ctx.i18n.t("errorText"), MainMenu);
      }
    } else if (callBackData === "no") {
      await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
      await ctx.reply(ctx.i18n.t("Client.successfullyCancelledMsg"), MainMenu);
    }
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});

module.exports = new Scenes.WizardScene(
  "ManageProductsWizard",
  startStep,
  manageStep,
  getUzProductName,
  getRuProductName,
  getUzCaption,
  getRuCaption,
  connectDealerStep,
  getProductPhotoStep,
  confirmDetailStep
);
