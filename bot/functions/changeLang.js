const i18n = require("../connection/i18n.connection");

const changeLang = (lang) => {
  console.log(i18n.locale());
};

module.exports = changeLang;
