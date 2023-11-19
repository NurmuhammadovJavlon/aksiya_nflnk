const { Markup, Scenes, Composer } = require("telegraf");
const { match } = require("telegraf-i18n");
const generateAdminKeys = require("../../../../functions/keyboards/admin.keyboard");
const ContactInfo = require("../../../../model/contactInfo.mode");

const getContactInfo = async () => {
  try {
    const contactInfo = await ContactInfo.findOne({ raw: true });
    if (!contactInfo) return null;
    return contactInfo;
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
startStep.hears(match("Admin.contactInfoBtn"), async (ctx) => {
  try {
    ctx.wizard.state.contactInfo = {};
    const contactInfo = await getContactInfo();
    if (!contactInfo) {
      ctx.wizard.state.contactInfo.method = "CREATE";
      const clientPanel = {
        text: ctx.i18n.t("sendRuContactTextMsg"),
      };
      await ctx.reply(clientPanel.text);
      return ctx.wizard.selectStep(2);
    }
    ctx.wizard.state.contactInfo.id = contactInfo.id;
    ctx.wizard.state.contactInfo.method = "EDIT";
    const caption =
      ctx.i18n.locale() === "uz" ? contactInfo.text_uz : contactInfo.text_ru;
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
    await ContactInfo.destroy({
      where: { id: ctx.wizard.state.contactInfo.id },
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
      text: ctx.i18n.t("sendRuContactTextMsg"),
    };
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.reply(clientPanel.text);
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});

const getRuContactText = new Composer();
getRuContactText.on("message", async (ctx) => {
  try {
    ctx.wizard.state.contactInfo.text_ru = ctx.update.message.text;
    await ctx.reply(ctx.i18n.t("sendUzContactTextMsg"));
    return ctx.wizard.next();
    // const companyInfo = await CompanyInfo.create({ text_uz: caption });
    // console.log(companyInfo);
  } catch (error) {
    console.log(error);
  }
});

const getUzContactText = new Composer();
getUzContactText.on("message", async (ctx) => {
  try {
    ctx.wizard.state.contactInfo.text_uz = ctx.update.message.text;
    // const companyInfo = await CompanyInfo.create({
    //   text_uz: ctx.wizard.state.companyInfo.text_uz,
    //   text_ru: ctx.wizard.state.companyInfo.text_ru,
    // });

    const confirmationMsg = {
      text: `Uz:\n\n${ctx.wizard.state.contactInfo.text_uz}\n\nRu:\n\n ${ctx.wizard.state.contactInfo.text_ru}`,
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
      if (ctx.wizard.state.contactInfo.method === "CREATE") {
        await ContactInfo.create({
          text_uz: ctx.wizard.state.contactInfo.text_uz,
          text_ru: ctx.wizard.state.contactInfo.text_ru,
        });
      } else if (ctx.wizard.state.contactInfo.method === "EDIT") {
        await ContactInfo.update(
          {
            text_uz: ctx.wizard.state.contactInfo.text_uz,
            text_ru: ctx.wizard.state.contactInfo.text_ru,
          },
          { where: { id: ctx.wizard.state.contactInfo.id } }
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
  "ContactInfoWizard",
  startStep,
  manageStep,
  getRuContactText,
  getUzContactText,
  confirmStep
);
