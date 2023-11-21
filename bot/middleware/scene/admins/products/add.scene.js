const { Markup, Scenes, Composer } = require("telegraf");
const { match } = require("telegraf-i18n");
const {
  CreateDealer,
  GetDealersWithPagination,
} = require("../../../../common/sequelize/dealer.sequelize");
const {
  getRegionsWithPagination,
} = require("../../../../common/sequelize/region.sequelize");
const generateItemsKeyboard = require("../../../../functions/keyboards/admins/slider.keyboard");
const generateProductAdminKeys = require("../../../../functions/keyboards/admins/product.keyboard");
const uploadPhotoToCloudinary = require("../../../../functions/cloudinary/photo.upload");
const {
  CreateProduct,
} = require("../../../../common/sequelize/product.sequelize");

const sendDealerKeys = async (ctx) => {
  try {
    const dealers = await GetDealersWithPagination(
      ctx.wizard.state.productForm.dealerPage,
      ctx.wizard.state.productForm.itemsPerPage
    );

    if (dealers.totalItems === 0) {
      await ctx.reply(ctx.i18n.t("Client.emptyDataMsg"));
      return;
    }

    const endPage = Math.ceil(
      dealers.totalItems / ctx.wizard.state.productForm.itemsPerPage
    );
    const keyboards = [
      ...dealers.items?.map((item) => {
        const name =
          ctx.i18n.locale() === "uz"
            ? item.name_uz
            : ctx.i18n.locale() === "ru"
            ? item.name_ru
            : null;
        const finalName = ctx.wizard.state.productForm.dealer.ids.includes(
          item.id
        )
          ? `${name} – ✅`
          : name;
        return [Markup.button.callback(finalName, `i_${item.id}`)];
      }),
    ];

    // Add pagination buttons
    const paginationButtons = [];
    if (ctx.wizard.state.productForm.dealerPage > 1) {
      paginationButtons.push(Markup.button.callback("⬅️", `prev`));
    }
    if (ctx.wizard.state.productForm.dealerPage < endPage) {
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

const startStep = new Composer();
startStep.hears(match("AdminProductForm.addProductBtn"), async (ctx) => {
  try {
    ctx.wizard.state.productForm = {};
    ctx.wizard.state.productForm.keyboard = Markup.keyboard([
      // [Markup.button.text(ctx.i18n.t("Client.backOneStepMsg"))],
      [Markup.button.text(ctx.i18n.t("Client.cancelApplicationBtn"))],
    ]).resize();
    await ctx.reply(
      ctx.i18n.t("AdminProductForm.enterUzProductNameMsg"),
      ctx.wizard.state.productForm.keyboard
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
    ctx.wizard.state.productForm.name_uz = ctx.message.text;
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
    ctx.wizard.state.productForm.name_ru = ctx.update.message.text;
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
    ctx.wizard.state.productForm.caption_uz = ctx.update.message.text;
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
    ctx.wizard.state.productForm.caption_ru = ctx.update.message.text;
    ctx.wizard.state.productForm.dealer = {};
    ctx.wizard.state.productForm.dealerPage = 1;
    ctx.wizard.state.productForm.itemsPerPage = 2;
    ctx.wizard.state.productForm.dealer.ids = [];
    await sendDealerKeys(ctx);
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});

const connectDealerStep = new Composer();
connectDealerStep.action("cancel", async (ctx) => {
  try {
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
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
        ctx.wizard.state.productForm.dealerPage--;
        break;
      case "next":
        ctx.wizard.state.productForm.dealerPage++;
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

    if (!ctx.wizard.state.productForm.dealer.ids.includes(dealerId)) {
      ctx.wizard.state.productForm.dealer.ids = [
        ...ctx.wizard.state.productForm.dealer.ids,
        dealerId,
      ];
    } else if (ctx.wizard.state.productForm.dealer.ids.includes(dealerId)) {
      ctx.wizard.state.productForm.dealer.ids = [
        ...ctx.wizard.state.productForm.dealer.ids.filter(
          (id) => id !== dealerId
        ),
      ];
    }
    // ctx.wizard.state.productForm.dealerId = dealerId;
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await sendDealerKeys(ctx);
    return;
  } catch (error) {
    console.log(error);
  }
});

connectDealerStep.action("finish", async (ctx) => {
  try {
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.reply(ctx.i18n.t("AdminProductForm.sendProductPhotoMsg"));
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
getProductPhotoStep.on("photo", async (ctx) => {
  try {
    const fileId = ctx.message.photo[ctx.message.photo.length - 1]?.file_id;
    const { href } = await ctx.telegram.getFileLink(fileId);
    const res = await uploadPhotoToCloudinary(href);
    ctx.wizard.state.productForm.photo = res?.secure_url;
    ctx.wizard.state.productForm.photoPublic_id = res?.public_id;
    const confirmationMsg = {
      text: ctx.i18n.t("AdminProductForm.confirmationMessage", {
        name_uz: ctx.wizard.state.productForm.name_ru,
        name_ru: ctx.wizard.state.productForm.name_ru,
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
      const product = await CreateProduct(
        ctx.wizard.state.productForm.name_ru,
        ctx.wizard.state.productForm.name_ru,
        ctx.wizard.state.productForm.photo,
        ctx.wizard.state.productForm.photoPublic_id,
        ctx.wizard.state.productForm.dealer.ids,
        ctx.wizard.state.productForm.caption_uz,
        ctx.wizard.state.productForm.caption_ru
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
  "AddProductWizard",
  startStep,
  getUzProductName,
  getRuProductName,
  getUzCaption,
  getRuCaption,
  connectDealerStep,
  getProductPhotoStep,
  confirmDetailStep
);
