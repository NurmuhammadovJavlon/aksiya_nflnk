const { Markup, Scenes, Composer } = require("telegraf");

const getPhoneNumber = new Composer();
getPhoneNumber.on("message", async (ctx) => {
  try {
    ctx.wizard.state.userData = {};
    ctx.wizard.state.userData.phoneNumber = ctx.message.text;
    let regex = /^[0-9\s]+$/;
    // 998979057301
    if (regex.test(ctx.message.text.replace(/\+/g, ""))) {
      console.log(ctx.message.text);
    } else {
      await ctx.reply(ctx.i18n.t("enterPhoneNumber"));
    }
    //  return ctx.scene.leave();
  } catch (e) {
    console.log(e);
  }
});

module.exports = new Scenes.WizardScene("PhoneNumber", getPhoneNumber);
