const { Markup, Scenes, Composer } = require("telegraf");

const startStep = new Composer();
startStep.hears("two", async (ctx) => {
   try {
      ctx.wizard.state.formData = {};
      await ctx.reply("oneMessage", {
         reply_markup: {
            "inline_keyboard": [
               [Markup.button.callback("yes-ok", "ok")],
               [Markup.button.callback("changed_my_mind", "changed_my_mind")]
            ]
         }
      });
      return ctx.wizard.next();
   } catch (e) {
      console.log(e);
   }
});

const finishStep = new Composer();
finishStep.action("changed_my_mind", async (ctx) => {
   try {
      await ctx.answerCbQuery();
      await ctx.replyWithHTML("Have you changed your mind!");
      return ctx.scene.leave();
   } catch (e) {
      console.log(e);
   }
});
finishStep.action("ok", async (ctx) => {
   try {
      await ctx.answerCbQuery();
      await ctx.reply("ok");
      return ctx.scene.leave();
   } catch (e) {
      console.log(e);
   }
});

module.exports = new Scenes.WizardScene("twoWizard", startStep, finishStep);