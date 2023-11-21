const { Markup } = require("telegraf");
const bot = require("../../connection/token.connection");
const Client = require("../../model/client.model");
const User = require("../../model/user.model");

const informAllClients = async (ctx, users) => {
  try {
    const processedClients = new Set();
    for (const user of users) {
      if (!processedClients.has(user.chatID)) {
        try {
          await ctx.telegram.sendMessage(
            parseInt(user.chatID),
            ctx.i18n.t("Client.validationAcceptedMsg")
          );
          processedClients.add(user.chatID);
          // console.log(`Message sent to ${operator.name}`);
        } catch (error) {
          console.error(`Error sending message to admin: ${error.message}`);
        }
      }

      // Introduce a delay (e.g., 3 seconds) before sending to the next admin
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  } catch (error) {
    console.log(error);
  }
};

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

        // Inform all clients
        const processedUsers = new Set();
        for (const client of updatedClients) {
          // Assuming that the associated user is available as 'user' in the client object
          const user = client.user;
          if (user && user.chatID) {
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

          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      } else if (numberString.length > 0) {
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
            await ctx.reply(ctx.i18n.t("Client.noClientsWithThese"));
            return;
          }

          await Client.update(
            { isConfirmed: true, status: "FINISHED" },
            { where: { status: "PENDING", id: numbers } }
          );

          await ctx.reply(ctx.i18n.t("Client.validtationFinishedMsg"));

          // Inform all clients
          const processedUsers = new Set();
          for (const client of updatedClients) {
            // Assuming that the associated user is available as 'user' in the client object
            const user = client.user;
            if (user && user.chatID) {
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

            await new Promise((resolve) => setTimeout(resolve, 5000));
          }
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
