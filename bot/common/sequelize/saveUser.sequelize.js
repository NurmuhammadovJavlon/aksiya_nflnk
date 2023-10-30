const db = require("../../connection/db.connection");
const UserModel = require("../../model/user.model");

exports.SaveUser = async (
  chatID,
  username,
  firstName,
  lastName,
  preferedLanguageCode
) => {
  await db.sync();

  const textAfterSaving = `User with ${chatID} saved successfully`;
  const textAfterUpdating = `User with ${chatID} updated successfully`;
  const textUserExists = `User with ${chatID} exists already`;

  const foundUser = await UserModel.findOne({
    where: {
      chatID,
    },
  });

  if (!foundUser) {
    await UserModel.create({
      chatID,
      username,
      firstName,
      lastName,
      preferedLanguageCode,
    });
    return textAfterSaving;
  }

  if (foundUser.username !== username) {
    await UserModel.update({ username }, { where: { chatID } });
    return textAfterUpdating;
  }

  return textUserExists;
};
