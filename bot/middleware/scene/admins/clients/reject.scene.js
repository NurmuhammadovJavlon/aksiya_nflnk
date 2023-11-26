const { Markup, Scenes, Composer } = require("telegraf");
const Client = require("../../../../model/client.model");
const User = require("../../../../model/user.model");

const startStep = new Composer();
startStep.command("reject", async (ctx) => {
  try {
    ctx.wizard.state.clientData = {};
    ctx.wizard.state.clientData.clientId =
      ctx.message.text.match(/\/reject\s+(\d+)/)[1];
    const client = await Client.findOne({
      where: { id: parseInt(ctx.wizard.state.clientData.clientId) },
      include: [{ model: User, attributes: ["id", "chatID"] }],
      raw: true,
      nest: true,
    });
    ctx.wizard.state.clientData.clientChatId = client?.user?.chatID;

    if (!client || client.status === "FINISHED") {
      await ctx.reply("Этот случай уже рассматривался");
      return ctx.scene.leave();
    }

    await ctx.reply(
      ctx.i18n.t("AdminClientForm.sendReasonOfRejection"),
      Markup.inlineKeyboard([
        [
          Markup.button.callback(
            ctx.i18n.t("Client.cancelApplicationBtn"),
            "cancel"
          ),
        ],
      ])
    );
    return ctx.wizard.next();
  } catch (e) {
    console.log(e);
  }
});

const rejectStep = new Composer();
rejectStep.action("cancel", async (ctx) => {
  try {
    await ctx.reply(ctx.i18n.t("Client.successfullyCancelledMsg"));
    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});
rejectStep.on("message", async (ctx) => {
  try {
    const rejectionMsg = ctx.message.text;
    await Client.destroy({
      where: {
        status: "PENDING",
        id: parseInt(ctx.wizard.state.clientData.clientId),
      },
    });

    await ctx.telegram.sendMessage(
      parseInt(ctx.wizard.state.clientData.clientChatId),
      rejectionMsg
    );

    return ctx.scene.leave();
  } catch (error) {
    console.log(error);
  }
});

module.exports = new Scenes.WizardScene(
  "RejectClientVerificationWizard",
  startStep,
  rejectStep
);
