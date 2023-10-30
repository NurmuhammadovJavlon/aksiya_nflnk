const { Scenes, session } = require("telegraf");
const bot = require("../../connection/token.connection");

const oneWizard = require("./oneWizard.scene");
const twoWizard = require("./twoWizard.scene");
const LanguageWizard = require("./setLang.scene");
const i18n = require("../../connection/i18n.connection");

const stage = new Scenes.Stage([oneWizard, twoWizard, LanguageWizard]);

bot.use(session());
bot.use(stage.middleware());
bot.use(i18n.middleware());

module.exports = stage;
