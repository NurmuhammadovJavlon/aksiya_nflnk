const { Markup, Scenes, Composer } = require("telegraf");
const { match } = require("telegraf-i18n");
const CompanyInfo = require("../../../../model/companyInfo.model");
const generateAdminKeys = require("../../../../functions/keyboards/admin.keyboard");

const getCompanyInfo = async () => {
  try {
    const companyInfo = await CompanyInfo.findOne({ raw: true });
    if (!companyInfo) return null;
    return companyInfo;
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
startStep.hears(match("Admin.companyInfoBtn"), async (ctx) => {
  try {
    ctx.wizard.state.companyInfo = {};
    const companyInfo = await getCompanyInfo();
    if (!companyInfo) {
      ctx.wizard.state.companyInfo.method = "CREATE";
      const clientPanel = {
        text: ctx.i18n.t("sendRuCompanyTextMsg"),
      };
      await ctx.reply(clientPanel.text);
      return ctx.wizard.selectStep(2);
    }
    ctx.wizard.state.companyInfo.id = companyInfo.id;
    ctx.wizard.state.companyInfo.method = "EDIT";
    const caption =
      ctx.i18n.locale() === "uz" ? companyInfo.text_uz : companyInfo.text_ru;
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
    await CompanyInfo.destroy({
      where: { id: ctx.wizard.state.companyInfo.id },
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
      text: ctx.i18n.t("sendRuCompanyTextMsg"),
    };
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.reply(clientPanel.text);
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});

const getRuCompanyText = new Composer();
getRuCompanyText.on("message", async (ctx) => {
  try {
    ctx.wizard.state.companyInfo.text_ru = ctx.update.message.text;
    await ctx.reply(ctx.i18n.t("sendUzCompanyTextMsg"));
    return ctx.wizard.next();
    // const companyInfo = await CompanyInfo.create({ text_uz: caption });
    // console.log(companyInfo);
  } catch (error) {
    console.log(error);
  }
});

const getUzCompanyText = new Composer();
getUzCompanyText.on("message", async (ctx) => {
  try {
    ctx.wizard.state.companyInfo.text_uz = ctx.update.message.text;
    // const companyInfo = await CompanyInfo.create({
    //   text_uz: ctx.wizard.state.companyInfo.text_uz,
    //   text_ru: ctx.wizard.state.companyInfo.text_ru,
    // });

    const confirmationMsg = {
      text: `Uz:\n\n${ctx.wizard.state.companyInfo.text_uz}\n\nRu:\n\n ${ctx.wizard.state.companyInfo.text_ru}`,
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
      if (ctx.wizard.state.companyInfo.method === "CREATE") {
        await CompanyInfo.create({
          text_uz: ctx.wizard.state.companyInfo.text_uz,
          text_ru: ctx.wizard.state.companyInfo.text_ru,
        });
      } else if (ctx.wizard.state.companyInfo.method === "EDIT") {
        await CompanyInfo.update(
          {
            text_uz: ctx.wizard.state.companyInfo.text_uz,
            text_ru: ctx.wizard.state.companyInfo.text_ru,
          },
          { where: { id: ctx.wizard.state.companyInfo.id } }
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
  "CompanyInfoWizard",
  startStep,
  manageStep,
  getRuCompanyText,
  getUzCompanyText,
  confirmStep
);
