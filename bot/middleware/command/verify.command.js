const { Markup } = require("telegraf");
const bot = require("../../connection/token.connection");
const Client = require("../../model/client.model");
const User = require("../../model/user.model");

module.exports = bot.command("verify", async (ctx) => {
  try {
    const command = ctx.message.text;
    const regex = /^\/verify(?: (\d+(?:,\d+)*|all))$/;

    const match = command.match(regex);

    if (match) {
      const numberString = match[1];

      if (numberString === "all") {
        // Update all clients with status 'pending' to set isConfirmed to true
        // Fetch the updated clients with their associated users
        const updatedClients = await Client.findAll({
          where: { status: "PENDING" },
          include: [
            {
              model: User,
              as: "user",
              attributes: [
                "id",
                "chatID",
                "username",
                "firstName",
                "preferedLanguageCode",
              ],
            },
          ], // Assuming the association is named 'user'
          raw: true,
          nest: true, // Flatten the result
          joinTableAttributes: [],
        });
        // const resAll = await Client.update(
        //   { isConfirmed: true, status: "FINISHED" },
        //   { where: { status: "PENDING" } }
        // );
        const processedUsers = new Set();
        for (const client of updatedClients) {
          // Assuming that the associated user is available as 'user' in the client object
          const user = client.user;
          if (user && user.chatID) {
            console.log("started");
            // Construct the verification message
            const verificationMessage =
              user.preferedLanguageCode === "uz"
                ? "Shaxsni tasdqilash uchun yuborgan arizangiz maqullandi"
                : "Ваша заявка на проверку личности одобрена";

            if (!processedUsers.has(user.chatID)) {
              try {
                // Send the verification message to the user
                await ctx.telegram.sendMessage(
                  user.chatID,
                  verificationMessage
                );
                processedUsers.add(user.chatID);
              } catch (error) {
                console.error(
                  `Error sending verification message to user: ${error.message}`
                );
              }
            }
          }
        }
      } else {
        const numbers = numberString.split(",").map(Number);

        if (numbers.every(Number.isInteger)) {
          const updatedClients = await Client.findAll({
            where: { status: "PENDING", id: numbers },
            include: [
              {
                model: User,
                as: "user",
                attributes: [
                  "id",
                  "chatID",
                  "username",
                  "firstName",
                  "preferedLanguageCode",
                ],
              },
            ], // Assuming the association is named 'user'
            raw: true,
            nest: true, // Flatten the result
            joinTableAttributes: [],
          });
          if (updatedClients.length === 0) {
            ctx.reply(ctx.i18n.t("Client.noClientsWithThese"));
          }
          const resAll = await Client.update(
            { isConfirmed: true, status: "FINISHED" },
            { where: { status: "PENDING", id: numbers } }
          );
          ctx.reply(ctx.i18n.t("Client.validtationFinishedMsg"));
        } else {
          console.log("Invalid number format.");
        }
      }
    } else {
      console.log("No match found");
    }
  } catch (e) {
    console.log(e);
  }
});
