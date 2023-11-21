const bot = require("../../../../connection/token.connection");
const { match } = require("telegraf-i18n");
const Client = require("../../../../model/client.model");

module.exports = bot.hears(
  match("AdminClientForm.recentUnValidatedClientsBtn"),
  async (ctx) => {
    try {
      const clients = await Client.findAll({
        where: { isConfirmed: false },
        raw: true,
      });
      console.log(clients);
      clients.forEach((client) => {
        const msg = ctx.i18n.t("AdminClientForm.queryCaption", {
          id: client.id,
          location: client.location,
          numberOfEmployees: client.numberOfEmployees,
        });
        ctx.reply(msg);
      });
    } catch (error) {
      console.log(error);
    }
  }
);
