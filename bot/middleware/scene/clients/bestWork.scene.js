const { Markup, Scenes, Composer } = require("telegraf");
const { match } = require("telegraf-i18n");
const generateMainMenuKeys = require("../../../functions/keyboards/main-menu.keyboard");
const cloudinary = require("../../../connection/cloudinary.connection");
const uploadVideo = require("../../../functions/cloudinary/video.upload");
const {
  GetAllAdminUsers,
  getUser,
} = require("../../../common/sequelize/user.sequelize");
const {
  GetClietByUser,
} = require("../../../common/sequelize/client.sequelize");
const {
  GetBestWork,
  CreateBestWork,
} = require("../../../common/sequelize/bestwork.sequelize");
const generatePromotionButtons = require("../../../functions/keyboards/promotion.keyboards");

const informAllAdmins = async (
  ctx,
  admins,
  processedAdmins,
  video_file_id,
  caption,
  bestWork
) => {
  const adminsIterator = admins[Symbol.iterator]();

  const sendAdminMessage = async () => {
    const admin = adminsIterator.next().value;

    if (admin && !processedAdmins.has(admin.chatID)) {
      try {
        await ctx.telegram.sendVideo(parseInt(admin.chatID), video_file_id, {
          caption,
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: ctx.i18n.t("AdminOrderForm.confirmBtn"),
                  callback_data: `confirm_w_${bestWork?.id}`,
                },
              ],
            ],
          },
        });
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
};

const initScene = new Composer();
initScene.hears(match("backToMainMenuBtn"), async (ctx) => {
  const promotionMenu = {
    text: ctx.i18n.t("choosePromotion"),
    buttons: await generateMainMenuKeys(ctx),
  };
  await ctx.reply(promotionMenu.text, promotionMenu.buttons);
  ctx.scene.leave();
});

initScene.hears(match("participateBtn"), async (ctx) => {
  try {
    await ctx.reply(
      ctx.i18n.t("Client.sendVideoMsg"),
      Markup.inlineKeyboard([
        [
          Markup.button.callback(
            ctx.i18n.t("Client.cancelApplicationBtn"),
            `cancel`
          ),
        ],
      ])
    );
    return ctx.wizard.next();
  } catch (error) {
    console.log(error);
  }
});

const sendVideo = new Composer();
sendVideo.action("cancel", async (ctx) => {
  await ctx.reply(ctx.i18n.t("Client.applicationCanceledMsg"));
  return ctx.scene.leave();
});
sendVideo.on("video", async (ctx) => {
  try {
    ctx.wizard.state.bestwork = {};
    ctx.wizard.state.bestwork.video = ctx.update.message?.video;

    const maxSizeInBytes = 50 * 1024 * 1024; // 50MB
    if (ctx.wizard.state.bestwork.video.file_size > maxSizeInBytes) {
      ctx.reply(ctx.i18n.t("Client.maxVideoSizeLimitMsg"));
      return;
    } else {
      const fileSizeInMegabytes =
        ctx.wizard.state.bestwork.video.file_size / (1024 * 1024);
      await ctx.reply(
        ctx.i18n.t("Client.sentVideoSizeMsg", {
          videoSize: `${fileSizeInMegabytes.toFixed(2)} MB`,
        }),
        Markup.inlineKeyboard([
          [
            Markup.button.callback(ctx.i18n.t("Admin.yesBtn"), "yes"),
            Markup.button.callback(ctx.i18n.t("Admin.noBtn"), "no"),
          ],
          [Markup.button.callback(ctx.i18n.t("Client.backOneStepMsg"), `back`)],
        ])
      );
      return ctx.wizard.next();
    }
  } catch (error) {
    console.log(error);
  }
});

sendVideo.on(["photo", "document", "message"], async (ctx) => {
  try {
    await ctx.reply(
      ctx.i18n.t("Client.sendOnlyVideosMsg"),
      Markup.inlineKeyboard([
        [
          Markup.button.callback(
            ctx.i18n.t("Client.cancelApplicationBtn"),
            `cancel`
          ),
        ],
      ])
    );
    return;
  } catch (error) {
    console.log(error);
  }
});

const confirmVideoStep = new Composer();
confirmVideoStep.action("back", async (ctx) => {
  try {
    await ctx.editMessageText(
      ctx.i18n.t("Client.sendVideoMsg"),
      Markup.inlineKeyboard([
        [
          Markup.button.callback(
            ctx.i18n.t("Client.cancelApplicationBtn"),
            `cancel`
          ),
        ],
      ])
    );
    return ctx.wizard.back();
  } catch (error) {
    console.log(error);
  }
});
confirmVideoStep.action("yes", async (ctx) => {
  try {
    const mainMenu = generatePromotionButtons(ctx);
    await ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    await ctx.reply(ctx.i18n.t("Client.workConfirmationMsgToUser"), mainMenu);

    const user = await getUser(String(ctx.chat.id));
    const [bestWork, client, admins] = await Promise.all([
      CreateBestWork(user?.chatID, user?.id),
      GetClietByUser(user.id),
      GetAllAdminUsers(),
    ]);

    const clientLocation = client ? client.location : "❌";
    const today = new Intl.DateTimeFormat(ctx.i18n.locale(), {
      minute: "2-digit",
      hour: "2-digit",
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Tashkent",
    }).format(new Date());
    const caption = ctx.i18n.t("Client.bestWorkCaption", {
      workId: bestWork.id,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      date: today,
      clientLocation,
    });

    // const uplodedVideoUrl = await uploadVideo(href, fileId);
    const processedAdmins = new Set();

    await informAllAdmins(
      ctx,
      admins,
      processedAdmins,
      ctx.wizard.state.bestwork.video?.file_id,
      caption,
      bestWork
    );
  } catch (error) {
    console.log(error);
  }
});
confirmVideoStep.action("no", async (ctx) => {
  try {
    await ctx.editMessageText(ctx.i18n.t("Client.applicationCanceledMsg"));
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});

module.exports = new Scenes.WizardScene(
  "BestWorkPromotionWizard",
  initScene,
  sendVideo,
  confirmVideoStep
);
