const { Markup, Scenes, Composer } = require("telegraf");
const { match } = require("telegraf-i18n");
const generateMainMenuKeys = require("../../../functions/keyboards/main-menu.keyboard");
const cloudinary = require("../../../connection/cloudinary.connection");
const uploadVideo = require("../../../functions/cloudinary/video.upload");
const {
  GetAllAdminUsers,
} = require("../../../common/sequelize/user.sequelize");

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
    const video = ctx.update.message.video;
    const fileId = video.file_id;

    const maxSizeInBytes = 50 * 1024 * 1024; // 50MB
    if (video.file_size > maxSizeInBytes) {
      ctx.reply(ctx.i18n.t("Client.maxVideoSizeLimitMsg"));
    } else {
      const fileSizeInMegabytes = video.file_size / (1024 * 1024);
      ctx.reply(
        `${ctx.i18n.t("Client.sentVideoSizeMsg")} ${fileSizeInMegabytes.toFixed(
          2
        )} MB`
      );
      // Handle the video as needed
      console.log(video);
      // Get a direct link to the video file
      const { href } = await ctx.telegram.getFileLink(fileId);
      // const uplodedVideoUrl = await uploadVideo(href, fileId);
      const admins = await GetAllAdminUsers();
      const processedAdmins = new Set();

      for (const admin of admins) {
        if (!processedAdmins.has(admin.chatID)) {
          try {
            await ctx.telegram.sendVideo(parseInt(admin.chatID), video.file_id);
            processedAdmins.add(admin.chatID);
            // console.log(`Message sent to ${operator.name}`);
          } catch (error) {
            console.error(`Error sending message to admin: ${error.message}`);
          }
        }

        // Introduce a delay (e.g., 3 seconds) before sending to the next admin
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  } catch (error) {
    console.log(error);
  }
});

module.exports = new Scenes.WizardScene(
  "BestWorkPromotionWizard",
  initScene,
  sendVideo
);
