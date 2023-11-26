const { Markup, Scenes, Composer } = require("telegraf");
const { match } = require("telegraf-i18n");
const generateItemsKeyboard = require("../../../../functions/keyboards/admins/slider.keyboard");
const {
  getRegionsWithPagination,
  GetRegionByID,
  DeleteRegion,
  ArchiveRegion,
  CreateRegion,
  UpdateRegionNames,
} = require("../../../../common/sequelize/region.sequelize");
const {
  GetDealerById,
  GetDealersWithPagination,
  ArchiveDealer,
  DeleteDealer,
  UpdateDealer,
} = require("../../../../common/sequelize/dealer.sequelize");
const generateDealerAdminKeys = require("../../../../functions/keyboards/admins/dealer.keyboard");

const startStep = new Composer();
startStep.hears(match("AdminDealerForm.manageDealersBtn"), async (ctx) => {
  try {
    ctx.wizard.state.dealerData = {};
    ctx.wizard.state.dealerData.dealer = {};
    ctx.wizard.state.dealerData.dealer.regionPage = 1;
    ctx.wizard.state.dealerData.dealer.itemsPerPage = 30;

    const dealers = await GetDealersWithPagination(
      ctx.wizard.state.dealerData.dealer.regionPage,
      ctx.wizard.state.dealerData.dealer.itemsPerPage
    );

    if (dealers.totalItems === 0) {
      // await ctx.deleteMessage(ctx.update.message.message_id);
      const MainMenu = await generateDealerAdminKeys(ctx);
      await ctx.reply(ctx.i18n.t("Client.emptyDataMsg"), MainMenu);
      return ctx.scene.leave();
    }

    const keyboard = generateItemsKeyboard(
      ctx.wizard.state.dealerData.dealer.regionPage,
      ctx.i18n.locale(),
      dealers.totalItems,
      ctx.wizard.state.dealerData.dealer.itemsPerPage,
      dealers.items,
      ctx.i18n
    );

    await ctx.reply(ctx.i18n.t("AdminDealerForm.chooseDealerTxt"), keyboard);
  } catch (error) {
    console.log(error);
  }
});
startStep.action(["prev", "next"], async (ctx) => {
  try {
    const match = ctx.update?.callback_query?.data;
    switch (match) {
      case "prev":
        ctx.wizard.state.dealerData.dealer.regionPage--;
        break;
      case "next":
        ctx.wizard.state.dealerData.dealer.regionPage++;
        break;
    }
    const regions = await GetDealersWithPagination(
      ctx.wizard.state.dealerData.dealer.regionPage,
      ctx.wizard.state.dealerData.dealer.itemsPerPage
    );
    const keyboard = generateItemsKeyboard(
      ctx.wizard.state.dealerData.dealer.regionPage,
      ctx.i18n.locale(),
      regions.totalItems,
      ctx.wizard.state.dealerData.dealer.itemsPerPage,
      regions.items,
      ctx.i18n
    );
    await ctx.editMessageText(
      ctx.i18n.t("AdminDealerForm.chooseDealerTxt"),
      keyboard
    );
  } catch (error) {
    console.log(error);
  }
});
startStep.action("cancel", async (ctx) => {
  try {
    const MainMenu = await generateDealerAdminKeys(ctx);
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.reply(ctx.i18n.t("Client.successfullyCancelledMsg"), MainMenu);
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});
startStep.action(/i_(\d+)/, async (ctx) => {
  try {
    if (!ctx.update.callback_query?.data.includes("i_")) {
      return ctx.reply("invalid_callback_query");
    }
    const dealerId = parseInt(
      ctx.update.callback_query?.data.match(/i_(\d+)/)[1],
      10
    );
    const dealer = await GetDealerById(dealerId);
    const dealerName =
      ctx.i18n.locale() === "uz" ? dealer.name_uz : dealer.name_ru;
    const dealer_caption = ctx.i18n.t("AdminDealerForm.dealerUpdateCaption", {
      dealerName,
    });

    ctx.wizard.state.dealerData.dealer.data = dealer;
    ctx.wizard.state.dealerData.dealer.id = dealerId;
    ctx.wizard.state.dealerData.dealer.keyboard = Markup.inlineKeyboard([
      [Markup.button.callback(ctx.i18n.t("Admin.deleteBtn"), "delete")],
      [Markup.button.callback(ctx.i18n.t("Admin.editBtn"), "edit")],
      [Markup.button.callback(ctx.i18n.t("Client.backOneStepMsg"), "back")],
    ]);

    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.replyWithHTML(
      dealer_caption,
      ctx.wizard.state.dealerData.dealer.keyboard
    );
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});

const manageStep = new Composer();
manageStep.action("back", async (ctx) => {
  try {
    const dealers = await GetDealersWithPagination(
      ctx.wizard.state.dealerData.dealer.regionPage,
      ctx.wizard.state.dealerData.dealer.itemsPerPage
    );

    if (dealers.totalItems === 0) {
      await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
      await ctx.reply(ctx.i18n.t("Client.emptyDataMsg"));
      return ctx.scene.leave();
    }

    const keyboard = generateItemsKeyboard(
      ctx.wizard.state.dealerData.dealer.regionPage,
      ctx.i18n.locale(),
      dealers.totalItems,
      ctx.wizard.state.dealerData.dealer.itemsPerPage,
      dealers.items,
      ctx.i18n
    );

    await ctx.editMessageText(
      ctx.i18n.t("AdminDealerForm.chooseDealerTxt"),
      keyboard
    );
    return ctx.wizard.back();
  } catch (error) {
    console.log(error);
  }
});
manageStep.action("delete", async (ctx) => {
  try {
    await DeleteDealer(ctx.wizard.state.dealerData.dealer.id);
    const dealers = await GetDealersWithPagination(
      ctx.wizard.state.dealerData.dealer.regionPage,
      ctx.wizard.state.dealerData.dealer.itemsPerPage
    );

    if (dealers.totalItems === 0) {
      const MainMenu = await generateDealerAdminKeys(ctx);
      await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
      await ctx.reply(ctx.i18n.t("Client.emptyDataMsg"), MainMenu);
      return;
    }

    const keyboard = generateItemsKeyboard(
      ctx.wizard.state.dealerData.dealer.regionPage,
      ctx.i18n.locale(),
      dealers.totalItems,
      ctx.wizard.state.dealerData.dealer.itemsPerPage,
      dealers.items,
      ctx.i18n
    );

    await ctx.editMessageText(
      ctx.i18n.t("AdminDealerForm.chooseDealerTxt"),
      keyboard
    );
    return ctx.wizard.back();
  } catch (error) {
    console.log(error);
  }
});
manageStep.action(["archive", "unarchive"], async (ctx) => {
  try {
    const callbackData = ctx.update.callback_query.data;
    let dealerIsArchived = false;
    switch (callbackData) {
      case "archive":
        dealerIsArchived = true;
        break;
      case "unarchive":
        dealerIsArchived = false;
        break;
    }
    const message = dealerIsArchived
      ? ctx.i18n.t("AdminRegionForm.regionIsArchivedMsg")
      : ctx.i18n.t("AdminRegionForm.regionIsUnArchivedMsg");
    await ArchiveDealer(
      ctx.wizard.state.dealerData.dealer.id,
      dealerIsArchived
    );
    await ctx.answerCbQuery(message);

    // Change Message
    const dealer = await GetDealerById(ctx.wizard.state.dealerData.dealer.id);
    const dealerName =
      ctx.i18n.locale() === "uz" ? dealer.name_uz : dealer.name_ru;
    const dealer_caption = ctx.i18n.t("AdminDealerForm.dealerUpdateCaption", {
      dealerName,
    });
    const isArchived = dealer.isArchived;
    ctx.wizard.state.dealerData.dealer.keyboard = Markup.inlineKeyboard([
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
    ]);

    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.replyWithHTML(
      dealer_caption,
      ctx.wizard.state.dealerData.dealer.keyboard
    );
    return;
  } catch (error) {
    console.log(error);
  }
});
manageStep.action("edit", async (ctx) => {
  try {
    ctx.wizard.state.dealerData.dealer.form = {};
    ctx.wizard.state.dealerData.dealer.form.keyboard = Markup.keyboard([
      [
        Markup.button.callback(ctx.i18n.t("skipBtn")),
        Markup.button.text(ctx.i18n.t("Client.cancelApplicationBtn")),
      ],
    ]).resize();
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.reply(
      ctx.i18n.t("AdminDealerForm.enterDealerUzName"),
      ctx.wizard.state.dealerData.dealer.form.keyboard
    );
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});

const getUzbekNameStep = new Composer();
getUzbekNameStep.hears(match("skipBtn"), async (ctx) => {
  try {
    ctx.wizard.state.dealerData.dealer.form.name_uz =
      ctx.wizard.state.dealerData.dealer.data.name_uz;
    await ctx.reply(ctx.i18n.t("AdminDealerForm.enterDealerRuName"));

    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});
getUzbekNameStep.hears(match("Client.cancelApplicationBtn"), async (ctx) => {
  try {
    await ctx.reply(
      ctx.i18n.t("AdminRegionForm.editingCanceledMsg"),
      Markup.removeKeyboard()
    );
    const dealer = await GetDealerById(ctx.wizard.state.dealerData.dealer.id);
    const dealerName =
      ctx.i18n.locale() === "uz" ? dealer.name_uz : dealer.name_ru;
    const dealer_caption = ctx.i18n.t("AdminDealerForm.dealerUpdateCaption", {
      dealerName,
    });

    ctx.wizard.state.dealerData.dealer.keyboard = Markup.inlineKeyboard([
      [Markup.button.callback(ctx.i18n.t("Admin.deleteBtn"), "delete")],
      [Markup.button.callback(ctx.i18n.t("Admin.editBtn"), "edit")],
      [Markup.button.callback(ctx.i18n.t("Client.backOneStepMsg"), "back")],
    ]);

    await ctx.deleteMessage(ctx.update.message.message_id);
    await ctx.replyWithHTML(
      dealer_caption,
      ctx.wizard.state.dealerData.dealer.keyboard
    );
    return ctx.wizard.selectStep(1);
  } catch (error) {
    console.log(error);
  }
});
getUzbekNameStep.on("message", async (ctx) => {
  try {
    ctx.wizard.state.dealerData.dealer.form.name_uz = ctx.message.text;
    await ctx.reply(ctx.i18n.t("AdminDealerForm.enterDealerRuName"));
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});

const getRussianNameStep = new Composer();
getRussianNameStep.hears(match("skipBtn"), async (ctx) => {
  try {
    ctx.wizard.state.dealerData.dealer.form.name_ru =
      ctx.wizard.state.dealerData.dealer.data.name_ru;

    const confirmationMsg = {
      text: ctx.i18n.t("AdminDealerForm.confirmationMessage", {
        name_uz: ctx.wizard.state.dealerData.dealer.form.name_uz,
        name_ru: ctx.wizard.state.dealerData.dealer.form.name_ru,
      }),
      buttons: Markup.inlineKeyboard([
        [
          Markup.button.callback(ctx.i18n.t("Admin.yesBtn"), "yes"),
          Markup.button.callback(ctx.i18n.t("Admin.noBtn"), "no"),
        ],
      ]),
    };

    await ctx.reply(confirmationMsg.text, confirmationMsg.buttons);
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});
getRussianNameStep.hears(match("Client.cancelApplicationBtn"), async (ctx) => {
  try {
    await ctx.reply(
      ctx.i18n.t("AdminRegionForm.editingCanceledMsg"),
      Markup.removeKeyboard()
    );
    const dealer = await GetDealerById(ctx.wizard.state.dealerData.dealer.id);
    const dealerName =
      ctx.i18n.locale() === "uz" ? dealer.name_uz : dealer.name_ru;
    const dealer_caption = ctx.i18n.t("AdminDealerForm.dealerUpdateCaption", {
      dealerName,
    });
    const isArchived = dealer.isArchived;
    ctx.wizard.state.dealerData.dealer.keyboard = Markup.inlineKeyboard([
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
    ]);

    await ctx.deleteMessage(ctx.update.message.message_id);
    await ctx.replyWithHTML(
      dealer_caption,
      ctx.wizard.state.dealerData.dealer.keyboard
    );
    return ctx.wizard.selectStep(1);
  } catch (error) {
    console.log(error);
  }
});
getRussianNameStep.on("message", async (ctx) => {
  try {
    ctx.wizard.state.dealerData.dealer.form.name_ru = ctx.message.text;
    ctx.wizard.state.dealerData.dealer.form.region = {};
    const confirmationMsg = {
      text: ctx.i18n.t("AdminDealerForm.confirmationMessage", {
        name_uz: ctx.wizard.state.dealerData.dealer.form.name_uz,
        name_ru: ctx.wizard.state.dealerData.dealer.form.name_ru,
      }),
      buttons: Markup.inlineKeyboard([
        [
          Markup.button.callback(ctx.i18n.t("Admin.yesBtn"), "yes"),
          Markup.button.callback(ctx.i18n.t("Admin.noBtn"), "no"),
        ],
      ]),
    };
    await ctx.reply(confirmationMsg.text, confirmationMsg.buttons);
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});

const editConfirmationStep = new Composer();
editConfirmationStep.hears(
  match("Client.cancelApplicationBtn"),
  async (ctx) => {
    try {
      await ctx.reply(
        ctx.i18n.t("AdminRegionForm.editingCanceledMsg"),
        Markup.removeKeyboard()
      );
      const dealer = await GetDealerById(ctx.wizard.state.dealerData.dealer.id);
      const dealerName =
        ctx.i18n.locale() === "uz" ? dealer.name_uz : dealer.name_ru;
      const dealer_caption = ctx.i18n.t("AdminDealerForm.dealerUpdateCaption", {
        dealerName,
      });
      const isArchived = dealer.isArchived;
      ctx.wizard.state.dealerData.dealer.keyboard = Markup.inlineKeyboard([
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
      ]);

      await ctx.deleteMessage(ctx.update.message.message_id);
      await ctx.replyWithHTML(
        dealer_caption,
        ctx.wizard.state.dealerData.dealer.keyboard
      );
      return ctx.wizard.selectStep(1);
    } catch (error) {
      console.log(error);
    }
  }
);
editConfirmationStep.action(["yes", "no"], async (ctx) => {
  try {
    const callbackData = ctx.update.callback_query.data;
    const MainMenu = await generateDealerAdminKeys(ctx);
    if (callbackData === "yes") {
      await UpdateDealer(
        ctx.wizard.state.dealerData.dealer.id,
        ctx.wizard.state.dealerData.dealer.form.name_uz,
        ctx.wizard.state.dealerData.dealer.form.name_ru
      );
      await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
      ctx.reply(ctx.i18n.t("AdminDealerForm.regionSavedText"), MainMenu);
    } else if (callbackData === "no") {
      await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
      ctx.reply(ctx.i18n.t("AdminRegionForm.editingCanceledMsg"), MainMenu);
    }
    return ctx.wizard.selectStep(1);
  } catch (error) {
    console.log(error);
  }
});

module.exports = new Scenes.WizardScene(
  "ManageDealersWizard",
  startStep,
  manageStep,
  getUzbekNameStep,
  getRussianNameStep,
  editConfirmationStep
);
