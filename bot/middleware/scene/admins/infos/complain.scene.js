const { Markup, Scenes, Composer } = require("telegraf");
const { match } = require("telegraf-i18n");
const {
  GetAllAdminUsers,
  getUser,
} = require("../../../../common/sequelize/user.sequelize");

const startStep = new Composer();
startStep.hears(match("complainBtn"), async (ctx) => {
  try {
    ctx.wizard.state.complain = {};
    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback(
          ctx.i18n.t("Complain.sendVideoBtn"),
          "sendVideo"
        ),
      ],
      [
        Markup.button.callback(
          ctx.i18n.t("Complain.writeComplainBtn"),
          "write"
        ),
      ],
      [
        Markup.button.callback(
          ctx.i18n.t("Client.cancelApplicationBtn"),
          `cancel`
        ),
      ],
    ]);
    await ctx.reply(ctx.i18n.t("Complain.complainMsg"), keyboard);
    // return ctx.wizard.next();
  } catch (e) {
    console.log(e);
  }
});
startStep.action("cancel", async (ctx) => {
  try {
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.reply(ctx.i18n.t("Client.successfullyCancelledMsg"));
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});
startStep.action("sendVideo", async (ctx) => {
  try {
    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback(
          ctx.i18n.t("Client.cancelApplicationBtn"),
          `cancel`
        ),
      ],
    ]);
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.reply(ctx.i18n.t("Complain.sendVideoMsg"), keyboard);
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});
startStep.action("write", async (ctx) => {
  try {
    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback(
          ctx.i18n.t("Client.cancelApplicationBtn"),
          `cancel`
        ),
      ],
    ]);
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.reply(ctx.i18n.t("Complain.writeComplainMsg"), keyboard);
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});

const getComplainStep = new Composer();
getComplainStep.action("cancel", async (ctx) => {
  try {
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.reply(ctx.i18n.t("Client.successfullyCancelledMsg"));
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});
getComplainStep.on("video", async (ctx) => {
  try {
    ctx.wizard.state.complain.videoId = ctx.update.message.video.file_id;
    await ctx.reply(ctx.i18n.t("Complain.complainIsSentMsg"));

    // Send to Admins
    const dateFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    };
    const date = new Intl.DateTimeFormat(
      ctx.i18n.locale(),
      dateFormatOptions
    ).format(new Date());
    const user = await getUser(String(ctx.chat.id));
    const complainCaption = `Жалоба от: ${
      user.firstName ?? user.lastName
    }\nНомер телефона: +${user.phoneNumber}\n\nДата: ${date}`;
    const processedAdmins = new Set();
    const admins = await GetAllAdminUsers();
    for (const admin of admins) {
      if (!processedAdmins.has(admin.chatID)) {
        try {
          await ctx.telegram.sendMediaGroup(parseInt(admin.chatID), [
            {
              media: ctx.wizard.state.complain.videoId,
              type: "video",
              caption: complainCaption,
            },
          ]);
          processedAdmins.add(admin.chatID);
          // console.log(`Message sent to ${operator.name}`);
        } catch (error) {
          console.error(`Error sending message to admin: ${error.message}`);
        }
      }

      // Introduce a delay (e.g., 3 seconds) before sending to the next admin
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});
getComplainStep.on("message", async (ctx) => {
  try {
    await ctx.reply(ctx.i18n.t("Complain.complainIsSentMsg"));

    // send to admins
    const dateFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    };
    const complainMsg = ctx.update.message.text;
    const processedAdmins = new Set();
    const user = await getUser(String(ctx.chat.id));
    const date = new Intl.DateTimeFormat(
      ctx.i18n.locale(),
      dateFormatOptions
    ).format(new Date());

    const complainCaption = `Жалоба от: ${
      user.firstName ?? user.lastName
    }\nНомер телефона: +${
      user.phoneNumber
    }\n\nСообщение: ${complainMsg}\n\nДата: ${date}`;

    const admins = await GetAllAdminUsers();
    for (const admin of admins) {
      if (!processedAdmins.has(admin.chatID)) {
        try {
          await ctx.telegram.sendMessage(
            parseInt(admin.chatID),
            complainCaption
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

    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});

module.exports = new Scenes.WizardScene(
  "ComplainWizard",
  startStep,
  getComplainStep
);
