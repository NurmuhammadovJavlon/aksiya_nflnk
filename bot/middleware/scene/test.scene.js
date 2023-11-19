// const { Scenes, Markup } = require("telegraf");

// // Wizard step 1
// const step1 = new Scenes.BaseScene("step1");
// step1.action("start", (ctx) => {
//   ctx.reply(
//     'Step 1. Press "Next" to continue.',
//     Markup.inlineKeyboard([Markup.button.callback("Next", "next")])
//   );
//   ctx.wizard.next(); // Move to the next step
// });
// step1.enter((ctx) =>
//   ctx.reply(
//     'Step 1. Press "Next" to continue.',
//     Markup.inlineKeyboard([Markup.button.callback("Next", "next")])
//   )
// );

// // Wizard step 2
// const step2 = new Scenes.BaseScene("step2");
// step2.action("next", (ctx) =>
//   ctx.reply(
//     'Step 2. Press "Back" to go back to Step 1 or "Next" to go to Step 3.',
//     Markup.inlineKeyboard([
//       Markup.button.callback("Back", "back"),
//       Markup.button.callback("Next", "next"),
//     ])
//   )
// );
// step2.action("back", (ctx) => {
//   ctx.reply("Going back to Step 1.");
//   ctx.wizard.back(); // Go back to the previous step
//   //   return ctx.wizard.steps[ctx.wizard.cursor](ctx);
//   console.log(ctx.wizard.steps[ctx.wizard.cursor].handler(ctx));
// });
// step2.action("next", (ctx) => {
//   ctx.reply("Moving to Step 3.");
//   ctx.wizard.next(); // Move to the next step
// });

// // Wizard step 3
// const step3 = new Scenes.BaseScene("step3");
// step3.enter((ctx) =>
//   ctx.reply(
//     'Step 3. Press "Back" to go back to Step 2 or "Finish" to finish.',
//     Markup.inlineKeyboard([
//       Markup.button.callback("Back", "back"),
//       Markup.button.callback("Finish", "finish"),
//     ])
//   )
// );
// step3.action("back", (ctx) => {
//   ctx.reply("Going back to Step 2.");
//   ctx.wizard.back(); // Go back to the previous step
// });
// step3.action("finish", (ctx) => {
//   ctx.reply("Wizard finished!");
//   ctx.scene.leave(); // Leave the wizard
// });

// // Wizard
// const TestScene = new Scenes.WizardScene(
//   "testScene",
//   (ctx) => {
//     ctx.reply(
//       'Welcome to the wizard! Press "Start" to begin.',
//       Markup.inlineKeyboard([Markup.button.callback("Start", "start")])
//     );
//     return ctx.wizard.next();
//   },
//   step1, // Add the steps to the wizard
//   step2,
//   step3
// );

// module.exports = TestScene;
