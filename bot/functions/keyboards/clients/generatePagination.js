const { Markup } = require("telegraf");

const generatePaginatedInlineKeyboards = (
  page,
  lang,
  count,
  itemsPerPage,
  items,
  i18n,
  inital
) => {
  const endPage = Math.ceil(count / itemsPerPage);
  const keyboards = [
    ...items.map((item) => {
      const name =
        lang === "uz" ? item.name_uz : lang === "ru" ? item.name_ru : null;
      return [Markup.button.callback(name, `i_${item.id}`)];
    }),
  ];

  // Add pagination buttons
  const paginationButtons = [];
  if (page > 1) {
    paginationButtons.push(Markup.button.callback("⬅️", `prev`));
  }
  if (page < endPage) {
    paginationButtons.push(Markup.button.callback("➡️", `next`));
  }

  if (paginationButtons.length > 0) {
    keyboards.push(paginationButtons);
  }

  keyboards.push([
    Markup.button.callback(i18n.t("Client.cancelApplicationBtn"), `cancel`),
  ]);

  if (!inital) {
    keyboards.push([
      Markup.button.callback(i18n.t("Client.backOneStepMsg"), `back`),
    ]);
  }

  return Markup.inlineKeyboard(keyboards);
};

module.exports = generatePaginatedInlineKeyboards;
