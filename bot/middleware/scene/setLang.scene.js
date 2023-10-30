const { Markup, Scenes, Composer } = require("telegraf");

const setlanguage = new Composer();
setlanguage.on("callback_query", async (ctx) => {
  try {
    const callback_data = await ctx.callbackQuery.data;
    console.log(callback_data);
    // return ctx.wizard.next();
  } catch (e) {
    console.log(e);
  }
});

module.exports = new Scenes.WizardScene("LanguageWizard", setlanguage);
