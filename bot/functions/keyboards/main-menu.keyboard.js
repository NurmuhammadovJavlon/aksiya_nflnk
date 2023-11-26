const { CheckAdmin } = require("../../common/sequelize/user.sequelize");
const { Markup } = require("telegraf");
const Client = require("../../model/client.model");
const User = require("../../model/user.model");
const { CheckOperator } = require("../../common/sequelize/operator.sequelize");

async function generateMainMenuKeys(ctx) {
  try {
    const chatID = String(ctx.chat.id);
    const client = await Client.findOne({
      include: [
        {
          model: User,
          as: "user",
          where: { chatID },
          attributes: ["id"],
        },
      ], // Assuming the association is named 'user'
      raw: true,
      nest: true, // Flatten the result
      joinTableAttributes: [],
    });
    let MainKeboard = [
      [
        Markup.button.text(ctx.i18n.t("promotionBtn")),
        Markup.button.text(ctx.i18n.t("productsBtn")),
      ],
      [
        Markup.button.text(ctx.i18n.t("aboutCompanyBtn")),
        Markup.button.text(ctx.i18n.t("contactsBtn")),
      ],
      [
        Markup.button.text(ctx.i18n.t("settingsBtn")),
        Markup.button.text(ctx.i18n.t("complainBtn")),
      ],
    ];

    if (!client) {
      MainKeboard.push([Markup.button.text(ctx.i18n.t("validateClientBtn"))]);
    }

    const admin = await CheckAdmin(String(ctx.chat.id));
    const operator = await CheckOperator(String(ctx.chat.id));

    if (!admin && operator) {
      MainKeboard.push([
        Markup.button.text(ctx.i18n.t("OperatorPanel.operatorPanelBtn")),
      ]);
    }

    if (admin) {
      MainKeboard.push([Markup.button.text(ctx.i18n.t("adminPanelBtn"))]);
    }

    return Markup.keyboard(MainKeboard).resize();
  } catch (error) {
    console.log(error);
  }
}

module.exports = generateMainMenuKeys;
