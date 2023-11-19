const path = require("path");
const TelegrafI18n = require("telegraf-i18n");

// i18n options
const i18n = new TelegrafI18n({
  directory: path.resolve("./bot/locales"),
  defaultLanguage: "ru",
  sessionName: "session",
  useSession: true,
  allowMissing: false,
  templateData: {
    pluralize: TelegrafI18n.pluralize,
  },
});

module.exports = i18n;
