const { Markup, Scenes, Composer } = require("telegraf");
const { match } = require("telegraf-i18n");
const {
  GetAllAdminUsers,
  getUser,
} = require("../../../../common/sequelize/user.sequelize");

const sendComplainMsgToAdmins = async (ctx, complainMsg) => {
  try {
    // Send to Admins
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

    const [user, admins] = await Promise.all([
      getUser(String(ctx.chat.id)),
      GetAllAdminUsers(),
    ]);

    const complainCaption = ctx.i18n.t("Complain.finalComplainMsg", {
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      complainMsg: complainMsg ?? "-",
      date,
    });

    const processedAdmins = new Set();
    const adminsIterator = admins[Symbol.iterator]();

    const sendAdminMessage = async () => {
      const admin = adminsIterator.next().value;

      if (admin && !processedAdmins.has(admin.chatID)) {
        try {
          if (ctx.wizard.state.complain.videoId) {
            await ctx.telegram.sendMediaGroup(parseInt(admin.chatID), [
              {
                media: ctx.wizard.state.complain.videoId,
                type: "video",
                caption: complainCaption,
              },
            ]);
          } else {
            await ctx.telegram.sendMessage(
              parseInt(admin.chatID),
              complainCaption
            );
          }
          processedAdmins.add(admin.chatID);
        } catch (error) {
          console.error(`Error sending message to admin: ${error.message}`);
        }
      } else {
        clearInterval(intervalId);
        console.log("All messages sent successfully.");
      }
    };

    const intervalId = setInterval(sendAdminMessage, 5000);
    await sendAdminMessage(); // Start the first iteration immediately
  } catch (error) {
    console.log(error);
  }
};

const startStep = new Composer();
startStep.hears(match("complainBtn"), async (ctx) => {
  try {
    ctx.wizard.state.complain = {};
    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback(
          ctx.i18n.t("Client.cancelApplicationBtn"),
          `cancel`
        ),
        Markup.button.callback(ctx.i18n.t("skipBtn"), `skip`),
      ],
    ]);

    await ctx.reply(ctx.i18n.t("Complain.sendVideoMsg"), keyboard);
    return ctx.wizard.next();
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

const getVideoStep = new Composer();
getVideoStep.action("skip", async (ctx) => {
  try {
    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback(
          ctx.i18n.t("Client.cancelApplicationBtn"),
          `cancel`
        ),
      ],
      [Markup.button.callback(ctx.i18n.t("Client.backOneStepMsg"), `back`)],
    ]);
    await ctx.editMessageText(
      ctx.i18n.t("Complain.writeComplainMsg"),
      keyboard
    );
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});
getVideoStep.action("cancel", async (ctx) => {
  try {
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.reply(ctx.i18n.t("Client.successfullyCancelledMsg"));
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});
getVideoStep.on("video", async (ctx) => {
  try {
    ctx.wizard.state.complain.videoId = ctx.update.message.video.file_id;
    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback(
          ctx.i18n.t("Client.cancelApplicationBtn"),
          `cancel`
        ),
      ],
      [Markup.button.callback(ctx.i18n.t("Client.backOneStepMsg"), `back`)],
    ]);
    await ctx.reply(ctx.i18n.t("Complain.writeComplainMsg"), keyboard);
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});

const getComplainMsgStep = new Composer();
getComplainMsgStep.action("back", async (ctx) => {
  try {
    ctx.wizard.state.complain.videoId = null;
    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback(
          ctx.i18n.t("Client.cancelApplicationBtn"),
          `cancel`
        ),
        Markup.button.callback(ctx.i18n.t("skipBtn"), `skip`),
      ],
    ]);

    await ctx.editMessageText(ctx.i18n.t("Complain.sendVideoMsg"), keyboard);
    return ctx.wizard.back();
  } catch (error) {
    console.log(error);
  }
});
getComplainMsgStep.action("cancel", async (ctx) => {
  try {
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.reply(ctx.i18n.t("Client.successfullyCancelledMsg"));
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});
getComplainMsgStep.action("skip", async (ctx) => {
  try {
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    if (!ctx.wizard.state.complain.videoId) {
      await ctx.reply(ctx.i18n.t("Complain.videoOrMsgIsRequired"));
      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback(
            ctx.i18n.t("Client.cancelApplicationBtn"),
            `cancel`
          ),
          Markup.button.callback(ctx.i18n.t("skipBtn"), `skip`),
        ],
        [Markup.button.callback(ctx.i18n.t("Client.backOneStepMsg"), `back`)],
      ]);
      await ctx.reply(ctx.i18n.t("Complain.writeComplainMsg"), keyboard);
      return;
    }

    await ctx.reply(ctx.i18n.t("Complain.complainIsSentMsg"));
    await sendComplainMsgToAdmins(ctx);
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});
getComplainMsgStep.on("message", async (ctx) => {
  try {
    ctx.wizard.state.complain.complainMsg = ctx.message.text;
    const confirmMsg = {
      text: ctx.i18n.t("Complain.confirmMsg", {
        complainMsg: ctx.wizard.state.complain.complainMsg,
      }),
      buttons: [
        [
          Markup.button.callback(ctx.i18n.t("Admin.yesBtn"), "yes"),
          Markup.button.callback(ctx.i18n.t("Admin.noBtn"), "no"),
        ],
        [Markup.button.callback(ctx.i18n.t("Client.backOneStepMsg"), `back`)],
      ],
    };

    if (ctx.wizard.state.complain.videoId) {
      await ctx.replyWithVideo(ctx.wizard.state.complain.videoId, {
        caption: confirmMsg.text,
        reply_markup: {
          inline_keyboard: confirmMsg.buttons,
        },
      });
      return ctx.wizard.next();
    }

    await ctx.reply(confirmMsg.text, Markup.inlineKeyboard(confirmMsg.buttons));
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});

const confirmComplainStep = new Composer();
confirmComplainStep.action("back", async (ctx) => {
  try {
    ctx.wizard.state.complain.videoId = null;
    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback(
          ctx.i18n.t("Client.cancelApplicationBtn"),
          `cancel`
        ),
        Markup.button.callback(ctx.i18n.t("skipBtn"), `skip`),
      ],
      [Markup.button.callback(ctx.i18n.t("Client.backOneStepMsg"), `back`)],
    ]);
    await ctx.reply(ctx.i18n.t("Complain.writeComplainMsg"), keyboard);
    return ctx.wizard.back();
  } catch (error) {
    console.log(error);
  }
});
confirmComplainStep.action("cancel", async (ctx) => {
  try {
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.reply(ctx.i18n.t("Client.successfullyCancelledMsg"));
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});
confirmComplainStep.action("yes", async (ctx) => {
  try {
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.reply(ctx.i18n.t("Complain.complainIsSentMsg"));
    await sendComplainMsgToAdmins(ctx, ctx.wizard.state.complain.complainMsg);
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});
confirmComplainStep.action("no", async (ctx) => {
  try {
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.reply(ctx.i18n.t("Client.successfullyCancelledMsg"));
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});

module.exports = new Scenes.WizardScene(
  "ComplainWizard",
  startStep,
  getVideoStep,
  getComplainMsgStep,
  confirmComplainStep
);
