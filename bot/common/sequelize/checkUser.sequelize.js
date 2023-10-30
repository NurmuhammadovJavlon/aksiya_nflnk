const db = require("../../connection/db.connection");
const UserModel = require("../../model/user.model");

exports.CheckUser = async (chatID) => {
  await db.sync();

  const foundUser = await UserModel.findOne({
    where: {
      chatID,
    },
  });

  if (foundUser) return true;
  return false;
};
