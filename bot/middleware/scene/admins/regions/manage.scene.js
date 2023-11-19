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
const generateRegionAdminKeys = require("../../../../functions/keyboards/admins/region.keyboard");

const startStep = new Composer();
startStep.hears(match("AdminRegionForm.manageRegionsBtn"), async (ctx) => {
  try {
    ctx.wizard.state.regionData = {};
    ctx.wizard.state.regionData.region = {};
    ctx.wizard.state.regionData.region.regionPage = 1;
    ctx.wizard.state.regionData.region.itemsPerPage = 2;

    const regions = await getRegionsWithPagination(
      ctx.wizard.state.regionData.region.regionPage,
      ctx.wizard.state.regionData.region.itemsPerPage
    );

    if (regions.totalItems === 0) {
      await ctx.reply(ctx.i18n.t("Client.emptyDataMsg"));
      return;
    }

    const keyboard = generateItemsKeyboard(
      ctx.wizard.state.regionData.region.regionPage,
      ctx.i18n.locale(),
      regions.totalItems,
      ctx.wizard.state.regionData.region.itemsPerPage,
      regions.items,
      ctx.i18n
    );
    // await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.reply(ctx.i18n.t("AdminRegionForm.chooseRegionTxt"), keyboard);
  } catch (error) {
    console.log(error);
  }
});
startStep.action(["prev", "next"], async (ctx) => {
  try {
    const match = ctx.update?.callback_query?.data;
    switch (match) {
      case "prev":
        ctx.wizard.state.regionData.region.regionPage--;
        break;
      case "next":
        ctx.wizard.state.regionData.region.regionPage++;
        break;
    }
    const regions = await getRegionsWithPagination(
      ctx.wizard.state.regionData.region.regionPage,
      ctx.wizard.state.regionData.region.itemsPerPage
    );
    const keyboard = generateItemsKeyboard(
      ctx.wizard.state.regionData.region.regionPage,
      ctx.i18n.locale(),
      regions.totalItems,
      ctx.wizard.state.regionData.region.itemsPerPage,
      regions.items,
      ctx.i18n
    );
    await ctx.editMessageText(
      ctx.i18n.t("AdminRegionForm.chooseRegionTxt"),
      keyboard
    );
  } catch (error) {
    console.log(error);
  }
});
startStep.action("cancel", async (ctx) => {
  try {
    const regionPanel = {
      text: ctx.i18n.t("AdminRegionForm.panelTxt"),
      buttons: await generateRegionAdminKeys(ctx),
    };
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.reply(ctx.i18n.t("Client.successfullyCancelledMsg"));
    await ctx.reply(regionPanel.text, regionPanel.buttons);
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
    const regionId = parseInt(
      ctx.update.callback_query?.data.match(/i_(\d+)/)[1],
      10
    );
    const region = await GetRegionByID(regionId);
    const regionName =
      ctx.i18n.locale() === "uz" ? region.name_uz : region.name_ru;
    const regionDate = region.createdAt?.toLocaleString(ctx.i18n.locale(), {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      timeZoneName: "short",
    });
    const region_caption = ctx.i18n.t("AdminRegionForm.regionUpdateCaption", {
      regionName,
      regionDate,
    });
    const isArchived = region.isArchived;

    ctx.wizard.state.regionData.regionId = regionId;
    ctx.wizard.state.regionData.keyboard = Markup.inlineKeyboard([
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
      region_caption,
      ctx.wizard.state.regionData.keyboard
    );
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});

const manageStep = new Composer();
manageStep.action("back", async (ctx) => {
  try {
    const regions = await getRegionsWithPagination(
      ctx.wizard.state.regionData.region.regionPage,
      ctx.wizard.state.regionData.region.itemsPerPage
    );

    if (regions.totalItems === 0) {
      await ctx.answerCbQuery(ctx.i18n.t("Client.emptyDataMsg"));
      return;
    }

    const keyboard = generateItemsKeyboard(
      ctx.wizard.state.regionData.region.regionPage,
      ctx.i18n.locale(),
      regions.totalItems,
      ctx.wizard.state.regionData.region.itemsPerPage,
      regions.items,
      ctx.i18n
    );
    // await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.editMessageText(
      ctx.i18n.t("AdminRegionForm.chooseRegionTxt"),
      keyboard
    );
    return ctx.wizard.back();
  } catch (error) {
    console.log(error);
  }
});
manageStep.action("delete", async (ctx) => {
  try {
    await DeleteRegion(ctx.wizard.state.regionData.regionId);
    const regions = await getRegionsWithPagination(
      ctx.wizard.state.regionData.region.regionPage,
      ctx.wizard.state.regionData.region.itemsPerPage
    );

    if (regions.totalItems === 0) {
      await ctx.answerCbQuery(ctx.i18n.t("Client.emptyDataMsg"));
      return;
    }

    const keyboard = generateItemsKeyboard(
      ctx.wizard.state.regionData.region.regionPage,
      ctx.i18n.locale(),
      regions.totalItems,
      ctx.wizard.state.regionData.region.itemsPerPage,
      regions.items,
      ctx.i18n
    );
    // await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.editMessageText(
      ctx.i18n.t("AdminRegionForm.chooseRegionTxt"),
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
    let regionIsArchived = false;
    switch (callbackData) {
      case "archive":
        regionIsArchived = true;
        break;
      case "unarchive":
        regionIsArchived = false;
        break;
    }
    const message = regionIsArchived
      ? ctx.i18n.t("AdminRegionForm.regionIsArchivedMsg")
      : ctx.i18n.t("AdminRegionForm.regionIsUnArchivedMsg");
    await ArchiveRegion(ctx.wizard.state.regionData.regionId, regionIsArchived);
    await ctx.answerCbQuery(message);

    // Change Message
    const region = await GetRegionByID(ctx.wizard.state.regionData.regionId);
    const regionName =
      ctx.i18n.locale() === "uz" ? region.name_uz : region.name_ru;
    const regionDate = region.createdAt?.toLocaleString(ctx.i18n.locale(), {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      timeZoneName: "short",
    });
    const region_caption = ctx.i18n.t("AdminRegionForm.regionUpdateCaption", {
      regionName,
      regionDate,
    });
    const isArchived = region.isArchived;
    ctx.wizard.state.regionData.keyboard = Markup.inlineKeyboard([
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

    await ctx.editMessageText(
      region_caption,
      ctx.wizard.state.regionData.keyboard
    );
    return;
  } catch (error) {
    console.log(error);
  }
});
manageStep.action("edit", async (ctx) => {
  try {
    ctx.wizard.state.regionData.form = {};
    ctx.wizard.state.regionData.form.keyboard = Markup.keyboard([
      // [Markup.button.text(ctx.i18n.t("Client.backOneStepMsg"))],
      [Markup.button.text(ctx.i18n.t("Client.cancelApplicationBtn"))],
    ]);
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.reply(
      ctx.i18n.t("AdminRegionForm.enterRegionNameUzText"),
      ctx.wizard.state.regionData.form.keyboard
    );
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});

const getUzbekNameStep = new Composer();
getUzbekNameStep.hears(match("Client.cancelApplicationBtn"), async (ctx) => {
  try {
    await ctx.reply(
      ctx.i18n.t("AdminRegionForm.editingCanceledMsg"),
      Markup.removeKeyboard()
    );
    const region = await GetRegionByID(ctx.wizard.state.regionData.regionId);
    const regionName =
      ctx.i18n.locale() === "uz" ? region.name_uz : region.name_ru;
    const regionDate = region.createdAt?.toLocaleString(ctx.i18n.locale(), {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      timeZoneName: "short",
    });
    const region_caption = ctx.i18n.t("AdminRegionForm.regionUpdateCaption", {
      regionName,
      regionDate,
    });
    const isArchived = region.isArchived;
    ctx.wizard.state.regionData.keyboard = Markup.inlineKeyboard([
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

    await ctx.reply(region_caption, ctx.wizard.state.regionData.keyboard);
    return ctx.wizard.selectStep(1);
  } catch (error) {
    console.log(error);
  }
});
getUzbekNameStep.on("message", async (ctx) => {
  try {
    ctx.wizard.state.regionData.form.name_uz = ctx.message.text;
    await ctx.reply(ctx.i18n.t("AdminRegionForm.enterRegionNameRuText"));
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});

const getRussianNameStep = new Composer();
getRussianNameStep.hears(match("Client.cancelApplicationBtn"), async (ctx) => {
  try {
    await ctx.reply(
      ctx.i18n.t("AdminRegionForm.editingCanceledMsg"),
      Markup.removeKeyboard()
    );
    const region = await GetRegionByID(ctx.wizard.state.regionData.regionId);
    const regionName =
      ctx.i18n.locale() === "uz" ? region.name_uz : region.name_ru;
    const regionDate = region.createdAt?.toLocaleString(ctx.i18n.locale(), {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      timeZoneName: "short",
    });
    const region_caption = ctx.i18n.t("AdminRegionForm.regionUpdateCaption", {
      regionName,
      regionDate,
    });
    const isArchived = region.isArchived;
    ctx.wizard.state.regionData.keyboard = Markup.inlineKeyboard([
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

    await ctx.reply(region_caption, ctx.wizard.state.regionData.keyboard);
    return ctx.wizard.selectStep(1);
  } catch (error) {
    console.log(error);
  }
});
getRussianNameStep.on("message", async (ctx) => {
  try {
    ctx.wizard.state.regionData.form.name_ru = ctx.message.text;
    const confirmationMessage = {
      text: ctx.i18n.t("AdminRegionForm.editConfirmationMsg", {
        regionNameUz: ctx.wizard.state.regionData.form.name_uz,
        regionNameRu: ctx.wizard.state.regionData.form.name_ru,
      }),
      buttons: Markup.inlineKeyboard([
        [
          Markup.button.callback(ctx.i18n.t("Admin.yesBtn"), "yes"),
          Markup.button.callback(ctx.i18n.t("Admin.noBtn"), "no"),
        ],
      ]),
    };
    await ctx.reply(confirmationMessage.text, confirmationMessage.buttons);
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
      const region = await GetRegionByID(ctx.wizard.state.regionData.regionId);
      const regionName =
        ctx.i18n.locale() === "uz" ? region.name_uz : region.name_ru;
      const regionDate = region.createdAt?.toLocaleString(ctx.i18n.locale(), {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        timeZoneName: "short",
      });
      const region_caption = ctx.i18n.t("AdminRegionForm.regionUpdateCaption", {
        regionName,
        regionDate,
      });
      const isArchived = region.isArchived;
      ctx.wizard.state.regionData.keyboard = Markup.inlineKeyboard([
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

      await ctx.reply(region_caption, ctx.wizard.state.regionData.keyboard);
      return ctx.wizard.selectStep(1);
    } catch (error) {
      console.log(error);
    }
  }
);
editConfirmationStep.action(["yes", "no"], async (ctx) => {
  try {
    const callbackData = ctx.update.callback_query.data;
    if (callbackData === "yes") {
      await UpdateRegionNames(
        ctx.wizard.state.regionData.form.name_uz,
        ctx.wizard.state.regionData.form.name_ru,
        ctx.wizard.state.regionData.regionId
      );
      await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
      ctx.reply(
        ctx.i18n.t("AdminRegionForm.regionSavedText"),
        Markup.removeKeyboard()
      );
    } else if (callbackData === "no") {
      await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
      ctx.reply(
        ctx.i18n.t("AdminRegionForm.editingCanceledMsg"),
        Markup.removeKeyboard()
      );
    }
    const region = await GetRegionByID(ctx.wizard.state.regionData.regionId);
    const regionName =
      ctx.i18n.locale() === "uz" ? region.name_uz : region.name_ru;
    const regionDate = region.createdAt?.toLocaleString(ctx.i18n.locale(), {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      timeZoneName: "short",
    });
    const region_caption = ctx.i18n.t("AdminRegionForm.regionUpdateCaption", {
      regionName,
      regionDate,
    });
    const isArchived = region.isArchived;
    ctx.wizard.state.regionData.keyboard = Markup.inlineKeyboard([
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

    await ctx.reply(region_caption, ctx.wizard.state.regionData.keyboard);
    return ctx.wizard.selectStep(1);
  } catch (error) {
    console.log(error);
  }
});

module.exports = new Scenes.WizardScene(
  "ManageRegionsWizard",
  startStep,
  manageStep,
  getUzbekNameStep,
  getRussianNameStep,
  editConfirmationStep
);
