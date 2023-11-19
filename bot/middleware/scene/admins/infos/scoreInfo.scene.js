const { Markup, Scenes, Composer } = require("telegraf");
const { match } = require("telegraf-i18n");
const ScoreInfo = require("../../../../model/scoreInfo.model");
const generateAdminKeys = require("../../../../functions/keyboards/admin.keyboard");

const getScoreInfo = async () => {
  try {
    const scoreInfo = await ScoreInfo.findOne({ raw: true });
    if (!scoreInfo) return null;
    return scoreInfo;
  } catch (error) {
    console.log(error);
  }
};

const LeaveScene = async (ctx) => {
  const AdminMenu = {
    text: ctx.i18n.t("choosePromotion"),
    buttons: await generateAdminKeys(ctx),
  };
  await ctx.reply(AdminMenu.text, AdminMenu.buttons);
};

const startStep = new Composer();
startStep.hears(match("Admin.scoreInfoBtn"), async (ctx) => {
  try {
    ctx.wizard.state.scoreInfo = {};
    const scoreInfo = await getScoreInfo();
    if (!scoreInfo) {
      ctx.wizard.state.scoreInfo.method = "CREATE";
      const clientPanel = {
        text: ctx.i18n.t("Score.sendRuScoreTextMsg"),
      };
      await ctx.reply(clientPanel.text);
      return ctx.wizard.selectStep(2);
    }
    ctx.wizard.state.scoreInfo.id = scoreInfo.id;
    ctx.wizard.state.scoreInfo.method = "EDIT";
    const caption =
      ctx.i18n.locale() === "uz" ? scoreInfo.text_uz : scoreInfo.text_ru;
    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback(ctx.i18n.t("Admin.deleteBtn"), "delete"),
        Markup.button.callback(ctx.i18n.t("Admin.editBtn"), "edit"),
      ],
      [
        Markup.button.callback(
          ctx.i18n.t("Client.cancelApplicationBtn"),
          `cancel`
        ),
      ],
    ]);
    await ctx.replyWithHTML(caption, keyboard);
    return ctx.wizard.next();
  } catch (e) {
    console.log(e);
  }
});

const manageStep = new Composer();
manageStep.action("cancel", async (ctx) => {
  try {
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await LeaveScene(ctx);
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});
manageStep.action("delete", async (ctx) => {
  try {
    await ScoreInfo.destroy({
      where: { id: ctx.wizard.state.scoreInfo.id },
    });
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await LeaveScene(ctx);
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});
manageStep.action("edit", async (ctx) => {
  try {
    const clientPanel = {
      text: ctx.i18n.t("Score.sendRuScoreTextMsg"),
    };
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.reply(clientPanel.text);
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});

const getRuScoreText = new Composer();
getRuScoreText.on("message", async (ctx) => {
  try {
    ctx.wizard.state.scoreInfo.text_ru = ctx.update.message.text;
    await ctx.reply(ctx.i18n.t("Score.sendUzScoreTextMsg"));
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});

const getUzScoreText = new Composer();
getUzScoreText.on("message", async (ctx) => {
  try {
    ctx.wizard.state.scoreInfo.text_uz = ctx.update.message.text;
    const confirmationMsg = {
      text: `Uz:\n\n${ctx.wizard.state.scoreInfo.text_uz}\n\nRu:\n\n ${ctx.wizard.state.scoreInfo.text_ru}`,
      buttons: Markup.inlineKeyboard([
        [
          Markup.button.callback(ctx.i18n.t("Admin.yesBtn"), "yes"),
          Markup.button.callback(ctx.i18n.t("Admin.noBtn"), "no"),
        ],
      ]),
    };
    // await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.replyWithHTML(confirmationMsg.text, confirmationMsg.buttons);

    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});

const confirmStep = new Composer();
confirmStep.action(["yes", "no"], async (ctx) => {
  try {
    const callBackData = ctx.update.callback_query.data;
    const AdminMenu = await generateAdminKeys(ctx);
    if (callBackData === "yes") {
      if (ctx.wizard.state.scoreInfo.method === "CREATE") {
        await ScoreInfo.create({
          text_uz: ctx.wizard.state.scoreInfo.text_uz,
          text_ru: ctx.wizard.state.scoreInfo.text_ru,
        });
      } else if (ctx.wizard.state.scoreInfo.method === "EDIT") {
        await ScoreInfo.update(
          {
            text_uz: ctx.wizard.state.scoreInfo.text_uz,
            text_ru: ctx.wizard.state.scoreInfo.text_ru,
          },
          { where: { id: ctx.wizard.state.scoreInfo.id } }
        );
      }
      await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
      await ctx.reply(ctx.i18n.t("dataSavedMsg"), AdminMenu);
    } else if (callBackData === "no") {
      await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
      await ctx.reply(ctx.i18n.t("Client.successfullyCancelledMsg"), AdminMenu);
    }
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});

module.exports = new Scenes.WizardScene(
  "ScoreWizard",
  startStep,
  manageStep,
  getRuScoreText,
  getUzScoreText,
  confirmStep
);
