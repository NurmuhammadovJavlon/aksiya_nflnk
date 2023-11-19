const Client = require("../../model/client.model");
const User = require("../../model/user.model");

// POST
exports.CreateClientBeforeValid = async (
  chatID,
  location,
  numberOfEmployees
) => {
  try {
    const user = await User.findOne({
      where: {
        chatID,
      },
    });
    const client = await Client.create({
      location,
      numberOfEmployees,
      status: "PENDING",
    });
    client.setUser(user);
    return client.get({ plain: true });
  } catch (error) {
    console.log(error);
  }
};

// GET
